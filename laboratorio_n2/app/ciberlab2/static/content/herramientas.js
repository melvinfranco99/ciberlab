/* Glosario de HERRAMIENTAS de CiberLab (N1 + N2): qué es, para qué sirve, cómo se instala en Arch y un ejemplo.
   Fuente única: compartido/herramientas.js → se copia a las apps y a la web con compartido/sincronizar.sh
   Campos: t=nombre, cat=categoría, n=1|2 (nivel), imp=1-5, pkg=paquete, what, why, ex */
(window.CL = window.CL || {}).tools = [
// ---------- Reconocimiento y redes
{ t: 'nmap', cat: 'Redes y reconocimiento', n: 1, imp: 5, pkg: 'nmap', what: 'Escáner de redes y puertos con detección de servicios, versiones y scripts (NSE).', why: 'Saber qué equipos y servicios hay antes de auditar o defender. La primera herramienta de todo pentest.', ex: 'nmap -sV -T4 -oN escaneo.txt 192.168.56.0/24' },
{ t: 'Wireshark', cat: 'Redes y reconocimiento', n: 1, imp: 5, pkg: 'wireshark-qt', what: 'Analizador de protocolos: captura y disecciona el tráfico paquete a paquete con interfaz gráfica.', why: 'Ver qué viaja por la red, depurar conexiones y detectar tráfico anómalo o en claro.', ex: 'Filtro: http.request || dns || ip.addr == 192.168.56.101' },
{ t: 'tcpdump', cat: 'Redes y reconocimiento', n: 1, imp: 4, pkg: 'tcpdump', what: 'Captura de tráfico por línea de comandos; guarda a .pcap para abrir luego en Wireshark.', why: 'Capturar en servidores sin interfaz gráfica y en scripts.', ex: 'sudo tcpdump -i eth0 -w captura.pcap port 443' },
{ t: 'netcat (nc)', cat: 'Redes y reconocimiento', n: 1, imp: 4, pkg: 'openbsd-netcat', what: 'La «navaja suiza» de TCP/UDP: abre, escucha y conecta puertos; transfiere datos.', why: 'Probar si un puerto responde, mover ficheros rápido y entender sockets.', ex: 'nc -vz 192.168.56.101 22' },
{ t: 'masscan', cat: 'Redes y reconocimiento', n: 2, imp: 3, pkg: 'masscan', what: 'Escáner de puertos asíncrono muy rápido para rangos enormes.', why: 'Barrer /16 o Internet en minutos; luego nmap afina los hallazgos.', ex: 'masscan 10.0.0.0/16 -p80,443 --rate 1000' },

// ---------- Web
{ t: 'Burp Suite', cat: 'Seguridad web', n: 1, imp: 5, pkg: 'burpsuite (AUR)', what: 'Proxy web de interceptación: ves y modificas cada petición entre el navegador y el servidor.', why: 'Es el estándar para auditar aplicaciones web: Repeater, Intruder, escáner.', ex: 'Configura el navegador con proxy 127.0.0.1:8080 e intercepta.' },
{ t: 'OWASP ZAP', cat: 'Seguridad web', n: 1, imp: 4, pkg: 'zaproxy', what: 'Proxy y escáner web libre (DAST), alternativa abierta a Burp.', why: 'Escaneo automatizado de vulnerabilidades web y uso en pipelines CI/CD.', ex: 'zaproxy  → Automated Scan contra el lab DVWA' },
{ t: 'ffuf', cat: 'Seguridad web', n: 1, imp: 4, pkg: 'ffuf', what: 'Fuzzer web ultrarrápido para descubrir rutas, ficheros y parámetros ocultos.', why: 'Encontrar paneles, backups y endpoints que no están enlazados.', ex: 'ffuf -u http://sitio/FUZZ -w lista.txt -mc 200,301' },
{ t: 'nuclei', cat: 'Seguridad web', n: 2, imp: 4, pkg: 'nuclei', what: 'Escáner basado en plantillas YAML de la comunidad para vulnerabilidades conocidas.', why: 'Comprobar miles de fallos conocidos de forma rápida y actualizable.', ex: 'nuclei -u https://sitio -t cves/' },
{ t: 'sqlmap', cat: 'Seguridad web', n: 1, imp: 4, pkg: 'sqlmap', what: 'Automatiza la detección y explotación de inyección SQL (solo con autorización).', why: 'Demostrar y documentar el impacto real de una inyección en una auditoría.', ex: 'sqlmap -u "http://sitio/item?id=1" --batch --dbs' },

// ---------- Contraseñas y credenciales
{ t: 'hashcat', cat: 'Contraseñas', n: 1, imp: 4, pkg: 'hashcat', what: 'Recuperador de contraseñas por GPU: diccionario, reglas y fuerza bruta sobre hashes.', why: 'Auditar la fortaleza de las contraseñas de tu organización.', ex: 'hashcat -m 0 -a 0 hashes.txt rockyou.txt' },
{ t: 'John the Ripper', cat: 'Contraseñas', n: 1, imp: 4, pkg: 'john', what: 'Crackeador clásico de hashes por CPU, con utilidades para extraerlos (*2john).', why: 'Romper hashes variados y convertir ficheros (zip, ssh, pdf) a formato atacable.', ex: 'john --wordlist=rockyou.txt hashes.txt' },
{ t: 'hydra', cat: 'Contraseñas', n: 1, imp: 3, pkg: 'hydra', what: 'Prueba credenciales contra servicios de red (SSH, FTP, HTTP…) en laboratorio.', why: 'Medir resistencia a fuerza bruta y validar bloqueos de cuenta (solo en tus equipos).', ex: 'hydra -l admin -P claves.txt ssh://192.168.56.101' },

// ---------- Explotación / Red Team (uso autorizado)
{ t: 'Metasploit', cat: 'Explotación', n: 1, imp: 4, pkg: 'metasploit', what: 'Marco de explotación con módulos, payloads y post-explotación para pruebas autorizadas.', why: 'Validar vulnerabilidades y practicar en máquinas de laboratorio propias.', ex: 'msfconsole → use auxiliary/scanner/...' },
{ t: 'Impacket', cat: 'Explotación', n: 2, imp: 4, pkg: 'impacket', what: 'Colección de scripts Python para protocolos Windows (SMB, Kerberos, WMI).', why: 'Herramienta base del Red Team en Active Directory (secretsdump, psexec…).', ex: 'impacket-GetUserSPNs -request acme/user' },
{ t: 'BloodHound', cat: 'Explotación', n: 2, imp: 4, pkg: 'bloodhound', what: 'Mapea rutas de ataque en Active Directory con teoría de grafos.', why: 'Ver cómo un usuario normal puede llegar a Domain Admin… y cómo cortarlo.', ex: 'Recoge con SharpHound y carga el JSON en BloodHound.' },

// ---------- Blue Team / DFIR / SIEM
{ t: 'Wazuh', cat: 'Defensa y SIEM', n: 1, imp: 4, pkg: 'wazuh (Docker)', what: 'Plataforma XDR/SIEM libre: agentes, detección, FIM y cumplimiento.', why: 'Montar un SIEM casero y practicar detección sin coste.', ex: 'Despliega con docker-compose y conecta un agente.' },
{ t: 'Splunk', cat: 'Defensa y SIEM', n: 2, imp: 4, pkg: 'splunk (Docker)', what: 'SIEM líder del mercado; se consulta con el lenguaje SPL.', why: 'Ingerir logs (EVTX, Sysmon, CloudTrail) y cazar con búsquedas potentes.', ex: 'index=win EventCode=4769 TicketEncryption=0x17' },
{ t: 'Suricata', cat: 'Defensa y SIEM', n: 2, imp: 3, pkg: 'suricata', what: 'IDS/IPS de red que inspecciona tráfico con reglas y genera eve.json.', why: 'Detectar escaneos, exploits y C2 en la frontera de la red.', ex: 'suricata -r captura.pcap -l ./salida' },
{ t: 'Zeek', cat: 'Defensa y SIEM', n: 2, imp: 3, pkg: 'zeek', what: 'Analizador de tráfico que produce logs ricos (conn.log, dns.log, http.log).', why: 'Base del threat hunting: ver conexiones, beaconing y transferencias.', ex: 'zeek -r captura.pcap' },
{ t: 'Sigma', cat: 'Defensa y SIEM', n: 2, imp: 4, pkg: 'sigma-cli (pipx)', what: 'Formato YAML abierto para reglas de detección, convertible a cualquier SIEM.', why: 'Escribir una detección una vez y usarla en Splunk, Elastic, Wazuh…', ex: 'sigma convert -t splunk regla.yml' },
{ t: 'YARA', cat: 'Defensa y SIEM', n: 2, imp: 3, pkg: 'yara', what: 'Lenguaje de reglas para identificar ficheros por patrones (cadenas, bytes).', why: 'Clasificar malware y cazar muestras por familia.', ex: 'yara reglas.yar carpeta_muestras/' },
{ t: 'CyberChef', cat: 'Defensa y SIEM', n: 1, imp: 4, pkg: 'cyberchef (Docker/web)', what: 'La «navaja suiza» del analista: decodifica, descomprime y extrae IoC con «recetas».', why: 'Base64, XOR, URL, hex… sin escribir código. Imprescindible en DFIR.', ex: 'Receta: From Base64 → Extract IP addresses' },

// ---------- Reversing y malware
{ t: 'Ghidra', cat: 'Reversing', n: 2, imp: 4, pkg: 'ghidra', what: 'Suite de ingeniería inversa de la NSA: desensamblador y decompilador.', why: 'Analizar binarios y entender qué hace un ejecutable sin fuente.', ex: 'Importa el binario y usa el decompilador (ventana Decompile).' },
{ t: 'radare2', cat: 'Reversing', n: 2, imp: 3, pkg: 'radare2', what: 'Marco de análisis binario por consola, muy potente y scriptable.', why: 'Analizar, depurar y parchear binarios desde la terminal.', ex: 'r2 -A muestra.bin  → aaa; pdf @main' },
{ t: 'strings / binwalk', cat: 'Reversing', n: 1, imp: 3, pkg: 'binutils · binwalk', what: 'strings extrae texto legible de un fichero; binwalk busca ficheros incrustados.', why: 'Triaje estático rápido: IoC, URLs y firmas sin ejecutar nada.', ex: 'strings muestra | grep -Ei "http|\\.exe"' },

// ---------- Cloud / contenedores / código
{ t: 'Trivy', cat: 'Cloud y DevSecOps', n: 2, imp: 4, pkg: 'trivy', what: 'Escáner de vulnerabilidades y secretos en imágenes, ficheros y repositorios.', why: 'Auditar contenedores y dependencias antes de desplegar.', ex: 'trivy image nginx:latest' },
{ t: 'kubectl', cat: 'Cloud y DevSecOps', n: 2, imp: 4, pkg: 'kubectl', what: 'Cliente de línea de comandos de Kubernetes.', why: 'Inspeccionar y auditar clústeres: pods, roles (RBAC), secretos.', ex: 'kubectl get pods -A' },
{ t: 'gitleaks', cat: 'Cloud y DevSecOps', n: 2, imp: 4, pkg: 'gitleaks', what: 'Busca secretos (claves, tokens) en el historial de Git.', why: 'Evitar que credenciales acaben publicadas en un repositorio.', ex: 'gitleaks detect --source . -v' },
{ t: 'semgrep', cat: 'Cloud y DevSecOps', n: 2, imp: 4, pkg: 'semgrep (pipx)', what: 'Análisis estático de código (SAST) por patrones, multilenguaje.', why: 'Detectar fallos de seguridad en el código antes de que lleguen a producción.', ex: 'semgrep --config auto .' },
{ t: 'AWS CLI', cat: 'Cloud y DevSecOps', n: 2, imp: 3, pkg: 'aws-cli-v2', what: 'Cliente oficial de AWS para scripts y auditoría.', why: 'Revisar IAM, buckets S3, CloudTrail y configuración de la nube.', ex: 'aws s3 ls --endpoint-url http://127.0.0.1:8101' },

// ---------- Plataforma y utilidades
{ t: 'Kali Linux', cat: 'Plataforma', n: 1, imp: 5, pkg: 'ISO / OVA', what: 'Distribución con cientos de herramientas de seguridad preinstaladas.', why: 'Tu máquina de ataque en el laboratorio, aislada en VirtualBox.', ex: 'Impórtala en VirtualBox con red Host-only.' },
{ t: 'VirtualBox', cat: 'Plataforma', n: 1, imp: 5, pkg: 'virtualbox', what: 'Virtualizador para crear máquinas y redes aisladas.', why: 'Montar el laboratorio (Kali, víctimas, AD) sin tocar tu equipo real.', ex: 'VBoxManage list vms' },
{ t: 'Docker', cat: 'Plataforma', n: 1, imp: 5, pkg: 'docker', what: 'Contenedores ligeros para levantar labs y servicios en segundos.', why: 'Ejecutar DVWA, Juice Shop, Splunk, etc. sin instalarlos a mano.', ex: 'docker run -d -p 127.0.0.1:8080:80 vulnerables/web-dvwa' },
{ t: 'jq', cat: 'Plataforma', n: 1, imp: 4, pkg: 'jq', what: 'Procesador de JSON por línea de comandos.', why: 'Filtrar y transformar salidas JSON (CloudTrail, APIs, nuclei).', ex: "jq '.Records[] | .eventName' cloudtrail.json" },
{ t: 'age / GnuPG', cat: 'Plataforma', n: 1, imp: 3, pkg: 'age · gnupg', what: 'Cifrado moderno (age) y clásico (GPG) de ficheros y mensajes.', why: 'Proteger evidencias y secretos; firmar entregables.', ex: 'age -p -o secreto.age informe.pdf' },
];
