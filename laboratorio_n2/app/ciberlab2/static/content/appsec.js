/* N2 · Escritorio 3 — AppSec y DevSecOps */
CL.areas.appsec = { id: 'appsec', title: 'AppSec y DevSecOps', tagline: 'Encontrar fallos en el código y en la cadena de suministro antes de que lleguen a producción.',
intro: `En el N1 viste los fallos web desde fuera. En el N2 los buscas **desde dentro**: revisando código, diseñando autenticación moderna (OAuth2/OIDC, JWT), protegiendo la cadena de suministro y automatizando todo en el pipeline.

Labs de este escritorio (Laboratorio N2 → Docker): **WrongSecrets**, **Gitea**, **Jenkins**, **ZAP** y **MobSF**. Complementa con los temas avanzados de PortSwigger Academy (OAuth, JWT, deserialización, request smuggling, cache poisoning).`,
levels: [
{ name: 'Base N2', lessons: [
{ id: 'as-01', t: 'Revisión de código segura: cómo leer código buscando fallos', min: 90, labs: ['host'],
  obj: ['Seguir el flujo **fuente → sumidero** (source → sink)', 'Reconocer patrones peligrosos en Python, JS, PHP y Java', 'Combinar revisión manual con **Semgrep**'],
  theory: `Método: localiza las **fuentes** (todo lo que controla el usuario: parámetros, cabeceras, ficheros, colas) y los **sumideros** peligrosos. Si un dato llega de una fuente a un sumidero sin validación ni codificación adecuadas, hay un posible fallo.

| Sumidero | Riesgo | Alternativa segura |
|---|---|---|
| \`cursor.execute("..." + x)\` | Inyección SQL | Parámetros \`execute("... %s", (x,))\` |
| \`subprocess.run(x, shell=True)\` | Inyección de comandos | Lista de argumentos, sin shell |
| \`pickle.loads\`, \`yaml.load\` | Deserialización insegura | \`json\`, \`yaml.safe_load\` |
| \`innerHTML = x\` | XSS DOM | \`textContent\`, plantillas que escapan |
| \`requests.get(url_usuario)\` | SSRF | Lista de destinos permitidos |
| \`open(base + nombre)\` | Path traversal | Normalizar y comprobar el prefijo |`,
  steps: [
    ['Instala Semgrep', 'pipx install semgrep', ''],
    ['Clona una app de prácticas', 'cd ~/CiberLab2/scripts && git clone --depth 1 https://github.com/OWASP/NodeGoat.git', 'NodeGoat es una aplicación de OWASP con fallos intencionados para aprender.'],
    ['Escanea con reglas de seguridad', 'semgrep scan --config p/owasp-top-ten --config p/nodejs NodeGoat/ -o ~/CiberLab2/loot/semgrep-nodegoat.txt', ''],
    ['Revisa a mano cada resultado', '', 'Para cada hallazgo: ¿la entrada es realmente controlable por el usuario? ¿hay validación antes? Marca verdaderos y falsos positivos. Esa criba es la habilidad que se paga.'],
    ['Escribe tu propia regla', `cat > ~/CiberLab2/detecciones/semgrep-eval.yml <<'EOF'
rules:
  - id: eval-con-entrada
    languages: [javascript]
    severity: ERROR
    message: eval() con datos de la petición
    patterns:
      - pattern: eval($X)
      - pattern-inside: |
          function $F(req, res, ...) { ... }
EOF
semgrep scan --config ~/CiberLab2/detecciones/semgrep-eval.yml NodeGoat/`, ''],
  ],
  defense: 'Revisión entre pares obligatoria en ramas protegidas, Semgrep en cada *pull request* y formación del equipo con los fallos que aparecen de verdad en su código.',
  challenge: 'Revisa NodeGoat entero y documenta 5 fallos reales con fichero, línea, flujo fuente→sumidero y la corrección propuesta.',
  refs: [['OWASP Code Review Guide', 'https://owasp.org/www-project-code-review-guide/'], ['Semgrep rules registry', 'https://semgrep.dev/r']] },
{ id: 'as-02', t: 'Gestión de secretos: dónde se filtran y cómo evitarlo (WrongSecrets)', min: 60, labs: ['wrongsecrets', 'gitea'],
  obj: ['Encontrar secretos en código, historial de Git, imágenes y variables', 'Usar **gitleaks** y **trivy** para detectarlos', 'Diseñar una gestión de secretos correcta'],
  theory: `Lugares donde aparecen secretos olvidados: código fuente, **historial de Git** (aunque se borre después), capas de imágenes Docker, variables de entorno, logs, ficheros de configuración de CI, apps móviles.

Un secreto expuesto se **revoca y rota**; borrarlo del repositorio no basta (ya está en clones y cachés).`,
  steps: [
    ['Arranca WrongSecrets', '', 'Laboratorio N2 → Docker → **WrongSecrets** → `http://127.0.0.1:8104`. Lee el reto 1.'],
    ['Inspecciona la imagen', 'docker history --no-trunc jeroenwillemsen/wrongsecrets:latest-no-vault | head -30', 'Las instrucciones de construcción pueden contener secretos.'],
    ['Escanea con trivy', 'trivy image --scanners secret jeroenwillemsen/wrongsecrets:latest-no-vault', ''],
    ['Escanea el repositorio con gitleaks', 'git clone https://github.com/OWASP/wrongsecrets.git /tmp/ws && gitleaks git /tmp/ws -v | head -40', 'gitleaks revisa también el historial.'],
    ['Evita que vuelva a pasar', `cat > .pre-commit-config.yaml <<'EOF'
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2
    hooks:
      - id: gitleaks
EOF
pipx install pre-commit && pre-commit install`, 'Ahora cada commit se revisa antes de crearse.'],
  ],
  defense: '- Gestor de secretos (Vault, AWS Secrets Manager, Azure Key Vault, SOPS + age).\n- Identidades de carga de trabajo (OIDC) en lugar de claves estáticas en CI.\n- Escaneo de secretos en pre-commit, en CI y en el registro de imágenes.\n- Rotación automática y alertas de uso anómalo.',
  challenge: 'Resuelve los 10 primeros retos de WrongSecrets y escribe para cada uno dónde estaba el secreto y cómo debería haberse gestionado.',
  refs: [['OWASP WrongSecrets', 'https://github.com/OWASP/wrongsecrets'], ['OWASP Secrets Management Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html']] },
]},
{ name: 'Avanzado', lessons: [
{ id: 'as-03', t: 'OAuth 2.0, OIDC y JWT: diseño seguro y fallos típicos', min: 90, labs: ['online'],
  obj: ['Explicar el flujo **Authorization Code + PKCE**', 'Validar un JWT correctamente', 'Reconocer configuraciones inseguras al auditar'],
  theory: `**OAuth 2.0** delega autorización; **OIDC** añade identidad (el *ID token*). Flujo recomendado hoy para cualquier cliente: **Authorization Code con PKCE**.

Errores que se auditan:
| Fallo | Consecuencia | Corrección |
|---|---|---|
| \`redirect_uri\` sin validación exacta | Robo del código de autorización | Lista exacta de URIs registradas |
| Sin \`state\` / \`nonce\` | CSRF de login, reutilización | Generarlos y comprobarlos |
| JWT con \`alg: none\` aceptado | Tokens falsificados | Fijar el algoritmo esperado en el servidor |
| Confusión RS256/HS256 | Firma con la clave pública como secreto | Librería que exija el tipo de clave |
| No validar \`aud\`, \`iss\`, \`exp\` | Tokens de otra app o caducados válidos | Validar todos los claims |
| Tokens en \`localStorage\` | Robo con XSS | Cookies \`HttpOnly\` + \`SameSite\`, o BFF |`,
  steps: [
    ['Decodifica un JWT (solo lectura)', `TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtLmxvcGV6Iiwicm9sZSI6InVzZXIiLCJleHAiOjE5MDAwMDAwMDB9.firma'
echo "$TOKEN" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null; echo`, 'La carga útil de un JWT **no está cifrada**, solo codificada: nunca guardes datos sensibles en ella.'],
    ['Valida bien en Python', `python3 - <<'EOF'
import jwt  # pip install pyjwt
def validar(token, clave_publica):
    return jwt.decode(token, clave_publica, algorithms=["RS256"],
                      audience="api.corp.lab", issuer="https://sso.corp.lab")
EOF`, 'Algoritmo fijado, audiencia y emisor obligatorios. `exp` se valida por defecto.'],
    ['Practica los fallos', '', 'PortSwigger Academy → *JWT attacks* y *OAuth authentication*: laboratorios guiados y legales.'],
  ],
  defense: 'Usa un proveedor de identidad maduro (Keycloak, Entra ID, Auth0) y librerías certificadas por OpenID; no implementes OAuth a mano.',
  quiz: [['¿Para qué sirve PKCE?', ['Cifrar el JWT', 'Evitar que un código de autorización interceptado se pueda canjear', 'Acelerar el login'], 1, 'El cliente demuestra que es quien inició el flujo con el code_verifier.']],
  challenge: 'Completa los laboratorios de JWT y OAuth de PortSwigger de nivel *Practitioner* y redacta un checklist de auditoría de OAuth de 15 puntos.',
  refs: [['OAuth 2.0 Security Best Current Practice (RFC 9700)', 'https://datatracker.ietf.org/doc/rfc9700/'], ['PortSwigger — JWT attacks', 'https://portswigger.net/web-security/jwt']] },
{ id: 'as-04', t: 'Pipeline DevSecOps: SAST, SCA, secretos, IaC y DAST automáticos', min: 120, labs: ['gitea', 'jenkins', 'zap'],
  obj: ['Montar un pipeline con controles de seguridad en cada fase', 'Decidir qué rompe la build y qué solo avisa', 'Generar un **SBOM**'],
  theory: `| Fase | Control | Herramienta libre |
|---|---|---|
| Pre-commit | Secretos | gitleaks |
| Pull request | SAST | Semgrep |
| Build | SCA (dependencias) + SBOM | Trivy / Grype + Syft |
| Build | IaC (Terraform, K8s) | Checkov |
| Imagen | Vulnerabilidades y configuración | Trivy |
| Staging | DAST | ZAP baseline |
| Release | Firma de artefactos | Cosign (Sigstore) |

Regla práctica: **rompe la build solo con hallazgos críticos y nuevos**; lo demás va a un backlog con fecha.`,
  steps: [
    ['Genera un SBOM y analízalo', `syft dir:. -o cyclonedx-json > sbom.json
grype sbom:sbom.json --fail-on critical`, 'El SBOM es el inventario de componentes: lo exigen ya clientes y normativas (Cyber Resilience Act).'],
    ['Analiza la infraestructura como código', 'checkov -d ./infra --quiet --compact', ''],
    ['Escaneo DAST de línea base', 'docker run --rm --network ciberlab2 ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://ciberlab2-wrongsecrets:8080 -I', 'Escaneo pasivo y rápido apto para cada despliegue. `-I` no falla por avisos.'],
    ['Encadénalo en Jenkins', `pipeline {
  agent any
  stages {
    stage('Secretos') { steps { sh 'gitleaks git . --exit-code 1' } }
    stage('SAST')     { steps { sh 'semgrep scan --config p/ci --error' } }
    stage('SCA')      { steps { sh 'trivy fs --severity CRITICAL --exit-code 1 .' } }
    stage('IaC')      { steps { sh 'checkov -d infra --soft-fail' } }
  }
}`, 'Jenkins (Laboratorio N2 → Docker) necesita estas herramientas en el agente; en la práctica se usan contenedores por etapa.'],
  ],
  defense: 'Además del pipeline, protege el propio CI: credenciales mínimas, agentes efímeros, ramas protegidas, revisiones obligatorias y registros de auditoría del CI en el SIEM.',
  challenge: 'Crea un repositorio en Gitea con una app pequeña e introduce a propósito un secreto, una dependencia vulnerable y un Dockerfile como root. Haz que el pipeline detecte los tres.',
  refs: [['OWASP DevSecOps Guideline', 'https://owasp.org/www-project-devsecops-guideline/'], ['SLSA framework', 'https://slsa.dev'], ['Sigstore Cosign', 'https://docs.sigstore.dev']] },
]},
{ name: 'Experto', lessons: [
{ id: 'as-05', t: 'Fallos avanzados del lado servidor: SSRF, deserialización y request smuggling', min: 120, labs: ['online'],
  obj: ['Entender la causa raíz de tres clases de fallos de alto impacto', 'Saber cómo se detectan en revisión de código y en logs', 'Proponer correcciones de arquitectura'],
  theory: `| Clase | Causa raíz | Impacto típico | Corrección de raíz |
|---|---|---|---|
| **SSRF** | El servidor hace peticiones a URLs que controla el usuario | Acceso a servicios internos y metadatos cloud (169.254.169.254) | Lista blanca de destinos, IMDSv2, salida por proxy, segmentación |
| **Deserialización insegura** | Se reconstruyen objetos desde datos no confiables | Ejecución remota de código | Formatos de solo datos (JSON), firmas, listas de clases permitidas |
| **HTTP request smuggling** | Proxy y backend interpretan distinto dónde acaba una petición (CL/TE) | Envenenar respuestas, saltar controles | HTTP/2 extremo a extremo, normalizar, rechazar ambigüedades |

La práctica de estos fallos se hace en **PortSwigger Academy**, que tiene laboratorios guiados de las tres clases.`,
  steps: [['Laboratorios guiados', '', 'PortSwigger Academy → *SSRF*, *Insecure deserialization* y *HTTP request smuggling*. Haz primero los de nivel *Apprentice*.'],
          ['Busca el patrón en código', 'semgrep scan --config p/python --config p/java --include "*.py" --include "*.java" .', 'Busca `requests.get(` con URL del usuario, `pickle.loads`, `ObjectInputStream.readObject`.'],
          ['Protege los metadatos cloud', 'aws ec2 modify-instance-metadata-options --instance-id i-0abc --http-tokens required --endpoint-url http://127.0.0.1:8101', 'IMDSv2 obligatorio: mitiga gran parte del impacto de una SSRF en AWS (practícalo contra Moto).']],
  defense: 'Defensa en profundidad: aunque exista SSRF, la segmentación de salida y IMDSv2 evitan que llegue a credenciales.',
  challenge: 'Completa 10 laboratorios de estas tres clases en PortSwigger y escribe para cada uno la corrección de código exacta.',
  refs: [['PortSwigger — Server-side topics', 'https://portswigger.net/web-security/all-topics'], ['OWASP SSRF Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html']] },
{ id: 'as-06', t: 'Seguridad de apps móviles con MobSF y OWASP MASVS', min: 90, labs: ['mobsf'],
  obj: ['Analizar estáticamente un APK', 'Interpretar permisos, configuración de red y secretos', 'Auditar contra **MASVS**'],
  theory: `**OWASP MASVS** define los requisitos de seguridad de apps móviles (almacenamiento, criptografía, autenticación, red, plataforma, código, resiliencia) y **MASTG** describe cómo probarlos.`,
  steps: [['Arranca MobSF', '', 'Laboratorio N2 → Docker → **MobSF** → `http://127.0.0.1:8106` (mobsf / mobsf).'],
          ['Descarga una app de prácticas', 'cd ~/CiberLab2/muestras && curl -LO https://github.com/payatu/diva-android/raw/master/diva-beta.apk', 'DIVA (Damn Insecure and Vulnerable App) está hecha para aprender.'],
          ['Súbela y revisa el informe', '', 'Mira: permisos peligrosos, `android:debuggable`, `usesCleartextTraffic`, componentes exportados, secretos y certificados.'],
          ['Mapea a MASVS', '', 'Cada hallazgo, a su requisito MASVS (p. ej. MASVS-STORAGE-1). Así se redacta un informe de auditoría móvil.']],
  defense: 'Almacenamiento cifrado (Keystore/Keychain), *certificate pinning* donde proceda, nada de secretos en la app y validación de todo en el servidor.',
  challenge: 'Analiza DIVA e InsecureBankv2 y entrega un informe con 8 hallazgos mapeados a MASVS.',
  refs: [['OWASP MASVS y MASTG', 'https://mas.owasp.org'], ['MobSF', 'https://github.com/MobSF/Mobile-Security-Framework-MobSF']] },
]},
]};
