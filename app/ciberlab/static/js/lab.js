/* Escritorio 8 — laboratorio: máquinas virtuales (VirtualBox) + laboratorios Docker */
'use strict';

CL.views.lab = (root, sub) => {
  const c = CL.prog('lab').c;
  root.innerHTML = `<div class="area" style="--c:${c}"><aside class="side">
      <h2>🧪 Laboratorio</h2><div class="sub">Todo aislado en la red <code>192.168.56.0/24</code> o en <code>127.0.0.1</code>.</div>
      <div class="tools" style="border:0;margin-top:0;padding-top:0">
        <a href="#/lab" class="${!sub ? 'on' : ''}">📊 Estado</a>
        <a href="#/lab/vms" class="${sub === 'vms' ? 'on' : ''}">🖥 Máquinas virtuales</a>
        <a href="#/lab/nueva" class="${sub === 'nueva' ? 'on' : ''}">➕ Crear / importar VM</a>
        <a href="#/lab/docker" class="${sub === 'docker' ? 'on' : ''}">🐳 Laboratorios Docker</a>
        <a href="#/lab/descargas" class="${sub === 'descargas' ? 'on' : ''}">⬇ Qué descargar</a>
        <a href="#/lab/topologia" class="${sub === 'topologia' ? 'on' : ''}">🗺 Topología y buenas prácticas</a>
      </div>
      <div class="tools"><a href="#" data-open="terminal">⌨ Abrir terminal en ~/CiberLab</a><a href="#" data-open="vbox">🧊 Abrir VirtualBox</a>
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
      <div class="box"><h3>🌐 Red de laboratorio aislada</h3>${netBox(v.net)}</div>
      <div class="grid g2">
        <div class="box"><h3>🖥 Máquinas virtuales</h3>${v.error ? `<p class="bad">${CL.esc(v.error)}</p>` : v.vms.length ? v.vms.map(x => `<div><span class="dot ${x.running ? 'on' : x.state === 'paused' || x.state === 'saved' ? 'mid' : ''}"></span>${CL.esc(x.name)} <span class="mut small">${x.ip || ''}</span>${x.bridged ? ' <span class="bad small">⚠ en modo puente</span>' : ''}</div>`).join('') : '<p class="mut">Aún no tienes VMs. Ve a «Crear / importar VM».</p>'}
          <p><a class="btn" href="#/lab/vms">Gestionar VMs</a></p>${ramOn ? `<p class="small mut">RAM asignada a VMs encendidas: ${(ramOn / 1024).toFixed(1)} GB</p>` : ''}</div>
        <div class="box"><h3>🐳 Laboratorios Docker</h3>${!d.available ? '<p class="bad">Docker no está instalado</p>' : !d.daemon ? `<p class="bad">El servicio Docker no responde: <code>sudo systemctl start docker</code></p>` :
          d.labs.map(l => `<div><span class="dot ${l.state === 'running' ? 'on' : l.state === 'descargando' ? 'mid' : ''}"></span>${CL.esc(l.name)} ${l.state === 'running' && l.url ? `<a class="small" href="${l.url}" target="_blank">${l.url}</a>` : ''}</div>`).join('')}
          <p><a class="btn" href="#/lab/docker">Gestionar laboratorios</a></p></div>
      </div>
      <div class="box"><h3>🔐 Comprobaciones de seguridad del laboratorio</h3><ul>
        <li>${v.net.exists ? '<span class="ok">✔</span> Red host-only creada' : '<span class="warnc">●</span> Red host-only sin crear'}</li>
        <li>${v.vms.some(x => x.bridged) ? '<span class="bad">✘</span> Hay VMs en modo <b>puente</b>: quedan expuestas a tu red real. Aíslalas.' : '<span class="ok">✔</span> Ninguna VM en modo puente'}</li>
        <li>${v.vms.filter(x => /ms2|metasploit|vuln|dvwa/i.test(x.name) && !x.isolated).length ? '<span class="warnc">●</span> Alguna VM vulnerable tiene NAT/Internet: pulsa «Aislar» en Máquinas virtuales (con la VM apagada).' : '<span class="ok">✔</span> Las VMs vulnerables están aisladas'}</li>
        <li><span class="ok">✔</span> Los laboratorios Docker solo escuchan en <code>127.0.0.1</code> (nadie de tu red puede atacarlos)</li>
        <li>${s.vpn ? `<span class="warnc">●</span> VPN activa (${CL.esc(s.vpn)}): no afecta a la red host-only, pero recuerda que plataformas como HTB usan su propia VPN.` : '<span class="mut">·</span> Sin VPN activa'}</li>
      </ul></div>`;
    bindNet();
  }

  function netBox(n) {
    if (!n.available) return '<p class="bad">VirtualBox no está disponible.</p>';
    return n.exists
      ? `<p><span class="dot on"></span><b>${n.iface}</b> · anfitrión <code>${n.ip || '192.168.56.1'}</code> · DHCP ${n.dhcp ? '<span class="ok">activo</span> (192.168.56.101‑254)' : '<span class="warnc">desactivado</span>'}</p>
         <p class="small mut">Las VMs objetivo usan <b>solo</b> esta red (no tienen Internet ni ven tu LAN). Kali usa NAT (Internet para actualizar) + esta red (para atacar).</p>`
      : `<p><span class="dot"></span>La red <b>vboxnet0</b> no existe todavía.</p><button class="pri" id="mknet">Crear red de laboratorio</button>
         <p class="small mut">Crea una interfaz host-only 192.168.56.1/24 con DHCP. Es una red privada entre tu Arch y las VMs, invisible para tu router.</p>`;
  }
  function bindNet() {
    const b = CL.$('#mknet', wrap);
    if (b) b.onclick = async () => { b.disabled = true; try { await CL.api('/api/net/setup', {}); CL.toast('Red de laboratorio creada'); status(); } catch (e) { CL.toast(e.message, true); b.disabled = false; } };
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
            ${off && !v.isolated ? `<button class="sm" data-a="isolate" title="Solo red de laboratorio, sin Internet">🔒 Aislar</button>` : ''}
            ${off && v.isolated ? `<button class="sm" data-a="attacker" title="NAT + red de laboratorio">🌐 Modo atacante</button>` : ''}
          </div></td></tr>`;
      }).join('')}</tbody></table>` : '<p class="mut">No hay máquinas. <a href="#/lab/nueva">Crea o importa una →</a></p>'}
      <h2>Cómo trabajar con las VMs</h2>
      <ol><li><b>Haz un snapshot «limpio»</b> nada más instalar cada VM. Antes de cada práctica destructiva, otro. Si rompes algo: apaga → <b>Restaurar</b>.</li>
      <li>Las VMs <b>objetivo</b> (Metasploitable, VulnHub, Windows vulnerables) deben estar <b>aisladas</b>: nunca con NAT ni en modo puente.</li>
      <li>La IP de cada VM aparece aquí cuando obtiene dirección por DHCP en la red de laboratorio. Desde Kali: <code>sudo netdiscover -r 192.168.56.0/24</code> o <code>nmap -sn 192.168.56.0/24</code>.</li>
      <li>Para servidores sin escritorio usa «Sin ventana» y conéctate por SSH desde tu Arch: <code>ssh usuario@192.168.56.10x</code>.</li></ol>`;
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
        <div class="grid g3"><label class="f">Ruta del archivo<input id="imp" placeholder="~/CiberLab/isos/maquina.ova"></label>
          <label class="f">Nombre (opcional)<input id="impname"></label>
          <label class="f">Tipo de red<select id="imppreset"><option value="vulnhub">Objetivo (aislada)</option><option value="kali">Atacante (NAT + lab)</option></select></label></div>
        <div class="row" style="margin-top:12px"><button class="pri" id="import">Importar</button><span class="small mut" id="imsg"></span></div>
        <p class="small mut">Kali ofrece imágenes ya hechas para VirtualBox (.7z con .vbox + .vdi): descomprime con <code>7z x</code> en tu carpeta de VMs y regístrala con la ruta del <code>.vbox</code>. Usuario/contraseña: kali / kali.</p>
      </div>
      <h2>Receta: Metasploitable 2 (la primera VM objetivo)</h2>
      ${CL.md(`1. Descárgala de SourceForge (\`metasploitable-linux-2.0.0.zip\`) a \`~/CiberLab/isos/\` y descomprime: \`unzip metasploitable-linux-2.0.0.zip\`.
2. Aquí arriba: plantilla **Máquina vulnerable**, nombre \`ms2\`, en *disco existente* pon la ruta a \`Metasploitable.vmdk\`, RAM 1024 → **Crear**.
3. Iníciala, entra con \`msfadmin / msfadmin\` y anota su IP con \`ip a\` (192.168.56.10x).
4. Apágala y haz un **snapshot «limpio»**.
> ⚠ Metasploitable es vulnerable a propósito: no la conectes nunca a Internet ni en modo puente.`)}`;
    const P = r.presets;
    const fill = () => {
      const p = P[CL.$('#preset', wrap).value];
      CL.$('#ram', wrap).value = p.ram; CL.$('#cpus', wrap).value = p.cpus; CL.$('#disk', wrap).value = p.disk;
      CL.$('#netinfo', wrap).innerHTML = p.net === 'atacante' ? '🌐 Red: NAT (Internet) + laboratorio' : '🔒 Red: solo laboratorio (aislada)';
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
      const path = CL.$('#imp', wrap).value.trim().replace(/^~/, sys.workspace.replace(/\/CiberLab$/, ''));
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
      ${CL.md(`- Para interceptar el tráfico con **Burp Suite** o **ZAP**, configura el proxy 127.0.0.1:8080 en el navegador del laboratorio (o usa el navegador integrado de Burp). WebGoat usa el 8083 para no chocar con Burp.
