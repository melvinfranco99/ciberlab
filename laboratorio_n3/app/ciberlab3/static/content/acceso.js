/* N3 · Escritorio 3 — Acceso inicial */
CL.areas.acceso = { id: 'acceso', title: 'Acceso inicial', tagline: 'Cómo entra un adversario: servicio vulnerable, credencial débil o la persona. Entender cada vía para conseguir el primer punto de apoyo… y para cerrarla.',
intro: `## Acceso inicial
El primer punto de apoyo. Tres vías dominan las intrusiones reales:
1. **Explotar un servicio** expuesto y vulnerable.
2. **Credenciales**: reutilizadas, débiles o filtradas (*password spraying*).
3. **La persona**: phishing y abuso de confianza (siempre simulado y autorizado).

En el laboratorio practicas las tres sobre objetivos tuyos. En un cliente, solo lo que esté en el alcance y el RoE.`,
levels: [
{ name: 'Fundamento ofensivo', lessons: [
{ id: 'acc-01', t: 'De la versión al punto de apoyo: explotar un servicio en el laboratorio', min: 65, labs: ['vm', 'web'],
  obj: ['Pasar de «versión detectada» a «shell» con método y seguridad', 'Leer y entender un exploit antes de ejecutarlo', 'Estabilizar la shell obtenida'],
  theory: `Explotar no es «ejecutar un script a ciegas». El operador:

1. **Identifica** el servicio y versión exactos (del recon).
2. **Busca** el fallo conocido: \`searchsploit\`, el CVE, el aviso del fabricante.
3. **Lee** el exploit: ¿qué hace?, ¿contra qué versión?, ¿puede romper el objetivo? Nunca ejecutes contra un sistema (ni de laboratorio) algo que no entiendes.
4. **Prueba** en un objetivo de laboratorio idéntico antes de tocar nada delicado.
5. **Estabiliza** la shell (TTY completa) y se sitúa (el bucle del operador).

> ⚠️ Los exploits públicos de Internet son **código no confiable**: léelos y ejecútalos solo en el laboratorio aislado. Algunos traen *sorpresas* para quien los usa sin mirar.`,
  steps: [
    ['Busca el fallo de la versión detectada', 'searchsploit "nombre servicio" 2.3', 'Contrasta con el CVE oficial. Apunta si el exploit es de ejecución remota (RCE), local o solo denegación de servicio.'],
    ['Lee el exploit antes de usarlo', 'searchsploit -x <ruta>', 'Entiende qué envía y qué espera. Un exploit que no entiendes es un riesgo para ti y para el objetivo.'],
    ['Lanza contra tu objetivo de laboratorio', '', 'Prepara un *listener* para recibir la shell (`nc -lvnp 4444` o un handler de Metasploit) y ejecuta. Confirma con `id`/`whoami`.'],
    ['Estabiliza la shell', "python3 -c 'import pty;pty.spawn(\"/bin/bash\")'", 'Luego `Ctrl-Z`, `stty raw -echo; fg`, `export TERM=xterm`. Ahora tienes una terminal usable (flechas, autocompletado, Ctrl-C).'],
  ],
  defense: 'La mitigación es aburrida y eficaz: **parchea** (gestión de vulnerabilidades), **reduce superficie** (no expongas lo que no haga falta) y pon un **WAF/EDR** que detecte el patrón de explotación y la shell saliente (conexión inusual desde un servidor a un puerto alto externo).',
  quiz: [['Antes de ejecutar un exploit público de Internet contra tu laboratorio, ¿qué haces primero?', ['Ejecutarlo tal cual, rápido', 'Leerlo y entender qué hace', 'Subirlo a producción'], 1, 'El código de terceros es no confiable: léelo siempre; algunos exploits atacan a quien los usa.'],
         ['Una "shell estabilizada" te permite…', ['Nada distinto', 'Usar flechas, Ctrl-C y autocompletado como una terminal normal', 'Saltarte la autenticación'], 1, 'Estabilizar da una TTY completa, mucho más cómoda y fiable.']],
  challenge: 'En una máquina vulnerable de laboratorio (HTB retirada o VulnHub), pasa de recon a shell estable documentando cada decisión. Escribe dos líneas de «cómo se habría evitado» para el informe.',
  refs: [['Exploit-DB', 'https://www.exploit-db.com/'], ['HackTricks · Shells', 'https://book.hacktricks.xyz/generic-methodologies-and-resources/shells/full-ttys'], ['NVD (CVE)', 'https://nvd.nist.gov/']] },
]},
{ name: 'Operador', lessons: [
{ id: 'acc-02', t: 'Password spraying y abuso de credenciales (con sigilo y sin bloquear cuentas)', min: 55, labs: ['vm'],
  obj: ['Entender spraying vs. fuerza bruta y por qué el spraying funciona', 'Respetar las políticas de bloqueo para no causar daño', 'Validar credenciales en los servicios correctos'],
  theory: `La **fuerza bruta** prueba muchas contraseñas contra **una** cuenta (bloquea la cuenta y hace ruido). El **password spraying** prueba **una** contraseña muy probable (\`Primavera2026!\`, \`Empresa2026\`) contra **muchas** cuentas, despacio, respetando el umbral de bloqueo. Es como entra de verdad un atacante en dominios con MFA incompleto.

Claves del spraying responsable:
- Conoce la **política de bloqueo** (p. ej. 5 intentos / 30 min) y quédate **por debajo** (1 intento por cuenta y ventana).
- Usa una lista de usuarios **real** (del recon) y contraseñas **estacionales/temáticas**.
- Prueba contra el servicio adecuado (portal OWA, VPN, SMB del dominio).

> Bloquear a cientos de empleados por un spraying mal medido es un incidente que tú causas: va contra el RoE.`,
  steps: [
    ['Averigua la política de bloqueo', 'crackmapexec smb 192.168.59.10 --pass-pol', 'Si no la conoces, asume lo más conservador: 1 intento por cuenta cada varias horas.'],
    ['Prepara usuarios y una contraseña', '', 'Usuarios: los del recon (`usuarios.txt`). Contraseña única y probable por ronda. Nunca una lista larga por cuenta.'],
    ['Spray lento contra el dominio', 'crackmapexec smb 192.168.59.10 -u usuarios.txt -p "Primavera2026!" --continue-on-success', 'Un acierto aparece como `[+]`. En un ejercicio real, espaciarías las rondas horas.'],
    ['Valida y sitúate', 'crackmapexec smb 192.168.59.10 -u usuario -p "Primavera2026!"', 'Con una credencial válida, pasa al escritorio de Active Directory: ya eres un usuario del dominio.'],
  ],
  defense: 'Contra el spraying: **MFA en todo** portal externo, políticas de contraseña que impidan las estacionales, detección de *many-accounts-one-password* (muchos 4625/4771 con la misma hora y origen) y bloqueo inteligente que no se deje usar como DoS.',
  quiz: [['¿Por qué el password spraying evita bloquear cuentas?', ['Porque usa MFA', 'Porque prueba una sola contraseña por cuenta y ventana', 'Porque es más rápido'], 1, 'Al no superar el umbral de intentos por cuenta, no dispara el bloqueo.'],
         ['Mejor defensa de una sola medida contra el spraying:', ['Cambiar el puerto', 'MFA en los accesos externos', 'Ocultar el portal'], 1, 'Aunque acierten la contraseña, sin el segundo factor no entran.']],
  challenge: 'En el lab, mide la política de bloqueo y haz un spray de una contraseña contra 10 usuarios sin bloquear a nadie. Revisa en el visor de eventos del DC qué EventID generaste (4625/4771).',
  refs: [['CrackMapExec/NetExec', 'https://www.netexec.wiki/'], ['The Hacker Recipes · Spraying', 'https://www.thehacker.recipes/ad/movement/credentials/spraying'], ['MITRE T1110.003', 'https://attack.mitre.org/techniques/T1110/003/']] },
]},
{ name: 'Experto', lessons: [
{ id: 'acc-03', t: 'Ingeniería social y phishing simulado (autorizado y medido)', min: 60, labs: [],
  obj: ['Entender por qué el phishing sigue siendo la vía de entrada número uno', 'Montar una campaña de phishing SIMULADO en laboratorio con GoPhish', 'Medir resultados y convertirlos en formación, no en castigo'],
  theory: `La persona es la superficie de ataque más rentable. En un Red Team, el phishing se hace **simulado, autorizado y medido**, nunca contra terceros ni con pretextos dañinos.

Anatomía de una campaña simulada:
- **Pretexto** creíble y dentro del RoE (p. ej. «renueva tu acceso al portal interno»). Sin miedo excesivo ni temas sensibles (salud, despidos).
- **Infraestructura**: dominio parecido, página de aterrizaje que **solo registra** el clic/credencial de prueba, nunca la real.
- **Métricas**: % de apertura, de clic, de envío de credenciales, tiempo hasta el primer reporte al SOC.

El objetivo es medir y **mejorar**: el dato valioso no es «cuántos picaron» sino «cuánto tardó alguien en avisar» y «funcionó el doble factor».`,
  steps: [
    ['Levanta GoPhish en el laboratorio', 'docker run -d --name gophish -p 127.0.0.1:3333:3333 -p 127.0.0.1:8080:80 gophish/gophish', 'Panel en https://127.0.0.1:3333. Todo se queda en tu laboratorio: destinatarios de prueba que creas tú.'],
    ['Diseña plantilla y landing', '', 'Correo con pretexto aprobado y una landing que **captura solo un indicador** (clic o credencial ficticia). Nunca una web que robe credenciales reales de un servicio.'],
    ['Lanza contra buzones de prueba', '', 'Destinatarios = cuentas de laboratorio. Observa las métricas en tiempo real en GoPhish.'],
    ['Convierte en formación', '', 'Quien pica recibe formación, no una regañina. El informe propone MFA, filtrado y un botón de «reportar phishing» si tarda demasiado el aviso.'],
  ],
  defense: 'MFA resistente a phishing (FIDO2), filtrado de correo y de dominios parecidos, banners de correo externo, formación continua y un canal fácil para reportar. La métrica que importa al Blue Team es el **tiempo de detección y reporte**, no humillar a quien hace clic.',
  quiz: [['En un phishing simulado ético, la landing debe…', ['Robar la contraseña real del empleado', 'Registrar solo un indicador de prueba, sin capturar credenciales reales', 'Instalar malware'], 1, 'Se mide el comportamiento sin poner en riesgo credenciales reales.'],
         ['La métrica más útil de una campaña no es el % que pica, sino…', ['El color del correo', 'El tiempo hasta que alguien reporta al SOC y si el MFA aguantó', 'El tamaño de la imagen'], 1, 'Mide la capacidad real de detección y respuesta de la organización.']],
  challenge: 'Monta una campaña de GoPhish en el lab con 5 buzones de prueba, un pretexto aprobado y una landing que solo registra el clic. Redacta el informe centrado en mejoras, no en culpables.',
  refs: [['GoPhish', 'https://getgophish.com/'], ['MITRE · Phishing T1566', 'https://attack.mitre.org/techniques/T1566/'], ['FIDO2 / passkeys', 'https://fidoalliance.org/']] },
{ id: 'acc-04', t: 'De la web al punto de apoyo: subida de ficheros, LFI y secretos en repos', min: 70, labs: ['web'],
  obj: ['Convertir un fallo web en ejecución de comandos (foothold)', 'Encadenar LFI con otras piezas hacia RCE', 'Encontrar credenciales filtradas en el código'],
  theory: `No todo acceso inicial viene de un exploit de servicio: muchas veces es la **propia web** la que te da la shell:

- **Subida de ficheros insegura**: si puedes subir un \`.php\`/\`.jsp\` y que el servidor lo ejecute, tienes una webshell. Se abusa de validaciones débiles (solo extensión, solo \`Content-Type\`).
- **LFI (Local File Inclusion)**: la web incluye un fichero que tú controlas (\`?page=../../etc/passwd\`). Encadenado con logs envenenados o \`php://filter\`/\`data://\` puede llegar a RCE.
- **Secretos en el repositorio**: un \`.git\` expuesto o un repo con claves. **gitleaks** encuentra tokens y contraseñas en el historial.

El objetivo sigue siendo un **foothold estable** y documentado, demostrando el impacto sin dañar.`,
  steps: [
    ['Prueba la subida de ficheros', '', 'En DVWA (File Upload) sube una webshell mínima sorteando el filtro (doble extensión, Content-Type manipulado). Confirma ejecutando `id` desde la webshell.'],
    ['Explota una LFI de laboratorio', 'curl "http://sitio/index.php?page=php://filter/convert.base64-encode/resource=config"', 'Con `php://filter` lees el código fuente (y sus credenciales) en base64 sin ejecutarlo. Documenta hasta dónde llega.'],
    ['Busca un .git expuesto', 'git-dumper http://sitio/.git/ ./repo_filtrado', 'Si el `.git` está publicado, reconstruyes el repositorio y, con él, su historial de credenciales.'],
    ['Caza secretos en el código', 'gitleaks detect --source ./repo_filtrado -v', 'Tokens, claves de API y contraseñas en el historial son un acceso inicial directo a otros sistemas.'],
  ],
  defense: 'Validación estricta de subidas (lista blanca de tipos, renombrar, servir desde un dominio sin ejecución), desactivar wrappers peligrosos de PHP, nunca incluir ficheros por parámetro de usuario, bloquear el acceso a `.git`, y escanear los repos con gitleaks en el pipeline (DevSecOps del N2).',
  quiz: [['`php://filter/convert.base64-encode` en una LFI sirve para…', ['Ejecutar comandos', 'Leer el código fuente (y sus secretos) sin ejecutarlo', 'Cifrar la web'], 1, 'Devuelve el fichero codificado: lees la fuente y sus credenciales.'],
         ['Un `.git` accesible por web permite…', ['Nada', 'Reconstruir el repositorio y su historial de secretos', 'Apagar el servidor'], 1, 'git-dumper reconstruye el repo; gitleaks saca las credenciales del historial.']],
  challenge: 'En DVWA consigue una webshell por la subida de ficheros y, por separado, lee un fichero sensible por LFI. Escribe ambos hallazgos con PoC mínima, impacto y remediación.',
  refs: [['HackTricks · File Upload', 'https://book.hacktricks.xyz/pentesting-web/file-upload'], ['HackTricks · LFI', 'https://book.hacktricks.xyz/pentesting-web/file-inclusion'], ['gitleaks', 'https://github.com/gitleaks/gitleaks']] },
]},
]};
