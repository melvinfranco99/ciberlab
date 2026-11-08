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
{ name: 'Profundización', lessons: [
{ id: 'rec-03', t: 'Descubrimiento de contenido y virtual hosts: lo que no está enlazado', min: 60, labs: ['web'],
  obj: ['Encontrar rutas, ficheros y parámetros ocultos con fuzzing', 'Descubrir virtual hosts (webs distintas en la misma IP)', 'Elegir diccionarios y filtrar el ruido de respuestas'],
  theory: `Casi todo el contenido interesante de una web **no está enlazado**: paneles de administración, copias (\`.bak\`, \`.old\`), ficheros de configuración, endpoints de API, entornos de pruebas. Se encuentran por **fuerza bruta de rutas** (fuzzing) con un buen diccionario.

| Técnica | Qué busca | Herramienta |
|---|---|---|
| Fuzzing de rutas | /admin, /backup, /.git | ffuf, feroxbuster |
| Fuzzing recursivo | directorios dentro de directorios | feroxbuster (recursión) |
| Virtual hosts | webs servidas por cabecera Host | ffuf con -H "Host: FUZZ.sitio" |
| Parámetros ocultos | ?debug=, ?admin= | ffuf, Arjun, param-miner |
| Extensiones | .php, .bak, .zip | ffuf -e |

La clave es **filtrar**: una web que responde 200 a todo necesita filtrar por tamaño (\`-fs\`) o palabras (\`-fw\`); si responde 404 estándar, filtras por código (\`-mc\`).`,
  steps: [
    ['Fuzzing de rutas con filtro', 'ffuf -u http://127.0.0.1:8221/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -mc 200,301,302,403', 'Usa SecLists (el estándar de diccionarios). Contra DVWA del lab aparecerán /login.php, /setup.php, etc.'],
    ['Recursivo y con extensiones', 'feroxbuster -u http://127.0.0.1:8220 -x php,txt,bak -d 2', 'feroxbuster entra en los directorios que encuentra. `-x` prueba extensiones; `.bak`/`.old` filtran código fuente con credenciales.'],
    ['Descubre virtual hosts', 'ffuf -u http://sitio -H "Host: FUZZ.sitio" -w subdominios.txt -fs 0', 'Si el mismo servidor sirve webs distintas por la cabecera Host, un vhost oculto (dev, staging) suele ser menos seguro.'],
    ['Busca parámetros ocultos', 'ffuf -u "http://sitio/pagina?FUZZ=1" -w params.txt -fw 42', 'Un parámetro como `?debug=1` o `?admin=true` puede cambiar por completo el comportamiento de la página.'],
  ],
  defense: 'No confíes en que algo «no esté enlazado»: elimina backups y ficheros temporales del docroot, protege /admin con autenticación y red, bloquea el acceso a .git/.env, y vigila en los logs los picos de 404 (señal de fuzzing, como en la práctica de logs del N2).',
  quiz: [['Encuentras que la web responde 200 a cualquier ruta. ¿Cómo distingues lo real?', ['No se puede', 'Filtrando por tamaño o número de palabras de la respuesta (-fs/-fw)', 'Escaneando puertos'], 1, 'Las respuestas falsas suelen tener el mismo tamaño: se filtran con -fs/-fw.'],
         ['¿Qué revela el fuzzing de virtual hosts?', ['Puertos abiertos', 'Webs distintas servidas por la misma IP según la cabecera Host', 'Usuarios del sistema'], 1, 'Un mismo servidor puede alojar varios sitios seleccionados por el Host; algunos ocultos y vulnerables.']],
  challenge: 'Contra Juice Shop y DVWA del laboratorio, descubre con ffuf/feroxbuster al menos cinco rutas no enlazadas y un parámetro oculto. Documenta el diccionario y los filtros usados.',
  refs: [['SecLists', 'https://github.com/danielmiessler/SecLists'], ['feroxbuster', 'https://github.com/epi052/feroxbuster'], ['ffuf', 'https://github.com/ffuf/ffuf']] },
{ id: 'rec-04', t: 'Enumeración de API y toma de huella de tecnología', min: 55, labs: ['web'],
  obj: ['Descubrir y leer la especificación de una API (Swagger/OpenAPI)', 'Identificar tecnología y versión por huellas sutiles', 'Lanzar comprobaciones conocidas con nuclei de forma dirigida'],
  theory: `Las aplicaciones modernas son **API + front**. La API suele documentarse sola:

- **Swagger / OpenAPI** en \`/swagger\`, \`/api-docs\`, \`/openapi.json\`: te da **todos** los endpoints, parámetros y métodos. Un regalo para el pentester.
- **Huella de tecnología**: cabeceras (\`Server\`, \`X-Powered-By\`), cookies (\`PHPSESSID\`, \`JSESSIONID\`), el **hash del favicon** (identifica el producto exacto), rutas típicas de cada framework.
- **nuclei**: miles de plantillas de la comunidad para comprobar fallos **conocidos**; úsalo dirigido (por tags y severidad), no a ciegas.

La toma de huella decide el resto del ataque: no es lo mismo una API Node con JWT que un panel PHP antiguo.`,
  steps: [
    ['Busca la especificación de la API', 'ffuf -u http://127.0.0.1:8223/FUZZ -w api-endpoints.txt -mc 200', 'VAmPI expone sus endpoints; busca `/openapi.json` o `/swagger`. Con la spec tienes el mapa completo de la API.'],
    ['Toma de huella', 'httpx -u http://sitio -title -tech-detect -favicon', 'El `-favicon` calcula el hash del icono: en bases como Shodan identifica el producto y versión exactos.'],
    ['Comprobaciones conocidas dirigidas', 'nuclei -u http://127.0.0.1:8220 -tags exposure,misconfig -severity medium,high', 'Dirígelo por tags: busca exposiciones y malas configuraciones, no 5000 plantillas irrelevantes.'],
    ['Prioriza por la huella', '', 'Una versión concreta + un CVE conocido + endpoint sensible = primer objetivo. Anótalo con su evidencia.'],
  ],
  defense: 'No publiques la especificación de la API en producción, elimina cabeceras que revelan versión, mantén el software parcheado (nuclei comprueba justo lo que un atacante probaría) y pon límites de tasa en los endpoints de la API.',
  quiz: [['¿Por qué es valiosa una ruta /swagger o /openapi.json expuesta?', ['No lo es', 'Documenta todos los endpoints y parámetros de la API', 'Cifra el tráfico'], 1, 'La especificación da el mapa completo de la API, incluidos endpoints no enlazados.'],
         ['¿Cómo deberías usar nuclei contra un objetivo?', ['Todas las plantillas a la vez, siempre', 'Dirigido por tags y severidad según la huella', 'Nunca'], 1, 'Dirigirlo reduce ruido y falsos positivos y va a lo que de verdad aplica.']],
  challenge: 'Enumera la API de VAmPI desde su especificación y prepara en Burp una colección de peticiones a sus endpoints. Toma la huella de Juice Shop por el hash del favicon.',
  refs: [['nuclei templates', 'https://github.com/projectdiscovery/nuclei-templates'], ['httpx', 'https://github.com/projectdiscovery/httpx'], ['OWASP API Security Top 10', 'https://owasp.org/API-Security/']] },
]},
]};
