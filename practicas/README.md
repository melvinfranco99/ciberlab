# Prácticas de CiberLab — 4 niveles, de principiante a experto

Laboratorios **offline y autocorregibles**. Cada práctica genera sus propios datos (reproducibles con
una semilla) y corrige tus respuestas **sin enseñarte la solución** (se guardan como hashes SHA-256).
Solo necesitas Python 3 y la línea de comandos: sin Internet, sin instalar nada, sin riesgo.

> ⚠️ Todo el material es **defensivo y educativo**: logs, configuraciones y muestras **inertes** creadas
> para el ejercicio. Úsalo solo en tu equipo. Nada se ejecuta, se descarga ni ataca a terceros.

## Cómo se hace una práctica

```bash
cd nivel1-principiante/01-linux-pistas
python3 generar.py          # crea datos/ y respuestas.txt (plantilla)
#   ... investiga con los comandos del glosario ...
nano respuestas.txt         # escribe cada respuesta detrás de los dos puntos
python3 comprobar.py        # te puntúa
python3 comprobar.py --pistas   # si te atascas, da pistas (no la solución)
```

- `python3 generar.py --semilla 7` → genera otra variante distinta (números y datos cambian).
- `python3 generar.py --forzar` → rehace `respuestas.txt` desde cero.

## Ruta por niveles

| Nivel | Práctica | Qué aprendes | Técnicas / comandos clave |
|---|---|---|---|
| **1 · Principiante** | `01-linux-pistas` | Moverte por Linux como investigador: ficheros ocultos, permisos, SUID, secretos | `find`, `grep -r`, `ls -la`, `du`, permisos |
| | `02-fuerza-bruta-ssh` | Leer `auth.log` y distinguir un ataque del ruido de bots | `grep`, `sort \| uniq -c`, `cut`, `awk` |
| | `03-hashes-codificacion` | Integridad (SHA256SUMS), Base64/hex/ROT13, tipos de hash | `sha256sum -c`, `base64 -d`, `xxd`, `md5sum` |
| **2 · Intermedio** | `01-informe-nmap` | Interpretar un escaneo, identificar servicios y **priorizar** riesgos | `nmap -sV`, lectura de XML, CVE conocidos |
| | `02-reglas-firewall` | Auditar un cortafuegos: reglas demasiado abiertas y orden incorrecto | iptables/nftables, política por defecto |
| | `03-trafico-pcap` | Cazar *beaconing* (baliza C2) y exfiltración en logs de conexión (estilo Zeek) | agregación por pareja IP, `sort -k`, bytes_out |
| **3 · Avanzado** | `01-eventos-windows` | Reconstruir movimiento lateral con EventID 4624/4625/4688/4769/4720/4728 | análisis de eventos, kerberoasting, persistencia |
| | `02-bastionado` | Aplicar un *baseline* CIS a un servidor: `sshd_config`, `sysctl`, UID 0, permisos | hardening, `awk -F:`, revisión de config |
| | `03-cripto-debil` | Por qué César/XOR/MD5 sin sal **no** protegen, y qué usar (Argon2) | fuerza bruta de clave corta, diccionario, sal |
| **4 · Experto** | `01-incidente-completo` | Investigación DFIR correlacionando 4 fuentes y mapeando a MITRE ATT&CK | línea temporal, LOLBins, doble extorsión |
| | `02-ingenieria-deteccion` | Escribir detecciones por comportamiento y medir TP/FP (afinado) | Sigma, falsos positivos, pirámide del dolor |
| | `03-malware-estatico` | Triaje **estático** de un artefacto inerte: cadenas, IoC, Base64, persistencia | `strings`, `grep`, `base64 -d`, `sha256sum` |

## Glosarios de apoyo

En las apps (`ciberlab` / `ciberlab2`) y en el manual web tienes, buscables con la tecla `/`:
- **Glosario de términos** — palabras a aprender y memorizar, con ejemplo.
- **Glosario de comandos** — por nivel e importancia (★), con qué significa cada flag.
- **Glosario de herramientas** — qué es cada programa, para qué sirve y cómo se instala en Arch.

## Estructura

```
practicas/
  _comun/lab.py          motor compartido (datos + corrección por hash)
  nivelN-.../NN-.../
    generar.py           crea datos/ y respuestas.txt
    comprobar.py         corrige respuestas.txt
    datos/               (se genera; ignorado por git)
```
