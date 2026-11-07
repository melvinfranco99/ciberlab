/* N2 · Escritorio 5 — DFIR (forense y respuesta a incidentes) y Threat Hunting */
CL.areas.dfir = { id: 'dfir', title: 'DFIR y Threat Hunting', tagline: 'Responder a un incidente con método, reconstruir lo que pasó y buscar lo que nadie ha detectado.',
extra: [{ id: 'logs', t: '🔎 Práctica de detección', view: 'logs' }],
intro: `**DFIR** = *Digital Forensics and Incident Response*. Es el trabajo de quien llega cuando algo ha pasado: contener, preservar evidencias, reconstruir la línea temporal, erradicar y aprender. El **threat hunting** es su versión proactiva: buscar actividad maliciosa que ninguna alerta ha visto, partiendo de una hipótesis.

Datasets recomendados: **Práctica de detección** (este escritorio), EVTX-ATTACK-SAMPLES, Splunk BOTS, MemLabs y CyberDefenders.`,
levels: [
{ name: 'Base N2', lessons: [
{ id: 'df-01', t: 'Respuesta a incidentes con método: fases, roles y playbooks', min: 60, labs: [],
  obj: ['Aplicar el ciclo de **NIST SP 800-61r3** / CSF 2.0', 'Organizar roles y comunicación en una crisis', 'Escribir un **playbook** accionable'],
  theory: `Fases clásicas: **Preparación → Detección y análisis → Contención → Erradicación → Recuperación → Lecciones aprendidas**.

Reglas de oro:
1. **No apagues** un equipo comprometido sin pensarlo: perderías la memoria (procesos, conexiones, claves). Aísla de la red (EDR o puerto del switch).
2. **Documenta todo** con hora (UTC) desde el minuto uno.
3. **Comunica por un canal fuera de banda**: si el dominio está comprometido, el correo corporativo también.
4. **Obligaciones legales**: RGPD (72 h a la AEPD si hay datos personales), NIS2 (alerta temprana en 24 h, notificación en 72 h), DORA en el sector financiero.

Roles mínimos: responsable del incidente, analistas técnicos, comunicación/dirección, legal y DPO, y proveedores (MSP, aseguradora, INCIBE-CERT).`,
  steps: [['Escribe un playbook de ransomware', '', 'Estructura: disparador → primeros 15 minutos (aislar, no apagar, avisar) → triage → contención (deshabilitar cuentas, bloquear IoC) → evidencias → comunicación → recuperación desde copias **verificadas** → lecciones.'],
          ['Prepara tu kit', `mkdir -p ~/CiberLab2/forense/kit && cd ~/CiberLab2/forense/kit
# Herramientas portables verificadas por hash, en un USB de solo lectura en la vida real
sha256sum * > SHA256SUMS`, '']],
  defense: 'La preparación decide el incidente: copias offline probadas, inventario, contactos, playbooks y un ejercicio de mesa (*tabletop*) al año.',
  quiz: [['Un servidor muestra una nota de ransomware. ¿Primer paso?', ['Apagarlo', 'Aislarlo de la red sin apagarlo y avisar según el playbook', 'Restaurar la copia de seguridad'], 1, 'Aislar contiene; apagar destruye evidencias; restaurar antes de entender el acceso puede reinfectar.']],
  challenge: 'Prepara un ejercicio de mesa de 60 minutos sobre un ransomware en una pyme: escenario, 6 «injects» con hora y preguntas para cada rol.',
  refs: [['NIST SP 800-61r3', 'https://csrc.nist.gov/pubs/sp/800/61/r3/final'], ['INCIBE-CERT — notificación de incidentes', 'https://www.incibe.es/incibe-cert/notificaciones']] },
{ id: 'df-02', t: 'Adquisición de evidencias: memoria, disco y cadena de custodia', min: 75, labs: ['ws01', 'web-dmz'],
  obj: ['Seguir el **orden de volatilidad**', 'Adquirir memoria en Windows y Linux', 'Calcular hashes y documentar la cadena de custodia'],
  theory: `**Orden de volatilidad (RFC 3227)**: registros/caché → memoria RAM → estado de red y procesos → disco → logs remotos → copias de seguridad. Se adquiere de lo más volátil a lo menos.

**Cadena de custodia**: quién, cuándo, cómo y dónde se ha tenido cada evidencia, con su hash. Sin ella, la evidencia pierde valor legal.`,
  steps: [
    ['Memoria de un Linux (web-dmz)', `curl -LO https://github.com/microsoft/avml/releases/latest/download/avml
chmod +x avml && sudo ./avml /tmp/web-dmz.lime
sha256sum /tmp/web-dmz.lime | tee /tmp/web-dmz.lime.sha256`, 'AVML (Microsoft) captura la memoria sin módulos del kernel.'],
    ['Memoria de Windows (WS01)', `# Descarga winpmem desde github.com/Velocidex/WinPmem/releases (ejecutable firmado)
.\\winpmem_mini_x64.exe C:\\evid\\ws01.raw
Get-FileHash C:\\evid\\ws01.raw -Algorithm SHA256`, ''],
    ['Atajo de laboratorio: la memoria de una VM', 'VBoxManage debugvm WS01 dumpvmcore --filename ~/CiberLab2/forense/ws01.elf', 'Con VirtualBox puedes volcar la memoria de la VM desde fuera sin tocar el sistema invitado. Volatility 3 lee este formato.'],
    ['Imagen de disco', `sudo dd if=/dev/sdX of=evidencia.dd bs=4M conv=noerror,sync status=progress
sha256sum evidencia.dd`, 'En la vida real se usa un bloqueador de escritura. Con VMs: clona el disco desde VirtualBox con `VBoxManage clonemedium`.'],
    ['Registro de custodia', `cat >> ~/CiberLab2/forense/custodia.csv <<'EOF'
fecha_utc,evidencia,sha256,adquirida_por,metodo,ubicacion
2026-11-07T10:42Z,ws01.raw,<hash>,melvin,winpmem 4.0,disco cifrado ext #2
EOF`, ''],
  ],
  defense: 'Ten las herramientas de adquisición probadas **antes** del incidente y almacenamiento cifrado preparado para las evidencias.',
  challenge: 'Adquiere memoria y disco de web-dmz, calcula hashes, rellena la cadena de custodia y verifica más tarde que los hashes coinciden.',
  refs: [['RFC 3227', 'https://www.rfc-editor.org/rfc/rfc3227'], ['AVML', 'https://github.com/microsoft/avml']] },
]},
{ name: 'Avanzado', lessons: [
{ id: 'df-03', t: 'Forense de memoria con Volatility 3', min: 120, labs: ['host'],
  obj: ['Listar procesos, árbol, líneas de comandos y conexiones de un volcado', 'Encontrar código inyectado con `malfind`', 'Construir hipótesis a partir de anomalías'],
  theory: `La memoria muestra lo que el disco no: procesos que ya no existen en disco, conexiones activas, comandos ejecutados, código inyectado y claves.

Anomalías típicas: procesos con padre incorrecto (\`svchost.exe\` cuyo padre no es \`services.exe\`), nombres casi iguales (\`scvhost.exe\`), rutas raras (\`C:\\Users\\Public\\\`), PowerShell con \`-enc\`, regiones de memoria ejecutables y escribibles sin fichero detrás.`,
  steps: [
    ['Instala Volatility 3', 'pipx install volatility3', ''],
    ['Consigue un volcado de prácticas', '', 'Descarga un reto de **MemLabs** (Lab 1) o el volcado de tu propia VM (lección anterior) a `~/CiberLab2/forense/`.'],
    ['Información del sistema', 'vol -f memdump.raw windows.info', ''],
    ['Procesos y árbol', `vol -f memdump.raw windows.pslist
vol -f memdump.raw windows.pstree`, 'Busca padres anómalos y procesos que no deberían estar.'],
    ['Líneas de comandos y conexiones', `vol -f memdump.raw windows.cmdline
vol -f memdump.raw windows.netscan`, ''],
    ['Código inyectado', 'vol -f memdump.raw windows.malfind --dump', 'Revisa cada región: cabecera `MZ` o código sin fichero de respaldo es sospechoso. Analiza lo extraído en la red de malware.'],
  ],
  defense: 'Credential Guard, EDR con protección de memoria y la regla Sysmon 10 (acceso a LSASS) reducen y revelan lo que aquí ves a posteriori.',
  challenge: 'Resuelve MemLabs Lab 1 y Lab 2 documentando cada comando y la conclusión que sacas.',
  refs: [['Volatility 3 docs', 'https://volatility3.readthedocs.io'], ['MemLabs', 'https://github.com/stuxnet999/MemLabs'], ['SANS Hunt Evil poster', 'https://www.sans.org/posters/hunt-evil/']] },
{ id: 'df-04', t: 'Líneas temporales: Plaso, Hayabusa y Chainsaw sobre EVTX', min: 120, labs: ['host'],
  obj: ['Crear una **super-timeline** de un disco', 'Analizar EVTX en minutos con reglas Sigma', 'Pivotar en el tiempo alrededor de un evento clave'],
  theory: `Una línea temporal ordena **todo** lo que dejó huella (ficheros, registro, eventos, navegador, prefetch) en un único eje temporal. Se trabaja así: encuentra un evento seguro (la alerta) y mira qué pasó **antes y después**.`,
  steps: [
    ['Descarga eventos de ataques reales', 'cd ~/CiberLab2/forense && git clone --depth 1 https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES.git', 'EVTX clasificados por táctica ATT&CK.'],
    ['Triage rápido con Hayabusa', `hayabusa csv-timeline -d EVTX-ATTACK-SAMPLES/ -o hayabusa.csv -p verbose
hayabusa logon-summary -d EVTX-ATTACK-SAMPLES/`, 'Hayabusa aplica cientos de reglas Sigma y te da una línea temporal con severidades.'],
    ['Búsqueda con Chainsaw', `chainsaw hunt EVTX-ATTACK-SAMPLES/ -s sigma/ --mapping mappings/sigma-event-logs-all.yml -o chainsaw/
chainsaw search "mimikatz" -i EVTX-ATTACK-SAMPLES/`, 'Necesitas clonar el repositorio de reglas Sigma en `sigma/`.'],
    ['Super-timeline de un disco', `log2timeline.py --storage-file caso.plaso evidencia.dd
psort.py -o l2tcsv -w timeline.csv caso.plaso "date > '2026-10-23 08:00:00' AND date < '2026-10-23 10:00:00'"`, 'Plaso es lento y exhaustivo: filtra por la ventana de interés.'],
    ['Visualiza', '', 'Abre `timeline.csv` en Timeline Explorer (Windows) o Timesketch (Docker) y marca los eventos clave.'],
  ],
  defense: 'Conserva los logs el tiempo suficiente (NIS2 y buenas prácticas: 12 meses o más) y centralizados: sin logs no hay línea temporal.',
  challenge: 'Elige una carpeta de técnica en EVTX-ATTACK-SAMPLES (p. ej. *Lateral Movement*), genera la línea temporal con Hayabusa y escribe 5 líneas de lo que ocurrió.',
  refs: [['Hayabusa', 'https://github.com/Yamato-Security/hayabusa'], ['Chainsaw', 'https://github.com/WithSecureLabs/chainsaw'], ['Plaso', 'https://plaso.readthedocs.io']] },
]},
{ name: 'Experto', lessons: [
{ id: 'df-05', t: 'Threat hunting guiado por hipótesis con Splunk', min: 120, labs: ['splunk', 'logs'],
  obj: ['Formular hipótesis cazables', 'Usar **stacking**, rareza y relaciones padre-hijo', 'Convertir cada caza en una detección automática'],
  theory: `Ciclo (*PEAK* / *TaHiTI*): **hipótesis → datos → análisis → hallazgo o descarte → detección nueva**.

Técnicas de análisis:
- **Stacking**: contar valores y mirar los menos frecuentes (lo raro destaca).
- **Relaciones padre-hijo**: Office → shell, servicios → cmd.
- **Primera vez vista**: binario, dominio o conexión nunca vistos antes.
- **Agrupación temporal**: muchos eventos de un usuario en poco tiempo.`,
  steps: [
    ['Carga los datos', '', 'Arranca **Splunk** (Docker, `http://127.0.0.1:8100`). *Settings → Add Data → Upload* el fichero `ws01-sysmon.csv` de la Práctica de detección con *sourcetype* `csv` e índice `main`.'],
    ['Hipótesis 1: Office lanza intérpretes', `index=main EventID=1 ParentImage="*\\\\WINWORD.EXE" OR ParentImage="*\\\\EXCEL.EXE"
| table UtcTime Image ParentImage Detail`, ''],
    ['Stacking de procesos raros', `index=main EventID=1
| stats count by Image
| sort count
| head 10`, 'Lo que aparece una o dos veces merece una mirada.'],
    ['Persistencia en Run', `index=main EventID=13 Detail="*\\\\CurrentVersion\\\\Run\\\\*"
| table UtcTime Image Detail`, ''],
    ['Escala a BOTS', '', 'Instala el dataset **BOTS v3** en Splunk y sigue sus preguntas: es el entrenamiento estándar de cazadores.'],
  ],
  defense: 'Cada caza que encuentra algo se convierte en **regla automática** (Sigma) y cada caza vacía documenta que esa técnica no está presente: ambas cosas son valor.',
  challenge: 'Realiza 3 cazas documentadas (hipótesis, consulta, resultado, regla generada) sobre los tres datasets de la Práctica de detección.',
  refs: [['Splunk BOTS v3', 'https://github.com/splunk/botsv3'], ['The PEAK threat hunting framework', 'https://www.splunk.com/en_us/blog/security/peak-threat-hunting-framework.html']] },
{ id: 'df-06', t: 'DFIR en Linux: triage, persistencia y auditd', min: 90, labs: ['web-dmz'],
  obj: ['Recoger artefactos de Linux de forma ordenada (UAC)', 'Revisar las ubicaciones de persistencia', 'Configurar **auditd** para tener telemetría'],
  theory: `Ubicaciones de persistencia en Linux que se revisan siempre:
| Ubicación | Qué buscar |
|---|---|
| \`crontab -l\`, \`/etc/cron*\`, \`/var/spool/cron\` | Tareas nuevas o que descargan scripts |
| \`/etc/systemd/system\`, \`~/.config/systemd/user\` | Servicios y timers desconocidos |
| \`~/.ssh/authorized_keys\` | Claves añadidas |
| \`/etc/passwd\`, \`/etc/sudoers.d\` | Usuarios con UID 0, permisos sudo nuevos |
| \`/etc/ld.so.preload\` | Librerías inyectadas en todos los procesos |
| \`~/.bashrc\`, \`/etc/profile.d\` | Comandos al iniciar sesión |`,
  steps: [
    ['Triage con UAC', `git clone --depth 1 https://github.com/tclahr/uac.git && cd uac
sudo ./uac -p ir_triage /tmp/`, 'Recoge cientos de artefactos con hashes en un único fichero.'],
    ['Revisión rápida a mano', `sudo find / -xdev -newer /etc/hostname -type f -perm -u+x 2>/dev/null | grep -vE '^/(proc|sys|usr/share)' | head
sudo systemctl list-unit-files --state=enabled
sudo ls -la /etc/cron.* /var/spool/cron/crontabs 2>/dev/null
sudo cat /etc/ld.so.preload 2>/dev/null`, ''],
    ['Activa auditd con reglas sólidas', `sudo apt install -y auditd
sudo curl -L https://raw.githubusercontent.com/Neo23x0/auditd/master/audit.rules -o /etc/audit/rules.d/audit.rules
sudo augenrules --load && sudo ausearch -k susp_activity -i | tail`, 'Las reglas de Florian Roth cubren ejecución, persistencia y escalada.'],
  ],
  defense: 'auditd o un agente (Wazuh, osquery) enviando a un SIEM, inmutabilidad de logs (envío remoto) y verificación de integridad (AIDE).',
  challenge: 'Crea tú una persistencia en web-dmz (un timer de systemd) y otra en cron. Cambia de papel: encuéntralas con UAC y con auditd, y escribe la detección.',
  refs: [['UAC — Unix-like Artifacts Collector', 'https://github.com/tclahr/uac'], ['Linux auditd rules (Neo23x0)', 'https://github.com/Neo23x0/auditd']] },
]},
]};
