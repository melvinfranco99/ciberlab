"""Laboratorios Docker del N3 (siempre publicados SOLO en 127.0.0.1)."""
import shutil
import subprocess
import threading

LABS = {
    "juiceshop": {
        "name": "OWASP Juice Shop", "image": "bkimminich/juice-shop:latest", "ports": [("8220", "3000")], "path": "/",
        "desc": "La aplicación web vulnerable moderna de referencia (SPA + API REST). Reúne todo el OWASP Top 10 en retos con puntuación. Objetivo ideal para la explotación web avanzada del N3: SSRF, inyección, JWT, lógica de negocio.",
        "login": "Sin login para empezar; crea cuentas de prueba. Panel de retos en /#/score-board", "area": "webexp",
    },
    "dvwa": {
        "name": "DVWA (Damn Vulnerable Web App)", "image": "vulnerables/web-dvwa:latest", "ports": [("8221", "80")], "path": "/",
        "desc": "Clásico banco de pruebas con niveles de seguridad (low/medium/high). Perfecto para practicar y comparar la misma técnica con y sin mitigaciones, y para afinar Burp/ffuf/sqlmap en el laboratorio.",
        "login": "admin / password  (pulsa «Create / Reset Database» la primera vez)", "area": "webexp",
    },
    "webgoat": {
        "name": "OWASP WebGoat", "image": "webgoat/webgoat:latest", "ports": [("8222", "8080")], "path": "/WebGoat",
        "desc": "Entrenamiento guiado de seguridad web lección por lección (deserialización, SSRF, JWT, path traversal). Explica el porqué de cada fallo mientras lo explotas.",
        "login": "Regístrate con un usuario de prueba en /WebGoat", "area": "webexp",
    },
    "vampi": {
        "name": "VAmPI (API REST vulnerable)", "image": "erev0s/vampi:latest", "ports": [("8223", "5000")], "path": "/",
        "desc": "API deliberadamente insegura para practicar el OWASP API Security Top 10: BOLA/IDOR, autenticación rota, exceso de datos. Ideal para fuzzing de API con ffuf y pruebas con Burp.",
        "login": "Sin login; crea tokens con sus endpoints. Arranca en modo vulnerable por defecto", "area": "webexp",
    },
    "cyberchef": {
        "name": "CyberChef", "image": "mpepping/cyberchef:latest", "ports": [("8224", "8000")], "path": "/",
        "desc": "La «navaja suiza» para codificar y decodificar: Base64, XOR, hex, JWT, URL. Imprescindible para preparar payloads de laboratorio y descifrar lo que encuentres en recon y post-explotación.",
        "login": "Sin login (funciona sin Internet)", "area": "recon",
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
    r = _docker("ps", "-a", "--filter", "label=ciberlab3", "--format", "{{.Names}}\t{{.State}}\t{{.Status}}")
    if r.returncode != 0:
        return {"available": True, "daemon": False, "error": r.stderr.strip()[:300], "labs": []}
    states = {}
    for line in r.stdout.splitlines():
        n, st, txt = (line.split("\t") + ["", ""])[:3]
        states[n.replace("ciberlab3-", "", 1)] = (st, txt)
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
        _docker("rm", "-f", f"ciberlab3-{key}")
        if _docker("network", "inspect", "ciberlab3").returncode != 0:
            _docker("network", "create", "--label", "ciberlab3=1", "ciberlab3")
        # red propia: los labs del N3 se ven entre sí por nombre (ZAP → ciberlab3-wrongsecrets)
        args = ["run", "-d", "--name", f"ciberlab3-{key}", "--label", "ciberlab3=1", "--network", "ciberlab3"]
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
    _docker("rm", "-f", f"ciberlab3-{key}")
    _jobs.pop(key, None)
    return {"ok": True}


def logs(key, lines=200):
    if key not in LABS:
        raise ValueError("Laboratorio desconocido")
    r = _docker("logs", "--tail", str(lines), f"ciberlab3-{key}")
    return {"logs": (r.stdout + r.stderr)[-60000:]}
