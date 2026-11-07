/* N3 · Escritorio 2 — Reconocimiento y OSINT */
CL.areas.recon = { id: 'recon', title: 'Reconocimiento y OSINT', tagline: 'Conocer el objetivo mejor que él mismo: huella externa, superficie de ataque y personas, sin tocar un solo sistema de más.',
intro: `## Reconocimiento
La fase que decide el ejercicio. Un buen *recon* te da los puntos de entrada antes de lanzar nada ruidoso. Dos mitades:
- **Pasivo**: no tocas al objetivo (fuentes abiertas, DNS, certificados, filtraciones). Invisible.
- **Activo**: interactúas con sus sistemas (escaneo de puertos, fuzzing). Ya genera ruido y registros.

Mantén siempre el **alcance**: una IP o un subdominio fuera de él no se toca, aunque «sea del cliente».`,
levels: [
{ name: 'Fundamento ofensivo', lessons: [
{ id: 'rec-01', t: 'OSINT y huella externa: dominios, subdominios, personas y filtraciones', min: 60, labs: [],
  obj: ['Enumerar la superficie externa de una organización sin tocarla', 'Encontrar subdominios y activos olvidados', 'Relacionar personas y correos para el acceso inicial (phishing autorizado)'],
  theory: `El reconocimiento **pasivo** reconstruye la organización desde fuera:

| Qué buscas | Dónde | Herramienta |
|---|---|---|
| Subdominios | DNS, certificados (CT logs) | \`subfinder\`, \`amass\`, crt.sh |
| Activos vivos | Resolución + sondeo HTTP | \`dnsx\`, \`httpx\` |
| Tecnologías | Cabeceras, favicon, JS | \`httpx -tech-detect\`, Wappalyzer |
| Personas y correos | LinkedIn, web corporativa | \`theHarvester\`, patrones de correo |
| Credenciales filtradas | Volcados públicos | HaveIBeenPwned, Dehashed |
| Metadatos | Documentos públicos (PDF, docx) | \`exiftool\` |

El objetivo es un **mapa de superficie de ataque**: qué hay expuesto, con qué tecnología y quién trabaja allí (para un phishing autorizado o un *password spraying* contra el portal correcto).`,
  steps: [
    ['Subdominios por fuentes pasivas', 'subfinder -d empresa-ejemplo.com -silent | tee ~/CiberLab3/recon/subs.txt', 'Combina con `amass enum -passive -d empresa-ejemplo.com`. Nada de esto toca al objetivo todavía.'],
    ['¿Cuáles están vivos y qué corren?', 'cat ~/CiberLab3/recon/subs.txt | httpx -silent -title -tech-detect -status-code', 'Aquí ya hay interacción HTTP ligera. Marca los paneles de login, VPN y administración.'],
    ['Personas y patrón de correo', 'theHarvester -d empresa-ejemplo.com -b all', 'Deduce el patrón (`nombre.apellido@`). Son la entrada a un phishing o spraying **autorizados** y dentro de alcance.'],
    ['Metadatos de documentos públicos', 'exiftool documento.pdf | grep -Ei "author|creator|software"', 'Los PDF y Office publicados filtran usuarios, rutas internas y versiones de software.'],
  ],
  defense: 'Reduce tu superficie: retira subdominios y paneles olvidados, quita metadatos de los documentos que publicas, monitoriza los CT logs de tus dominios y fuerza MFA en todo portal externo. Lo que el atacante encuentra en recon es lo que tú deberías inventariar primero.',
  quiz: [['¿Qué fuente revela subdominios aunque no estén en el DNS público, por los certificados emitidos?', ['WHOIS', 'Los Certificate Transparency logs (crt.sh)', 'El robots.txt'], 1, 'Cada certificado TLS queda en los CT logs: una mina de subdominios.'],
         ['El recon pasivo se caracteriza por…', ['Escanear todos los puertos', 'No interactuar con los sistemas del objetivo', 'Explotar una vulnerabilidad'], 1, 'Pasivo = fuentes abiertas, sin tocar al objetivo.']],
  challenge: 'Elige un programa de *bug bounty* público con alcance abierto (p. ej. en HackerOne) y haz solo reconocimiento pasivo: dibuja su mapa de superficie de ataque sin enviar un solo paquete de escaneo activo.',
  refs: [['OSINT Framework', 'https://osintframework.com/'], ['subfinder', 'https://github.com/projectdiscovery/subfinder'], ['crt.sh', 'https://crt.sh'], ['theHarvester', 'https://github.com/laramies/theHarvester']] },
]},
{ name: 'Operador', lessons: [
{ id: 'rec-02', t: 'Escaneo activo con criterio: descubrir sin despertar a todo el SOC', min: 55, labs: ['vm'],
  obj: ['Escanear de forma incremental y controlada, no «todo a máxima velocidad»', 'Interpretar servicios y versiones para priorizar', 'Entender la huella que deja cada tipo de escaneo'],
  theory: `El escaneo activo es ruidoso: un \`nmap\` a toda velocidad enciende cualquier IDS. El operador escanea **en capas**:

1. **Descubrimiento** de hosts vivos (\`-sn\`).
2. **Puertos** más probables primero (\`--top-ports 100\`), luego todos si hace falta (\`-p-\`).
3. **Servicios y versiones** solo en lo abierto (\`-sV -sC\`).

Cada elección deja huella distinta: un *SYN scan* (\`-sS\`) es más silencioso que un *connect* completo; \`-T4\` es rápido pero evidente, \`-T2\` lento pero discreto. En un Red Team eliges según cuánto ruido te permite el objetivo.`,
  steps: [
    ['Hosts vivos en la DMZ del lab', 'nmap -sn 192.168.60.0/24 -oA ~/CiberLab3/recon/dmz-vivos', 'Guarda siempre con `-oA` (los tres formatos). El `.xml` alimenta informes y otras herramientas.'],
    ['Puertos probables y luego todos', 'nmap -sS --top-ports 100 -T3 192.168.60.0/24', 'Si el tiempo lo permite, un `-p-` completo a los hosts interesantes revela servicios en puertos altos olvidados.'],
    ['Versiones y scripts seguros', 'nmap -sV -sC -p <puertos> 192.168.60.50 -oA ~/CiberLab3/recon/web', 'Las versiones exactas te dicen qué exploits públicos aplican. `-sC` lanza scripts NSE de categoría *safe*.'],
    ['Traduce a objetivos', '', 'Un SMB en 445, un web con versión antigua o un RDP expuesto son candidatos. Prioriza por facilidad de explotación × valor del activo.'],
  ],
  defense: 'Un escaneo se detecta por el patrón: muchas conexiones a muchos puertos desde una IP en poco tiempo. Reglas en el IDS (Suricata), *rate limiting* y *honeypots* de puerto delatan al atacante. Si lo viste en el N2 (práctica de tráfico), aquí estás al otro lado.',
  quiz: [['¿Qué escaneo nmap es, en general, más silencioso?', ['-T5 connect scan completo', '-sS SYN scan a ritmo moderado', 'Un -p- a -T5'], 1, 'El SYN scan no completa el handshake y a ritmo moderado llama menos la atención.']],
  challenge: 'Escanea la DMZ del lab de dos formas (`-T2 -sS` frente a `-T5`) con Suricata escuchando. Compara qué alertas genera cada una: esa es la diferencia entre sigilo y ruido.',
  refs: [['Nmap reference', 'https://nmap.org/book/man.html'], ['The Hacker Recipes · Recon', 'https://www.thehacker.recipes/'], ['RustScan', 'https://github.com/RustScan/RustScan']] },
]},
]};
