/* Escritorio 8 — laboratorio: máquinas virtuales (VirtualBox) + laboratorios Docker */
'use strict';

CL.views.lab = (root, sub) => {
  const c = CL.prog('lab').c;
  root.innerHTML = `<div class="area" style="--c:${c}"><aside class="side">
      <h2>🧪 Laboratorio N2</h2><div class="sub">CORP <code>192.168.57.0/24</code> · DMZ <code>192.168.58.0/24</code> · malware (red interna) · Docker en la red <code>ciberlab2</code>.</div>
      <div class="tools" style="border:0;margin-top:0;padding-top:0">
        <a href="#/lab" class="${!sub ? 'on' : ''}">📊 Estado</a>
        <a href="#/lab/vms" class="${sub === 'vms' ? 'on' : ''}">🖥 Máquinas virtuales</a>
        <a href="#/lab/nueva" class="${sub === 'nueva' ? 'on' : ''}">➕ Crear / importar VM</a>
        <a href="#/lab/docker" class="${sub === 'docker' ? 'on' : ''}">🐳 Laboratorios Docker</a>
        <a href="#/lab/descargas" class="${sub === 'descargas' ? 'on' : ''}">⬇ Qué descargar</a>
        <a href="#/lab/topologia" class="${sub === 'topologia' ? 'on' : ''}">🗺 Topología y buenas prácticas</a>
      </div>
      <div class="tools"><a href="#" data-open="terminal">⌨ Abrir terminal en ~/CiberLab2</a><a href="#" data-open="vbox">🧊 Abrir VirtualBox</a>
        <a href="#" data-open="folder" data-arg="isos">📁 Carpeta de ISOs</a><a href="#" data-open="wireshark">🦈 Wireshark</a></div>
    </aside><section class="content"><div class="wrap"></div></section></div>`;
  const wrap = CL.$('.wrap', root);
  const { prompt2, confirm2, choose } = CL;
  CL.$$('[data-open]', root).forEach(a => a.onclick = async e => {
    e.preventDefault();
    try { await CL.api('/api/open', { what: a.dataset.open, arg: a.dataset.arg || '' }); } catch (er) { CL.toast(er.message, true); }
  });
  const views = { '': status, vms, nueva, docker, descargas, topologia };
  (views[sub] || status)();

  clearInterval(CL.views.lab.timer);
  if (!sub || sub === 'vms' || sub === 'docker')
    CL.views.lab.timer = setInterval(() => { if (!document.hidden && location.hash.startsWith('#/lab')) (views[sub] || status)(true); else clearInterval(CL.views.lab.timer); }, 6000);

  async function status(refresh) {
    if (!refresh) wrap.innerHTML = '<h1>📊 Estado del laboratorio</h1><p class="mut">Cargando…</p>';
    let s, v, d;
    try { [s, v, d] = await Promise.all([CL.api('/api/sys'), CL.api('/api/vms').catch(e => ({ error: e.message, vms: [], net: {} })), CL.api('/api/labs')]); }
    catch (e) { wrap.innerHTML = `<p class="bad">${CL.esc(e.message)}</p>`; return; }
    const on = v.vms.filter(x => x.running);
    const lowDisk = s.disk.free_gb < 30;
    const ramOn = on.reduce((a, x) => a + x.ram, 0);
    wrap.innerHTML = `<h1>📊 Estado del laboratorio</h1>
      <div class="grid g4">
        <div class="stat" style="--c:var(--cyan)"><b>${on.length}/${v.vms.length}</b><span>VMs encendidas</span></div>
        <div class="stat" style="--c:var(--green)"><b>${d.labs?.filter(l => l.state === 'running').length || 0}</b><span>labs Docker activos</span></div>
        <div class="stat" style="--c:${lowDisk ? 'var(--red)' : 'var(--green)'}"><b>${s.disk.free_gb} GB</b><span>libres para VMs</span></div>
        <div class="stat" style="--c:var(--purple)"><b>${(s.host.ram_avail_mb / 1024).toFixed(1)} GB</b><span>RAM disponible · ${s.host.cpus} CPU</span></div>
      </div>
      ${lowDisk ? `<blockquote class="warn"><p>⚠ <b>Poco espacio:</b> quedan ${s.disk.free_gb} GB en <code>${CL.esc(s.machine_folder)}</code>. Kali ocupa ~20‑30 GB y un Windows Server ~25 GB.
        Opciones: libera espacio (<code>paru -Sc</code>, <code>docker system prune</code>, <code>journalctl --vacuum-size=200M</code>), usa un disco externo/SSD USB y cámbialo en
        VirtualBox → Archivo → Preferencias → General → «Carpeta predeterminada de máquinas», o usa los laboratorios Docker (mucho más ligeros).</p></blockquote>` : ''}
      <div class="box"><h3>🌐 Redes del laboratorio N2</h3>${netBox(v.net)}</div>
      <div class="grid g2">
        <div class="box"><h3>🖥 Máquinas virtuales</h3>${v.error ? `<p class="bad">${CL.esc(v.error)}</p>` : v.vms.length ? v.vms.map(x => `<div><span class="dot ${x.running ? 'on' : x.state === 'paused' || x.state === 'saved' ? 'mid' : ''}"></span>${CL.esc(x.name)} <span class="mut small">${x.ip || ''}</span>${x.bridged ? ' <span class="bad small">⚠ en modo puente</span>' : ''}</div>`).join('') : '<p class="mut">Aún no tienes VMs. Ve a «Crear / importar VM».</p>'}
          <p><a class="btn" href="#/lab/vms">Gestionar VMs</a></p>${ramOn ? `<p class="small mut">RAM asignada a VMs encendidas: ${(ramOn / 1024).toFixed(1)} GB</p>` : ''}</div>
        <div class="box"><h3>🐳 Laboratorios Docker</h3>${!d.available ? '<p class="bad">Docker no está instalado</p>' : !d.daemon ? `<p class="bad">El servicio Docker no responde: <code>sudo systemctl start docker</code></p>` :
          d.labs.map(l => `<div><span class="dot ${l.state === 'running' ? 'on' : l.state === 'descargando' ? 'mid' : ''}"></span>${CL.esc(l.name)} ${l.state === 'running' && l.url ? `<a class="small" href="${l.url}" target="_blank">${l.url}</a>` : ''}</div>`).join('')}
          <p><a class="btn" href="#/lab/docker">Gestionar laboratorios</a></p></div>
      </div>
      <div class="box"><h3>🔐 Comprobaciones de seguridad del laboratorio</h3><ul>
        <li>${v.net.exists ? '<span class="ok">✔</span> Redes CORP y DMZ creadas' : '<span class="warnc">●</span> Faltan redes por crear (botón «Crear redes N2»)'}</li>
        <li>${v.vms.some(x => x.bridged) ? '<span class="bad">✘</span> Hay VMs en modo <b>puente</b>: quedan expuestas a tu red real. Aíslalas.' : '<span class="ok">✔</span> Ninguna VM en modo puente'}</li>
        <li>${v.vms.filter(x => /remnux|flare|malw/i.test(x.name) && !x.nics.every(n => n.includes('cl2-malware'))).length ? '<span class="bad">✘</span> Una VM de análisis de malware no está solo en la red interna <code>cl2-malware</code>: apágala y aplica el perfil «Análisis de malware».' : '<span class="ok">✔</span> Las VMs de malware están en la red interna aislada'}</li>
        <li>${v.vms.filter(x => /dc0|srv0|ws0/i.test(x.name) && !x.isolated).length ? '<span class="warnc">●</span> Alguna VM del dominio tiene NAT: déjala solo en CORP salvo para activar/actualizar Windows.' : '<span class="ok">✔</span> El dominio no tiene salida directa a Internet'}</li>
        <li><span class="ok">✔</span> Los laboratorios Docker solo escuchan en <code>127.0.0.1</code> (nadie de tu red puede atacarlos)</li>
        <li>${s.vpn ? `<span class="warnc">●</span> VPN activa (${CL.esc(s.vpn)}): no afecta a la red host-only, pero recuerda que plataformas como HTB usan su propia VPN.` : '<span class="mut">·</span> Sin VPN activa'}</li>
      </ul></div>`;
    bindNet();
  }

  function netBox(n) {
    if (!n.available) return '<p class="bad">VirtualBox no está disponible.</p>';
    return `<table class="tbl"><thead><tr><th>Red</th><th>Segmento</th><th>Interfaz</th><th>Anfitrión</th><th>DHCP</th></tr></thead><tbody>
      ${n.nets.map(x => `<tr><td><span class="dot ${x.exists ? 'on' : ''}"></span><b>${CL.esc(x.label)}</b></td><td class="mono small">${CL.esc(x.cidr)}</td>
        <td class="mono small">${CL.esc(x.iface || '—')}</td><td class="mono small">${CL.esc(x.ip)}</td>
        <td class="small">${x.id === 'malware' ? CL.esc(x.range) : x.dhcp ? `<span class="ok">activo</span> ${CL.esc(x.range)}` : '<span class="warnc">no</span>'}</td></tr>`).join('')}</tbody></table>
      ${n.exists ? '<p class="small mut">El DC usa IP fija <code>192.168.57.10</code> (fuera del rango DHCP). La red de malware no toca tu Arch: REMnux hace de DNS/HTTP falso con INetSim.</p>'
        : '<button class="pri" id="mknet">Crear redes N2</button> <span class="small mut">Crea dos interfaces host-only (CORP y DMZ) con DHCP. No toca la vboxnet0 del N1.</span>'}`;
  }
  function bindNet() {
    const b = CL.$('#mknet', wrap);
    if (b) b.onclick = async () => { b.disabled = true; try { await CL.api('/api/net/setup', {}); CL.toast('Redes CORP y DMZ creadas'); status(); } catch (e) { CL.toast(e.message, true); b.disabled = false; } };
  }

  async function vms(refresh) {
    if (!refresh) wrap.innerHTML = '<h1>🖥 Máquinas virtuales</h1><p class="mut">Cargando…</p>';
    let r;
    try { r = await CL.api('/api/vms'); } catch (e) { wrap.innerHTML = `<h1>🖥 Máquinas virtuales</h1><p class="bad">${CL.esc(e.message)}</p>`; return; }
    if (refresh && document.activeElement?.closest?.('.wrap')) return;   // no repintar mientras escribes
    wrap.innerHTML = `<h1>🖥 Máquinas virtuales</h1>
      <div class="box">${netBox(r.net)}</div>
      ${r.vms.length ? `<table class="tbl"><thead><tr><th>VM</th><th>Red</th><th>IP lab</th><th>Snapshots</th><th style="text-align:right">Acciones</th></tr></thead><tbody>
      ${r.vms.map(v => {
        const off = ['poweroff', 'aborted', 'saved'].includes(v.state);
        return `<tr data-vm="${CL.esc(v.name)}"><td><span class="dot ${v.running ? 'on' : v.state === 'paused' || v.state === 'saved' ? 'mid' : ''}"></span><b>${CL.esc(v.name)}</b><br>
          <span class="small mut">${CL.esc(v.ostype)} · ${v.ram} MB · ${v.cpus} CPU · ${CL.esc(v.state)}</span></td>
          <td class="small">${v.nics.map(CL.esc).join('<br>') || '—'}${v.isolated ? '<br><span class="ok">aislada</span>' : ''}${v.bridged ? '<br><span class="bad">⚠ puente</span>' : ''}</td>
          <td class="mono small">${v.ip || '<span class="mut">—</span>'}</td>
          <td class="small">${v.snapshots.length ? v.snapshots.map(s => `<span class="chip">${CL.esc(s)}${s === v.current_snapshot ? ' ●' : ''}</span>`).join(' ') : '<span class="mut">ninguno</span>'}</td>
          <td style="text-align:right"><div class="row" style="justify-content:flex-end;gap:5px">
            ${off ? `<button class="sm pri" data-a="start">▶ Iniciar</button><button class="sm" data-a="headless" title="Sin ventana (servidores)">▶ Sin ventana</button>` :
              v.state === 'paused' ? `<button class="sm" data-a="resume">⏯ Reanudar</button>` :
              `<button class="sm" data-a="acpi">⏻ Apagar</button><button class="sm" data-a="pause">⏸</button><button class="sm red" data-a="poweroff" title="Desenchufar">✖</button>`}
            <button class="sm" data-a="snapshot">📸 Snapshot</button>
            ${off && v.snapshots.length ? `<button class="sm" data-a="restore">⟲ Restaurar</button>` : ''}
            ${off ? `<button class="sm" data-a="net" title="Cambiar las tarjetas de red (VM apagada)">🔌 Red…</button>` : ''}
          </div></td></tr>`;
      }).join('')}</tbody></table>` : '<p class="mut">No hay máquinas. <a href="#/lab/nueva">Crea o importa una →</a></p>'}
      <h2>Cómo trabajar con las VMs</h2>
      <ol><li><b>Haz un snapshot «limpio»</b> nada más instalar cada VM. Antes de cada práctica destructiva, otro. Si rompes algo: apaga → <b>Restaurar</b>.</li>
      <li>Usa <b>🔌 Red…</b> (con la VM apagada) para aplicar un perfil: <code>corp</code>, <code>dmz</code>, <code>atacante</code>, <code>firewall</code>, <code>gestion</code> (NAT + CORP) o <code>malware</code> (solo red interna).</li>
      <li>La IP aparece aquí cuando la VM obtiene dirección por DHCP. Desde Kali: <code>nmap -sn 192.168.57.0/24</code>.</li>
      <li>Para servidores sin escritorio usa «Sin ventana» y conéctate por SSH desde tu Arch: <code>ssh usuario@192.168.58.10x</code> (DMZ).</li></ol>`;
    bindNet();
    CL.$$('tr[data-vm] button', wrap).forEach(b => b.onclick = async () => {
      const name = b.closest('tr').dataset.vm, act = b.dataset.a;
      let arg = '';
      if (act === 'snapshot') { arg = prompt2('Nombre del snapshot', 'limpio-' + new Date().toISOString().slice(0, 10)); if (arg === null) return; }
      if (act === 'restore') {
        const v = r.vms.find(x => x.name === name);
        arg = await choose(`Restaurar «${name}» a…`, v.snapshots, v.current_snapshot);
        if (arg === null) return;
      }
      if (act === 'net') {
        arg = await choose(`Perfil de red para «${name}»`, Object.keys(r.net.profiles), '');
        if (arg === null) return;
      }
      if (act === 'poweroff' && !await confirm2(`¿Desenchufar «${name}»? Es como quitar el cable: se pierde lo no guardado.`)) return;
      b.disabled = true;
      try { await CL.api('/api/vm/action', { name, act, arg }); CL.toast(`${name}: ${b.textContent.trim()} ✓`); }
      catch (e) { CL.toast(e.message, true); }
      setTimeout(() => vms(), 800);
    });
  }

  async function nueva() {
    let r;
    try { r = await CL.api('/api/vms'); } catch (e) { wrap.innerHTML = `<p class="bad">${CL.esc(e.message)}</p>`; return; }
    const sys = await CL.api('/api/sys');
    wrap.innerHTML = `<h1>➕ Crear o importar una máquina virtual</h1>
      <p class="mut">Disco libre en <code>${CL.esc(sys.machine_folder)}</code>: <b class="${sys.disk.free_gb < 30 ? 'bad' : 'ok'}">${sys.disk.free_gb} GB</b> · los discos son dinámicos (crecen según se usan).</p>
      <div class="box"><h3>Crear desde ISO</h3>
        <div class="grid g2">
          <label class="f">Plantilla<select id="preset">${Object.entries(r.presets).map(([k, p]) => `<option value="${k}">${CL.esc(p.label)}</option>`).join('')}</select></label>
          <label class="f">Nombre<input id="name" placeholder="kali, dc01, web-objetivo…"></label>
          <label class="f">Ruta de la ISO (instalador)<input id="iso" placeholder="${CL.esc(sys.workspace)}/isos/kali-linux-2026.x-installer-amd64.iso"></label>
          <label class="f">…o disco existente (.vdi / .vmdk / .vhd) <input id="disk_path" placeholder="opcional: p. ej. Metasploitable.vmdk"></label>
          <label class="f">RAM (MB)<input id="ram" type="number" step="512"></label>
          <label class="f">CPUs<input id="cpus" type="number" min="1" max="${sys.host.cpus}"></label>
          <label class="f">Disco (GB)<input id="disk" type="number"></label>
          <div class="f small" id="netinfo" style="align-self:end"></div>
        </div>
        <div class="row" style="margin-top:12px"><button class="pri" id="create">Crear máquina</button><span class="small mut" id="cmsg"></span></div>
      </div>
      <div class="box"><h3>Importar appliance (.ova / .ovf) o registrar una VM existente (.vbox)</h3>
        <div class="grid g3"><label class="f">Ruta del archivo<input id="imp" placeholder="~/CiberLab2/isos/maquina.ova"></label>
          <label class="f">Nombre (opcional)<input id="impname"></label>
          <label class="f">Perfil de red<select id="imppreset">${Object.entries(r.net.profiles || {}).map(([k, x]) => `<option value="${k}">${CL.esc(x.label)}</option>`).join('')}</select></label></div>
        <div class="row" style="margin-top:12px"><button class="pri" id="import">Importar</button><span class="small mut" id="imsg"></span></div>
        <p class="small mut">Wazuh y Security Onion se distribuyen como OVA/ISO; REMnux como OVA. Importa y aplica el perfil adecuado.</p>
      </div>
      <h2>Receta: dominio CORP en 30 minutos</h2>
      ${CL.md(`1. Descarga la ISO de **Windows Server 2022 Evaluation** a \`~/CiberLab2/isos/\`.
2. Plantilla **DC01**, nombre \`DC01\`, ISO → **Crear**. Instala «Standard (Desktop Experience)».
3. Dentro de la VM, PowerShell como administrador:
\`\`\`
Rename-Computer -NewName DC01 -Restart
New-NetIPAddress -InterfaceAlias Ethernet -IPAddress 192.168.57.10 -PrefixLength 24
Set-DnsClientServerAddress -InterfaceAlias Ethernet -ServerAddresses 127.0.0.1
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName corp.lab -DomainNetbiosName CORP -InstallDns
\`\`\`
4. Snapshot **dc-recien-promocionado**. Después, WS01 (plantilla Windows 11) con DNS \`192.168.57.10\` y únela: \`Add-Computer -DomainName corp.lab -Restart\`.
5. Sigue la lección **Active Directory → Montar el dominio de prácticas** para usuarios, GPO de auditoría y Sysmon.`)}`;
    const P = r.presets;
    const fill = () => {
      const p = P[CL.$('#preset', wrap).value];
      CL.$('#ram', wrap).value = p.ram; CL.$('#cpus', wrap).value = p.cpus; CL.$('#disk', wrap).value = p.disk;
      CL.$('#netinfo', wrap).innerHTML = '🔌 Red: ' + CL.esc(r.net.profiles?.[p.net]?.label || p.net);
    };
    CL.$('#preset', wrap).onchange = fill; fill();
    CL.$('#create', wrap).onclick = async e => {
      const spec = Object.fromEntries(['preset', 'name', 'iso', 'disk_path', 'ram', 'cpus', 'disk'].map(k => [k, CL.$('#' + k, wrap).value.trim()]));
      if (!spec.name) return CL.toast('Ponle un nombre', true);
      if (!spec.iso && !spec.disk_path && !await confirm2('No has indicado ISO ni disco: se creará una VM vacía (podrás montar la ISO luego en VirtualBox). ¿Seguir?')) return;
      e.target.disabled = true; CL.$('#cmsg', wrap).textContent = 'Creando…';
      try { await CL.api('/api/vm/create', spec); CL.toast(`VM «${spec.name}» creada. Ahora inicia la instalación.`); location.hash = '#/lab/vms'; }
      catch (er) { CL.toast(er.message, true); CL.$('#cmsg', wrap).textContent = ''; e.target.disabled = false; }
    };
    CL.$('#import', wrap).onclick = async e => {
      const path = CL.$('#imp', wrap).value.trim().replace(/^~/, sys.workspace.replace(/\/CiberLab2$/, ''));
      if (!path) return CL.toast('Indica la ruta del archivo', true);
      e.target.disabled = true; CL.$('#imsg', wrap).textContent = 'Importando… (puede tardar varios minutos)';
      try { const x = await CL.api('/api/vm/import', { path, name: CL.$('#impname', wrap).value.trim(), preset: CL.$('#imppreset', wrap).value }); CL.toast('Importada: ' + x.imported.join(', ')); location.hash = '#/lab/vms'; }
      catch (er) { CL.toast(er.message, true); CL.$('#imsg', wrap).textContent = ''; e.target.disabled = false; }
    };
  }

  async function docker(refresh) {
    let d;
    try { d = await CL.api('/api/labs'); } catch (e) { wrap.innerHTML = `<p class="bad">${CL.esc(e.message)}</p>`; return; }
    if (refresh && CL.$('pre.logs', wrap)) return;
    wrap.innerHTML = `<h1>🐳 Laboratorios Docker</h1>
      <p class="mut">Aplicaciones vulnerables listas en segundos, publicadas <b>solo</b> en <code>127.0.0.1</code>. La primera vez se descarga la imagen (300‑800 MB).</p>
      ${!d.available ? '<p class="bad">Docker no está instalado: <code>sudo pacman -S docker && sudo systemctl enable --now docker</code></p>' :
        !d.daemon ? `<p class="bad">El servicio Docker no responde (${CL.esc(d.error || '')}): <code>sudo systemctl start docker</code></p>` :
        `<div class="cards">${d.labs.map(l => `<div class="card" style="--c:${l.state === 'running' ? 'var(--green)' : 'var(--line2)'}" data-l="${l.id}">
          <span class="desk"><span class="dot ${l.state === 'running' ? 'on' : l.state === 'descargando' ? 'mid' : l.error ? 'err' : ''}"></span>${CL.esc(l.state)}</span>
          <h3>${CL.esc(l.name)}</h3><p>${CL.esc(l.desc)}</p>
          <p class="small" style="margin-top:6px">🔑 ${CL.esc(l.login)}</p>
          <p class="small mono mut">puertos: ${l.ports.map(p => '127.0.0.1:' + p[0]).join(', ')} ${l.downloaded ? '' : '· sin descargar'}</p>
          ${l.error ? `<p class="small bad">${CL.esc(l.error)}</p>` : ''}
          <div class="row" style="margin-top:10px">
            ${l.state === 'running' ? `${l.url ? `<a class="btn" href="${l.url}" target="_blank">Abrir ↗</a>` : ''}<button class="sm" data-a="logs">Logs</button><button class="sm red" data-a="stop">Detener</button>`
              : l.state === 'descargando' ? '<span class="small warnc">Descargando / arrancando…</span>' : `<button class="sm pri" data-a="start">▶ Iniciar</button>`}
          </div></div>`).join('')}</div>`}
      <div id="logs"></div>
      <h2>Consejos</h2>
      ${CL.md(`- Los labs del N2 comparten la red Docker **ciberlab2**: desde ZAP o Jenkins se ven por nombre (\`http://ciberlab2-wrongsecrets:8080\`). Desde tu Arch, por \`127.0.0.1:PUERTO\`.
- **Splunk** necesita ~4 GB de RAM y 2‑3 minutos para arrancar. Sube los ficheros de la *Práctica de detección* (Settings → Add Data → Upload) e investiga con SPL.
- **Moto** emula AWS: configura \`export AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=eu-west-1\` y usa \`--endpoint-url http://127.0.0.1:8101\` en cada comando.
- **Detener** borra el contenedor: los datos de Splunk, Gitea o Jenkins se pierden. Es intencionado: cada práctica empieza limpia.
- Más laboratorios avanzados: [GOAD](https://github.com/Orange-Cyberdefense/GOAD) (Active Directory completo), [Kubernetes Goat](https://github.com/madhuakula/kubernetes-goat), [CloudGoat](https://github.com/RhinoSecurityLabs/cloudgoat), [crAPI](https://github.com/OWASP/crAPI), [Splunk BOTS](https://github.com/splunk/botsv3) (datasets de incidentes reales).`)}`;
    CL.$$('[data-l] button', wrap).forEach(b => b.onclick = async () => {
      const id = b.closest('[data-l]').dataset.l;
      if (b.dataset.a === 'logs') {
        try { const r = await CL.api('/api/labs/logs?id=' + id); CL.$('#logs', wrap).innerHTML = `<h2>Logs de ${CL.esc(id)}</h2>${CL.code(r.logs || '(vacío)', 'raw').replace('<pre>', '<pre class="logs">')}`; CL.$('#logs', wrap).scrollIntoView({ behavior: 'smooth' }); }
        catch (e) { CL.toast(e.message, true); }
        return;
      }
      b.disabled = true;
      try { await CL.api('/api/labs/' + b.dataset.a, { id }); CL.toast(b.dataset.a === 'start' ? 'Arrancando… la primera vez descarga la imagen' : 'Detenido'); }
      catch (e) { CL.toast(e.message, true); }
      setTimeout(() => docker(), 900);
    });
  }

  function descargas() {
    wrap.innerHTML = `<h1>⬇ Qué descargar para el laboratorio N2</h1>${CL.md(`Guarda todo en \`~/CiberLab2/isos/\` y verifica siempre la suma SHA‑256 con la publicada.

| Máquina | Papel | Dónde | Recursos |
|---|---|---|---|
| **Windows Server 2022 Evaluation** | DC01 y SRV01 (dominio corp.lab, ADCS, ficheros) | [Microsoft Evaluation Center](https://www.microsoft.com/es-es/evalcenter/evaluate-windows-server-2022) | 3‑4 GB · 60 GB |
| **Windows 11 Enterprise Evaluation** | WS01, puesto del dominio | [Microsoft Evaluation Center](https://www.microsoft.com/es-es/evalcenter/evaluate-windows-11-enterprise) | 4 GB · 64 GB |
| **Sysmon + configuración** | Telemetría detallada en Windows | [Sysinternals Sysmon](https://learn.microsoft.com/sysinternals/downloads/sysmon) · [sysmon-modular](https://github.com/olafhartong/sysmon-modular) | — |
| **Wazuh OVA** | SIEM/XDR (alternativa ligera a Splunk) | [documentation.wazuh.com](https://documentation.wazuh.com/current/deployment-options/virtual-machine/virtual-machine.html) | 6‑8 GB · 50 GB |
| **Security Onion 2.4** | NSM: Zeek, Suricata, Elastic | [securityonion.net](https://securityonion.net/) | 12 GB+ · 200 GB |
| **OPNsense** | Firewall entre WAN, CORP y DMZ | [opnsense.org/download](https://opnsense.org/download/) (imagen *dvd*) | 2 GB · 20 GB |
| **REMnux** | Análisis de malware (Linux) + INetSim | [docs.remnux.org](https://docs.remnux.org/install-distro/get-virtual-appliance) (OVA) | 4 GB · 60 GB |
| **FLARE-VM** | Análisis de malware (Windows) | [github.com/mandiant/flare-vm](https://github.com/mandiant/flare-vm) (se instala sobre un Windows 10 Eval) | 4 GB · 80 GB |
| **GOAD-Light** | Bosque AD de prácticas ya montado (alternativa a montarlo a mano) | [github.com/Orange-Cyberdefense/GOAD](https://github.com/Orange-Cyberdefense/GOAD) | 12‑16 GB RAM |

### Datasets para practicar sin montar nada
- [EVTX-ATTACK-SAMPLES](https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES): eventos de Windows de ataques reales, clasificados por técnica ATT&CK.
- [Splunk BOTS v3](https://github.com/splunk/botsv3): incidentes completos para cazar con SPL.
- [Security Datasets (Mordor)](https://securitydatasets.com): telemetría de técnicas emuladas.
- [MemLabs](https://github.com/stuxnet999/MemLabs) y [CyberDefenders](https://cyberdefenders.org): retos de forense de memoria y disco.
- [MalwareBazaar](https://bazaar.abuse.ch): muestras reales para estudio, **solo** dentro de la red de malware.

### Escenarios y RAM (tu equipo: ~15 GB)
| Escenario | Enciende | RAM |
|---|---|---|
| Dominio + detección | DC01 (3 GB) + WS01 (4 GB) + Splunk Docker (4 GB) | ~11 GB |
| Purple team | DC01 + WS01 + Kali (3 GB) | ~10 GB |
| Malware | REMnux (3 GB) + FLARE-VM (4 GB) | ~7 GB |
| Cloud / AppSec | Solo Docker (Moto, WrongSecrets, Gitea, ZAP) | ~4 GB |
| Red segmentada | OPNsense (1 GB) + web-dmz (2 GB) + Kali (3 GB) | ~6 GB |

Con el dominio y el SIEM a la vez, baja las VMs Windows a 3 GB y cierra el navegador pesado. Ampliar a 32 GB de RAM es la mejora que más rinde para el N2.`)}`;
  }

  function topologia() {
    wrap.innerHTML = `<h1>🗺 Topología del laboratorio N2</h1>
      <svg class="topo" viewBox="0 0 900 420" role="img" aria-label="Topología N2">
        <rect x="20" y="20" width="860" height="380" rx="16" fill="none" stroke="#1f2c3a"/>
        <text x="40" y="48" fill="#93a4b5" font-family="monospace" font-size="13">Tu Arch (anfitrión) · 192.168.57.1 / 192.168.58.1</text>
        <rect x="40" y="70" width="160" height="56" rx="10" fill="#111821" stroke="#22d3ee"/><text x="120" y="96" text-anchor="middle" fill="#cfd9e3" font-size="14">Internet (NAT)</text><text x="120" y="113" text-anchor="middle" fill="#61748a" font-size="11">solo WAN / atacante / gestión</text>
        <rect x="330" y="70" width="200" height="56" rx="10" fill="#111821" stroke="#f5b700"/><text x="430" y="96" text-anchor="middle" fill="#cfd9e3" font-size="14">OPNsense</text><text x="430" y="113" text-anchor="middle" fill="#61748a" font-size="11">WAN · CORP .57.254 · DMZ .58.254</text>
        <rect x="60" y="180" width="380" height="40" rx="20" fill="#0d1218" stroke="#3b82f6"/><text x="250" y="205" text-anchor="middle" fill="#cfd9e3" font-size="13">CORP 192.168.57.0/24 · corp.lab</text>
        <rect x="500" y="180" width="340" height="40" rx="20" fill="#0d1218" stroke="#fb923c"/><text x="670" y="205" text-anchor="middle" fill="#cfd9e3" font-size="13">DMZ 192.168.58.0/24</text>
        <rect x="50" y="250" width="120" height="56" rx="10" fill="#111821" stroke="#f5b700"/><text x="110" y="275" text-anchor="middle" fill="#cfd9e3" font-size="13">DC01</text><text x="110" y="292" text-anchor="middle" fill="#61748a" font-size="11">.57.10 AD/DNS</text>
        <rect x="180" y="250" width="120" height="56" rx="10" fill="#111821" stroke="#f5b700"/><text x="240" y="275" text-anchor="middle" fill="#cfd9e3" font-size="13">SRV01 · WS01</text><text x="240" y="292" text-anchor="middle" fill="#61748a" font-size="11">DHCP .101+</text>
        <rect x="310" y="250" width="130" height="56" rx="10" fill="#111821" stroke="#3b82f6"/><text x="375" y="275" text-anchor="middle" fill="#cfd9e3" font-size="13">Wazuh / SO</text><text x="375" y="292" text-anchor="middle" fill="#61748a" font-size="11">NAT + CORP</text>
        <rect x="520" y="250" width="140" height="56" rx="10" fill="#111821" stroke="#fb923c"/><text x="590" y="275" text-anchor="middle" fill="#cfd9e3" font-size="13">web-dmz</text><text x="590" y="292" text-anchor="middle" fill="#61748a" font-size="11">nginx + app</text>
        <rect x="690" y="250" width="140" height="56" rx="10" fill="#111821" stroke="#ff3b5c"/><text x="760" y="275" text-anchor="middle" fill="#cfd9e3" font-size="13">Kali</text><text x="760" y="292" text-anchor="middle" fill="#61748a" font-size="11">NAT + CORP + DMZ</text>
        <rect x="560" y="70" width="290" height="56" rx="10" fill="#111821" stroke="#22d3ee" stroke-dasharray="5 4"/><text x="705" y="96" text-anchor="middle" fill="#cfd9e3" font-size="13">Red interna cl2-malware</text><text x="705" y="113" text-anchor="middle" fill="#61748a" font-size="11">REMnux ⇄ FLARE-VM · sin anfitrión</text>
        <rect x="50" y="335" width="790" height="44" rx="10" fill="#111821" stroke="#ff2e63"/><text x="445" y="362" text-anchor="middle" fill="#cfd9e3" font-size="13">Docker · red ciberlab2 · 127.0.0.1:8100‑8109 (Splunk, Moto, WrongSecrets, CyberChef, MobSF, Jenkins, Gitea, ZAP)</text>
        <path d="M200 98 L330 98" stroke="#22d3ee" stroke-dasharray="5 4"/><path d="M400 126 L300 180" stroke="#61748a"/><path d="M460 126 L620 180" stroke="#61748a"/>
        <path d="M110 220 L110 250" stroke="#61748a"/><path d="M240 220 L240 250" stroke="#61748a"/><path d="M375 220 L375 250" stroke="#61748a"/><path d="M590 220 L590 250" stroke="#61748a"/><path d="M760 220 L760 250" stroke="#61748a"/>
      </svg>
      ${CL.md(`### Reglas del laboratorio N2
1. **Segmentación real.** Lo de la DMZ no habla con CORP salvo lo que permita OPNsense. Practica reglas de firewall y compruébalas con \`nmap\` desde cada lado.
2. **El dominio no navega.** DC01/WS01 solo en CORP. Para activar o actualizar Windows, aplica temporalmente el perfil *gestion* y vuelve a *corp*.
3. **Malware solo en \`cl2-malware\`.** Sin NAT, sin host-only, sin carpetas compartidas, sin portapapeles. REMnux responde DNS/HTTP con INetSim. Snapshot limpio antes de cada muestra y **restaurar siempre** al terminar.
4. **Telemetría primero.** Antes de emular una técnica, comprueba que el SIEM recibe eventos; si no lo ves, no sabes si lo detectarías.
5. **Credenciales del laboratorio, solo del laboratorio.** Nunca reutilices contraseñas reales.

### Plan de direcciones
| Equipo | IP | Notas |
|---|---|---|
| DC01 | 192.168.57.10 | AD DS y DNS |
| OPNsense | .57.254 / .58.254 | puerta de enlace de CORP y DMZ |
| Wazuh / Splunk | .57.20 o DHCP | recolector de logs |
| WS01, SRV01 | DHCP .57.101‑199 | SRV01: ficheros, SQL, ADCS |
| web-dmz | DHCP .58.101‑199 | |
| REMnux | 10.66.66.1 (estática) | DNS/HTTP falso para FLARE-VM (10.66.66.2) |`)}`;
  }

};
