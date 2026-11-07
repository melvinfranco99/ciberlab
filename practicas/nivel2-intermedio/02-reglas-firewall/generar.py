#!/usr/bin/env python3
"""N2·02 — Auditar un cortafuegos (defensa).
Genera datos/reglas.txt (estilo iptables/nftables comentado) con varios fallos de configuración
que el alumno debe encontrar: reglas demasiado abiertas, orden incorrecto, puertos de gestión expuestos."""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N2·02 · Auditar las reglas de un cortafuegos", 202)
r = lab.rng
wan = lab.ip_externa()
admin = lab.ip_interna("10.0.0")

# Construimos una lista de reglas numeradas. Insertamos fallos conocidos en posiciones aleatorias.
reglas = [
    ("ACCEPT", "lo", "cualquiera", "cualquiera", "Tráfico local (loopback)", True),
    ("ACCEPT", "wan", "cualquiera", "443/tcp", "Web HTTPS pública", True),
    ("ACCEPT", "wan", "cualquiera", "80/tcp", "Web HTTP pública (redirige a HTTPS)", True),
    ("ACCEPT", "wan", "cualquiera", "ESTABLISHED,RELATED", "Respuestas a conexiones salientes", True),
]
# FALLO 1: SSH de gestión abierto a todo Internet (debería ser solo desde admin)
fallo_ssh = ("ACCEPT", "wan", "cualquiera", "22/tcp", "Acceso SSH de administración", False)
# FALLO 2: base de datos expuesta a Internet
fallo_bd = ("ACCEPT", "wan", "cualquiera", "3306/tcp", "MySQL (la usa la app web)", False)
# FALLO 3: regla ACCEPT ALL que anula todo lo que viene detrás
fallo_any = ("ACCEPT", "wan", "cualquiera", "cualquiera", "Temporal para depurar (NO QUITAR)", False)
# FALLO 4: RDP abierto
fallo_rdp = ("ACCEPT", "wan", "cualquiera", "3389/tcp", "Escritorio remoto del jefe", False)
buenas_extra = [
    ("ACCEPT", "wan", admin, "22/tcp", "SSH solo desde el PC del administrador", True),
    ("DROP", "wan", "cualquiera", "cualquiera", "Política por defecto: denegar lo demás", True),
]

cuerpo = reglas + [fallo_ssh, fallo_bd, fallo_rdp] + buenas_extra
# insertamos la regla ANY ACCEPT en un punto intermedio (antes del DROP final) -> anula el DROP
pos_any = r.randint(2, len(cuerpo) - 2)
cuerpo.insert(pos_any, fallo_any)

lineas = ["# Cortafuegos perimetral - cadena FORWARD/INPUT (se evalúa de arriba abajo; gana la PRIMERA que coincide)",
          f"# Red interna: 10.0.0.0/24   ·   PC administrador: {admin}", ""]
mapa = {}
n = 0
for accion, iface, origen, destino, coment, buena in cuerpo:
    n += 1
    mapa[n] = (accion, destino, buena, coment)
    lineas.append(f"[{n:02d}] {accion:7s} in={iface:4s} src={origen:16s} dport={destino:18s} # {coment}")
lab.escribir("reglas.txt", "\n".join(lineas) + "\n")

def numero(destino):
    return next(k for k, v in mapa.items() if v[1] == destino and not v[2])

n_any = next(k for k, v in mapa.items() if v[1] == "cualquiera" and v[0] == "ACCEPT" and not v[2])
n_ssh = numero("22/tcp")
n_bd = numero("3306/tcp")
n_rdp = numero("3389/tcp")
malas = sorted([n_any, n_ssh, n_bd, n_rdp])
n_drop = next(k for k, v in mapa.items() if v[0] == "DROP")

lab.pregunta("¿Qué número de regla es un «ACCEPT a cualquier puerto» que deja pasar TODO y anula el DROP final?", n_any,
             pista="Busca la línea con dport=cualquiera y acción ACCEPT.")
lab.pregunta("Por culpa de esa regla, ¿sirve de algo el DROP final? (si/no)", "no",
             pista="Las reglas se evalúan de arriba abajo y gana la primera que coincide: nada llega al DROP.")
lab.pregunta("¿Qué regla expone MySQL (3306) a todo Internet? (número)", n_bd,
             pista="La base de datos nunca debe estar accesible desde la WAN.")
lab.pregunta("¿Qué regla expone el escritorio remoto RDP (3389)? (número)", n_rdp)
lab.pregunta("¿Qué regla abre SSH (22) a todo Internet en lugar de solo al PC del administrador? (número)", n_ssh,
             pista="Hay dos reglas de 22/tcp: una src=cualquiera (mala) y otra src=IP del admin (buena).")
lab.pregunta("¿Cuántas reglas peligrosas hay en total (las 4 anteriores)?", len(malas))
lab.pregunta("Escribe los números de las reglas peligrosas separados por comas y de menor a mayor.", ",".join(str(x) for x in malas),
             " ".join(str(x) for x in malas), pista="Ordena de menor a mayor: " + ",".join(str(x) for x in malas))
lab.terminar()
