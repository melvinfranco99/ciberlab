/* Escritorio 7 — Cloud, servidores y contenedores */
CL.areas.cloud = { id: 'cloud', title: 'Cloud y servidores', tagline: 'Bastionar servidores, contenedores y nubes, y auditarlos con herramientas estándar.',
intro: 'En la nube la mayoría de incidentes vienen de **configuraciones erróneas** e **identidades con demasiados permisos**, no de fallos del proveedor (modelo de responsabilidad compartida). Usa cuentas propias de la capa gratuita y pon **alertas de presupuesto** antes de nada.',
levels: [
{ name: 'Principiante', lessons: [
{ id: 'cl-01', t: 'Bastionado de un servidor Linux', min: 60, labs: ['ubuntu-srv'],
  obj: ['Aplicar las 10 medidas básicas a un servidor', 'Medir la mejora con Lynis'],
  steps: [['Línea base', '$ sudo apt install -y lynis && sudo lynis audit system --quick', 'Anota el Hardening index.'],
    ['Usuario y SSH', '$ sudo adduser admin && sudo usermod -aG sudo admin\n$ sudo sed -i "s/^#\\?PermitRootLogin.*/PermitRootLogin no/;s/^#\\?PasswordAuthentication.*/PasswordAuthentication no/" /etc/ssh/sshd_config\n$ sudo systemctl restart ssh', 'Copia antes tu clave con `ssh-copy-id admin@IP`.'],
    ['Firewall', '$ sudo ufw default deny incoming && sudo ufw allow OpenSSH && sudo ufw enable', ''],
    ['Actualizaciones automáticas', '$ sudo apt install -y unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades', ''],
    ['Servicios y puertos', '$ ss -tulpn\n$ systemctl list-unit-files --state=enabled', 'Desactiva lo que no se use.'],
    ['Medir de nuevo', '$ sudo lynis audit system --quick', '']],
  challenge: 'Haz un snapshot, aplica los CIS Benchmarks nivel 1 de Ubuntu y compara el Hardening index antes y después.' },
{ id: 'cl-02', t: 'Modelo de responsabilidad compartida e IAM', min: 40, labs: ['cloud'],
  obj: ['Saber qué protege el proveedor y qué tú', 'Aplicar mínimo privilegio en IAM'],
  theory: `| | IaaS (EC2/VM) | PaaS | SaaS (M365) |
|---|---|---|---|
| Datos e identidades | Tú | Tú | Tú |
| Aplicación | Tú | Tú | Proveedor |
| SO y parches | Tú | Proveedor | Proveedor |
| Hardware | Proveedor | Proveedor | Proveedor |

**Reglas de oro de IAM:** cuenta raíz con MFA hardware y sin claves; usuarios con SSO y roles temporales; nada de \`"Action": "*"\`; alertas de presupuesto.`,
  challenge: 'Crea una cuenta gratuita de AWS o Azure, protege la cuenta raíz con MFA, crea un usuario administrador con SSO/IAM Identity Center y configura una alerta de presupuesto de 1 €.' },
]},
{ name: 'Intermedio', lessons: [
{ id: 'cl-03', t: 'Auditar una cuenta cloud con Prowler y ScoutSuite', min: 60, labs: ['cloud'],
  obj: ['Ejecutar una auditoría automática de configuración', 'Priorizar los hallazgos'],
  steps: [['Instalar', '$ pipx install prowler', ''],
    ['Auditoría de AWS con un perfil de solo lectura', '$ prowler aws --profile auditoria -M html -o ~/CiberLab/loot/aws', 'El perfil debe tener las políticas gestionadas `SecurityAudit` y `ViewOnlyAccess`.'],
    ['Azure', '$ prowler azure --az-cli-auth -M html -o ~/CiberLab/loot/azure', '']],
  challenge: 'Corrige en tu cuenta todos los hallazgos críticos y altos que salgan y vuelve a ejecutar Prowler.' },
{ id: 'cl-04', t: 'Seguridad de contenedores Docker', min: 50, labs: ['docker'],
  obj: ['Escanear imágenes', 'Ejecutar contenedores con privilegios mínimos'],
  theory: 'Riesgos: imágenes con vulnerabilidades, contenedores como root, `--privileged`, montar `/var/run/docker.sock` (equivale a root en el host), secretos en la imagen.',
  steps: [['Escanear una imagen', '$ trivy image vulnerables/web-dvwa', 'Verás por qué DVWA solo debe ejecutarse en local.'],
    ['Ejecución con mínimos privilegios', '$ docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges --user 1000:1000 alpine id', ''],
    ['Revisión del host', '$ docker run --rm --net host --pid host --cap-add audit_control -v /etc:/etc:ro -v /var/lib:/var/lib:ro -v /var/run/docker.sock:/var/run/docker.sock:ro docker/docker-bench-security', 'Docker Bench comprueba las recomendaciones CIS.']],
  defense: '> 💡 Recuerda que tu usuario está en el grupo `docker`: cualquier programa que ejecutes puede obtener root. Valora usar Docker rootless o Podman.',
  challenge: 'Escribe un Dockerfile para una app Python que pase Trivy sin vulnerabilidades críticas y se ejecute como usuario no root.' },
]},
{ name: 'Avanzado', lessons: [
{ id: 'cl-05', t: 'Kubernetes: seguridad básica', min: 60, labs: ['docker'],
  obj: ['Conocer los riesgos principales de un clúster', 'Auditarlo con kube-bench'],
  theory: 'Claves: RBAC mínimo, sin pods privilegiados (Pod Security Standards *restricted*), NetworkPolicies por defecto denegar, secretos cifrados y fuera de los manifiestos, API server no expuesto, imágenes firmadas y escaneadas.',
  steps: [['Clúster local', '$ sudo pacman -S --needed kind kubectl\n$ kind create cluster --name lab', ''],
    ['Auditoría CIS', '$ kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml\n$ kubectl logs job/kube-bench', '']],
  challenge: 'Aplica una NetworkPolicy que deniegue todo el tráfico por defecto en un namespace y permite solo el necesario entre dos pods.' },
{ id: 'cl-06', t: 'Microsoft 365 / Entra ID: configuración segura', min: 50, labs: ['cloud'],
  obj: ['Aplicar los controles básicos de identidad en M365'],
  theory: 'Prioridades: MFA para todos, bloquear autenticación heredada, acceso condicional, cuentas de emergencia (*break‑glass*), revisar consentimiento de aplicaciones OAuth, registros de auditoría unificados activados, DMARC. Microsoft Secure Score te guía.',
  challenge: 'Con un tenant de desarrollador gratuito de Microsoft 365, sube el Secure Score por encima del 60 %.' },
]},
{ name: 'Experto', lessons: [
{ id: 'cl-07', t: 'Retos de seguridad cloud', min: 120, labs: ['cloud'],
  obj: ['Practicar escenarios reales de configuración errónea en la nube'],
  theory: 'Los mejores entornos de práctica son retos diseñados para ello: flAWS y flAWS2 (AWS, desde el navegador) y CloudGoat (despliega escenarios vulnerables en tu propia cuenta: destrúyelos al terminar para no pagar).',
  challenge: 'Completa flAWS (niveles 1‑6) y, para cada nivel, escribe qué configuración lo causó y cómo se corrige.',
  refs: [['flAWS', 'http://flaws.cloud'], ['flAWS2', 'http://flaws2.cloud'], ['CloudGoat', 'https://github.com/RhinoSecurityLabs/cloudgoat']] },
]},
]};
