/* Vídeos guiados de las prácticas de CiberLab. Cada vídeo es una secuencia de escenas que el
   reproductor (site.js) anima paso a paso, con subtítulos y narración por voz opcional.
   Escenas: {type:'title', h, sub} · {type:'term', title, prompt, keep, lines:[{c:'comando'}|{o:'salida'}]} */
'use strict';
window.VIDEOS = {};

/* ============ 0 · Cómo funcionan las prácticas ============ */
window.VIDEOS['intro'] = {
  title: 'Cómo hacer una práctica de CiberLab', badge: 'Empieza aquí',
  scenes: [
    { type: 'title', step: 'Idea', h: 'Aprender investigando', sub: 'Cada práctica te da datos reales (logs, configuraciones, capturas) y preguntas. Tú investigas con la terminal; el programa te corrige sin enseñarte la solución.',
      say: 'Bienvenido. En CiberLab no memorizas: investigas datos reales y respondes. Vamos a ver cómo se hace una práctica, paso a paso.' },
    { type: 'term', step: '1 · Entra', title: 'zsh', prompt: '$ ', say: 'Primero entras en la carpeta de la práctica que quieras hacer.',
      lines: [{ c: 'cd practicas/nivel1-principiante/02-fuerza-bruta-ssh' }, { c: 'ls' }, { o: 'comprobar.py  generar.py' }] },
    { type: 'term', step: '2 · Genera', title: 'zsh', prompt: '$ ', say: 'Ejecutas generar punto pe y griega. Crea tus datos y un fichero de respuestas en blanco. Cada alumno recibe datos distintos.',
      lines: [{ c: 'python3 generar.py' }, { o: '✔ Datos generados en datos/ (semilla 102)' }, { o: '  6 preguntas en respuestas.txt' }] },
    { type: 'term', step: '3 · Investiga', title: 'zsh', prompt: '$ ', say: 'Ahora investigas los datos con los comandos del glosario. Aquí buscas las IP que más fallos de acceso tienen.',
      lines: [{ c: "grep -E 'Failed|Invalid' datos/auth.log | grep -oE '([0-9]+\\.){3}[0-9]+' | sort | uniq -c | sort -rn | head -3" },
        { o: '    242 192.0.2.61' }, { o: '      5 198.51.100.7' }, { o: '      4 203.0.113.9' }] },
    { type: 'term', step: '4 · Responde', title: 'nano respuestas.txt', prompt: '', say: 'Escribes cada respuesta detrás de los dos puntos. Nada más.',
      lines: [{ o: '# 1. ¿Qué IP lanzó el ataque de fuerza bruta?' }, { o: '1: 192.0.2.61' }, { o: '' }, { o: '# 2. ¿Cuántos intentos fallidos hizo?' }, { o: '2: 242' }] },
    { type: 'term', step: '5 · Corrige', title: 'zsh', prompt: '$ ', say: 'Ejecutas comprobar punto pe y griega. Te puntúa al instante. Si fallas, no te da la solución: te da una pista.',
      lines: [{ c: 'python3 comprobar.py' }, { o: '  ✔ 1. ¿Qué IP lanzó el ataque de fuerza bruta?' }, { o: '  ✔ 2. ¿Cuántos intentos fallidos hizo?' }, { o: '' }, { o: '  Puntuación: 6/6  ¡Práctica superada!' }] },
    { type: 'title', step: 'Siguiente', h: '4 niveles, 12 prácticas', sub: 'Principiante → Intermedio → Avanzado → Experto. Cuando domines una, pasa a la siguiente. Usa el Glosario (tecla /) siempre que una palabra te suene rara.',
      say: 'Eso es todo. Hay doce prácticas en cuatro niveles. Empieza por el nivel uno y sube cuando te sientas cómodo. ¡Suerte!' },
  ],
};

