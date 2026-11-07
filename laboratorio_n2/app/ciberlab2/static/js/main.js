/* CiberLab N2 — arranque, navegación, búsqueda y panel de inicio */
'use strict';

const PKG = { // herramienta → paquete de los repos oficiales de Arch (resto: BlackArch/AUR/pipx)
  nmap: 'nmap', wireshark: 'wireshark-qt', tcpdump: 'tcpdump', zeek: 'zeek', suricata: 'suricata', yara: 'yara',
  radare2: 'radare2', ghidra: 'ghidra', trivy: 'trivy', grype: 'grype', syft: 'syft', semgrep: 'semgrep', gitleaks: 'gitleaks',
  kubectl: 'kubectl', kind: 'kind', helm: 'helm', aws: 'aws-cli-v2', terraform: 'terraform', ffuf: 'ffuf', nuclei: 'nuclei',
  python3: 'python', jq: 'jq', docker: 'docker', VBoxManage: 'virtualbox', openssl: 'openssl', age: 'age', gpg: 'gnupg',
  ldapsearch: 'openldap', zaproxy: 'zaproxy',
};

function nav(cur) {
  CL.$('#nav').innerHTML = CL.PROGRAMS.map(p =>
    `<a href="#/${p.id}" style="--c:${p.c}" class="${p.id === cur ? 'on' : ''}" title="Escritorio ${p.desk}">${p.emo} ${p.name}</a>`).join('');
}

