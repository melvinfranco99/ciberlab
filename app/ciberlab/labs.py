"""Laboratorios vulnerables en Docker (siempre publicados SOLO en 127.0.0.1)."""
import shutil
import subprocess
import threading

LABS = {
    "dvwa": {
        "name": "DVWA", "image": "vulnerables/web-dvwa", "ports": [("8081", "80")], "path": "/",
        "desc": "Damn Vulnerable Web App: SQLi, XSS, CSRF, LFI, subida de ficheros, fuerza bruta, command injection. Niveles low/medium/high/impossible.",
        "login": "admin / password  (pulsa «Create / Reset Database» la primera vez)", "area": "web",
    },
    "juice-shop": {
        "name": "OWASP Juice Shop", "image": "bkimminich/juice-shop", "ports": [("8082", "3000")], "path": "/",
        "desc": "Tienda moderna (Angular + API REST) con +100 retos del OWASP Top 10. Marcador de retos en /#/score-board.",
        "login": "Regístrate o consigue entrar como admin con SQLi 😉", "area": "web",
    },
    "webgoat": {
        "name": "OWASP WebGoat + WebWolf", "image": "webgoat/webgoat", "ports": [("8083", "8080"), ("8090", "9090")],
        "path": "/WebGoat", "env": {"TZ": "Europe/Madrid"},
        "desc": "Lecciones guiadas de OWASP con teoría + ejercicio. WebWolf (puerto 8090) simula el servidor del atacante.",
        "login": "Crea un usuario en la pantalla de registro", "area": "web",
    },
    "bwapp": {
        "name": "bWAPP", "image": "raesene/bwapp", "ports": [("8084", "80")], "path": "/install.php",
        "desc": "buggy Web APP: más de 100 vulnerabilidades web (XXE, SSRF, SSI, HTML injection, Heartbleed…).",
        "login": "Instala en /install.php y entra con bee / bug", "area": "web",
    },
    "vampi": {
        "name": "VAmPI (API REST vulnerable)", "image": "erev0s/vampi", "ports": [("8085", "5000")], "path": "/",
        "env": {"vulnerable": "1"},
        "desc": "API vulnerable al OWASP API Top 10: BOLA, mass assignment, exceso de datos, falta de rate limiting. Empieza en /createdb.",
        "login": "Visita /createdb y luego /ui para la documentación Swagger", "area": "web",
    },
    "dvga": {
        "name": "DVGA (GraphQL vulnerable)", "image": "dolevf/dvga", "ports": [("8086", "5013")], "path": "/",
        "env": {"WEB_HOST": "0.0.0.0"},
        "desc": "Damn Vulnerable GraphQL Application: introspección, DoS por consultas, inyección, IDOR en GraphQL.",
        "login": "Sin login", "area": "web",
    },
    "ssh-target": {
        "name": "Servidor SSH débil", "image": "linuxserver/openssh-server", "ports": [("2222", "2222")], "path": "",
        "env": {"PASSWORD_ACCESS": "true", "USER_NAME": "soporte", "USER_PASSWORD": "verano2024", "PUID": "1000", "PGID": "1000"},
        "desc": "Servidor SSH con contraseña débil para practicar fuerza bruta (hydra) y, en paralelo, detectarla leyendo logs (Blue Team).",
        "login": "ssh soporte@127.0.0.1 -p 2222  (adivina la contraseña con hydra)", "area": "defensa",
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
    r = _docker("ps", "-a", "--filter", "label=ciberlab", "--format", "{{.Names}}\t{{.State}}\t{{.Status}}")
    if r.returncode != 0:
        return {"available": True, "daemon": False, "error": r.stderr.strip()[:300], "labs": []}
    states = {}
    for line in r.stdout.splitlines():
        n, st, txt = (line.split("\t") + ["", ""])[:3]
        states[n.replace("ciberlab-", "", 1)] = (st, txt)
    imgs = set(_docker("images", "--format", "{{.Repository}}").stdout.split())
    out = []
    for key, lab in LABS.items():
        st, txt = states.get(key, ("", ""))
        job = _jobs.get(key, "")
        out.append({
            "id": key, **{k: v for k, v in lab.items() if k != "env"},
            "url": f"http://127.0.0.1:{lab['ports'][0][0]}{lab['path']}" if lab["path"] else "",
            "state": "descargando" if job == "descargando" else (st or "detenido"),
            "status": txt, "error": job if job.startswith("error") else "",
            "downloaded": lab["image"] in imgs,
        })
    return {"available": True, "daemon": True, "labs": out}


def _run(key):
    lab = LABS[key]
    try:
        if lab["image"] not in _docker("images", "--format", "{{.Repository}}").stdout.split():
            p = _docker("pull", lab["image"], timeout=1800)
            if p.returncode != 0:
                raise RuntimeError(p.stderr.strip()[-300:])
        _docker("rm", "-f", f"ciberlab-{key}")
        args = ["run", "-d", "--name", f"ciberlab-{key}", "--label", "ciberlab=1"]
        for host, cont in lab["ports"]:
            args += ["-p", f"127.0.0.1:{host}:{cont}"]       # nunca expuesto a la red
        for k, v in lab.get("env", {}).items():
            args += ["-e", f"{k}={v}"]
        r = _docker(*args, lab["image"], timeout=120)
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
    _docker("rm", "-f", f"ciberlab-{key}")
    _jobs.pop(key, None)
    return {"ok": True}


def logs(key, lines=200):
    if key not in LABS:
        raise ValueError("Laboratorio desconocido")
    r = _docker("logs", "--tail", str(lines), f"ciberlab-{key}")
    return {"logs": (r.stdout + r.stderr)[-60000:]}