/* ============ 1 · Nivel 1 — Fuerza bruta en auth.log ============ */
window.VIDEOS['n1-fuerzabruta'] = {
  title: 'Nivel 1 · Detectar un ataque de fuerza bruta', badge: 'Principiante',
  scenes: [
    { type: 'title', step: 'Objetivo', h: 'Leer auth.log como un analista', sub: 'Un servidor registra cada intento de entrada por SSH. Vamos a separar un ataque real del ruido normal de Internet.',
      say: 'En este nivel aprendemos a leer el registro de autenticación de Linux y a distinguir un ataque de verdad del ruido de fondo.' },
    { type: 'term', step: 'Mirar', title: 'zsh', prompt: '$ ', say: 'Primero vemos cómo son las líneas. Hay accesos correctos, con Accepted, y fallidos, con Failed o Invalid user.',
      lines: [{ c: 'head -3 datos/auth.log' }, { o: 'Mar 12 07:14:02 web01 sshd: Accepted publickey for ana from 10.10.20.40' }, { o: 'Mar 12 02:31:10 web01 sshd: Failed password for backup from 192.0.2.61' }, { o: 'Mar 12 02:31:12 web01 sshd: Invalid user admin from 192.0.2.61' }] },
    { type: 'term', step: 'Contar', title: 'zsh', prompt: '$ ', say: 'Contamos los fallos por dirección IP. Esta cadena extrae las IP, las ordena y cuenta cuántas veces aparece cada una.',
      lines: [{ c: "grep -E 'Failed|Invalid' datos/auth.log | grep -oE '([0-9]+\\.){3}[0-9]+' | sort | uniq -c | sort -rn | head" },
        { o: '    242 192.0.2.61     <- destaca muchísimo' }, { o: '      5 198.51.100.7' }, { o: '      4 203.0.113.9' }, { o: '      3 198.51.100.2' }] },
    { type: 'term', step: 'Entró', title: 'zsh', prompt: '$ ', say: 'La IP con doscientos cuarenta y dos fallos es el atacante. Vemos si al final consiguió entrar, y con qué usuario.',
      lines: [{ c: "grep 'Accepted' datos/auth.log | grep 192.0.2.61" }, { o: 'Mar 12 03:18:57 web01 sshd: Accepted password for backup from 192.0.2.61' }] },
    { type: 'term', step: 'Después', title: 'zsh', prompt: '$ ', say: 'Y qué hizo nada más entrar. Buscamos el uso de sudo: leyó el fichero de contraseñas del sistema.',
      lines: [{ c: 'grep sudo datos/auth.log' }, { o: 'Mar 12 03:21:57 web01 sudo: backup : COMMAND=/usr/bin/cat /etc/shadow' }] },
    { type: 'title', step: 'Lección', h: 'Patrón del ataque', sub: 'Muchos fallos seguidos desde UNA IP contra UN usuario → un éxito → acción con privilegios. El resto de IPs, con pocos intentos y usuarios genéricos (admin, test, pi), son solo bots: ruido.',
      say: 'El patrón es claro: muchos fallos desde una misma dirección contra un usuario, un éxito, y enseguida una acción con privilegios. Lo demás es ruido de bots. Ya sabes cazarlo.' },
  ],
};

