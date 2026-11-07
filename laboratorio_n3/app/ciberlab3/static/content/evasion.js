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
]};
