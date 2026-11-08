/* N3 · Escritorio 7 — Explotación web avanzada */
CL.areas.webexp = { id: 'webexp', title: 'Explotación web avanzada', tagline: 'Más allá del OWASP Top 10 básico: SSRF, deserialización, SSTI, cadenas de fallos y lógica de negocio. Practicado en labs creados para ello.',
intro: `## Explotación web avanzada
El N1 cubrió inyección SQL y XSS clásicos. El N3 va a lo que encuentra un pentester web senior: **cadenas** de fallos que, encadenados, dan RCE o acceso interno. Practica en **PortSwigger Web Security Academy** (gratis), **Juice Shop** y los labs del N1, nunca contra webs ajenas sin permiso.`,
levels: [
{ name: 'Operador', lessons: [
{ id: 'web-01', t: 'SSRF: cuando el servidor hace peticiones por ti', min: 60, labs: ['web'],
  obj: ['Entender la SSRF y por qué es tan grave en la nube', 'Encontrar y confirmar una SSRF', 'Mapear su impacto (metadatos cloud, red interna)'],
  theory: `**SSRF** (*Server-Side Request Forgery*): consigues que el **servidor** haga una petición HTTP al destino que tú eliges. Grave porque el servidor suele estar en una red interna de confianza:

- **Metadatos cloud**: \`http://169.254.169.254/\` en AWS/GCP/Azure entrega credenciales temporales de la instancia. Una SSRF puede convertirse en acceso a toda la cuenta cloud.
- **Red interna**: sondear \`http://192.168.x.x\`, servicios internos sin autenticar, paneles de administración.
- **Bypass de filtros**: redirecciones, notación decimal de IP, \`[::]\`, DNS rebinding.

Dónde aparece: funciones que «traen» una URL (importar imagen por URL, webhooks, generadores de PDF, previsualizadores de enlaces).`,
  steps: [
    ['Encuentra un parámetro que "trae" una URL', '', 'Importar por URL, avatar remoto, webhook. Pon una URL tuya (p. ej. un `nc -lvnp 80` o un Burp Collaborator) y mira si el servidor te llama.'],
    ['Confirma la SSRF', '', 'Si recibes la petición desde la IP del servidor, es SSRF. Apunta el `User-Agent` y la IP de origen como evidencia.'],
    ['Mide el impacto interno', '', 'Prueba a apuntar a `http://127.0.0.1:puerto` y a los metadatos cloud (en un lab cloud). Documenta hasta dónde llega SIN extraer datos reales si es un cliente.'],
    ['Reporta con impacto', '', 'Una SSRF «a secas» es media; una SSRF que lee credenciales cloud es crítica. El informe debe mostrar el salto, no solo el eco.'],
  ],
  defense: 'Lista blanca de destinos, bloquear IPs internas y `169.254.169.254`, usar IMDSv2 (metadatos con token) en AWS, resolver y validar el host tras seguir redirecciones, y segmentar para que el servidor web no alcance servicios internos sensibles.',
  quiz: [['¿Por qué una SSRF es especialmente crítica en la nube?', ['Por nada en particular', 'Puede leer el endpoint de metadatos y robar credenciales de la instancia', 'Hace la web más lenta'], 1, 'El endpoint 169.254.169.254 entrega credenciales temporales: SSRF → acceso cloud.'],
         ['En una SSRF, ¿quién hace la petición al destino que eliges?', ['Tu navegador', 'El servidor vulnerable', 'El DNS'], 1, 'El servidor la hace por ti, desde su posición de red privilegiada.']],
  challenge: 'Completa el módulo de SSRF de la PortSwigger Web Security Academy (labs gratuitos) y reproduce una SSRF que alcance un servicio interno. Escríbelo como un hallazgo de informe con impacto y remediación.',
  refs: [['PortSwigger · SSRF', 'https://portswigger.net/web-security/ssrf'], ['OWASP · SSRF', 'https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/'], ['HackTricks · SSRF', 'https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery']] },
]},
{ name: 'Experto', lessons: [
{ id: 'web-02', t: 'SSTI y deserialización insegura: del input a la ejecución de código', min: 75, labs: ['web'],
  obj: ['Reconocer inyección en plantillas del lado servidor (SSTI)', 'Entender por qué deserializar datos no confiables es peligroso', 'Encadenar hasta RCE en un laboratorio'],
  theory: `Dos familias que suelen acabar en **ejecución remota de código (RCE)**:

**SSTI (Server-Side Template Injection)** — La app mete tu input en una plantilla (Jinja2, Twig, Freemarker…) y la **evalúa**. Si \`{{7*7}}\` devuelve \`49\`, estás en el motor de plantillas, y de ahí se suele llegar a ejecutar comandos. Aparece cuando se construyen plantillas concatenando entrada de usuario.

**Deserialización insegura** — La app convierte datos externos (una cookie, un parámetro) en **objetos** sin validar. Con *gadgets* (clases presentes en la app) un objeto manipulado puede desencadenar ejecución de código al deserializarse. Clásico en Java (ysoserial), PHP (\`__wakeup\`/POP chains), .NET y Python (\`pickle\`).

Lo relevante para el operador: **detectarlas y demostrar el impacto con una prueba mínima** (p. ej. un \`id\` o un *sleep*), sin lanzar payloads destructivos.`,
  steps: [
    ['Detecta SSTI con una sonda inocua', '', 'Prueba `${7*7}`, `{{7*7}}`, `<%= 7*7 %>` según el motor. Si el 49 aparece renderizado, hay evaluación del lado servidor.'],
    ['Identifica el motor y escala en el lab', '', 'Cada motor tiene su camino a RCE. En un lab, demuéstralo con `id` o un retardo. Guarda la petición exacta como evidencia.'],
    ['Deserialización: localiza el dato serializado', '', 'Cookies o parámetros que parecen objetos (base64 de datos binarios, firmas). Con herramientas como ysoserial (Java) en el lab, demuestra la ejecución controlada.'],
    ['Informa con una PoC mínima', '', 'La prueba de concepto debe ser la menos dañina que demuestre el fallo. Nada de borrar datos ni tumbar el servicio para «probar».'],
  ],
  defense: 'No construyas plantillas con entrada de usuario (sepáralas de los datos), usa *sandboxing* del motor de plantillas, y **no deserialices datos no confiables**: usa formatos de datos (JSON) en vez de serialización de objetos, firma e integridad en lo que venga del cliente, y listas blancas de clases permitidas.',
  quiz: [['`{{7*7}}` devuelve `49` en la respuesta. ¿Qué indica?', ['Un error de red', 'Probable SSTI: el servidor evalúa la plantilla con tu input', 'Que la web es segura'], 1, 'La evaluación de tu expresión delata inyección en la plantilla del servidor.'],
         ['Regla de oro contra la deserialización insegura:', ['Deserializar más rápido', 'No deserializar datos no confiables; preferir JSON y validar', 'Cifrar la base de datos'], 1, 'El origen del problema es convertir en objetos datos que controla el atacante.']],
  challenge: 'Haz los labs de SSTI y de deserialización de la PortSwigger Academy. Para uno de ellos, redacta el hallazgo completo (descripción, PoC mínima, impacto, CVSS y remediación) listo para el informe.',
  refs: [['PortSwigger · SSTI', 'https://portswigger.net/web-security/server-side-template-injection'], ['PortSwigger · Insecure deserialization', 'https://portswigger.net/web-security/deserialization'], ['OWASP Testing Guide', 'https://owasp.org/www-project-web-security-testing-guide/']] },
]},
{ name: 'Maestría', lessons: [
{ id: 'web-03', t: 'Autenticación rota, JWT e IDOR/BOLA: romper el control de acceso', min: 70, labs: ['web'],
  obj: ['Atacar implementaciones débiles de JWT', 'Encontrar IDOR/BOLA (acceder a datos de otros)', 'Entender que el control de acceso es el fallo web nº1 (OWASP A01)'],
  theory: `El fallo más común de la web moderna es el **control de acceso roto** (OWASP A01). Tres clásicos:

- **JWT débil**: tokens firmados mal. Ataques: \`alg:none\` (sin firma), secreto HMAC débil y crackeable, confusión de algoritmo (RS256→HS256 usando la clave pública como secreto), \`kid\`/\`jku\` manipulables.
- **IDOR / BOLA**: \`/api/factura/1002\` → cambias a \`1003\` y ves la de otro. El servidor no comprueba que el objeto sea **tuyo**. Es el fallo nº1 de las APIs.
- **Escalada de privilegios**: parámetros como \`role=admin\`, endpoints de administración sin comprobación por rol.

Todo se demuestra en el laboratorio con una PoC mínima: ver un dato ajeno de prueba basta; no se extraen datos reales en un cliente.`,
  steps: [
    ['Analiza el JWT', '', 'Pega el token en jwt.io o `jwt_tool`. Mira el `alg` y los claims. Prueba `alg:none` y, si es HS256, crackea el secreto con hashcat (modo 16500) usando un diccionario.'],
    ['Busca IDOR/BOLA en la API', '', 'En VAmPI/Juice Shop, autentícate como usuario A e intenta leer recursos de usuario B cambiando el identificador. Burp Repeater/Intruder lo automatiza.'],
    ['Prueba escalada por parámetro', '', 'Repite peticiones de administración con tu sesión de usuario normal; manipula `role`/`isAdmin`. Si funciona, el control de acceso se hace solo en el front.'],
    ['Reporta con impacto', '', 'Un IDOR que expone datos de todos los clientes es crítico. PoC mínima (un registro ajeno de prueba), impacto y remediación (comprobación de propiedad en el servidor).'],
  ],
  defense: 'Comprueba la **propiedad** de cada objeto en el servidor (no confíes en el ID del cliente), valida el rol en el backend, firma JWT con algoritmo fijo y secreto fuerte (o usa sesiones del servidor), rechaza `alg:none`, y aplica control de acceso por defecto denegado. Añade pruebas de autorización en el CI.',
  quiz: [['Cambias `/api/pedido/1002` por `1003` y ves el pedido de otro. Eso es…', ['XSS', 'IDOR/BOLA (control de acceso roto)', 'SQLi'], 1, 'El servidor no verifica que el objeto te pertenezca: IDOR/BOLA, fallo nº1 de APIs.'],
         ['Un JWT que acepta `alg:none`…', ['Es seguro', 'Acepta tokens sin firma: puedes forjar cualquier identidad', 'Va más rápido'], 1, 'Sin firma, el servidor confía en lo que tú escribas en el token.']],
  challenge: 'En VAmPI explota un BOLA para leer datos de otro usuario y, en un JWT de laboratorio, demuestra `alg:none` o el crackeo del secreto HMAC. Redacta ambos como hallazgos con remediación.',
  refs: [['PortSwigger · JWT', 'https://portswigger.net/web-security/jwt'], ['OWASP API1 BOLA', 'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/'], ['jwt_tool', 'https://github.com/ticarpi/jwt_tool']] },
{ id: 'web-04', t: 'Cadenas que acaban en RCE: traversal, smuggling y SSRF a la nube', min: 80, labs: ['web'],
  obj: ['Encadenar fallos individuales en un impacto grave', 'Entender el HTTP request smuggling a alto nivel', 'Rematar la cadena SSRF → metadatos → credenciales cloud'],
  theory: `El pentester senior no busca un fallo aislado, sino **cadenas**:

- **Path traversal / LFI → RCE**: leer ficheros arbitrarios (\`../../etc/passwd\`) y, encadenado con subida o envenenamiento de logs, ejecutar código.
- **HTTP request smuggling**: cuando el front-end (proxy/CDN) y el back-end interpretan de forma distinta dónde acaba una petición (\`Content-Length\` vs \`Transfer-Encoding\`), «cuelas» una petición dentro de otra: envenenas respuestas, saltas controles, robas peticiones de otros usuarios.
- **SSRF → cloud**: la SSRF del nivel operador se remata leyendo el endpoint de metadatos (\`169.254.169.254\`) y obteniendo **credenciales temporales** de la instancia → acceso a la cuenta cloud (enlaza con el escritorio de Nube).

La gracia es sumar: un traversal «medio» + un log accesible = RCE «crítico». El informe debe contar la **cadena**, no las piezas sueltas.`,
  steps: [
    ['Path traversal a lectura de ficheros', 'curl "http://sitio/descarga?file=../../../../etc/passwd"', 'Confirma la lectura arbitraria. Luego valora si puedes escribir donde el servidor ejecuta (logs, uploads) para escalar a RCE.'],
    ['Detecta request smuggling', '', 'Con la extensión HTTP Request Smuggler de Burp, prueba desincronización CL.TE/TE.CL contra un objetivo de laboratorio. Nunca contra infraestructura ajena.'],
    ['Remata la SSRF en la nube', 'curl --resolve ... "http://sitio/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"', 'En un lab cloud (o con IMDSv1 simulado), la SSRF entrega credenciales de la instancia. Pasa al escritorio de Nube para usarlas.'],
    ['Cuenta la cadena en el informe', '', 'Dibuja: SSRF → metadatos → credenciales → acción en la cuenta cloud. El impacto combinado es lo que mueve a la organización a arreglarlo.'],
  ],
  defense: 'Normaliza y valida rutas (nada de ficheros por entrada de usuario), homogeneiza el parsing HTTP entre front y back (HTTP/2 extremo a extremo, rechazar peticiones ambiguas), IMDSv2 con token obligatorio, listas blancas de destino en funciones que «traen» URLs, y segmentar para que el servidor no alcance servicios internos.',
  quiz: [['El HTTP request smuggling explota que…', ['El servidor va lento', 'Front-end y back-end interpretan distinto dónde acaba la petición', 'El TLS es débil'], 1, 'La desincronización (CL vs TE) permite colar una petición dentro de otra.'],
         ['¿Qué convierte una SSRF «media» en crítica en la nube?', ['El color del botón', 'Leer el endpoint de metadatos y obtener credenciales de la instancia', 'Nada'], 1, 'Las credenciales de la instancia dan acceso a la cuenta cloud: impacto crítico.']],
  challenge: 'Encadena en laboratorio un path traversal con otra pieza hasta RCE, y por separado reproduce una SSRF que llegue a un endpoint de metadatos simulado. Documenta cada cadena de principio a fin.',
  refs: [['PortSwigger · Request smuggling', 'https://portswigger.net/web-security/request-smuggling'], ['PortSwigger · Path traversal', 'https://portswigger.net/web-security/file-path-traversal'], ['AWS IMDSv2', 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html']] },
]},
]};
