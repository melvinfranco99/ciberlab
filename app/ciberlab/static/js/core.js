/* CiberLab — núcleo: API, markdown, utilidades */
'use strict';
const CL = window.CL = {
  areas: {},          // contenido de aprendizaje por área
  vulns: [],          // catálogo de vulnerabilidades
  audit: {},          // plantillas de auditoría
  views: {},          // vistas registradas
  state: { done: {}, notes: {}, quiz: {} },
  token: document.querySelector('meta[name="ciberlab-token"]').content,
  LEVELS: ['Principiante', 'Intermedio', 'Avanzado', 'Experto'],
};

/* Programas (uno por escritorio) */
CL.PROGRAMS = [
  { id: 'inicio',     icon: '󰛨', emo: '🧭', name: 'Ruta y fundamentos',   desk: 1, c: '#00fa5c' },
  { id: 'ofensiva',   icon: '󰚌', emo: '☠️', name: 'Ofensiva y Red Team',  desk: 2, c: '#ff3b5c' },
  { id: 'web',        icon: '󰖟', emo: '🕸️', name: 'Hacking web',          desk: 3, c: '#fb923c' },
  { id: 'vulns',      icon: '󰒃', emo: '🐞', name: 'Vulnerabilidades',     desk: 4, c: '#f5b700' },
  { id: 'defensa',    icon: '󰞀', emo: '🛡️', name: 'Blue Team y logs',     desk: 5, c: '#3b82f6' },
  { id: 'redes',      icon: '󰖩', emo: '📡', name: 'Redes y WiFi',         desk: 6, c: '#22d3ee' },
  { id: 'cloud',      icon: '󰅟', emo: '☁️', name: 'Cloud y servidores',   desk: 7, c: '#a855f7' },
  { id: 'lab',        icon: '󰍛', emo: '🧪', name: 'Laboratorio (VMs)',    desk: 8, c: '#00fa5c' },
  { id: 'auditorias', icon: '󰈙', emo: '📋', name: 'Auditorías',           desk: 8, c: '#e5e7eb' },
];
CL.prog = id => CL.PROGRAMS.find(p => p.id === id);

/* ---------------- API */
CL.api = async (path, body) => {
  const opt = { headers: { 'X-CiberLab-Token': CL.token } };
  if (body !== undefined) {
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(body);
  }
  const r = await fetch(path, opt);
  const j = await r.json().catch(() => ({ ok: false, error: 'respuesta no válida' }));
  if (!r.ok || j.ok === false) throw new Error(j.error || ('HTTP ' + r.status));
  return j;
};

