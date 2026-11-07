/* N3 — ampliación del programa de Auditorías: normativa, riesgos y controles de gran empresa */
CL.audit.intro = CL.audit.intro.replace('# 📋 Auditorías de seguridad', '# 📋 Auditorías avanzadas (N3)\n\nAdemás del flujo del N1, aquí tienes guías de **ISO 27001:2022, ENS, NIS2, DORA y análisis de riesgos (MAGERIT)**, y una checklist ampliada con dominio, detección, cloud y cadena de suministro.')
  .replace(/~\/CiberLab\//g, '~/CiberLab3/');

CL.audit.guides.push(
{ id: 'iso27001', t: '🏛 ISO 27001:2022 — análisis de brechas', md: `# 🏛 ISO/IEC 27001:2022: auditoría de brechas (gap analysis)

La norma tiene dos partes: las **cláusulas 4‑10** (el sistema de gestión: contexto, liderazgo, planificación, soporte, operación, evaluación y mejora) y el **Anexo A** con **93 controles** en 4 temas:

| Tema | Nº | Ejemplos |
|---|---|---|
| Organizativos (5.x) | 37 | 5.7 Inteligencia de amenazas · 5.23 Seguridad en servicios cloud · 5.30 Preparación TIC para la continuidad |
| Personas (6.x) | 8 | 6.3 Concienciación · 6.7 Teletrabajo |
| Físicos (7.x) | 14 | 7.4 Monitorización de la seguridad física |
| Tecnológicos (8.x) | 34 | 8.9 Gestión de la configuración · 8.12 Prevención de fuga de datos · 8.16 Monitorización · 8.28 Codificación segura |

### Cómo hacer el análisis de brechas
1. Pide la **Declaración de Aplicabilidad (SoA)**: qué controles aplican y por qué.
2. Para cada control aplicable, valora: *No existe / Informal / Documentado / Implantado / Medido*.
3. Pide **evidencias**, no palabras: una política firmada, un registro, una captura de la configuración, un informe de la última revisión.
4. Muestrea: si dicen que revisan accesos trimestralmente, pide los 2 últimos informes.
5. Clasifica las desviaciones: **no conformidad mayor** (falta un requisito o hay fallo sistemático), **menor** (fallo puntual) u **oportunidad de mejora**.

### Errores típicos que encontrarás
- Análisis de riesgos copiado de una plantilla, sin relación con los activos reales.
- SoA que excluye controles sin justificación.
- Auditoría interna y revisión por la dirección inexistentes o de trámite.
- Controles nuevos de 2022 sin abordar (5.7, 5.23, 8.9, 8.10, 8.11, 8.12, 8.16, 8.23, 8.28).

> Certificarse requiere una entidad acreditada (ENAC en España). Para auditar profesionalmente: **ISO 27001 Lead Auditor**.` },
{ id: 'ens', t: '🇪🇸 ENS (Esquema Nacional de Seguridad)', md: `# 🇪🇸 Esquema Nacional de Seguridad (RD 311/2022)

Obligatorio para el **sector público** español y para los **proveedores** que le prestan servicios TIC (muchas empresas privadas).

### Categorización
Se valoran 5 dimensiones (Confidencialidad, Integridad, Trazabilidad, Autenticidad, Disponibilidad) en nivel **Bajo, Medio o Alto**. La categoría del sistema es la del nivel más alto: **Básica, Media o Alta**.

### Medidas (Anexo II)
| Marco | Ejemplos |
|---|---|
| Organizativo (org) | Política de seguridad, normativa, procedimientos, autorizaciones |
| Operacional (op) | Análisis de riesgos, control de acceso, explotación, servicios externos, continuidad, monitorización |
| Medidas de protección (mp) | Instalaciones, personal, equipos, comunicaciones, soportes, aplicaciones, información, servicios |

Cada medida tiene **refuerzos** según la categoría (R1, R2…).

### Cómo auditar
- Guías **CCN-STIC 800** (en especial la 802 de auditoría y la 808 de verificación).
- Herramientas del CCN: **PILAR** (análisis de riesgos MAGERIT), **INES** (informe del estado), **CLARA** (cumplimiento de configuraciones), **LUCIA** (gestión de incidentes).
- Auditoría formal **cada 2 años** para categoría Media/Alta; autoevaluación para Básica.
- **Prowler** incluye el marco ENS para AWS.` },
{ id: 'nis2', t: '🇪🇺 NIS2 y DORA', md: `# 🇪🇺 NIS2 y DORA

### NIS2 (Directiva UE 2022/2555)
Amplía mucho los sectores obligados (energía, transporte, salud, agua, infraestructura digital, servicios TIC gestionados, administración, alimentación, fabricación, etc.). Entidades **esenciales** e **importantes** según sector y tamaño (en general ≥ 50 empleados o ≥ 10 M€).

**Medidas mínimas (art. 21):** análisis de riesgos, gestión de incidentes, continuidad y copias, **seguridad de la cadena de suministro**, seguridad en el desarrollo y la adquisición, evaluación de la eficacia, higiene y formación, criptografía, seguridad del personal y control de acceso, **MFA**.

**Notificación de incidentes significativos:** alerta temprana en **24 h**, notificación en **72 h**, informe final en **1 mes**.

**Responsabilidad de la dirección:** los órganos de dirección aprueban las medidas, supervisan y deben formarse; pueden responder personalmente.

Comprueba siempre el estado de la **ley española de transposición** y las guías del INCIBE y del CCN aplicables al cliente.

### DORA (Reglamento UE 2022/2554) — sector financiero
Aplicable desde enero de 2025 a bancos, aseguradoras, gestoras, entidades de pago y sus **proveedores TIC críticos**.
- Marco de gestión del riesgo TIC aprobado por el consejo.
- Clasificación y notificación de incidentes TIC graves.
- **Pruebas de resiliencia**, incluidas pruebas de penetración basadas en amenazas (**TLPT**, alineadas con TIBER-EU) cada 3 años para entidades significativas.
- Gestión del riesgo de terceros TIC con registro de contratos.

### Cómo usarlo en una auditoría
Mapea cada hallazgo técnico al artículo correspondiente: el cliente entiende mejor «incumple el art. 21.2.j de NIS2 (MFA)» que «falta MFA en la VPN».` },
{ id: 'riesgos', t: '⚖ Análisis de riesgos (MAGERIT)', md: `# ⚖ Análisis de riesgos con MAGERIT

MAGERIT es la metodología del Gobierno de España (usada por el ENS y en la herramienta **PILAR**).

### Pasos
1. **Activos**: información, servicios, aplicaciones, equipos, redes, personas, instalaciones. Con sus **dependencias** (el servicio de facturación depende del ERP, que depende del servidor SQL…).
2. **Valoración** de cada activo en las dimensiones C, I, D, A, T (0‑10).
3. **Amenazas** por tipo de activo (catálogo MAGERIT): desastres, errores, ataques intencionados, con su **frecuencia** y **degradación**.
4. **Impacto potencial** = valor × degradación.
5. **Riesgo potencial** = impacto × frecuencia.
6. **Salvaguardas** existentes y su eficacia → **riesgo residual**.
7. **Tratamiento**: mitigar, transferir (seguro), evitar o aceptar formalmente (firma de la dirección).

### Matriz simplificada para pymes
| Probabilidad \\ Impacto | Bajo | Medio | Alto | Crítico |
|---|---|---|---|---|
| **Alta** | Medio | Alto | Crítico | Crítico |
| **Media** | Bajo | Medio | Alto | Crítico |
| **Baja** | Bajo | Bajo | Medio | Alto |

Cada hallazgo de la auditoría debería vincularse a un riesgo de esta matriz: así se prioriza con criterio de negocio.` },
{ id: 'informe-consejo', t: '📊 Informe para el consejo de administración', md: `# 📊 Cómo presentar una auditoría a un consejo de administración

El consejo no lee CVSS. Necesita saber **qué riesgo corre la empresa, cuánto cuesta reducirlo y qué decisión se le pide**.

### Estructura de 2 páginas
1. **Conclusión en una frase**: «La empresa es vulnerable a un ransomware que pararía la producción 2‑3 semanas».
2. **Tres riesgos principales** en lenguaje de negocio, con impacto estimado (días de parada, sanciones, reputación).
3. **Comparativa**: dónde estamos frente a un marco (NIST CSF 2.0, ISO 27001) o frente al sector.
4. **Plan de 90 días / 12 meses** con coste aproximado y reducción de riesgo esperada.
5. **Decisiones solicitadas**: presupuesto, responsable, aceptación formal de riesgos que no se tratan.

### Consejos
- Una gráfica, no diez.
- Nada de siglas sin explicar.
- Lleva preparado el detalle técnico como anexo para quien lo pida.` }
);

CL.audit.checklist.push(
{ t: '10. Active Directory e identidad (avanzado)', items: [
  { id: 'ad-tier', t: 'Modelo de niveles: cuentas tier 0 solo inician sesión en sistemas tier 0', how: 'BloodHound/PingCastle: sesiones de Domain Admins en puestos y servidores.', fix: 'Implantar tiering con GPO de restricción de inicio de sesión y PAWs.', sev: 'alta', only: 'gran' },
  { id: 'ad-laps', t: 'LAPS desplegado en todos los equipos', how: 'Comprueba el atributo msLAPS-Password / ms-Mcs-AdmPwd en una muestra de equipos.', fix: 'Desplegar Windows LAPS por GPO.', sev: 'alta' },
  { id: 'ad-krb', t: 'Cuentas de servicio con gMSA o contraseñas largas; RC4 retirado', how: 'Inventario de cuentas con SPN, PasswordLastSet y tipos de cifrado.', fix: 'Migrar a gMSA, forzar AES, rotar contraseñas antiguas.', sev: 'alta' },
  { id: 'ad-adcs', t: 'ADCS sin plantillas vulnerables (ESC1‑ESC8)', how: 'Locksmith o PingCastle.', fix: 'Corregir plantillas y permisos; tratar la CA como tier 0.', sev: 'critica', only: 'gran' },
  { id: 'ad-krbtgt', t: 'Contraseña de krbtgt rotada en el último año', how: 'Get-ADUser krbtgt -Properties PasswordLastSet', fix: 'Rotación doble planificada con el script oficial de Microsoft.', sev: 'media' },
  { id: 'ad-ping', t: 'Puntuación de PingCastle revisada y plan de mejora', how: 'Ejecuta PingCastle --healthcheck y revisa las reglas de máxima puntuación.', fix: 'Plan trimestral de reducción de puntuación.', sev: 'media', only: 'gran' },
]},
{ t: '11. Detección y respuesta (SOC)', items: [
  { id: 'soc-tel', t: 'Telemetría suficiente: auditoría avanzada, línea de comandos, Sysmon/EDR en todos los equipos', how: 'Comprueba en una muestra que existen 4688 con línea de comandos y eventos del EDR.', fix: 'GPO de auditoría avanzada + EDR/Sysmon con reenvío al SIEM.', sev: 'alta' },
  { id: 'soc-ret', t: 'Retención de logs centralizada ≥ 12 meses e inmutable', how: 'Pregunta por la retención del SIEM y busca eventos de hace 6 meses.', fix: 'Almacenamiento de logs con retención y protección contra borrado.', sev: 'media' },
  { id: 'soc-cov', t: 'Cobertura ATT&CK medida y ejercicios purple team periódicos', how: 'Pide la matriz de cobertura y el último ejercicio.', fix: 'Purple team trimestral con informe de brechas.', sev: 'media', only: 'gran' },
  { id: 'soc-pb', t: 'Playbooks de respuesta probados (ransomware, BEC, fuga de datos)', how: 'Pide los playbooks y el último ejercicio de mesa.', fix: 'Redactar y ensayar al menos los tres playbooks principales.', sev: 'alta' },
  { id: 'soc-notif', t: 'Procedimiento de notificación NIS2/RGPD (24 h / 72 h) con contactos', how: '¿Quién notifica, a quién y con qué plantilla?', fix: 'Procedimiento documentado con plantillas y responsables.', sev: 'media' },
]},
{ t: '12. Cadena de suministro y desarrollo', items: [
  { id: 'sc-sbom', t: 'Inventario de software (SBOM) y escaneo de dependencias', how: 'Pide SBOM de las aplicaciones propias y resultados de SCA.', fix: 'Generar SBOM en CI (Syft) y escanear (Grype/Trivy).', sev: 'media', only: 'gran' },
  { id: 'sc-ci', t: 'CI/CD protegido: secretos fuera del código, ramas protegidas, revisión obligatoria', how: 'Revisa configuración del repositorio y del pipeline; gitleaks sobre el historial.', fix: 'Gestor de secretos, OIDC, protección de ramas y revisión por pares.', sev: 'alta' },
  { id: 'sc-prov', t: 'Proveedores críticos evaluados (cuestionario, certificaciones, cláusulas)', how: 'Pide el registro de proveedores TIC y su evaluación.', fix: 'Proceso de evaluación de terceros acorde a NIS2/DORA.', sev: 'media' },
]},
{ t: '13. Cloud y contenedores (avanzado)', items: [
  { id: 'cl2-cspm', t: 'CSPM continuo (Prowler, Defender for Cloud, Security Hub) con hallazgos gestionados', how: 'Pide el último informe y cuántos hallazgos críticos llevan > 30 días abiertos.', fix: 'CSPM continuo con responsables y plazos.', sev: 'alta' },
  { id: 'cl2-imds', t: 'IMDSv2 obligatorio y sin roles excesivos en instancias', how: 'Prowler: ec2_instance_imdsv2_enabled.', fix: 'Forzar IMDSv2 y revisar los roles de instancia.', sev: 'alta' },
  { id: 'cl2-k8s', t: 'Kubernetes con RBAC mínimo, Pod Security restringido y detección en runtime', how: 'kube-bench, revisión de ClusterRoleBindings, labels de PSA.', fix: 'PSA restricted, NetworkPolicies por defecto denegando y Falco.', sev: 'alta', only: 'gran' },
]}
);
