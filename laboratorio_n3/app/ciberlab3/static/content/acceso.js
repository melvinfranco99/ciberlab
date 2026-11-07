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
]};
