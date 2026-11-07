#!/usr/bin/env python3
"""N1·02 — Detectar un ataque de fuerza bruta en auth.log.
Genera datos/auth.log con tráfico normal, ruido de bots y un ataque que acaba con éxito."""
import datetime as dt
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N1·02 · Detectar fuerza bruta contra SSH", 102)
r = lab.rng
dia = dt.datetime(2026, 3, r.randint(2, 27), 0, 0, 0)
host = "web01"
eventos = []  # (fecha, texto)


def linea(t, txt):
    eventos.append((t, f"{t:%b %d %H:%M:%S} {host} sshd[{r.randint(1000, 65000)}]: {txt}"))


legitimos = {"ana": lab.ip_interna(), "bruno": lab.ip_interna(), "carla": lab.ip_interna()}
for _ in range(40):  # accesos normales con clave
    u = r.choice(list(legitimos))
    t = lab.hora(dia + dt.timedelta(hours=7), 12 * 3600)
    linea(t, f"Accepted publickey for {u} from {legitimos[u]} port {r.randint(40000, 60000)} ssh2: ED25519 SHA256:x")
for _ in range(r.randint(6, 12)):  # un usuario se equivoca a veces
    u = r.choice(list(legitimos))
    linea(lab.hora(dia + dt.timedelta(hours=8), 9 * 3600), f"Failed password for {u} from {legitimos[u]} port {r.randint(40000, 60000)} ssh2")

ruido = [lab.ip_externa() for _ in range(5)]  # bots de Internet: pocos intentos cada uno
for ip in ruido:
    for _ in range(r.randint(2, 6)):
        u = r.choice(["admin", "test", "oracle", "ubuntu", "pi"])
        linea(lab.hora(dia, 23 * 3600), f"Invalid user {u} from {ip} port {r.randint(30000, 60000)}")

atacante = lab.ip_externa()
while atacante in ruido:
    atacante = lab.ip_externa()
victima = r.choice(["deploy", "backup", "soporte"])
inicio = dia + dt.timedelta(hours=r.randint(1, 4), minutes=r.randint(0, 59))
n_fallos = r.randint(140, 260)
t = inicio
for i in range(n_fallos):
    t += dt.timedelta(seconds=r.randint(1, 3))
    if i % 4 == 0:
        linea(t, f"Invalid user {r.choice(['admin', 'root1', 'user', 'test'])} from {atacante} port {r.randint(30000, 60000)}")
    else:
        linea(t, f"Failed password for {victima} from {atacante} port {r.randint(30000, 60000)} ssh2")
t += dt.timedelta(seconds=2)
exito = t
linea(t, f"Accepted password for {victima} from {atacante} port {r.randint(30000, 60000)} ssh2")
linea(t + dt.timedelta(seconds=1), f"pam_unix(sshd:session): session opened for user {victima}(uid=1005) by (uid=0)")
eventos.append((t + dt.timedelta(minutes=3), f"{t + dt.timedelta(minutes=3):%b %d %H:%M:%S} {host} sudo:   {victima} : TTY=pts/0 ; PWD=/home/{victima} ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow"))

eventos.sort()
lab.escribir("auth.log", "\n".join(e[1] for e in eventos) + "\n")
fallos_atacante = sum(1 for _, e in eventos if atacante in e and ("Failed" in e or "Invalid" in e))

lab.pregunta("¿Qué IP lanzó el ataque de fuerza bruta (la que más intentos fallidos tiene)?", atacante,
             pista="grep -E 'Failed|Invalid' auth.log | grep -oE '[0-9]+(\\.[0-9]+){3}' | sort | uniq -c | sort -rn | head")
lab.pregunta("¿Cuántos intentos fallidos (Failed + Invalid) hizo esa IP?", fallos_atacante,
             pista="grep -E 'Failed|Invalid' auth.log | grep -c IP_ATACANTE")
lab.pregunta("¿Con qué usuario consiguió entrar?", victima, pista="grep 'Accepted password' auth.log | grep IP_ATACANTE")
lab.pregunta("¿A qué hora exacta entró? (HH:MM:SS)", f"{exito:%H:%M:%S}", pista="La hora es la tercera columna de la línea «Accepted password».")
lab.pregunta("¿Qué fichero leyó con sudo nada más entrar? (ruta completa)", "/etc/shadow", pista="grep sudo auth.log")
lab.pregunta("¿El resto de IPs externas son un ataque dirigido o ruido de bots? (dirigido/ruido)", "ruido", "bots",
             pista="Pocos intentos, usuarios genéricos (admin, test, pi) y sin éxito: es el ruido de fondo de Internet.")
lab.terminar()
