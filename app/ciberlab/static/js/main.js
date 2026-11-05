/* CiberLab — arranque, navegación, búsqueda y panel de inicio */
'use strict';

const PKG = { // herramienta → paquete de los repos oficiales de Arch (resto: BlackArch/AUR)
  nmap: 'nmap', hydra: 'hydra', john: 'john', hashcat: 'hashcat', 'aircrack-ng': 'aircrack-ng', ffuf: 'ffuf',
  sqlmap: 'sqlmap', gobuster: 'gobuster', wireshark: 'wireshark-qt', tcpdump: 'tcpdump', nc: 'openbsd-netcat',
  msfconsole: 'metasploit', masscan: 'masscan', lynis: 'lynis', trivy: 'trivy', yara: 'yara', nuclei: 'nuclei',
  smbclient: 'smbclient', openssl: 'openssl', docker: 'docker', VBoxManage: 'virtualbox',
};

function nav(cur) {
  CL.$('#nav').innerHTML = CL.PROGRAMS.map(p =>
    `<a href="#/${p.id}" style="--c:${p.c}" class="${p.id === cur ? 'on' : ''}" title="Escritorio ${p.desk}">${p.emo} ${p.name}</a>`).join('');
}

function route() {
  const [a = 'inicio', b = '', c = ''] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const app = CL.$('#app');
  nav(a);
  document.title = 'CiberLab · ' + (CL.prog(a)?.name || a);
  if (a === 'vulns') return CL.views.vulns(app, b);
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
    idx.push({ t: l.t, where: `${a.title} · ${CL.LEVELS[l.level]}`, href: `#/${l.area}/${l.id}`,
      txt: [l.t, l.theory, (l.steps || []).map(s => s.join(' ')).join(' '), l.defense, (l.obj || []).join(' ')].join(' ').toLowerCase() });
  }
  for (const v of CL.vulns)
    idx.push({ t: '🐞 ' + v.name, where: `Vulnerabilidad · ${v.cat}`, href: `#/vulns/${v.id}`,
      txt: [v.name, v.cat, v.sum, v.what, v.defense, v.cwe].join(' ').toLowerCase() });
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
  const last = Object.entries(CL.state.done).sort((a, b) => b[1].localeCompare(a[1]))[0];
  const nextL = all.find(l => !CL.state.done[l.id] && l.level === 0) || all.find(l => !CL.state.done[l.id]);
  wrap.innerHTML = `
    <div class="hero"><h1>🧭 Tu laboratorio de ciberseguridad</h1>
      <p>Aprende, practica en un laboratorio aislado y audita con método. Cada escritorio tiene su programa: cambia con <code>Super + 1…8</code>.</p></div>
    <div class="grid g4">
      <div class="stat" style="--c:var(--green)"><b>${done}/${all.length}</b><span>lecciones completadas</span></div>
      <div class="stat" style="--c:var(--amber)"><b>${CL.vulns.length}</b><span>vulnerabilidades en el catálogo</span></div>
      <div class="stat" style="--c:var(--cyan)"><b id="st-vms">…</b><span>máquinas virtuales</span></div>
      <div class="stat" style="--c:var(--purple)"><b id="st-aud">…</b><span>auditorías</span></div>
    </div>
    ${nextL ? `<div class="box row" style="--c:var(--green);margin-top:14px"><span>▶ <b>Siguiente lección recomendada:</b> ${CL.esc(nextL.t)} <span class="mut small">(${CL.esc(CL.areas[nextL.area].title)})</span></span><span class="spacer"></span><a class="btn" href="#/${nextL.area}/${nextL.id}">Continuar</a></div>` : ''}
    <h2>Tus programas (uno por escritorio)</h2>
    <div class="cards">${CL.PROGRAMS.map(p => {
      const pr = CL.areaProgress(p.id);
      const desc = { inicio: 'Seguridad informática general, Linux, ética, criptografía y tu ruta.', ofensiva: 'Metodología de pentesting, OSINT, Active Directory, red team y purple team.',
        web: 'OWASP Top 10, APIs, Burp Suite, SQLi, XSS, SSRF y más.', vulns: 'Qué es cada fallo, su impacto, cómo detectarlo, prevenirlo y dónde practicarlo.',
        defensa: 'SOC, logs, SIEM, detección, hardening, respuesta a incidentes y forense.', redes: 'TCP/IP, escaneo, sniffing, MITM, WiFi WPA2/WPA3, segmentación.',
        cloud: 'AWS/Azure/GCP, IAM, contenedores, Kubernetes, bastionado de servidores.', lab: 'Crea y gestiona VMs y laboratorios Docker aislados.',
        auditorias: 'Metodología, alcance, checklist PYME / gran empresa, CVSS e informe.' }[p.id];
      return `<a class="card" href="#/${p.id}" style="--c:${p.c}"><span class="desk">Esc. ${p.desk}</span><span class="ic">${p.emo}</span><h3>${p.name}</h3><p>${desc}</p>
        ${CL.areas[p.id] ? `<div class="bar"><i style="width:${pr.pct}%"></i></div>` : ''}</a>`;
    }).join('')}</div>

    <h2>🗺 Ruta de aprendizaje global (de cero a experto)</h2>
    <div class="roadmap">
      <div class="rm"><div class="t" style="color:#4ade80">Fase 0<br><small class="mut">semanas 1‑4</small></div><div>
        <b>Bases sólidas.</b> Linux y terminal, redes TCP/IP, cómo funciona la web, ética y ley. Monta el laboratorio (red aislada + Kali + Metasploitable).
        <div class="small mut">→ Fundamentos (principiante) · Redes (principiante) · Laboratorio</div></div></div>
      <div class="rm"><div class="t" style="color:#4ade80">Fase 1<br><small class="mut">semanas 5‑10</small></div><div>
        <b>Primeros ataques controlados.</b> Reconocimiento, escaneo con nmap, explotar servicios de Metasploitable, DVWA en nivel <i>low</i>, contraseñas.
        <div class="small mut">→ Ofensiva (principiante) · Hacking web (principiante) · 10 primeras vulnerabilidades</div></div></div>
      <div class="rm"><div class="t" style="color:#60a5fa">Fase 2<br><small class="mut">semanas 11‑16</small></div><div>
        <b>Defiende lo que atacas.</b> Lee los logs de tus propios ataques, bastiona el servidor que acabas de comprometer, monta Wazuh.
        <div class="small mut">→ Blue Team (principiante/intermedio) · Práctica de logs · Cloud y servidores (principiante)</div></div></div>
      <div class="rm"><div class="t" style="color:#f59e0b">Fase 3<br><small class="mut">meses 4‑8</small></div><div>
        <b>Nivel profesional.</b> Escalada de privilegios Linux/Windows, Active Directory, Burp avanzado, APIs, WiFi, cloud, detección con Sigma.
        <div class="small mut">→ Niveles intermedio y avanzado de cada área · Primera auditoría de práctica a tu propio lab · Certificación: eJPT / BTL1 / CompTIA Security+</div></div></div>
      <div class="rm"><div class="t" style="color:#f43f5e">Fase 4<br><small class="mut">meses 8+</small></div><div>
        <b>Experto y auditor.</b> Red team con C2, evasión y OPSEC, threat hunting, forense de memoria, auditorías reales con contrato y alcance firmado.
        <div class="small mut">→ Nivel experto · Auditorías · Certificaciones: OSCP / CRTO / OSWE / GCIH / CCSK. Practica a diario en HackTheBox / TryHackMe.</div></div></div>
    </div>

    <h2>🧰 Estado de tu arsenal</h2><div id="tools" class="mut small">Comprobando herramientas…</div>

    <blockquote class="danger"><p><b>⛔ Legal y ética (léelo).</b> En España, acceder sin autorización a un sistema es delito (art. 197 bis y 264 del Código Penal), aunque «solo mires». Practica únicamente en tu laboratorio, en plataformas creadas para ello (HackTheBox, TryHackMe, PortSwigger Academy) o en sistemas de un cliente con <b>autorización escrita y alcance firmado</b>. El programa de Auditorías te genera ese documento.</p></blockquote>
    ${CL.md(CL.areas.inicio.intro)}
    <h2>Lecciones de fundamentos</h2>
    <div class="roadmap">${CL.areas.inicio.levels.map((lv, li) => `<div class="rm"><div class="t" style="color:${['#4ade80', '#60a5fa', '#f59e0b', '#f43f5e'][li]}">${CL.LEVELS[li]}</div>
      <ol>${lv.lessons.map(l => `<li><a href="#/inicio/${l.id}">${CL.esc(l.t)}</a> ${CL.state.done[l.id] ? '<span class="ok">✓</span>' : ''}</li>`).join('')}</ol></div>`).join('')}</div>
    ${last ? `<p class="mut small">Última lección completada: ${CL.esc(all.find(l => l.id === last[0])?.t || last[0])} (${last[1]})</p>` : ''}`;

  CL.api('/api/vms').then(r => { CL.$('#st-vms', wrap).textContent = r.vms.length + (r.vms.some(v => v.running) ? ' (' + r.vms.filter(v => v.running).length + ' on)' : ''); })
    .catch(() => { CL.$('#st-vms', wrap).textContent = '—'; });
  CL.api('/api/audits').then(r => { CL.$('#st-aud', wrap).textContent = r.audits.length; }).catch(() => {});
  try {
    const s = await CL.api('/api/sys');
    const t = s.tools;
    const missOff = Object.keys(t).filter(k => !t[k] && PKG[k]).map(k => PKG[k]);
    const missOther = Object.keys(t).filter(k => !t[k] && !PKG[k]);
    CL.$('#tools', wrap).innerHTML = `<div class="row" style="gap:6px">${Object.entries(t).map(([k, v]) =>
      `<span class="chip" style="color:${v ? 'var(--green)' : 'var(--mut)'}">${v ? '✓' : '·'} ${k}</span>`).join('')}</div>
      ${missOff.length ? `<p>Instala lo que falta de los repos oficiales:</p>${CL.code('$ sudo pacman -S --needed ' + [...new Set(missOff)].join(' '))}` : ''}
      ${missOther.length ? `<p>El resto (${missOther.join(', ')}) está en <b>BlackArch</b> (repositorio de pentesting para Arch, +2800 herramientas) o en el AUR. Para añadir BlackArch a tu Arch:</p>
      ${CL.code(`$ curl -O https://blackarch.org/strap.sh
# comprueba la suma publicada en blackarch.org/downloads.html antes de ejecutarlo
$ sha1sum strap.sh
$ chmod +x strap.sh && sudo ./strap.sh
$ sudo pacman -S --needed burpsuite netexec responder bloodhound enum4linux-ng wpscan whatweb theharvester volatility3 zaproxy`)}
      <p class="small mut">Consejo: no instales «todo BlackArch» en tu sistema principal; instala solo lo que uses, o trabaja desde la VM Kali.</p>` : ''}
      <p class="small mut">Red: ${s.ips.map(i => `${i.iface} ${i.ip}`).join(' · ')} ${s.vpn ? ' · <span class="ok">VPN activa (' + s.vpn + ')</span>' : ''} · Carpeta de trabajo: <code>${CL.esc(s.workspace)}</code></p>`;
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
