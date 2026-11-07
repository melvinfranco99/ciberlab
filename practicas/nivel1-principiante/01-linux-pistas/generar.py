#!/usr/bin/env python3
"""N1·01 — Moverse por Linux como un investigador.
Crea en datos/servidor/ una copia de un servidor con pistas escondidas: ficheros ocultos,
permisos peligrosos, secretos olvidados y logs. Uso: python3 generar.py [--semilla N]"""
import os
import pathlib
import shutil
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N1·01 · Moverse por Linux como un investigador", 101)
r = lab.rng
raiz = lab.datos / "servidor"
if raiz.exists():
    shutil.rmtree(raiz)

PALABRAS = ["halcon", "nebulosa", "cobalto", "tormenta", "granito", "lince", "aurora", "quasar", "volcan", "sirena"]
usuarios = ["ana", "bruno", "carla", "diego", "elena", "fran", "gema"]
r.shuffle(usuarios)
con_bash = sorted(r.sample(usuarios, r.randint(3, 5)))

# /etc/passwd
lineas = ["root:x:0:0:root:/root:/bin/bash", "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin",
          "www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin", "sshd:x:110:65534::/run/sshd:/usr/sbin/nologin"]
for i, u in enumerate(usuarios):
    shell = "/bin/bash" if u in con_bash else r.choice(["/usr/sbin/nologin", "/bin/false"])
    lineas.append(f"{u}:x:{1001 + i}:{1001 + i}:{u.capitalize()}:/home/{u}:{shell}")
lab.escribir("servidor/etc/passwd", "\n".join(lineas) + "\n")
n_bash = len(con_bash) + 1  # + root

# nota oculta en el home de un usuario
dueno_nota = r.choice(usuarios)
clave = f"{r.choice(PALABRAS)}-{r.randint(100, 999)}"
for u in usuarios:
    lab.escribir(f"servidor/home/{u}/notas.txt", f"Recordatorio de {u}: revisar el correo y las copias.\n")
lab.escribir(f"servidor/home/{dueno_nota}/.nota_secreta", f"No olvidar la palabra clave del servidor de copias: {clave}\n")

# fichero .env con una clave de API olvidada dentro de la web
api = "sk_live_" + "".join(r.choice("abcdef0123456789") for _ in range(24))
proyecto = r.choice(["tienda", "intranet", "reservas"])
lab.escribir(f"servidor/var/www/{proyecto}/config/.env", f"DB_HOST=127.0.0.1\nDB_USER={proyecto}\nAPI_KEY={api}\nDEBUG=true\n")
lab.escribir(f"servidor/var/www/{proyecto}/index.php", "<?php echo 'Bienvenido'; ?>\n")
for otro in {"tienda", "intranet", "reservas"} - {proyecto}:
    lab.escribir(f"servidor/var/www/{otro}/index.php", "<?php echo 'Hola'; ?>\n")

# binario con SUID (simulado) y script de cron modificable por cualquiera
binarios = ["copia_seguridad", "monitor", "limpieza", "informe"]
suid = r.choice(binarios)
for b in binarios:
    p = lab.escribir(f"servidor/usr/local/bin/{b}", f"#!/bin/sh\necho '{b}'\n")
    os.chmod(p, 0o4755 if b == suid else 0o755)
scripts = ["rotar_logs.sh", "backup_bd.sh", "actualizar.sh"]
inseguro = r.choice(scripts)
for s in scripts:
    p = lab.escribir(f"servidor/etc/cron.daily/{s}", f"#!/bin/sh\n# tarea diaria: {s}\n")
    os.chmod(p, 0o777 if s == inseguro else 0o755)

# logs de distintos tamaños
logs = {"syslog": r.randint(300, 600), "auth.log": r.randint(300, 600), "kern.log": r.randint(300, 600), "nginx/access.log": r.randint(300, 600)}
grande = max(logs, key=logs.get)
for nombre, n in logs.items():
    lab.escribir(f"servidor/var/log/{nombre}", "".join(f"línea {i} de {nombre}\n" for i in range(n * 4)))

lab.pregunta("¿Qué palabra clave hay en el fichero oculto de un usuario? (escríbela entera, p. ej. lince-123)", clave,
             pista="Los ficheros ocultos empiezan por punto: ls -la o find servidor/home -name '.*' -type f")
lab.pregunta("¿Cuántos usuarios (incluido root) tienen como shell /bin/bash?", n_bash,
             pista="grep -c '/bin/bash$' servidor/etc/passwd")
lab.pregunta("¿Cómo se llama el programa de /usr/local/bin que tiene el bit SUID?", suid,
             pista="find servidor -perm -4000 -type f   (o mira la «s» en ls -l)")
lab.pregunta("¿Qué script de cron.daily puede modificar CUALQUIER usuario?", inseguro,
             pista="find servidor/etc/cron.daily -perm -o+w   (permisos rwxrwxrwx = 777)")
lab.pregunta("¿Cuál es la API_KEY que se olvidó en la web?", api, pista="grep -r API_KEY servidor/var/www")
lab.pregunta("¿Qué fichero de /var/log ocupa más? (ruta relativa a /var/log, p. ej. syslog)", grande, grande.split("/")[-1],
             pista="du -ah servidor/var/log | sort -h   o   ls -lS")
lab.terminar()
