/* Vista genérica de un área de aprendizaje: barra lateral con niveles + lección */
'use strict';

CL.renderArea = (root, areaId, sub) => {
  const a = CL.areas[areaId];
  const p = CL.prog(areaId);
  if (!a) { root.innerHTML = '<div class="loading">Área no encontrada</div>'; return; }
  const c = p?.c || a.color;
  root.innerHTML = `<div class="area" style="--c:${c}">
    <aside class="side"></aside><section class="content"><div class="wrap"></div></section></div>`;
  const side = CL.$('.side', root), wrap = CL.$('.wrap', root), content = CL.$('.content', root);

  const drawSide = () => {
    const pr = CL.areaProgress(areaId);
    side.innerHTML = `<h2>${p ? p.emo + ' ' : ''}${CL.esc(a.title)}</h2>
      <div class="sub">${pr.done}/${pr.total} lecciones · ${pr.pct}%<div class="bar"><i style="width:${pr.pct}%"></i></div></div>
      <a class="ls ${!sub ? 'on' : ''}" href="#/${areaId}"><span class="ck">⌂</span><span>Presentación y ruta del área</span></a>
      ${a.levels.map((lv, li) => {
        const d = lv.lessons.filter(l => CL.state.done[l.id]).length;
        return `<div class="lvl l${li}"><span>${CL.LEVELS[li] || lv.name}</span><span>${d}/${lv.lessons.length}</span></div>` +
          lv.lessons.map(l => `<a class="ls ${CL.state.done[l.id] ? 'done' : ''} ${sub === l.id ? 'on' : ''}" href="#/${areaId}/${l.id}">
            <span class="ck">${CL.state.done[l.id] ? '✓' : ''}</span><span>${CL.esc(l.t)}</span></a>`).join('');
      }).join('')}
      ${a.extra?.length ? `<div class="tools">${a.extra.map(x => `<a class="${sub === x.id ? 'on' : ''}" href="#/${areaId}/${x.id}">${x.t}</a>`).join('')}</div>` : ''}`;
  };
  drawSide();

  const extra = a.extra?.find(x => x.id === sub);
  if (extra) { CL.views[extra.view](wrap, areaId); return; }

  const flat = a.levels.flatMap((lv, li) => lv.lessons.map(l => ({ ...l, level: li })));
  const idx = flat.findIndex(l => l.id === sub);
  if (idx < 0) { overview(); return; }
  lesson(flat[idx], flat[idx - 1], flat[idx + 1]);

  function overview() {
    if (a.home) { a.home(wrap); return; }
    const pr = CL.areaProgress(areaId);
    wrap.innerHTML = `
      <div class="hero"><h1>${p ? p.emo + ' ' : ''}${CL.esc(a.title)}</h1><p>${CL.esc(a.tagline || '')}</p>
        <div class="bar" style="max-width:420px"><i style="width:${pr.pct}%"></i></div>
        <div class="small mut mono" style="margin-top:6px">${pr.done}/${pr.total} lecciones completadas</div></div>
      ${CL.md(a.intro)}
      <h2>Ruta del área: de principiante a experto</h2>
      <div class="roadmap">${a.levels.map((lv, li) => `
        <div class="rm"><div class="t" style="color:${['#4ade80', '#60a5fa', '#f59e0b', '#f43f5e'][li]}">${CL.LEVELS[li]}</div>
        <ol>${lv.lessons.map(l => `<li><a href="#/${areaId}/${l.id}">${CL.esc(l.t)}</a> ${CL.state.done[l.id] ? '<span class="ok">✓</span>' : ''} <span class="mut small">· ${l.min || 30} min</span></li>`).join('')}</ol></div>`).join('')}
      </div>
      ${a.outro ? CL.md(a.outro) : ''}`;
  }

  function lesson(l, prev, next) {
    const done = !!CL.state.done[l.id];
    wrap.innerHTML = `
      <div class="meta"><span class="chip lv${l.level}">${CL.LEVELS[l.level]}</span><span class="chip">⏱ ${l.min || 30} min</span>${CL.labChips(l.labs)}</div>
      <h1>${CL.esc(l.t)}</h1>
      ${l.obj?.length ? `<div class="box"><h4>🎯 Al terminar sabrás</h4><ul class="obj">${l.obj.map(o => `<li>${CL.inline(o)}</li>`).join('')}</ul></div>` : ''}
      ${l.theory ? `<h2>📖 Teoría</h2>${CL.md(l.theory)}` : ''}
      ${l.steps?.length ? `<h2>🛠 Paso a paso</h2><div class="steps">${l.steps.map(s => `
        <div class="step"><h4>${CL.inline(s[0])}</h4>${s[1] ? CL.code(s[1]) : ''}${s[2] ? `<div class="exp">${CL.md(s[2])}</div>` : ''}</div>`).join('')}</div>` : ''}
      ${l.defense ? `<h2>🛡 Cómo defenderse y prevenirlo</h2><div class="box">${CL.md(l.defense)}</div>` : ''}
      ${l.quiz?.length ? `<h2>🧠 Comprueba lo aprendido</h2><div class="quiz">${l.quiz.map((q, qi) => `
        <div class="box" data-q="${qi}"><b>${CL.inline(q[0])}</b><div class="row" style="margin-top:8px">${q[1].map((o, oi) => `<button class="sm" data-o="${oi}">${CL.inline(o)}</button>`).join('')}</div><div class="why small" style="margin-top:8px"></div></div>`).join('')}</div>` : ''}
      ${l.challenge ? `<h2>🏁 Reto</h2><div class="box" style="border-color:var(--c)">${CL.md(l.challenge)}</div>` : ''}
      ${l.refs?.length ? `<h2>📚 Para profundizar</h2><ul>${l.refs.map(r => `<li><a href="${CL.esc(r[1])}" target="_blank" rel="noopener noreferrer">${CL.esc(r[0])}</a></li>`).join('')}</ul>` : ''}
      <h2>📝 Mis apuntes</h2>
      <textarea id="note" placeholder="Tus notas sobre esta lección (se guardan solas en ~/.local/share/ciberlab3)…">${CL.esc(CL.state.notes[l.id] || '')}</textarea>
      <div class="donebar ${done ? 'ok' : ''}"><span>${done ? '✅ Lección completada' + (CL.state.done[l.id] ? ' el ' + CL.state.done[l.id] : '') : '¿Has hecho el paso a paso y el reto?'}</span><span class="spacer"></span>
        <button class="${done ? '' : 'pri'}" id="done">${done ? 'Marcar como pendiente' : 'Marcar como completada ✓'}</button></div>
      <div class="lessonnav">${prev ? `<a class="btn" href="#/${areaId}/${prev.id}">← ${CL.esc(prev.t)}</a>` : '<span></span>'}
        ${next ? `<a class="btn" href="#/${areaId}/${next.id}">${CL.esc(next.t)} →</a>` : ''}</div>`;
    content.scrollTop = 0;
    CL.$('#note', wrap).addEventListener('input', e => CL.saveNote(l.id, e.target.value));
    CL.$('#done', wrap).onclick = async () => {
      try {
        await CL.setDone(l.id, !done);
        if (!done) CL.toast('¡Bien! +1 lección completada');
        CL.renderArea(root, areaId, sub);
        if (!done && next) setTimeout(() => CL.$('.lessonnav a:last-child', root)?.focus(), 50);
      } catch (e) { CL.toast(e.message, true); }
    };
    CL.$$('.quiz [data-q]', wrap).forEach(box => {
      const q = l.quiz[+box.dataset.q];
      CL.$$('button', box).forEach(b => b.onclick = () => {
        const ok = +b.dataset.o === q[2];
        CL.$$('button', box).forEach(x => { x.disabled = true; if (+x.dataset.o === q[2]) x.style.borderColor = 'var(--green)'; });
        if (!ok) b.style.borderColor = 'var(--red)';
        CL.$('.why', box).innerHTML = (ok ? '<span class="ok">✔ Correcto.</span> ' : '<span class="bad">✘ No.</span> ') + CL.inline(q[3] || '');
      });
    });
  }
};
