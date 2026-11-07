/* Glosario de términos, de comandos y de herramientas (compartido por CiberLab N1 y N2) */
'use strict';

CL.views.glosario = (root, kind, sel) => {
  const isCmd = kind === 'comandos';
  const isTool = kind === 'herramientas';
  const hasLvl = isCmd;                         // solo los comandos se agrupan por nivel
  const hasImp = isCmd || isTool;               // comandos y herramientas tienen estrellas de importancia
  const c = CL.prog(kind)?.c || '#93a4b5';
  const f = (CL.views.glosario[kind] ||= { q: '', cat: '', n: 0, lvl: -1 });
  root.innerHTML = `<div class="area" style="--c:${c}"><section class="content"><div class="wrap"></div></section></div>`;
  const wrap = CL.$('.wrap', root);
  const data = isCmd ? (CL.commands || []) : isTool ? (CL.tools || []) : (CL.glossary || []);
  const catOf = x => isCmd ? x.area : x.cat;
  const cats = [...new Set(data.map(catOf))].sort((a, b) => a.localeCompare(b, 'es'));

  const titulo = isTool ? '🧰 Glosario de herramientas' : isCmd ? '⌨️ Glosario de comandos' : '📖 Glosario de ciberseguridad';
  const intro = isTool ? 'Las herramientas que usan las lecciones y las prácticas: qué es cada una, para qué sirve, cómo se instala en Arch y un ejemplo. Ordenadas de <b>más a menos importante</b> (★★★★★ = imprescindible).'
    : isCmd ? 'Todos los comandos de las prácticas de CiberLab N1 y N2: qué significa cada parte, para qué sirve y un ejemplo real. Separados por nivel y ordenados de <b>más a menos importante</b>.'
      : 'Definiciones claras de los términos que aparecen en las lecciones, con un ejemplo de cada uno. N1 = nivel básico/intermedio, N2 = avanzado.';
  const ph = isTool ? 'Buscar herramienta o tarea (ej. nmap, logs, web, cloud)…' : isCmd ? 'Buscar comando o tarea (ej. nmap, puertos, hash)…' : 'Buscar término (ej. CVSS, kerberoasting, SIEM)…';

  wrap.innerHTML = `<div class="hero"><h1>${titulo}</h1><p>${intro}</p></div>
    <div class="row"><input id="gq" placeholder="${ph}" value="${CL.esc(f.q)}" style="flex:1">
      <span class="mut small mono" id="gcount"></span></div>
    <div class="filters" id="gn"><button data-n="0" class="${f.n ? '' : 'on'}">N1 + N2</button><button data-n="1" class="${f.n === 1 ? 'on' : ''}">Solo N1</button><button data-n="2" class="${f.n === 2 ? 'on' : ''}">Solo N2</button></div>
    ${hasLvl ? `<div class="filters" id="gl"><button data-l="-1" class="${f.lvl < 0 ? 'on' : ''}">Todos los niveles</button>${CL.CMD_LEVELS.map((x, i) => `<button data-l="${i}" class="${f.lvl === i ? 'on' : ''}">${x}</button>`).join('')}</div>` : ''}
    <div class="filters" id="gc"><button data-c="" class="${f.cat ? '' : 'on'}">Todas las áreas</button>${cats.map(x => `<button data-c="${CL.esc(x)}" class="${f.cat === x ? 'on' : ''}">${CL.esc(x)}</button>`).join('')}</div>
    <div id="glist"></div>`;

  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
  const txtOf = x => isTool ? [x.t, x.what, x.why, x.ex, x.cat, x.pkg].join(' ')
    : isCmd ? [x.c, x.what, x.why, x.ex, x.area].join(' ') : [x.t, x.d, x.ex, x.cat].join(' ');

  const card = x => {
    if (isTool) return `<div class="gl-item${sel === x.t ? ' sel' : ''}" id="${CL.esc('t-' + x.t)}" style="${sel === x.t ? 'border-color:var(--c)' : ''}">
        <div class="row" style="gap:8px"><h3>${CL.esc(x.t)}</h3><span class="spacer"></span><span class="imp" title="Importancia">${stars(x.imp)}</span>
          <span class="chip">${CL.esc(x.cat)}</span><span class="chip">N${x.n}</span></div>
        <p><b>Qué es:</b> ${CL.inline(x.what)}</p><p><b>Para qué sirve:</b> ${CL.inline(x.why)}</p>
        <p class="small mut"><b>Instalar:</b> <code>${CL.esc(x.pkg)}</code></p>${x.ex ? CL.code(x.ex) : ''}</div>`;
    if (isCmd) return `<div class="gl-item${sel === x.c ? ' sel' : ''}" id="${CL.esc('c-' + x.c)}" style="${sel === x.c ? 'border-color:var(--c)' : ''}">
        <div class="row" style="gap:8px"><h3>${CL.esc(x.c)}</h3><span class="spacer"></span><span class="imp" title="Importancia">${stars(x.imp)}</span>
          <span class="chip">${CL.esc(x.area)}</span><span class="chip">N${x.n}</span></div>
        <p><b>Qué significa:</b> ${CL.inline(x.what)}</p><p><b>Para qué sirve:</b> ${CL.inline(x.why)}</p>${x.ex ? CL.code(x.ex) : ''}</div>`;
    return '';
  };

  const draw = () => {
    const q = norm(f.q);
    const list = data.filter(x => (!f.n || x.n === f.n) && (!f.cat || catOf(x) === f.cat) && (!hasLvl || f.lvl < 0 || x.lvl === f.lvl) &&
      (!q || norm(txtOf(x)).includes(q)));
    CL.$('#gcount', wrap).textContent = `${list.length} de ${data.length}`;
    const out = CL.$('#glist', wrap);
    if (!list.length) { out.innerHTML = '<p class="mut">Nada coincide con el filtro.</p>'; return; }
    if (hasLvl) {
      out.innerHTML = CL.CMD_LEVELS.map((lv, li) => {
        const items = list.filter(x => x.lvl === li).sort((a, b) => b.imp - a.imp || a.c.localeCompare(b.c));
        return items.length ? `<h2>${lv} <span class="mut small">· ${items.length}</span></h2><div class="gl-list">${items.map(card).join('')}</div>` : '';
      }).join('');
    } else if (isTool) {
      const items = [...list].sort((a, b) => b.imp - a.imp || a.t.localeCompare(b.t, 'es'));
      out.innerHTML = `<div class="gl-list">${items.map(card).join('')}</div>`;
    } else {
      const sorted = [...list].sort((a, b) => a.t.localeCompare(b.t, 'es', { sensitivity: 'base' }));
      let last = '';
      out.innerHTML = '<div class="gl-list">' + sorted.map(x => {
        const L = norm(x.t)[0].toUpperCase();
        const head = L !== last ? `<div class="gl-letter">${/[A-Z]/.test(L) ? L : '#'}</div>` : '';
        last = L;
        return `${head}<div class="gl-item" id="${CL.esc('g-' + x.t)}" style="${sel === x.t ? 'border-color:var(--c)' : ''}">
          <div class="row" style="gap:8px"><h3>${CL.esc(x.t)}</h3><span class="spacer"></span><span class="chip">${CL.esc(x.cat)}</span><span class="chip">N${x.n}</span></div>
          <p>${CL.inline(x.d)}</p>${x.ex ? `<p class="ex">Ejemplo: ${CL.inline(x.ex)}</p>` : ''}</div>`;
      }).join('') + '</div>';
    }
    if (sel) { const pre = isTool ? 't-' : isCmd ? 'c-' : 'g-'; setTimeout(() => document.getElementById(pre + sel)?.scrollIntoView({ block: 'center' }), 30); }
  };
  draw();
  CL.$('#gq', wrap).oninput = CL.debounce(e => { f.q = e.target.value; sel = ''; draw(); }, 120);
  const bindF = (id, attr, key, conv) => {
    const el = CL.$(id, wrap);
    if (el) el.onclick = e => { const b = e.target.closest('button'); if (!b) return; f[key] = conv(b.dataset[attr]); CL.$$(id + ' button', wrap).forEach(x => x.classList.toggle('on', x === b)); draw(); };
  };
  bindF('#gn', 'n', 'n', Number); bindF('#gl', 'l', 'lvl', Number); bindF('#gc', 'c', 'cat', String);
};
