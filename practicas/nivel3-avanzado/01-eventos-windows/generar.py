#!/usr/bin/env python3
"""N3·01 — Investigar eventos de seguridad de Windows (DFIR).
Genera datos/seguridad.csv con eventos del registro de seguridad de Windows (EventID 4624/4625/4672/4688/4769...)
que reconstruyen un movimiento lateral. El alumno responde como analista de SOC."""
import datetime as dt
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N3·01 · Investigar eventos de seguridad de Windows", 301)
r = lab.rng
base = dt.datetime(2026, 7, r.randint(2, 25), 8, 0, 0)
dom = "ACME"
equipos = ["PC-RRHH-07", "PC-VENTAS-03", "SRV-FICHEROS", "SRV-SQL", "DC01"]
users = ["ana.lopez", "bruno.gil", "carla.ruiz", "diego.sanz"]
rows = []  # (ts, EventID, Equipo, Cuenta, IpOrigen, Detalle)


def ev(t, eid, host, cuenta, ip, detalle):
    rows.append((t, eid, host, cuenta, ip, detalle))


# Actividad normal: logons interactivos por la mañana
for _ in range(60):
    u = r.choice(users)
    ev(lab.hora(base, 3 * 3600), 4624, r.choice(equipos[:2]), f"{dom}\\{u}", lab.ip_interna(), "LogonType=2 Interactive")
for _ in range(25):
    ev(lab.hora(base, 8 * 3600), 4624, "SRV-FICHEROS", f"{dom}\\{r.choice(users)}", lab.ip_interna(), "LogonType=3 Network")

# Fase 1: phishing -> ejecución. Un usuario abre algo y Word lanza powershell (4688)
paciente0 = "carla.ruiz"
pc0 = "PC-RRHH-07"
t = base + dt.timedelta(hours=1, minutes=r.randint(0, 59))
ev(t, 4688, pc0, f"{dom}\\{paciente0}", "", r"NewProcess=C:\Program Files\Microsoft Office\WINWORD.EXE")
ev(t + dt.timedelta(seconds=4), 4688, pc0, f"{dom}\\{paciente0}", "",
   r"NewProcess=C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe ParentProcess=WINWORD.EXE CommandLine=-enc <base64>")

# Fase 2: dumping de credenciales -> uso de cuenta de servicio con muchos TGS (kerberoasting, 4769 RC4 0x17)
svc = "svc_sql"
for _ in range(r.randint(20, 35)):
    ev(lab.hora(t, 1800), 4769, "DC01", f"{dom}\\{svc}", "", "TicketEncryptionType=0x17 ServiceName=MSSQLSvc")

# Fase 3: movimiento lateral -> logon 4624 LogonType=3 con cuenta admin robada desde pc0 a SRV-SQL
admin = "adm.backup"
lat = t + dt.timedelta(hours=2)
ev(lat, 4648, pc0, f"{dom}\\{paciente0}", "", f"Explicit credentials for {dom}\\{admin}")
ev(lat + dt.timedelta(seconds=2), 4624, "SRV-SQL", f"{dom}\\{admin}", pc0_ip := lab.ip_interna(), "LogonType=3 Network")
ev(lat + dt.timedelta(seconds=5), 4672, "SRV-SQL", f"{dom}\\{admin}", "", "Special privileges assigned (SeDebugPrivilege)")
# Fallos previos: el atacante probó el admin en varios equipos (4625)
for h in ["PC-VENTAS-03", "SRV-FICHEROS"]:
    for _ in range(r.randint(3, 6)):
        ev(lab.hora(t + dt.timedelta(hours=1), 3000), 4625, h, f"{dom}\\{admin}", pc0, "LogonType=3 Status=0xC000006D")
# Fase 4: persistencia -> creación de usuario nuevo y adición a Domain Admins (4720/4728)
nuevo = "support_adm"
per = lat + dt.timedelta(minutes=20)
ev(per, 4720, "DC01", f"{dom}\\{admin}", "", f"A user account was created: {nuevo}")
ev(per + dt.timedelta(seconds=3), 4728, "DC01", f"{dom}\\{admin}", "", f"Member {nuevo} added to group Domain Admins")

rows.sort()
lab.escribir("seguridad.csv", "TimeCreated,EventID,Computer,Account,IpAddress,Detail\n" +
             "\n".join(f'{t:%Y-%m-%d %H:%M:%S},{eid},{host},{cta},{ip},"{det}"' for t, eid, host, cta, ip, det in rows) + "\n")

lab.pregunta("EventID 4625 es un inicio de sesión fallido y 4624 uno correcto. ¿Qué EventID indica un logon CORRECTO?", 4624)
lab.pregunta("¿Qué cuenta fue el «paciente cero» (en cuyo PC Word lanzó PowerShell)?", paciente0,
             pista="Busca EventID 4688 con WINWORD.EXE como proceso padre de powershell.")
lab.pregunta("¿En qué equipo ocurrió esa ejecución inicial?", pc0)
lab.pregunta("Hay una cuenta de servicio con decenas de tickets Kerberos RC4 (0x17): señal de kerberoasting. ¿Cuál es?", svc,
             pista="grep 4769 seguridad.csv | grep 0x17  -> cuenta repetida.")
lab.pregunta("¿Qué cuenta de administrador robada usó el atacante para moverse a SRV-SQL?", admin,
             pista="EventID 4648 (credenciales explícitas) y luego 4624 LogonType=3 en SRV-SQL.")
lab.pregunta("¿Qué cuenta NUEVA creó el atacante como persistencia (EventID 4720)?", nuevo)
lab.pregunta("¿A qué grupo privilegiado la añadió (EventID 4728)?", "Domain Admins", "domain admins")
lab.pregunta("¿Cuántos inicios de sesión FALLIDOS (4625) hubo en total?", sum(1 for x in rows if x[1] == 4625),
             pista="grep -c ',4625,' seguridad.csv")
lab.pregunta("Ordena las fases: ¿qué ocurrió ANTES, el kerberoasting o la creación del usuario de persistencia?", "kerberoasting",
             pista="Mira las marcas de tiempo: primero roban credenciales, al final crean persistencia.")
lab.terminar()
