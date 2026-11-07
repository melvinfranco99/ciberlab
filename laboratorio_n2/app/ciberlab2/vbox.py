"""Gestión de máquinas virtuales VirtualBox mediante VBoxManage."""
import os
import re
import shutil
import subprocess
from pathlib import Path

# Redes del laboratorio N2 (independientes de la vboxnet0 del N1)
#   corp    192.168.57.0/24  host-only: dominio Active Directory, puestos, SIEM   (DC fijo en .10)
#   dmz     192.168.58.0/24  host-only: servidores expuestos detrás del firewall
#   malware red interna «cl2-malware»: sin anfitrión ni Internet (REMnux + FLARE-VM)
NETS = {
    "corp": {"label": "CORP (dominio)", "ip": "192.168.57.1", "cidr": "192.168.57.0/24",
             "dhcp": ("192.168.57.2", "192.168.57.101", "192.168.57.199")},
    "dmz":  {"label": "DMZ", "ip": "192.168.58.1", "cidr": "192.168.58.0/24",
             "dhcp": ("192.168.58.2", "192.168.58.101", "192.168.58.199")},
}
MALWARE_NET = "cl2-malware"

# Perfiles de red: qué tarjeta va a qué red (nic1..nic4)
PROFILES = {
    "atacante": {"label": "Atacante: NAT + CORP + DMZ", "nics": ["nat", "corp", "dmz"]},
    "corp":     {"label": "Solo CORP (aislada)", "nics": ["corp"]},
    "dmz":      {"label": "Solo DMZ (aislada)", "nics": ["dmz"]},
    "firewall": {"label": "Firewall: WAN (NAT) + CORP + DMZ", "nics": ["nat", "corp", "dmz"]},
    "gestion":  {"label": "Servidor con Internet: NAT + CORP", "nics": ["nat", "corp"]},
    "malware":  {"label": "Análisis de malware: solo red interna", "nics": ["intnet"]},
}

PRESETS = {
    "kali":     {"label": "Kali Linux (operador red/purple team)", "ostype": "Debian_64", "ram": 4096, "cpus": 2, "disk": 60, "net": "atacante"},
    "dc01":     {"label": "Windows Server 2022 Eval — DC01 (controlador de dominio)", "ostype": "Windows2022_64", "ram": 4096, "cpus": 2, "disk": 60, "net": "corp"},
    "srv01":    {"label": "Windows Server 2022 Eval — SRV01 (ficheros / SQL / ADCS)", "ostype": "Windows2022_64", "ram": 3072, "cpus": 2, "disk": 60, "net": "corp"},
    "ws01":     {"label": "Windows 11 Enterprise Eval — WS01 (puesto)", "ostype": "Windows11_64", "ram": 4096, "cpus": 2, "disk": 64, "net": "corp"},
    "web-dmz":  {"label": "Ubuntu Server — servidor web en la DMZ", "ostype": "Ubuntu_64", "ram": 2048, "cpus": 1, "disk": 25, "net": "dmz"},
    "opnsense": {"label": "OPNsense — firewall entre WAN, CORP y DMZ", "ostype": "FreeBSD_64", "ram": 2048, "cpus": 2, "disk": 20, "net": "firewall"},
    "wazuh":    {"label": "Wazuh (SIEM/XDR)", "ostype": "Ubuntu_64", "ram": 6144, "cpus": 4, "disk": 80, "net": "gestion"},
    "seconion": {"label": "Security Onion (NSM, exigente: 12 GB RAM)", "ostype": "Oracle_64", "ram": 12288, "cpus": 4, "disk": 200, "net": "gestion"},
    "k8s":      {"label": "Ubuntu + kind/k3s (Kubernetes)", "ostype": "Ubuntu_64", "ram": 4096, "cpus": 2, "disk": 40, "net": "gestion"},
    "remnux":   {"label": "REMnux (análisis de malware Linux)", "ostype": "Ubuntu_64", "ram": 4096, "cpus": 2, "disk": 60, "net": "malware"},
    "flarevm":  {"label": "FLARE-VM sobre Windows 10 Eval (análisis de malware)", "ostype": "Windows10_64", "ram": 4096, "cpus": 2, "disk": 80, "net": "malware"},
}


class VBoxError(Exception):
    pass


def available():
    return shutil.which("VBoxManage") is not None


