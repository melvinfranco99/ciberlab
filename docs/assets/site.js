/* CiberLab — web: tema claro/oscuro, reproductor de vídeos guiados y glosarios */
'use strict';

/* ---------------- tema (por defecto oscuro; se recuerda la elección) */
(() => {
  const btn = document.getElementById('theme');
  if (!btn) return;
  const label = () => { const d = document.documentElement.dataset.theme === 'dark'; btn.textContent = d ? '☀ Claro' : '☾ Oscuro'; btn.setAttribute('aria-label', d ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); };
  label();
  btn.addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('cl-theme', t); } catch { /* sin almacenamiento */ }
    label();
  });
})();

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inl = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');

/* ---------------- maquetas para las escenas de los vídeos */
const M = window.VPM = {
  win: (title, body, cls = '') => `<div class="vp-win ${cls}"><div class="vp-bar"><i></i><i></i><i></i><span>${esc(title)}</span></div><div class="vp-body">${body}</div></div>`,
  browser: (url, body) => `<div class="vp-win vp-browser"><div class="vp-bar"><i></i><i></i><i></i><span class="vp-url" id="vp-url">${esc(url)}</span></div><div class="vp-body vp-page">${body}</div></div>`,
  btn: (label, id, cls = '') => `<span class="vp-btn ${cls}" id="${id}">${esc(label)}</span>`,
  input: (id, ph = '', val = '') => `<span class="vp-input" id="${id}" data-ph="${esc(ph)}">${esc(val)}</span>`,
  table: (head, rows, id = '') => `<table class="vp-table" ${id ? `id="${id}"` : ''}><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  polybar: (on = '') => `<div class="vp-polybar"><span class="ws"><b>1</b> 2 3 4 5 6 7 8</span><span class="sp"></span>
    <span class="env"><span title="normal" class="${on === 'normal' ? 'on' : ''}">▣</span><span title="privado">◐</span><span title="paranoico">⛨</span><span title="finanzas">$</span>
    <span id="skull" class="skull ${on === 'cyber' ? 'on' : ''}" title="CiberLab N1">☠</span><span id="skull2" class="skull2 ${on === 'cyber2' ? 'on' : ''}" title="CiberLab N2">☠²</span></span><span class="clock">10:42</span></div>`,
  app: (nav, body, n2 = false) => `<div class="vp-app ${n2 ? 'n2' : ''}"><div class="vp-apptop"><b>Ciber<span>Lab</span>${n2 ? '<i>N2</i>' : ''}</b>${nav.map((x, i) => `<span class="${i === 0 ? 'on' : ''}">${esc(x)}</span>`).join('')}</div><div class="vp-appbody">${body}</div></div>`,
  chip: (t, cls = '') => `<span class="vp-chip ${cls}">${esc(t)}</span>`,
};

/* ---------------- reproductor */
class VideoPlayer {
  constructor(root, video) {
    this.root = root; this.v = video; this.i = 0; this.playing = false; this.speed = 1; this.voice = false; this.run = 0;
    root.innerHTML = `<div class="vp-stage" tabindex="0" aria-label="Vídeo: ${esc(video.title)}">
        <div class="vp-screen"></div><div class="vp-cursor" aria-hidden="true"></div>
        <div class="vp-cap" aria-live="polite"></div>
        <button class="vp-big" aria-label="Reproducir">▶</button></div>
      <div class="vp-ctrl">
        <button class="vp-play" aria-label="Reproducir">▶</button>
        <button class="vp-prev" aria-label="Paso anterior">⏮</button><button class="vp-next" aria-label="Paso siguiente">⏭</button>
        <div class="vp-prog" role="slider" aria-label="Progreso" aria-valuemin="0" aria-valuemax="${video.scenes.length}"><div class="vp-fill"></div>${video.scenes.map((s, i) => `<span class="vp-mark" style="left:${i / video.scenes.length * 100}%" title="${esc(s.step || '')}"></span>`).join('')}</div>
        <span class="vp-time">1/${video.scenes.length}</span>
        <select class="vp-speed" aria-label="Velocidad"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select>
        <button class="vp-voice" aria-pressed="false" title="Narración por voz (síntesis del navegador)">🔈 Voz</button>
        <button class="vp-fs" aria-label="Pantalla completa">⛶</button>
      </div>
      <ol class="vp-chapters">${video.scenes.map((s, i) => `<li><button data-i="${i}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span><b>${esc(s.step || '')}</b> ${inl(s.say || '')}</span></button></li>`).join('')}</ol>`;
    this.$ = sel => root.querySelector(sel);
    this.screen = this.$('.vp-screen'); this.cursor = this.$('.vp-cursor'); this.cap = this.$('.vp-cap'); this.stage = this.$('.vp-stage');
    const toggle = () => this.playing ? this.pause() : this.play();
    this.$('.vp-play').onclick = toggle; this.$('.vp-big').onclick = toggle;
    this.stage.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); } if (e.key === 'ArrowRight') this.go(this.i + 1); if (e.key === 'ArrowLeft') this.go(this.i - 1); });
    this.$('.vp-prev').onclick = () => this.go(this.i - 1);
    this.$('.vp-next').onclick = () => this.go(this.i + 1);
    this.$('.vp-speed').onchange = e => { this.speed = +e.target.value; };
    this.$('.vp-voice').onclick = e => {
      if (!('speechSynthesis' in window)) { e.target.textContent = '🔇 Sin voz'; return; }
      this.voice = !this.voice; e.target.setAttribute('aria-pressed', this.voice); e.target.textContent = this.voice ? '🔊 Voz' : '🔈 Voz';
      if (!this.voice) speechSynthesis.cancel(); else if (this.playing) this.speak(this.v.scenes[this.i].say);
    };
    this.$('.vp-fs').onclick = () => { const el = this.root; (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.())?.catch?.(() => {}); };
    this.$('.vp-prog').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); this.go(Math.floor((e.clientX - r.left) / r.width * this.v.scenes.length)); };
    this.root.querySelectorAll('.vp-chapters button').forEach(b => b.onclick = () => { this.go(+b.dataset.i); if (!this.playing) this.play(); });
    this.render(0, true);
  }
  speak(text) {
    if (!this.voice || !text) return Promise.resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/`|\*/g, ''));
    u.lang = 'es-ES'; u.rate = Math.min(1.6, 1.02 * this.speed);
    const v = speechSynthesis.getVoices().find(x => /^es(-|_)ES/i.test(x.lang)) || speechSynthesis.getVoices().find(x => /^es/i.test(x.lang));
    if (v) u.voice = v;
    return new Promise(res => { u.onend = res; u.onerror = res; speechSynthesis.speak(u); this._utt = u; });
  }
  async sleep(ms, run) {   // respeta pausa, velocidad y cancelación
    let t = 0;
    while (t < ms) {
      if (run !== this.run) throw 'abort';
      await new Promise(r => setTimeout(r, 40));
      if (this.playing) t += 40 * this.speed;
    }
  }
  play() {
    this.playing = true; this.root.classList.add('playing');
    this.$('.vp-play').textContent = '⏸'; this.$('.vp-play').setAttribute('aria-label', 'Pausa');
    if (!this.loop) this.loop = this.start();
  }
  pause() {
    this.playing = false; this.root.classList.remove('playing');
    this.$('.vp-play').textContent = '▶'; this.$('.vp-play').setAttribute('aria-label', 'Reproducir');
    if (this.voice) speechSynthesis.cancel();
  }
  go(i) {
    i = Math.max(0, Math.min(this.v.scenes.length - 1, i));
    this.run++; this.loop = null;
    if (this.voice) speechSynthesis.cancel();
    this.render(i, true);
    if (this.playing) this.loop = this.start();
  }
  async start() {
    const run = this.run;
    try {
      while (this.i < this.v.scenes.length) {
        await this.scene(this.v.scenes[this.i], run);
        if (this.i === this.v.scenes.length - 1) break;
        this.render(this.i + 1);
      }
      this.pause(); this.loop = null; this.$('.vp-big').textContent = '↺'; this.done = true;
    } catch (e) { if (e !== 'abort') console.error(e); }
  }
  render(i, still) {
    this.i = i;
    const s = this.v.scenes[i];
    this.$('.vp-time').textContent = `${i + 1}/${this.v.scenes.length}`;
    this.$('.vp-fill').style.width = ((i + 1) / this.v.scenes.length * 100) + '%';
    this.root.querySelectorAll('.vp-chapters li').forEach((li, k) => li.classList.toggle('on', k === i));
    this.cap.innerHTML = `<b>${esc(s.step || '')}</b> ${inl(s.say || '')}`;
    this.cursor.classList.remove('show');
    if (this.done && still) { this.done = false; this.$('.vp-big').textContent = '▶'; }
    if (s.type === 'title') this.screen.innerHTML = `<div class="vp-title"><span>${esc(s.badge || this.v.badge || '')}</span><h3>${esc(s.h)}</h3><p>${inl(s.sub || '')}</p></div>`;
    else if (s.type === 'term') {
      const prev = this.screen.querySelector('.vp-term pre');
      const keep = s.keep && prev && !still ? prev.innerHTML : '';
      this.screen.innerHTML = M.win(s.title || 'zsh', `<pre class="vp-termpre">${keep}</pre>`, 'vp-term');
      if (still) this.screen.querySelector('pre').innerHTML = this.termStatic(s);
    } else this.screen.innerHTML = s.html || '';
    if (still && s.type !== 'term') this.applyStatic(s);
  }
  termStatic(s) {
    return (s.lines || []).map(l => l.c !== undefined ? `<span class="p">${esc(s.prompt || '$ ')}</span>${esc(l.c)}\n` : `<span class="o">${esc(l.o)}</span>\n`).join('');
  }
  applyStatic(s) {   // al saltar a una escena, muestra su estado final sin animación
    for (const a of s.actions || []) {
      if (a.html) { const el = this.screen.querySelector(a.html[0]); if (el) el.innerHTML = a.html[1]; }
      if (a.show) this.screen.querySelectorAll(a.show).forEach(el => el.classList.add('vis'));
      if (a.type) { const el = this.screen.querySelector(a.type[0]); if (el) el.textContent = a.type[1]; }
      if (a.cls) this.screen.querySelectorAll(a.cls[0]).forEach(el => el.classList.add(a.cls[1]));
      if (a.url) { const el = this.screen.querySelector('#vp-url'); if (el) el.textContent = a.url; }
    }
  }
  async scene(s, run) {
    const t0 = performance.now();
    const spoken = this.speak(s.say);
    if (s.type === 'term') {
      const pre = this.screen.querySelector('pre');
      for (const l of s.lines || []) {
        if (l.c !== undefined) {
          pre.insertAdjacentHTML('beforeend', `<span class="p">${esc(s.prompt || '$ ')}</span>`);
          const span = document.createElement('span'); pre.append(span);
          for (const ch of l.c) { span.textContent += ch; await this.sleep(l.c.length > 60 ? 14 : 32, run); }
          pre.append('\n'); await this.sleep(350, run);
        } else {
          for (const line of String(l.o).split('\n')) { pre.insertAdjacentHTML('beforeend', `<span class="o">${esc(line)}</span>\n`); pre.scrollTop = pre.scrollHeight; await this.sleep(70, run); }
          await this.sleep(300, run);
        }
        pre.scrollTop = pre.scrollHeight;
      }
    } else {
      for (const a of s.actions || []) await this.action(a, run);
    }
    const min = Math.max(1600, (s.say || '').length * 52);
    const elapsed = performance.now() - t0;
    if (elapsed < min) await this.sleep(min - elapsed, run);
    if (this.voice) await Promise.race([spoken, this.sleep(30000, run)]);
    await this.sleep(500, run);
  }
  async action(a, run) {
    const q = sel => this.screen.querySelector(sel);
    if (a.wait) return this.sleep(a.wait, run);
    if (a.click || a.point) {
      const el = q(a.click || a.point); if (!el) return;
      const sr = this.stage.getBoundingClientRect(), r = el.getBoundingClientRect();
      this.cursor.classList.add('show');
      this.cursor.style.left = (r.left - sr.left + r.width / 2) + 'px'; this.cursor.style.top = (r.top - sr.top + r.height / 2) + 'px';
      await this.sleep(850, run);
      if (a.click) { el.classList.add('vp-press'); this.cursor.classList.add('click'); await this.sleep(320, run); this.cursor.classList.remove('click'); el.classList.remove('vp-press'); }
      return this.sleep(200, run);
    }
    if (a.type) {
      const el = q(a.type[0]); if (!el) return;
      el.textContent = ''; el.classList.add('focus');
      for (const ch of a.type[1]) { el.textContent += ch; await this.sleep(45, run); }
      el.classList.remove('focus'); return this.sleep(250, run);
    }
    if (a.html) { const el = q(a.html[0]); if (el) el.innerHTML = a.html[1]; return this.sleep(200, run); }
    if (a.show) { for (const el of this.screen.querySelectorAll(a.show)) { el.classList.add('vis'); await this.sleep(a.gap || 260, run); } return; }
    if (a.cls) { this.screen.querySelectorAll(a.cls[0]).forEach(el => el.classList.add(a.cls[1])); return this.sleep(250, run); }
    if (a.url) { const el = q('#vp-url'); if (el) { el.textContent = ''; for (const ch of a.url) { el.textContent += ch; await this.sleep(30, run); } } return this.sleep(300, run); }
  }
}

