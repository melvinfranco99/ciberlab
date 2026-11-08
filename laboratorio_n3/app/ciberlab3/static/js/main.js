/* CiberLab N3 — arranque, navegación, búsqueda y panel de inicio */
'use strict';

const PKG = { // herramienta → paquete de los repos oficiales de Arch (resto: BlackArch/AUR/pipx)
  nmap: 'nmap', masscan: 'masscan', rustscan: 'rustscan', ffuf: 'ffuf', feroxbuster: 'feroxbuster', nuclei: 'nuclei',
  sqlmap: 'sqlmap', hydra: 'hydra', hashcat: 'hashcat', john: 'john', zaproxy: 'zaproxy', ldapsearch: 'openldap',
  responder: 'responder', proxychains: 'proxychains-ng', wireshark: 'wireshark-qt', tcpdump: 'tcpdump',
  python3: 'python', jq: 'jq', docker: 'docker', VBoxManage: 'virtualbox', openssl: 'openssl', age: 'age', gpg: 'gnupg',
};

function nav(cur) {
  CL.$('#nav').innerHTML = CL.PROGRAMS.map(p =>
    `<a href="#/${p.id}" style="--c:${p.c}" class="${p.id === cur ? 'on' : ''}" title="Escritorio ${p.desk}">${p.emo} ${p.name}</a>`).join('');
}

function route() {
  const [a = 'inicio', b = '', c = ''] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const app = CL.$('#app');
  nav(a);
  document.title = 'CiberLab N3 · ' + (CL.prog(a)?.name || a);
  if (a === 'tecnicas') return CL.views.vulns(app, b);
  if (a === 'glosario' || a === 'comandos' || a === 'herramientas') return CL.views.glosario(app, a, b);
  if (a === 'lab') return CL.views.lab(app, b);
  if (a === 'auditorias') return CL.views.audits(app, b, c);
  if (CL.areas[a]) return CL.renderArea(app, a, b);
  location.hash = '#/inicio';
}

/* ---------------- búsqueda global */
function searchIndex() {
  const idx = [];
  for (const l of CL.lessons()) {
    const a = CL.areas[l.area];
    idx.push({ t: l.t, where: `${a.title} · ${a.levels[l.level]?.name || CL.LEVELS[l.level]}`, href: `#/${l.area}/${l.id}`,
      txt: [l.t, l.theory, (l.steps || []).map(s => s.join(' ')).join(' '), l.defense, (l.obj || []).join(' ')].join(' ').toLowerCase() });
  }
  for (const v of CL.vulns)
    idx.push({ t: '🧬 ' + v.name, where: `Técnica ATT&CK · ${v.cat}`, href: `#/tecnicas/${v.id}`,
      txt: [v.name, v.cat, v.sum, v.what, v.detect, v.defense, v.cwe].join(' ').toLowerCase() });
  for (const g of CL.glossary || [])
    idx.push({ t: '📖 ' + g.t, where: 'Glosario · ' + g.cat, href: '#/glosario/' + encodeURIComponent(g.t),
      txt: [g.t, g.d, g.cat].join(' ').toLowerCase() });
  for (const c of CL.commands || [])
    idx.push({ t: '⌨️ ' + c.c, where: `Comando · ${CL.CMD_LEVELS[c.lvl]}`, href: '#/comandos/' + encodeURIComponent(c.c),
      txt: [c.c, c.what, c.why, c.ex].join(' ').toLowerCase() });
  for (const h of CL.tools || [])
    idx.push({ t: '🧰 ' + h.t, where: `Herramienta · ${h.cat}`, href: '#/herramientas/' + encodeURIComponent(h.t),
      txt: [h.t, h.what, h.why, h.ex, h.cat, h.pkg].join(' ').toLowerCase() });
  return idx;
}
function setupSearch() {
  const q = CL.$('#q'), res = CL.$('#results');
  let idx = null, sel = 0;
  const run = () => {
    idx = idx || searchIndex();
    const terms = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) { res.classList.remove('show'); return; }
    const hits = idx.map(x => {
      let s = 0;
      for (const t of terms) {
        if (!x.txt.includes(t)) return null;
        s += x.t.toLowerCase().includes(t) ? 10 : 1;
      }
      return [s, x];
    }).filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 14).map(h => h[1]);
    sel = 0;
    res.innerHTML = hits.length ? hits.map((h, i) => `<a href="${h.href}" class="${i ? '' : 'sel'}">${CL.esc(h.t)}<br><small>${CL.esc(h.where)}</small></a>`).join('')
      : '<a>Sin resultados</a>';
    res.classList.add('show');
  };
  q.addEventListener('input', CL.debounce(run, 120));
  q.addEventListener('keydown', e => {
    const items = CL.$$('a[href]', res);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((x, i) => x.classList.toggle('sel', i === sel));
    } else if (e.key === 'Enter' && items[sel]) { location.hash = items[sel].getAttribute('href'); q.blur(); }
    else if (e.key === 'Escape') q.blur();
  });
  q.addEventListener('blur', () => setTimeout(() => res.classList.remove('show'), 180));
  q.addEventListener('focus', () => q.value && run());
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); q.select(); }
  });
}

