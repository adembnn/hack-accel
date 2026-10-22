// Mur de caméras du Forum : une vignette par niveau (0 à -5) et 3 caméras de sortie (les portes les plus chargées).
// Chaque vignette est rendue avec le MÊME renderer que la vue 3D (scissor/viewport), juste AVANT le rendu principal,
// puis recopiée dans un petit canvas 2D (le rendu principal efface ensuite tout). Rafraîchi à ~10 images/s.
// Isolation d'un niveau : deux plans de coupe horizontaux globaux autour de alt(niveau). Ne modifie rien d'autre dans la page.
(function () {
  'use strict';
  if (window.__mursCameras) return; window.__mursCameras = true;
  const W = 260, H = 162, FPS = 10, NEXIT = 3;
  let on = false, tiles = [], box, grid, btn, lastRender = 0, lastStat = 0, lastExit = -1e9, lastCenter = -1e9, patched = false;

  function ready() {
    try { return typeof THREE !== 'undefined' && typeof rnd !== 'undefined' && typeof scene !== 'undefined' && typeof cam !== 'undefined'
      && typeof SIM !== 'undefined' && SIM.g && SIM.groups && typeof silBody !== 'undefined' && silBody && typeof alt === 'function'; } catch (e) { return false; }
  }
  const lvAlt = i => alt(SIM.g.levels[i]);
  const cellXZ = c => [SIM.g.bbox[0] + (c[2] + .5) * SIM.g.res, SIM.g.bbox[1] + (c[1] + .5) * SIM.g.res];
  const live = a => a && !a.out && !a.ride;

  function css() {
    const s = document.createElement('style');
    s.textContent = `
#camWall{position:fixed;right:12px;top:12px;bottom:64px;width:${2 * W + 22}px;overflow-y:auto;z-index:20;display:none;font:12px system-ui,sans-serif;padding:4px;background:rgba(29,31,30,.82);border-radius:8px}
#camWall.on{display:block}
#camWall .grid{display:grid;grid-template-columns:${W}px ${W}px;gap:6px}
#camWall .tile{position:relative;width:${W}px;height:${H}px;background:#000;cursor:pointer;overflow:hidden;border-radius:4px;outline:1px solid #444}
#camWall .tile:hover{outline:2px solid #fff}
#camWall canvas{width:100%;height:100%;display:block}
#camWall .tile::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.45) 100%)}
#camWall .cap{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:3px 6px;background:rgba(0,0,0,.65);color:#fff;font-size:11px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#camWall .cap b{font-weight:700}
#camWall .rec{position:absolute;right:6px;top:5px;z-index:2;color:#fff;font-size:10px;letter-spacing:.08em;text-shadow:0 0 3px #000}
#camWall .rec i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#e0261f;margin-right:4px;animation:camrec 1.2s steps(2) infinite}
@keyframes camrec{50%{opacity:.15}}
#camBtn{position:fixed;right:12px;bottom:14px;z-index:21;background:#1D1F1E;color:#fff;border:0;border-radius:6px;padding:8px 12px;font:13px system-ui,sans-serif;cursor:pointer}
#camBtn.on{background:#e0261f}`;
    document.head.appendChild(s);
  }

  function mkTile(kind, i) {
    const el = document.createElement('div'); el.className = 'tile';
    const pr = rnd.getPixelRatio();
    const cv = document.createElement('canvas'); cv.width = Math.round(W * pr); cv.height = Math.round(H * pr);
    const cap = document.createElement('div'); cap.className = 'cap';
    const rec = document.createElement('div'); rec.className = 'rec'; rec.innerHTML = '<i></i>REC';
    el.append(cv, cap, rec);
    const t = { kind, i, el, cv, ctx: cv.getContext('2d'), cap, cam: new THREE.PerspectiveCamera(42, W / H, .5, 600),
      x: 0, z: 0, lv: i, cx: 0, cz: 0, span: 70, name: '', n: 0, dmax: 0, group: -1 };
    el.onclick = () => fly(t);
    return t;
  }

  function build() {
    css();
    box = document.createElement('div'); box.id = 'camWall';
    grid = document.createElement('div'); grid.className = 'grid'; box.appendChild(grid);
    for (let k = 0; k < NEXIT; k++) tiles.push(mkTile('exit', k));
    SIM.g.levels.forEach((_, i) => { const t = mkTile('lvl', i); t.name = 'Niveau ' + SIM.g.levels[i]; tiles.push(t); });
    tiles.forEach((t, k) => { t.num = k + 1; grid.appendChild(t.el); });
    document.body.appendChild(box);
    btn = document.createElement('button'); btn.id = 'camBtn'; btn.textContent = 'Caméras';
    btn.onclick = () => { on = !on; box.classList.toggle('on', on); btn.classList.toggle('on', on); if (on) { lastCenter = lastExit = lastStat = -1e9; refresh(performance.now()); } };
    document.body.appendChild(btn);
    patch();
  }

  // Quelles sorties sont les plus chargées (personnes à moins de 25 m, même niveau), choix rafraîchi toutes les 5 s
  function pickExits() {
    const A = SIM.A; if (!A) return;
    const res = [];
    SIM.groups.forEach((G, k) => {
      if (G.type === 'train') return;
      let best = null, bn = -1;
      const cells = G.cells.length > 60 ? G.cells.filter((_, j) => j % Math.ceil(G.cells.length / 60) === 0) : G.cells;
      for (const e of cells) {
        const [x, z] = cellXZ(e.cell), l = e.cell[0]; let n = 0;
        for (const a of A) if (live(a) && a.l === l && Math.abs(a.x - x) < 25 && Math.abs(a.z - z) < 25 && Math.hypot(a.x - x, a.z - z) < 25) n++;
        if (n > bn) { bn = n; best = { x, z, l, n }; }
      }
      if (best) res.push({ k, name: G.n, ...best });
    });
    res.sort((a, b) => b.n - a.n);
    tiles.filter(t => t.kind === 'exit').forEach((t, j) => {
      const r = res[j]; if (!r) { t.group = -1; return; }
      t.group = r.k; t.name = r.name; t.lv = r.l; t.x = r.x; t.z = r.z; t.cx = r.x; t.cz = r.z; t.span = 30;
    });
  }

  // Centre de chaque niveau : voisinage 3x3 (cases de 20 m) le plus peuplé
  function centers() {
    const g = SIM.g, by = g.levels.map(() => new Map());
    for (const a of SIM.A) if (live(a)) { const m = by[a.l], k = Math.floor(a.x / 20) + ',' + Math.floor(a.z / 20); let c = m.get(k); if (!c) m.set(k, c = []); c.push(a); }
    tiles.filter(t => t.kind === 'lvl').forEach(t => {
      const m = by[t.i]; let bs = 0, bx = (g.bbox[0] + g.bbox[2]) / 2, bz = (g.bbox[1] + g.bbox[3]) / 2;
      for (const k of m.keys()) {
        const [ix, iz] = k.split(',').map(Number); let sx = 0, sz = 0, n = 0;
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = m.get((ix + dx) + ',' + (iz + dz)); if (c) for (const a of c) { sx += a.x; sz += a.z; n++; } }
        if (n > bs) { bs = n; bx = sx / n; bz = sz / n; }
      }
      const f = t.init ? .35 : 1; t.init = true; t.cx += (bx - t.cx) * f; t.cz += (bz - t.cz) * f; t.x = t.cx; t.z = t.cz; t.span = 46; t.lv = t.i;
    });
  }

  function stats() {
    const A = SIM.A; if (!A) return;
    tiles.forEach(t => {
      if (t.kind === 'exit' && t.group < 0) { t.n = 0; t.dmax = 0; t.cap.innerHTML = `<b>CAM ${t.num} · sortie</b> — en attente`; return; }
      const m = new Map(); let n = 0, dm = 0;
      for (const a of A) {
        if (!live(a) || a.l !== t.lv) continue;
        if (t.kind === 'exit' && Math.hypot(a.x - t.x, a.z - t.z) > 25) continue;
        n++; const k = Math.floor(a.x) * 10007 + Math.floor(a.z), v = (m.get(k) || 0) + 1; m.set(k, v); if (v > dm) dm = v;
      }
      t.n = n; t.dmax = dm;
      t.cap.innerHTML = `<b>CAM ${t.num} · ${t.name}</b> — ${n} pers. · densité max ${dm}/m²`;
    });
  }

  function refresh(now) {
    if (!SIM.A) return;
    if (now - lastExit > 5000) { lastExit = now; try { pickExits(); } catch (e) {} }
    if (now - lastCenter > 1000) { lastCenter = now; try { centers(); } catch (e) {} }
    if (now - lastStat > 500) { lastStat = now; try { stats(); } catch (e) {} }
  }

  function placeCam(t) {
    const y = lvAlt(t.lv), c = t.cam, d = t.span * .9;   // vue plongeante à ~60°, champ de 36 à 70 m
    c.position.set(t.cx, y + d * .85, t.cz + d * .5); c.lookAt(t.cx, y + .8, t.cz); c.updateMatrixWorld();
  }

  const DARK = new THREE.Color(0x1b1d1c);
  const planes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)];
  function renderTiles(orig) {
    const br = box.getBoundingClientRect(), pr = rnd.getPixelRatio();
    const prevBg = scene.background, prevFog = scene.fog, prevClip = rnd.clippingPlanes, prevVp = new THREE.Vector4(), prevSc = new THREE.Vector4(), prevTest = rnd.getScissorTest();
    rnd.getViewport(prevVp); rnd.getScissor(prevSc);
    rnd.setScissorTest(true); scene.background = DARK; scene.fog = null;   // fond sombre : les silhouettes ressortent
    try {
      for (const t of tiles) {
        if (t.kind === 'exit' && t.group < 0) continue;
        const r = t.el.getBoundingClientRect();
        if (r.bottom < br.top || r.top > br.bottom) continue;       // vignette hors de la zone visible
        const y = lvAlt(t.lv);
        planes[0].constant = -(y - .35); planes[1].constant = y + 3.1;   // garde [y-0,35 ; y+3,1] : sol, personnes, mobilier
        rnd.clippingPlanes = planes;
        placeCam(t);
        rnd.setViewport(0, 0, W, H); rnd.setScissor(0, 0, W, H);
        orig.call(rnd, scene, t.cam);
        t.ctx.drawImage(rnd.domElement, 0, rnd.domElement.height - Math.round(H * pr), Math.round(W * pr), Math.round(H * pr), 0, 0, t.cv.width, t.cv.height);
      }
    } finally {
      scene.background = prevBg; scene.fog = prevFog; rnd.clippingPlanes = prevClip; rnd.setScissorTest(prevTest); rnd.setViewport(prevVp); rnd.setScissor(prevSc);
    }
  }

  function patch() {
    if (patched) return; patched = true;
    const orig = rnd.render;
    rnd.render = function (sc, c) {
      try {
        if (on && c === cam && SIM.A) {
          const now = performance.now();
          if (now - lastRender >= 1000 / FPS) { lastRender = now; refresh(now); renderTiles(orig); }
        }
      } catch (e) { on = false; console.warn('murs-cameras : désactivé', e); }
      return orig.apply(this, arguments);
    };
  }

  function fly(t) {
    try {
      const y = lvAlt(t.lv), d = t.kind === 'exit' ? 45 : 70;
      cam.position.set(t.cx, y + d, t.cz + d * .8);
      if (typeof ctl !== 'undefined' && ctl && ctl.target) { ctl.target.set(t.cx, y, t.cz); ctl.update(); } else cam.lookAt(t.cx, y, t.cz);
    } catch (e) {}
  }

  let tries = 0;
  (function wait() {
    try { if (ready()) { build(); return; } } catch (e) { console.warn('murs-cameras', e); return; }
    if (++tries < 400) setTimeout(wait, 300);
  })();
})();