document.querySelectorAll('[data-video]').forEach(el => {
  const v = (window.VIDEOS || {})[el.dataset.video];
  if (v) new VideoPlayer(el, v);
  else el.innerHTML = '<p class="mut">Vídeo no disponible.</p>';
});

/* ---------------- glosario de términos y de comandos */
(() => {
  const box = document.getElementById('glist');
  if (!box) return;
  const kind = box.dataset.kind;
  const isCmd = kind === 'comandos';
  const isTool = kind === 'herramientas';
  const data = isCmd ? (window.CL?.commands || []) : isTool ? (window.CL?.tools || []) : (window.CL?.glossary || []);
  const LV = ['Principiante', 'Intermedio', 'Avanzado', 'Experto'];
  const f = { q: '', n: 0, cat: '', lvl: -1 };
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const catOf = x => isCmd ? x.area : x.cat;
  const cats = [...new Set(data.map(catOf))].sort((a, b) => a.localeCompare(b, 'es'));
  const fc = document.getElementById('fcat');
  fc.innerHTML = `<button data-v="" class="on">Todas las áreas</button>` + cats.map(c => `<button data-v="${esc(c)}">${esc(c)}</button>`).join('');
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
  const draw = () => {
    const q = norm(f.q);
    const txtOf = x => isTool ? [x.t, x.what, x.why, x.ex, x.cat, x.pkg].join(' ')
      : isCmd ? [x.c, x.what, x.why, x.ex, x.area].join(' ') : [x.t, x.d, x.ex, x.cat].join(' ');
    const list = data.filter(x => (!f.n || x.n === f.n) && (!f.cat || catOf(x) === f.cat) && (!isCmd || f.lvl < 0 || x.lvl === f.lvl) &&
      (!q || norm(txtOf(x)).includes(q)));
    document.getElementById('gcount').textContent = `${list.length} de ${data.length}`;
    if (!list.length) { box.innerHTML = '<p class="mut">Nada coincide con la búsqueda.</p>'; return; }
    if (isTool) {
      box.innerHTML = [...list].sort((a, b) => b.imp - a.imp || a.t.localeCompare(b.t, 'es')).map(x => `
        <article class="gi" id="${esc('t-' + x.t)}"><header><h3>${esc(x.t)}</h3><span class="stars" title="Importancia ${x.imp} de 5">${stars(x.imp)}</span><span class="tag">${esc(x.cat)}</span><span class="tag">N${x.n}</span></header>
        <p><b>Qué es:</b> ${inl(x.what)}</p><p><b>Para qué sirve:</b> ${inl(x.why)}</p><p class="ex">Instalar: <code>${esc(x.pkg)}</code></p>
        ${x.ex ? `<div class="term"><div class="bar"><i></i><i></i><i></i><span>ejemplo</span></div><pre>${esc(x.ex)}</pre></div>` : ''}</article>`).join('');
    } else if (isCmd) {
      box.innerHTML = LV.map((lv, li) => {
        const it = list.filter(x => x.lvl === li).sort((a, b) => b.imp - a.imp || a.c.localeCompare(b.c));
        return it.length ? `<h2 class="glv">${lv} <span>${it.length}</span></h2>` + it.map(x => `
          <article class="gi" id="${esc('c-' + x.c)}"><header><h3><code>${esc(x.c)}</code></h3><span class="stars" title="Importancia ${x.imp} de 5">${stars(x.imp)}</span><span class="tag">${esc(x.area)}</span><span class="tag">N${x.n}</span></header>
          <p><b>Qué significa:</b> ${inl(x.what)}</p><p><b>Para qué sirve:</b> ${inl(x.why)}</p>
          ${x.ex ? `<div class="term"><div class="bar"><i></i><i></i><i></i><span>ejemplo</span></div><pre>${esc(x.ex)}</pre></div>` : ''}</article>`).join('') : '';
      }).join('');
    } else {
      let last = '';
      box.innerHTML = [...list].sort((a, b) => a.t.localeCompare(b.t, 'es', { sensitivity: 'base' })).map(x => {
        const L = norm(x.t)[0].toUpperCase(), head = L !== last ? `<div class="gletter">${/[A-Z]/.test(L) ? L : '#'}</div>` : '';
        last = L;
        return `${head}<article class="gi" id="${esc('g-' + x.t)}"><header><h3>${esc(x.t)}</h3><span class="tag">${esc(x.cat)}</span><span class="tag">N${x.n}</span></header>
          <p>${inl(x.d)}</p>${x.ex ? `<p class="ex">Ejemplo: ${inl(x.ex)}</p>` : ''}</article>`;
      }).join('');
    }
  };
  const bind = (id, key, conv) => { const el = document.getElementById(id); if (el) el.onclick = e => { const b = e.target.closest('button'); if (!b) return; f[key] = conv(b.dataset.v); el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); }; };
  bind('fn', 'n', Number); bind('flv', 'lvl', Number); bind('fcat', 'cat', String);
  let t; document.getElementById('gq').oninput = e => { clearTimeout(t); t = setTimeout(() => { f.q = e.target.value; draw(); }, 120); };
  draw();
  if (location.hash) setTimeout(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'center' }), 50);
})();