/* ---------------- inicio (escritorio 1) */
CL.homeView = async (wrap) => {
  const all = CL.lessons();
  const done = all.filter(l => CL.state.done[l.id]).length;
  const nextL = all.find(l => !CL.state.done[l.id] && l.level === 0) || all.find(l => !CL.state.done[l.id]);
  const desc = { inicio: 'Metodología de Red Team, alcance y reglas de enfrentamiento, montaje del laboratorio ofensivo.',
    recon: 'OSINT y huella externa, enumeración de superficie y escaneo activo con criterio y sigilo.',
    tecnicas: 'Catálogo de técnicas ATT&CK: qué hacen, qué dejan en los logs y cómo se detectan y mitigan.',
    acceso: 'Explotación de servicios, password spraying y acceso inicial (siempre autorizado).',
    privesc: 'Escalada local en Linux (SUID, sudo, cron) y Windows (tokens, servicios, credenciales).',
    adataque: 'BloodHound, Kerberoasting, AS-REP, delegación y rutas hasta Domain Admin en el laboratorio.',
    postexp: 'Command & Control, movimiento lateral, recolección de credenciales e impacto reversible.',
    evasion: 'LOLBins, firmas vs. comportamiento y OPSEC — con el foco en cómo se detecta cada cosa.',
    webexp: 'SSRF, SSTI y deserialización insegura: cadenas de fallos hasta RCE en labs creados para ello.',
    nube: 'Ofensiva en AWS (IAM, metadatos) y Kubernetes (RBAC, tokens, pods privilegiados), con su defensa.',
    lab: 'Redes CORP + DMZ aisladas, dominio AD vulnerable (GOAD) y objetivos Docker para practicar.',
    auditorias: 'Informe de pentest: hallazgos con CVSS, narrativa del ataque, impacto y remediación.',
    glosario: 'Todas las definiciones de N1–N3 con ejemplos.', comandos: 'Cada comando de las prácticas, por nivel e importancia.',
    herramientas: 'El arsenal ofensivo y defensivo: qué es cada herramienta y cómo se instala.' };
  wrap.innerHTML = `
    <div class="hero"><h1>🧭 CiberLab N3 · ofensiva y Red Team</h1>
      <p>Para cuando ya dominas el N1 y el N2. Aquí operas como un Red Team: reconocimiento, acceso inicial, escalada, Active Directory,
      post-explotación y evasión, encadenando técnicas hasta el objetivo y demostrando el impacto — <b>siempre con autorización</b>. Cambia de escritorio con <code>Super + 1…8</code>.</p></div>
    <div class="grid g4">
      <div class="stat" style="--c:#ff2e63"><b>${done}/${all.length}</b><span>lecciones completadas</span></div>
      <div class="stat" style="--c:var(--amber)"><b>${CL.vulns.length}</b><span>técnicas ATT&amp;CK</span></div>
      <div class="stat" style="--c:var(--cyan)"><b id="st-vms">…</b><span>máquinas virtuales</span></div>
      <div class="stat" style="--c:var(--purple)"><b>${(CL.glossary || []).length} · ${(CL.commands || []).length}</b><span>términos · comandos</span></div>
    </div>
    ${nextL ? `<div class="box row" style="--c:#ff2e63;margin-top:14px"><span>▶ <b>Siguiente lección recomendada:</b> ${CL.esc(nextL.t)} <span class="mut small">(${CL.esc(CL.areas[nextL.area].title)})</span></span><span class="spacer"></span><a class="btn" href="#/${nextL.area}/${nextL.id}">Continuar</a></div>` : ''}
    <blockquote><p><b>¿Vienes del N1/N2?</b> Antes de empezar deberías poder: moverte en Linux y Windows sin miedo, leer un escaneo nmap, explotar los fallos de DVWA/Juice Shop, entender Kerberos y Active Directory y redactar un hallazgo con CVSS. Si no, consolida primero esos niveles.</p></blockquote>
    <h2>Tus programas</h2>
    <div class="cards">${CL.PROGRAMS.map(p => {
      const pr = CL.areaProgress(p.id);
      return `<a class="card" href="#/${p.id}" style="--c:${p.c}"><span class="desk">Esc. ${p.desk}</span><span class="ic">${p.emo}</span><h3>${p.name}</h3><p>${desc[p.id] || ''}</p>
        ${CL.areas[p.id] ? `<div class="bar"><i style="width:${pr.pct}%"></i></div>` : ''}</a>`;
    }).join('')}</div>
    <h2>🗺 Ruta ofensiva (6‑12 meses)</h2>
    <div class="roadmap">
      <div class="rm"><div class="t" style="color:#f59e0b">Bloque 1<br><small class="mut">mes 1‑2</small></div><div>
        <b>Método y laboratorio.</b> Alcance y reglas de enfrentamiento, Kali con dos patas, red CORP/DMZ aislada y un dominio vulnerable (GOAD) desplegado.
        <div class="small mut">→ Ruta ofensiva y método · Laboratorio N3</div></div></div>
      <div class="rm"><div class="t" style="color:#fb923c">Bloque 2<br><small class="mut">mes 3‑5</small></div><div>
        <b>De fuera a dentro.</b> OSINT y recon, acceso inicial (servicio/spraying), explotación web avanzada (SSRF, SSTI) y escalada local en Linux y Windows.
        <div class="small mut">→ Reconocimiento · Acceso inicial · Explotación web · Escalada de privilegios</div></div></div>
      <div class="rm"><div class="t" style="color:#eab308">Bloque 3<br><small class="mut">mes 6‑8</small></div><div>
        <b>Dueño del dominio.</b> BloodHound, Kerberoasting y delegación hasta Domain Admin; después C2, movimiento lateral y recolección de credenciales.
        <div class="small mut">→ Active Directory ofensivo · Post-explotación y C2</div></div></div>
      <div class="rm"><div class="t" style="color:#f43f5e">Bloque 4<br><small class="mut">mes 9‑12</small></div><div>
        <b>Sigilo, informe y certificación.</b> OPSEC y evasión (mapeadas a su detección), informe de pentest accionable y preparación de certificaciones.
        <div class="small mut">→ Evasión y OPSEC · Informe de pentest · Certificaciones: OSCP, CRTP/CRTO, PNPT, OSEP</div></div></div>
    </div>
    <h2>🧰 Arsenal ofensivo</h2><div id="tools" class="mut small">Comprobando herramientas…</div>
    <blockquote class="danger"><p><b>⛔ Legal y ética.</b> Todo lo del N3 se practica <b>solo</b> en tu laboratorio aislado, en plataformas creadas para ello (HTB, TryHackMe, VulnLab, PortSwigger) o contra sistemas de un cliente con <b>contrato, alcance y reglas de enfrentamiento firmadas</b>. Atacar sistemas sin autorización es un delito. El sigilo se usa para medir la detección, no para ocultar nada al cliente.</p></blockquote>
    ${CL.md(CL.areas.inicio.intro)}`;

  CL.api('/api/vms').then(r => { CL.$('#st-vms', wrap).textContent = r.vms.length + (r.vms.some(v => v.running) ? ' (' + r.vms.filter(v => v.running).length + ' on)' : ''); })
    .catch(() => { CL.$('#st-vms', wrap).textContent = '—'; });
  try {
    const s = await CL.api('/api/sys');
    const t = s.tools;
    const missOff = Object.keys(t).filter(k => !t[k] && PKG[k]).map(k => PKG[k]);
    const missOther = Object.keys(t).filter(k => !t[k] && !PKG[k]);
    CL.$('#tools', wrap).innerHTML = `<div class="row" style="gap:6px">${Object.entries(t).map(([k, v]) =>
      `<span class="chip" style="color:${v ? 'var(--green)' : 'var(--mut)'}">${v ? '✓' : '·'} ${k}</span>`).join('')}</div>
      ${missOff.length ? `<p>De los repos oficiales:</p>${CL.code('$ sudo pacman -S --needed ' + [...new Set(missOff)].join(' '))}` : ''}
      ${missOther.length ? `<p>El resto (${missOther.join(', ')}) está en <b>BlackArch</b> (repositorio de pentesting para Arch, +2800 herramientas), en el AUR o se instala con <code>pipx</code>; muchas viven ya dentro de tu <b>Kali</b>:</p>
      ${CL.code(`$ sudo pacman -S --needed python-pipx
$ pipx install netexec impacket certipy-ad   # recon/AD en Python
$ paru -S sliver-bin feroxbuster subfinder-bin httpx-bin   # AUR
# BloodHound CE y Sliver también corren con Docker; o usa tu VM Kali para todo el arsenal`)}` : ''}
      <p class="small mut">Carpeta de trabajo: <code>${CL.esc(s.workspace)}</code></p>`;
  } catch (e) { CL.$('#tools', wrap).textContent = e.message; }
};

/* ---------------- arranque */
(async () => {
  try { CL.state = await CL.api('/api/state'); } catch (e) { CL.toast('No se pudo cargar el progreso: ' + e.message, true); }
  CL.state.done ||= {}; CL.state.notes ||= {};
  if (CL.areas.inicio) CL.areas.inicio.home = CL.homeView;
  setupSearch();
  window.addEventListener('hashchange', route);
  route();
})();
