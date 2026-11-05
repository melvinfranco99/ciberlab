/* Escritorio 5 — Blue Team, defensa, logs, SOC, forense */
CL.areas.defensa = { id: 'defensa', title: 'Blue Team, defensa y logs', tagline: 'Detectar, contener y recuperarse: el trabajo que más se demanda.',
extra: [{ id: 'logs', t: '🔎 Práctica de análisis de logs', view: 'logs' }],
intro: `El Blue Team protege, vigila y responde. Su ciclo (NIST SP 800‑61): **preparación → detección y análisis → contención, erradicación y recuperación → lecciones aprendidas**.

Usa la **Práctica de análisis de logs** (abajo a la izquierda) para investigar tres incidentes simulados: fuerza bruta SSH, ataque a una tienda web y password spraying en un dominio Windows.`,
levels: [
{ name: 'Principiante', lessons: [
{ id: 'de-01', t: 'Logs en Linux: journald, auth.log y qué mirar', min: 45, labs: ['host', 'logs'],
  obj: ['Leer logs con journalctl', 'Encontrar inicios de sesión y uso de sudo', 'Contar eventos con grep, awk, sort, uniq'],
  theory: 'Linux registra en **journald** (`journalctl`) y, en muchas distros, también en `/var/log/` (`auth.log`, `syslog`). En Arch todo está en journald.',
  steps: [
    ['Inicios de sesión y sudo', '$ journalctl _COMM=sudo --since today\n$ journalctl -u sshd --since "1 hour ago"', ''],
    ['Arranques y errores', '$ journalctl --list-boots | tail -3\n$ journalctl -p err -b', '`-p err` filtra por prioridad.'],
    ['Las tres herramientas del analista', '$ journalctl -u sshd -o cat | grep -oE "from [0-9.]+" | sort | uniq -c | sort -rn | head', 'Patrón universal: extraer → ordenar → contar → ordenar por cantidad.'],
    ['Practica con un incidente', '', 'Abre **Práctica de análisis de logs → auth.log** y responde a las preguntas.'],
  ],
  challenge: 'Resuelve el caso auth.log completo y escribe la línea temporal del ataque en tus apuntes.' },
{ id: 'de-02', t: 'Detectar fuerza bruta en tiempo real (y bloquearla)', min: 45, labs: ['ssh-target', 'logs'],
  obj: ['Ver un ataque de fuerza bruta desde el lado defensor', 'Bloquearlo automáticamente con fail2ban', 'Saber qué controles lo hacen inútil'],
  theory: 'Un servicio expuesto recibe intentos de acceso automáticos a los pocos minutos. Las defensas efectivas: **autenticación por clave**, MFA, limitar intentos y no exponer el servicio.',
  steps: [
    ['Arranca el objetivo', '', 'Laboratorio → Docker → **Servidor SSH débil** → Iniciar.'],
    ['Observa sus logs en vivo', '$ docker logs -f ciberlab-ssh-target', 'Deja esta terminal abierta mientras otra persona (o tú, con un único intento manual `ssh soporte@127.0.0.1 -p 2222`) se conecta.'],
    ['Instala fail2ban en tu Arch para tu propio sshd (si lo usas)', '$ sudo pacman -S --needed fail2ban\n$ sudo tee /etc/fail2ban/jail.local >/dev/null <<EOF\n[sshd]\nenabled = true\nbackend = systemd\nmaxretry = 5\nbantime = 1h\nEOF\n$ sudo systemctl enable --now fail2ban\n$ sudo fail2ban-client status sshd', ''],
  ],
  defense: '```\n# /etc/ssh/sshd_config\nPasswordAuthentication no\nPermitRootLogin no\nMaxAuthTries 3\nAllowUsers tuusuario\n```\nY si no necesitas SSH desde fuera: no lo expongas, usa una VPN (WireGuard).',
  challenge: 'Configura tu SSH solo con clave Ed25519 y comprueba con `ssh -o PreferredAuthentications=password` que el acceso por contraseña queda rechazado.' },
{ id: 'de-03', t: 'Logs web: reconocer ataques en access.log', min: 45, labs: ['logs', 'dvwa'],
  obj: ['Leer el formato combinado de Apache/Nginx', 'Reconocer escáneres, inyecciones y webshells en los logs'],
  theory: 'Formato: `IP - usuario [fecha] "MÉTODO RUTA HTTP/x" código bytes "referer" "user-agent"`. Señales: user‑agents de herramientas, ráfagas de 404, palabras SQL (`UNION`, `SELECT`), `../`, parámetros `cmd=`, peticiones POST a rutas de subida seguidas de GET a ficheros `.php` nuevos.',
  steps: [
    ['Caso práctico', '', 'Práctica de análisis de logs → **access.log**. Resuelve las 6 preguntas.'],
    ['Top IPs y códigos', '$ awk \'{print $1}\' access.log | sort | uniq -c | sort -rn | head\n$ awk \'{print $9}\' access.log | sort | uniq -c', 'Descarga el log desde la práctica y trabaja en la terminal.'],
    ['Decodificar URLs', '$ grep cmd= access.log | python3 -c "import sys,urllib.parse as u;[print(u.unquote(l.strip())) for l in sys.stdin]"', ''],
  ],
  challenge: 'Escribe la línea temporal completa del ataque a la tienda y las 5 medidas que lo habrían evitado.' },
]},
{ name: 'Intermedio', lessons: [
{ id: 'de-04', t: 'Eventos de seguridad de Windows que todo analista conoce', min: 50, labs: ['logs', 'win-ad'],
  obj: ['Memorizar los IDs de evento clave', 'Detectar password spraying y persistencia'],
  theory: `| ID | Significado |
|---|---|
| 4624 / 4625 | Inicio de sesión correcto / fallido (mira el *LogonType*: 2 interactivo, 3 red, 10 RDP) |
| 4672 | Privilegios especiales asignados (inicio de sesión de admin) |
| 4720 / 4726 | Cuenta creada / eliminada |
| 4728 / 4732 / 4756 | Miembro añadido a grupo global / local / universal |
| 4740 | Cuenta bloqueada |
| 4768 / 4769 | Kerberos TGT / ticket de servicio (base para detectar kerberoasting) |
| 7045 | Servicio instalado |
| 4688 | Proceso creado (activa la línea de comandos en la auditoría) |
| 1102 | Registro de auditoría borrado |

**Password spraying** = muchas cuentas, uno o dos intentos cada una, desde el mismo origen.`,
  steps: [['Caso práctico', '', 'Práctica de análisis de logs → **Seguridad de Windows**.'],
    ['En una VM Windows', 'PS> Get-WinEvent -FilterHashtable @{LogName="Security";Id=4625} -MaxEvents 20 | Format-Table TimeCreated,Message -Wrap', '']],
  challenge: 'Resuelve el caso Windows y redacta qué alerta (regla) habría detectado el ataque en el primer minuto.' },
{ id: 'de-05', t: 'Sysmon: visibilidad real en Windows', min: 50, labs: ['win-ad'],
  obj: ['Instalar Sysmon con una configuración de referencia', 'Interpretar los eventos principales'],
  theory: 'Sysmon (Sysinternals) registra creación de procesos con línea de comandos y hash (ID 1), conexiones de red (3), carga de drivers (6), acceso a LSASS (10), ficheros creados (11), cambios de registro (12‑14) y consultas DNS (22).',
  steps: [['Instalar', 'PS> .\\Sysmon64.exe -accepteula -i sysmonconfig.xml', 'Usa la configuración de [SwiftOnSecurity](https://github.com/SwiftOnSecurity/sysmon-config) u [Olaf Hartong](https://github.com/olafhartong/sysmon-modular).'],
    ['Consultar', 'PS> Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 10', '']],
  challenge: 'Abre un PowerShell, ejecuta `whoami /all` y encuentra ese evento en Sysmon con su proceso padre.' },
{ id: 'de-06', t: 'Monta un SIEM: Wazuh', min: 90, labs: ['siem', 'ubuntu-srv'],
  obj: ['Desplegar Wazuh', 'Conectar un agente Linux', 'Ver alertas de tus propias pruebas'],
  steps: [
    ['Importar la OVA', '', 'Descarga la OVA oficial (Laboratorio → Qué descargar) e impórtala con tipo de red «Atacante». Necesita ~8 GB de RAM.'],
    ['Acceder al panel', '', 'Abre `https://IP_WAZUH` desde tu Arch. Credenciales iniciales en la documentación de la OVA; cámbialas.'],
    ['Instalar un agente en Ubuntu Server', '', 'Panel de Wazuh → *Deploy new agent* → copia el comando generado para Linux y ejecútalo en la VM Ubuntu.'],
    ['Generar eventos', '$ sudo su -\n$ ssh usuarioinexistente@localhost', 'Unos cuantos intentos fallidos deberían aparecer como alertas.'],
  ],
  challenge: 'Activa el módulo de integridad de ficheros (FIM) sobre `/etc` y comprueba que cambiar `/etc/hosts` genera una alerta.',
  refs: [['Documentación de Wazuh', 'https://documentation.wazuh.com/']] },
]},
{ name: 'Avanzado', lessons: [
{ id: 'de-07', t: 'Reglas de detección con Sigma', min: 60, labs: ['siem'],
  obj: ['Escribir una regla Sigma', 'Convertirla al lenguaje de tu SIEM'],
  theory: 'Sigma es un formato genérico de reglas de detección (YAML) que se traduce a Splunk, Elastic, Sentinel, Wazuh… Es la forma estándar de compartir detecciones.',
  steps: [['Ejemplo: borrado del registro de seguridad', 'title: Registro de seguridad borrado\nid: 5e1c3f0a-0000-4000-8000-000000000001\nstatus: stable\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 1102\n  condition: selection\nlevel: high\ntags:\n  - attack.defense_evasion\n  - attack.t1070.001', ''],
    ['Convertir', '$ pipx install sigma-cli\n$ sigma plugin install splunk\n$ sigma convert -t splunk regla.yml', '']],
  challenge: 'Escribe una regla Sigma para detectar password spraying (muchos 4625 de una misma IP contra distintas cuentas en 10 minutos).',
  refs: [['SigmaHQ', 'https://github.com/SigmaHQ/sigma']] },
{ id: 'de-08', t: 'Respuesta a incidentes: playbook de ransomware', min: 60, labs: [],
  obj: ['Seguir las fases de NIST 800‑61', 'Saber qué hacer (y qué no) en la primera hora'],
  theory: `**Primera hora ante un ransomware:**
1. **Aislar** los equipos afectados de la red (cable/WiFi), **sin apagarlos** (la memoria contiene evidencias y a veces claves).
2. Avisar al responsable y activar el plan; contactar con INCIBE‑CERT (017 / incidencias@incibe-cert.es) y, si hay datos personales, preparar la notificación a la AEPD (72 h).
3. Identificar el alcance: qué equipos, qué cuentas, desde cuándo.
4. Proteger las copias de seguridad (desconectarlas).
5. Restablecer credenciales privilegiadas desde un equipo limpio.
6. Erradicar (vector de entrada, persistencias) **antes** de restaurar.
7. Restaurar desde copias verificadas; vigilar de cerca.
8. Lecciones aprendidas.`,
  challenge: 'Escribe el playbook de ransomware para una pyme de 20 empleados: contactos, decisiones y responsables.' },
{ id: 'de-09', t: 'Forense básico: triaje de un Linux comprometido', min: 60, labs: ['ubuntu-srv'],
  obj: ['Recoger evidencias volátiles en orden', 'Buscar persistencias habituales'],
  steps: [
    ['Volátil primero', '$ date -u; uptime; w\n$ ps auxf\n$ ss -tupan\n$ ip a; ip route', 'Guarda todo con `| tee -a triaje.txt`.'],
    ['Persistencias', '$ crontab -l; ls -la /etc/cron.* /var/spool/cron\n$ systemctl list-unit-files --state=enabled\n$ cat /etc/passwd | awk -F: \'$3>=1000\'\n$ ls -la ~/.ssh/authorized_keys /root/.ssh/', ''],
    ['Ficheros recientes', '$ find / -xdev -mtime -2 -type f 2>/dev/null | grep -vE "^/(proc|sys|run)"', ''],
  ],
  challenge: 'En tu VM Ubuntu, crea tú mismo una persistencia (un cron y un usuario) y pide a otra persona que la encuentre con estos comandos — o hazlo tú una semana después.' },
]},
{ name: 'Experto', lessons: [
{ id: 'de-10', t: 'Threat hunting guiado por hipótesis', min: 60, labs: ['siem'],
  obj: ['Formular hipótesis basadas en ATT&CK', 'Convertir una caza exitosa en una detección'],
  theory: 'El threat hunting busca de forma proactiva atacantes que las alertas no vieron. Ciclo: **hipótesis** («un atacante usa tareas programadas para persistir», T1053) → **datos** necesarios → **búsqueda** → **resultado** → **automatizar** la detección si funciona.',
  challenge: 'Elige 3 técnicas de ATT&CK y, para cada una, escribe la hipótesis, la fuente de datos y la consulta que harías.' },
{ id: 'de-11', t: 'Forense de memoria con Volatility 3', min: 60, labs: [],
  obj: ['Analizar un volcado de memoria', 'Listar procesos, conexiones y líneas de comandos'],
  steps: [['Instalar', '$ pipx install volatility3', ''],
    ['Análisis básico de un volcado Windows', '$ vol -f memoria.raw windows.info\n$ vol -f memoria.raw windows.pstree\n$ vol -f memoria.raw windows.cmdline\n$ vol -f memoria.raw windows.netscan', 'Practica con los volcados públicos de los retos de [CyberDefenders](https://cyberdefenders.org).']],
  challenge: 'Resuelve un reto de forense de memoria en CyberDefenders o Blue Team Labs Online.' },
]},
]};
