"""Servidor local de CiberLab N3 (solo 127.0.0.1, sin dependencias externas).

Defensas aplicadas (y explicadas en la lección «Seguridad de servicios locales»):
  * Escucha únicamente en 127.0.0.1.
  * Cabecera Host validada  → bloquea DNS rebinding.
  * Token aleatorio por arranque exigido en toda petición /api que cambia estado
    → bloquea CSRF desde cualquier web que visites.
  * Origin validado en POST y Content-Type JSON obligatorio.
  * Cabeceras CSP / nosniff / frame-ancestors.
"""
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from . import DATA, PORT, STATIC, WORKSPACE, labs, vbox

TOKEN = secrets.token_urlsafe(24)
ALLOWED_HOSTS = {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}
MIME = {".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
        ".json": "application/json", ".woff2": "font/woff2", ".ico": "image/x-icon"}

PROGRESS = DATA / "progress.json"
AUDITS = WORKSPACE / "auditorias"


# ------------------------------------------------------------------ almacenamiento
def _load(path, default):
    try:
        return json.loads(Path(path).read_text())
    except (OSError, ValueError):
        return default


def _save(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=1))
    os.replace(tmp, path)


def ensure_workspace():
    for d in ("auditorias", "notas", "loot", "wordlists", "isos", "informes", "scripts", "forense", "detecciones", "muestras"):
        (WORKSPACE / d).mkdir(parents=True, exist_ok=True)
    readme = WORKSPACE / "LEEME.txt"
    if not readme.exists():
        readme.write_text(
            "CiberLab N3 — carpeta de trabajo (nivel avanzado)\n"
            "  auditorias/  datos de cada auditoría (JSON) creados desde la app\n"
            "  informes/    informes exportados\n"
            "  notas/       tus apuntes\n"
            "  loot/        resultados de escaneos y evidencias del LABORATORIO\n"
            "  wordlists/   diccionarios (rockyou, SecLists…)\n"
            "  isos/        imágenes ISO/OVA de las VMs\n"
            "  scripts/     tus scripts\n"
            "  forense/     imágenes de memoria/disco y líneas temporales\n"
            "  detecciones/ tus reglas Sigma, YARA y consultas SPL/KQL\n"
            "  muestras/    muestras de malware: SOLO comprimidas con contraseña «infected», nunca se ejecutan aquí\n\n"
            "Recuerda: solo se ataca lo que es tuyo o aquello para lo que tienes autorización ESCRITA.\n")


def vpn_iface():
    try:
        out = subprocess.run(["ip", "route", "get", "1.1.1.1"], capture_output=True, text=True, timeout=3).stdout
        m = re.search(r"dev (\S+)", out)
        dev = m.group(1) if m else ""
        return dev if re.match(r"^(proton|tun|wg|pvpn)", dev) and not dev.startswith("pvpnksintrf") else ""
    except Exception:  # noqa: BLE001
        return ""


def local_ips():
    try:
        out = subprocess.run(["ip", "-4", "-o", "addr"], capture_output=True, text=True, timeout=3).stdout
        return [{"iface": m.group(1), "ip": m.group(2)}
                for m in re.finditer(r"^\d+:\s+(\S+)\s+inet (\S+)", out, re.M) if m.group(1) != "lo"]
    except Exception:  # noqa: BLE001
        return []


TOOLS = ["nmap", "masscan", "rustscan", "subfinder", "amass", "httpx", "theHarvester", "ffuf", "feroxbuster",
         "nuclei", "sqlmap", "burpsuite", "zaproxy", "hydra", "hashcat", "john", "crackmapexec", "netexec",
         "bloodhound-python", "bloodhound", "certipy", "impacket-GetUserSPNs", "evil-winrm", "responder",
         "ldapsearch", "metasploit", "msfconsole", "sliver-server", "proxychains", "chisel", "enum4linux-ng",
         "wireshark", "tcpdump", "python3", "jq", "docker", "VBoxManage", "openssl", "age", "gpg"]


def tools():
    return {t: shutil.which(t) is not None for t in TOOLS}