/* ---------------- utilidades DOM */
CL.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
CL.$ = (sel, el = document) => el.querySelector(sel);
CL.$$ = (sel, el = document) => [...el.querySelectorAll(sel)];
CL.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
CL.toast = (msg, err) => {
  const d = document.createElement('div');
  if (err) d.className = 'e';
  d.textContent = msg;
  CL.$('#toast').append(d);
  setTimeout(() => d.remove(), err ? 7000 : 3500);
};
CL.copy = async (txt) => {
  try { await navigator.clipboard.writeText(txt); CL.toast('Copiado al portapapeles'); }
  catch { CL.toast('No se pudo copiar', true); }
};
CL.debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ---------------- markdown mínimo y seguro (escapa todo antes de formatear) */
CL.inline = (s) => {
  s = CL.esc(s);
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
       .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
       .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|#[^)\s]*)\)/g, (_, t, u) =>
          `<a href="${u}"${u[0] === '#' ? '' : ' target="_blank" rel="noopener noreferrer"'}>${t}</a>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
};

CL.code = (txt, lang = '') => {
  const lines = String(txt).replace(/^\n+|\s+$/g, '').split('\n').map(l => {
    const e = CL.esc(l);
    if (/^\s*#( |$)/.test(l) && lang !== 'md') return `<span class="c">${e}</span>`;
    const m = e.match(/^(\$|#|PS&gt;|msf6?[^&]*&gt;|meterpreter &gt;|mysql&gt;|sqlite&gt;) (.*)$/);
    if (m && lang !== 'raw') return `<span class="p">${m[1]} </span>${m[2]}`;
    return e;
  }).join('\n');
  return `<pre><button class="sm cp" type="button">copiar</button><code>${lines}</code></pre>`;
};

CL.md = (src) => {
  if (!src) return '';
  const L = String(src).replace(/\r/g, '').split('\n');
  let out = '', i = 0;
  const para = [];
  const flush = () => { if (para.length) { out += `<p>${CL.inline(para.join(' '))}</p>`; para.length = 0; } };
  while (i < L.length) {
    let l = L[i];
    const fence = l.match(/^\s*```(\w*)/);
    if (fence) {
      flush();
      const buf = []; i++;
      while (i < L.length && !/^\s*```/.test(L[i])) buf.push(L[i++]);
      i++; out += CL.code(buf.join('\n'), fence[1]); continue;
    }
    if (!l.trim()) { flush(); i++; continue; }
    let m;
    if ((m = l.match(/^(#{1,4}) (.*)/))) { flush(); const n = Math.min(4, m[1].length + 1); out += `<h${n}>${CL.inline(m[2])}</h${n}>`; i++; continue; }
    if (/^\s*\|/.test(l)) {
      flush();
      const rows = [];
      while (i < L.length && /^\s*\|/.test(L[i])) rows.push(L[i++]);
      const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^\s*\|[\s:|-]+\|\s*$/.test(r));
      out += '<table><thead><tr>' + cells(body[0]).map(c => `<th>${CL.inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        body.slice(1).map(r => '<tr>' + cells(r).map(c => `<td>${CL.inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
      continue;
    }
    if (/^>/.test(l)) {
      flush();
      const buf = [];
      while (i < L.length && /^>/.test(L[i])) buf.push(L[i++].replace(/^> ?/, ''));
      const first = buf[0] || '';
      const cls = /^(⚠|Atención|Cuidado)/.test(first) ? 'warn' : /^(⛔|Legal|Peligro|Nunca)/.test(first) ? 'danger' : /^(💡|Truco|Consejo|✅)/.test(first) ? 'tip' : '';
      out += `<blockquote class="${cls}">${CL.md(buf.join('\n'))}</blockquote>`;
      continue;
    }
    if (/^\s*([-*]|\d+\.) /.test(l)) {
      flush();
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < L.length && (/^\s*([-*]|\d+\.) /.test(L[i]) || (/^\s{2,}\S/.test(L[i]) && items.length))) {
        if (/^\s*([-*]|\d+\.) /.test(L[i])) items.push(L[i].replace(/^\s*([-*]|\d+\.) /, ''));
        else items[items.length - 1] += ' ' + L[i].trim();
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out += `<${tag}>` + items.map(x => `<li>${CL.inline(x)}</li>`).join('') + `</${tag}>`;
      continue;
    }
    para.push(l.trim()); i++;
  }
  flush();
  return out;
};

/* botones de copiar dentro de bloques de código (delegado) */
document.addEventListener('click', e => {
  const b = e.target.closest('pre .cp');
  if (!b) return;
  const txt = b.nextElementSibling.innerText
    .split('\n').map(l => l.replace(/^(\$|PS>|msf6?[^>]*>|meterpreter >) /, '')).join('\n');
  CL.copy(txt);
});

/* ---------------- progreso */
CL.lessons = () => {
  const out = [];
  for (const a of Object.values(CL.areas))
    a.levels.forEach((lv, li) => lv.lessons.forEach(l => out.push({ ...l, area: a.id, level: li })));
  return out;
};
CL.areaProgress = (id) => {
  const a = CL.areas[id];
  if (!a) return { done: 0, total: 0, pct: 0 };
  const all = a.levels.flatMap(l => l.lessons);
  const done = all.filter(l => CL.state.done[l.id]).length;
  return { done, total: all.length, pct: all.length ? Math.round(done * 100 / all.length) : 0 };
};
CL.setDone = async (id, done) => {
  const r = await CL.api('/api/progress', { id, done });
  CL.state.done = r.done;
};
CL.saveNote = CL.debounce(async (id, text) => {
  try { await CL.api('/api/note', { id, text }); CL.state.notes[id] = text; } catch (e) { CL.toast(e.message, true); }
}, 600);

/* etiquetas de recursos de laboratorio usados en lecciones */
CL.LABREF = {
  'kali': ['VM Kali (atacante)', 'lab'], 'ms2': ['VM Metasploitable 2', 'lab'], 'ubuntu-srv': ['VM Ubuntu Server', 'lab'],
  'win-ad': ['VMs Windows Server + cliente (AD)', 'lab'], 'siem': ['VM SIEM (Wazuh)', 'lab'], 'vulnhub': ['VM VulnHub', 'lab'],
  'dvwa': ['DVWA (Docker)', 'docker'], 'juice-shop': ['Juice Shop (Docker)', 'docker'], 'webgoat': ['WebGoat (Docker)', 'docker'],
  'bwapp': ['bWAPP (Docker)', 'docker'], 'vampi': ['VAmPI (Docker)', 'docker'], 'dvga': ['DVGA (Docker)', 'docker'],
  'ssh-target': ['SSH débil (Docker)', 'docker'], 'host': ['Tu propio Arch', 'host'], 'wifi': ['Tu router + adaptador WiFi', 'host'],
  'logs': ['Práctica de logs', 'logs'], 'cloud': ['Cuenta cloud propia (capa gratuita)', 'host'], 'docker': ['Docker local', 'host'],
};
CL.labChips = (labs = []) => labs.map(k => {
  const [name, kind] = CL.LABREF[k] || [k, 'host'];
  const href = kind === 'docker' ? '#/lab/docker' : kind === 'lab' ? '#/lab/vms' : kind === 'logs' ? '#/defensa/logs' : '';
  return href ? `<a class="chip lab" href="${href}">🧪 ${CL.esc(name)}</a>` : `<span class="chip">🧪 ${CL.esc(name)}</span>`;
}).join('');

/* diálogos sin alert/confirm nativos */
function modal(html) {
  return new Promise(res => {
    const m = CL.h(`<div class="modal"><div>${html}</div></div>`);
    document.body.append(m);
    const done = v => { m.remove(); res(v); };
    m.addEventListener('click', e => { if (e.target === m) done(null); });
    CL.$$('[data-v]', m).forEach(b => b.onclick = () => done(b.dataset.v === '__in' ? CL.$('input', m).value : b.dataset.v === '__no' ? null : b.dataset.v));
    CL.$('input', m)?.focus();
    CL.$('input', m)?.addEventListener('keydown', e => { if (e.key === 'Enter') done(e.target.value); if (e.key === 'Escape') done(null); });
  });
}
function prompt2(title, def) { return modal(`<h3>${CL.esc(title)}</h3><input style="width:100%" value="${CL.esc(def)}"><div class="row" style="margin-top:12px;justify-content:flex-end"><button data-v="__no">Cancelar</button><button class="pri" data-v="__in">Aceptar</button></div>`); }
function confirm2(txt) { return modal(`<p>${CL.esc(txt)}</p><div class="row" style="justify-content:flex-end"><button data-v="__no">Cancelar</button><button class="pri" data-v="1">Sí</button></div>`).then(v => !!v); }
function choose(title, opts, cur) { return modal(`<h3>${CL.esc(title)}</h3><div class="row">${opts.map(o => `<button data-v="${CL.esc(o)}" class="${o === cur ? 'pri' : ''}">${CL.esc(o)}</button>`).join('')}</div><div class="row" style="margin-top:12px;justify-content:flex-end"><button data-v="__no">Cancelar</button></div>`); }
CL.modal = modal; CL.confirm2 = confirm2; CL.prompt2 = prompt2; CL.choose = choose;
