/* N2 · Escritorio 4 — Active Directory e identidad */
CL.areas.ad = { id: 'ad', title: 'Active Directory e identidad', tagline: 'El corazón de casi todas las empresas y el objetivo número uno del ransomware.',
intro: `El 90 % de las grandes empresas usa **Active Directory**, y casi todos los incidentes de ransomware graves pasan por comprometerlo. Aquí montas tu propio dominio \`corp.lab\`, entiendes Kerberos a fondo, aprendes a ver el dominio como lo ve un atacante (rutas de ataque) y, sobre todo, a **cerrarlas y detectarlas**.

Necesitas: **DC01** y **WS01** en la red CORP (Laboratorio N2). Para un bosque ya montado con decenas de configuraciones débiles, usa **GOAD-Light**.`,
levels: [
{ name: 'Base N2', lessons: [
{ id: 'ad-01', t: 'Montar el dominio de prácticas con auditoría y Sysmon', min: 120, labs: ['dc01', 'ws01', 'splunk'],
  obj: ['Promocionar un controlador de dominio y unir un puesto', 'Crear OUs, usuarios y grupos realistas', 'Activar la **auditoría avanzada** y Sysmon para tener telemetría'],
  theory: `Sin telemetría no hay detección. La configuración por defecto de Windows **no registra** muchos eventos clave (por ejemplo, la creación de procesos con línea de comandos). Por eso, antes de practicar nada, el dominio debe registrar lo necesario.`,
  steps: [
    ['Promociona DC01', `Rename-Computer -NewName DC01 -Restart
New-NetIPAddress -InterfaceAlias Ethernet -IPAddress 192.168.57.10 -PrefixLength 24
Set-DnsClientServerAddress -InterfaceAlias Ethernet -ServerAddresses 127.0.0.1
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName corp.lab -DomainNetbiosName CORP -InstallDns`, 'Haz un snapshot **dc-limpio** después de reiniciar.'],
    ['Crea la estructura', `New-ADOrganizationalUnit -Name Empresa -Path "DC=corp,DC=lab"
"Usuarios","Equipos","Servicios","Admins" | % { New-ADOrganizationalUnit -Name $_ -Path "OU=Empresa,DC=corp,DC=lab" }
$pw = Read-Host -AsSecureString "Contraseña inicial"
"a.garcia","j.martin","l.sanchez","p.ruiz","m.lopez" | % {
  New-ADUser -Name $_ -SamAccountName $_ -Path "OU=Usuarios,OU=Empresa,DC=corp,DC=lab" -AccountPassword $pw -Enabled $true }`, ''],
    ['Activa la auditoría avanzada', `auditpol /set /subcategory:"Kerberos Service Ticket Operations" /success:enable /failure:enable
auditpol /set /subcategory:"Kerberos Authentication Service" /success:enable /failure:enable
auditpol /set /subcategory:"Security Group Management" /success:enable
auditpol /set /subcategory:"Directory Service Changes" /success:enable
auditpol /set /subcategory:"Process Creation" /success:enable
reg add "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\Audit" /v ProcessCreationIncludeCmdLine_Enabled /t REG_DWORD /d 1 /f`, 'En producción esto se hace por **GPO** (Configuración avanzada de directivas de auditoría) para todo el dominio.'],
    ['Instala Sysmon en WS01 y DC01', `Invoke-WebRequest https://download.sysinternals.com/files/Sysmon.zip -OutFile Sysmon.zip; Expand-Archive Sysmon.zip
Invoke-WebRequest https://raw.githubusercontent.com/olafhartong/sysmon-modular/master/sysmonconfig.xml -OutFile sysmonconfig.xml
.\\Sysmon\\Sysmon64.exe -accepteula -i sysmonconfig.xml`, 'Los eventos aparecen en *Applications and Services Logs → Microsoft → Windows → Sysmon → Operational*.'],
    ['Une WS01 al dominio', `Set-DnsClientServerAddress -InterfaceAlias Ethernet -ServerAddresses 192.168.57.10
Add-Computer -DomainName corp.lab -Restart`, ''],
    ['Envía los eventos al SIEM', '', 'Opción ligera: agente de **Wazuh**. Opción Splunk: *Universal Forwarder* hacia Splunk en Docker; en tu Arch, Splunk escucha en 127.0.0.1, así que reenvía desde la VM al host con la IP 192.168.57.1 publicando el puerto 9997 solo en esa interfaz.'],
  ],
  defense: 'Este mismo paquete (auditoría avanzada + línea de comandos + Sysmon + reenvío) es una de las recomendaciones de mayor valor en cualquier auditoría de gran empresa.',
  challenge: 'Inicia sesión con varios usuarios en WS01 y localiza en el SIEM los eventos 4624, 4768, 4769 y Sysmon 1 de cada inicio de sesión.',
  refs: [['Microsoft — Advanced security audit policy', 'https://learn.microsoft.com/windows/security/threat-protection/auditing/advanced-security-audit-policy-settings'], ['sysmon-modular', 'https://github.com/olafhartong/sysmon-modular']] },
{ id: 'ad-02', t: 'Kerberos y NTLM a fondo: qué pasa en cada inicio de sesión', min: 75, labs: ['dc01', 'ws01'],
  obj: ['Dibujar el intercambio AS, TGS y AP', 'Relacionar cada paso con su evento (4768, 4769, 4624, 4776)', 'Entender por qué NTLM es un riesgo'],
  theory: `\`\`\`
Usuario ──AS-REQ (prueba de contraseña)──▶ KDC (DC01)      evento 4768
Usuario ◀──────────── TGT (cifrado con la clave de krbtgt)
Usuario ──TGS-REQ (TGT + servicio SPN)──▶ KDC              evento 4769
Usuario ◀── Ticket de servicio (cifrado con la clave de la CUENTA DE SERVICIO)
Usuario ──AP-REQ (ticket)──▶ Servidor (SRV01)              evento 4624 en SRV01
\`\`\`

Claves para la seguridad:
- El ticket de servicio va cifrado con la clave derivada de la contraseña de la **cuenta de servicio**. Si esa contraseña es débil, puede adivinarse fuera de línea → ver lección siguiente.
- Quien tenga la clave de **krbtgt** puede fabricar TGT (*Golden Ticket*): por eso se rota dos veces tras un compromiso.
- **NTLM** no tiene mutua autenticación y permite *relay*: hay que reducirlo y exigir firma SMB/LDAP.

Tipos de cifrado en los eventos: \`0x12\` AES256 (bien), \`0x17\` RC4 (sospechoso hoy en día).`,
  steps: [
    ['Observa tus tickets en WS01', 'klist', 'Muestra el TGT y los tickets de servicio en caché con su cifrado.'],
    ['Comprueba qué cifrados admite el dominio', `Get-ADUser -Filter * -Properties msDS-SupportedEncryptionTypes | select Name,msDS-SupportedEncryptionTypes`, 'Vacío = valor por defecto del dominio.'],
    ['Mide el uso de NTLM', `# En DC01, activa: Seguridad de red: restringir NTLM: auditar la autenticación NTLM en este dominio = Habilitar todo
Get-WinEvent -LogName "Microsoft-Windows-NTLM/Operational" -MaxEvents 20`, 'Antes de bloquear NTLM hay que saber quién lo usa.'],
  ],
  defense: 'AES obligatorio, RC4 deshabilitado progresivamente, firma SMB y LDAP obligatoria, *channel binding* en LDAPS y reducción de NTLM.',
  quiz: [['¿Con qué clave va cifrado un ticket de servicio?', ['La del usuario', 'La de la cuenta que ejecuta el servicio', 'La de krbtgt'], 1, 'Por eso las contraseñas débiles en cuentas de servicio son tan peligrosas.']],
  challenge: 'Dibuja el diagrama completo de un usuario accediendo a \\\\srv01\\datos y anota qué evento se genera en qué máquina en cada paso.',
  refs: [['Microsoft — Kerberos authentication overview', 'https://learn.microsoft.com/windows-server/security/kerberos/kerberos-authentication-overview'], ['adsecurity.org', 'https://adsecurity.org']] },
]},
{ name: 'Avanzado', lessons: [
{ id: 'ad-03', t: 'Cuentas de servicio: detectar y prevenir Kerberoasting', min: 90, labs: ['dc01', 'splunk', 'logs'],
  obj: ['Inventariar cuentas con SPN y su riesgo', 'Detectar peticiones de tickets anómalas', 'Migrar a **gMSA** y AES'],
  theory: `**Kerberoasting (T1558.003)**: cualquier usuario del dominio puede pedir tickets de servicio; si la cuenta de servicio tiene una contraseña débil, el ticket permite adivinarla fuera de línea sin generar más ruido.

Indicadores de detección:
- Evento **4769** con \`TicketEncryptionType = 0x17\` (RC4) en un dominio que usa AES.
- Un mismo usuario pidiendo tickets para **muchos SPN distintos** en poco tiempo.
- Peticiones a una **cuenta trampa** (honeytoken) que nadie usa legítimamente.`,
  steps: [
    ['Inventaria las cuentas con SPN', `Get-ADUser -Filter {ServicePrincipalName -like "*"} -Properties ServicePrincipalName,PasswordLastSet,msDS-SupportedEncryptionTypes,AdminCount |
  select Name,PasswordLastSet,AdminCount,msDS-SupportedEncryptionTypes`, 'Riesgo alto: contraseña antigua, AdminCount=1 (privilegiada) o sin AES.'],
    ['Crea una cuenta trampa', `New-ADUser -Name svc_backup_old -SamAccountName svc_backup_old -AccountPassword (Read-Host -AsSecureString) -Enabled $true -Description "NO USAR"
Set-ADUser svc_backup_old -ServicePrincipalNames @{Add="backup/legacy.corp.lab"}`, 'Nadie debería pedir un ticket para ella. Si alguien lo hace, alerta de alta fidelidad.'],
    ['Detecta en Splunk', `index=* EventCode=4769 TicketEncryptionType=0x17 NOT Account_Name="*$"
| bin _time span=5m
| stats dc(Service_Name) as spns values(Service_Name) by _time, Account_Name, Client_Address
| where spns >= 3`, 'Con el CSV de la práctica, adapta los nombres de campo (Account, Detail).'],
    ['Practica con el incidente simulado', '', 'DFIR → **Práctica de detección** → *Dominio corp.lab*.'],
    ['Migra a gMSA', `Add-KdsRootKey -EffectiveTime ((Get-Date).AddHours(-10))   # solo en laboratorio
New-ADServiceAccount -Name gmsa_sql -DNSHostName gmsa_sql.corp.lab -PrincipalsAllowedToRetrieveManagedPassword "SRV01$"
# En SRV01:
Install-ADServiceAccount gmsa_sql; Test-ADServiceAccount gmsa_sql`, 'Las gMSA tienen contraseñas de 120 caracteres que rota el dominio: hace inviable adivinarlas.'],
  ],
  defense: '- gMSA para servicios; si no es posible, contraseñas de **más de 25 caracteres** aleatorias.\n- Forzar AES (`msDS-SupportedEncryptionTypes = 24`) y retirar RC4.\n- Ninguna cuenta de servicio en grupos privilegiados.\n- Honeytoken con SPN + alerta.',
  quiz: [['¿Qué evento de seguridad registra la petición de un ticket de servicio?', ['4624', '4768', '4769'], 2, '4768 es el TGT; 4769, el ticket de servicio.']],
  challenge: 'Escribe la regla Sigma para el honeytoken (cualquier 4769 con ServiceName svc_backup_old) y pruébala pidiendo tú un ticket con `klist get backup/legacy.corp.lab` desde WS01.',
  refs: [['ATT&CK T1558.003', 'https://attack.mitre.org/techniques/T1558/003/'], ['Microsoft — gMSA', 'https://learn.microsoft.com/windows-server/security/group-managed-service-accounts/group-managed-service-accounts-overview']] },
{ id: 'ad-04', t: 'BloodHound para defensores: encontrar y cortar rutas de ataque', min: 120, labs: ['dc01', 'docker'],
  obj: ['Entender el AD como un **grafo** de relaciones', 'Encontrar rutas hacia Domain Admins', 'Priorizar correcciones que cortan más rutas'],
  theory: `Los atacantes piensan en grafos: «este usuario es admin local de este equipo, donde hay una sesión de alguien que puede cambiar la contraseña de alguien que es Domain Admin». **BloodHound** dibuja ese grafo a partir de los datos de AD (grupos, ACLs, sesiones, GPOs, delegaciones).

Relaciones peligrosas frecuentes:
| Relación | Significado |
|---|---|
| GenericAll / GenericWrite | Control total o escritura sobre un objeto |
| WriteDacl / WriteOwner | Puede cambiar los permisos del objeto |
| ForceChangePassword | Puede resetear la contraseña |
| AdminTo | Es administrador local del equipo |
| HasSession | Hay credenciales en memoria en ese equipo |
| AllowedToDelegate | Delegación Kerberos |

La edición **BloodHound Community Edition** es de SpecterOps; existe además **PingCastle**, pensada para auditoría defensiva con puntuación de riesgo.`,
  steps: [
    ['Despliega BloodHound CE en tu Arch', `mkdir -p ~/CiberLab2/scripts/bloodhound && cd ~/CiberLab2/scripts/bloodhound
curl -L https://ghst.ly/getbhce -o docker-compose.yml
grep -n "BLOODHOUND_HOST" docker-compose.yml     # debe publicar en 127.0.0.1
docker compose up -d && docker compose logs | grep -i "initial password"`, 'Interfaz en `http://127.0.0.1:8080`. Comprueba en el compose que solo publica en 127.0.0.1.'],
    ['Recoge los datos de TU dominio de laboratorio', '', 'Desde la interfaz: *Download Collectors* y sigue la documentación oficial de SpecterOps ejecutándolo en WS01 con un usuario del dominio. Sube el ZIP resultante.'],
    ['Consulta rutas', '', 'Usa las consultas predefinidas: *Shortest paths to Domain Admins*, *Kerberoastable users*, *Users with DCSync rights*.'],
    ['Audita también con PingCastle', 'PingCastle.exe --healthcheck --server dc01.corp.lab', 'Genera un informe HTML con puntuación y recomendaciones priorizadas: ideal para auditorías.'],
  ],
  defense: 'Corrige por **puntos de estrangulamiento**: el permiso o grupo que aparece en más rutas. Repite la recogida tras cada cambio para comprobar que la ruta ha desaparecido.',
  challenge: 'Introduce en tu dominio 3 configuraciones débiles (un ACL GenericAll mal puesto, un usuario admin local en todos los equipos, una cuenta de servicio en Domain Admins), encuéntralas con BloodHound/PingCastle y corrígelas.',
  refs: [['BloodHound CE', 'https://bloodhound.specterops.io'], ['PingCastle', 'https://www.pingcastle.com']] },
]},
{ name: 'Experto', lessons: [
{ id: 'ad-05', t: 'Bastionado de nivel experto: tiering, LAPS, Protected Users y Credential Guard', min: 120, labs: ['dc01', 'ws01'],
  obj: ['Aplicar el **modelo de niveles** (tier 0/1/2)', 'Desplegar **Windows LAPS**', 'Reducir el robo de credenciales en memoria'],
  theory: `**Modelo de niveles (Enterprise Access Model)**: lo que controla la identidad (DC, ADCS, Entra Connect) es **tier 0**; los servidores, tier 1; los puestos, tier 2. Una credencial de un nivel **nunca** se usa en un nivel inferior, porque allí puede robarse.

Controles clave:
| Control | Qué evita |
|---|---|
| Windows LAPS | Misma contraseña de admin local en todos los equipos |
| Protected Users | NTLM, delegación y caché de credenciales para cuentas sensibles |
| Credential Guard | Lectura de secretos de LSASS con privilegios de administrador |
| PAW (estaciones privilegiadas) | Administrar desde un puesto que navega y lee correo |
| Restricciones de inicio de sesión por GPO | Que un Domain Admin inicie sesión en puestos |`,
  steps: [
    ['Despliega Windows LAPS', `Update-LapsADSchema
Set-LapsADComputerSelfPermission -Identity "OU=Equipos,OU=Empresa,DC=corp,DC=lab"
# GPO: Configuración del equipo > Plantillas administrativas > Sistema > LAPS
#   Configure password backup directory = Active Directory
Get-LapsADPassword -Identity WS01 -AsPlainText`, ''],
    ['Protege las cuentas administrativas', 'Add-ADGroupMember -Identity "Protected Users" -Members adm.melvin', 'Prueba antes: Protected Users rompe NTLM y delegación para esas cuentas.'],
    ['Comprueba Credential Guard', '(Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\\Microsoft\\Windows\\DeviceGuard).SecurityServicesRunning', 'El valor 1 indica Credential Guard en ejecución.'],
    ['Restringe inicios de sesión', '', 'GPO para puestos (tier 2): *Denegar inicio de sesión local* y *a través de Escritorio remoto* a **Domain Admins** y cuentas tier 0.'],
  ],
  defense: 'Estas medidas, junto con MFA y la monitorización de grupos privilegiados (4728/4732/4756), detienen la mayoría de las cadenas de ransomware observadas.',
  challenge: 'Diseña la matriz de niveles de tu laboratorio: qué cuentas, grupos y equipos son tier 0/1/2 y qué GPO aplica cada restricción. Impleméntala y verifica con BloodHound que han desaparecido rutas.',
  refs: [['Microsoft — Enterprise access model', 'https://learn.microsoft.com/security/privileged-access-workstations/privileged-access-access-model'], ['Windows LAPS', 'https://learn.microsoft.com/windows-server/identity/laps/laps-overview']] },
{ id: 'ad-06', t: 'ADCS (certificados): auditoría de plantillas peligrosas', min: 90, labs: ['dc01'],
  obj: ['Entender por qué una plantilla mal configurada compromete el dominio', 'Auditar ADCS con **Locksmith**', 'Corregir las configuraciones ESC más comunes'],
  theory: `Los **Servicios de Certificados de AD** emiten certificados que pueden servir para autenticarse. Si una plantilla permite que quien la solicita elija **para quién** es el certificado (*ENROLLEE_SUPPLIES_SUBJECT*) y sirve para autenticación de cliente, cualquier usuario con permiso de inscripción podría obtener uno a nombre de un administrador. La investigación «Certified Pre-Owned» (SpecterOps) catalogó estas configuraciones como ESC1…ESC8.`,
  steps: [
    ['Instala ADCS en SRV01 (laboratorio)', `Install-WindowsFeature ADCS-Cert-Authority -IncludeManagementTools
Install-AdcsCertificationAuthority -CAType EnterpriseRootCA -Force`, ''],
    ['Audita con Locksmith', `Install-Module -Name Locksmith -Scope CurrentUser
Invoke-Locksmith -Mode 1`, 'Locksmith es una herramienta defensiva que lista configuraciones ESC y propone el script de corrección.'],
    ['Corrige', '', 'Quita *Supply in the request* de las plantillas de autenticación, restringe quién puede inscribirse, exige aprobación del administrador de la CA y elimina permisos de escritura de usuarios normales sobre plantillas.'],
    ['Monitoriza', '', 'Habilita la auditoría de la CA (eventos 4886/4887) y alerta de certificados emitidos con un *subject* distinto del solicitante.'],
  ],
  defense: 'Trata la CA como **tier 0**: mismo nivel de protección que un DC.',
  challenge: 'Crea una plantilla deliberadamente débil, detéctala con Locksmith, corrígela y verifica que deja de aparecer.',
  refs: [['Certified Pre-Owned (SpecterOps)', 'https://specterops.io/wp-content/uploads/sites/3/2022/06/Certified_Pre-Owned.pdf'], ['Locksmith', 'https://github.com/jakehildreth/Locksmith']] },
{ id: 'ad-07', t: 'Identidad híbrida y Entra ID: acceso condicional y privilegios just-in-time', min: 60, labs: ['cloud'],
  obj: ['Conocer los riesgos del sincronismo AD ↔ Entra ID', 'Diseñar políticas de **acceso condicional**', 'Usar **PIM** para privilegios temporales'],
  theory: `En entornos híbridos, el servidor de **Entra Connect** es tier 0: quien lo controla puede afectar a la nube y al dominio. Controles esenciales en Entra ID:
- Bloquear la **autenticación heredada** (sin MFA posible).
- **Acceso condicional**: MFA resistente a phishing para administradores, dispositivos conformes, ubicaciones.
- **PIM**: roles de administrador solo cuando se necesitan, con aprobación y caducidad.
- Revisar **consentimientos de aplicaciones** (OAuth) y *service principals* con permisos altos.`,
  steps: [['Crea un tenant de pruebas', '', 'El **Microsoft 365 Developer Program** o una suscripción de prueba de Entra ID P2 te dan un entorno legal para practicar.'],
          ['Audita con herramientas libres', 'pipx install scoutsuite && scout azure --cli', 'También: **Maester** (pruebas automáticas de configuración de Entra) y la *Secure Score* de Microsoft.']],
  defense: 'Separar cuentas cloud-only para administración, sin sincronizar privilegios del AD local a la nube.',
  challenge: 'Diseña 6 políticas de acceso condicional para una empresa de 300 personas y justifica cada una frente a una amenaza concreta.',
  refs: [['Microsoft — Conditional Access', 'https://learn.microsoft.com/entra/identity/conditional-access/'], ['Maester', 'https://maester.dev']] },
]},
]};
