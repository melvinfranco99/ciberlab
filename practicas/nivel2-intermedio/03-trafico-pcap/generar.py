#!/usr/bin/env python3
"""N2·03 — Analizar tráfico de red (defensa / threat hunting).
Genera datos/conexiones.csv (al estilo de los logs de conexión de Zeek: conn.log en CSV) de una
jornada de oficina, con una baliza de malware (beaconing) y una exfiltración que el alumno debe cazar."""
import datetime as dt
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N2·03 · Cazar una baliza y una exfiltración en el tráfico", 203)
r = lab.rng
base = dt.datetime(2026, 6, r.randint(2, 25), 8, 0, 0)
internos = [lab.ip_interna() for _ in range(12)]
destinos_ok = ["140.82.112.3", "151.101.1.69", "142.250.200.14", "13.107.42.14", "104.16.132.229"]
filas = []  # (ts, orig, dest, puerto, proto, bytes_salida, bytes_entrada, duracion)


def con(t, orig, dest, port, proto, sal, ent, dur):
    filas.append((t, orig, dest, port, proto, sal, ent, round(dur, 1)))


# Tráfico normal de navegación web
for _ in range(1200):
    t = lab.hora(base, 9 * 3600)
    con(t, r.choice(internos), r.choice(destinos_ok), r.choice([443, 443, 443, 80]), "tcp",
        r.randint(200, 3000), r.randint(1000, 90000), r.uniform(0.1, 8))
# DNS normal
for _ in range(300):
    con(lab.hora(base, 9 * 3600), r.choice(internos), "10.0.0.1", 53, "udp", r.randint(40, 90), r.randint(60, 300), r.uniform(0, 0.2))

# BALIZA: un equipo infectado llama a C2 cada ~60 s, pocos bytes, muy regular
infectado = r.choice(internos)
c2 = lab.ip_externa()
t = base + dt.timedelta(minutes=r.randint(5, 40))
n_baliza = 0
while t < base + dt.timedelta(hours=9):
    jitter = r.randint(-3, 3)
    con(t, infectado, c2, 443, "tcp", r.randint(280, 340), r.randint(400, 520), r.uniform(0.2, 0.6))
    t += dt.timedelta(seconds=60 + jitter)
    n_baliza += 1

# EXFILTRACIÓN: otro equipo sube MUCHOS datos a un servicio externo en una sola conexión larga
exfil_host = r.choice([x for x in internos if x != infectado])
exfil_dest = lab.ip_externa()
while exfil_dest == c2:
    exfil_dest = lab.ip_externa()
bytes_exfil = r.randint(800_000_000, 2_000_000_000)
con(base + dt.timedelta(hours=r.randint(6, 8)), exfil_host, exfil_dest, 443, "tcp", bytes_exfil, r.randint(5000, 20000), r.uniform(600, 1800))

filas.sort()
cab = "ts,orig,dest,dport,proto,bytes_out,bytes_in,duracion"
cuerpo = "\n".join(f"{t:%Y-%m-%d %H:%M:%S},{o},{d},{p},{pr},{so},{en},{du}" for t, o, d, p, pr, so, en, du in filas)
lab.escribir("conexiones.csv", cab + "\n" + cuerpo + "\n")

lab.pregunta("¿Qué IP interna hace una baliza (beaconing): se conecta a un mismo destino externo cientos de veces, muy regular y con pocos bytes?", infectado,
             pista="Agrupa por (orig,dest) y cuenta: la pareja con cientos de conexiones de ~300 bytes es la baliza.")
lab.pregunta("¿A qué IP de mando y control (C2) llama?", c2)
lab.pregunta("¿Cada cuántos segundos, aproximadamente, repite la llamada? (número redondo)", 60,
             pista="Mira las diferencias de tiempo entre conexiones de esa pareja: ~1 minuto.")
lab.pregunta("¿Qué IP interna EXFILTRA datos (sube cientos de MB/GB en una sola conexión)?", exfil_host,
             pista="Ordena por bytes_out de mayor a menor: sort -t, -k6 -rn conexiones.csv | head")
lab.pregunta("¿A qué IP externa suben esos datos?", exfil_dest)
lab.pregunta("¿Cuántos megabytes (aprox., MB enteros) salieron en esa conexión?", round(bytes_exfil / 1_000_000),
             pista="bytes_out / 1000000. Acepta el valor redondeado a MB.")
lab.pregunta("¿Qué conducta es más sigilosa y difícil de ver a simple vista: la baliza o la exfiltración masiva?", "baliza",
             pista="La exfiltración es un pico enorme evidente; la baliza se esconde entre el ruido con pocos bytes.")
lab.terminar()
