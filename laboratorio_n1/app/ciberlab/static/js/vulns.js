/* Escritorio 4 — catálogo de vulnerabilidades */
'use strict';

CL.views.vulns = (root, id) => {
  const c = CL.prog('vulns').c;
  const cats = [...new Set(CL.vulns.map(v => v.cat))];
  const f = CL.views.vulns.f ||= { cat: '', lvl: -1, q: '' };
  root.innerHTML = `<div class="area" style="--c:${c}"><section class="content"><div class="wrap"></div></section></div>`;
  const wrap = CL.$('.wrap', root);
  const v = CL.vulns.find(x => x.id === id);
  if (v) return detail(v);

  wrap.innerHTML = `<div class="hero"><h1>🐞 Vulnerabilidades: entender, detectar, prevenir</h1>
    <p>Cada ficha explica qué es el fallo, su impacto, dónde practicarlo de forma legal (tus labs y plataformas guiadas), cómo detectarlo en los logs y cómo corregirlo de raíz.</p></div>
    <div class="row"><input id="vf" placeholder="Filtrar… (ej. sql, cookie, kerberos)" value="${CL.esc(f.q)}" style="flex:1">
      <span class="mut small mono" id="vcount"></span></div>
    <div class="filters" id="fc"><button data-c="" class="${f.cat ? '' : 'on'}">Todas</button>${cats.map(x => `<button data-c="${CL.esc(x)}" class="${f.cat === x ? 'on' : ''}">${CL.esc(x)}</button>`).join('')}</div>
    <div class="filters" id="fl"><button data-l="-1" class="${f.lvl < 0 ? 'on' : ''}">Cualquier nivel</button>${CL.LEVELS.map((x, i) => `<button data-l="${i}" class="${f.lvl === i ? 'on' : ''}">${x}</button>`).join('')}</div>
    <div class="vgrid" id="vg"></div>`;
  const draw = () => {
    const q = f.q.toLowerCase();
    const list = CL.vulns.filter(v => (!f.cat || v.cat === f.cat) && (f.lvl < 0 || v.lvl === f.lvl) &&
      (!q || [v.name, v.sum, v.what, v.cwe, v.owasp, v.cat].join(' ').toLowerCase().includes(q)));
    CL.$('#vcount', wrap).textContent = `${list.length} de ${CL.vulns.length}`;
    CL.$('#vg', wrap).innerHTML = list.map(v => `<div class="vcard" data-id="${v.id}">
      <div class="row" style="gap:6px"><span class="chip sev-${v.sev}">${v.sev}</span><span class="chip lv${v.lvl}">${CL.LEVELS[v.lvl]}</span><span class="chip">${CL.esc(v.cat)}</span></div>
      <h3>${CL.esc(v.name)}</h3><p>${CL.esc(v.sum)}</p></div>`).join('') || '<p class="mut">Nada coincide con el filtro.</p>';
  };
  draw();
  CL.$('#vf', wrap).oninput = e => { f.q = e.target.value; draw(); };
  CL.$('#fc', wrap).onclick = e => { const b = e.target.closest('button'); if (!b) return; f.cat = b.dataset.c; CL.$$('#fc button', wrap).forEach(x => x.classList.toggle('on', x === b)); draw(); };
  CL.$('#fl', wrap).onclick = e => { const b = e.target.closest('button'); if (!b) return; f.lvl = +b.dataset.l; CL.$$('#fl button', wrap).forEach(x => x.classList.toggle('on', x === b)); draw(); };
  CL.$('#vg', wrap).onclick = e => { const d = e.target.closest('[data-id]'); if (d) location.hash = '#/vulns/' + d.dataset.id; };

  function detail(v) {
    const tabs = [['what', '📖 Qué es'], ['practice', '🧪 Dónde practicar'], ['detect', '🔎 Detección'], ['defense', '🛡 Defensa y prevención']];
    wrap.innerHTML = `<a href="#/vulns" class="btn">← Catálogo</a>
      <div class="meta" style="margin-top:16px"><span class="chip sev-${v.sev}">Severidad típica: ${v.sev}</span><span class="chip lv${v.lvl}">${CL.LEVELS[v.lvl]}</span>
        <span class="chip">${CL.esc(v.cat)}</span>${v.cwe ? `<span class="chip">${CL.esc(v.cwe)}</span>` : ''}${v.owasp ? `<span class="chip">OWASP ${CL.esc(v.owasp)}</span>` : ''}${CL.labChips(v.labs)}</div>
      <h1>${CL.esc(v.name)}</h1><p class="mut">${CL.esc(v.sum)}</p>
      <div class="tabs">${tabs.map((t, i) => `<button data-t="${t[0]}" class="${i ? '' : 'on'}">${t[1]}</button>`).join('')}</div>
      <div class="tabpane"></div>
      ${v.refs?.length ? `<h2>📚 Referencias</h2><ul>${v.refs.map(r => `<li><a href="${CL.esc(r[1])}" target="_blank" rel="noopener noreferrer">${CL.esc(r[0])}</a></li>`).join('')}</ul>` : ''}`;
    const pane = CL.$('.tabpane', wrap);
    const show = t => {
      let html = CL.md(v[t]);
      if (t === 'what' && v.impact) html += `<h3>💥 Impacto</h3>${CL.md(v.impact)}`;
      if (t === 'practice') html = `<blockquote class="warn"><p>⚠ Practica solo en laboratorios creados para ello o con autorización escrita.</p></blockquote>` + (v.practice?.length ? '<ul>' + v.practice.map(p => `<li><a href="${CL.esc(p[1])}"${p[1][0] === '#' ? '' : ' target="_blank" rel="noopener noreferrer"'}>${CL.esc(p[0])}</a></li>`).join('') + '</ul>' : '<p class="mut">Sin laboratorios enlazados.</p>');
      pane.innerHTML = html;
      CL.$$('.tabs button', wrap).forEach(b => b.classList.toggle('on', b.dataset.t === t));
    };
    CL.$('.tabs', wrap).onclick = e => { const b = e.target.closest('button'); if (b) show(b.dataset.t); };
    show('what');
  }
};
