/* Escritorio 6 — Redes y WiFi */
CL.areas.redes = { id: 'redes', title: 'Redes y WiFi', tagline: 'Sin entender la red no se puede atacar ni defender nada.',
intro: 'Del modelo TCP/IP al análisis de tráfico, el descubrimiento de servicios en tu laboratorio, la segmentación y la seguridad WiFi. Toda práctica activa se hace **solo** en la red 192.168.56.0/24 del laboratorio o en tu propio router.',
levels: [
{ name: 'Principiante', lessons: [
{ id: 're-01', t: 'TCP/IP en la práctica: IP, puertos, DNS y rutas', min: 50, labs: ['host'],
  obj: ['Entender capas, IP, máscara, puerta de enlace y DNS', 'Saber qué es un puerto y un socket', 'Diagnosticar la red desde la terminal'],
  theory: `| Capa | Ejemplos | Qué mirar en seguridad |
|---|---|---|
| Enlace | Ethernet, WiFi, ARP | Suplantación ARP, cifrado WiFi |
| Red | IP, ICMP | Rutas, segmentación |
| Transporte | TCP, UDP | Puertos abiertos |
| Aplicación | HTTP, DNS, SMB, SSH | Versiones, configuración |

Un **puerto** identifica un servicio dentro de una máquina (22 SSH, 80/443 web, 445 SMB, 3389 RDP).`,
  steps: [['Tu configuración', '$ ip -br a\n$ ip route\n$ resolvectl status | head -20', ''],
    ['DNS', '$ dig +short incibe.es\n$ dig +short MX incibe.es', ''],
    ['Conexiones activas', '$ ss -tunp', 'Qué procesos de tu equipo hablan con quién.']],
  quiz: [['¿Qué protocolo traduce nombres a IPs?', ['ARP', 'DNS', 'DHCP'], 1, 'ARP traduce IP→MAC en la red local; DHCP reparte IPs.']],
  challenge: 'Dibuja tu red doméstica: router, IP pública, rango interno y dispositivos (usa la lista de clientes de tu router).' },
{ id: 're-02', t: 'Wireshark: ver lo que viaja por la red', min: 50, labs: ['host'],
  obj: ['Capturar y filtrar tráfico', 'Ver la diferencia entre un protocolo en claro y uno cifrado'],
  steps: [['Abrir Wireshark', '', 'Desde Laboratorio → 🦈 Wireshark (ya estás en el grupo `wireshark`).'],
    ['Filtros de visualización útiles', 'dns\nhttp.request\ntls.handshake.type == 1\nip.addr == 192.168.56.101', ''],
    ['Claro vs cifrado', '$ curl http://neverssl.com >/dev/null\n$ curl https://www.incibe.es >/dev/null', 'En HTTP verás el contenido; en HTTPS solo el nombre del servidor (SNI) en el handshake.']],
  defense: 'Cifra siempre el transporte (HTTPS, SSH, SFTP, LDAPS). Lo que va en claro lo puede leer cualquiera en el camino.',
  challenge: 'Captura el arranque de tu navegador y averigua a cuántos dominios distintos se conecta en el primer minuto (Estadísticas → Resolved Addresses).' },
{ id: 're-03', t: 'Descubrimiento de hosts y servicios con nmap (en tu laboratorio)', min: 60, labs: ['kali', 'ms2'],
  obj: ['Descubrir máquinas en la red del laboratorio', 'Identificar puertos, servicios y versiones', 'Guardar resultados para un informe'],
  theory: '> ⚠ Escanear redes ajenas sin permiso puede ser ilegal y siempre es detectable. Usa solo 192.168.56.0/24.',
  steps: [['Descubrimiento', '$ nmap -sn 192.168.56.0/24', ''],
    ['Puertos y versiones de Metasploitable', '$ mkdir -p ~/CiberLab/loot/ms2 && cd $_\n$ nmap -sV -p- --min-rate 2000 192.168.56.101 -oA ms2-full', 'Sustituye la IP por la de tu `ms2` (la ves en Laboratorio → Máquinas virtuales).'],
    ['Leer el resultado', '$ grep open ms2-full.gnmap | tr "," "\\n"', 'Cada servicio con versión antigua es algo a investigar en la fase de análisis.']],
  defense: 'Cierra lo que no uses, filtra con firewall y monitoriza escaneos (Suricata/Zeek los detectan fácilmente).',
  challenge: 'Haz una tabla en tus apuntes con cada puerto abierto de Metasploitable, el servicio, la versión y si esa versión tiene soporte hoy.' },
]},
{ name: 'Intermedio', lessons: [
{ id: 're-04', t: 'Segmentación, VLANs y firewall', min: 50, labs: ['host'],
  obj: ['Diseñar una red segmentada para una pyme', 'Escribir reglas de firewall de mínimo privilegio'],
  theory: 'Una red plana permite que un equipo comprometido llegue a todo. Segmenta al menos: **usuarios**, **servidores**, **invitados**, **IoT/cámaras/impresoras** y **gestión**. Entre segmentos, solo el tráfico necesario.',
  steps: [['Ejemplo con nftables', 'table inet filtro {\n  chain forward {\n    type filter hook forward priority 0; policy drop;\n    ct state established,related accept\n    iifname "vlan_usuarios" oifname "vlan_servidores" tcp dport { 443, 445 } accept\n    iifname "vlan_invitados" oifname "wan" accept\n  }\n}', 'Política por defecto **drop**; se permite solo lo necesario.']],
  challenge: 'Diseña la red de una clínica dental (recepción, consultas, equipos de rayos, WiFi de pacientes) con sus VLANs y las reglas entre ellas.' },
{ id: 're-05', t: 'Seguridad WiFi: WPA2, WPA3, WPS y redes de invitados', min: 50, labs: ['wifi'],
  obj: ['Entender cómo se autentica una red WPA2/WPA3', 'Saber por qué una clave débil o WPS son un riesgo', 'Bastionar tu router'],
  theory: `- **WPA2‑Personal (PSK)**: la seguridad depende por completo de la longitud y aleatoriedad de la clave; una clave corta puede adivinarse por diccionario sin estar conectado.
- **WPA3‑Personal (SAE)**: resiste los ataques de diccionario fuera de línea. Úsalo si tus dispositivos lo soportan.
- **WPA2/3‑Enterprise (802.1X)**: cada usuario con sus credenciales; lo correcto en empresas.
- **WPS**: diseño débil; desactívalo siempre.
- **Red de invitados**: aislada de la LAN.`,
  defense: '- WPA3 o WPA2‑AES con clave aleatoria de 20+ caracteres.\n- WPS desactivado, firmware actualizado, contraseña de administración del router cambiada y panel no accesible desde Internet.\n- IoT y visitas en la red de invitados.',
  challenge: 'Audita tu propio router con esta checklist y anota qué cambiaste. Para la parte práctica ofensiva usa los laboratorios guiados de WiFi de TryHackMe/HTB Academy.',
  refs: [['HTB Academy — Wi‑Fi Penetration Testing Basics', 'https://academy.hackthebox.com/'], ['Documentación de aircrack-ng', 'https://www.aircrack-ng.org/documentation.html']] },
{ id: 're-06', t: 'Detección de red con Suricata y Zeek', min: 60, labs: ['siem'],
  obj: ['Entender IDS basado en firmas vs. análisis de comportamiento', 'Leer alertas de Suricata'],
  theory: '**Suricata** compara el tráfico con firmas (ET Open). **Zeek** genera registros ricos de cada conexión (conn.log, dns.log, http.log). Security Onion integra ambos.',
  challenge: 'Despliega Security Onion (o Suricata en tu VM Ubuntu), escanea con nmap desde Kali y encuentra la alerta generada.' },
]},
{ name: 'Avanzado', lessons: [
{ id: 're-07', t: 'Ataques de red local y cómo neutralizarlos', min: 50, labs: [],
  obj: ['Conocer los ataques clásicos de capa 2/3 y su mitigación'],
  theory: `| Ataque | Idea | Mitigación |
|---|---|---|
| Suplantación ARP | Hacerse pasar por la puerta de enlace | Dynamic ARP Inspection, 802.1X, cifrado extremo a extremo |
| DHCP falso | Repartir una puerta de enlace/DNS maliciosa | DHCP Snooping |
| Envenenamiento LLMNR/NBT‑NS | Responder a nombres que DNS no resuelve | Desactivar LLMNR/NBT‑NS por GPO |
| Relay NTLM | Reutilizar una autenticación ajena | Firma SMB, EPA en LDAP/HTTP, desactivar NTLM |
| VLAN hopping | Saltar a otra VLAN | Desactivar DTP, VLAN nativa sin uso |`,
  challenge: 'Para cada fila, busca cómo se activa la mitigación en un switch o en una GPO y apúntalo.' },
]},
{ name: 'Experto', lessons: [
{ id: 're-08', t: 'Arquitectura Zero Trust', min: 40, labs: [],
  obj: ['Explicar Zero Trust sin marketing', 'Planificar una migración por fases'],
  theory: 'Zero Trust (NIST SP 800‑207): **ninguna conexión es de confianza por estar dentro de la red**. Cada acceso se autentica, autoriza y cifra según identidad, estado del dispositivo y contexto. Piezas: identidad fuerte con MFA, inventario de dispositivos, microsegmentación, acceso a aplicaciones (ZTNA) en lugar de VPN plana y monitorización continua.',
  challenge: 'Escribe un plan en 4 fases para llevar a Zero Trust a una empresa de 200 empleados con VPN tradicional.' },
]},
]};
