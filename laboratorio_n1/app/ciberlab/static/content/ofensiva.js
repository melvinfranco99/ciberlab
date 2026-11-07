/* Escritorio 2 — Ofensiva, pentesting y Red Team */
CL.areas.ofensiva = { id: 'ofensiva', title: 'Ofensiva y Red Team', tagline: 'Metodología del pentesting profesional y del red team.',
intro: `Aquí aprendes **cómo se organiza** un pentest y un ejercicio de red team: fases, documentación, herramientas y cómo convertir lo que encuentras en mejoras para el cliente.

La práctica guiada de explotación se hace en plataformas diseñadas para ello, que te llevan paso a paso y de forma legal:
- **TryHackMe**: rutas *Jr Penetration Tester* y *Red Teaming*.
- **Hack The Box Academy**: módulos del itinerario *Penetration Tester* (CPTS).
- **VulnHub / Metasploitable** en tu laboratorio aislado, siguiendo *writeups* publicados cuando te atasques.

> ⛔ Todo lo de esta área, solo contra tu laboratorio, plataformas de práctica o clientes con autorización escrita.`,
levels: [
{ name: 'Principiante', lessons: [
{ id: 'of-01', t: 'Qué es un pentest y en qué se diferencia de un red team', min: 30, labs: [],
  obj: ['Distinguir escaneo de vulnerabilidades, pentest y red team'],
  theory: `| | Escaneo de vulnerabilidades | Pentest | Red team |
|---|---|---|---|
| Objetivo | Lista de fallos conocidos | Encontrar y demostrar fallos en un alcance | Probar la detección y respuesta frente a un adversario realista |
| Sigilo | Ninguno | Bajo | Alto |
| Duración | Horas | Días o semanas | Semanas o meses |
| Resultado | Informe automático | Informe con hallazgos verificados | Narrativa del ataque y fallos de detección |`,
  challenge: 'Lee el programa de Auditorías → Metodología y resume cada fase en una frase.' },
{ id: 'of-02', t: 'Reconocimiento y OSINT', min: 50, labs: ['host'],
  obj: ['Recopilar información pública de una organización', 'Construir el inventario de activos del alcance'],
  theory: 'El reconocimiento pasivo no toca los sistemas del objetivo: registros DNS públicos, certificados (crt.sh), buscadores, redes profesionales, filtraciones. Es la base del alcance real de una auditoría.',
  steps: [['DNS y registros', '$ whois example.com\n$ dig +short NS example.com\n$ dig +short TXT example.com', 'Practica con un dominio tuyo o con `example.com`.'],
    ['Certificados emitidos', '$ curl -s "https://crt.sh/?q=example.com&output=json" | jq -r ".[].name_value" | sort -u', 'Los certificados revelan subdominios.']],
  challenge: 'Haz el inventario público de un dominio tuyo: subdominios, servidores de correo, SPF/DMARC y tecnologías web.',
  refs: [['OSINT Framework', 'https://osintframework.com/']] },
{ id: 'of-03', t: 'Enumeración de servicios en tu laboratorio', min: 50, labs: ['kali', 'ms2'],
  obj: ['Pasar de una lista de puertos a una lista de hipótesis'],
  theory: 'Tras el escaneo (lección de nmap en el área de Redes), cada servicio se enumera: versión exacta, configuración, usuarios, recursos compartidos. Después se buscan vulnerabilidades conocidas para esas versiones.',
  steps: [['Buscar vulnerabilidades conocidas por versión', '$ searchsploit vsftpd\n$ nmap --script vuln -p 21,80 192.168.56.101', 'Solo en tu VM Metasploitable aislada. Contrasta cada resultado con la base de datos NVD.']],
  challenge: 'Para cada servicio de Metasploitable, busca en NVD (nvd.nist.gov) si su versión tiene CVE conocidas y apúntalas con su puntuación CVSS. Después sigue la sala «Metasploit» de TryHackMe para la parte práctica.',
  refs: [['TryHackMe — Jr Penetration Tester', 'https://tryhackme.com/path/outline/jrpenetrationtester']] },
]},
{ name: 'Intermedio', lessons: [
{ id: 'of-04', t: 'Escalada de privilegios: conceptos y defensa', min: 50, labs: [],
  obj: ['Conocer las causas habituales de una escalada de privilegios', 'Saber detectarlas con herramientas de auditoría'],
  theory: 'Causas típicas en Linux: permisos `sudo` excesivos, binarios SUID inusuales, tareas programadas escribibles, servicios como root, kernel sin parchear, credenciales en ficheros. En Windows: servicios mal configurados, privilegios de token, credenciales guardadas, parches ausentes. Las herramientas de auditoría (Lynis, PEASS, PingCastle) las detectan.',
  defense: 'Mínimo privilegio en `sudo`, revisión de SUID, parches del kernel, credenciales en un gestor y no en ficheros, LAPS en Windows.',
  challenge: 'Haz el módulo de escalada de privilegios Linux de HTB Academy o TryHackMe y apunta cada causa raíz con su corrección.' },
{ id: 'of-05', t: 'Active Directory: conceptos para auditarlo', min: 60, labs: ['win-ad'],
  obj: ['Entender dominio, Kerberos, grupos y GPO', 'Auditar AD con herramientas defensivas'],
  theory: 'Active Directory centraliza identidades. Los riesgos habituales son de **configuración**: privilegios excesivos, cuentas de servicio débiles, delegaciones, plantillas de certificados, protocolos heredados. **PingCastle** y **BloodHound** muestran los caminos de riesgo; Microsoft publica guías de bastionado.',
  steps: [['Montar el dominio', '', 'Crea en el Laboratorio un Windows Server (plantilla AD/DC) y un Windows 10 cliente; promociona el servidor a controlador de dominio.'],
    ['Auditoría de configuración', '', 'Ejecuta PingCastle (`PingCastle.exe --healthcheck`) en el dominio de laboratorio y revisa el informe HTML.']],
  challenge: 'Corrige en tu dominio de laboratorio los 5 riesgos de mayor puntuación de PingCastle. Para la práctica ofensiva guiada, sigue el itinerario de AD de HTB Academy o GOAD con su documentación.',
  refs: [['PingCastle', 'https://www.pingcastle.com/'], ['GOAD', 'https://github.com/Orange-Cyberdefense/GOAD']] },
]},
{ name: 'Avanzado', lessons: [
{ id: 'of-06', t: 'Red team: planificación, OPSEC y emulación de adversarios', min: 50, labs: [],
  obj: ['Planificar un ejercicio de red team', 'Usar MITRE ATT&CK para emular a un adversario'],
  theory: 'Un ejercicio de red team parte de un **objetivo** (p. ej. acceso a datos de clientes) y de un **perfil de adversario** realista. Se planifica con ATT&CK, se coordina con un *white team* que conoce el ejercicio y termina con un **purple team** para mejorar las detecciones. Herramientas de emulación: Atomic Red Team, MITRE Caldera.',
  challenge: 'Elige un grupo de ATT&CK y prepara un plan de emulación con 8 técnicas y, para cada una, la detección esperada.',
  refs: [['MITRE ATT&CK — Grupos', 'https://attack.mitre.org/groups/'], ['Atomic Red Team', 'https://github.com/redcanaryco/atomic-red-team']] },
]},
{ name: 'Experto', lessons: [
{ id: 'of-07', t: 'Purple team: de ataque a detección', min: 60, labs: ['siem'],
  obj: ['Ejecutar pruebas atómicas y comprobar si el SIEM las detecta'],
  theory: 'Ejecuta una técnica de prueba controlada (Atomic Red Team) en tu VM Windows con Wazuh, comprueba si saltó una alerta y, si no, escribe la regla Sigma. Es el ejercicio que más valor aporta a una empresa.',
  challenge: 'Ejecuta 5 pruebas atómicas en tu laboratorio y documenta cuáles detectó Wazuh y qué reglas añadiste.' },
]},
]};
