"""Laboratorios Docker del N2 (siempre publicados SOLO en 127.0.0.1)."""
import shutil
import subprocess
import threading

LABS = {
    "splunk": {
        "name": "Splunk Enterprise (SIEM)", "image": "splunk/splunk:latest", "ports": [("8100", "8000")], "path": "/",
        "env": {"SPLUNK_START_ARGS": "--accept-license", "SPLUNK_GENERAL_TERMS": "--accept-sgt-current-at-splunk-com",
                "SPLUNK_PASSWORD": "CiberLab2-Splunk!"},
        "desc": "SIEM líder del mercado. Ingiere los logs de las prácticas (EVTX, Sysmon, CloudTrail) y caza con SPL. Licencia de prueba de 60 días; después pasa a Splunk Free.",
        "login": "admin / CiberLab2-Splunk!   (tarda 2‑3 min en arrancar; necesita ~4 GB de RAM)", "area": "dfir",
    },
    "moto": {
        "name": "Moto (AWS simulado)", "image": "motoserver/moto:latest", "ports": [("8101", "5000")], "path": "/moto-api/",
        "desc": "Emula la API de AWS (S3, IAM, EC2, Lambda, CloudTrail…) en local y sin coste. Practica IAM de mínimo privilegio, políticas de buckets y auditoría con la AWS CLI.",
        "login": "aws --endpoint-url http://127.0.0.1:8101 s3 ls   (credenciales falsas: AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test)", "area": "cloud",
    },
    "wrongsecrets": {
        "name": "OWASP WrongSecrets", "image": "jeroenwillemsen/wrongsecrets:latest-no-vault", "ports": [("8104", "8080")], "path": "/",
        "desc": "Retos sobre cómo NO gestionar secretos: claves en el código, en imágenes Docker, en variables de entorno, en Git. Aprende dónde se filtran y cómo protegerlos.",
        "login": "Sin login. Usa gitleaks/trivy contra la imagen para encontrar lo que esconde", "area": "appsec",
    },
    "cyberchef": {
        "name": "CyberChef", "image": "mpepping/cyberchef:latest", "ports": [("8105", "8000")], "path": "/",
        "desc": "La «navaja suiza» del analista (GCHQ): decodificar Base64/XOR, extraer IoC, analizar cabeceras, descomprimir. Imprescindible en DFIR y malware.",
        "login": "Sin login (funciona sin Internet)", "area": "malware",
    },
    "mobsf": {
        "name": "MobSF (análisis de apps móviles)", "image": "opensecurity/mobile-security-framework-mobsf:latest",
        "ports": [("8106", "8000")], "path": "/",
        "desc": "Análisis estático de APK/IPA: permisos, secretos incrustados, configuración de red, librerías vulnerables. Sube apps de prueba (p. ej. InsecureBankv2, DIVA).",
        "login": "mobsf / mobsf", "area": "appsec",
    },
    "jenkins": {
        "name": "Jenkins (seguridad de CI/CD)", "image": "jenkins/jenkins:lts", "ports": [("8107", "8080")], "path": "/",
        "desc": "Servidor de integración continua para practicar el bastionado de la cadena de suministro: credenciales, agentes, permisos y pipelines con SAST/SCA.",
        "login": "Contraseña inicial: botón Logs (busca «initialAdminPassword»)", "area": "cloud",
    },
    "gitea": {
        "name": "Gitea (Git privado)", "image": "gitea/gitea:latest", "ports": [("8108", "3000")], "path": "/",
        "env": {"GITEA__security__INSTALL_LOCK": "false"},
        "desc": "Tu propio GitHub local para practicar DevSecOps: ramas protegidas, revisión de código, hooks con gitleaks y semgrep, firma de commits.",
        "login": "Completa el asistente y crea el primer usuario (será administrador)", "area": "appsec",
    },
    "zap": {
        "name": "OWASP ZAP (DAST en el navegador)", "image": "ghcr.io/zaproxy/zaproxy:stable", "ports": [("8109", "8080")],
        "path": "/zap/", "cmd": ["zap-webswing.sh"],
        "desc": "Escáner de aplicaciones web con interfaz web (Webswing). Úsalo contra los labs del N1 o WrongSecrets y aprende a automatizarlo en un pipeline.",
        "login": "Sin login. Objetivos dentro de la red ciberlab2: http://ciberlab2-wrongsecrets:8080, http://ciberlab2-gitea:3000…", "area": "appsec",
    },
}

