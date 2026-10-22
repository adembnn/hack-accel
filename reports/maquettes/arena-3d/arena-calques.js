// Calques propres à l'Adidas Arena, posés sur la vue de la session Châtelet (index.html repris tel quel, style D).
// Même langage visuel : textures dessinées dans un canvas avec tex() et noisy() de index.html, pas de photo.
// 1) l'Arena d'après le vrai plan NP2F (scene.reel : murs épais, aire, gymnase, tribunes, vomitoires, socle, terrasse, volume haut)
// 2) barre des niveaux (coupe horizontale de l'Arena seule). Les leviers sont gérés par ../commun/regie-ui.js.
// Paramètres d'URL : ?embed=1 (sans panneaux) &cam=x,y,z,tx,ty,tz &lv=0..4
(function () {
  const QP = new URLSearchParams(location.search);
  if (QP.get('embed')) document.querySelectorAll('.pn').forEach(e => e.style.display = 'none');

  // ---------- Matériaux dessinés, palette du style D ----------
  const cv = (w, h, draw, rx, ry) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return tex(c, rx, ry); };
  const M = {
    enduit: cv(128, 128, (x, w, h) => { x.fillStyle = '#ebe5d9'; x.fillRect(0, 0, w, h); noisy(x, w, h, 0, 7); }),
    sol: cv(128, 128, (x, w, h) => { x.fillStyle = '#d8d0c1'; x.fillRect(0, 0, w, h); noisy(x, w, h, 0, 8); x.strokeStyle = 'rgba(120,108,92,.35)'; x.lineWidth = 1.5; for (let i = 0; i <= w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }),
    gradin: cv(64, 64, (x, w, h) => { x.fillStyle = '#cfc7b8'; x.fillRect(0, 0, w, h); noisy(x, w, h, 0, 8); }),
    bois: cv(128, 128, (x, w, h) => { for (let r = 0; r < h; r += 10) { const k = 160 + Math.random() * 30; x.fillStyle = `rgb(${k},${k * .74 | 0},${k * .5 | 0})`; x.fillRect(0, r, w, 9); } noisy(x, w, h, 0, 8); }),
    alu: cv(128, 128, (x, w, h) => { x.fillStyle = '#d4d8db'; x.fillRect(0, 0, w, h); noisy(x, w, h, 0, 5); x.fillStyle = 'rgba(80,88,96,.35)'; for (let i = 0; i < w; i += 32) x.fillRect(i, 0, 2, h); x.fillRect(0, 0, w, 2); }),
    vitre: cv(128, 128, (x, w, h) => { x.fillStyle = 'rgba(150,185,205,.55)'; x.fillRect(0, 0, w, h); x.fillStyle = '#9a7146'; for (let i = 0; i < w; i += 16) x.fillRect(i, 0, 4, h); x.fillStyle = 'rgba(40,46,52,.8)'; x.fillRect(0, h / 2 - 2, w, 3); }),
    toit: cv(128, 128, (x, w, h) => { x.fillStyle = '#7fa05a'; x.fillRect(0, 0, w, h); noisy(x, w, h, 0, 30); }),
    parking: cv(128, 128, (x, w, h) => { x.fillStyle = '#8d8a84'; x.fillRect(0, 0, w, h); noisy(x, w, h, 0, 14); x.fillStyle = '#f1efe9'; for (let i = 0; i < w; i += 32) x.fillRect(i, 0, 2, h * .45); }),
  };
  const CLIP = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e4); rnd.localClippingEnabled = true;
  const mat = o => new THREE.MeshStandardMaterial(Object.assign({roughness: .9, metalness: 0, side: THREE.DoubleSide, clippingPlanes: [CLIP]}, o));
  const q2 = q => [[q[0], q[1]], [q[2], q[3]], [q[4], q[5]], [q[6], q[7]]];

  function slab(pts, y, m, scale, holes) {
    const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
    (holes || []).forEach(hp => sh.holes.push(new THREE.Path(hp.map(([x, z]) => new THREE.Vector2(x, z)))));
    const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2); g.translate(0, y, 0);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / scale, uv.getY(i) / scale);
    const m3 = new THREE.Mesh(g, m); m3.receiveShadow = true; return m3;
  }
  function prisms(polys, y0, y1, side, cap, uScale) { // murs épais : faces latérales + dessus foncé comme un plan coupé
    const P = [], U = [], C = [];
    polys.forEach(pts => {
      let acc = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .01) continue;
        const u0 = acc / uScale, u1 = (acc + L) / uScale; acc += L;
        P.push(a[0], y0, a[1], b[0], y0, b[1], b[0], y1, b[1], a[0], y0, a[1], b[0], y1, b[1], a[0], y1, a[1]);
        U.push(u0, y0 / uScale, u1, y0 / uScale, u1, y1 / uScale, u0, y0 / uScale, u1, y1 / uScale, u0, y1 / uScale);
      }
      if (cap && pts.length === 4) C.push(pts[0][0], y1, pts[0][1], pts[1][0], y1, pts[1][1], pts[2][0], y1, pts[2][1], pts[0][0], y1, pts[0][1], pts[2][0], y1, pts[2][1], pts[3][0], y1, pts[3][1]);
    });
    const grp = new THREE.Group(), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, side); m.castShadow = m.receiveShadow = true; grp.add(m);
    if (C.length) { const gc = new THREE.BufferGeometry(); gc.setAttribute('position', new THREE.Float32BufferAttribute(C, 3)); gc.computeVertexNormals(); grp.add(new THREE.Mesh(gc, cap)); }
    return grp;
  }
  function courtTex(kind) { // terrain dessiné : basket 28 x 15 ou hand 40 x 20, parquet clair
    return cv(1024, 548, (x, w, h) => {
      for (let r = 0; r < h; r += 12) for (let c = -(r % 48); c < w; c += 48) { const k = 214 + Math.random() * 20; x.fillStyle = `rgb(${k},${k * .8 | 0},${k * .56 | 0})`; x.fillRect(c, r, 47, 11); }
      x.strokeStyle = '#f7f5f0'; x.lineWidth = 5; x.strokeRect(10, 10, w - 20, h - 20); x.beginPath(); x.moveTo(w / 2, 10); x.lineTo(w / 2, h - 10); x.stroke(); x.beginPath(); x.arc(w / 2, h / 2, 64, 0, 7); x.stroke();
      if (kind === 'basket') { x.fillStyle = 'rgba(29,70,150,.6)'; [[10, h / 2 - 90, 210, 180], [w - 220, h / 2 - 90, 210, 180]].forEach(r => { x.fillRect(...r); x.strokeRect(...r); });
        x.beginPath(); x.arc(68, h / 2, 245, -1.25, 1.25); x.stroke(); x.beginPath(); x.arc(w - 68, h / 2, 245, Math.PI - 1.25, Math.PI + 1.25); x.stroke(); }
      else { x.strokeStyle = '#2b5ba8'; x.beginPath(); x.arc(10, h / 2, 150, -1.57, 1.57); x.stroke(); x.beginPath(); x.arc(w - 10, h / 2, 150, 1.57, 4.71); x.stroke(); }
    });
  }
  function quadMesh(q, y, map) {
    const p = q2(q), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([p[0][0], y, p[0][1], p[1][0], y, p[1][1], p[2][0], y, p[2][1], p[0][0], y, p[0][1], p[2][0], y, p[2][1], p[3][0], y, p[3][1]], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat({map})); m.receiveShadow = true; return m;
  }
  function stands(t) { // rangs entre la ligne côté terrain et la ligne du fond : marche + contremarche, sièges noirs
    const P = [], L = [], lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    const I = [[t.inner[0], t.inner[1]], [t.inner[2], t.inner[3]]], O = [[t.outer[0], t.outer[1]], [t.outer[2], t.outer[3]]];
    for (let r = 0; r < t.rows; r++) {
      const f0 = r / t.rows, f1 = (r + 1) / t.rows, h = t.y0 + r * t.rise, hb = r ? h - t.rise : (t.l >= 2 ? h - 1.2 : 0);
      const a0 = lerp(I[0], O[0], f0), b0 = lerp(I[1], O[1], f0), a1 = lerp(I[0], O[0], f1), b1 = lerp(I[1], O[1], f1);
      P.push(a0[0], h, a0[1], b0[0], h, b0[1], b1[0], h, b1[1], a0[0], h, a0[1], b1[0], h, b1[1], a1[0], h, a1[1]);
      P.push(a0[0], hb, a0[1], b0[0], hb, b0[1], b0[0], h, b0[1], a0[0], hb, a0[1], b0[0], h, b0[1], a0[0], h, a0[1]);
      const sa = lerp(a0, a1, .55), sb = lerp(b0, b1, .55); L.push(sa[0], h + .45, sa[1], sb[0], h + .45, sb[1]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    const uv = []; for (let i = 0; i < P.length; i += 3) uv.push((P[i] + P[i + 1]) / 3, P[i + 2] / 3); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    const grp = new THREE.Group(), m = new THREE.Mesh(g, mat({map: M.gradin})); m.castShadow = m.receiveShadow = true;
    m.userData.info = {type: 'Tribune', nom: t.n, places: '≈ ' + t.places, rangs: t.rows, source: t.e ? "estimé d'après la coupe AA (NP2F)" : 'plan NP2F calé sur OSM'}; pick.push(m); grp.add(m);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    grp.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({color: 0x1d1d1f, clippingPlanes: [CLIP]})));
    return grp;
  }
  function label(t, x, y, z) {
    const c = document.createElement('canvas'), k = c.getContext('2d'); k.font = '600 44px system-ui,sans-serif'; const w = Math.ceil(k.measureText(t).width) + 28;
    c.width = w; c.height = 64; k.font = '600 44px system-ui,sans-serif'; k.fillStyle = 'rgba(250,247,240,.9)'; k.fillRect(0, 0, w, 64); k.fillStyle = '#1D1F1E'; k.fillText(t, 14, 46);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), depthTest: false, transparent: true}));
    s.scale.set(w / 64 * 3.2, 3.2, 1); s.position.set(x, y, z); s.userData.label = 1; return s;
  }

  G.reel = new THREE.Group(); scene.add(G.reel);
  function buildReel() {
    G.reel.clear(); const R = SCN.reel; if (!R) return;
    const fp = pairs(SCN._arena.p), vh = q2(R.volume_haut);
    const park = slab(q2(R.parking), R.parking_y, mat({map: M.parking}), 6); G.reel.add(park);
    G.reel.add(slab(fp, .04, mat({map: M.sol}), 4));
    G.reel.add(prisms(R.murs.map(q2), 0, R.hauteur_rdc, mat({map: M.enduit}), mat({color: 0x3a3631}), 3));
    G.reel.add(quadMesh(R.aire, .07, cv(128, 128, (x, w, h) => { x.fillStyle = '#c99a62'; x.fillRect(0, 0, w, h); noisy(x, w, h, 0, 10); })));
    G.reel.add(quadMesh(R.basket, .09, courtTex('basket')));
    G.reel.add(quadMesh(R.gymnase, .07, courtTex('hand')));
    R.tribunes.forEach(t => G.reel.add(stands(t)));
    G.reel.add(prisms([fp], 0, R.terrasse_y, mat({map: M.vitre, transparent: true, opacity: .8, depthWrite: false}), null, 8));
    G.reel.add(slab(fp, R.terrasse_y, mat({map: M.bois}), 4, [vh]));
    G.reel.add(prisms([vh], R.terrasse_y, R.haut_y, mat({map: M.alu}), null, 8));
    const roof = slab(vh, R.haut_y, mat({map: M.toit}), 6); roof.userData.roof = 1; G.reel.add(roof);
    const c = q => [(q[0] + q[4]) / 2, (q[1] + q[5]) / 2];
    G.reel.add(label('AIRE DE JEU', c(R.aire)[0], 3, c(R.aire)[1]));
    G.reel.add(label('GYMNASE AIMÉE LALLEMENT', c(R.gymnase)[0] - 10, 7, c(R.gymnase)[1]));
    G.reel.add(label('ENTRÉE PUBLIQUE', R.entree.p[0] + 8, 8, R.entree.p[1] + 6));
    R.tribunes.forEach(t => { if (!/mobiles/.test(t.n)) G.reel.add(label(t.n.toUpperCase(), (t.outer[0] + t.outer[2]) / 2 - 8, t.y0 + t.rows * t.rise + 3, (t.outer[1] + t.outer[3]) / 2)); });
    R.vomitoires.forEach(v => { const g = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat({color: 0xC98A12})); g.position.set((v.p[0] + v.p[2]) / 2, 2.5, (v.p[1] + v.p[3]) / 2); g.scale.set(v.w, 5, v.w); g.userData.info = {type: 'Vomitoire', nom: v.n, largeur: v.w + ' m (estimé)'}; pick.push(g); G.reel.add(g); });
  }

  // ---------- Barre des niveaux ----------
  const LV = [['Toit', 1e4], ['Terrasse 11,5 m', 13.5], ['Balcons', 11], ['Rez-de-chaussée', 5.4], ['Parking −1', -.4]];
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;bottom:52px;transform:translateX(-50%);display:flex;background:#1D1F1E;border-radius:4px;overflow:hidden;font:600 14px system-ui,sans-serif;z-index:5';
  LV.forEach(([n], i) => { const b = document.createElement('button'); b.textContent = n; b.style.cssText = 'all:unset;cursor:pointer;padding:9px 14px;color:#EDEBE6'; b.onclick = () => setLevel(i); b.dataset.lv = i; bar.appendChild(b); });
  document.body.appendChild(bar);
  function setLevel(i) {
    CLIP.constant = LV[i][1];
    bar.querySelectorAll('button').forEach(b => { const on = +b.dataset.lv === i; b.style.background = on ? '#EDEBE6' : 'transparent'; b.style.color = on ? '#1D1F1E' : '#EDEBE6'; });
    G.reel.traverse(o => { if (o.userData.roof) o.visible = i === 0; if (o.userData.label) o.visible = i === 2 || i === 3; });
    G.surface.visible = G.rues.visible = LV[i][1] >= 0; rnd.shadowMap.needsUpdate = true;
  }
  window.setLevel = setLevel;

  // Leviers : dessinés et cliquables par ../commun/regie-ui.js (module commun avec la vue Châtelet)

  // ---------- Branchement sur rebuild() de index.html ----------
  const baseRebuild = rebuild;
  rebuild = function () {
    if (SCN.reel && !SCN._arena) { // le vrai plan remplace l'Arena OSM et l'intérieur estimé
      SCN._arena = SCN.batiments.find(b => /Adidas Arena/i.test(b.n || ''));
      SCN.batiments = SCN.batiments.filter(b => b !== SCN._arena);
      SCN.interieur = SCN.interieur.filter(o => !o.e); SCN.portes = SCN.portes.filter(o => !o.e); SCN.escaliers = SCN.escaliers.filter(o => !o.e); SCN.gradins = [];
    }
    baseRebuild(); buildReel();
    const c = QP.get('cam'); if (c && !SCN._camSet) { SCN._camSet = 1; const v = c.split(',').map(Number); camGo(v.slice(0, 3), v.slice(3, 6)); }
    setLevel(+(QP.get('lv') || 2));
  };
})();
