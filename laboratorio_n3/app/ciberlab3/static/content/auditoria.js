/* Plantillas y guías del programa de Auditorías */
CL.audit = {
intro: `# 📋 Auditorías de seguridad

Este programa organiza cada auditoría como un **expediente**: datos del cliente, alcance, autorización firmada, checklist de controles, hallazgos con CVSS e informe final. Todo se guarda en \`~/CiberLab3/auditorias/\` como JSON (haz copia cifrada: contiene información sensible del cliente).

### Flujo de trabajo
1. **＋ Nueva auditoría** → elige *pyme* o *gran empresa* (cambia la checklist y la metodología).
2. **Datos y alcance**: qué entra, qué no, horarios, tipo de prueba (caja negra/gris/blanca).
3. **Autorización**: genera el documento, que lo firme el cliente, márcalo como firmado. *Sin firma no se empieza.*
4. **Checklist**: revisa los controles; cada «falla» se convierte en hallazgo con un clic.
5. **Hallazgos**: documenta evidencia, impacto y recomendación. Calcula CVSS 3.1.
6. **Informe**: se genera solo. Revísalo, imprímelo a PDF y entrégalo por un canal cifrado.

> 💡 Empieza haciendo una **auditoría de práctica contra tu propio laboratorio** (Metasploitable + DVWA). Es la mejor forma de aprender a redactar hallazgos antes de tener clientes.

Las guías de la izquierda explican la metodología, las diferencias entre auditar una pyme y una gran empresa, el marco legal y cómo escribir un buen informe.`,

services: [
  ['ext', 'Pentest externo'], ['int', 'Pentest interno'], ['web', 'Aplicación web / API'], ['wifi', 'WiFi'], ['ad', 'Active Directory'],
  ['cloud', 'Cloud (AWS/Azure/GCP/M365)'], ['social', 'Ingeniería social / phishing'], ['config', 'Revisión de configuración / bastionado'],
  ['redteam', 'Red Team'], ['gap', 'Análisis de cumplimiento (ISO 27001 / ENS / NIS2)'],
],

method_pyme: `**Enfoque pyme: práctico, de alto impacto y a coste contenido (3‑10 días).** Las pymes rara vez tienen equipo de seguridad: prioriza lo que más riesgo reduce por euro invertido.

1. **Entrevista inicial (1‑2 h):** qué hace la empresa, qué datos son críticos (facturación, clientes, diseños), quién gestiona la informática (¿un proveedor externo?), qué pasaría si mañana no pudieran trabajar.
2. **Inventario rápido:** dominios, IP pública, correo (M365/Google), web y quién la aloja, router/firewall, servidores/NAS, portátiles, móviles, programas en la nube.
3. **Superficie externa:** \`nmap\` a la IP pública, puertos expuestos (RDP, NAS, cámaras), certificados, correo (SPF/DKIM/DMARC), web (WordPress desactualizado, panel de admin expuesto).
4. **Identidades:** MFA en correo y banca, contraseñas compartidas, cuentas de ex‑empleados, admin local en todos los PCs.
5. **Copias de seguridad:** ¿existen?, ¿hay copia **offline/inmutable**?, ¿se ha probado restaurar? (la pregunta que salva empresas del ransomware).
6. **Red interna (si contratado):** WiFi de invitados separada, equipos sin parchear, SMB abierto, NAS con credenciales por defecto.
7. **Equipos:** antivirus/EDR, actualizaciones automáticas, cifrado de disco en portátiles.
8. **Informe corto y accionable:** resumen ejecutivo de 1 página + 10 acciones priorizadas con coste aproximado. Ofrece un **retest**.`,

method_gran: `**Enfoque gran empresa: metodología formal, trazabilidad y coordinación (semanas).**

1. **Pre‑contratación:** propuesta, SOW (statement of work), NDA, reglas de enfrentamiento (RoE), seguros de responsabilidad civil profesional, coordinación con SOC/Blue Team (¿prueba anunciada o no?).
2. **Kick‑off:** contactos técnicos y de emergencia, canal cifrado, ventanas horarias, IPs de origen del auditor (para que el SOC las identifique), criterios de parada.
3. **Reconocimiento:** OSINT (dominios, subdominios, empleados, filtraciones), superficie externa a escala (\`amass\`, \`subfinder\`, \`httpx\`, \`nuclei\`).
4. **Pruebas por servicio:** externo, interno (desde un portátil en la red o VPN), aplicaciones (OWASP WSTG / ASVS), Active Directory (BloodHound, ADCS, delegaciones), cloud (CIS Benchmarks, Prowler/ScoutSuite), WiFi, ingeniería social.
5. **Explotación controlada:** solo hasta demostrar el impacto pactado (p. ej. «Domain Admin» o «acceso a datos de clientes»). Nada destructivo. Registra todo con hora.
6. **Comunicación de críticos:** un hallazgo crítico (RCE expuesta, credenciales en abierto) se comunica **en el momento**, no en el informe.
7. **Informe:** resumen ejecutivo para dirección, informe técnico para sistemas, mapeo a marcos (ISO 27001 Anexo A, ENS, NIS2, PCI‑DSS), matriz de riesgos.
8. **Presentación de resultados y retest.** Limpieza: elimina cuentas, ficheros y herramientas que dejaste.`,

authorization: `# Autorización de pruebas de seguridad y reglas de enfrentamiento

**Cliente:** {cliente}
**Responsable que autoriza:** {autorizacion.firmante} — {autorizacion.cargo}
**Auditor/empresa auditora:** {auditor}
**Periodo autorizado:** del {inicio} al {fin}

## 1. Objeto
El Cliente autoriza expresamente al Auditor a realizar pruebas de seguridad (${'{alcance.tipo_prueba}'}) sobre los sistemas detallados en el apartado 2, con el único fin de identificar vulnerabilidades y proponer medidas de mejora.

## 2. Alcance autorizado
{alcance.incluido}

## 3. Sistemas EXCLUIDOS (no se probarán)
{alcance.excluido}

## 4. Ventanas horarias y restricciones
{alcance.ventanas}

- No se realizarán pruebas de denegación de servicio salvo acuerdo expreso por escrito.
- No se modificarán ni borrarán datos de producción. La explotación se limitará a demostrar el impacto.
- Los datos personales a los que se acceda accidentalmente no se copiarán más allá de lo imprescindible como evidencia y se eliminarán al cerrar el proyecto (RGPD art. 28: el Auditor actúa como encargado del tratamiento).

## 5. Declaración del Cliente
El Cliente declara ser titular de los sistemas indicados o disponer de autorización de sus titulares (proveedores de hosting, cloud o servicios gestionados) para someterlos a estas pruebas.

## 6. Contactos y criterios de parada
- Contacto técnico del Cliente (24 h durante las pruebas): {contacto}
- El Auditor detendrá las pruebas y avisará de inmediato si detecta: inestabilidad de un sistema, indicios de un compromiso real previo por terceros, o acceso a datos especialmente sensibles.
- El Cliente puede ordenar la parada inmediata en cualquier momento.

## 7. Confidencialidad
Los resultados son confidenciales, se entregarán cifrados y solo a las personas designadas. El Auditor custodiará las evidencias de forma cifrada y las destruirá transcurridos [X] días desde la entrega del informe.

## 8. Firmas

| Por el Cliente | Por el Auditor |
|---|---|
| Nombre: {autorizacion.firmante} | Nombre: {auditor} |
| Cargo: {autorizacion.cargo} | |
| Fecha: {autorizacion.fecha} | Fecha: |
| Firma: | Firma: |

> ⚠ Plantilla orientativa, no asesoramiento legal. Para clientes reales, revísala con un abogado y complétala con un contrato de servicios y un acuerdo de encargado del tratamiento (RGPD).`,

guides: [
{ id: 'metodologia', t: '🧭 Metodología paso a paso', md: `# 🧭 Metodología de una auditoría (pentest) paso a paso

Los marcos de referencia son **PTES** (Penetration Testing Execution Standard), **OWASP WSTG** (web), **NIST SP 800‑115**, **OSSTMM** y, para Active Directory/red team, **MITRE ATT&CK**. Todos se resumen en estas fases:

| Fase | Qué haces | Herramientas típicas | Entregable |
|---|---|---|---|
| 0. Preparación | Alcance, autorización, RoE, contactos, entorno limpio | Este programa, KeePassXC, VM dedicada | Autorización firmada |
| 1. Reconocimiento pasivo | OSINT sin tocar al cliente | whois, crt.sh, theHarvester, Shodan, Google dorks | Inventario de activos |
| 2. Reconocimiento activo | Descubrir hosts, puertos, servicios, versiones | nmap, masscan, httpx, whatweb | Mapa de superficie |
| 3. Análisis de vulnerabilidades | Relacionar versiones con fallos, escanear | nuclei, nikto, OpenVAS/Greenbone, searchsploit | Lista de candidatos |
| 4. Explotación | Confirmar los fallos de forma controlada | Burp, sqlmap, Metasploit, scripts | Evidencias |
| 5. Post‑explotación | Escalada, movimiento lateral, demostrar impacto | linpeas, winPEAS, BloodHound, NetExec | Ruta de ataque |
| 6. Informe | Redactar, priorizar, recomendar | Este programa | Informe ejecutivo + técnico |
| 7. Retest y cierre | Verificar correcciones, limpiar | — | Carta de cierre |

## Reglas que separan a un profesional de un aficionado
1. **Registra todo con hora** (\`script -t\`, notas con timestamp). Si algo se cae durante la prueba, podrás demostrar qué hiciste y qué no.
2. **Guarda las salidas** de cada herramienta en \`~/CiberLab3/loot/<cliente>/\` (p. ej. \`nmap -oA\`).
3. **Valida manualmente** lo que dicen los escáneres: los falsos positivos destruyen la credibilidad de un informe.
4. **Demuestra el impacto mínimo necesario**: si lees \`/etc/passwd\` con un LFI, no hace falta volcar la base de datos de clientes.
5. **Avisa de los críticos al momento.**
6. **Limpia** al terminar: usuarios creados, webshells, ficheros subidos, reglas añadidas.

## Ejemplo: comandos de las fases 1‑3 contra tu laboratorio
\`\`\`bash
mkdir -p ~/CiberLab3/loot/practica && cd ~/CiberLab3/loot/practica
# 2. Descubrimiento de hosts y puertos
nmap -sn 192.168.56.0/24 -oA 01-hosts
nmap -p- --min-rate 2000 -T4 192.168.56.101 -oA 02-puertos
nmap -sCV -p21,22,80,139,445,3306 192.168.56.101 -oA 03-servicios
# 3. Vulnerabilidades conocidas para las versiones detectadas
searchsploit vsftpd 2.3.4
nmap --script vuln -p21,80,445 192.168.56.101 -oA 04-vuln
nikto -h http://192.168.56.101 -o 05-nikto.txt
\`\`\`` },
{ id: 'pyme', t: '🏪 Pyme vs. gran empresa', md: `# 🏪 Auditar una pyme vs. una gran empresa

| Aspecto | Pyme | Gran empresa |
|---|---|---|
| Interlocutor | Gerente + proveedor informático | CISO, SOC, sistemas, legal, compras |
| Duración | 2‑10 días | 2‑8 semanas |
| Madurez típica | Sin políticas, admin compartido, sin MFA, copias sin probar | Políticas existentes; fallos en la complejidad (AD, cloud híbrido, terceros) |
| Lo que más valor aporta | Copias offline, MFA, parches, cerrar RDP/NAS expuestos, formación anti‑phishing | Rutas de ataque en AD, segmentación, detección (¿el SOC te vio?), gestión de terceros |
| Normativa | RGPD; a veces NIS2 si es proveedor de sector crítico | RGPD, NIS2, ENS (sector público), DORA (financiero), PCI‑DSS, ISO 27001 |
| Informe | Corto, en lenguaje de negocio, con costes | Ejecutivo + técnico + mapeo a marcos + métricas |
| Precio orientativo (España) | 1.500 – 6.000 € | 10.000 – 80.000 €+ |

## Las 10 cosas que casi siempre encontrarás en una pyme
1. Correo sin MFA (o MFA solo en algunas cuentas).
2. Una única cuenta de administrador compartida, con contraseña tipo «Empresa2024!».
3. RDP, NAS (Synology/QNAP) o cámaras expuestos a Internet.
4. Copias de seguridad en un NAS **conectado permanentemente** a la red (el ransomware las cifra también).
5. Router del operador con la configuración de fábrica y WPS activo.
6. WordPress con plugins desactualizados.
7. Sin SPF/DKIM/DMARC → suplantación del dominio en correos de «cambio de cuenta bancaria».
8. Ex‑empleados con cuentas activas (correo, ERP, nube).
9. Portátiles sin cifrar y usuarios con permisos de administrador.
10. Windows/Office sin actualizar o software sin soporte.

## Las 10 cosas que casi siempre encontrarás en una gran empresa
1. Rutas de ataque a Domain Admin en BloodHound (sesiones de admins en equipos de usuarios, ACLs mal puestas).
2. Cuentas de servicio *kerberoasteables* con contraseñas débiles.
3. Plantillas de certificados ADCS vulnerables (ESC1‑ESC8).
4. Credenciales en scripts, recursos compartidos (\`\\\\srv\\scripts\`) o GPP.
5. LLMNR/NBT‑NS activos → captura de hashes con Responder.
6. Shadow IT y subdominios olvidados (*subdomain takeover*).
7. Buckets/blobs cloud públicos, roles IAM excesivos.
8. Segmentación débil entre usuarios, servidores y OT/industrial.
9. Parches aplicados en servidores pero no en equipos «especiales» (impresoras, VoIP, appliances).
10. El SOC no detecta técnicas básicas (spraying, kerberoasting, DCSync) → la auditoría también mide **detección**.` },
{ id: 'legal', t: '⚖ Marco legal y contratos', md: `# ⚖ Marco legal (España / UE)

> ⚠ Resumen orientativo, no asesoramiento jurídico.

## Código Penal
- **Art. 197 bis**: acceso sin autorización a un sistema de información (o mantenerse dentro contra la voluntad del titular) → prisión de 6 meses a 2 años. También interceptar transmisiones no públicas.
- **Art. 197 ter**: producir, adquirir o facilitar programas o contraseñas **con intención** de cometer los delitos anteriores.
- **Art. 264 y 264 bis**: daños informáticos y obstaculizar el funcionamiento de sistemas (p. ej. una denegación de servicio).

Lo que convierte un ataque en una auditoría legal es la **autorización previa, por escrito, del titular legítimo** y respetar el alcance. «Lo hice para ayudar» no es defensa.

## RGPD
Si en la auditoría puedes acceder a datos personales, actúas como **encargado del tratamiento** (art. 28): necesitas un contrato de encargo con el cliente, medidas de seguridad, confidencialidad y destrucción de datos al finalizar. Si detectas una brecha real, el cliente tiene 72 h para notificarla a la AEPD.

## NIS2 (transpuesta en España mediante la ley de coordinación y gobernanza de la ciberseguridad)
Obliga a entidades «esenciales» e «importantes» (energía, transporte, salud, agua, infraestructura digital, administración, alimentación, fabricación, proveedores TIC gestionados…) a gestionar riesgos, notificar incidentes y **controlar su cadena de suministro**. Muchas pymes proveedoras reciben requisitos de seguridad de sus clientes grandes por esta vía: oportunidad para auditorías.

## ENS (Esquema Nacional de Seguridad, RD 311/2022)
Obligatorio para el sector público y sus proveedores tecnológicos. Categorías básica/media/alta, con medidas (op.exp, mp.com…) auditables.

## Otros
- **ISO/IEC 27001:2022** (SGSI certificable) y **27002** (controles).
- **DORA** (sector financiero, desde enero 2025): exige pruebas de resiliencia y, para entidades significativas, TLPT (pentest guiado por amenazas).
- **PCI‑DSS v4** si procesan tarjetas: pentest interno y externo anual y tras cambios significativos.

## Documentos que necesitas en cada proyecto
1. Propuesta y contrato de servicios (con limitación de responsabilidad).
2. NDA.
3. Autorización + reglas de enfrentamiento (este programa la genera).
4. Contrato de encargado del tratamiento (RGPD).
5. Seguro de responsabilidad civil profesional (muy recomendable).
6. Permisos de terceros: AWS, Azure y GCP permiten pentest de tus propios recursos sin aviso previo (con limitaciones: nada de DoS); hostings compartidos normalmente **no**.` },
{ id: 'informe', t: '✍ Cómo escribir un buen informe', md: `# ✍ Cómo escribir un buen informe

El informe es **lo único que el cliente se queda**. Un pentest brillante con un informe malo es un mal pentest.

## Estructura
1. **Resumen ejecutivo (1 página):** para dirección. Sin jerga. Responde a: ¿estamos en riesgo?, ¿qué podría pasar?, ¿qué hacemos primero?, ¿cuánto cuesta?
2. **Alcance y metodología.**
3. **Tabla resumen de hallazgos** ordenada por severidad.
4. **Detalle de cada hallazgo:** título, severidad/CVSS, activo, descripción, **pasos para reproducirlo**, evidencia, impacto de negocio, recomendación concreta y referencias.
5. **Plan de acción** por plazos.
6. **Anexos:** salidas de herramientas, lista de activos probados.

## Un buen hallazgo vs. uno malo
**❌ Malo:** «SQL Injection. Severidad alta. Se recomienda sanear las entradas.»

**✅ Bueno:**
> **Inyección SQL en el buscador de productos permite extraer la base de datos de clientes** (Crítica, CVSS 9.1)
>
> El parámetro \`id\` de \`https://tienda.cliente.es/productos\` se concatena en una consulta SQL sin parametrizar. Un atacante anónimo puede leer cualquier tabla. Se demostró extrayendo **solo** el número de registros de la tabla \`clientes\` (18.204) y el usuario de la base de datos.
>
> **Reproducir:** \`GET /productos?id=7 AND 1=2 UNION SELECT 1,count(*),3,4 FROM clientes-- -\`
>
> **Impacto:** robo de datos personales de 18.204 clientes → notificación obligatoria a la AEPD, posible sanción RGPD y daño reputacional.
>
> **Recomendación:** usar consultas parametrizadas (PDO \`prepare()\` con \`bindParam\`) en \`productos.php\` línea 42; cuenta de BD con permisos solo de lectura sobre las tablas necesarias; WAF como medida temporal.

## Consejos
- Una severidad debe poder defenderse: usa **CVSS** y ajústalo al contexto (un fallo crítico en un servidor de pruebas aislado no es crítico para el negocio).
- No copies la salida de un escáner sin verificarla.
- Incluye **lo que está bien**: motiva y da credibilidad.
- Censura contraseñas y datos personales en las evidencias (\`P4s****\`).
- Entrega cifrado (PDF con contraseña enviada por otro canal, o 7z AES‑256).` },
{ id: 'kit', t: '🧰 Kit del auditor', md: `# 🧰 Kit del auditor

## Antes de cada proyecto
\`\`\`bash
# VM Kali limpia para el cliente (restaura snapshot o clona)
VBoxManage snapshot kali restore limpio
# Carpeta de evidencias cifrada (gocryptfs: sudo pacman -S gocryptfs)
mkdir -p ~/CiberLab3/loot/.cliente-x.enc ~/CiberLab3/loot/cliente-x
gocryptfs -init ~/CiberLab3/loot/.cliente-x.enc
gocryptfs ~/CiberLab3/loot/.cliente-x.enc ~/CiberLab3/loot/cliente-x
# Registrar toda la sesión de terminal con tiempos
script -t 2>~/CiberLab3/loot/cliente-x/sesion.timing -a ~/CiberLab3/loot/cliente-x/sesion.log
\`\`\`

## Herramientas por fase
| Fase | Imprescindibles |
|---|---|
| OSINT | whois, dig, crt.sh, theHarvester, amass, subfinder, Shodan/Censys, Google dorks, haveibeenpwned |
| Descubrimiento | nmap, masscan, httpx, naabu, netdiscover |
| Web | Burp Suite, ffuf, feroxbuster, nuclei, sqlmap, wpscan, nikto, whatweb |
| Infra Windows/AD | NetExec, Impacket, BloodHound + SharpHound/bloodhound-python, Responder, Certipy, enum4linux-ng, kerbrute |
| Contraseñas | hashcat, john, hydra, SecLists, CeWL |
| Post‑explotación | linpeas/winPEAS, pspy, chisel/ligolo-ng (pivoting), Sliver (C2) |
| Cloud | Prowler, ScoutSuite, Pacu, AzureHound, ROADtools, Trivy |
| WiFi | aircrack-ng, hcxdumptool, hcxtools, bettercap, Kismet |
| Configuración | Lynis, CIS-CAT, PingCastle (AD), Microsoft Secure Score, testssl.sh |
| Informe | este programa, Markdown → PDF, Ghostwriter, SysReptor |

## Al terminar
- [ ] Borrar cuentas, ficheros, webshells y tareas creadas
- [ ] Revertir cambios de configuración
- [ ] Entregar informe cifrado y presentar resultados
- [ ] Planificar retest
- [ ] Destruir evidencias en el plazo pactado (\`shred\`, borrar el volumen cifrado)` },
],

/* checklist: only = 'pyme' | 'gran' (si no, ambas). sev = severidad por defecto del hallazgo */
checklist: [
{ t: '1. Gobierno, inventario y riesgos', items: [
  { id: 'gov-resp', t: 'Hay un **responsable de seguridad** designado (aunque sea a tiempo parcial)', how: 'Pregunta quién decide y responde ante un incidente.', fix: 'Designar un responsable de seguridad con tiempo y presupuesto asignados.', sev: 'media' },
  { id: 'gov-inv', t: '**Inventario** actualizado de equipos, servidores, servicios cloud y datos críticos', how: 'Pide el inventario; compáralo con lo que descubres con nmap/OSINT.', fix: 'Mantener un inventario de activos (hardware, software, SaaS, datos) revisado trimestralmente.', sev: 'media' },
  { id: 'gov-pol', t: 'Políticas básicas escritas: uso aceptable, contraseñas, teletrabajo, BYOD', how: 'Revisa si existen y si los empleados las conocen.', fix: 'Redactar y comunicar políticas mínimas; firmar el uso aceptable al incorporarse.', sev: 'baja' },
  { id: 'gov-risk', t: 'Análisis de riesgos formal (ISO 27005 / MAGERIT) revisado al menos anualmente', how: 'Solicita el último análisis de riesgos y su plan de tratamiento.', fix: 'Implantar un proceso de gestión de riesgos con revisión anual.', sev: 'media', only: 'gran' },
  { id: 'gov-terc', t: 'Gestión de **proveedores** con requisitos de seguridad (NIS2: cadena de suministro)', how: 'Revisa contratos con el MSP/hosting: accesos, MFA, notificación de incidentes.', fix: 'Incluir cláusulas de seguridad y revisar periódicamente el acceso de terceros.', sev: 'media' },
  { id: 'gov-cumpl', t: 'Cumplimiento identificado: RGPD (registro de actividades), NIS2, ENS, PCI‑DSS…', how: 'Pregunta qué normativas aplican y cómo se evidencian.', fix: 'Identificar la normativa aplicable y asignar responsables de cumplimiento.', sev: 'media' },
]},
{ t: '2. Identidades y accesos', items: [
  { id: 'iam-mfa', t: '**MFA** en correo, VPN, accesos remotos, cloud y cuentas de administrador', how: 'Comprueba en M365/Google Admin el estado de MFA por usuario; prueba el login a la VPN.', fix: 'Activar MFA obligatoria (preferiblemente app/FIDO2, no SMS) para todos los usuarios y siempre para administradores.', sev: 'alta' },
  { id: 'iam-pass', t: 'Política de contraseñas: longitud ≥ 12‑14, bloqueo tras intentos, sin caducidad forzada absurda', how: 'Revisa la GPO / política del IdP; prueba spraying de 1 contraseña en el laboratorio del cliente si está autorizado.', fix: 'Longitud mínima 14, lista de contraseñas prohibidas (Entra ID Password Protection), bloqueo inteligente.', sev: 'media' },
  { id: 'iam-shared', t: 'No hay **cuentas compartidas** ni admin genérico usado por varias personas', how: 'Pregunta cómo se administran los equipos; busca usuarios "admin", "administrador", "soporte".', fix: 'Cuentas nominativas; cuentas de administración separadas de las de uso diario.', sev: 'alta', only: 'pyme' },
  { id: 'iam-bajas', t: 'Proceso de **bajas**: cuentas de ex‑empleados deshabilitadas el mismo día', how: 'Compara lista de usuarios activos con plantilla actual; mira lastLogon en AD.', fix: 'Procedimiento de offboarding con checklist (correo, VPN, SaaS, ERP, llaves).', sev: 'alta' },
  { id: 'iam-admin', t: 'Usuarios **sin derechos de administrador local** en sus equipos', how: '`net localgroup administradores` en un equipo de usuario.', fix: 'Retirar admin local; usar LAPS para la cuenta local de administrador.', sev: 'media' },
  { id: 'iam-laps', t: 'Contraseña de administrador local **única por equipo** (Windows LAPS)', how: 'Con NetExec: `nxc smb 10.0.0.0/24 -u Administrador -H <hash> --local-auth` (¿reutilizada?).', fix: 'Desplegar Windows LAPS.', sev: 'alta', only: 'gran' },
  { id: 'iam-tier', t: 'Modelo de **niveles** (tiering) para administradores de dominio; no inician sesión en estaciones de trabajo', how: 'BloodHound: sesiones de Domain Admins en equipos de usuario.', fix: 'Implantar tiering, PAWs y grupo Protected Users para cuentas privilegiadas.', sev: 'alta', only: 'gran' },
  { id: 'iam-svc', t: 'Cuentas de servicio con contraseñas largas o **gMSA** (no kerberoasteables)', how: '`impacket-GetUserSPNs -request` y prueba de crackeo en el lab del cliente.', fix: 'Migrar a gMSA o contraseñas aleatorias de 30+ caracteres; AES only.', sev: 'alta', only: 'gran' },
  { id: 'iam-pam', t: 'Revisión periódica de privilegios y accesos (recertificación)', how: 'Pide la última revisión de miembros de grupos privilegiados.', fix: 'Recertificación trimestral de accesos privilegiados.', sev: 'media', only: 'gran' },
]},
{ t: '3. Perímetro y red', items: [
  { id: 'net-expo', t: 'Sin servicios sensibles expuestos a Internet (RDP, SMB, NAS, bases de datos, paneles)', how: '`nmap -Pn -p- --min-rate 1000 IP_PUBLICA`; busca la IP en Shodan.', fix: 'Cerrar puertos; acceso remoto solo por VPN con MFA.', sev: 'critica' },
  { id: 'net-fw', t: 'Firewall con política por defecto **denegar** y reglas revisadas', how: 'Revisa la configuración del firewall/router; busca reglas "any-any".', fix: 'Política de mínimo privilegio en el firewall; revisión semestral de reglas.', sev: 'media' },
  { id: 'net-seg', t: '**Segmentación**: usuarios, servidores, invitados, IoT/cámaras y gestión en redes separadas', how: 'Desde la red de usuarios, ¿llegas a la gestión de switches, cámaras o servidores? (`nmap` interno)', fix: 'VLANs con filtrado entre segmentos; red de invitados aislada.', sev: 'alta' },
  { id: 'net-wifi', t: 'WiFi corporativa WPA2/WPA3‑Enterprise o PSK robusta; WPS desactivado; invitados aislados', how: 'Revisa el router/AP; prueba si desde la WiFi de invitados se ve la LAN.', fix: 'WPA3 o WPA2‑AES con clave de 20+ caracteres (pyme) o 802.1X (empresa); desactivar WPS.', sev: 'alta' },
  { id: 'net-vpn', t: 'VPN/acceso remoto actualizado y con MFA (Fortinet, Pulse, Citrix… son objetivos prioritarios)', how: 'Identifica el producto y versión; busca CVE en el catálogo KEV de CISA.', fix: 'Actualizar con prioridad máxima; MFA; restringir por geolocalización si procede.', sev: 'critica' },
  { id: 'net-llmnr', t: 'LLMNR, NBT‑NS y mDNS desactivados; **SMB signing** obligatorio', how: '`responder -I eth0 -A` (modo análisis); `nxc smb RANGO --gen-relay-list sinfirma.txt`', fix: 'GPO para deshabilitar LLMNR/NBT‑NS; exigir firma SMB en todos los equipos.', sev: 'alta' },
  { id: 'net-dns', t: 'Correo: **SPF, DKIM y DMARC** (p=quarantine/reject) configurados', how: '`dig TXT dominio.es`, `dig TXT _dmarc.dominio.es`', fix: 'Publicar SPF con -all, firmar con DKIM y DMARC p=reject tras periodo de monitorización.', sev: 'media' },
  { id: 'net-tls', t: 'Servicios web con TLS correcto (TLS 1.2+, sin cifrados débiles, HSTS)', how: '`testssl.sh https://dominio`', fix: 'Desactivar TLS 1.0/1.1 y cifrados débiles; activar HSTS.', sev: 'baja' },
]},
{ t: '4. Equipos y servidores', items: [
  { id: 'end-patch', t: 'Actualizaciones de SO y aplicaciones automáticas; sin software sin soporte', how: 'Revisa versiones (Windows 10 sin ESU, Server 2012, PHP 5…); escaneo autenticado.', fix: 'Gestión de parches centralizada (WSUS/Intune/Ansible) con SLA por criticidad.', sev: 'alta' },
  { id: 'end-edr', t: 'Antivirus/**EDR** en todos los equipos y servidores, gestionado centralmente', how: 'Consola del EDR: ¿cobertura 100%? ¿alertas revisadas?', fix: 'Desplegar EDR (Defender for Business/Endpoint u otro) y revisar alertas.', sev: 'alta' },
  { id: 'end-crypt', t: 'Portátiles con **cifrado de disco** (BitLocker/FileVault/LUKS)', how: '`manage-bde -status`', fix: 'Activar BitLocker con TPM+PIN y custodia de claves de recuperación.', sev: 'media' },
  { id: 'end-hard', t: 'Servidores bastionados (CIS Benchmarks): servicios innecesarios desactivados, SSH sin contraseña ni root', how: '`lynis audit system` en Linux; revisión de GPO en Windows.', fix: 'Aplicar CIS Benchmarks nivel 1 como base.', sev: 'media' },
  { id: 'end-macro', t: 'Macros de Office bloqueadas desde Internet; ASR rules activas', how: 'Revisa GPO/Intune de Office y reglas ASR de Defender.', fix: 'Bloquear macros de Internet y activar reglas ASR.', sev: 'media' },
  { id: 'end-usb', t: 'Control de dispositivos USB / medios extraíbles', how: 'Pregunta y prueba con un USB en un equipo.', fix: 'Política de control de dispositivos (bloqueo o solo lectura).', sev: 'baja' },
]},
{ t: '5. Aplicaciones web y desarrollo', items: [
  { id: 'web-cms', t: 'CMS (WordPress, Prestashop…) y plugins actualizados; panel de admin no expuesto o con MFA', how: '`wpscan --url https://web --enumerate vp,vt,u`', fix: 'Actualizaciones automáticas, eliminar plugins no usados, MFA y restricción de /wp-admin.', sev: 'alta' },
  { id: 'web-owasp', t: 'Aplicaciones propias probadas contra **OWASP Top 10** (inyección, control de acceso, XSS…)', how: 'Pentest de la aplicación con Burp siguiendo OWASP WSTG.', fix: 'Corregir hallazgos; integrar SAST/DAST en el ciclo de desarrollo.', sev: 'alta' },
  { id: 'web-head', t: 'Cabeceras de seguridad (CSP, HSTS, X‑Content‑Type‑Options, cookies Secure/HttpOnly/SameSite)', how: '`curl -sI https://web`', fix: 'Configurar cabeceras de seguridad en el servidor web.', sev: 'baja' },
  { id: 'web-secrets', t: 'Sin secretos en repositorios, `.git`/`.env`/backups expuestos en la web', how: '`ffuf -w SecLists/Discovery/Web-Content/quickhits.txt -u https://web/FUZZ`; gitleaks en repos.', fix: 'Eliminar ficheros expuestos, rotar secretos filtrados, usar un gestor de secretos.', sev: 'critica' },
  { id: 'web-sdlc', t: 'Ciclo de desarrollo seguro: revisión de código, SAST/DAST, dependencias (SCA)', how: 'Revisa el pipeline CI/CD.', fix: 'Añadir Semgrep/Trivy/Dependabot y revisión por pares obligatoria.', sev: 'media', only: 'gran' },
]},
{ t: '6. Copias de seguridad y continuidad', items: [
  { id: 'bk-321', t: 'Regla **3‑2‑1‑1‑0**: 3 copias, 2 soportes, 1 fuera, **1 offline/inmutable**, 0 errores', how: 'Pregunta dónde están las copias. ¿Un ransomware con admin de dominio podría borrarlas?', fix: 'Añadir copia inmutable u offline (cinta, nube con inmutabilidad, disco desconectado).', sev: 'critica' },
  { id: 'bk-test', t: 'Restauraciones **probadas** periódicamente', how: 'Pide la evidencia de la última prueba de restauración.', fix: 'Prueba de restauración trimestral documentada.', sev: 'alta' },
  { id: 'bk-cred', t: 'Las credenciales del sistema de copias **no** son las del dominio', how: '¿La consola de backup usa una cuenta de AD? ¿Está unida al dominio?', fix: 'Sistema de copias fuera del dominio con credenciales y MFA propias.', sev: 'alta' },
  { id: 'bk-bcp', t: 'Plan de continuidad / recuperación con RTO y RPO definidos', how: '¿Cuánto tiempo puede parar el negocio? ¿Cuántos datos puede perder?', fix: 'Definir RTO/RPO y un plan de recuperación probado.', sev: 'media' },
]},
{ t: '7. Registro, detección y respuesta', items: [
  { id: 'log-central', t: 'Logs centralizados (SIEM o al menos un servidor syslog) con retención ≥ 90 días', how: '¿Dónde van los logs de AD, firewall, VPN, M365?', fix: 'Centralizar logs (Wazuh, Sentinel, Elastic) con retención mínima de 90 días (1 año recomendado).', sev: 'media' },
  { id: 'log-audit', t: 'Auditoría de Windows avanzada + Sysmon en equipos críticos', how: '`auditpol /get /category:*`', fix: 'Política de auditoría avanzada y Sysmon con configuración de referencia.', sev: 'media', only: 'gran' },
  { id: 'log-detect', t: 'El SOC/servicio detectó las pruebas del auditor (spraying, escaneo, kerberoasting)', how: 'Al final, pregunta qué alertas saltaron y cuándo.', fix: 'Crear casos de uso de detección para las técnicas no detectadas (reglas Sigma).', sev: 'alta', only: 'gran' },
  { id: 'log-ir', t: 'Plan de **respuesta a incidentes** con contactos (incluido INCIBE‑CERT 017) y simulacros', how: '¿Qué harían si mañana aparece todo cifrado? ¿A quién llaman?', fix: 'Plan de respuesta escrito, contactos actualizados y un simulacro anual.', sev: 'media' },
  { id: 'log-alert', t: 'Alguien **revisa** las alertas (EDR, M365, firewall) a diario', how: 'Pregunta por la última alerta revisada.', fix: 'Asignar la revisión diaria de alertas o contratar un SOC/MDR.', sev: 'media', only: 'pyme' },
]},
{ t: '8. Cloud y SaaS', items: [
  { id: 'cl-m365', t: 'Microsoft 365 / Google Workspace: MFA, acceso condicional, autenticación heredada bloqueada', how: 'Microsoft Secure Score; revisa Entra ID → Acceso condicional.', fix: 'Bloquear autenticación heredada; acceso condicional; revisar Secure Score.', sev: 'alta' },
  { id: 'cl-root', t: 'Cuenta raíz/global admin con MFA hardware, sin claves de acceso, uso excepcional', how: 'AWS: IAM credential report; Azure: roles Global Administrator.', fix: 'MFA FIDO2 en raíz, sin access keys, ≤ 2‑4 administradores globales.', sev: 'critica' },
  { id: 'cl-public', t: 'Sin almacenamiento público (S3, Blob, GCS) ni snapshots compartidos', how: '`prowler aws` / ScoutSuite', fix: 'Bloqueo de acceso público a nivel de cuenta; revisión periódica.', sev: 'critica' },
  { id: 'cl-iam', t: 'IAM de mínimo privilegio; sin claves estáticas antiguas', how: 'Prowler: claves > 90 días, políticas con "*".', fix: 'Roles temporales (SSO), rotación, eliminar permisos comodín.', sev: 'alta' },
  { id: 'cl-log', t: 'CloudTrail / Activity Log / Audit Logs activos y protegidos', how: 'Comprueba que están activos en todas las regiones y enviados a una cuenta de logs.', fix: 'Activar registros de auditoría organizativos con inmutabilidad.', sev: 'media' },
]},
{ t: '9. Personas y entorno físico', items: [
  { id: 'hum-train', t: 'Formación de concienciación periódica y simulaciones de **phishing**', how: '¿Cuándo fue la última formación? ¿Hay campañas simuladas?', fix: 'Formación anual + simulaciones de phishing trimestrales.', sev: 'media' },
  { id: 'hum-fraud', t: 'Procedimiento contra el **fraude del CEO** / cambio de cuenta bancaria (verificación por otro canal)', how: 'Pregunta a administración cómo verifican un cambio de IBAN de un proveedor.', fix: 'Verificación telefónica obligatoria con número conocido ante cambios de pago.', sev: 'alta', only: 'pyme' },
  { id: 'hum-phys', t: 'Control de acceso físico a sala de servidores/rack; pantallas bloqueadas', how: 'Paseo por la oficina: ¿rack abierto?, ¿post‑its con contraseñas?, ¿equipos desbloqueados?', fix: 'Rack bajo llave, bloqueo automático de pantalla, política de mesas limpias.', sev: 'media' },
]},
],
};