_jobs = {}   # lab -> "descargando" | "error: ..."
_lock = threading.Lock()


def available():
    return shutil.which("docker") is not None


def _docker(*args, timeout=30):
    return subprocess.run(["docker", *args], capture_output=True, text=True, timeout=timeout)


def status():
    if not available():
        return {"available": False, "labs": []}
    r = _docker("ps", "-a", "--filter", "label=ciberlab2", "--format", "{{.Names}}\t{{.State}}\t{{.Status}}")
    if r.returncode != 0:
        return {"available": True, "daemon": False, "error": r.stderr.strip()[:300], "labs": []}
    states = {}
    for line in r.stdout.splitlines():
        n, st, txt = (line.split("\t") + ["", ""])[:3]
        states[n.replace("ciberlab2-", "", 1)] = (st, txt)
    imgs = set(_docker("images", "--format", "{{.Repository}}:{{.Tag}}").stdout.split())
    out = []
    for key, lab in LABS.items():
        st, txt = states.get(key, ("", ""))
        job = _jobs.get(key, "")
        out.append({
            "id": key, **{k: v for k, v in lab.items() if k not in ("env", "extra", "cmd")},
            "url": f"http://127.0.0.1:{lab['ports'][0][0]}{lab['path']}" if lab["path"] else "",
            "state": "descargando" if job == "descargando" else (st or "detenido"),
            "status": txt, "error": job if job.startswith("error") else "",
            "downloaded": lab["image"] in imgs,
        })
    return {"available": True, "daemon": True, "labs": out}


def _run(key):
    lab = LABS[key]
    try:
        if lab["image"] not in _docker("images", "--format", "{{.Repository}}:{{.Tag}}").stdout.split():
            p = _docker("pull", lab["image"], timeout=1800)
            if p.returncode != 0:
                raise RuntimeError(p.stderr.strip()[-300:])
        _docker("rm", "-f", f"ciberlab2-{key}")
        if _docker("network", "inspect", "ciberlab2").returncode != 0:
            _docker("network", "create", "--label", "ciberlab2=1", "ciberlab2")
        # red propia: los labs del N2 se ven entre sí por nombre (ZAP → ciberlab2-wrongsecrets)
        args = ["run", "-d", "--name", f"ciberlab2-{key}", "--label", "ciberlab2=1", "--network", "ciberlab2"]
        for host, cont in lab["ports"]:
            args += ["-p", f"127.0.0.1:{host}:{cont}"]       # nunca expuesto a la red
        for k, v in lab.get("env", {}).items():
            args += ["-e", f"{k}={v}"]
        args += lab.get("extra", [])
        r = _docker(*args, lab["image"], *lab.get("cmd", []), timeout=120)
        if r.returncode != 0:
            raise RuntimeError(r.stderr.strip()[-300:])
        with _lock:
            _jobs.pop(key, None)
    except Exception as e:  # noqa: BLE001
        with _lock:
            _jobs[key] = f"error: {e}"


def start(key):
    if key not in LABS:
        raise ValueError("Laboratorio desconocido")
    with _lock:
        if _jobs.get(key) == "descargando":
            return {"ok": True}
        _jobs[key] = "descargando"
    threading.Thread(target=_run, args=(key,), daemon=True).start()
    return {"ok": True}


def stop(key):
    if key not in LABS:
        raise ValueError("Laboratorio desconocido")
    _docker("rm", "-f", f"ciberlab2-{key}")
    _jobs.pop(key, None)
    return {"ok": True}


def logs(key, lines=200):
    if key not in LABS:
        raise ValueError("Laboratorio desconocido")
    r = _docker("logs", "--tail", str(lines), f"ciberlab2-{key}")
    return {"logs": (r.stdout + r.stderr)[-60000:]}