def launch(what, arg=""):
    env = dict(os.environ)
    if what == "terminal":
        term = next((t for t in ("alacritty", "kitty", "xfce4-terminal", "xterm") if shutil.which(t)), None)
        if not term:
            raise ValueError("No hay terminal instalada")
        args = {"alacritty": ["alacritty", "--class", "CiberLab3Term,CiberLab3Term", "-T", "CiberLab N3",
                              "--working-directory", str(WORKSPACE)],
                "kitty": ["kitty", "--class", "CiberLab3Term", "-d", str(WORKSPACE)]}.get(term, [term])
        subprocess.Popen(["setsid", "-f", *args], cwd=WORKSPACE, env=env,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    elif what == "folder":
        sub = arg if arg in ("auditorias", "informes", "notas", "loot", "isos", "wordlists", "scripts") else ""
        subprocess.Popen(["setsid", "-f", "xdg-open", str(WORKSPACE / sub)],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    elif what == "vbox":
        vbox.open_gui()
    elif what == "wireshark" and shutil.which("wireshark"):
        subprocess.Popen(["setsid", "-f", "wireshark"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        raise ValueError("No se puede abrir eso")
    return {"ok": True}


# ------------------------------------------------------------------ auditorías
def _audit_path(aid):
    if not re.fullmatch(r"[0-9a-f]{12}", aid or ""):
        raise ValueError("id no válido")
    return AUDITS / f"{aid}.json"


def list_audits():
    out = []
    for f in sorted(AUDITS.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        a = _load(f, {})
        out.append({k: a.get(k) for k in ("id", "cliente", "tipo", "estado", "inicio", "fin", "updated")}
                   | {"hallazgos": len(a.get("hallazgos", []))})
    return out


def save_audit(a):
    if not isinstance(a, dict):
        raise ValueError("formato no válido")
    a["id"] = a.get("id") or uuid.uuid4().hex[:12]
    a["updated"] = time.strftime("%Y-%m-%d %H:%M")
    _save(_audit_path(a["id"]), a)
    return {"ok": True, "id": a["id"], "updated": a["updated"]}


# ------------------------------------------------------------------ HTTP
class Handler(BaseHTTPRequestHandler):
    server_version = "CiberLab3"
    sys_version = ""

    def log_message(self, fmt, *args):
        if os.environ.get("CIBERLAB_DEBUG"):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    # -- utilidades
    def _headers(self, code, ctype, length):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(length))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy",
                         "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
                         "script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; "
                         "form-action 'none'")
        self.end_headers()

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self._headers(code, "application/json; charset=utf-8", len(body))
        self.wfile.write(body)

    def _err(self, msg, code=400):
        self._json({"ok": False, "error": str(msg)}, code)

    def _host_ok(self):
        return self.headers.get("Host", "") in ALLOWED_HOSTS

    def _token_ok(self):
        return secrets.compare_digest(self.headers.get("X-CiberLab-Token", ""), TOKEN)

    def _body(self):
        if not self.headers.get("Content-Type", "").startswith("application/json"):
            raise ValueError("Content-Type debe ser application/json")
        n = int(self.headers.get("Content-Length") or 0)
        if n > 5_000_000:
            raise ValueError("cuerpo demasiado grande")
        return json.loads(self.rfile.read(n) or b"{}")

    # -- GET
    def do_GET(self):
        if not self._host_ok():
            return self._err("Host no permitido", 403)
        url = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        path = url.path
        if path == "/api/health":
            return self._json({"ok": True, "app": "ciberlab3"})
        if path.startswith("/api/"):
            if not self._token_ok():
                return self._err("token no válido", 403)
            try:
                return self._json(self.api_get(path, q))
            except (vbox.VBoxError, ValueError) as e:
                return self._err(e)
            except Exception as e:  # noqa: BLE001
                return self._err(f"error interno: {e}", 500)
        return self.static(path)

    def api_get(self, path, q):
        if path == "/api/state":
            return _load(PROGRESS, {"done": {}, "notes": {}, "quiz": {}})
        if path == "/api/sys":
            folder = vbox.machine_folder() if vbox.available() else str(Path.home())
            return {"host": vbox.host_resources(), "disk": vbox.disk_free(folder),
                    "vbox": vbox.available(), "docker": labs.available(), "vpn": vpn_iface(),
                    "ips": local_ips(), "tools": tools(), "workspace": str(WORKSPACE),
                    "machine_folder": folder}
        if path == "/api/vms":
            return {"vms": vbox.list_vms(), "net": vbox.lab_network(), "presets": vbox.PRESETS}
        if path == "/api/labs":
            return labs.status()
        if path == "/api/labs/logs":
            return labs.logs(q.get("id", ""))
        if path == "/api/audits":
            return {"audits": list_audits(), "folder": str(AUDITS)}
        if path == "/api/audit":
            p = _audit_path(q.get("id", ""))
            if not p.exists():
                raise ValueError("No existe")
            return _load(p, {})
        raise ValueError("ruta desconocida")

    # -- POST
    def do_POST(self):
        if not self._host_ok():
            return self._err("Host no permitido", 403)
        origin = self.headers.get("Origin")
        if origin and urlparse(origin).netloc not in ALLOWED_HOSTS:
            return self._err("Origen no permitido", 403)
        if not self._token_ok():
            return self._err("token no válido", 403)
        try:
            body = self._body()
            return self._json(self.api_post(urlparse(self.path).path, body))
        except (vbox.VBoxError, ValueError) as e:
            return self._err(e)
        except Exception as e:  # noqa: BLE001
            return self._err(f"error interno: {e}", 500)

    def api_post(self, path, b):
        if path == "/api/progress":
            st = _load(PROGRESS, {"done": {}, "notes": {}, "quiz": {}})
            lid = str(b.get("id", ""))[:80]
            if b.get("done"):
                st["done"][lid] = time.strftime("%Y-%m-%d")
            else:
                st["done"].pop(lid, None)
            _save(PROGRESS, st)
            return {"ok": True, "done": st["done"]}
        if path == "/api/note":
            st = _load(PROGRESS, {"done": {}, "notes": {}, "quiz": {}})
            lid = str(b.get("id", ""))[:80]
            txt = str(b.get("text", ""))[:20000]
            if txt.strip():
                st["notes"][lid] = txt
            else:
                st["notes"].pop(lid, None)
            _save(PROGRESS, st)
            return {"ok": True}
        if path == "/api/net/setup":
            return vbox.setup_network()
        if path == "/api/vm/action":
            return vbox.action(str(b.get("name", "")), str(b.get("act", "")), str(b.get("arg", "")))
        if path == "/api/vm/create":
            return vbox.create_vm(b)
        if path == "/api/vm/import":
            return vbox.import_appliance(str(b.get("path", "")), str(b.get("name", "")), str(b.get("preset", "")))
        if path == "/api/labs/start":
            return labs.start(str(b.get("id", "")))
        if path == "/api/labs/stop":
            return labs.stop(str(b.get("id", "")))
        if path == "/api/audit":
            return save_audit(b)
        if path == "/api/audit/delete":
            p = _audit_path(str(b.get("id", "")))
            if p.exists():
                trash = AUDITS / ".papelera"
                trash.mkdir(exist_ok=True)
                p.rename(trash / p.name)          # nunca se borra: va a la papelera
            return {"ok": True}
        if path == "/api/open":
            return launch(str(b.get("what", "")), str(b.get("arg", "")))
        raise ValueError("ruta desconocida")

    # -- estáticos
    def static(self, path):
        if path in ("/", ""):
            path = "/index.html"
        f = (STATIC / path.lstrip("/")).resolve()
        if STATIC not in f.parents or not f.is_file():
            return self._err("no encontrado", 404)
        data = f.read_bytes()
        if f.name == "index.html":
            data = data.replace(b"__CIBERLAB_TOKEN__", TOKEN.encode())
        self._headers(200, MIME.get(f.suffix, "application/octet-stream"), len(data))
        self.wfile.write(data)


def main():
    ensure_workspace()
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    srv.daemon_threads = True
    print(f"CiberLab N3 escuchando en http://127.0.0.1:{PORT}", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
