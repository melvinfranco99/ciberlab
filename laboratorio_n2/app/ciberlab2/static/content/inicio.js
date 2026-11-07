/* N2 · Escritorio 1 — Ruta avanzada y método */
CL.areas.inicio = { id: 'inicio', title: 'Ruta N2 y método', tagline: 'Pensar como un equipo profesional: marcos, modelado de amenazas, automatización y detección.',
intro: `## Cómo trabajar en el N2
1. Cada práctica sigue el **ciclo purple team**: *entender la técnica → comprobar la telemetría → emular en el laboratorio → detectar → mitigar → documentar*.
2. Las lecciones asumen que dominas el N1. Si un concepto te suena raro, búscalo en el **Glosario** (barra superior o tecla \`/\`).
3. Todo lo que construyas (reglas Sigma, YARA, consultas SPL, scripts) guárdalo en \`~/CiberLab2/detecciones/\` y \`~/CiberLab2/scripts/\`: es tu portfolio profesional.
4. Dedica una tarde a la semana a un dataset real (BOTS, EVTX-ATTACK-SAMPLES, MemLabs). Ahí se aprende a investigar.`,
levels: [
{ name: 'Base N2', lessons: [
{ id: 'n2-01', t: 'MITRE ATT&CK de verdad: tácticas, técnicas, procedimientos y cobertura', min: 60, labs: ['host'],
  obj: ['Leer una técnica de ATT&CK y extraer **qué datos** necesitas para detectarla', 'Diferenciar táctica, técnica, subtécnica y procedimiento', 'Construir un **mapa de cobertura** con ATT&CK Navigator'],
  theory: `**ATT&CK** es una base de conocimiento de comportamientos reales de adversarios, organizada en:

| Nivel | Pregunta | Ejemplo |
|---|---|---|
| **Táctica** | ¿Para qué? (objetivo) | TA0006 Credential Access |
| **Técnica** | ¿Cómo, en general? | T1558 Steal or Forge Kerberos Tickets |
| **Subtécnica** | ¿Cómo, en concreto? | T1558.003 Kerberoasting |
| **Procedimiento** | ¿Cómo lo hizo un grupo concreto? | «APT29 pidió TGS con RC4 para cuentas con SPN» |

Cada técnica incluye **Data Sources** (qué telemetría la revela), **Detection** y **Mitigations**. Esa es la parte que usa un defensor.

### Pirámide del dolor
Bloquear un hash o una IP le cuesta al atacante segundos; detectar su **comportamiento (TTP)** le obliga a cambiar de forma de trabajar. Por eso en el N2 se escriben detecciones de comportamiento, no listas de IoC.`,
  steps: [
    ['Abre ATT&CK Navigator en local', 'docker run -d --name navigator -p 127.0.0.1:4200:4200 mitre/attack-navigator', 'Abre `http://127.0.0.1:4200` → *Create New Layer* → *Enterprise*.'],
    ['Marca lo que ya detectas', '', 'Colorea en verde las técnicas que ves en tu SIEM (por ejemplo, T1110 fuerza bruta del N1). En amarillo las parciales y en rojo las ciegas.'],
    ['Exporta la capa', '', '*Download layer as JSON* → guárdalo en `~/CiberLab2/detecciones/cobertura.json`. Lo actualizarás tras cada práctica de purple team.'],
  ],
  defense: 'La cobertura no es un porcentaje bonito: prioriza las técnicas que usan los grupos que atacan a tu sector (ATT&CK → *Groups*) y las que aparecen en informes recientes (Red Canary Threat Detection Report, DFIR Report).',
  quiz: [['¿Qué te da más valor defensivo duradero?', ['Una lista de 500 IPs maliciosas', 'Una regla que detecta Word lanzando PowerShell', 'El hash de un malware'], 1, 'Es un comportamiento (TTP): el atacante tiene que cambiar de técnica para evitarlo.'],
         ['T1558.003 es…', ['Una táctica', 'Una subtécnica', 'Un grupo APT'], 1, 'El sufijo .003 indica subtécnica de T1558.']],
  challenge: 'Elige un grupo de ATT&CK que ataque a empresas españolas (por ejemplo, de ransomware). Crea una capa con sus técnicas y compárala con tu capa de cobertura. Anota las 5 brechas más graves.',
  refs: [['MITRE ATT&CK', 'https://attack.mitre.org'], ['ATT&CK Navigator', 'https://mitre-attack.github.io/attack-navigator/'], ['Red Canary Threat Detection Report', 'https://redcanary.com/threat-detection-report/']] },
{ id: 'n2-02', t: 'Modelado de amenazas (STRIDE, árboles de ataque) aplicado a una empresa real', min: 60, labs: [],
  obj: ['Modelar un sistema con un **diagrama de flujo de datos** y fronteras de confianza', 'Aplicar **STRIDE** elemento a elemento', 'Convertir amenazas en requisitos y pruebas de auditoría'],
  theory: `Modelar amenazas responde a cuatro preguntas (Shostack): *¿qué estamos construyendo?, ¿qué puede salir mal?, ¿qué vamos a hacer?, ¿lo hemos hecho bien?*

| STRIDE | Amenaza | Propiedad violada | Control típico |
|---|---|---|---|
| **S**poofing | Suplantar identidad | Autenticación | MFA, mTLS |
| **T**ampering | Alterar datos | Integridad | Firmas, hashes, permisos |
| **R**epudiation | Negar una acción | No repudio | Logs firmados, auditoría |
| **I**nformation disclosure | Fuga de datos | Confidencialidad | Cifrado, mínimo privilegio |
| **D**enial of service | Tumbar el servicio | Disponibilidad | Límites, redundancia |
| **E**levation of privilege | Ganar permisos | Autorización | Separación, validación |

Las **fronteras de confianza** (Internet → DMZ, DMZ → CORP, usuario → administrador) son donde se concentran las amenazas.`,
  steps: [
    ['Dibuja el sistema', '', 'Ejemplo: la tienda online de una pyme: navegador → Cloudflare → web en la DMZ → API → base de datos en CORP → copias en S3. Usa [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/) o draw.io.'],
    ['Marca las fronteras de confianza', '', 'Internet/DMZ, DMZ/CORP, CORP/cloud y el panel de administración.'],
    ['Aplica STRIDE a cada flujo que cruza una frontera', '', 'Ejemplo: «API → base de datos»: *T* inyección SQL, *I* credenciales en texto claro en la configuración, *E* cuenta de BD con permisos de DBA.'],
    ['Convierte cada amenaza en una prueba', '', 'Cada fila acaba siendo un punto de la checklist de auditoría o un caso de prueba del pentest.'],
  ],
  defense: 'Haz el modelo **antes** de auditar: te dice dónde mirar primero y justifica el alcance ante el cliente.',
  quiz: [['Un usuario borra registros y luego dice que no fue él. ¿Qué letra de STRIDE?', ['T', 'R', 'E'], 1, 'Repudiation: faltan registros fiables que demuestren quién hizo qué.']],
  challenge: 'Modela la infraestructura de tu laboratorio N2 (CORP, DMZ, Docker) con Threat Dragon y entrega 10 amenazas priorizadas.',
  refs: [['OWASP Threat Modeling Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html'], ['Threat Modeling Manifesto', 'https://www.threatmodelingmanifesto.org']] },
]},
{ name: 'Avanzado', lessons: [
{ id: 'n2-03', t: 'Python para seguridad: automatiza análisis de logs, IoC y APIs', min: 90, labs: ['host', 'logs'],
  obj: ['Procesar CSV y JSON grandes sin hojas de cálculo', 'Enriquecer IoC con una API', 'Escribir herramientas pequeñas, testeables y reutilizables'],
  theory: `El 80 % del trabajo de un analista avanzado es **mover y transformar datos**. Python con la biblioteca estándar (\`csv\`, \`json\`, \`collections\`, \`ipaddress\`, \`re\`) basta para casi todo.

Buenas prácticas:
- Lee en *streaming* (línea a línea), no cargues 2 GB en memoria.
- Separa *parsear* → *filtrar* → *agregar* → *mostrar*.
- Nunca pongas claves de API en el código: usa variables de entorno.`,
  steps: [
    ['Descarga los datos', '', 'En **DFIR → Práctica de detección**, descarga `corp-security.csv` y `cloudtrail.jsonl` a `~/CiberLab2/loot/`.'],
    ['Cuenta tickets Kerberos por usuario y cifrado', `python3 - <<'EOF'
import csv, collections
c = collections.Counter()
for r in csv.DictReader(open('corp-security.csv')):
    if r['EventID'] == '4769':
        enc = r['Detail'].split('TicketEncryptionType=')[1].split()[0]
        c[(r['Account'], enc)] += 1
for (u, enc), n in c.most_common():
    print(f"{u:12} {enc}  {n}")
EOF`, 'Una línea con cifrado `0x17` y muchas peticiones salta a la vista.'],
    ['Resume CloudTrail por IP y acción', `jq -r '[.sourceIPAddress, .userIdentity.userName, .eventName] | @tsv' cloudtrail.jsonl | sort | uniq -c | sort -rn | head -20`, '`jq` es el `grep` de JSON: imprescindible en cloud.'],
    ['Enriquece IPs (solo direcciones públicas)', `python3 - <<'EOF'
import ipaddress, json
ips = {json.loads(l)['sourceIPAddress'] for l in open('cloudtrail.jsonl')}
for ip in sorted(ips):
    a = ipaddress.ip_address(ip)
    print(ip, 'privada' if a.is_private else 'pública → consultar en AbuseIPDB / VirusTotal')
EOF`, 'Las IPs del ejemplo son de documentación (RFC 5737), así que no aparecerán en ninguna base de reputación.'],
  ],
  defense: 'Guarda tus scripts en `~/CiberLab2/scripts/` con un README y un ejemplo de entrada. En un incidente real no hay tiempo de escribirlos desde cero.',
  challenge: 'Escribe `kerb_rc4.py` que reciba un CSV de eventos y alerte cuando un usuario pida ≥ 3 tickets RC4 en menos de 5 minutos. Pruébalo con el dataset de la práctica.',
  refs: [['Automate the Boring Stuff (gratis)', 'https://automatetheboringstuff.com'], ['jq manual', 'https://jqlang.github.io/jq/manual/']] },
{ id: 'n2-04', t: 'Ingeniería de detección: del comportamiento a la regla Sigma', min: 90, labs: ['splunk', 'logs'],
  obj: ['Escribir una regla **Sigma** con lógica, falsos positivos y nivel', 'Convertirla a SPL (Splunk) con `sigma-cli`', 'Probarla contra datos reales y medir falsos positivos'],
  theory: `**Sigma** es a los logs lo que YARA a los ficheros: un formato abierto de reglas que se traduce a cualquier SIEM.

Ciclo de vida de una detección (*Detection-as-Code*):
1. **Hipótesis** basada en una técnica ATT&CK.
2. **Datos**: ¿tengo la telemetría? (Sysmon 1, Security 4769…).
3. **Regla** en Sigma, en Git, con revisión.
4. **Prueba** con datos buenos (emulación) y malos (tráfico normal).
5. **Despliegue** y **ajuste** de falsos positivos.
6. **Métrica**: alertas por semana, tasa de verdaderos positivos.`,
  steps: [
    ['Instala sigma-cli', 'pipx install sigma-cli && sigma plugin install splunk', ''],
    ['Escribe la regla', `mkdir -p ~/CiberLab2/detecciones/sigma && cat > ~/CiberLab2/detecciones/sigma/office_spawn_powershell.yml <<'EOF'
title: Aplicación de Office lanza PowerShell
id: 7c2b9b2e-6f1a-4c55-9a1e-0f2d1a5b6c01
status: experimental
description: Detecta Word/Excel/PowerPoint creando procesos de PowerShell (macro maliciosa).
references:
  - https://attack.mitre.org/techniques/T1566/001/
tags:
  - attack.initial_access
  - attack.t1566.001
  - attack.execution
  - attack.t1059.001
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    ParentImage|endswith:
      - '\\WINWORD.EXE'
      - '\\EXCEL.EXE'
      - '\\POWERPNT.EXE'
    Image|endswith:
      - '\\powershell.exe'
      - '\\pwsh.exe'
  condition: selection
falsepositives:
  - Complementos de Office legítimos que usan PowerShell (raros; documentarlos)
level: high
EOF`, ''],
    ['Conviértela a SPL', 'sigma convert -t splunk -p sysmon ~/CiberLab2/detecciones/sigma/office_spawn_powershell.yml', 'Obtienes la consulta para Splunk. Con `-t elasticsearch` o `-t loki` obtienes otras.'],
    ['Pruébala', '', 'Arranca **Splunk** (Laboratorio → Docker), sube `ws01-sysmon.csv` de la Práctica de detección y ejecuta la consulta. Debe salir exactamente un resultado.'],
  ],
  defense: 'Cada regla necesita: técnica ATT&CK, fuentes de datos, falsos positivos conocidos y **qué hacer cuando salta** (enlace al playbook).',
  quiz: [['¿Qué campo de Sigma indica qué logs necesita la regla?', ['detection', 'logsource', 'tags'], 1, 'logsource define producto, categoría o servicio.']],
  challenge: 'Escribe otra regla Sigma para el evento 4769 con `TicketEncryptionType: 0x17` excluyendo cuentas de equipo (terminadas en `$`). Conviértela y pruébala con `corp-security.csv`.',
  refs: [['Repositorio oficial de reglas Sigma', 'https://github.com/SigmaHQ/sigma'], ['Especificación Sigma', 'https://sigmahq.io/docs/']] },
]},
{ name: 'Experto', lessons: [
{ id: 'n2-05', t: 'Purple team: planificar, ejecutar y medir un ejercicio completo', min: 120, labs: ['dc01', 'ws01', 'kali', 'splunk'],
  obj: ['Diseñar un plan de emulación a partir de un grupo real', 'Ejecutar pruebas atómicas de forma controlada y trazable', 'Entregar un informe de **brechas de detección** con acciones'],
  theory: `Un ejercicio **purple team** no busca «ganar»: busca que el equipo azul **vea** cada técnica. Se hace con los dos equipos en la misma sala (o llamada).

Plantilla de cada prueba:

| Campo | Ejemplo |
|---|---|
| Técnica | T1547.001 Run Keys |
| Procedimiento | Valor en HKCU\\…\\Run que lanza un binario benigno |
| Hora exacta | 10:42:13 |
| ¿Telemetría? | Sí: Sysmon 13 |
| ¿Alerta? | No |
| Acción | Crear regla Sigma + ajustar |`,
  steps: [
    ['Prepara el laboratorio', '', 'DC01 + WS01 en CORP, Sysmon instalado en WS01 y Splunk o Wazuh recibiendo eventos. Haz un snapshot de WS01.'],
    ['Instala Atomic Red Team en WS01 (solo laboratorio)', `# PowerShell como administrador en WS01
IEX (IWR 'https://raw.githubusercontent.com/redcanaryco/invoke-atomicredteam/master/install-atomicredteam.ps1' -UseBasicParsing)
Install-AtomicRedTeam -getAtomics`, 'Atomic Red Team son pruebas pequeñas y documentadas que reproducen técnicas para validar detecciones. Algunos antivirus las bloquean: hazlo solo en el laboratorio.'],
    ['Consulta antes de ejecutar', 'Invoke-AtomicTest T1547.001 -ShowDetailsBrief', 'Revisa qué hace cada prueba y su comando de limpieza.'],
    ['Ejecuta, anota la hora y limpia', `Invoke-AtomicTest T1547.001 -TestNumbers 1
Get-Date -Format o
Invoke-AtomicTest T1547.001 -TestNumbers 1 -Cleanup`, 'Busca en el SIEM en esa franja: ¿ves el evento 13? ¿Saltó alguna alerta?'],
    ['Repite con descubrimiento', 'Invoke-AtomicTest T1087.002 -TestNumbers 1', 'Enumeración de cuentas del dominio: ¿la ves en los eventos 4661/4662 o en los logs de LDAP?'],
    ['Restaura el snapshot', '', 'Laboratorio → WS01 → ⟲ Restaurar.'],
  ],
  defense: 'El entregable es una tabla técnica → telemetría → detección → acción, y la capa de ATT&CK Navigator actualizada. Repite el ejercicio cada trimestre.',
  challenge: 'Planifica y ejecuta 8 pruebas de 4 tácticas distintas. Entrega el informe con al menos 3 reglas Sigma nuevas.',
  refs: [['Atomic Red Team', 'https://github.com/redcanaryco/atomic-red-team'], ['MITRE Caldera', 'https://caldera.mitre.org'], ['SCYTHE Purple Team Exercise Framework', 'https://github.com/scythe-io/purple-team-exercise-framework']] },
{ id: 'n2-06', t: 'Métricas y madurez: cómo demostrar que la seguridad mejora', min: 45, labs: [],
  obj: ['Elegir métricas útiles (MTTD, MTTR, cobertura, parcheo)', 'Evaluar la madurez de un SOC con un modelo reconocido', 'Presentar resultados a dirección'],
  theory: `| Métrica | Qué mide | Objetivo razonable |
|---|---|---|
| **MTTD** | Tiempo medio hasta detectar | Horas, no días |
| **MTTR** | Tiempo medio hasta contener | < 24 h para incidentes graves |
| Cobertura ATT&CK | Técnicas prioritarias detectadas | Subir cada trimestre |
| Parcheo crítico | Días hasta parchear CVE críticas expuestas | < 15 días (KEV de CISA: antes) |
| Tasa de falsos positivos | Alertas inútiles / total | < 30 % |
| Phishing reportado | % de empleados que reportan la simulación | Subir |

Modelos de madurez: **SOC-CMM**, **NIST CSF 2.0** (niveles de implementación), **C2M2**. Para dirección, traduce todo a **riesgo y dinero**.`,
  quiz: [['¿Qué métrica le importa más al comité de dirección?', ['Número de reglas Sigma', 'Reducción del riesgo y del impacto económico esperado', 'Eventos por segundo del SIEM'], 1, 'Dirección decide con riesgo, coste y cumplimiento.']],
  challenge: 'Haz un informe de una página para el «gerente» de tu laboratorio: 4 métricas, una gráfica de evolución y 3 decisiones que necesitas que apruebe.',
  refs: [['NIST CSF 2.0', 'https://www.nist.gov/cyberframework'], ['SOC-CMM', 'https://www.soc-cmm.com']] },
]},
]};
