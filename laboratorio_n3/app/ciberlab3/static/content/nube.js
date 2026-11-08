/* N3 · Escritorio 7 — Nube y contenedores ofensivo */
CL.areas.nube = { id: 'nube', title: 'Nube y contenedores ofensivo', tagline: 'Cómo se compromete una cuenta cloud y un clúster Kubernetes: identidad mal configurada, metadatos, tokens y RBAC — y cómo cerrarlo.',
intro: `## Nube y contenedores
En la nube casi nada se «hackea» con exploits: se **abusa de la identidad y de la configuración**. Una clave filtrada, un rol con permisos de más o un token de pod mal puesto valen más que cualquier CVE. Practica contra **emuladores locales** (LocalStack/Moto, kind) o cuentas de laboratorio propias — nunca contra infraestructura ajena.`,
levels: [
{ name: 'Operador', lessons: [
{ id: 'nube-01', t: 'AWS: de una clave filtrada a escalar en IAM', min: 70, labs: ['vm'],
  obj: ['Enumerar qué puede hacer una identidad en AWS', 'Reconocer rutas de escalada de privilegios en IAM', 'Entender el papel de los metadatos de instancia como pivote'],
  theory: `El acceso inicial a AWS suele ser una **clave** (filtrada en un repo, en una SSRF de metadatos, en un \`.env\`). A partir de ahí, todo es **IAM**:

| Paso | Qué haces | Herramienta |
|---|---|---|
| ¿Quién soy? | identidad y cuenta | \`aws sts get-caller-identity\` |
| ¿Qué puedo? | permisos de la identidad | enumerate-iam, \`aws iam get-account-authorization-details\` |
| ¿Puedo escalar? | combinaciones peligrosas (crear claves, pasar roles, editar políticas) | **PMapper**, **Pacu** |
| ¿Qué alcanzo? | S3, Lambda, EC2, Secrets Manager | AWS CLI |

**Rutas de escalada** típicas: \`iam:CreateAccessKey\` sobre otro usuario, \`iam:PassRole\`+\`lambda:CreateFunction\` (ejecutas con un rol más potente), \`iam:AttachUserPolicy\` (te adjuntas AdministratorAccess). Son **permisos mal dados**, no fallos de AWS. **Pacu** automatiza la enumeración y el abuso en entornos de laboratorio.`,
  steps: [
    ['¿Quién soy y en qué cuenta?', 'aws sts get-caller-identity --endpoint-url http://127.0.0.1:8201', 'Contra LocalStack/Moto del laboratorio. Con credenciales de prueba (AWS_ACCESS_KEY_ID=test). Nunca contra una cuenta ajena.'],
    ['Enumera permisos', 'aws iam list-attached-user-policies --user-name objetivo --endpoint-url ...', 'enumerate-iam prueba a ciegas qué llamadas te deja hacer. El objetivo es el mapa de lo que puedes.'],
    ['Busca rutas de escalada', 'pacu  # módulo iam__privesc_scan', 'PMapper/Pacu detectan combinaciones peligrosas (PassRole, CreateAccessKey, políticas editables) que llevan a admin.'],
    ['Demuestra el impacto', 'aws s3 ls --endpoint-url ...', 'Lista buckets o secretos a los que llegas. En un cliente, demuestras el acceso sin exfiltrar datos reales.'],
  ],
  defense: 'Mínimo privilegio real (nada de `*:*`), sin claves de larga duración (usa roles/SSO), IMDSv2 obligatorio, detección en CloudTrail de `CreateAccessKey`/`AttachUserPolicy`/`PassRole` inesperados, análisis de rutas de escalada con PMapper en tu propia cuenta y escaneo de secretos en repos (gitleaks).',
  quiz: [['En la nube, el acceso inicial y la escalada suelen venir de…', ['Un exploit de kernel', 'Identidad mal configurada: claves filtradas y permisos IAM de más', 'Un puerto abierto'], 1, 'La nube se compromete sobre todo por identidad y configuración, no por CVEs.'],
         ['`iam:PassRole` + `lambda:CreateFunction` permite…', ['Nada', 'Ejecutar código con un rol más privilegiado que el tuyo', 'Borrar la cuenta'], 1, 'Pasar un rol potente a una Lambda que tú creas es una escalada clásica.']],
  challenge: 'Con LocalStack/Moto del laboratorio, crea un usuario con permisos excesivos y usa Pacu/PMapper para detectar y demostrar una ruta de escalada a admin. Escribe la política de mínimo privilegio que lo evita.',
  refs: [['Pacu', 'https://github.com/RhinoSecurityLabs/pacu'], ['PMapper', 'https://github.com/nccgroup/PMapper'], ['HackTricks Cloud · AWS', 'https://cloud.hacktricks.xyz/pentesting-cloud/aws-security']] },
]},
{ name: 'Experto', lessons: [
{ id: 'nube-02', t: 'Kubernetes ofensivo: tokens de service account, RBAC y pods privilegiados', min: 75, labs: ['vm'],
  obj: ['Orientarte dentro de un pod comprometido', 'Entender cómo un token de service account y un RBAC laxo escalan', 'Reconocer pods privilegiados como vía al nodo'],
  theory: `Comprometer una app dentro de un **pod** es el punto de partida. Kubernetes escala por **identidad (RBAC)** y por **configuración del pod**:

- **Token de service account**: montado por defecto en \`/var/run/secrets/.../token\`. Con él hablas con la API del clúster como ese SA. Si su **RBAC** es laxo (p. ej. \`list secrets\`, \`create pods\`), escalas.
- **Pods privilegiados / hostPath / hostPID**: un pod \`privileged\` o que monta el disco del nodo (\`hostPath: /\`) permite **salir al nodo** (como el escape de contenedor, pero orquestado).
- **Secrets**: a menudo contienen credenciales de bases de datos, nubes y registries.

Herramientas: **kubectl** (con el token robado), **kube-hunter** (descubrimiento), **Peirates**/**BOtB** (abuso guiado). Practica en **kind**/**minikube** o **Kubernetes Goat**.`,
  steps: [
    ['¿Estoy en un pod? Coge el token', 'cat /var/run/secrets/kubernetes.io/serviceaccount/token', 'La presencia de esa ruta confirma que estás en Kubernetes. El token es tu identidad ante la API del clúster.'],
    ['¿Qué me deja hacer el RBAC?', 'kubectl auth can-i --list --token=$TOKEN -s https://KUBE-API', 'Enumera tus permisos. `create pods`, `list secrets` o `get pods/exec` son escalables.'],
    ['Escala por secretos o pods', 'kubectl get secrets -A --token=$TOKEN -s https://KUBE-API', 'Si puedes leer secrets de todos los namespaces, probablemente encuentras credenciales que amplían el acceso.'],
    ['Del pod al nodo', '', 'Si puedes crear un pod `privileged` con `hostPath: /`, montas el disco del nodo y sales al host. Demuéstralo en Kubernetes Goat y documenta la mitigación.'],
  ],
  defense: 'No montes el token si el pod no lo necesita (`automountServiceAccountToken: false`), RBAC de mínimo privilegio, Pod Security Admission (prohibir `privileged`, `hostPath`, `hostPID`), NetworkPolicies, secrets gestionados fuera del clúster, y Falco/kube-bench para detectar y auditar. kube-hunter encuentra lo que un atacante probaría.',
  quiz: [['El token en /var/run/secrets/kubernetes.io/... sirve para…', ['Cifrar el pod', 'Autenticarte ante la API del clúster como ese service account', 'Nada'], 1, 'Es la identidad del pod; con RBAC laxo, la vía de escalada en Kubernetes.'],
         ['Un pod `privileged` con el disco del nodo montado permite…', ['Nada', 'Salir al nodo anfitrión (equivalente a root del host)', 'Acelerar la app'], 1, 'Es el escape clásico de contenedor, orquestado por Kubernetes.']],
  challenge: 'En Kubernetes Goat (o kind), parte de un pod, enumera el RBAC de su service account y demuestra una escalada (leer secrets de otro namespace o crear un pod privilegiado). Propón la Pod Security Admission que lo bloquea.',
  refs: [['Kubernetes Goat', 'https://madhuakula.com/kubernetes-goat/'], ['kube-hunter', 'https://github.com/aquasecurity/kube-hunter'], ['HackTricks Cloud · Kubernetes', 'https://cloud.hacktricks.xyz/pentesting-cloud/kubernetes-security']] },
]},
]};