function route() {
  const [a = 'inicio', b = '', c = ''] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const app = CL.$('#app');
  nav(a);
  document.title = 'CiberLab N2 · ' + (CL.prog(a)?.name || a);
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
    idx.push({ t: l.t, where: `${a.title} · ${CL.LEVELS[l.level]}`, href: `#/${l.area}/${l.id}`,
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
  const desc = { inicio: 'ATT&CK, modelado de amenazas, Python para seguridad, ingeniería de detección y método.',
    redteam: 'Planificación de ejercicios, emulación de adversarios, OPSEC, purple team e informes de red team.',
    tecnicas: 'Catálogo de técnicas ATT&CK: qué dejan en los logs, cómo detectarlas y mitigarlas.',
    appsec: 'Revisión de código, OAuth/JWT, SSRF, cadena de suministro, SAST/DAST/SCA en CI y móviles.',
    ad: 'Kerberos, ACLs, ADCS, tiering, LAPS, gMSA, BloodHound defensivo y detección de ataques al dominio.',
    dfir: 'Respuesta a incidentes, forense de memoria y disco, timelines, Sigma, Splunk y hunting.',
    malware: 'Laboratorio aislado, triage estático, análisis dinámico, YARA, capa, Ghidra y desofuscación.',
    cloud: 'IAM avanzado, detección en CloudTrail, Kubernetes (RBAC, PSA, Falco), IaC y contenedores.',
    lab: 'Red CORP + DMZ + red de malware, dominio AD, SIEM y firewall. Labs Docker avanzados.',
    auditorias: 'ISO 27001:2022, ENS, NIS2, DORA, análisis de riesgos y auditorías de gran empresa.',
    glosario: 'Todas las definiciones de N1 y N2 con ejemplos.', comandos: 'Cada comando de las prácticas, por nivel e importancia.' };
  wrap.innerHTML = `
    <div class="hero"><h1>🧭 CiberLab N2 · nivel avanzado</h1>
      <p>Para cuando ya dominas el N1 (Linux, redes, OWASP Top 10, logs básicos y metodología). Aquí trabajas como en un equipo profesional:
      dominio Active Directory, SIEM, forense, malware, cloud y auditorías con normativa. Cambia de escritorio con <code>Super + 1…8</code>.</p></div>
    <div class="grid g4">
      <div class="stat" style="--c:#ff2e63"><b>${done}/${all.length}</b><span>lecciones completadas</span></div>
      <div class="stat" style="--c:var(--amber)"><b>${CL.vulns.length}</b><span>técnicas ATT&amp;CK</span></div>
      <div class="stat" style="--c:var(--cyan)"><b id="st-vms">…</b><span>máquinas virtuales</span></div>
      <div class="stat" style="--c:var(--purple)"><b>${(CL.glossary || []).length} · ${(CL.commands || []).length}</b><span>términos · comandos</span></div>
    </div>
    ${nextL ? `<div class="box row" style="--c:#ff2e63;margin-top:14px"><span>▶ <b>Siguiente lección recomendada:</b> ${CL.esc(nextL.t)} <span class="mut small">(${CL.esc(CL.areas[nextL.area].title)})</span></span><span class="spacer"></span><a class="btn" href="#/${nextL.area}/${nextL.id}">Continuar</a></div>` : ''}
    <blockquote><p><b>¿Vienes del N1?</b> Antes de empezar deberías poder: explicar TCP/IP y HTTP, moverte en Linux sin miedo, encontrar y explicar los fallos de DVWA/Juice Shop, leer un <code>auth.log</code> y redactar un hallazgo con CVSS. Si no, vuelve un tiempo al N1 (botón 󰚌 de la barra).</p></blockquote>
    <h2>Tus programas</h2>
    <div class="cards">${CL.PROGRAMS.map(p => {
      const pr = CL.areaProgress(p.id);
      return `<a class="card" href="#/${p.id}" style="--c:${p.c}"><span class="desk">Esc. ${p.desk}</span><span class="ic">${p.emo}</span><h3>${p.name}</h3><p>${desc[p.id] || ''}</p>
        ${CL.areas[p.id] ? `<div class="bar"><i style="width:${pr.pct}%"></i></div>` : ''}</a>`;
    }).join('')}</div>
    <h2>🗺 Ruta N2 (6‑12 meses)</h2>
    <div class="roadmap">
      <div class="rm"><div class="t" style="color:#60a5fa">Bloque 1<br><small class="mut">mes 1‑2</small></div><div>
        <b>Monta el dominio y míralo todo.</b> Red CORP/DMZ, DC01 + WS01, auditoría avanzada de Windows, Sysmon y Wazuh/Splunk recibiendo eventos.
        <div class="small mut">→ Laboratorio N2 · Active Directory (intermedio) · DFIR (intermedio)</div></div></div>
      <div class="rm"><div class="t" style="color:#f59e0b">Bloque 2<br><small class="mut">mes 3‑4</small></div><div>
        <b>Purple team.</b> Emula técnicas ATT&amp;CK con Atomic Red Team, comprueba si las detectas, escribe reglas Sigma y mide la cobertura.
        <div class="small mut">→ Técnicas ATT&amp;CK · Red y Purple Team · Práctica de detección</div></div></div>
      <div class="rm"><div class="t" style="color:#f59e0b">Bloque 3<br><small class="mut">mes 5‑7</small></div><div>
        <b>Forense y malware.</b> Memoria con Volatility, timelines con Plaso, triage de malware en red aislada, reglas YARA.
        <div class="small mut">→ DFIR (avanzado) · Malware y reversing</div></div></div>
      <div class="rm"><div class="t" style="color:#f43f5e">Bloque 4<br><small class="mut">mes 8‑12</small></div><div>
        <b>Cloud, AppSec y auditoría formal.</b> IAM y detección en AWS, Kubernetes, DevSecOps, auditoría ISO 27001/ENS/NIS2 de una gran empresa.
        <div class="small mut">→ Cloud y Kubernetes · AppSec · Auditorías avanzadas · Certificaciones: OSCP/CRTP, GCFA/BTL2, CKS, ISO 27001 Lead Auditor</div></div></div>
    </div>
    <h2>🧰 Arsenal N2</h2><div id="tools" class="mut small">Comprobando herramientas…</div>
    <blockquote class="danger"><p><b>⛔ Legal y ética.</b> El nivel avanzado no cambia la regla: solo tu laboratorio, plataformas creadas para practicar o sistemas de un cliente con <b>autorización escrita, alcance y reglas de enfrentamiento firmadas</b>. Las muestras de malware se manejan solo en la red interna aislada y comprimidas con contraseña.</p></blockquote>
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
      ${missOther.length ? `<p>El resto (${missOther.join(', ')}) se instala con <code>pipx</code>, desde BlackArch/AUR o vive dentro de las VMs (REMnux, FLARE-VM, Kali):</p>
      ${CL.code(`$ sudo pacman -S --needed python-pipx
$ pipx install volatility3 sigma-cli flare-capa checkov prowler scoutsuite certipy-ad
$ paru -S chainsaw-bin hayabusa-bin   # AUR
# BloodHound CE se ejecuta con Docker Compose: ver lección «BloodHound para defensores»`)}` : ''}
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
