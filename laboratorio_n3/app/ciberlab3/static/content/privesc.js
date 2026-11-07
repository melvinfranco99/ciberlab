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
]};
