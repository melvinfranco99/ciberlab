/* N3 · Escritorio 1 — Ruta ofensiva y método */
CL.areas.inicio = { id: 'inicio', title: 'Ruta ofensiva y método', tagline: 'Pensar y operar como un Red Team profesional: metodología, sigilo, impacto demostrable e informe accionable — siempre con autorización.',
intro: `## Cómo trabajar en el N3
1. El N3 es **ofensivo experto**: emulación de adversario (Red Team) y pentesting avanzado. Cada escritorio es una fase de la **cadena de ataque**: reconocimiento → acceso inicial → escalada → Active Directory → post-explotación → evasión → web.
2. Asume que dominas el N1 y el N2. Aquí no se explican los fundamentos: se encadenan técnicas hasta el objetivo (*flag*, *Domain Admin*, dato crítico) y se **demuestra el impacto**.
3. Todo lo que practiques va contra **tu laboratorio N3**, plataformas hechas para ello (HTB, TryHackMe, VulnLab, PortSwigger) o un cliente con **contrato, alcance y reglas de enfrentamiento firmadas**. Sin eso, es un delito.
4. Guarda cada comando, captura y credencial en \`~/CiberLab3/\` con orden (\`recon/\`, \`loot/\`, \`evidencias/\`, \`informe/\`): tu informe se escribe sobre la marcha, no al final.`,
levels: [
{ name: 'Fundamento ofensivo', lessons: [
{ id: 'n3-01', t: 'Marco de un ejercicio: PTES, OSSTMM, MITRE ATT&CK y reglas de enfrentamiento', min: 50, labs: [],
  obj: ['Distinguir **pentest**, **Red Team** y **auditoría** y cuándo usar cada uno', 'Leer y exigir un documento de **alcance y reglas de enfrentamiento (RoE)**', 'Mapear tu plan a las **fases de ATT&CK**'],
  theory: `No se empieza a atacar: se empieza a **acordar**. Antes del primer paquete tiene que existir un documento firmado con:

| Elemento | Qué fija | Ejemplo |
|---|---|---|
| **Alcance** | Qué entra y qué NO | \`10.0.0.0/24\`, el dominio \`corp.local\`; fuera: producción de clientes |
| **Ventana** | Cuándo se puede operar | L-V 20:00–06:00 |
| **Objetivos** | Qué hay que demostrar | Llegar a Domain Admin, exfiltrar un fichero señuelo |
| **RoE** | Qué está prohibido | Nada de DoS, nada de ransomware real, parada inmediata si… |
| **Contactos** | A quién avisar | *White cell* 24/7 |

**Tres sabores de ejercicio ofensivo:**
- **Pentest**: encontrar y demostrar *el máximo de* vulnerabilidades en un alcance, con ruido permitido.
- **Red Team**: emular a un adversario concreto con **sigilo**, para medir **detección y respuesta** del Blue Team.
- **Purple Team**: Red y Blue trabajando juntos, en abierto, para mejorar detecciones (lo viste en el N2).

La **cadena de ataque** (kill chain) ordena el trabajo: reconocimiento → acceso inicial → ejecución → persistencia → escalada → movimiento lateral → recolección → exfiltración → impacto. Cada escritorio del N3 es una de estas fases.`,
  steps: [
    ['Crea tu carpeta de operación', 'mkdir -p ~/CiberLab3/{recon,loot,evidencias,informe,scripts}', 'Un sitio para cada cosa. El informe se nutre de `evidencias/` (capturas con hora) y `loot/` (lo obtenido).'],
    ['Escribe tu propio RoE de laboratorio', '', 'Redacta un documento de media página: alcance = red CORP/DMZ del lab N3, objetivo = Domain Admin + leer `\\\\DC01\\flag.txt`, prohibido = tocar el host anfitrión. Fírmalo tú mismo: es el hábito lo que importa.'],
    ['Dibuja tu plan sobre ATT&CK', 'docker run -d --name navigator -p 127.0.0.1:4200:4200 mitre/attack-navigator', 'Marca en una capa las técnicas que piensas usar por fase. Al acabar, compárala con lo que realmente detectó el Blue Team.'],
  ],
  defense: 'El valor de un ejercicio ofensivo no es «entré», sino **qué lo habría parado y qué no se detectó**. Un informe que no mejora una defensa concreta no sirve. Piensa siempre en el *detective control* que falló.',
  quiz: [['Quieres medir si el SOC detecta y responde a un adversario sigiloso. ¿Qué ejercicio encargas?', ['Pentest ruidoso', 'Red Team', 'Escaneo de vulnerabilidades'], 1, 'El Red Team emula a un adversario con sigilo para medir detección y respuesta.'],
         ['¿Qué firmas ANTES de lanzar el primer escaneo contra un cliente?', ['Nada, si es de noche', 'El alcance y las reglas de enfrentamiento', 'Solo un correo informal'], 1, 'Sin alcance y RoE firmados no hay ejercicio legal.']],
  challenge: 'Redacta un RoE de una página para un Red Team de 2 semanas contra una pyme ficticia: alcance, ventana, objetivos, prohibiciones, criterios de parada y contactos de la white cell.',
  refs: [['PTES', 'http://www.pentest-standard.org/'], ['MITRE ATT&CK', 'https://attack.mitre.org'], ['OSSTMM', 'https://www.isecom.org/OSSTMM.3.pdf'], ['TIBER-EU (Red Team banca)', 'https://www.ecb.europa.eu/paym/cyber-resilience/tiber-eu/html/index.en.html']] },
{ id: 'n3-02', t: 'Montar el laboratorio ofensivo: Kali, red aislada y un dominio vulnerable', min: 70, labs: ['vm'],
  obj: ['Aislar por completo el laboratorio del resto de tu red', 'Tener una máquina de ataque (Kali) y objetivos reproducibles', 'Capturar evidencias con método desde el minuto cero'],
  theory: `El laboratorio del N3 tiene **dos redes host-only aisladas** (sin salida a Internet para los objetivos):

- **CORP** \`192.168.59.0/24\` — dominio Active Directory: \`DC01\` (controlador), \`WS01\`/\`WS02\` (puestos Windows).
- **DMZ** \`192.168.60.0/24\` — servidores expuestos (web, Linux) que simulan el perímetro.

Tu **Kali** tiene una pata en cada red y es desde donde operas. Para el dominio vulnerable, la forma estándar de practicar AD es **GOAD** (*Game of Active Directory*) o **Ludus**: despliegan un bosque realista y roto a propósito.

> ⚠️ **Aislamiento total**: los objetivos nunca deben alcanzar Internet ni tu LAN real. Host-only, sin NAT. Las muestras y herramientas ofensivas se quedan dentro.`,
  steps: [
    ['Crea las redes del laboratorio', '', 'En **Laboratorio N3** pulsa *Crear redes* (CORP y DMZ host-only). Comprueba con `VBoxManage list hostonlyifs` que existen y que NO tienen DHCP hacia tu LAN.'],
    ['Importa tu Kali y dale las dos patas', 'VBoxManage list vms', 'Adaptador 1 → host-only CORP, Adaptador 2 → host-only DMZ. Verifica con `ip -br addr` dentro de Kali que tienes IP en `192.168.59` y `192.168.60`.'],
    ['Despliega un dominio vulnerable (GOAD)', 'git clone https://github.com/Orange-Cyberdefense/GOAD', 'Sigue su guía con el proveedor VirtualBox. Si tu equipo va justo, usa la variante reducida *GOAD-Light* (2 máquinas).'],
    ['Prueba de vida', 'nmap -sn 192.168.59.0/24', 'Deberías ver el DC y los puestos. A partir de aquí, cada comando que lances va documentado en `~/CiberLab3/recon/`.'],
  ],
  defense: 'Un dominio vulnerable como GOAD es también el mejor banco de pruebas **defensivo**: despliega Sysmon + Wazuh en los puestos y comprueba qué de lo que harás en los próximos escritorios genera (o no) una alerta.',
  quiz: [['¿Por qué las máquinas objetivo del laboratorio van en red host-only sin NAT?', ['Para que vayan más rápido', 'Para aislarlas de Internet y de tu red real', 'Porque Windows lo exige'], 1, 'El aislamiento evita que una técnica ofensiva o una muestra escape del laboratorio.']],
  challenge: 'Despliega GOAD-Light, instala Sysmon con la configuración de Olaf Hartong en un puesto y deja Wazuh recibiendo sus eventos. Tendrás un dominio para atacar y, a la vez, para ver tu propio ruido.',
  refs: [['GOAD', 'https://github.com/Orange-Cyberdefense/GOAD'], ['Ludus', 'https://docs.ludus.cloud/'], ['Kali Linux', 'https://www.kali.org/get-kali/'], ['Sysmon modular config', 'https://github.com/olafhartong/sysmon-modular']] },
]},
{ name: 'Operador', lessons: [
{ id: 'n3-03', t: 'Metodología de una intrusión: del punto de apoyo al objetivo', min: 45, labs: [],
  obj: ['Encadenar fases con un objetivo claro, no «probar cosas»', 'Tomar notas y evidencias que se conviertan solas en informe', 'Decidir cuándo parar y escalar un hallazgo crítico'],
  theory: `Un operador no «usa herramientas»: ejecuta un **bucle** por cada punto de apoyo que consigue:

1. **Sitúate**: ¿quién soy? (\`id\`, \`whoami /all\`), ¿dónde estoy? (red, dominio), ¿qué veo?
2. **Recolecta**: credenciales, tickets, ficheros, configuraciones que lleven más lejos.
3. **Escala / muévete**: local (más privilegios) o lateral (otra máquina).
4. **Consolida**: acceso estable y sigiloso para no perder el punto de apoyo.
5. **Documenta**: captura con hora y comando *antes* de pasar al siguiente.

El error típico del principiante es lanzar todo a la vez y perder el hilo. El operador avanza **un nodo cada vez** y siempre sabe explicar *cómo* llegó ahí (para el informe) y *qué huella* dejó (para el Blue Team).`,
  steps: [
    ['Monta un registro automático de la sesión', 'script -q -t2>~/CiberLab3/evidencias/$(date +%F_%H%M).timing ~/CiberLab3/evidencias/$(date +%F_%H%M).log', 'Con `script` grabas toda la terminal. También sirven `tmux-logging` o `pwncat`. Nunca confíes en la memoria.'],
    ['Usa una plantilla de nota por host', '', 'Por cada máquina: IP, cómo entraste, con qué usuario, qué encontraste, a dónde lleva. Herramientas como *Obsidian*, *CherryTree* o *Trilium* son estándar en el oficio.'],
    ['Define el criterio de parada', '', 'Si encuentras algo crítico fuera de lo esperado (datos de clientes reales, un sistema de producción conectado por error), **para y avisa a la white cell**. Está en el RoE por algo.'],
  ],
  defense: 'Cada paso de este bucle deja rastro: un logon 4624, un proceso 4688, una conexión. El Blue Team que entiende el bucle del atacante sabe dónde poner los sensores: en la recolección de credenciales y en el movimiento lateral, no solo en el perímetro.',
  quiz: [['Acabas de conseguir una shell en un servidor. ¿Cuál es el primer paso del bucle?', ['Lanzar todos los exploits de privesc a la vez', 'Situarte: quién eres, dónde estás, qué ves', 'Borrar los logs'], 1, 'Primero orientación: id/whoami, red y contexto. Sin eso, actúas a ciegas.']],
  challenge: 'Haz una máquina de dificultad media de HTB o VulnLab documentándola con la plantilla de notas. Al terminar, tus notas deberían poder convertirse en un mini-informe sin reescribir nada.',
  refs: [['The Hacker Recipes', 'https://www.thehacker.recipes/'], ['HackTricks', 'https://book.hacktricks.xyz/'], ['OSCP-style notetaking', 'https://github.com/noraj/OSCP-Exam-Report-Template-Markdown']] },
]},
]};
