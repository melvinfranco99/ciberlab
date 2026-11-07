/* N2 · Escritorio 2 — Red y Purple Team (enfoque profesional: planificación, emulación, detección y reporte) */
CL.areas.redteam = { id: 'redteam', title: 'Red y Purple Team', tagline: 'Ejercicios de adversario realistas, controlados y útiles para quien defiende.',
intro: `Un **red team** no es un pentest largo: es un ejercicio con **objetivos de negocio** («acceder a los datos de nóminas») que mide si la organización **detecta y responde**. Un **purple team** une a atacantes y defensores para cerrar brechas de detección técnica a técnica.

En este escritorio aprendes el oficio: planificación legal, emulación basada en inteligencia, cómo se ve un C2 desde el lado defensivo y cómo escribir un informe que cambie cosas. Para practicar la parte técnica ofensiva, usa plataformas creadas para ello (HTB Pro Labs, TryHackMe Red Team path) y el catálogo **Técnicas ATT&CK** de este mismo escritorio.`,
levels: [
{ name: 'Base N2', lessons: [
{ id: 'rt-01', t: 'Reglas de enfrentamiento: el contrato de un ejercicio red team', min: 45, labs: [],
  obj: ['Redactar unas **RoE** completas', 'Definir objetivos, *white cell* y procedimiento de desconflicto', 'Saber cuándo parar un ejercicio'],
  theory: `Las **reglas de enfrentamiento (RoE)** amplían la autorización del N1 con lo propio de un ejercicio realista:

| Apartado | Contenido |
|---|---|
| Objetivos (*flags*) | p. ej. «leer un fichero de \\\\srv01\\nominas», «obtener un rol de Global Admin de pruebas» |
| Alcance y exclusiones | Sistemas de producción críticos, OT, sanitarios, terceros |
| Técnicas permitidas | ¿Phishing? ¿Acceso físico? ¿Ingeniería social telefónica? ¿Malware a medida? |
| **White cell** | Personas de la empresa que conocen el ejercicio y pueden confirmarlo |
| **Desconflicto** | Si el SOC detecta algo, cómo se pregunta a la white cell si es el ejercicio o un ataque real |
| Parada de emergencia | Qué provoca detener todo (caída de servicio, datos personales, ataque real en curso) |
| Datos | Cómo se protegen, cifran y destruyen las evidencias |
| Seguro y legal | Responsabilidad civil, NDA, RGPD (encargado del tratamiento) |`,
  steps: [['Usa la plantilla de autorización como base', '', 'Ve a **Auditorías avanzadas** → nueva auditoría *gran empresa* → pestaña **Autorización**, y añade como anexo las secciones de la tabla.'],
          ['Define el procedimiento de desconflicto', '', 'Ejemplo: «El SOC llama al teléfono de la white cell con el código de ejercicio. Si en 15 minutos no hay confirmación, se trata como incidente real».']],
  defense: 'Sin white cell ni desconflicto, un ejercicio puede tapar un ataque real («será el red team») o desencadenar una respuesta desproporcionada.',
  quiz: [['El SOC detecta actividad y no sabe si es el ejercicio. ¿Qué hace?', ['Ignorarla', 'Seguir el procedimiento de desconflicto con la white cell', 'Llamar al red team directamente'], 1, 'Así no se ignora un ataque real ni se revela el ejercicio a todo el equipo.']],
  challenge: 'Redacta las RoE completas de un ejercicio para una empresa ficticia de 800 empleados con objetivos de negocio, exclusiones y desconflicto.',
  refs: [['Red Team Development and Operations (Vest & Tubberville)', 'https://redteam.guide'], ['TIBER-EU framework', 'https://www.ecb.europa.eu/paym/cyber-resilience/tiber-eu/html/index.en.html']] },
{ id: 'rt-02', t: 'Emulación de adversarios basada en inteligencia (CTI)', min: 60, labs: ['host'],
  obj: ['Convertir un informe de amenaza en un **plan de emulación**', 'Mapear procedimientos a ATT&CK', 'Priorizar qué emular primero'],
  theory: `Pasos para emular un grupo:
1. **Elegir el adversario** relevante para el sector (CTI del cliente, informes públicos, ATT&CK Groups).
2. **Extraer procedimientos** de los informes: comandos, herramientas, orden, persistencia.
3. **Mapear a ATT&CK** y ordenar en fases (acceso inicial → ejecución → persistencia → movimiento → objetivo).
4. **Diseñar pruebas equivalentes y seguras** para el laboratorio o el ejercicio.
5. **Definir para cada prueba qué debería ver el defensor.**

MITRE publica planes de emulación completos (APT29, FIN6, menuPass…) en el *Center for Threat-Informed Defense*.`,
  steps: [['Lee un plan real', '', 'Abre el plan de emulación de **FIN6** del CTID y localiza sus fases y técnicas.'],
          ['Crea la capa del adversario', '', 'En ATT&CK Navigator: *Create layer from other layers* o busca el grupo y selecciona sus técnicas. Compárala con tu capa de cobertura (Ruta N2 → lección de ATT&CK).'],
          ['Selecciona 10 procedimientos', '', 'Elige los que tengan prueba atómica equivalente y que tu laboratorio pueda reproducir con seguridad (descubrimiento, persistencia, ejecución). Documenta para cada uno la telemetría esperada.']],
  defense: 'La emulación solo vale si termina en **detecciones nuevas y medidas**. Si no cambia nada en el SOC, ha sido teatro.',
  challenge: 'Crea un plan de emulación de 10 pasos basado en un grupo de ransomware actual, con técnica, telemetría esperada y regla que debería saltar.',
  refs: [['CTID Adversary Emulation Library', 'https://github.com/center-for-threat-informed-defense/adversary_emulation_library'], ['The DFIR Report (casos reales paso a paso)', 'https://thedfirreport.com']] },
]},
{ name: 'Avanzado', lessons: [
{ id: 'rt-03', t: 'Command & Control visto desde la defensa: beaconing, DNS y TLS', min: 90, labs: ['host', 'seconion'],
  obj: ['Entender cómo se comunica un implante con su servidor', 'Detectar **beaconing** por regularidad y volumen', 'Usar Zeek y huellas TLS (JA3/JA4) para cazar'],
  theory: `Un implante «llama a casa» (*beacon*) cada cierto tiempo con algo de variación (*jitter*). Aunque el contenido vaya cifrado, deja huellas:

| Señal | Dónde verla |
|---|---|
| Conexiones periódicas al mismo destino | Zeek \`conn.log\`, NetFlow, firewall |
| Dominios jóvenes o raros, muchas consultas TXT | DNS (Zeek \`dns.log\`, Sysmon 22) |
| Huella TLS de cliente poco común (JA3/JA4) | Zeek \`ssl.log\` |
| User-Agent incoherente con el proceso | Proxy, Sysmon 3 + 1 |
| Proceso inesperado con conexiones salientes | EDR, Sysmon 3 |

Herramientas: **Zeek**, **RITA** (análisis de beaconing sobre logs de Zeek), **Security Onion**, **Suricata** con reglas ET.`,
  steps: [
    ['Captura tráfico de tu laboratorio', 'sudo tcpdump -i vboxnet1 -w ~/CiberLab2/forense/corp.pcap', 'Cambia `vboxnet1` por la interfaz de CORP que veas en Laboratorio N2 → Estado.'],
    ['Procésalo con Zeek', 'mkdir -p ~/CiberLab2/forense/zeek && cd ~/CiberLab2/forense/zeek && zeek -C -r ../corp.pcap', 'Genera `conn.log`, `dns.log`, `ssl.log`, `http.log`…'],
    ['Busca destinos con muchas conexiones', `zeek-cut id.orig_h id.resp_h id.resp_p < conn.log | sort | uniq -c | sort -rn | head`, ''],
    ['Mide la regularidad de un destino', `zeek-cut ts id.resp_h < conn.log | awk '$2=="203.0.113.80"{if(p)print $1-p; p=$1}' | sort -n | uniq -c | head`, 'Si casi todas las diferencias se parecen (p. ej. 60 ± 6 s), es un patrón de beacon.'],
    ['Practica con capturas reales', '', 'Usa los ejercicios de [malware-traffic-analysis.net](https://www.malware-traffic-analysis.net/training-exercises.html): PCAPs de infecciones reales con soluciones.'],
  ],
  defense: '- Salida a Internet **solo por proxy** con autenticación y registro.\n- Bloquear DNS directo (solo los resolvers internos).\n- Alertar de dominios recién registrados y de huellas JA3/JA4 raras.\n- Inspección TLS donde la ley y la política lo permitan.',
  quiz: [['El contenido del C2 va cifrado con TLS. ¿Sirve de algo analizar la red?', ['No, está cifrado', 'Sí: tiempos, volúmenes, destinos y huellas TLS siguen visibles', 'Solo si rompes el cifrado'], 1, 'Los metadatos delatan el comportamiento.']],
  challenge: 'Analiza 3 ejercicios de malware-traffic-analysis.net con Zeek. Para cada uno, identifica el equipo infectado, el dominio de C2 y el patrón temporal.',
  refs: [['Zeek documentation', 'https://docs.zeek.org'], ['RITA (Active Countermeasures)', 'https://github.com/activecm/rita'], ['JA4+ fingerprints', 'https://github.com/FoxIO-LLC/ja4']] },
{ id: 'rt-04', t: 'Campañas de concienciación con phishing simulado (GoPhish)', min: 60, labs: ['docker'],
  obj: ['Organizar una simulación **autorizada** y ética', 'Montar GoPhish en local', 'Medir y convertir resultados en formación, no en castigo'],
  theory: `La simulación de phishing es una herramienta de **formación**. Requisitos mínimos:
- Autorización escrita de dirección, con RR. HH. y el delegado de protección de datos informados.
- Sin pretextos crueles (despidos, salud, nóminas falsas con miedo).
- Datos agregados: se mide la organización, no se expone a personas.
- Página de aterrizaje **educativa** («esto era una simulación, así lo podías detectar»).
- Nunca se capturan contraseñas reales: el formulario no guarda lo escrito.`,
  steps: [
    ['Arranca GoPhish solo en local', 'docker run -d --name gophish -p 127.0.0.1:3333:3333 -p 127.0.0.1:8088:80 gophish/gophish', 'Panel en `https://127.0.0.1:3333`. La contraseña inicial aparece en `docker logs gophish`.'],
    ['Crea la campaña de laboratorio', '', 'Usa como «empleados» buzones de prueba propios (p. ej. un servidor de correo local como MailHog). Diseña una plantilla y una landing educativa.'],
    ['Mide', '', 'Tasa de apertura, clic y, sobre todo, **tasa de reporte** al equipo de seguridad: es la métrica que hay que subir.'],
  ],
  defense: 'Controles que reducen el impacto: MFA resistente a phishing (FIDO2/passkeys), DMARC `p=reject`, etiquetado de correo externo, botón de reporte en el cliente de correo y bloqueo de macros de Internet.',
  challenge: 'Diseña un programa anual de concienciación: 4 simulaciones de dificultad creciente, formación posterior y objetivos de tasa de reporte.',
  refs: [['GoPhish documentation', 'https://docs.getgophish.com'], ['INCIBE — kit de concienciación', 'https://www.incibe.es/empresas/formacion/kit-concienciacion']] },
]},
{ name: 'Experto', lessons: [
{ id: 'rt-05', t: 'El informe de red team: narrativa, cadena de ataque y recomendaciones', min: 60, labs: [],
  obj: ['Escribir la **narrativa** del ejercicio que entiende dirección', 'Dibujar la cadena de ataque con puntos de detección', 'Priorizar recomendaciones por impacto en la cadena'],
  theory: `Estructura recomendada:
1. **Resumen ejecutivo**: objetivos, si se alcanzaron, tiempo hasta lograrlo y si se detectó.
2. **Cadena de ataque**: línea temporal fase a fase con técnica ATT&CK, evidencia y **oportunidad de detección** perdida o aprovechada.
3. **Rendimiento del equipo azul**: qué se vio, cuándo, cómo se respondió (MTTD/MTTR).
4. **Hallazgos**: estructurales (diseño), no solo técnicos.
5. **Recomendaciones** ordenadas por cuántas cadenas rompen.
6. **Anexos**: IoC del ejercicio para que el SOC pueda limpiar y crear detecciones.`,
  steps: [['Usa el programa de Auditorías', '', 'Crea una auditoría tipo *gran empresa*, añade los hallazgos y exporta el informe. Después añade a mano la sección «Cadena de ataque» con un diagrama.']],
  defense: 'Una buena recomendación rompe la cadena **lo antes posible**: MFA robusto y eliminar contraseñas débiles en cuentas de servicio corta más ataques que un parche aislado.',
  challenge: 'Toma un caso de The DFIR Report y reescríbelo como informe de red team de 3 páginas: narrativa, cadena con detecciones y 5 recomendaciones priorizadas.',
  refs: [['The DFIR Report', 'https://thedfirreport.com'], ['SANS — Writing a Penetration Testing Report', 'https://www.sans.org/white-papers/33343/']] },
]},
]};