def vbm(*args, timeout=120):
    try:
        r = subprocess.run(["VBoxManage", *args], capture_output=True, text=True, timeout=timeout)
    except FileNotFoundError:
        raise VBoxError("VirtualBox no está instalado (sudo pacman -S virtualbox virtualbox-host-modules-arch)")
    except subprocess.TimeoutExpired:
        raise VBoxError("VBoxManage tardó demasiado: " + " ".join(args[:2]))
    if r.returncode != 0:
        msg = (r.stderr or r.stdout).strip().splitlines()
        msg = [m for m in msg if m.startswith("VBoxManage: error")] or msg
        raise VBoxError("; ".join(m.replace("VBoxManage: error: ", "") for m in msg[:3]) or "error desconocido")
    return r.stdout


def _kv(text):
    out = {}
    for line in text.splitlines():
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip().strip('"')] = v.strip().strip('"')
    return out


def machine_folder():
    try:
        for line in vbm("list", "systemproperties").splitlines():
            if line.startswith("Default machine folder:"):
                return line.split(":", 1)[1].strip()
    except VBoxError:
        pass
    return str(Path.home() / "VirtualBox VMs")


def _lease_ip(mac, iface):
    if not mac or not iface:
        return ""
    mac = ":".join(mac[i:i + 2] for i in range(0, 12, 2)).lower()
    try:
        out = vbm("dhcpserver", "findlease", f"--network=HostInterfaceNetworking-{iface}", f"--mac-address={mac}", timeout=8)
        m = re.search(r"IP Address:\s*(\S+)", out)
        return m.group(1) if m else ""
    except VBoxError:
        return ""


def list_vms():
    if not available():
        return []
    running = set(re.findall(r'\{([0-9a-f-]+)\}', vbm("list", "runningvms")))
    ifname = {v["iface"]: f"{v['iface']} · {k.upper()}" for k, v in _ifaces().items() if v.get("iface")}
    vms = []
    for name, uuid in re.findall(r'^"(.+)" \{([0-9a-f-]+)\}$', vbm("list", "vms"), re.M):
        try:
            info = _kv(vbm("showvminfo", uuid, "--machinereadable", timeout=15))
        except VBoxError:
            continue
        nics, ip = [], ""
        for i in range(1, 5):
            kind = info.get(f"nic{i}", "none")
            if kind == "none":
                continue
            label = {"nat": "NAT", "hostonly": "Host-only", "intnet": "Red interna", "bridged": "Puente",
                     "natnetwork": "Red NAT"}.get(kind, kind)
            if kind == "hostonly":
                adp = info.get(f'hostonlyadapter{i}', '')
                label += f" ({ifname.get(adp, adp)})"
                ip = ip or _lease_ip(info.get(f"macaddress{i}", ""), adp)
            elif kind == "intnet":
                label += f" ({info.get(f'intnet{i}', '')})"
            nics.append(label)
        snaps = [v for k, v in info.items() if k.startswith("SnapshotName")]
        vms.append({
            "name": name, "uuid": uuid, "ostype": info.get("ostype", ""),
            "state": info.get("VMState", "unknown"), "running": uuid in running,
            "ram": int(info.get("memory", 0) or 0), "cpus": int(info.get("cpus", 0) or 0),
            "nics": nics, "ip": ip, "snapshots": snaps,
            "current_snapshot": info.get("CurrentSnapshotName", ""),
            "isolated": bool(nics) and all(n.startswith(("Host-only", "Red interna")) for n in nics),
            "n2": any("CORP" in n or "DMZ" in n or MALWARE_NET in n for n in nics),
            "bridged": any(n.startswith("Puente") for n in nics),
        })
    return vms


def _ifaces():
    """Interfaces host-only existentes, localizadas por su IP (el nombre vboxnetN lo decide VirtualBox)."""
    out = vbm("list", "hostonlyifs")
    found = {}
    for block in out.split("\n\n"):
        n = re.search(r"^Name:\s+(\S+)", block, re.M)
        ip = re.search(r"^IPAddress:\s+(\S+)", block, re.M)
        st = re.search(r"^Status:\s+(\S+)", block, re.M)
        if n and ip:
            for k, net in NETS.items():
                if ip.group(1) == net["ip"]:
                    found[k] = {"iface": n.group(1), "up": bool(st and st.group(1) == "Up")}
    return found


