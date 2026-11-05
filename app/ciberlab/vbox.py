"""Gestión de máquinas virtuales VirtualBox mediante VBoxManage."""
import os
import re
import shutil
import subprocess
from pathlib import Path

LAB_IF = "vboxnet0"
LAB_IP = "192.168.56.1"
LAB_NET = "HostInterfaceNetworking-vboxnet0"

# Plantillas de VM: (ostype, RAM MB, CPUs, disco GB, red)
#   red: "atacante" = NAT (internet) + host-only (laboratorio)
#        "objetivo" = solo host-only (aislada, sin internet)
PRESETS = {
    "kali":      {"label": "Kali Linux (atacante)", "ostype": "Debian_64", "ram": 4096, "cpus": 2, "disk": 40, "net": "atacante"},
    "parrot":    {"label": "Parrot Security (atacante)", "ostype": "Debian_64", "ram": 4096, "cpus": 2, "disk": 40, "net": "atacante"},
    "ubuntu-srv": {"label": "Ubuntu Server (objetivo / blue team)", "ostype": "Ubuntu_64", "ram": 2048, "cpus": 1, "disk": 25, "net": "objetivo"},
    "debian-srv": {"label": "Debian (servidor a bastionar)", "ostype": "Debian_64", "ram": 2048, "cpus": 1, "disk": 20, "net": "objetivo"},
    "win-srv":   {"label": "Windows Server 2022 Eval (AD / DC)", "ostype": "Windows2022_64", "ram": 4096, "cpus": 2, "disk": 50, "net": "objetivo"},
    "win10":     {"label": "Windows 10 Eval (cliente de dominio)", "ostype": "Windows10_64", "ram": 4096, "cpus": 2, "disk": 50, "net": "objetivo"},
    "vulnhub":   {"label": "Máquina vulnerable (VulnHub / Metasploitable)", "ostype": "Linux_64", "ram": 1024, "cpus": 1, "disk": 10, "net": "objetivo"},
    "siem":      {"label": "SIEM (Wazuh / Security Onion)", "ostype": "Ubuntu_64", "ram": 8192, "cpus": 4, "disk": 80, "net": "atacante"},
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


def _lease_ip(mac):
    if not mac:
        return ""
    mac = ":".join(mac[i:i + 2] for i in range(0, 12, 2)).lower()
    try:
        out = vbm("dhcpserver", "findlease", f"--network={LAB_NET}", f"--mac-address={mac}", timeout=8)
        m = re.search(r"IP Address:\s*(\S+)", out)
        return m.group(1) if m else ""
    except VBoxError:
        return ""


def list_vms():
    if not available():
        return []
    running = set(re.findall(r'\{([0-9a-f-]+)\}', vbm("list", "runningvms")))
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
                label += f" ({info.get(f'hostonlyadapter{i}', '')})"
                ip = ip or _lease_ip(info.get(f"macaddress{i}", ""))
            nics.append(label)
        snaps = [v for k, v in info.items() if k.startswith("SnapshotName")]
        vms.append({
            "name": name, "uuid": uuid, "ostype": info.get("ostype", ""),
            "state": info.get("VMState", "unknown"), "running": uuid in running,
            "ram": int(info.get("memory", 0) or 0), "cpus": int(info.get("cpus", 0) or 0),
            "nics": nics, "ip": ip, "snapshots": snaps,
            "current_snapshot": info.get("CurrentSnapshotName", ""),
            "isolated": bool(nics) and all(n.startswith(("Host-only", "Red interna")) for n in nics),
            "bridged": any(n.startswith("Puente") for n in nics),
        })
    return vms


def lab_network():
    if not available():
        return {"exists": False, "available": False}
    out = vbm("list", "hostonlyifs")
    exists = re.search(rf"^Name:\s+{LAB_IF}$", out, re.M) is not None
    ip = ""
    if exists:
        block = out.split(f"Name:            {LAB_IF}")[-1]
        m = re.search(r"IPAddress:\s+(\S+)", block)
        ip = m.group(1) if m else ""
    dhcp = LAB_NET in vbm("list", "dhcpservers")
    return {"exists": exists, "available": True, "iface": LAB_IF, "ip": ip, "dhcp": dhcp,
            "cidr": "192.168.56.0/24"}


def setup_network():
    net = lab_network()
    if not net["exists"]:
        out = vbm("hostonlyif", "create")
        m = re.search(r"Interface '(\S+)'", out)
        if m and m.group(1) != LAB_IF:
            raise VBoxError(f"Se creó {m.group(1)} en lugar de {LAB_IF}; revisa VirtualBox → Herramientas → Red")
    vbm("hostonlyif", "ipconfig", LAB_IF, "--ip", LAB_IP, "--netmask", "255.255.255.0")
    if not net.get("dhcp"):
        vbm("dhcpserver", "add", f"--network={LAB_NET}", "--server-ip=192.168.56.100",
            "--lower-ip=192.168.56.101", "--upper-ip=192.168.56.254", "--netmask=255.255.255.0", "--enable")
    else:
        vbm("dhcpserver", "modify", f"--network={LAB_NET}", "--enable")
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
    elif act in ("isolate", "attacker"):
        state = _kv(vbm("showvminfo", name, "--machinereadable")).get("VMState")
        if state not in ("poweroff", "aborted"):
            raise VBoxError("Apaga la VM antes de cambiar su red")
        if not lab_network()["exists"]:
            raise VBoxError("Primero crea la red de laboratorio (botón «Crear red de laboratorio»)")
        if act == "isolate":
            vbm("modifyvm", name, "--nic1", "hostonly", "--hostonlyadapter1", LAB_IF, "--nic2", "none")
        else:
            vbm("modifyvm", name, "--nic1", "nat", "--nic2", "hostonly", "--hostonlyadapter2", LAB_IF)
    else:
        raise VBoxError(f"Acción desconocida: {act}")
    return {"ok": True}


def _net_args(kind, nic=1):
    if kind == "atacante":
        return ["--nic1", "nat", "--nic2", "hostonly", "--hostonlyadapter2", LAB_IF]
    return ["--nic1", "hostonly", "--hostonlyadapter1", LAB_IF]


def create_vm(spec):
    """spec: name, preset, iso?, disk_path?, ram?, cpus?, disk?, folder?"""
    name = (spec.get("name") or "").strip()
    if not re.fullmatch(r"[\w .-]{1,48}", name):
        raise VBoxError("Nombre no válido (letras, números, espacio, punto, guion)")
    if name in _vm_names():
        raise VBoxError("Ya existe una VM con ese nombre")
    p = dict(PRESETS.get(spec.get("preset") or "", PRESETS["vulnhub"]))
    ram = int(spec.get("ram") or p["ram"])
    cpus = int(spec.get("cpus") or p["cpus"])
    disk_gb = int(spec.get("disk") or p["disk"])
    folder = spec.get("folder") or machine_folder()
    iso = (spec.get("iso") or "").strip()
    existing = (spec.get("disk_path") or "").strip()
    for f in (iso, existing):
        if f and not Path(f).expanduser().is_file():
            raise VBoxError(f"No encuentro el archivo: {f}")
    if not lab_network()["exists"]:
        setup_network()
    Path(folder).mkdir(parents=True, exist_ok=True)

    vbm("createvm", "--name", name, "--ostype", p["ostype"], "--register", "--basefolder", folder)
    try:
        vbm("modifyvm", name, "--memory", str(ram), "--cpus", str(cpus), "--vram", "64",
            "--graphicscontroller", "vmsvga", "--audio-enabled", "off", "--clipboard-mode", "disabled",
            "--drag-and-drop", "disabled", "--usb-ohci", "on", *_net_args(p["net"]))
        if p["ostype"].startswith("Windows"):
            vbm("modifyvm", name, "--graphicscontroller", "vboxsvga", "--firmware", "efi")
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


def import_appliance(path, name="", preset="vulnhub"):
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
            if lab_network()["exists"]:
                vbm("modifyvm", n, *_net_args(PRESETS.get(preset, PRESETS["vulnhub"])["net"]))
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
