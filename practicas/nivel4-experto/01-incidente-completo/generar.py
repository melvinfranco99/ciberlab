#!/usr/bin/env python3
"""N4·01 — Investigación de incidente de principio a fin (DFIR).
Correlaciona varias fuentes: proxy web, EDR (procesos), autenticación y conexiones de red,
todo con el MISMO reloj. El alumno reconstruye la línea temporal y la mapea a MITRE ATT&CK."""
import datetime as dt
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N4·01 · Investigación de incidente de principio a fin", 401)
r = lab.rng
D = dt.datetime(2026, 9, r.randint(2, 20), 0, 0, 0)
host = "WIN-RRHH-12"
user = "paula.marin"
c2 = lab.ip_externa()
dominio_malo = r.choice(["actualizaciones-seguras.net", "cdn-sync-cloud.com", "office-update365.net"])

# Hora de entrada (minuto a minuto). Guardamos eventos con origen.
proxy, edr, auth, net = [], [], [], []
t0 = D + dt.timedelta(hours=9, minutes=r.randint(10, 50))

# 1) Proxy: el usuario recibe un correo y descarga un adjunto desde el dominio malicioso
proxy.append((t0, f'{t0:%H:%M:%S} {user} GET http://{dominio_malo}/factura_09.zip 200 482311 "Mozilla/5.0"'))
# 2) EDR: descomprime y ejecuta un .js que lanza wscript -> powershell
t1 = t0 + dt.timedelta(minutes=2)
edr.append((t1, f'{t1:%H:%M:%S} {host} proc_start explorer.exe -> C:\\Users\\{user}\\Downloads\\factura_09.js'))
edr.append((t1 + dt.timedelta(seconds=3), f'{t1 + dt.timedelta(seconds=3):%H:%M:%S} {host} proc_start wscript.exe factura_09.js'))
edr.append((t1 + dt.timedelta(seconds=6), f'{t1 + dt.timedelta(seconds=6):%H:%M:%S} {host} proc_start powershell.exe -nop -w hidden -enc <b64> (parent=wscript.exe)'))
# 3) Net: la powershell llama al C2
t2 = t1 + dt.timedelta(seconds=10)
net.append((t2, f'{t2:%H:%M:%S} {host}:50122 -> {c2}:443 tcp established (proc=powershell.exe)'))
# 4) Persistencia: tarea programada
t3 = t2 + dt.timedelta(minutes=4)
edr.append((t3, f'{t3:%H:%M:%S} {host} proc_start schtasks.exe /create /tn "OfficeSync" /tr powershell... /sc minute /mo 30'))
# 5) Descubrimiento
for cmd in ["whoami /groups", "net group \"Domain Admins\" /domain", "nltest /dclist:acme"]:
    t3 += dt.timedelta(seconds=r.randint(20, 90))
    edr.append((t3, f'{t3:%H:%M:%S} {host} proc_start cmd.exe /c {cmd}'))
# 6) Robo de credenciales -> auth: el usuario empieza a autenticarse contra muchos equipos (4624 type3)
t4 = t3 + dt.timedelta(minutes=5)
objetivos = ["SRV-FICHEROS", "SRV-SQL", "PC-DIR-01", "SRV-BACKUP"]
for o in objetivos:
    t4 += dt.timedelta(seconds=r.randint(30, 120))
    auth.append((t4, f'{t4:%H:%M:%S} 4624 {o} ACME\\adm.sql LogonType=3 src={host}'))
# 7) Exfiltración antes del cifrado
t5 = t4 + dt.timedelta(minutes=10)
net.append((t5, f'{t5:%H:%M:%S} SRV-FICHEROS:51001 -> {c2}:443 tcp bytes_out=1340211200 (proc=rclone.exe)'))
# 8) Impacto: borrado de copias y despliegue de ransomware
t6 = t5 + dt.timedelta(minutes=8)
edr.append((t6, f'{t6:%H:%M:%S} SRV-BACKUP proc_start vssadmin.exe delete shadows /all /quiet'))
edr.append((t6 + dt.timedelta(minutes=2), f'{t6 + dt.timedelta(minutes=2):%H:%M:%S} multiple proc_start C:\\Windows\\Temp\\lock.exe (ransomware)'))

# Ruido normal para cada fuente
for _ in range(40):
    tt = lab.hora(D + dt.timedelta(hours=8), 9 * 3600)
    proxy.append((tt, f'{tt:%H:%M:%S} {r.choice(["luis.vega", "sara.diaz", user])} GET https://www.google.com/ 200 {r.randint(1000, 50000)} "Mozilla/5.0"'))
for _ in range(30):
    tt = lab.hora(D + dt.timedelta(hours=8), 9 * 3600)
    auth.append((tt, f'{tt:%H:%M:%S} 4624 {r.choice(objetivos)} ACME\\{r.choice(["luis.vega","sara.diaz"])} LogonType=3 src=10.0.0.{r.randint(20,99)}'))

for nombre, datos, cab in [("proxy.log", proxy, "# PROXY WEB (hora usuario)"),
                            ("edr_procesos.log", edr, "# EDR - creación de procesos"),
                            ("autenticacion.log", auth, "# AUTENTICACIÓN (EventID 4624)"),
                            ("red.log", net, "# CONEXIONES DE RED")]:
    datos.sort()
    lab.escribir(nombre, cab + "\n" + "\n".join(x[1] for x in datos) + "\n")

lab.pregunta("¿Cuál fue el vector de entrada (dominio desde el que se descargó el adjunto malicioso)?", dominio_malo,
             pista="Es el primer evento sospechoso del proxy: una descarga .zip desde un dominio raro.")
lab.pregunta("¿Qué usuario fue el paciente cero?", user)
lab.pregunta("¿Qué proceso lanzó la PowerShell maliciosa (su proceso padre)?", "wscript.exe", "wscript",
             pista="Mira el campo parent= en edr_procesos.log.")
lab.pregunta("¿A qué IP de C2 se conectó la PowerShell?", c2, pista="Cruza la hora de la powershell con red.log.")
lab.pregunta("¿Con qué nombre creó la tarea programada de persistencia? (valor de /tn)", "OfficeSync", "officesync",
             pista="grep schtasks edr_procesos.log")
lab.pregunta("Táctica MITRE de 'schtasks /create' para mantenerse: ¿Persistence o Exfiltration?", "persistence", "persistencia")
lab.pregunta("¿Qué cuenta privilegiada robada usó para el movimiento lateral?", "adm.sql", "acme\\adm.sql",
             pista="En autenticacion.log, la cuenta con LogonType=3 src=WIN-RRHH-12 hacia muchos servidores.")
lab.pregunta("¿Qué herramienta legítima (LOLBin/util) usó para exfiltrar datos?", "rclone.exe", "rclone",
             pista="Mira el proc= de la conexión con muchísimos bytes_out en red.log.")
lab.pregunta("¿Qué comando borró las copias de seguridad (shadow copies)? (nombre del ejecutable)", "vssadmin.exe", "vssadmin",
             pista="Técnica T1490 Inhibit System Recovery.")
lab.pregunta("Ordena: ¿qué pasó ANTES, la exfiltración o el despliegue del ransomware?", "exfiltracion", "exfiltración",
             pista="El modelo de doble extorsión: primero roban los datos, luego cifran. Mira las horas.")
lab.pregunta("¿Cuántos GB (aprox., 1 decimal) se exfiltraron desde SRV-FICHEROS?", round(1340211200 / 1_000_000_000, 1),
             pista="bytes_out / 1e9 de la conexión de rclone.")
lab.terminar()
