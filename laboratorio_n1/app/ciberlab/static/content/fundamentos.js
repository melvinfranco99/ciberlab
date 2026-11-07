/* Escritorio 1 — Seguridad informática general y fundamentos */
CL.areas.inicio = { id: 'inicio', title: 'Fundamentos de seguridad', tagline: 'La base que necesitas antes de atacar o defender nada.',
intro: `## Cómo usar CiberLab
1. Sigue la **ruta global** de arriba: no saltes a Active Directory sin dominar Linux y redes.
2. Cada lección tiene teoría, un **paso a paso** en tu laboratorio, cómo **defenderse** y un **reto**. Márcala como completada solo cuando hayas hecho el reto.
3. Escribe **apuntes** en cada lección: se guardan solos y aparecen en la búsqueda.
4. Practica a diario 30‑60 minutos. La constancia gana a los atracones.`,
levels: [
{ name: 'Principiante', lessons: [
{ id: 'fu-01', t: 'Qué es la ciberseguridad: CIA, amenazas y riesgo', min: 30, labs: [],
  obj: ['Explicar la tríada **Confidencialidad, Integridad, Disponibilidad**', 'Distinguir amenaza, vulnerabilidad, riesgo e impacto', 'Conocer los perfiles profesionales (red team, blue team, auditor, GRC)'],
  theory: `La seguridad de la información protege tres propiedades:

| Propiedad | Significa | Ejemplo de ataque | Control típico |
|---|---|---|---|
| **Confidencialidad** | Solo quien debe puede leer | Robo de base de datos | Cifrado, control de acceso |
| **Integridad** | Nadie altera los datos sin permiso | Cambiar el IBAN de una factura | Firmas, hashes, registros |
| **Disponibilidad** | El servicio funciona cuando se necesita | Ransomware, DDoS | Copias, redundancia |

**Riesgo = probabilidad × impacto.** Una *vulnerabilidad* (fallo) solo es un riesgo si existe una *amenaza* capaz de explotarla y un *activo* que importe.

### Perfiles profesionales
- **Red Team / pentester**: simula atacantes para encontrar fallos (con autorización).
- **Blue Team / SOC**: detecta y responde a ataques.
- **Purple Team**: une ambos para mejorar la detección.
- **Auditor / GRC**: evalúa controles frente a normas (ISO 27001, ENS, NIS2).
- **DFIR**: análisis forense y respuesta a incidentes.`,
  quiz: [['Un ransomware cifra todos los ficheros de la empresa. ¿Qué propiedad ataca principalmente?', ['Confidencialidad', 'Integridad', 'Disponibilidad'], 2, 'Impide usar los datos. Si además los roba (doble extorsión), también ataca la confidencialidad.'],
         ['Un servidor con un fallo grave, apagado y desconectado de toda red…', ['Es un riesgo crítico', 'Tiene un riesgo muy bajo', 'No tiene vulnerabilidades'], 1, 'La vulnerabilidad existe, pero la probabilidad de explotarla es mínima.']],
  challenge: 'Elige un negocio que conozcas (un bar, una clínica, tu antiguo trabajo). Escribe en tus apuntes sus 5 activos más importantes y, para cada uno, una amenaza y qué propiedad CIA afectaría.' },
{ id: 'fu-02', t: 'Ética, legalidad y cómo practicar sin meterte en líos', min: 20, labs: [],
  obj: ['Saber qué está permitido y qué no', 'Conocer las plataformas legales de práctica', 'Entender la divulgación responsable'],
  theory: `> ⛔ Legal: acceder sin permiso a un sistema ajeno es delito en España (art. 197 bis CP), aunque no causes daños.

**Puedes practicar en:**
- Tu laboratorio (VMs y Docker de CiberLab).
- Plataformas creadas para ello: TryHackMe, Hack The Box, PortSwigger Academy, OverTheWire, VulnHub.
- Programas de **bug bounty** (HackerOne, Intigriti, YesWeHack), respetando estrictamente su alcance.
- Sistemas de clientes con **autorización escrita** (programa de Auditorías).

**Divulgación responsable:** si encuentras un fallo por casualidad, no lo explotes; avisa al responsable (busca \`/.well-known/security.txt\`) o a INCIBE‑CERT.`,
  challenge: 'Busca si tu banco o tu operador publican un `security.txt` (`curl https://dominio/.well-known/security.txt`). Anota qué piden a quien reporta una vulnerabilidad.' },
{ id: 'fu-03', t: 'Linux para seguridad I: terminal, ficheros y permisos', min: 60, labs: ['host'],
  obj: ['Moverte con soltura por la terminal', 'Entender usuarios, grupos y permisos rwx', 'Encontrar ficheros con permisos peligrosos en tu propio sistema'],
  theory: `Casi toda la seguridad se hace desde la terminal. Los permisos de Linux son \`rwx\` para **propietario**, **grupo** y **otros**. Bits especiales: **SUID** (se ejecuta con los permisos del dueño), **SGID** y **sticky**.`,
  steps: [
    ['Orientarte', '$ whoami; id; hostname; pwd\n$ ls -la ~', '`id` muestra tus grupos: fíjate en `wheel`, `docker`, `wireshark`. Pertenecer a `docker` equivale en la práctica a ser root.'],
    ['Leer permisos', '$ ls -l /etc/passwd /etc/shadow\n$ stat -c "%A %U %G %n" /etc/shadow', '`/etc/shadow` guarda los hashes de contraseñas y solo lo lee root.'],
    ['Buscar ficheros SUID en tu sistema', '$ find / -perm -4000 -type f 2>/dev/null', 'Son normales `sudo`, `passwd`, `su`… Un SUID inesperado es una señal de alarma en una auditoría.'],
    ['Ficheros que cualquiera puede escribir', '$ find /etc /usr -writable -type f 2>/dev/null | head', 'Si sale algo, revisa por qué.'],
    ['Ayuda integrada', '$ man find\n$ tldr find   # sudo pacman -S tldr', ''],
  ],
  defense: '- Principio de **mínimo privilegio**: nadie en `docker`/`wheel` sin necesitarlo.\n- Revisa periódicamente SUID y ficheros escribibles (`lynis` lo hace por ti).',
  challenge: 'Completa los niveles 0‑10 de [OverTheWire Bandit](https://overthewire.org/wargames/bandit/). Apunta el comando clave de cada nivel.',
  refs: [['OverTheWire Bandit', 'https://overthewire.org/wargames/bandit/'], ['Linux Journey', 'https://linuxjourney.com/']] },
{ id: 'fu-04', t: 'Contraseñas, gestores y MFA', min: 40, labs: ['host'],
  obj: ['Entender por qué la longitud importa más que la complejidad', 'Configurar un gestor de contraseñas', 'Activar MFA resistente a phishing'],
  theory: `Las contraseñas se guardan como **hashes** (funciones de un solo sentido). Un buen almacenamiento usa algoritmos lentos con *sal* (bcrypt, scrypt, Argon2). Las contraseñas cortas o reutilizadas caen en filtraciones y ataques de diccionario.

**Recomendaciones actuales (NIST SP 800‑63B):** mínimo 12‑15 caracteres, frases de contraseña, sin caducidad forzada salvo sospecha de compromiso, comprobar contra listas de contraseñas filtradas y **MFA**. Orden de robustez del MFA: llave FIDO2/passkey > app TOTP/push con número > SMS.`,
  steps: [
    ['Generar una frase de contraseña', '$ sudo pacman -S --needed xkcdpass keepassxc\n$ xkcdpass -n 5 -d -', 'Cinco palabras al azar son fáciles de recordar y muy difíciles de adivinar.'],
    ['Ver qué hash usa tu sistema', '$ sudo grep "^$USER:" /etc/shadow | cut -d: -f2 | cut -c1-4', '`$y$` es yescrypt, `$6$` SHA‑512 crypt. Ambos llevan sal.'],
    ['¿Están tus correos en filtraciones?', '', 'Comprueba tu correo en [haveibeenpwned.com](https://haveibeenpwned.com). Si aparece, cambia esas contraseñas y activa MFA.'],
  ],
  defense: '- Gestor de contraseñas para todo, contraseña única por servicio.\n- MFA en correo, banca y cuentas de administración.\n- En empresas: bloqueo de contraseñas comunes y MFA obligatoria.',
  challenge: 'Migra tus 10 cuentas más importantes a KeePassXC (o Bitwarden) con contraseñas únicas y activa MFA en las 3 más críticas.' },
{ id: 'fu-05', t: 'Monta tu laboratorio seguro', min: 60, labs: ['kali', 'ms2'],
  obj: ['Crear la red aislada del laboratorio', 'Tener Kali y Metasploitable funcionando', 'Hacer tu primer snapshot'],
  theory: 'Un laboratorio aislado te deja romper cosas sin riesgo. CiberLab crea una red **host-only** (192.168.56.0/24) donde las máquinas vulnerables no tienen salida a Internet.',
  steps: [
    ['Crear la red', '', 'Ve al escritorio 8 → **Laboratorio** → Estado → «Crear red de laboratorio».'],
    ['Descargar Kali y Metasploitable 2', '$ cd ~/CiberLab/isos\n$ sha256sum *.7z *.zip', 'Desde **Laboratorio → Qué descargar**. Comprueba siempre la suma SHA‑256 con la publicada.'],
    ['Crear/importar las VMs', '', 'Laboratorio → Crear / importar VM. Tu VM `ms2` existente: apágala y pulsa **🔒 Aislar**.'],
    ['Comprobar la conectividad desde Kali', '$ ip -br a\n$ ping -c2 192.168.56.1', 'Kali debe tener una IP 192.168.56.x en su segunda interfaz.'],
    ['Snapshot', '', 'Con todo apagado: **📸 Snapshot** → «limpio». A partir de aquí, si rompes algo, restauras.'],
  ],
  challenge: 'Dibuja (en papel o en tus apuntes) tu laboratorio: máquinas, IPs y qué red tiene cada una.' },
]},
{ name: 'Intermedio', lessons: [
{ id: 'fu-06', t: 'Criptografía práctica: hashes, cifrado simétrico y asimétrico', min: 50, labs: ['host'],
  obj: ['Diferenciar hash, cifrado simétrico y asimétrico', 'Cifrar y firmar ficheros con GPG', 'Entender qué protege TLS'],
  theory: `| Primitiva | Para qué | Ejemplos |
|---|---|---|
| Hash | Integridad, almacenar contraseñas | SHA‑256, BLAKE2, Argon2 |
| Simétrico | Cifrar datos con una clave compartida | AES‑GCM, ChaCha20‑Poly1305 |
| Asimétrico | Intercambio de claves y firmas | RSA, Ed25519, X25519 |

**Nunca** inventes tu propia criptografía ni uses MD5/SHA‑1 para seguridad.`,
  steps: [
    ['Hash de un fichero', '$ echo "hola" > a.txt; sha256sum a.txt\n$ echo "hola." > a.txt; sha256sum a.txt', 'Un cambio mínimo cambia el hash por completo (efecto avalancha).'],
    ['Cifrado simétrico', '$ gpg --symmetric --cipher-algo AES256 a.txt\n$ gpg -d a.txt.gpg', ''],
    ['Clave asimétrica y firma', '$ gpg --quick-generate-key "Lab <lab@local>" ed25519 sign 1y\n$ gpg --detach-sign a.txt; gpg --verify a.txt.sig a.txt', 'La firma prueba autoría e integridad.'],
    ['Inspeccionar TLS', '$ openssl s_client -connect www.incibe.es:443 -servername www.incibe.es </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates', ''],
  ],
  challenge: 'Crea una carpeta cifrada con `gocryptfs` dentro de `~/CiberLab/loot` (lo usarás en auditorías reales).' },
{ id: 'fu-07', t: 'Modelado de amenazas (STRIDE) y gestión del riesgo', min: 45, labs: [],
  obj: ['Aplicar STRIDE a un sistema sencillo', 'Priorizar riesgos con una matriz'],
  theory: `**STRIDE**: Spoofing (suplantación), Tampering (manipulación), Repudiation (repudio), Information disclosure (fuga), Denial of service, Elevation of privilege.

Proceso: 1) dibuja el sistema (flujo de datos), 2) marca fronteras de confianza, 3) aplica STRIDE a cada elemento, 4) puntúa probabilidad × impacto, 5) decide: mitigar, transferir, aceptar o evitar.`,
  challenge: 'Haz el modelo de amenazas de una tienda online pequeña (web + pasarela de pago + panel de admin). Mínimo 8 amenazas con su control.' },
{ id: 'fu-08', t: 'Ingeniería social y phishing (cómo reconocerlo y formar a otros)', min: 40, labs: [],
  obj: ['Reconocer las señales de un phishing', 'Analizar cabeceras de un correo', 'Diseñar una formación de concienciación'],
  theory: `El factor humano está detrás de la mayoría de incidentes. Técnicas: phishing, smishing (SMS), vishing (llamada), fraude del CEO, cambio de IBAN. Señales: urgencia, autoridad, remitente parecido (\`rnicrosoft.com\`), enlaces que no coinciden, adjuntos inesperados.

En un correo sospechoso, mira las cabeceras \`Received\`, \`Return-Path\` y \`Authentication-Results\` (resultado de SPF, DKIM y DMARC).`,
  defense: '- SPF/DKIM/DMARC en el dominio propio.\n- MFA resistente a phishing (FIDO2).\n- Verificar por otro canal cualquier petición de pago.\n- Botón de «reportar phishing» y cultura de no culpar.',
  challenge: 'Busca 3 correos de spam en tu bandeja, abre «ver original» y anota el resultado de SPF/DKIM/DMARC y el servidor de origen real.' },
]},
{ name: 'Avanzado', lessons: [
{ id: 'fu-09', t: 'Marcos y normas: ISO 27001, ENS, NIS2, NIST CSF, MITRE ATT&CK', min: 50, labs: [],
  obj: ['Saber qué marco usar en cada caso', 'Mapear un hallazgo técnico a un control normativo'],
  theory: `| Marco | Para qué sirve |
|---|---|
| **ISO/IEC 27001:2022** | Sistema de gestión certificable; 93 controles en el Anexo A |
| **ENS** | Obligatorio en sector público español y sus proveedores |
| **NIS2** | Obligaciones de gestión de riesgos y notificación en sectores críticos de la UE |
| **NIST CSF 2.0** | Gobernar, Identificar, Proteger, Detectar, Responder, Recuperar |
| **CIS Controls v8** | 18 controles priorizados; ideal para pymes (IG1) |
| **MITRE ATT&CK** | Catálogo de tácticas y técnicas reales de atacantes; base de detección |`,
  challenge: 'Toma los 10 primeros controles CIS IG1 y evalúa cómo los cumple tu propio equipo o red doméstica.',
  refs: [['CIS Controls v8', 'https://www.cisecurity.org/controls'], ['MITRE ATT&CK', 'https://attack.mitre.org/'], ['NIST CSF 2.0', 'https://www.nist.gov/cyberframework']] },
{ id: 'fu-10', t: 'Bastiona tu propio Arch', min: 60, labs: ['host'],
  obj: ['Auditar tu sistema con Lynis', 'Aplicar firewall, actualizaciones y servicios mínimos'],
  steps: [
    ['Auditoría con Lynis', '$ sudo pacman -S --needed lynis\n$ sudo lynis audit system | tee ~/CiberLab/loot/lynis-arch.txt', 'Mira el *Hardening index* y las sugerencias.'],
    ['Puertos en escucha', '$ ss -tulpn', 'Cada puerto abierto debe tener una razón. CiberLab solo escucha en 127.0.0.1.'],
    ['Firewall', '$ sudo pacman -S --needed ufw\n$ sudo ufw default deny incoming\n$ sudo ufw default allow outgoing\n$ sudo ufw enable', 'Si usas servicios en la LAN, ábrelos explícitamente.'],
    ['Actualizaciones y servicios', '$ sudo pacman -Syu\n$ systemctl list-unit-files --state=enabled', 'Desactiva lo que no uses.'],
  ],
  challenge: 'Sube tu Hardening index de Lynis al menos 10 puntos y apunta qué cambiaste.' },
]},
{ name: 'Experto', lessons: [
{ id: 'fu-11', t: 'Carrera profesional y certificaciones', min: 30, labs: [],
  obj: ['Planificar tu ruta de certificaciones', 'Construir un portafolio demostrable'],
  theory: `| Ruta | Inicial | Intermedia | Avanzada |
|---|---|---|---|
| Ofensiva | eJPT, CompTIA PenTest+ | OSCP, PNPT, CPTS | OSEP, CRTO, OSWE |
| Defensiva | CompTIA Security+, BTL1 | CySA+, CDSA, GCIH | GCFA, GREM, OSDA |
| Cloud | AZ‑500, AWS Security Specialty | CCSK | CCSP |
| Auditoría/GRC | ISO 27001 Foundation | ISO 27001 Lead Auditor | CISA, CISM, CISSP |

**Portafolio:** blog con *writeups* de máquinas retiradas, repositorio con tus scripts y reglas de detección, ranking en HTB/THM, participación en CTF.`,
  challenge: 'Escribe tu plan a 12 meses: qué certificación, qué plataformas y cuántas horas por semana.' },
]},
]};
