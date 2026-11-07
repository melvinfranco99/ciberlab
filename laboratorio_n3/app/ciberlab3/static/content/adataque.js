/* N3 · Escritorio 5 — Active Directory ofensivo */
CL.areas.adataque = { id: 'adataque', title: 'Active Directory ofensivo', tagline: 'El corazón de casi toda intrusión corporativa: de un usuario cualquiera a dueño del dominio, entendiendo Kerberos y las rutas de ataque.',
intro: `## Active Directory ofensivo
AD es el sistema nervioso de la empresa Windows. Comprometerlo = comprometerlo (casi) todo. El operador no «prueba exploits»: **mapea rutas de ataque** y abusa de **configuraciones y de Kerberos**, no de fallos de software. Practica siempre en GOAD u otro dominio de laboratorio.`,
levels: [
{ name: 'Operador', lessons: [
{ id: 'ad-01', t: 'Enumeración del dominio y rutas de ataque con BloodHound', min: 70, labs: ['vm'],
  obj: ['Recoger el grafo del dominio con un usuario cualquiera', 'Leer rutas de ataque hacia Domain Admin', 'Priorizar el camino más corto y sigiloso'],
  theory: `Con **una sola credencial de dominio** válida ya puedes leer casi toda la estructura de AD (usuarios, grupos, equipos, ACLs, sesiones). **BloodHound** convierte eso en un **grafo** y responde a la pregunta clave: *«desde donde estoy, ¿cuál es el camino más corto a Domain Admin?»*.

Conceptos que BloodHound destapa:
- **Pertenencias anidadas**: estar en un grupo que está en otro que acaba teniendo privilegios.
- **ACLs peligrosas**: \`GenericAll\`, \`WriteDacl\`, \`ForceChangePassword\` sobre un usuario/grupo.
- **Sesiones**: dónde hay admins conectados (para robar sus credenciales).
- **Delegaciones** Kerberos mal puestas.

El recolector (**SharpHound**/**bloodhound-python**) genera un JSON; la interfaz lo pinta y marca «Shortest paths to Domain Admins».`,
  steps: [
    ['Recoge el grafo', 'bloodhound-python -d corp.local -u usuario -p "Primavera2026!" -c all -ns 192.168.59.10', 'Desde Kali, sin tocar los puestos. Genera varios `.json` para importar.'],
    ['Levanta BloodHound y carga el JSON', 'docker compose up -d   # BloodHound CE', 'Arrastra los JSON a la interfaz. Marca tu usuario como *Owned* (botón derecho → Mark as Owned).'],
    ['Busca el camino a Domain Admin', '', 'Usa *Shortest Paths from Owned Principals to Domain Admins*. BloodHound dibuja la cadena de abusos exacta que tienes que encadenar.'],
    ['Prioriza', '', 'Entre varios caminos, elige el más corto y el que menos ruido genere (p. ej. abusar de una ACL es más silencioso que volcar credenciales de un servidor).'],
  ],
  defense: 'Ejecuta BloodHound tú, como defensor: encuentra y corta esas rutas antes que el atacante. Revisa ACLs peligrosas, reduce pertenencias a grupos privilegiados, limita dónde inician sesión los admins (Tiering / PAW) y audita las delegaciones.',
  quiz: [['¿Qué necesita BloodHound para mapear un dominio?', ['Ser Domain Admin', 'Una sola credencial de usuario del dominio', 'Acceso físico al DC'], 1, 'Cualquier usuario autenticado puede leer casi toda la estructura de AD.'],
         ['Una ACL `GenericAll` sobre un grupo privilegiado permite…', ['Nada', 'Controlar ese objeto (p. ej. añadirte al grupo)', 'Apagar el DC'], 1, 'GenericAll da control total sobre el objeto: puedes modificarlo a tu favor.']],
  challenge: 'En GOAD, recoge el grafo con un usuario de bajo privilegio y encuentra al menos dos rutas distintas a Domain Admin. Dibújalas y explica el abuso de cada salto.',
  refs: [['BloodHound CE', 'https://github.com/SpecterOps/BloodHound'], ['The Hacker Recipes · AD', 'https://www.thehacker.recipes/ad/'], ['GOAD walkthrough', 'https://mayfly277.github.io/']] },
]},
{ name: 'Experto', lessons: [
{ id: 'ad-02', t: 'Ataques a Kerberos: Kerberoasting, AS-REP roasting y abuso de delegación', min: 80, labs: ['vm'],
  obj: ['Entender los tickets TGT/TGS y por qué se pueden abusar', 'Obtener hashes crackeables de cuentas de servicio', 'Reconocer delegaciones peligrosas'],
  theory: `Kerberos autentica con **tickets**. Dos abusos no necesitan más que ser usuario del dominio:

**Kerberoasting (T1558.003)** — Cualquier usuario puede pedir un ticket de servicio (TGS) para cualquier cuenta con **SPN** (suelen ser cuentas de servicio). El TGS va cifrado con el hash de la contraseña de esa cuenta → te lo llevas y lo **crackeas offline**. Las cuentas de servicio suelen tener contraseñas débiles y eternas.

**AS-REP roasting (T1558.004)** — Las cuentas con *«no requiere preautenticación Kerberos»* devuelven material cifrado con su hash **sin autenticar siquiera**. Mismo final: crackeo offline.

**Delegación** — Si una cuenta tiene delegación *unconstrained* o *constrained* mal puesta, puede suplantar a otros usuarios (incluido un admin). Es de los caminos más potentes a Domain Admin.

El cifrado **RC4 (0x17)** en estos tickets es la señal que el Blue Team caza (lo viste en el N2).`,
  steps: [
    ['Kerberoasting: pide los TGS', 'impacket-GetUserSPNs corp.local/usuario:"Primavera2026!" -dc-ip 192.168.59.10 -request -outputfile tgs.hash', 'Obtienes el material de cada cuenta con SPN. No has tocado ningún servidor: solo pediste tickets, como haría un cliente normal.'],
    ['Crackea offline', 'hashcat -m 13100 tgs.hash rockyou.txt', 'Offline = sin ruido en el objetivo. Si la cuenta de servicio tiene una contraseña débil, cae en minutos.'],
    ['AS-REP roasting', 'impacket-GetNPUsers corp.local/ -usersfile usuarios.txt -dc-ip 192.168.59.10 -request', 'Para cuentas sin preautenticación. Crackea con `hashcat -m 18200`.'],
    ['Busca delegaciones', 'bloodhound → "Shortest paths to Unconstrained Delegation"', 'Una delegación unconstrained en un servidor que un admin visita es casi un jaque mate: se le puede robar el TGT.'],
  ],
  defense: 'Cuentas de servicio con contraseñas largas y aleatorias (o **gMSA**, que las gestiona el propio AD), desactivar RC4, no permitir cuentas sin preautenticación, revisar y eliminar delegaciones innecesarias, y alertar de peticiones masivas de TGS con RC4 (4769 0x17) desde una cuenta.',
  quiz: [['¿Por qué el Kerberoasting se cracker "offline" y es sigiloso?', ['Porque se hace sin red', 'Porque el TGS se descifra en tu máquina, sin más peticiones al objetivo', 'Porque usa MFA'], 1, 'Pides el ticket una vez y el crackeo ocurre en tu equipo: el objetivo no ve los intentos.'],
         ['Señal clásica de Kerberoasting en los logs del DC:', ['4624 LogonType 2', '4769 con cifrado RC4 (0x17) en ráfaga', '4688 de notepad'], 1, 'Peticiones de TGS con RC4 sobre cuentas con SPN delatan el ataque.']],
  challenge: 'En GOAD, consigue por Kerberoasting el hash de una cuenta de servicio, crackéalo y úsalo para avanzar. Luego escribe la detección Sigma que lo habría cazado (reutiliza lo del N2).',
  refs: [['The Hacker Recipes · Kerberos', 'https://www.thehacker.recipes/ad/movement/kerberos/'], ['Impacket', 'https://github.com/fortra/impacket'], ['MITRE T1558', 'https://attack.mitre.org/techniques/T1558/']] },
]},
]};
