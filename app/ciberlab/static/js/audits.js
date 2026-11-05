/* Escritorio 8 (2ª ventana) — gestor de auditorías */
'use strict';

/* ---------- CVSS 3.1 (base) */
CL.cvss = (() => {
  const W = {
    AV: { N: .85, A: .62, L: .55, P: .2 }, AC: { L: .77, H: .44 }, UI: { N: .85, R: .62 },
    C: { H: .56, L: .22, N: 0 }, I: { H: .56, L: .22, N: 0 }, A: { H: .56, L: .22, N: 0 },
  };
  const up = x => { const i = Math.round(x * 100000); return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10; };
  const parse = v => Object.fromEntries((v || '').replace(/^CVSS:3\.[01]\//, '').split('/').map(p => p.split(':')).filter(p => p.length === 2));
  const score = vec => {
    const m = parse(vec);
    if (!['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'].every(k => m[k])) return null;
    const ch = m.S === 'C';
    const PR = { N: .85, L: ch ? .68 : .62, H: ch ? .5 : .27 }[m.PR];
    const iss = 1 - (1 - W.C[m.C]) * (1 - W.I[m.I]) * (1 - W.A[m.A]);
    const imp = ch ? 7.52 * (iss - .029) - 3.25 * Math.pow(iss - .02, 15) : 6.42 * iss;
    const ex = 8.22 * W.AV[m.AV] * W.AC[m.AC] * PR * W.UI[m.UI];
    if (imp <= 0) return 0;
    return up(Math.min((ch ? 1.08 : 1) * (imp + ex), 10));
  };
  const sev = s => s == null ? '' : s === 0 ? 'info' : s < 4 ? 'baja' : s < 7 ? 'media' : s < 9 ? 'alta' : 'critica';
  return { score, sev, parse };
})();

CL.views.audits = (root, id, tab) => {
  const c = CL.prog('auditorias').c;
  const T = CL.audit;
  root.innerHTML = `<div class="area" style="--c:${c}"><aside class="side">
    <h2>📋 Auditorías</h2><div class="sub">Expedientes en <code>~/CiberLab/auditorias</code></div>
    <button class="pri" id="new" style="margin:0 8px 12px">＋ Nueva auditoría</button>
    <div class="audlist" id="al" style="padding:0 6px"><span class="mut small">Cargando…</span></div>
    <div class="tools">${T.guides.map(g => `<a href="#/auditorias/guia/${g.id}" class="${id === 'guia' && tab === g.id ? 'on' : ''}">${g.t}</a>`).join('')}
      <a href="#" id="openfolder">📁 Abrir carpeta de auditorías</a></div>
  </aside><section class="content"><div class="wrap"></div></section></div>`;
  const wrap = CL.$('.wrap', root);

  CL.$('#openfolder', root).onclick = e => { e.preventDefault(); CL.api('/api/open', { what: 'folder', arg: 'auditorias' }).catch(er => CL.toast(er.message, true)); };
  CL.$('#new', root).onclick = async () => {
    const name = await CL.prompt2('Nombre del cliente / proyecto', '');
    if (!name) return;
    const tipo = await CL.choose('Tipo de organización', ['pyme', 'gran empresa'], 'pyme');
    if (!tipo) return;
    const a = { cliente: name, tipo, estado: 'planificación', inicio: new Date().toISOString().slice(0, 10), fin: '', auditor: '',
      alcance: { tipo_prueba: 'caja gris' }, autorizacion: {}, checklist: {}, hallazgos: [] };
    try { const r = await CL.api('/api/audit', a); location.hash = `#/auditorias/${r.id}/datos`; } catch (e) { CL.toast(e.message, true); }
  };

  CL.api('/api/audits').then(r => {
    CL.$('#al', root).innerHTML = r.audits.length ? r.audits.map(a => `<a href="#/auditorias/${a.id}" class="${a.id === id ? 'on' : ''}">
      <span><b>${CL.esc(a.cliente || 'sin nombre')}</b><br><span class="small mut">${CL.esc(a.tipo || '')} · ${CL.esc(a.estado || '')}</span></span>
      <span class="small mono mut">${a.hallazgos} hall.</span></a>`).join('') : '<p class="small mut" style="padding:0 6px">Todavía no hay auditorías. Empieza con una de práctica contra tu propio laboratorio.</p>';
  }).catch(e => CL.$('#al', root).textContent = e.message);

  if (id === 'guia') { const g = T.guides.find(x => x.id === tab) || T.guides[0]; wrap.innerHTML = CL.md(g.md); return; }
  if (!id) { wrap.innerHTML = CL.md(T.intro); return; }

  let A = null, dirty = false;
  const save = CL.debounce(async () => {
    try { const r = await CL.api('/api/audit', A); A.updated = r.updated; dirty = false; const s = CL.$('#saved', wrap); if (s) s.textContent = 'Guardado ' + r.updated; }
    catch (e) { CL.toast('No se pudo guardar: ' + e.message, true); }
  }, 700);
  const touch = () => { dirty = true; const s = CL.$('#saved', wrap); if (s) s.textContent = 'Guardando…'; save(); };

  CL.api('/api/audit?id=' + id).then(a => { A = a; A.alcance ||= {}; A.autorizacion ||= {}; A.checklist ||= {}; A.hallazgos ||= []; render(tab || 'datos'); })
    .catch(e => wrap.innerHTML = `<p class="bad">${CL.esc(e.message)}</p>`);

  function render(t) {
    const tabs = [['datos', '🏢 Datos y alcance'], ['autorizacion', '✍ Autorización'], ['checklist', '☑ Checklist'], ['hallazgos', '🐞 Hallazgos'], ['informe', '📄 Informe']];
    const sevCount = A.hallazgos.reduce((m, h) => (m[h.sev] = (m[h.sev] || 0) + 1, m), {});
    wrap.innerHTML = `<div class="row noprint"><h1 style="margin:0">${CL.esc(A.cliente)}</h1><span class="chip">${CL.esc(A.tipo)}</span><span class="chip">${CL.esc(A.estado)}</span><span class="spacer"></span>
      <span class="small mut" id="saved">${A.updated ? 'Guardado ' + A.updated : ''}</span><button class="sm red" id="del">Archivar</button></div>
      <div class="row small noprint" style="margin-top:6px;gap:6px">${['critica', 'alta', 'media', 'baja', 'info'].map(s => sevCount[s] ? `<span class="chip sev-${s}">${sevCount[s]} ${s}</span>` : '').join('')}</div>
      <div class="tabs noprint">${tabs.map(x => `<a href="#/auditorias/${A.id}/${x[0]}"><button class="${x[0] === t ? 'on' : ''}">${x[1]}</button></a>`).join('')}</div>
      <div class="tabpane" id="pane"></div>`;
    CL.$('#del', wrap).onclick = async () => {
      if (!await CL.confirm2('Se moverá a ~/CiberLab/auditorias/.papelera (no se borra). ¿Archivar?')) return;
      await CL.api('/api/audit/delete', { id: A.id }); location.hash = '#/auditorias';
    };
    ({ datos, autorizacion, checklist, hallazgos, informe }[t] || datos)(CL.$('#pane', wrap));
  }

  /* bind genérico: data-k="ruta.a.campo" */
  function bind(el) {
    CL.$$('[data-k]', el).forEach(inp => {
      const path = inp.dataset.k.split('.');
      let o = A; for (const p of path.slice(0, -1)) o = o[p] ||= {};
      const k = path.at(-1);
      if (inp.type === 'checkbox') inp.checked = !!o[k]; else inp.value = o[k] ?? '';
      inp.addEventListener(inp.tagName === 'SELECT' || inp.type === 'checkbox' ? 'change' : 'input', () => {
        o[k] = inp.type === 'checkbox' ? inp.checked : inp.value; touch();
      });
    });
  }

  function datos(p) {
    p.innerHTML = `<div class="grid g3" style="margin-top:14px">
      <label class="f">Cliente<input data-k="cliente"></label>
      <label class="f">Sector<input data-k="sector" placeholder="sanidad, retail, industria…"></label>
      <label class="f">Tipo<select data-k="tipo"><option>pyme</option><option>gran empresa</option></select></label>
      <label class="f">Contacto del cliente<input data-k="contacto" placeholder="nombre, cargo, teléfono de emergencia"></label>
      <label class="f">Auditor(es)<input data-k="auditor"></label>
      <label class="f">Estado<select data-k="estado">${['planificación', 'en curso', 'informe', 'retest', 'cerrada'].map(x => `<option>${x}</option>`).join('')}</select></label>
      <label class="f">Inicio<input type="date" data-k="inicio"></label>
      <label class="f">Fin<input type="date" data-k="fin"></label>
      <label class="f">Tipo de prueba<select data-k="alcance.tipo_prueba"><option>caja negra</option><option>caja gris</option><option>caja blanca</option></select></label>
    </div>
    <h3>Servicios contratados</h3>
    <div class="row">${T.services.map(s => `<label class="chip"><input type="checkbox" data-k="servicios.${s[0]}"> ${s[1]}</label>`).join('')}</div>
    <div class="grid g2" style="margin-top:14px">
      <label class="f">✅ Dentro del alcance (IPs, rangos, dominios, URLs, apps, sedes)<textarea data-k="alcance.incluido" placeholder="203.0.113.0/28&#10;https://app.cliente.es&#10;Oficina central (WiFi corporativa)"></textarea></label>
      <label class="f">⛔ Fuera del alcance<textarea data-k="alcance.excluido" placeholder="Servidores de producción de pagos&#10;Proveedor de hosting compartido&#10;Ingeniería social a dirección"></textarea></label>
      <label class="f">🕒 Ventanas horarias y restricciones<textarea data-k="alcance.ventanas" placeholder="Lunes a jueves 20:00‑07:00&#10;Sin pruebas de denegación de servicio&#10;Sin explotación destructiva"></textarea></label>
      <label class="f">🔑 Credenciales / cuentas proporcionadas<textarea data-k="alcance.credenciales" placeholder="usuario de pruebas sin privilegios: auditor01 (NO guardes contraseñas aquí: usa un gestor como KeePassXC)"></textarea></label>
    </div>
    <label class="f" style="margin-top:12px">Notas internas<textarea data-k="notas" style="min-height:160px"></textarea></label>
    <h3>Metodología (resumen para la auditoría ${CL.esc(A.tipo)})</h3>${CL.md(A.tipo === 'pyme' ? T.method_pyme : T.method_gran)}`;
    bind(p);
  }

  function autorizacion(p) {
    const fill = s => s.replace(/\{(\w+(?:\.\w+)?)\}/g, (_, k) => {
      const v = k.split('.').reduce((o, x) => o?.[x], A);
      return v ? String(v) : `[${k.toUpperCase()}]`;
    });
    p.innerHTML = `<blockquote class="danger"><p>⛔ <b>Sin este documento firmado no se toca nada.</b> La autorización debe firmarla alguien con capacidad real de decidir sobre los sistemas (dirección/CTO/CISO) y, si hay terceros (hosting, cloud, MSP), también su permiso o el de sus políticas de pentesting.</p></blockquote>
      <div class="grid g3"><label class="f">Firmante del cliente<input data-k="autorizacion.firmante"></label><label class="f">Cargo<input data-k="autorizacion.cargo"></label>
        <label class="f">Fecha de firma<input type="date" data-k="autorizacion.fecha"></label></div>
      <div class="row" style="margin:12px 0"><label class="chip"><input type="checkbox" data-k="autorizacion.firmada"> Autorización firmada y archivada</label>
        <label class="chip"><input type="checkbox" data-k="autorizacion.nda"> NDA firmado</label><label class="chip"><input type="checkbox" data-k="autorizacion.terceros"> Permisos de terceros (cloud/hosting)</label>
        <label class="chip"><input type="checkbox" data-k="autorizacion.contactos"> Contactos de emergencia acordados</label></div>
      <div class="row"><h3 style="margin:0">Plantilla de autorización y reglas de enfrentamiento</h3><span class="spacer"></span><button id="cp">Copiar texto</button><button id="dl">⬇ Descargar .md</button></div>
      <div class="box" id="doc">${CL.md(fill(T.authorization))}</div>`;
    bind(p);
    CL.$('#cp', p).onclick = () => CL.copy(fill(T.authorization));
    CL.$('#dl', p).onclick = () => download(`autorizacion-${slug(A.cliente)}.md`, fill(T.authorization));
  }

  function checklist(p) {
    const who = A.tipo === 'pyme' ? 'pyme' : 'gran';
    const groups = T.checklist.map(g => ({ ...g, items: g.items.filter(i => !i.only || i.only === who) }));
    const all = groups.flatMap(g => g.items);
    const st = k => A.checklist[k] || '';
    const count = v => all.filter(i => st(i.id) === v).length;
    p.innerHTML = `<div class="row" style="margin:12px 0"><span class="chip ok">✔ ${count('ok')} cumple</span><span class="chip bad">✘ ${count('fallo')} falla</span>
      <span class="chip warnc">◐ ${count('parcial')} parcial</span><span class="chip">${count('na')} N/A</span><span class="chip">${all.length - count('ok') - count('fallo') - count('parcial') - count('na')} pendientes</span>
      <span class="spacer"></span><span class="small mut">Checklist adaptada a <b>${CL.esc(A.tipo)}</b>. Un «falla» se convierte en hallazgo con un clic.</span></div>
      ${groups.map(g => `<h3>${CL.esc(g.t)}</h3>${g.items.map(i => `<div class="chk"><select data-c="${i.id}">
        ${[['', '—'], ['ok', '✔ cumple'], ['parcial', '◐ parcial'], ['fallo', '✘ falla'], ['na', 'N/A']].map(o => `<option value="${o[0]}" ${st(i.id) === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>
        <div class="d">${CL.inline(i.t)}<small>${CL.inline(i.how || '')}</small></div>
        ${st(i.id) === 'fallo' || st(i.id) === 'parcial' ? `<button class="sm" data-f="${i.id}">→ hallazgo</button>` : ''}</div>`).join('')}`).join('')}`;
    CL.$$('select[data-c]', p).forEach(s => s.onchange = () => { A.checklist[s.dataset.c] = s.value; touch(); checklist(p); });
    CL.$$('[data-f]', p).forEach(b => b.onclick = () => {
      const i = all.find(x => x.id === b.dataset.f);
      A.hallazgos.push({ id: Date.now().toString(36), titulo: i.t.replace(/[*`]/g, ''), sev: i.sev || 'media', cvss: '', activo: '', descripcion: i.how || '',
        evidencia: '', impacto: '', recomendacion: i.fix || '', estado: 'abierto', ref: i.ref || '' });
      touch(); CL.toast('Hallazgo creado'); location.hash = `#/auditorias/${A.id}/hallazgos`;
    });
  }

  function hallazgos(p) {
    const order = { critica: 0, alta: 1, media: 2, baja: 3, info: 4 };
    A.hallazgos.sort((a, b) => order[a.sev] - order[b.sev]);
    p.innerHTML = `<div class="row" style="margin:12px 0"><button class="pri" id="add">＋ Añadir hallazgo</button><select id="fromv"><option value="">…o desde el catálogo de vulnerabilidades</option>
      ${CL.vulns.map(v => `<option value="${v.id}">${CL.esc(v.name)}</option>`).join('')}</select></div>
      ${A.hallazgos.length ? '' : '<p class="mut">Sin hallazgos todavía.</p>'}
      ${A.hallazgos.map((h, i) => {
        const sc = CL.cvss.score(h.cvss);
        return `<details class="box" ${h._open ? 'open' : ''} data-i="${i}"><summary class="row" style="cursor:pointer">
          <span class="chip sev-${h.sev}">${h.sev}</span><b>${CL.esc(h.titulo || 'Sin título')}</b><span class="spacer"></span>
          ${sc != null ? `<span class="mono small">CVSS ${sc}</span>` : ''}<span class="chip">${CL.esc(h.estado)}</span></summary>
          <div class="grid g3" style="margin-top:12px">
            <label class="f" style="grid-column:span 2">Título<input data-h="titulo"></label>
            <label class="f">Estado<select data-h="estado"><option>abierto</option><option>corregido</option><option>riesgo aceptado</option><option>falso positivo</option></select></label>
            <label class="f">Activo(s) afectado(s)<input data-h="activo" placeholder="192.168.1.10, https://…"></label>
            <label class="f">Severidad<select data-h="sev">${['critica', 'alta', 'media', 'baja', 'info'].map(s => `<option>${s}</option>`).join('')}</select></label>
            <label class="f">Referencia (CWE/CVE/OWASP)<input data-h="ref"></label>
          </div>
          <div class="box" style="background:var(--bg2)"><b class="small mono">Calculadora CVSS 3.1</b>
            <div class="cvss" style="margin-top:8px">${cvssSelects(h.cvss)}</div>
            <div class="row" style="margin-top:8px"><input data-h="cvss" style="flex:1;font-family:var(--mono)" placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H">
              <span class="score" style="color:var(--${{ critica: 'red', alta: 'orange', media: 'amber', baja: 'green' }[CL.cvss.sev(sc)] || 'mut'})">${sc ?? '—'}</span></div></div>
          <label class="f">Descripción<textarea data-h="descripcion"></textarea></label>
          <label class="f">Evidencia (pasos para reproducir, petición/respuesta, capturas en ~/CiberLab/loot)<textarea data-h="evidencia"></textarea></label>
          <label class="f">Impacto para el negocio<textarea data-h="impacto" style="min-height:70px"></textarea></label>
          <label class="f">Recomendación<textarea data-h="recomendacion"></textarea></label>
          <div class="row" style="margin-top:8px"><span class="spacer"></span><button class="sm red" data-del>Eliminar hallazgo</button></div>
        </details>`;
      }).join('')}`;
    CL.$$('details[data-i]', p).forEach(d => {
      const h = A.hallazgos[+d.dataset.i];
      d.addEventListener('toggle', () => { h._open = d.open; });
      CL.$$('[data-h]', d).forEach(inp => {
        inp.value = h[inp.dataset.h] ?? '';
        inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', () => {
          h[inp.dataset.h] = inp.value; touch();
          if (inp.dataset.h === 'cvss') { const s = CL.cvss.score(inp.value); if (s != null) { h.sev = CL.cvss.sev(s); } d.querySelector('.score').textContent = s ?? '—'; }
          if (inp.dataset.h === 'sev' || inp.dataset.h === 'estado') hallazgos(p);
        });
      });
      CL.$$('[data-cv]', d).forEach(s => s.onchange = () => {
        const m = { AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'N', I: 'N', A: 'N', ...CL.cvss.parse(h.cvss) };
        m[s.dataset.cv] = s.value;
        h.cvss = 'CVSS:3.1/' + ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'].map(k => `${k}:${m[k]}`).join('/');
        h.sev = CL.cvss.sev(CL.cvss.score(h.cvss)); h._open = true; touch(); hallazgos(p);
      });
      CL.$('[data-del]', d).onclick = async () => { if (await CL.confirm2('¿Eliminar este hallazgo?')) { A.hallazgos.splice(+d.dataset.i, 1); touch(); hallazgos(p); } };
    });
    CL.$('#add', p).onclick = () => { A.hallazgos.unshift({ id: Date.now().toString(36), titulo: '', sev: 'media', cvss: '', estado: 'abierto', _open: true }); touch(); hallazgos(p); };
    CL.$('#fromv', p).onchange = e => {
      const v = CL.vulns.find(x => x.id === e.target.value); if (!v) return;
      A.hallazgos.unshift({ id: Date.now().toString(36), titulo: v.name, sev: v.sev, cvss: v.cvss || '', estado: 'abierto', ref: [v.cwe, v.owasp].filter(Boolean).join(' · '),
        descripcion: v.sum, impacto: strip(v.impact || ''), recomendacion: strip(v.defense || '').slice(0, 1500), _open: true });
      touch(); hallazgos(p);
    };
  }
  function cvssSelects(vec) {
    const m = { AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'N', I: 'N', A: 'N', ...CL.cvss.parse(vec) };
    const opts = { AV: [['N', 'Red'], ['A', 'Adyacente'], ['L', 'Local'], ['P', 'Física']], AC: [['L', 'Baja'], ['H', 'Alta']], PR: [['N', 'Ninguno'], ['L', 'Bajos'], ['H', 'Altos']],
      UI: [['N', 'Ninguna'], ['R', 'Requerida']], S: [['U', 'Sin cambio'], ['C', 'Cambia']], C: [['N', 'Ninguno'], ['L', 'Bajo'], ['H', 'Alto']], I: [['N', 'Ninguno'], ['L', 'Bajo'], ['H', 'Alto']], A: [['N', 'Ninguno'], ['L', 'Bajo'], ['H', 'Alto']] };
    const lab = { AV: 'Vector de ataque', AC: 'Complejidad', PR: 'Privilegios', UI: 'Interacción usuario', S: 'Alcance', C: 'Confidencialidad', I: 'Integridad', A: 'Disponibilidad' };
    return Object.keys(opts).map(k => `<label class="f">${lab[k]}<select data-cv="${k}">${opts[k].map(o => `<option value="${o[0]}" ${m[k] === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>`).join('');
  }

  function reportMd() {
    const H = A.hallazgos.filter(h => h.estado !== 'falso positivo');
    const cnt = s => H.filter(h => h.sev === s).length;
    const who = A.tipo === 'pyme' ? 'pyme' : 'gran';
    const ck = T.checklist.flatMap(g => g.items.filter(i => !i.only || i.only === who).map(i => ({ ...i, g: g.t })));
    const sv = A.servicios ? T.services.filter(s => A.servicios[s[0]]).map(s => s[1]).join(', ') : '';
    return `# Informe de auditoría de seguridad — ${A.cliente}

| | |
|---|---|
| **Cliente** | ${A.cliente}${A.sector ? ' (' + A.sector + ')' : ''} |
| **Tipo de prueba** | ${A.alcance.tipo_prueba || '—'}${sv ? ' · ' + sv : ''} |
| **Periodo** | ${A.inicio || '—'} → ${A.fin || '—'} |
| **Auditor(es)** | ${A.auditor || '—'} |
| **Autorización** | ${A.autorizacion.firmada ? `Firmada por ${A.autorizacion.firmante || '—'} (${A.autorizacion.cargo || '—'}) el ${A.autorizacion.fecha || '—'}` : '⚠ PENDIENTE'} |
| **Clasificación** | CONFIDENCIAL — solo para ${A.cliente} |

## 1. Resumen ejecutivo

Durante el periodo indicado se evaluó la seguridad de los activos acordados en el alcance. Se identificaron **${H.length} hallazgos**: ${cnt('critica')} críticos, ${cnt('alta')} altos, ${cnt('media')} medios, ${cnt('baja')} bajos y ${cnt('info')} informativos.

${cnt('critica') + cnt('alta') ? `Los hallazgos **críticos y altos** permitirían a un atacante comprometer información o sistemas relevantes y deben corregirse con prioridad (objetivo recomendado: críticos < 7 días, altos < 30 días).` : 'No se identificaron hallazgos de severidad crítica o alta.'}

**Principales riesgos:**
${H.slice(0, 5).map(h => `- **[${h.sev.toUpperCase()}]** ${h.titulo}${h.impacto ? ' — ' + h.impacto.split('\n')[0] : ''}`).join('\n') || '- —'}

## 2. Alcance y metodología

**Dentro del alcance:**
${(A.alcance.incluido || '—').split('\n').map(x => '- ' + x).join('\n')}

**Fuera del alcance:**
${(A.alcance.excluido || '—').split('\n').map(x => '- ' + x).join('\n')}

**Restricciones:** ${(A.alcance.ventanas || '—').replace(/\n/g, '; ')}

Metodología basada en OWASP WSTG, PTES, NIST SP 800‑115 y OSSTMM. Severidad calculada con CVSS 3.1 y ajustada al contexto del negocio.

## 3. Resumen de hallazgos

| # | Hallazgo | Severidad | CVSS | Activo | Estado |
|---|---|---|---|---|---|
${H.map((h, i) => `| ${i + 1} | ${h.titulo} | ${h.sev} | ${CL.cvss.score(h.cvss) ?? '—'} | ${(h.activo || '—').replace(/\|/g, '/')} | ${h.estado} |`).join('\n')}

## 4. Detalle de hallazgos

${H.map((h, i) => `### 4.${i + 1} ${h.titulo}

| Severidad | CVSS | Activo | Referencia |
|---|---|---|---|
| ${h.sev} | ${CL.cvss.score(h.cvss) ?? '—'} ${h.cvss ? '`' + h.cvss + '`' : ''} | ${h.activo || '—'} | ${h.ref || '—'} |

**Descripción.** ${h.descripcion || '—'}

**Evidencia.**
${h.evidencia ? '```\n' + h.evidencia + '\n```' : '—'}

**Impacto.** ${h.impacto || '—'}

**Recomendación.** ${h.recomendacion || '—'}
`).join('\n')}

## 5. Estado de controles (checklist)

| Área | Control | Resultado |
|---|---|---|
${ck.filter(i => A.checklist[i.id]).map(i => `| ${i.g} | ${i.t.replace(/[*`|]/g, '')} | ${{ ok: '✔ Cumple', fallo: '✘ No cumple', parcial: '◐ Parcial', na: 'N/A' }[A.checklist[i.id]]} |`).join('\n')}

## 6. Plan de acción recomendado

${['critica', 'alta', 'media', 'baja'].map(s => H.filter(h => h.sev === s && h.estado === 'abierto').length ? `- **${{ critica: 'Inmediato (< 7 días)', alta: 'Corto plazo (< 30 días)', media: 'Medio plazo (< 90 días)', baja: 'Planificado' }[s]}:** ${H.filter(h => h.sev === s && h.estado === 'abierto').map(h => h.titulo).join('; ')}` : '').filter(Boolean).join('\n') || '- —'}
- Repetir la prueba (retest) tras aplicar las correcciones para verificar su eficacia.

---
*Este informe refleja el estado de los sistemas en las fechas de la prueba. Una auditoría no garantiza la ausencia de otras vulnerabilidades.*
`;
  }

  function informe(p) {
    const md = reportMd();
    p.innerHTML = `<div class="row noprint" style="margin:12px 0"><button class="pri" id="pr">🖨 Imprimir / guardar PDF</button><button id="md">⬇ Markdown</button><button id="html">⬇ HTML</button>
      <span class="small mut">Revisa y completa el texto: el informe se genera a partir de los datos, la checklist y los hallazgos.</span></div>
      ${A.autorizacion.firmada ? '' : '<blockquote class="danger noprint"><p>⛔ La autorización no está marcada como firmada.</p></blockquote>'}
      <div class="box" id="rep" style="background:#fff;color:#111">${CL.md(md)}</div>`;
    const rep = CL.$('#rep', p);
    rep.style.setProperty('--tx', '#111');
    CL.$$('h2,h3,strong,td,th,p,li', rep).forEach(e => e.style.color = '#111');
    CL.$$('th', rep).forEach(e => e.style.background = '#eef2f6');
    CL.$$('pre', rep).forEach(e => { e.style.background = '#f4f6f8'; e.querySelector('code').style.color = '#111'; e.querySelector('.cp')?.remove(); });
    CL.$('#pr', p).onclick = () => window.print();
    CL.$('#md', p).onclick = () => download(`informe-${slug(A.cliente)}.md`, md);
    CL.$('#html', p).onclick = () => download(`informe-${slug(A.cliente)}.html`, `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe ${CL.esc(A.cliente)}</title>
<style>body{font:15px/1.6 system-ui,sans-serif;max-width:900px;margin:40px auto;color:#111;padding:0 20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 9px;text-align:left}th{background:#eef2f6}pre{background:#f4f6f8;padding:10px;overflow:auto}h1{border-bottom:3px solid #111}h2{border-bottom:1px solid #ccc;margin-top:2em}.cp{display:none}</style></head><body>${CL.md(md)}</body></html>`, 'text/html');
  }

  function download(name, txt, type = 'text/markdown') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type }));
    a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    CL.toast(`${name} guardado en Descargas (muévelo a ~/CiberLab/informes)`);
  }
  const slug = s => String(s || 'cliente').toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  const strip = s => s.replace(/```[\s\S]*?```/g, '').replace(/[#>*`]/g, '').replace(/\n{3,}/g, '\n\n').trim();
};
