/* N2 · Escritorio 7 — Cloud, Kubernetes y contenedores (avanzado) */
CL.areas.cloud = { id: 'cloud', title: 'Cloud y Kubernetes', tagline: 'IAM, detección en la nube, contenedores y Kubernetes de nivel profesional.',
intro: `En la nube el perímetro es la **identidad**: casi todos los incidentes cloud empiezan con una credencial filtrada o un permiso excesivo. En este escritorio practicas IAM y detección en AWS **sin coste** con **Moto** (AWS simulado en Docker), y Kubernetes en local con **kind** o **k3s**.

Para AWS real usa una cuenta propia con alertas de presupuesto, y los laboratorios guiados flAWS, flAWS2 y CloudGoat.`,
levels: [
{ name: 'Base N2', lessons: [
{ id: 'cl-01', t: 'IAM de AWS a fondo: políticas, evaluación y mínimo privilegio (con Moto)', min: 90, labs: ['moto'],
  obj: ['Leer y escribir políticas IAM con condiciones', 'Entender la **lógica de evaluación** (deny explícito gana)', 'Practicar sin coste con la AWS CLI contra Moto'],
  theory: `Una petición se permite solo si **algún** \`Allow\` la cubre y **ningún** \`Deny\` explícito la bloquea, combinando: SCP de la organización, *permission boundaries*, políticas de identidad, políticas de recurso y políticas de sesión.

Riesgos típicos: \`"Action": "*"\`, \`"Resource": "*"\`, \`iam:PassRole\` sin restricción, claves de acceso de larga duración, confianza de roles abierta (\`"Principal": "*"\`).`,
  steps: [
    ['Arranca Moto y configura la CLI', `export AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=eu-west-1
alias awsl='aws --endpoint-url http://127.0.0.1:8101'
awsl sts get-caller-identity`, 'Laboratorio N2 → Docker → **Moto**. El alias evita escribir el endpoint cada vez.'],
    ['Crea un usuario con una política mínima', `awsl iam create-user --user-name ci-deployer
cat > /tmp/politica.json <<'EOF'
{ "Version": "2012-10-17",
  "Statement": [{ "Effect": "Allow",
    "Action": ["s3:PutObject"],
    "Resource": "arn:aws:s3:::corp-web-static/*",
    "Condition": { "IpAddress": { "aws:SourceIp": "20.61.14.0/24" } } }] }
EOF
awsl iam put-user-policy --user-name ci-deployer --policy-name despliegue-web --policy-document file:///tmp/politica.json`, 'Solo puede subir objetos a un bucket y desde un rango de IPs.'],
    ['Bloquea el acceso público', `awsl s3api create-bucket --bucket corp-backups-prod --create-bucket-configuration LocationConstraint=eu-west-1
awsl s3api put-public-access-block --bucket corp-backups-prod --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
awsl s3api get-public-access-block --bucket corp-backups-prod`, ''],
    ['Valida políticas con el simulador real', '', 'En una cuenta AWS real, *IAM Policy Simulator* y **IAM Access Analyzer** te dicen qué permite realmente una política y qué recursos quedan expuestos al exterior.'],
  ],
  defense: 'SSO con roles temporales en lugar de usuarios IAM, SCPs que prohíben desactivar CloudTrail o salir de regiones, *permission boundaries* para quien crea roles y Access Analyzer siempre activo.',
  quiz: [['Una política permite s3:* y otra deniega s3:DeleteBucket. ¿Puede borrar el bucket?', ['Sí', 'No', 'Depende del orden'], 1, 'Un Deny explícito siempre gana, sin importar el orden.']],
  challenge: 'Reproduce en Moto la cuenta del incidente de la Práctica de detección (CloudTrail) y aplica 5 cambios que habrían impedido cada paso del atacante.',
  refs: [['AWS — Policy evaluation logic', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html'], ['Moto server mode', 'https://docs.getmoto.org/en/latest/docs/server_mode.html']] },
{ id: 'cl-02', t: 'Detección en la nube: CloudTrail, GuardDuty y consultas', min: 75, labs: ['logs', 'splunk'],
  obj: ['Saber qué eventos de CloudTrail importan', 'Investigar una clave filtrada', 'Escribir alertas de alta señal'],
  theory: `Eventos de alta prioridad en CloudTrail:
| eventName | Por qué |
|---|---|
| StopLogging, DeleteTrail, PutEventSelectors | Dejar ciego al defensor |
| CreateUser, CreateAccessKey, CreateLoginProfile | Persistencia |
| AttachUserPolicy / PutUserPolicy con privilegios | Escalada |
| PutBucketPolicy / PutBucketAcl públicos | Exfiltración |
| ConsoleLogin sin MFA, desde país nuevo | Acceso sospechoso |
| GetCallerIdentity desde IP nueva | Primer paso típico tras robar una clave |`,
  steps: [
    ['Practica con el incidente', '', 'DFIR → **Práctica de detección** → *AWS CloudTrail*. Descarga `cloudtrail.jsonl`.'],
    ['Línea temporal del atacante con jq', `jq -r 'select(.sourceIPAddress=="198.51.100.23") | [.eventTime, .eventName, (.requestParameters|tostring)] | @tsv' cloudtrail.jsonl`, ''],
    ['Acciones de alta prioridad', `jq -r 'select(.eventName|test("StopLogging|DeleteTrail|CreateUser|CreateAccessKey|AttachUserPolicy|PutBucketPolicy")) | [.eventTime,.userIdentity.userName,.sourceIPAddress,.eventName] | @tsv' cloudtrail.jsonl`, ''],
    ['La misma consulta en Splunk', `index=main sourcetype=_json eventName IN (StopLogging, DeleteTrail, CreateUser, CreateAccessKey, AttachUserPolicy, PutBucketPolicy)
| table eventTime userIdentity.userName sourceIPAddress eventName`, ''],
  ],
  defense: 'Trail organizativo en una cuenta de logs separada con *Object Lock*, GuardDuty en todas las regiones y alertas en tiempo real (EventBridge) para los eventos de la tabla.',
  challenge: 'Escribe 3 reglas Sigma de la categoría `aws/cloudtrail` para los eventos de la tabla y conviértelas a SPL.',
  refs: [['Sigma rules — AWS CloudTrail', 'https://github.com/SigmaHQ/sigma/tree/master/rules/cloud/aws'], ['flAWS2 (defensa)', 'http://flaws2.cloud']] },
]},
{ name: 'Avanzado', lessons: [
{ id: 'cl-03', t: 'Seguridad de contenedores: imágenes, runtime y Docker bastionado', min: 90, labs: ['docker'],
  obj: ['Construir imágenes mínimas y sin root', 'Escanear vulnerabilidades y configuración', 'Ejecutar contenedores con privilegios mínimos'],
  theory: `| Riesgo | Control |
|---|---|
| Imagen enorme con cientos de CVE | Imágenes *distroless* o *slim*, multi-stage |
| Proceso como root | \`USER\` no privilegiado |
| \`--privileged\`, socket de Docker montado | Prohibido: equivale a root en el host |
| Capacidades de más | \`--cap-drop ALL\` y añadir solo las necesarias |
| Sistema de ficheros escribible | \`--read-only\` + tmpfs |
| Imágenes no verificadas | Firmas (cosign) y registro propio |`,
  steps: [
    ['Escanea una imagen', 'trivy image --severity HIGH,CRITICAL nginx:latest', ''],
    ['Escanea un Dockerfile', 'trivy config Dockerfile && checkov -f Dockerfile', ''],
    ['Ejecuta con privilegios mínimos', 'docker run --rm --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges --user 10001:10001 -p 127.0.0.1:8080:8080 mi-app:1.0', ''],
    ['Audita el propio Docker', 'docker run --rm --net host --pid host --userns host --cap-add audit_control -v /etc:/etc:ro -v /var/lib:/var/lib:ro -v /var/run/docker.sock:/var/run/docker.sock:ro docker/docker-bench-security', 'Docker Bench comprueba el host contra el benchmark CIS. Necesita acceso amplio: ejecútalo solo para auditar.'],
  ],
  defense: 'Política de admisión que rechace imágenes sin firma, con CVE críticas o que se ejecuten como root.',
  challenge: 'Toma un Dockerfile real (por ejemplo, el de Gitea) y endurécelo hasta que Trivy y Checkov no den hallazgos altos.',
  refs: [['CIS Docker Benchmark', 'https://www.cisecurity.org/benchmark/docker'], ['OWASP Docker Security Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html']] },
{ id: 'cl-04', t: 'Kubernetes seguro: RBAC, Pod Security, NetworkPolicies y Falco', min: 150, labs: ['k8s', 'docker'],
  obj: ['Montar un clúster local con **kind**', 'Auditar RBAC y la configuración con kube-bench', 'Aplicar Pod Security Admission, NetworkPolicies y detección en runtime con Falco'],
  theory: `Superficies de ataque de Kubernetes: API server, credenciales (kubeconfig, *service account tokens*), RBAC excesivo, pods privilegiados o con \`hostPath\`, red plana entre pods, imágenes vulnerables, secretos sin cifrar en etcd.

Controles: **RBAC** de mínimo privilegio, **Pod Security Admission** en nivel \`restricted\`, **NetworkPolicies** por defecto denegando, secretos cifrados, auditoría del API server y **Falco** para detectar comportamientos anómalos en runtime.`,
  steps: [
    ['Crea un clúster local', `kind create cluster --name cl2
kubectl get nodes`, ''],
    ['Audita contra CIS', 'kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml && sleep 20 && kubectl logs job/kube-bench | tail -40', ''],
    ['Busca permisos excesivos', `kubectl get clusterrolebindings -o json | jq -r '.items[] | select(.roleRef.name=="cluster-admin") | .metadata.name + " -> " + ([.subjects[]?.name]|join(","))'
kubectl auth can-i --list --as=system:serviceaccount:default:default`, ''],
    ['Aplica Pod Security restringido', `kubectl create namespace apps
kubectl label namespace apps pod-security.kubernetes.io/enforce=restricted
kubectl -n apps run prueba --image=nginx --privileged   # debe ser rechazado`, ''],
    ['Deniega todo el tráfico por defecto', `cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: denegar-todo, namespace: apps }
spec: { podSelector: {}, policyTypes: [Ingress, Egress] }
EOF`, 'kind necesita un CNI con soporte de NetworkPolicy (Calico) para aplicarlas de verdad.'],
    ['Detección en runtime con Falco', `helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco -n falco --create-namespace
kubectl create namespace demo && kubectl -n demo create deployment web --image=nginx
kubectl -n demo rollout status deploy/web
kubectl -n demo exec -it deploy/web -- sh -c 'cat /etc/shadow'
kubectl -n falco logs -l app.kubernetes.io/name=falco | grep -i shadow`, 'Falco alerta de una shell en un contenedor leyendo ficheros sensibles.'],
  ],
  defense: 'Para practicar escenarios de ataque y defensa guiados en un clúster, usa **Kubernetes Goat** en tu kind.',
  challenge: 'Despliega Kubernetes Goat en kind, resuelve 5 escenarios y para cada uno escribe el control (RBAC, PSA, NetworkPolicy, Falco) que lo habría evitado o detectado.',
  refs: [['Kubernetes — Security checklist', 'https://kubernetes.io/docs/concepts/security/security-checklist/'], ['Kubernetes Goat', 'https://madhuakula.com/kubernetes-goat/'], ['Falco', 'https://falco.org']] },
]},
{ name: 'Experto', lessons: [
{ id: 'cl-05', t: 'Postura de seguridad cloud (CSPM) e infraestructura como código', min: 90, labs: ['cloud'],
  obj: ['Auditar una cuenta con **Prowler** o ScoutSuite', 'Escanear Terraform antes de desplegar', 'Mapear hallazgos a CIS, ENS y NIS2'],
  theory: `Un **CSPM** compara la configuración real de la nube con benchmarks (CIS, AWS FSBP, ENS) y genera hallazgos priorizados. En auditorías de gran empresa es la base de la revisión cloud. El complemento es **escanear el IaC** para que los errores no lleguen a desplegarse.`,
  steps: [
    ['Prowler en una cuenta real (solo lectura)', `pipx install prowler
prowler aws --profile auditoria-solo-lectura --compliance cis_3.0_aws ens_rd2022_aws -M html csv -o ~/CiberLab2/informes/prowler`, 'Usa un rol con las políticas `SecurityAudit` y `ViewOnlyAccess`. Prowler incluye el marco **ENS** español.'],
    ['Escanea Terraform', `checkov -d ./terraform --framework terraform
trivy config ./terraform`, ''],
    ['Ejemplo de corrección', `resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`, ''],
  ],
  defense: 'CSPM continuo con alertas, IaC obligatoria (nada a mano en producción) y escaneo en cada pull request.',
  challenge: 'Haz una auditoría cloud completa de tu cuenta personal de AWS (capa gratuita): Prowler + revisión manual de IAM + informe con hallazgos mapeados a CIS y ENS.',
  refs: [['Prowler', 'https://github.com/prowler-cloud/prowler'], ['Checkov', 'https://www.checkov.io'], ['CloudGoat', 'https://github.com/RhinoSecurityLabs/cloudgoat']] },
]},
]};
