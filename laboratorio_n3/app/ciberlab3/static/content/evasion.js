/* N3 · Escritorio 6 — Evasión y OPSEC */
CL.areas.evasion = { id: 'evasion', title: 'Evasión y OPSEC', tagline: 'Por qué un adversario real pasa desapercibido y, sobre todo, qué lo delata. Enfoque defensivo: entender la evasión para detectarla.',
intro: `## Evasión y OPSEC
En un Red Team, el **sigilo** (OPSEC) es parte del encargo: medir si el Blue Team detecta y responde. Esta área explica **conceptos** de evasión y, en cada punto, **cómo se detecta** — porque el objetivo del N3 es que salgas sabiendo defender tan bien como atacar. Nada de aquí es una receta para dañar: es el modelo mental para construir detecciones.`,
levels: [
{ name: 'Experto', lessons: [
{ id: 'ev-01', t: 'Por qué fallan los controles ingenuos: LOLBins, firmas vs. comportamiento', min: 60, labs: [],
  obj: ['Entender por qué las listas de indicadores (hash/IP) caducan enseguida', 'Reconocer el abuso de binarios legítimos (LOLBins/LOLBAS)', 'Diseñar detección por comportamiento, no por firma'],
  theory: `El atacante evade los controles que miran **lo superficial**:

- **Firmas (hash, IP, dominio)**: cambiar un byte o una IP las invalida. Es la base de la **pirámide del dolor** (N2): cuanto más abajo (hash, IP), más barato para el atacante cambiarlo.
- **LOLBins / LOLBAS**: usar binarios **legítimos** del sistema (\`certutil\`, \`rundll32\`, \`mshta\`, \`regsvr32\`, \`bitsadmin\`) para acciones maliciosas. No hay «malware» que firmar: es Windows haciendo cosas raras.
- **Vivir del terreno** (*living off the land*): PowerShell, WMI, tareas programadas… herramientas de administración usadas con mala intención.

Por eso la detección moderna mira **comportamiento y relaciones**: *¿por qué \`winword.exe\` ha lanzado \`powershell.exe\` que ha lanzado \`certutil\` que descarga algo?* Ningún paso es «malware», pero la **cadena** no tiene sentido legítimo.`,
  steps: [
    ['Estudia el catálogo de LOLBAS', '', 'Abre LOLBAS y mira 5 binarios (p. ej. `certutil`, `mshta`, `regsvr32`): qué hacen legítimamente y cómo se abusan. Piensa en la detección de cada uno.'],
    ['Relee la pirámide del dolor', '', 'Ordena de barato a caro para el atacante: hash → IP → dominio → artefacto → herramienta → TTP. Tus detecciones deben apuntar arriba (TTP).'],
    ['Convierte una cadena en detección', '', 'Escribe en pseudo-Sigma: «proceso hijo = powershell/cmd/certutil con proceso padre = winword/excel/outlook». Eso caza la técnica, no un fichero concreto.'],
  ],
  defense: 'Prioriza detecciones por comportamiento: relaciones padre-hijo anómalas, LOLBins con argumentos de red, PowerShell con *script block logging*, y líneas de comando completas en los eventos 4688/Sysmon. Una buena regla de comportamiento sobrevive a que el atacante cambie su malware.',
  quiz: [['¿Qué es un LOLBin?', ['Un virus nuevo', 'Un binario legítimo del sistema usado con fines maliciosos', 'Un antivirus'], 1, 'Living Off the Land Binaries: herramientas propias del SO abusadas (certutil, rundll32…).'],
         ['Según la pirámide del dolor, ¿qué detección le cuesta MÁS esquivar al atacante?', ['Un hash', 'Una IP', 'Una TTP (comportamiento)'], 2, 'Cambiar un comportamiento obliga a rehacer su forma de operar: es lo más caro.']],
  challenge: 'Elige tres técnicas que usaste en escritorios anteriores (Kerberoasting, movimiento con WMI, LOLBin de descarga) y escribe para cada una una detección por comportamiento en pseudo-Sigma.',
  refs: [['LOLBAS', 'https://lolbas-project.github.io/'], ['GTFOBins', 'https://gtfobins.github.io/'], ['Pyramid of Pain', 'https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html'], ['Sigma', 'https://github.com/SigmaHQ/sigma']] },
{ id: 'ev-02', t: 'OPSEC del operador y limpieza: no ser el eslabón ruidoso', min: 50, labs: [],
  obj: ['Planificar el ruido aceptable según el tipo de ejercicio', 'Minimizar artefactos y registrar lo que dejas', 'Entregar una limpieza impecable al cliente'],
  theory: `OPSEC = disciplina para **no delatarte** y **no dejar desorden**. No es «borrar logs» (eso es a su vez una alerta y, en un ejercicio, suele estar prohibido): es **planear** la huella.

- **Ritmo**: operar en la ventana pactada, sin ráfagas.
- **Artefactos mínimos**: menos ficheros en disco = menos que detectar y que limpiar. Preferir memoria cuando el RoE lo permita.
- **Registro propio**: cada implante, cuenta creada, fichero subido y cambio queda anotado **para devolverlo**.
- **Limpieza**: al cerrar, se revierte todo y se entrega la lista. Un cliente valora tanto el informe como que su entorno quede **exactamente** como estaba.

El Red Team ético no esconde su rastro del cliente: lo **documenta**. Lo que oculta (si el ejercicio lo pide) es su actividad del *Blue Team durante* el ejercicio, para medir la detección.`,
  steps: [
    ['Planifica tu huella antes de actuar', '', 'Por cada acción, pregúntate: ¿qué log genera?, ¿es aceptable para este ejercicio?, ¿cómo lo revierto? Si no sabes revertirlo, no lo hagas.'],
    ['Mantén el inventario de artefactos', '', 'Una tabla viva: artefacto, máquina, hora, cómo revertir. Implantes, cuentas, tareas, ficheros, cambios de configuración.'],
    ['Cierre y limpieza', '', 'Elimina implantes, borra cuentas/tareas creadas por ti, restaura configuraciones. Verifica con el cliente. Entrega el inventario como anexo del informe.'],
  ],
  defense: 'Para el Blue Team, la lección es inversa: registros inmutables y centralizados (que el atacante no pueda borrar), alertas sobre *limpieza* de logs (1102/4719), y retención suficiente. Si el atacante tiene que elegir entre ruido y lentitud, tus sensores le fuerzan a equivocarse.',
  quiz: [['En un Red Team ético, ¿qué haces con los artefactos que creas?', ['Los ocultas del cliente para siempre', 'Los registras para revertirlos y los entregas en el informe', 'Los dejas ahí'], 1, 'Se documentan y se revierten: el entorno queda como estaba y el cliente lo sabe todo.'],
         ['¿Por qué "borrar los logs" no suele ser buena OPSEC?', ['Porque es legal', 'Porque el borrado en sí genera una alerta y suele estar prohibido', 'Porque es lento'], 1, 'El evento de limpieza de logs (1102/4719) es en sí una señal de alerta.']],
  challenge: 'Toma el ejercicio de GOAD que completaste y redacta su inventario de artefactos y plan de limpieza, como lo entregarías a un cliente real.',
  refs: [['Red Team OPSEC (MITRE ATT&CK)', 'https://attack.mitre.org/tactics/TA0005/'], ['SpecterOps blog', 'https://posts.specterops.io/'], ['Sysmon + log tampering detection', 'https://github.com/olafhartong/sysmon-modular']] },
]},
{ name: 'Maestría', lessons: [
{ id: 'ev-03', t: 'AMSI, ETW y por qué el logging de PowerShell lo cambia todo', min: 60, labs: [],
  obj: ['Entender qué son AMSI y ETW y qué visibilidad dan al defensor', 'Comprender a alto nivel por qué los atacantes intentan cegarlos', 'Configurar el logging que hace visible lo invisible (defensivo)'],
  theory: `Windows da a la defensa dos sensores clave que el operador avanzado respeta (y el defensor debe activar):

- **AMSI** (Antimalware Scan Interface): deja que el antivirus **inspeccione el contenido** que se va a ejecutar (scripts, macros, PowerShell) *aunque esté ofuscado*, porque lo ve ya «desenvuelto» justo antes de ejecutarse.
- **ETW** (Event Tracing for Windows): la tubería de telemetría de la que beben los EDR (incluida la actividad .NET, CLR, etc.).
- **Script Block Logging** + **Module Logging** de PowerShell: registran el **código real** que se ejecuta (evento 4104), deshaciendo la ofuscación.

Los adversarios intentan **cegar** estos sensores (parchear AMSI en memoria, manipular ETW). Para el defensor, la lección es inversa: **actívalos y vigílalos**; un intento de cegarlos es en sí una alerta de alta fidelidad.`,
  steps: [
    ['Activa el logging de PowerShell (defensivo)', '', 'Por GPO: *Turn on Script Block Logging* y *Module Logging*. A partir de ahí, el evento 4104 guarda el código real ejecutado, aunque venga ofuscado.'],
    ['Entiende qué ve AMSI', '', 'AMSI inspecciona el contenido justo antes de ejecutarse: por eso la ofuscación simple no basta contra un AV con AMSI. Compruébalo en el lab con cadenas de prueba inocuas (EICAR).'],
    ['Detecta el cegado', '', 'Un error de AMSI, una carga sospechosa de `amsi.dll` o manipulación de ETW son señales. Crea/activa reglas que alerten de esos intentos.'],
    ['Conecta con tu SIEM', '', 'Envía 4104 y los eventos de Defender/EDR a tu SIEM del N2. La ofuscación deja de ser un muro cuando registras el código desenvuelto.'],
  ],
  defense: 'Activa Script Block y Module Logging, PowerShell en Constrained Language Mode donde puedas, AV con AMSI al día, y alerta sobre intentos de manipular AMSI/ETW (son de alta fidelidad: casi nadie legítimo los toca). El código ofuscado se vuelve visible en el 4104.',
  quiz: [['¿Por qué AMSI ve el código aunque esté ofuscado?', ['Porque descifra el disco', 'Porque inspecciona el contenido ya desenvuelto justo antes de ejecutarse', 'Porque bloquea la red'], 1, 'AMSI actúa en el momento de ejecución, cuando el script ya está en claro.'],
         ['El evento 4104 (Script Block Logging) sirve para…', ['Medir la CPU', 'Registrar el código PowerShell real ejecutado, deshaciendo la ofuscación', 'Cifrar logs'], 1, 'Guarda el bloque de script tal cual se ejecuta: clave para cazar PowerShell ofuscado.']],
  challenge: 'En un Windows de laboratorio activa Script Block Logging y comprueba que un comando PowerShell ofuscado aparece en claro en el 4104. Escribe la regla que alertaría de un intento de cegar AMSI.',
  refs: [['Microsoft · AMSI', 'https://learn.microsoft.com/windows/win32/amsi/antimalware-scan-interface-portal'], ['PowerShell logging', 'https://learn.microsoft.com/powershell/scripting/windows-powershell/wmf/whats-new/script-logging'], ['MITRE · Impair Defenses T1562', 'https://attack.mitre.org/techniques/T1562/']] },
{ id: 'ev-04', t: 'Canales encubiertos: C2 por DNS/HTTPS y cómo se detectan', min: 55, labs: [],
  obj: ['Entender por qué DNS y HTTPS son canales de exfiltración atractivos', 'Reconocer las señales que delatan un túnel (concepto defensivo)', 'Diseñar la detección, no el abuso'],
  theory: `Un operador elige canales que se **mimeticen** con el tráfico legítimo; el defensor aprende sus señales:

- **Túnel DNS**: codifica datos en subdominios (\`<datos>.c2.ejemplo.com\`). Atractivo porque el DNS casi nunca se filtra. **Señales**: volumen y longitud anómalos de consultas a un dominio, muchos subdominios únicos, tipos TXT/NULL raros, entropía alta.
- **C2 por HTTPS**: se esconde en tráfico web normal. **Señales**: beaconing (regularidad pese al jitter, N2), JA3/JA4 raros, certificados autofirmados, dominios jóvenes o de baja reputación.
- **Domain fronting** (concepto): aprovechar un CDN para ocultar el destino real; hoy muy mitigado por los proveedores.

El N3 cierra el círculo del N2: aquí entiendes el canal **para construir la detección**, no para operarlo contra terceros.`,
  steps: [
    ['Reconoce un túnel DNS en una captura', 'zeek -r captura.pcap ; cat dns.log | sort | uniq -c | sort -rn | head', 'Muchísimas consultas a subdominios distintos del mismo dominio y respuestas TXT grandes = sospecha de túnel DNS.'],
    ['Mide entropía y longitud', '', 'Los subdominios de un túnel parecen aleatorios (entropía alta) y son largos. Una regla sobre longitud/entropía media de las etiquetas DNS caza la mayoría.'],
    ['HTTPS: vuelve al beaconing del N2', '', 'Aplica el análisis de regularidad del N2 y añade JA3/JA4 y reputación de dominio. El C2 moderno es sigiloso, pero el patrón temporal lo delata.'],
    ['Escribe la detección', '', 'Traduce a una regla (Sigma/consulta SIEM) la señal más estable: entropía de DNS, o beaconing + dominio de baja reputación.'],
  ],
  defense: 'Inspección y límite de DNS (sólo resolutores internos, bloqueo de TXT externos masivos), detección de beaconing, reputación de dominios/certificados, JA3/JA4 y proxies TLS que registren el SNI. El canal encubierto deja de serlo cuando mides entropía y regularidad.',
  quiz: [['¿Por qué el DNS es un canal de exfiltración atractivo?', ['Es rápido', 'Casi nunca se filtra ni se inspecciona', 'Está cifrado por defecto'], 1, 'Al salir casi siempre sin control, el DNS permite sacar datos a goteo.'],
         ['Señal clásica de un túnel DNS:', ['Pocas consultas cortas', 'Muchísimos subdominios únicos, largos y de alta entropía', 'Un favicon raro'], 1, 'La codificación de datos genera subdominios aleatorios largos y abundantes.']],
  challenge: 'Analiza una captura con un túnel DNS simulado (o de malware-traffic-analysis.net) y escribe una regla que lo detecte por longitud/entropía de las etiquetas. Conéctalo con el beaconing del N2 para HTTPS.',
  refs: [['MITRE · Exfiltration over C2 / DNS', 'https://attack.mitre.org/techniques/T1048/'], ['Zeek dns.log', 'https://docs.zeek.org/en/master/logs/dns.html'], ['JA3/JA4', 'https://github.com/FoxIO-LLC/ja4']] },
]},
]};
