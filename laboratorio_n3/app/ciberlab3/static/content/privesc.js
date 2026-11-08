/* N3 · Escritorio 4 — Escalada de privilegios */
CL.areas.privesc = { id: 'privesc', title: 'Escalada de privilegios', tagline: 'De usuario sin privilegios a root o SYSTEM: enumerar bien, encontrar el error de configuración y abusarlo con método.',
intro: `## Escalada de privilegios
Ya tienes un punto de apoyo con pocos privilegios. Ahora buscas el **error de configuración** que te da el control total de la máquina. El 90 % del trabajo es **enumerar**; el exploit es la parte fácil. Dos mundos: Linux (root) y Windows (SYSTEM).`,
levels: [
{ name: 'Fundamento ofensivo', lessons: [
{ id: 'pe-01', t: 'Escalada en Linux: SUID, sudo, capabilities, cron y rutas escribibles', min: 65, labs: ['vm'],
  obj: ['Enumerar de forma sistemática los vectores locales', 'Entender por qué cada mala configuración permite escalar', 'Usar GTFOBins para convertir un binario permitido en root'],
  theory: `En Linux, las vías clásicas de \`usuario → root\`:

| Vector | Qué buscas | Abuso |
|---|---|---|
| **sudo** | \`sudo -l\`: comandos permitidos sin contraseña | Un binario de la lista con escape (GTFOBins) |
| **SUID/SGID** | binarios con bit SUID | El mismo truco GTFOBins para ejecutar como el dueño (root) |
| **Capabilities** | \`getcap -r / 2>/dev/null\` | \`cap_setuid\` en python/perl = root directo |
| **Cron** | tareas root sobre ficheros/rutas que puedes escribir | Inyectas tu comando en el script que root ejecuta |
| **PATH / wildcard** | scripts root que llaman binarios sin ruta absoluta | Pones un binario tuyo antes en el PATH |
| **Kernel** | versión antigua con CVE | Exploit local (último recurso: puede tumbar la máquina) |

La herramienta clave es **GTFOBins**: para cada binario «normal» te dice cómo abusarlo si lo tienes vía sudo o SUID.`,
  steps: [
    ['Enumera automáticamente', './linpeas.sh | tee ~/CiberLab3/loot/linpeas.txt', 'LinPEAS resalta en rojo/amarillo lo interesante. Aun así, revisa a mano: la máquina sabe cosas que el script no prioriza.'],
    ['Revisa tus permisos sudo', 'sudo -l', 'Si puedes ejecutar algo como root sin contraseña, busca ese binario en GTFOBins. Muchas veces es escalada instantánea.'],
    ['Busca SUID y capabilities', 'find / -perm -4000 -type f 2>/dev/null; getcap -r / 2>/dev/null', 'Un `python3` con `cap_setuid+ep` es root en una línea. Un SUID raro (no del sistema) es sospechoso.'],
    ['Abusa con GTFOBins', '', 'Ejemplo (sudo tar): `sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh`. Confirma con `id` → `uid=0(root)`.'],
  ],
  defense: 'Higiene de sistema: mínimos SUID, `sudo` sin comodines ni binarios con escape, capabilities justas, cron que use rutas absolutas y ficheros no escribibles por otros, y kernel al día. Un EDR de Linux (p. ej. auditd/Falco) detecta el patrón «shell hija de un binario SUID».',
  quiz: [['¿Qué recurso te dice cómo abusar de un binario concreto que tienes vía sudo o SUID?', ['CVE Details', 'GTFOBins', 'Shodan'], 1, 'GTFOBins cataloga el abuso de binarios Unix para escalar o salir de restricciones.'],
         ['`getcap` revela un python con cap_setuid. Eso significa…', ['Nada relevante', 'Puedes obtener root con una línea de python', 'El python está roto'], 1, 'cap_setuid permite a python cambiar a uid 0: root inmediato.']],
  challenge: 'Resuelve tres máquinas Linux de laboratorio escalando por tres vectores distintos (sudo, SUID y cron). Documenta el «porqué» de cada mala configuración para el informe.',
  refs: [['GTFOBins', 'https://gtfobins.github.io/'], ['LinPEAS', 'https://github.com/carlospolop/PEASS-ng'], ['HackTricks · Linux PrivEsc', 'https://book.hacktricks.xyz/linux-hardening/privilege-escalation']] },
]},
{ name: 'Operador', lessons: [
{ id: 'pe-02', t: 'Escalada en Windows: tokens, servicios, UAC y secretos olvidados', min: 65, labs: ['vm'],
  obj: ['Enumerar privilegios y servicios mal configurados en Windows', 'Entender los privilegios peligrosos (SeImpersonate, SeBackup)', 'Encontrar credenciales guardadas en el sistema'],
  theory: `En Windows, \`usuario → SYSTEM\` suele venir de:

| Vector | Qué buscas | Idea del abuso |
|---|---|---|
| **Privilegios de token** | \`whoami /priv\` | \`SeImpersonatePrivilege\` → familia *Potato* (suplantar a SYSTEM) |
| **Servicios** | binarios/rutas de servicio escribibles, *unquoted paths* | Sustituyes el binario que arranca como SYSTEM |
| **AlwaysInstallElevated** | dos claves de registro a 1 | Instalas un MSI que corre como SYSTEM |
| **Credenciales guardadas** | ficheros de desatendido, \`cmdkey /list\`, registro | Reutilizas contraseñas de administrador |
| **UAC bypass** | integridad media con cuenta admin | Técnicas de *bypass* para pasar a alta integridad |

Enumera con **WinPEAS** o **PrivescCheck**; para abusar, **SharpUp**/**PowerUp** identifican los servicios vulnerables.`,
  steps: [
    ['Mira tus privilegios', 'whoami /priv', 'Si ves `SeImpersonatePrivilege` o `SeBackupPrivilege` habilitado, tienes un camino casi seguro a SYSTEM.'],
    ['Enumera con WinPEAS', '.\\winPEASx64.exe quiet', 'Resalta servicios débiles, credenciales en ficheros y configuraciones peligrosas. Vuelca a fichero para el informe.'],
    ['Busca credenciales guardadas', 'cmdkey /list ; findstr /si password *.xml *.ini *.config', 'Los ficheros de instalación desatendida (`Unattend.xml`) y configuraciones de apps guardan contraseñas en claro más de lo que crees.'],
    ['Abusa del vector encontrado', '', 'Según el caso: *Potato* con SeImpersonate, reemplazo de binario de servicio, o reutilización de la credencial de admin hallada. Confirma con `whoami` → `nt authority\\system`.'],
  ],
  defense: 'Mínimo privilegio real: quita derechos de token innecesarios a cuentas de servicio, comillas y permisos correctos en servicios, desactiva AlwaysInstallElevated, no dejes credenciales en ficheros de despliegue y usa LAPS para las contraseñas de administrador local. Microsoft Defender/EDR detecta las técnicas Potato y los cambios de binario de servicio.',
  quiz: [['`whoami /priv` muestra SeImpersonatePrivilege habilitado. ¿Qué sugiere?', ['Nada', 'Un camino conocido a SYSTEM (familia Potato)', 'Que eres invitado'], 1, 'SeImpersonate permite suplantar tokens y, con las técnicas Potato, llegar a SYSTEM.'],
         ['¿Dónde aparecen contraseñas en claro con más frecuencia de la deseada?', ['En el BIOS', 'En ficheros de instalación desatendida y configuraciones de apps', 'En el reloj del sistema'], 1, 'Unattend.xml, web.config y similares filtran credenciales a menudo.']],
  challenge: 'En un Windows de laboratorio (GOAD o THM), escala a SYSTEM por un servicio mal configurado y, por separado, por una credencial guardada. Anota la mitigación concreta de cada uno.',
  refs: [['WinPEAS / PrivescCheck', 'https://github.com/carlospolop/PEASS-ng'], ['HackTricks · Windows Local PrivEsc', 'https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation'], ['LOLBAS', 'https://lolbas-project.github.io/']] },
]},
{ name: 'Experto', lessons: [
{ id: 'pe-03', t: 'Escapes de contenedor y abuso de Docker', min: 65, labs: [],
  obj: ['Reconocer cuándo estás dentro de un contenedor', 'Entender las malas configuraciones que permiten escapar al host', 'Abusar del grupo docker como escalada local'],
  theory: `Muchos *footholds* caen dentro de un **contenedor**, no en el host. Escapar al host anfitrión depende de malas configuraciones:

| Mala configuración | Por qué escapa | 
|---|---|
| \`--privileged\` | El contenedor ve los dispositivos del host; se monta su disco |
| Socket de Docker montado (\`/var/run/docker.sock\`) | Puedes crear un contenedor que monte \`/\` del host |
| Capabilities de más (\`SYS_ADMIN\`) | Permiten operaciones de montaje y abuso de cgroups |
| Pertenecer al **grupo docker** en el host | \`docker run -v /:/mnt\` = root sobre el host |

**Detectar que estás en un contenedor**: \`/.dockerenv\`, cgroups en \`/proc/1/cgroup\`, hostname con hash. El grupo docker es, en la práctica, equivalente a root: cualquier miembro puede montar el sistema de ficheros del host en un contenedor.`,
  steps: [
    ['¿Estoy en un contenedor?', 'ls -la /.dockerenv; cat /proc/1/cgroup', 'La presencia de `/.dockerenv` o referencias a docker/containerd en cgroup confirman que estás contenido.'],
    ['Enumera privilegios del contenedor', 'capsh --print; mount | grep docker.sock', 'Capabilities amplias o el socket de Docker montado son billetes de salida al host.'],
    ['Abuso del grupo docker (escalada local)', 'docker run -v /:/mnt --rm -it alpine chroot /mnt sh', 'Si tu usuario está en el grupo docker, montas la raíz del host y obtienes root. En el lab, confírmalo con un objetivo preparado.'],
    ['Documenta el salto', '', 'Deja claro en el informe la diferencia entre comprometer el contenedor y comprometer el host: el impacto es muy distinto.'],
  ],
  defense: 'No uses `--privileged`, nunca montes el socket de Docker en contenedores accesibles, aplica el mínimo de capabilities, usa usuarios no-root dentro del contenedor, no metas gente en el grupo docker (equivale a root) y considera runtimes con aislamiento reforzado (gVisor, Kata). Falco detecta estas salidas.',
  quiz: [['Tu usuario está en el grupo docker del host. Eso es, en la práctica…', ['Irrelevante', 'Equivalente a root (puedes montar / en un contenedor)', 'Solo para ver imágenes'], 1, 'Con docker puedes montar la raíz del host y escribir como root.'],
         ['¿Qué confirma que estás dentro de un contenedor?', ['El reloj', '/.dockerenv o cgroups de docker en /proc/1/cgroup', 'El número de CPUs'], 1, 'Son indicadores fiables de entorno contenido.']],
  challenge: 'En un contenedor de laboratorio con el socket de Docker montado, demuestra el escape al host. Escribe la mitigación concreta que lo habría impedido.',
  refs: [['HackTricks · Docker Breakout', 'https://book.hacktricks.xyz/linux-hardening/privilege-escalation/docker-security'], ['Falco', 'https://falco.org/'], ['GTFOBins', 'https://gtfobins.github.io/']] },
{ id: 'pe-04', t: 'Pillaje de credenciales en el equipo comprometido', min: 60, labs: ['vm'],
  obj: ['Saber dónde se guardan credenciales reutilizables en Linux y Windows', 'Entender a alto nivel SAM/LSASS/DPAPI sin recetas de volcado operativo', 'Reutilizar lo encontrado para avanzar en el dominio'],
  theory: `Tras escalar, el operador **saquea credenciales** que lleven a otras máquinas. Entender *dónde viven* es media batalla:

**Linux**: claves SSH (\`~/.ssh/id_*\`), \`~/.bash_history\`, ficheros de configuración de apps, \`.env\`, tickets Kerberos en \`/tmp\`, contraseñas en scripts de automatización.

**Windows** (conceptos; el volcado operativo se hace con herramientas conocidas en el lab):
- **SAM/SYSTEM**: hashes locales (base del pass-the-hash).
- **LSASS**: memoria con credenciales de sesiones activas — el objetivo de Mimikatz; por eso existen Credential Guard y Protected Users.
- **DPAPI**: protege secretos de navegador/Wi-Fi; abusable con las claves adecuadas.
- **Vaults, \`cmdkey\`, tareas programadas, GPP** (cpassword en SYSVOL, clave conocida).

Cada credencial encontrada se prueba por la red (NetExec) para ver dónde más vale.`,
  steps: [
    ['Linux: barrido rápido', 'cat ~/.bash_history; ls -la ~/.ssh; grep -rniE "password|secret|token" /etc /opt 2>/dev/null | head', 'Historiales, claves SSH y secretos en configuraciones son lo primero. Una clave SSH suele abrir otra máquina sin contraseña.'],
    ['Windows: dónde mirar', 'cmdkey /list ; reg query HKLM\\SYSTEM /s /f password 2>nul', 'Credenciales guardadas, GPP en SYSVOL (\\\\dominio\\SYSVOL\\...\\Groups.xml) y ficheros de despliegue filtran contraseñas.'],
    ['Reutiliza por la red', 'netexec smb 192.168.59.0/24 -u usuario -p "clave_encontrada" --continue-on-success', 'La reutilización de contraseñas es la norma: una credencial local suele valer en varios equipos del dominio.'],
    ['Encadena al dominio', '', 'Con credenciales de más valor, vuelve al escritorio de Active Directory para seguir el grafo de BloodHound.'],
  ],
  defense: 'Credential Guard y Protected Users (protegen LSASS), LAPS (contraseña de admin local única por equipo), prohibir GPP con contraseñas, no reutilizar credenciales entre equipos, rotar claves SSH y vigilar accesos a LSASS/SAM con el EDR.',
  quiz: [['¿Por qué existe Windows Credential Guard?', ['Para acelerar el arranque', 'Para proteger las credenciales en memoria (LSASS) del robo', 'Para cifrar el disco'], 1, 'Aísla los secretos de LSASS, el objetivo clásico del robo de credenciales.'],
         ['Una clave SSH privada encontrada en un servidor suele significar…', ['Nada', 'Acceso a otra máquina sin necesidad de contraseña', 'Que el disco está lleno'], 1, 'Las claves SSH son credenciales reutilizables: abren los hosts que las aceptan.']],
  challenge: 'En el laboratorio, tras escalar en un Linux y un Windows, localiza una credencial reutilizable en cada uno y demuestra con NetExec en qué otros equipos vale. Propón la mitigación de cada caso.',
  refs: [['The Hacker Recipes · Credentials', 'https://www.thehacker.recipes/ad/movement/credentials/dumping'], ['LAPS', 'https://learn.microsoft.com/windows-server/identity/laps/laps-overview'], ['HackTricks · Linux loot', 'https://book.hacktricks.xyz/linux-hardening/privilege-escalation']] },
]},
]};