def lab_network():
    if not available():
        return {"exists": False, "available": False, "nets": []}
    have = _ifaces()
    dhcps = vbm("list", "dhcpservers")
    nets = []
    for k, net in NETS.items():
        i = have.get(k, {})
        iface = i.get("iface", "")
        nets.append({"id": k, "label": net["label"], "cidr": net["cidr"], "ip": net["ip"], "iface": iface,
                     "exists": bool(iface), "up": i.get("up", False),
                     "dhcp": bool(iface) and f"HostInterfaceNetworking-{iface}" in dhcps,
                     "range": f"{net['dhcp'][1]}‑{net['dhcp'][2].split('.')[-1]}"})
    nets.append({"id": "malware", "label": "Malware (red interna)", "cidr": "10.66.66.0/24 (estática)", "ip": "—",
                 "iface": MALWARE_NET, "exists": True, "up": True, "dhcp": False, "range": "REMnux hace de DNS/HTTP falso"})
    return {"available": True, "exists": all(n["exists"] for n in nets), "nets": nets, "profiles": PROFILES}


def setup_network():
    have = _ifaces()
    for k, net in NETS.items():
        iface = have.get(k, {}).get("iface")
        if not iface:
            out = vbm("hostonlyif", "create")
            m = re.search(r"Interface '(\S+)'", out)
            if not m:
                raise VBoxError("No se pudo crear la interfaz host-only")
            iface = m.group(1)
        vbm("hostonlyif", "ipconfig", iface, "--ip", net["ip"], "--netmask", "255.255.255.0")
        name = f"HostInterfaceNetworking-{iface}"
        srv, lo, hi = net["dhcp"]
        if name in vbm("list", "dhcpservers"):
            vbm("dhcpserver", "modify", f"--network={name}", f"--server-ip={srv}", f"--lower-ip={lo}",
                f"--upper-ip={hi}", "--netmask=255.255.255.0", "--enable")
        else:
            vbm("dhcpserver", "add", f"--network={name}", f"--server-ip={srv}", f"--lower-ip={lo}",
                f"--upper-ip={hi}", "--netmask=255.255.255.0", "--enable")
    return lab_network()


def _vm_names():
    return re.findall(r'^"(.+)" \{', vbm("list", "vms"), re.M)


def _check_name(name):
    if name not in _vm_names():
        raise VBoxError(f"No existe la VM «{name}»")


def action(name, act, arg=""):
    _check_name(name)
    if act == "start":
        vbm("startvm", name, "--type", "gui")
    elif act == "headless":
        vbm("startvm", name, "--type", "headless")
    elif act == "acpi":
        vbm("controlvm", name, "acpipowerbutton")
    elif act == "poweroff":
        vbm("controlvm", name, "poweroff")
    elif act == "pause":
        vbm("controlvm", name, "pause")
    elif act == "resume":
        vbm("controlvm", name, "resume")
    elif act == "snapshot":
        snap = (arg or "").strip() or "base"
        if not re.fullmatch(r"[\w .:-]{1,60}", snap):
            raise VBoxError("Nombre de snapshot no válido")
        vbm("snapshot", name, "take", snap, "--live", timeout=600)
    elif act == "restore":
        state = _kv(vbm("showvminfo", name, "--machinereadable")).get("VMState")
        if state not in ("poweroff", "aborted", "saved"):
            raise VBoxError("Apaga la VM antes de restaurar un snapshot")
        if arg:
            vbm("snapshot", name, "restore", arg, timeout=600)
        else:
            vbm("snapshot", name, "restorecurrent", timeout=600)
    elif act == "net":
        state = _kv(vbm("showvminfo", name, "--machinereadable")).get("VMState")
        if state not in ("poweroff", "aborted"):
            raise VBoxError("Apaga la VM antes de cambiar su red")
        if arg not in PROFILES:
            raise VBoxError("Perfil de red desconocido")
        vbm("modifyvm", name, *_net_args(arg))
    else:
        raise VBoxError(f"Acción desconocida: {act}")
    return {"ok": True}


def _net_args(profile):
    if profile not in ("malware",) and not lab_network()["exists"]:
        setup_network()
    have = _ifaces()
    args = []
    nics = PROFILES.get(profile, PROFILES["corp"])["nics"]
    for i in range(1, 5):
        kind = nics[i - 1] if i <= len(nics) else "none"
        if kind in ("nat", "none"):
            args += [f"--nic{i}", kind]
        elif kind == "intnet":
            args += [f"--nic{i}", "intnet", f"--intnet{i}", MALWARE_NET]
        else:
            args += [f"--nic{i}", "hostonly", f"--hostonlyadapter{i}", have[kind]["iface"]]
    return args


