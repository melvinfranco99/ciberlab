#!/usr/bin/env python3
"""N3·02 — Bastionado: auditar la configuración de un servidor Linux (defensa).
Genera datos/config/ con sshd_config, sysctl, usuarios y permisos. El alumno aplica un baseline CIS
y encuentra las desviaciones. Todo es revisión defensiva de configuración."""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N3·02 · Bastionado de un servidor Linux (baseline CIS)", 302)
r = lab.rng

# sshd_config con una mezcla de valores: algunos seguros, algunos inseguros (elegidos al azar)
permit_root = r.choice(["yes", "no", "prohibit-password"])
pass_auth = r.choice(["yes", "no"])
x11 = r.choice(["yes", "no"])
proto = r.choice(["2", "2"])
max_auth = r.choice([3, 4, 6, 10])
port = r.choice([22, 22, 2222])
sshd = f"""# /etc/ssh/sshd_config
Port {port}
Protocol {proto}
PermitRootLogin {permit_root}
PasswordAuthentication {pass_auth}
PubkeyAuthentication yes
X11Forwarding {x11}
MaxAuthTries {max_auth}
ClientAliveInterval 300
PermitEmptyPasswords no
"""
lab.escribir("config/etc/ssh/sshd_config", sshd)

# sysctl: reenvío de paquetes (debería estar a 0 en un servidor que no enruta)
ip_forward = r.choice([0, 1])
syn_cookies = r.choice([0, 1])
lab.escribir("config/etc/sysctl.conf", f"net.ipv4.ip_forward = {ip_forward}\nnet.ipv4.tcp_syncookies = {syn_cookies}\nkernel.randomize_va_space = 2\n")

# cuentas con UID 0 duplicado (puerta trasera): a veces se inyecta
backdoor = r.random() < 0.7
passwd = ["root:x:0:0:root:/root:/bin/bash", "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin",
          "www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin"]
extra_uid0 = None
if backdoor:
    extra_uid0 = r.choice(["toor", "sysop", "backup2"])
    passwd.append(f"{extra_uid0}:x:0:0:,,,:/home/{extra_uid0}:/bin/bash")
passwd += [f"operador:x:1001:1001:,,,:/home/operador:/bin/bash"]
lab.escribir("config/etc/passwd", "\n".join(passwd) + "\n")

# ficheros world-writable y sin dueño
lab.escribir("config/hallazgos_find.txt",
             "# salida de: find / -xdev \\( -perm -0002 -o -nouser \\) -ls 2>/dev/null\n"
             "/var/backups/db.sql           -rw-rw-rw-  root root   world-writable (0666)\n"
             "/opt/app/run.sh               -rwxrwxrwx  root root   world-writable (0777)\n"
             "/var/tmp/huerfano.dat         -rw-r--r--  40201 40201 sin dueño\n")

# cálculo de desviaciones
desv = 0
det = []
if permit_root == "yes":
    desv += 1; det.append("PermitRootLogin yes")
if pass_auth == "yes":
    desv += 1; det.append("PasswordAuthentication yes")
if x11 == "yes":
    desv += 1; det.append("X11Forwarding yes")
if max_auth > 4:
    desv += 1; det.append(f"MaxAuthTries {max_auth}")
if ip_forward == 1:
    desv += 1; det.append("ip_forward=1")
if syn_cookies == 0:
    desv += 1; det.append("tcp_syncookies=0")
if backdoor:
    desv += 1

lab.pregunta("¿Hay una segunda cuenta con UID 0 además de root (puerta trasera)? (si/no)", "si" if backdoor else "no",
             pista="awk -F: '$3==0' config/etc/passwd")
if backdoor:
    lab.pregunta("¿Cómo se llama esa cuenta con UID 0?", extra_uid0)
lab.pregunta("¿Permite sshd iniciar sesión directamente como root con contraseña? (el valor de PermitRootLogin es 'yes'?) (si/no)",
             "si" if permit_root == "yes" else "no", pista="grep -i permitrootlogin config/etc/ssh/sshd_config")
lab.pregunta("¿Está activado el reenvío de paquetes (ip_forward=1), que no debería en un servidor normal? (si/no)",
             "si" if ip_forward == 1 else "no", pista="grep ip_forward config/etc/sysctl.conf")
lab.pregunta("¿En qué puerto escucha SSH?", port, pista="grep -i '^Port' config/etc/ssh/sshd_config")
lab.pregunta("¿Cuántos ficheros world-writable (permiso de escritura para todos) aparecen en hallazgos_find.txt?", 2,
             pista="Cuenta las líneas que dicen world-writable.")
lab.pregunta("¿Cuántas desviaciones de seguridad has encontrado en total (sshd + sysctl + UID0)?", desv,
             pista="Suma: cada ajuste inseguro cuenta uno. Revisa PermitRootLogin, PasswordAuthentication, X11Forwarding, MaxAuthTries>4, ip_forward, tcp_syncookies y la cuenta UID 0.")
lab.terminar()