- **Reiniciar un lab** = Detener + Iniciar: el contenedor se recrea limpio (pierdes lo que hiciste dentro, que es justo lo que quieres tras romperlo).
- Puedes ver lo que hace el atacante (tú) desde el lado defensor con el botón **Logs**: practica Blue Team con tus propios ataques.
- Más laboratorios: [Vulhub](https://github.com/vulhub/vulhub) (cientos de CVE reales con docker compose), [crAPI](https://github.com/OWASP/crAPI), [Hackazon](https://github.com/rapid7/hackazon).`)}`;
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
    wrap.innerHTML = `<h1>⬇ Qué descargar para tu laboratorio</h1>${CL.md(`Guarda todo en \`~/CiberLab/isos/\`. Descarga **solo de las webs oficiales** y verifica la suma SHA‑256 (\`sha256sum fichero.iso\`) con la publicada: es la primera lección de seguridad.

| Máquina | Para qué | Dónde | Recursos |
|---|---|---|---|
| **Kali Linux** (VirtualBox prebuilt) | Atacante principal | [kali.org/get-kali → Virtual Machines](https://www.kali.org/get-kali/#kali-virtual-machines) | 4 GB RAM · 25 GB |
| **Metasploitable 2** | Primer objetivo Linux (decenas de servicios vulnerables) | [SourceForge: metasploitable](https://sourceforge.net/projects/metasploitable/) | 1 GB · 8 GB |
| **Metasploitable 3** | Objetivo Windows/Ubuntu moderno | [github.com/rapid7/metasploitable3](https://github.com/rapid7/metasploitable3) | 4 GB · 40 GB |
| **Windows Server 2022 Evaluation** | Controlador de dominio (Active Directory) | [Microsoft Evaluation Center](https://www.microsoft.com/es-es/evalcenter/evaluate-windows-server-2022) — 180 días gratis | 4 GB · 40 GB |
| **Windows 10/11 Enterprise Evaluation** | Cliente del dominio / víctima de phishing | [Microsoft Evaluation Center](https://www.microsoft.com/es-es/evalcenter/) | 4 GB · 40 GB |
| **Ubuntu Server LTS** | Servidor a bastionar, objetivo, Blue Team | [ubuntu.com/download/server](https://ubuntu.com/download/server) | 2 GB · 20 GB |
| **Wazuh OVA** | SIEM / XDR gratuito para Blue Team | [documentation.wazuh.com → Virtual Machine (OVA)](https://documentation.wazuh.com/current/deployment-options/virtual-machine/virtual-machine.html) | 8 GB · 50 GB |
| **Security Onion** | Monitorización de red (Zeek, Suricata, Elastic) | [securityonion.net](https://securityonion.net/) | 12 GB+ · 200 GB |
| **VulnHub** | Cientos de máquinas tipo CTF de todos los niveles | [vulnhub.com](https://www.vulnhub.com/) — empieza por *Kioptrix 1*, *Mr-Robot*, *DC-1* | 1‑2 GB |
| **GOAD (Game of Active Directory)** | Laboratorio AD completo y vulnerable | [github.com/Orange-Cyberdefense/GOAD](https://github.com/Orange-Cyberdefense/GOAD) | 16‑24 GB RAM (versión *GOAD-Light* o *Mini* para tu equipo) |

### Laboratorio recomendado para tu equipo (${'16 CPU · ~15 GB RAM'})
- **Básico (siempre):** Kali (4 GB) + Metasploitable 2 (1 GB) + labs Docker → ~6 GB.
- **Active Directory:** Kali (3 GB) + Windows Server DC (3 GB) + 1 cliente Windows (3 GB) → ~9 GB. Cierra navegadores pesados.
- **Blue Team:** Wazuh (6 GB) + Ubuntu Server con agente (1 GB) + Kali para atacar (3 GB).

No enciendas todo a la vez: enciende solo el escenario que vayas a practicar.

### Plataformas online (sin VMs, legales y muy recomendables)
- [TryHackMe](https://tryhackme.com) — rutas guiadas para empezar (Pre Security, Jr Penetration Tester, SOC Level 1).
- [Hack The Box](https://www.hackthebox.com) + [HTB Academy](https://academy.hackthebox.com) — máquinas reales; nivel intermedio/avanzado.
- [PortSwigger Web Security Academy](https://portswigger.net/web-security) — la mejor formación gratuita de hacking web.
- [OverTheWire Bandit](https://overthewire.org/wargames/bandit/) — Linux y terminal desde cero, jugando.
- [Blue Team Labs Online](https://blueteamlabs.online) / [CyberDefenders](https://cyberdefenders.org) — forense y análisis de incidentes.
- [flAWS](http://flaws.cloud) / [flAWS2](http://flaws2.cloud) / [CloudGoat](https://github.com/RhinoSecurityLabs/cloudgoat) — seguridad en AWS.`)}`;
  }

  function topologia() {
    wrap.innerHTML = `<h1>🗺 Topología del laboratorio</h1>
      <svg class="topo" viewBox="0 0 900 360" role="img" aria-label="Topología">
        <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#61748a"/></marker></defs>
        <rect x="20" y="20" width="860" height="320" rx="16" fill="none" stroke="#1f2c3a"/>
        <text x="40" y="48" fill="#93a4b5" font-family="monospace" font-size="13">Tu Arch (anfitrión)</text>
        <rect x="40" y="70" width="170" height="70" rx="10" fill="#111821" stroke="#22d3ee"/><text x="125" y="100" text-anchor="middle" fill="#cfd9e3" font-size="14">Internet / tu router</text><text x="125" y="120" text-anchor="middle" fill="#61748a" font-size="11">red real (NO se ataca)</text>
        <rect x="40" y="220" width="170" height="80" rx="10" fill="#111821" stroke="#00fa5c"/><text x="125" y="248" text-anchor="middle" fill="#cfd9e3" font-size="14">Docker labs</text><text x="125" y="268" text-anchor="middle" fill="#61748a" font-size="11">127.0.0.1:8081‑8086</text><text x="125" y="285" text-anchor="middle" fill="#61748a" font-size="11">solo tu equipo</text>
        <rect x="290" y="150" width="320" height="44" rx="22" fill="#0d1218" stroke="#a855f7"/><text x="450" y="177" text-anchor="middle" fill="#cfd9e3" font-size="14">vboxnet0 · 192.168.56.0/24 (host-only)</text>
        <rect x="300" y="60" width="150" height="60" rx="10" fill="#111821" stroke="#ff3b5c"/><text x="375" y="88" text-anchor="middle" fill="#cfd9e3" font-size="14">Kali (atacante)</text><text x="375" y="106" text-anchor="middle" fill="#61748a" font-size="11">NAT + .56.x</text>
        <rect x="660" y="60" width="200" height="56" rx="10" fill="#111821" stroke="#f5b700"/><text x="760" y="86" text-anchor="middle" fill="#cfd9e3" font-size="14">Metasploitable / VulnHub</text><text x="760" y="104" text-anchor="middle" fill="#61748a" font-size="11">solo host-only</text>
        <rect x="660" y="140" width="200" height="56" rx="10" fill="#111821" stroke="#f5b700"/><text x="760" y="166" text-anchor="middle" fill="#cfd9e3" font-size="14">Windows DC + cliente</text><text x="760" y="184" text-anchor="middle" fill="#61748a" font-size="11">Active Directory</text>
        <rect x="660" y="220" width="200" height="56" rx="10" fill="#111821" stroke="#3b82f6"/><text x="760" y="246" text-anchor="middle" fill="#cfd9e3" font-size="14">Wazuh / Ubuntu Server</text><text x="760" y="264" text-anchor="middle" fill="#61748a" font-size="11">Blue Team · logs</text>
        <path d="M210 105 L300 95" stroke="#22d3ee" stroke-dasharray="5 4" marker-end="url(#ar)"/>
        <path d="M375 120 L400 150" stroke="#61748a" marker-end="url(#ar)"/>
        <path d="M610 172 L660 88" stroke="#61748a" marker-end="url(#ar)"/><path d="M610 172 L660 168" stroke="#61748a" marker-end="url(#ar)"/><path d="M610 172 L660 248" stroke="#61748a" marker-end="url(#ar)"/>
        <text x="225" y="88" fill="#61748a" font-size="11">NAT (solo Kali)</text>
      </svg>
      ${CL.md(`### Reglas de oro del laboratorio
1. **Las máquinas vulnerables nunca tienen Internet** ni están en modo puente. Si algo sale mal (un gusano, una reverse shell olvidada) no sale de la red host-only.
2. **Snapshot antes de cada práctica.** Restaurar es más rápido que reparar.
3. **Nada de datos reales** dentro del laboratorio: ni tus contraseñas, ni ficheros personales, ni cuentas de empresa.
4. **Portapapeles y arrastrar‑soltar desactivados** en las VMs objetivo (las VMs creadas desde CiberLab ya vienen así).
5. **Kali actualizada** y con su propio usuario no root: \`sudo apt update && sudo apt full-upgrade -y\`.
6. Cuando practiques contra una **auditoría real**, hazlo desde una VM dedicada a ese cliente (o restaura un snapshot limpio) y guarda las evidencias cifradas.
7. Si usas TryHackMe/HTB, su VPN (\`sudo openvpn fichero.ovpn\`) se conecta desde **Kali**, no desde tu Arch.

### Escenarios típicos
| Escenario | Enciende | RAM aprox. |
|---|---|---|
| Pentesting Linux básico | Kali + Metasploitable 2 | 5 GB |
| Hacking web | Solo Docker (DVWA/Juice Shop) + Burp en tu Arch o Kali | 2 GB |
| Active Directory | Kali + Windows Server (DC) + Windows 10 | 10 GB |
| Blue Team | Wazuh + Ubuntu Server + Kali (para generar ataques) | 10 GB |
| WiFi | Tu Arch/Kali con adaptador USB en modo monitor + **tu** router de pruebas | — |`)}`;
  }

};