def create_vm(spec):
    """spec: name, preset, iso?, disk_path?, ram?, cpus?, disk?, folder?"""
    name = (spec.get("name") or "").strip()
    if not re.fullmatch(r"[\w .-]{1,48}", name):
        raise VBoxError("Nombre no válido (letras, números, espacio, punto, guion)")
    if name in _vm_names():
        raise VBoxError("Ya existe una VM con ese nombre")
    p = dict(PRESETS.get(spec.get("preset") or "", PRESETS["web-dmz"]))
    ram = int(spec.get("ram") or p["ram"])
    cpus = int(spec.get("cpus") or p["cpus"])
    disk_gb = int(spec.get("disk") or p["disk"])
    folder = spec.get("folder") or machine_folder()
    iso = (spec.get("iso") or "").strip()
    existing = (spec.get("disk_path") or "").strip()
    for f in (iso, existing):
        if f and not Path(f).expanduser().is_file():
            raise VBoxError(f"No encuentro el archivo: {f}")
    Path(folder).mkdir(parents=True, exist_ok=True)

    vbm("createvm", "--name", name, "--ostype", p["ostype"], "--register", "--basefolder", folder)
    try:
        vbm("modifyvm", name, "--memory", str(ram), "--cpus", str(cpus), "--vram", "64",
            "--graphicscontroller", "vmsvga", "--audio-enabled", "off", "--clipboard-mode", "disabled",
            "--drag-and-drop", "disabled", "--usb-ohci", "on", *_net_args(p["net"]))
        if p["ostype"].startswith("Windows"):
            vbm("modifyvm", name, "--graphicscontroller", "vboxsvga", "--firmware", "efi")
        if p["ostype"] == "Windows11_64":
            vbm("modifyvm", name, "--tpm-type", "2.0")
        vbm("storagectl", name, "--name", "SATA", "--add", "sata", "--controller", "IntelAhci", "--portcount", "4")
        if existing:
            disk = str(Path(existing).expanduser().resolve())
        else:
            disk = str(Path(folder) / name / f"{name}.vdi")
            vbm("createmedium", "disk", "--filename", disk, "--size", str(disk_gb * 1024), "--format", "VDI",
                timeout=300)
        vbm("storageattach", name, "--storagectl", "SATA", "--port", "0", "--device", "0", "--type", "hdd",
            "--medium", disk)
        vbm("storageattach", name, "--storagectl", "SATA", "--port", "1", "--device", "0", "--type", "dvddrive",
            "--medium", str(Path(iso).expanduser().resolve()) if iso else "emptydrive")
        vbm("modifyvm", name, "--boot1", "dvd" if iso else "disk", "--boot2", "disk")
    except VBoxError:
        try:
            vbm("unregistervm", name, "--delete")
        except VBoxError:
            pass
        raise
    return {"ok": True, "name": name}


def import_appliance(path, name="", preset="corp"):
    path = str(Path(path).expanduser())
    if not Path(path).is_file():
        raise VBoxError(f"No encuentro el archivo: {path}")
    before = set(_vm_names())
    if path.endswith(".vbox"):
        vbm("registervm", path)
    elif path.endswith((".ova", ".ovf")):
        args = ["import", path]
        if name:
            args += ["--vsys", "0", "--vmname", name]
        vbm(*args, timeout=1800)
    else:
        raise VBoxError("Formatos admitidos: .ova, .ovf, .vbox (para .vmdk/.vdi usa «Crear VM» con disco existente)")
    new = [n for n in _vm_names() if n not in before]
    for n in new:
        try:
            prof = preset if preset in PROFILES else PRESETS.get(preset, PRESETS["web-dmz"])["net"]
            vbm("modifyvm", n, *_net_args(prof))
        except VBoxError:
            pass
    return {"ok": True, "imported": new}


def open_gui():
    subprocess.Popen(["setsid", "-f", "VirtualBox"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def disk_free(path):
    p = Path(path)
    while not p.exists() and p != p.parent:
        p = p.parent
    u = shutil.disk_usage(p)
    return {"path": str(path), "free_gb": round(u.free / 1e9, 1), "total_gb": round(u.total / 1e9, 1)}


def host_resources():
    mem = {}
    try:
        for line in open("/proc/meminfo"):
            k, v = line.split(":")
            mem[k] = int(v.split()[0]) // 1024
    except OSError:
        pass
    return {"cpus": os.cpu_count(), "ram_total_mb": mem.get("MemTotal", 0),
            "ram_avail_mb": mem.get("MemAvailable", 0),
            "kvm": Path("/dev/kvm").exists()}
