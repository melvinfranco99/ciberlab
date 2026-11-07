/* Escritorio 3 — Hacking web */
CL.areas.web = { id: 'web', title: 'Hacking web', tagline: 'Cómo funcionan las aplicaciones web, por qué fallan y cómo se auditan.',
intro: `Esta área explica la metodología y los conceptos. La práctica de explotación se hace en los **laboratorios guiados**:
- **PortSwigger Web Security Academy** (gratuita, la referencia mundial), con laboratorios para cada tipo de fallo.
- Los laboratorios Docker de CiberLab (**DVWA, Juice Shop, WebGoat, bWAPP, VAmPI, DVGA**), que traen sus propias guías y pistas.

Para cada vulnerabilidad, consulta también su ficha en el escritorio 4 (qué es, detección y defensa).`,
levels: [
{ name: 'Principiante', lessons: [
{ id: 'we-01', t: 'Cómo funciona la web: HTTP, cookies y sesiones', min: 45, labs: ['host'],
  obj: ['Leer una petición y una respuesta HTTP', 'Entender cookies, sesiones y cabeceras de seguridad'],
  steps: [['Ver una petición y su respuesta', '$ curl -v https://example.com 2>&1 | head -30', 'Líneas `>`: lo que envías. Líneas `<`: lo que responde el servidor.'],
    ['Cabeceras de seguridad', '$ curl -sI https://www.incibe.es | grep -iE "strict|content-security|x-frame|x-content|set-cookie"', 'Fíjate en los atributos `Secure`, `HttpOnly` y `SameSite` de las cookies.'],
    ['Herramientas de desarrollador', '', 'En el navegador, F12 → Red. Recarga y observa cada petición, sus cabeceras y sus cookies.']],
  challenge: 'Completa en PortSwigger Academy el temario introductorio y apunta la diferencia entre autenticación y autorización.',
  refs: [['MDN — Visión general de HTTP', 'https://developer.mozilla.org/es/docs/Web/HTTP/Overview']] },
{ id: 'we-02', t: 'Tu proxy de auditoría: Burp Suite o OWASP ZAP', min: 45, labs: ['dvwa', 'juice-shop'],
  obj: ['Interceptar y repetir peticiones', 'Organizar una auditoría web con el proxy'],
  steps: [['Instalar', '$ yay -S burpsuite   # o: zaproxy', 'O usa la versión incluida en Kali.'],
    ['Navegador del proxy', '', 'Usa el navegador integrado de Burp (pestaña Proxy → Open browser). Así no tocas tu navegador personal.'],
    ['Arrancar un laboratorio', '', 'Laboratorio → Docker → **Juice Shop** → Iniciar, y ábrelo desde el navegador de Burp.'],
    ['Mapear la aplicación', '', 'Navega por toda la tienda. En Target → Site map verás cada ruta y parámetro: es tu inventario de pruebas.']],
  challenge: 'Haz el mapa completo de Juice Shop: lista en tus apuntes todas las rutas de la API que descubras.' },
{ id: 'we-03', t: 'OWASP Top 10: el mapa de riesgos web', min: 40, labs: [],
  obj: ['Conocer las 10 categorías y un ejemplo de cada una'],
  theory: `| # | Categoría (2021) | Ficha relacionada |
|---|---|---|
| A01 | Control de acceso roto | [IDOR](#/vulns/idor) |
| A02 | Fallos criptográficos | [Criptografía débil](#/vulns/crypto) |
| A03 | Inyección | [SQLi](#/vulns/sqli), [XSS](#/vulns/xss), [Inyección de comandos](#/vulns/cmdi) |
| A04 | Diseño inseguro | — |
| A05 | Configuración incorrecta | [Configuración por defecto](#/vulns/misconfig) |
| A06 | Componentes vulnerables | [Software desactualizado](#/vulns/outdated) |
| A07 | Fallos de autenticación | [Autenticación débil](#/vulns/auth) |
| A08 | Integridad de software y datos | [Deserialización insegura](#/vulns/deser) |
| A09 | Fallos de registro y monitorización | Área Blue Team |
| A10 | SSRF | [SSRF](#/vulns/ssrf) |`,
  refs: [['OWASP Top 10', 'https://owasp.org/Top10/es/']] },
]},
{ name: 'Intermedio', lessons: [
{ id: 'we-04', t: 'Metodología de auditoría web (OWASP WSTG)', min: 50, labs: ['juice-shop', 'webgoat'],
  obj: ['Seguir una metodología completa y repetible'],
  theory: `Fases de la OWASP Web Security Testing Guide:
1. **Recopilación de información**: tecnologías, rutas, parámetros.
2. **Configuración y despliegue**: ficheros expuestos, métodos HTTP, cabeceras.
3. **Gestión de identidades y autenticación**: registro, recuperación de contraseña, bloqueo.
4. **Autorización**: ¿puede un usuario ver o modificar datos de otro?
5. **Gestión de sesiones**: cookies, expiración, CSRF.
6. **Validación de entradas**: inyecciones de todo tipo.
7. **Lógica de negocio**: precios, cupones, flujos saltables.
8. **Lado cliente**: XSS basado en DOM, almacenamiento local.`,
  challenge: 'Haz una auditoría de práctica de Juice Shop en el programa de **Auditorías**, siguiendo estas 8 fases y redactando cada hallazgo.',
  refs: [['OWASP WSTG', 'https://owasp.org/www-project-web-security-testing-guide/']] },
{ id: 'we-05', t: 'Seguridad de APIs (OWASP API Top 10)', min: 50, labs: ['vampi', 'dvga'],
  obj: ['Conocer los riesgos propios de las APIs REST y GraphQL'],
  theory: 'Los fallos más frecuentes en APIs: **autorización a nivel de objeto** (BOLA), autenticación rota, exposición excesiva de datos, falta de límites de uso y **asignación masiva** de propiedades. VAmPI y DVGA están diseñadas para practicarlos y traen documentación de cada reto.',
  challenge: 'Lee la documentación de VAmPI y resuelve sus retos con el proxy. Documenta cada uno como hallazgo con su CVSS.',
  refs: [['OWASP API Security Top 10', 'https://owasp.org/API-Security/']] },
]},
{ name: 'Avanzado', lessons: [
{ id: 'we-06', t: 'Desarrollo seguro: corregir en el código', min: 60, labs: [],
  obj: ['Saber cómo se corrige cada clase de fallo en el código', 'Integrar herramientas automáticas en CI/CD'],
  theory: `| Fallo | Corrección de raíz |
|---|---|
| Inyección SQL | Consultas parametrizadas / ORM |
| XSS | Codificación de salida según el contexto + CSP |
| Control de acceso | Comprobación de autorización en el servidor en cada petición |
| SSRF | Lista de destinos permitidos y bloqueo de redes internas |
| Subida de ficheros | Lista blanca de tipos, renombrar, guardar fuera de la raíz web |

Automatiza con **Semgrep** (SAST), **Trivy / Dependabot** (dependencias), **gitleaks** (secretos) y **ZAP** (DAST) en el pipeline.`,
  steps: [['Analizar un proyecto propio', '$ pipx install semgrep\n$ semgrep --config auto ruta/a/tu/proyecto', '']],
  challenge: 'Ejecuta Semgrep y gitleaks sobre un proyecto tuyo y corrige lo que salga.' },
]},
{ name: 'Experto', lessons: [
{ id: 'we-07', t: 'Bug bounty y la certificación de hacking web', min: 30, labs: [],
  obj: ['Saber cómo empezar en bug bounty de forma legal'],
  theory: 'Antes de participar en programas reales: termina todos los laboratorios *Apprentice* y *Practitioner* de PortSwigger. Después elige programas con alcance amplio en HackerOne, Intigriti o YesWeHack, **lee su política completa** y respeta el alcance al pie de la letra. Certificaciones: BSCP (Burp Suite Certified Practitioner), OSWE, CWES.',
  challenge: 'Completa 30 laboratorios de PortSwigger Academy y escribe una nota de cada uno.' },
]},
]};