/* ============ 2 · Nivel 2 — Baliza y exfiltración en el tráfico ============ */
window.VIDEOS['n2-trafico'] = {
  title: 'Nivel 2 · Cazar una baliza y una fuga de datos', badge: 'Intermedio',
  scenes: [
    { type: 'title', step: 'Objetivo', h: 'Threat hunting en los logs de red', sub: 'Tenemos un CSV con todas las conexiones de una oficina (estilo Zeek). Escondidos entre miles de líneas normales hay dos problemas: una baliza de malware y una exfiltración.',
      say: 'Ahora subimos de nivel. Vamos a cazar dos amenazas escondidas en el tráfico de red de una oficina: una baliza de malware y una fuga de datos.' },
    { type: 'term', step: 'Columnas', title: 'zsh', prompt: '$ ', say: 'El fichero tiene origen, destino, puerto, protocolo y bytes de salida y entrada. Veamos la cabecera.',
      lines: [{ c: 'head -2 datos/conexiones.csv' }, { o: 'ts,orig,dest,dport,proto,bytes_out,bytes_in,duracion' }, { o: '2026-06-10 08:00:03,10.10.20.44,142.250.200.14,443,tcp,812,24500,1.2' }] },
    { type: 'term', step: 'Baliza', title: 'zsh', prompt: '$ ', say: 'Una baliza llama a su servidor de control una y otra vez. Agrupamos por pareja origen y destino y contamos: la pareja con cientos de conexiones salta a la vista.',
      lines: [{ c: "cut -d, -f2,3 datos/conexiones.csv | sort | uniq -c | sort -rn | head -3" }, { o: '    515 10.10.20.172,192.0.2.51   <- baliza' }, { o: '     31 10.10.20.44,142.250.200.14' }, { o: '     28 10.10.20.90,151.101.1.69' }] },
    { type: 'term', step: 'Ritmo', title: 'zsh', prompt: '$ ', say: 'Confirmamos que es una baliza: las llamadas son muy regulares, cada sesenta segundos, con muy pocos bytes. Eso no lo hace un humano.',
      lines: [{ c: "grep '10.10.20.172,192.0.2.51' datos/conexiones.csv | head -4 | cut -d, -f1,6" }, { o: '2026-06-10 08:12:01,312' }, { o: '2026-06-10 08:13:00,298' }, { o: '2026-06-10 08:14:02,305' }, { o: '2026-06-10 08:15:01,321' }] },
    { type: 'term', step: 'Fuga', title: 'zsh', prompt: '$ ', say: 'La exfiltración es lo contrario: una sola conexión, pero enorme. Ordenamos por bytes de salida de mayor a menor.',
      lines: [{ c: 'sort -t, -k6 -rn datos/conexiones.csv | head -1' }, { o: '2026-06-10 14:07:11,10.10.20.173,203.0.113.203,443,tcp,1642003200,9800,1203.4' }] },
    { type: 'title', step: 'Lección', h: 'Sigilo vs. ruido', sub: 'La fuga son 1,6 GB en una conexión: un pico evidente. La baliza es lo peligroso: se esconde con pocos bytes y ritmo constante. Por eso se caza por COMPORTAMIENTO (regularidad), no por tamaño.',
      say: 'Lección clave: la fuga es un pico evidente, pero la baliza se esconde entre el ruido. Se caza por su comportamiento regular, no por el volumen. Eso es threat hunting.' },
  ],
};

/* ============ 3 · Nivel 3 — Eventos de Windows ============ */
window.VIDEOS['n3-windows'] = {
  title: 'Nivel 3 · Reconstruir un ataque en eventos de Windows', badge: 'Avanzado',
  scenes: [
    { type: 'title', step: 'Objetivo', h: 'Del phishing al Domain Admin', sub: 'El registro de seguridad de Windows cuenta toda la historia si sabes leer los EventID. Vamos a reconstruir un movimiento lateral completo.',
      say: 'En el nivel avanzado leemos los eventos de seguridad de Windows. Cada número, cada EventID, es una pieza de la historia del ataque.' },
    { type: 'term', step: 'Diccionario', title: 'EventID clave', prompt: '', say: 'Primero, los números que importan: cuatro seis dos cuatro es un inicio de sesión correcto; cuatro seis dos cinco, fallido; cuatro seis ocho ocho, un proceso nuevo.',
      lines: [{ o: '4624  inicio de sesión CORRECTO' }, { o: '4625  inicio de sesión FALLIDO' }, { o: '4688  creación de proceso' }, { o: '4769  ticket Kerberos de servicio (ojo RC4 0x17)' }, { o: '4720  se creó una CUENTA nueva' }, { o: '4728  se añadió a un GRUPO (Domain Admins)' }] },
    { type: 'term', step: 'Entrada', title: 'zsh', prompt: '$ ', say: 'Buscamos el inicio. Un documento de Word que lanza PowerShell es la firma clásica de un phishing con macro.',
      lines: [{ c: "grep 4688 datos/seguridad.csv | grep -i powershell" }, { o: 'PC-RRHH-07,carla.ruiz,NewProcess=powershell.exe ParentProcess=WINWORD.EXE' }] },
    { type: 'term', step: 'Kerberoast', title: 'zsh', prompt: '$ ', say: 'Buscamos tickets Kerberos con cifrado débil RC4, el 0x17. Decenas de ellos sobre una cuenta de servicio significan kerberoasting: robo de credenciales.',
      lines: [{ c: "grep 4769 datos/seguridad.csv | grep 0x17 | cut -d, -f4 | sort | uniq -c" }, { o: '     28 ACME\\svc_sql   <- kerberoasting' }] },
    { type: 'term', step: 'Persistencia', title: 'zsh', prompt: '$ ', say: 'Y el final: el atacante crea una cuenta nueva y la mete en Domain Admins. Eso es persistencia: quiere volver cuando quiera.',
      lines: [{ c: "grep -E '4720|4728' datos/seguridad.csv" }, { o: '4720 DC01 ... A user account was created: support_adm' }, { o: '4728 DC01 ... Member support_adm added to group Domain Admins' }] },
    { type: 'title', step: 'Lección', h: 'La línea temporal manda', sub: 'Phishing (4688) → robo de credenciales (4769 RC4) → movimiento lateral (4648/4624) → persistencia (4720/4728). Ordenar por hora convierte eventos sueltos en una historia que puedes contar en un informe.',
      say: 'Ordenando los eventos por hora, los puntos sueltos se convierten en una historia: entrada, robo de credenciales, movimiento y persistencia. Eso es un informe DFIR.' },
  ],
};

