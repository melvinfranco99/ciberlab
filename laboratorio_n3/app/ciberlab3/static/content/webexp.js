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
]};