/* ============ 4 · Nivel 4 — Investigación de incidente completa ============ */
window.VIDEOS['n4-incidente'] = {
  title: 'Nivel 4 · Investigación de incidente de principio a fin', badge: 'Experto',
  scenes: [
    { type: 'title', step: 'Objetivo', h: 'Correlacionar cuatro fuentes', sub: 'Proxy web, EDR, autenticación y red, todas con el mismo reloj. El experto las cruza para construir una única línea temporal y mapearla a MITRE ATT&CK.',
      say: 'En el nivel experto no basta con una fuente. Cruzamos proxy, EDR, autenticación y red para reconstruir un incidente completo y mapearlo a MITRE ATT&CK.' },
    { type: 'term', step: 'Entrada', title: 'zsh', prompt: '$ ', say: 'El proxy muestra el vector de entrada: una factura falsa descargada de un dominio sospechoso.',
      lines: [{ c: 'grep -i .zip datos/proxy.log' }, { o: '09:41:12 paula.marin GET http://office-update365.net/factura_09.zip 200 482311' }] },
    { type: 'term', step: 'Ejecución', title: 'zsh', prompt: '$ ', say: 'El EDR muestra la cadena de ejecución: el usuario abre un .js, wscript lo ejecuta y lanza PowerShell oculta. Técnica T mil cincuenta y nueve.',
      lines: [{ c: 'grep -A2 factura_09.js datos/edr_procesos.log' }, { o: 'proc_start wscript.exe factura_09.js' }, { o: 'proc_start powershell.exe -nop -w hidden -enc <b64> (parent=wscript.exe)' }] },
    { type: 'term', step: 'Exfiltración', title: 'zsh', prompt: '$ ', say: 'La red revela la fuga: rclone, una herramienta legítima usada con mala intención, sube más de un gigabyte al mismo servidor de control.',
      lines: [{ c: 'sort -t= -k2 -rn datos/red.log | grep rclone' }, { o: 'SRV-FICHEROS -> 203.0.113.44:443 bytes_out=1340211200 (proc=rclone.exe)' }] },
    { type: 'term', step: 'Impacto', title: 'zsh', prompt: '$ ', say: 'Y el impacto final: borran las copias de seguridad con vssadmin y despliegan el ransomware. Primero roban, luego cifran: doble extorsión.',
      lines: [{ c: "grep -Ei 'vssadmin|lock.exe' datos/edr_procesos.log" }, { o: 'SRV-BACKUP proc_start vssadmin.exe delete shadows /all /quiet' }, { o: 'multiple proc_start C:\\Windows\\Temp\\lock.exe (ransomware)' }] },
    { type: 'title', step: 'Lección', h: 'Una historia, muchas fuentes', sub: 'Entrada → ejecución → C2 → descubrimiento → movimiento lateral → exfiltración → impacto. Ninguna fuente sola lo cuenta; el valor del analista experto está en correlacionarlas por tiempo.',
      say: 'Ninguna fuente por sí sola cuenta el incidente. El trabajo del experto es coser las cuatro por tiempo hasta tener una sola historia, de la entrada al impacto. Enhorabuena: has llegado al nivel experto.' },
  ],
};
