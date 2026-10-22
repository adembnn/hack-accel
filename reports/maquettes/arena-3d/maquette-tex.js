// Rendu « maquette d'architecte texturée » (?sty=M) : le quartier en carton blanc, l'Arena dans ses vrais matériaux
// (bardage aluminium et bois, d'après SOLIDEO), sols texturés (enrobé, trottoirs, parvis en dalles, pelouse), ombres du soleil.
// Remplace buildGround et buildBuildings de index.html quand le style M est actif. Textures dessinées dans un canvas : aucun fichier image.
(function () {
  STY.M = {bg: 0xEDEBE6, wall: 0xF3F1EC, wallOp: 1, edge: 0x8a877f, edgeOp: .35, floor: 0xbdb8ae, road: 0x6d6f70, ped: 0xd6d3cc,
    green: 0x9fb27e, water: 0x9db8c4, indoor: 0x5a554d, esc: 0xC98A12, stairs: 0x5a554d, lift: 0x2E6DB4, door: 0x1D1F1E,
    metro: 0x00995A, hyd: 0xC8102E, tree: 0xA9BC8A, people: 0x2a2a2a, ground: 0xE3E0D9, seat: 0x4f6d8f};
  if (S !== 'M') return;

  const maxAni = rnd.capabilities.getMaxAnisotropy();
  function tex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAni; return t;
  }
  function grain(x, w, h, base, amp, n) {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const d = Math.random() < .5 ? 0 : 255; x.fillStyle = `rgba(${d},${d},${d},${Math.random() * amp})`; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); }
  }
  const T = {
    asphalt: tex(256, 256, (x, w, h) => grain(x, w, h, '#707274', .14, 12000)),
    walk: tex(256, 256, (x, w, h) => { grain(x, w, h, '#d9d6cf', .06, 3000); x.strokeStyle = 'rgba(95,90,82,.28)'; x.lineWidth = 2; for (let i = 0; i <= w; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }),
    parvis: tex(256, 256, (x, w, h) => { grain(x, w, h, '#cdc6b9', .07, 4000); x.strokeStyle = 'rgba(80,72,60,.32)'; x.lineWidth = 1.5; for (let r = 0; r < h; r += 32) { const off = (r / 32) % 2 ? 48 : 0; x.beginPath(); x.moveTo(0, r); x.lineTo(w, r); x.stroke(); for (let c = -96 + off; c < w; c += 96) { x.beginPath(); x.moveTo(c, r); x.lineTo(c, r + 32); x.stroke(); } } }),
    grass: tex(256, 256, (x, w, h) => grain(x, w, h, '#a3b484', .2, 14000)),
    card: tex(128, 128, (x, w, h) => grain(x, w, h, '#f2f0ea', .045, 1200)),
    // Façade de l'Arena : bardage aluminium à joints verticaux en haut, lames de bois en bas (SOLIDEO : « aluminium lisse et bois »)
    facade: tex(512, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h * .62); g.addColorStop(0, '#d5d8da'); g.addColorStop(1, '#b9bdc0'); x.fillStyle = g; x.fillRect(0, 0, w, h * .62);
      for (let i = 0; i < w; i += 32) { x.fillStyle = 'rgba(60,64,68,.35)'; x.fillRect(i, 0, 2, h * .62); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(i + 2, 0, 1, h * .62); }
      x.fillStyle = '#9c7048'; x.fillRect(0, h * .62, w, h * .38);
      for (let i = 0; i < w; i += 9) { x.fillStyle = `rgba(${60 + Math.random() * 40},${35 + Math.random() * 25},15,${.25 + Math.random() * .3})`; x.fillRect(i, h * .62, 3, h * .38); }
      x.fillStyle = 'rgba(30,30,30,.55)'; x.fillRect(0, h * .615, w, 5);
    }),
  };

  // Textures photo CC0 (Poly Haven, textures/) et photo aérienne IGN (data/ortho.jpg, recuperer_ortho.py)
  const TL = new THREE.TextureLoader();
  const PH = (n, enc = true) => { const t = TL.load('textures/' + n + '.jpg', () => { needsFrame = 1; }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAni; if (enc) t.encoding = THREE.sRGBEncoding; return t; };
  let needsFrame = 0;
  const IMG = {enduit: PH('enduit'), parquet: PH('parquet'), terrazzo: PH('terrazzo'), beton: PH('beton'), deck: PH('deck'), bois: PH('bardage_bois'), herbe: PH('herbe'), parking: PH('parking'), dalles: PH('dalles')};
  let ORTHO = null, OB = {x0: -750, x1: 750, z0: -750, z1: 750};
  const orthoTex = TL.load('data/ortho.jpg', t => { ORTHO = t; t.encoding = THREE.sRGBEncoding; t.anisotropy = maxAni; if (SCN) rebuild(); }, undefined, () => {});
  fetch('data/ortho.json').then(r => r.json()).then(j => Object.assign(OB, j)).catch(() => {});
  const ouv = (x, z) => [(x - OB.x0) / (OB.x1 - OB.x0), 1 - (z - OB.z0) / (OB.z1 - OB.z0)];
  rnd.outputEncoding = THREE.sRGBEncoding; rnd.toneMapping = THREE.ACESFilmicToneMapping; rnd.toneMappingExposure = 1.05;

  function ribbon(pts, hw, y, ext) {
    const P = [], U = [];
    for (let i = 0; i < pts.length - 1; i++) {
      let [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < .01) continue;
      const ux = dx / L, uz = dz / L, nx = -uz * hw, nz = ux * hw;
      if (ext) { ax -= ux * ext; az -= uz * ext; bx += ux * ext; bz += uz * ext; }
      const LL = L + 2 * (ext || 0);
      P.push(ax + nx, y, az + nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz, ax + nx, y, az + nz, bx - nx, y, bz - nz, ax - nx, y, az - nz);
      U.push(0, 0, LL / 8, 0, LL / 8, 1, 0, 0, LL / 8, 1, 0, 1);
    }
    return [P, U];
  }
  function meshOf(P, U, mat, rs) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = rs !== false; return m;
  }
  function polyTex(p, y, mat, scale) {
    const pts = pairs(p); if (pts.length < 3) return null; let tri; try { tri = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []); } catch (e) { return null; }
    const P = [], U = []; tri.forEach(t => t.forEach(i => { P.push(pts[i][0], y, pts[i][1]); U.push(pts[i][0] / scale, pts[i][1] / scale); }));
    return meshOf(P, U, mat);
  }

  // Largeur de chaussée par type OSM (mètres, estimé) ; les voies piétonnes deviennent des trottoirs dallés
  const ROADW = {motorway: 22, trunk: 13, primary: 13, secondary: 10, tertiary: 8, unclassified: 6.5, residential: 6.5, living_street: 5, service: 4, motorway_link: 7, trunk_link: 7, primary_link: 7, secondary_link: 6, tertiary_link: 6};
  const WALKW = {footway: 2.6, pedestrian: 4, path: 2, cycleway: 2.2, steps: 2.5, corridor: 0};
  const MARK = {trunk: 1, primary: 1, secondary: 1, tertiary: 1, motorway: 1};

  buildGround = function () {
    G.surface.clear(); G.rues.clear();
    if (ORTHO) {
      const ph = new THREE.Mesh(new THREE.PlaneGeometry(OB.x1 - OB.x0, OB.z1 - OB.z0), new THREE.MeshLambertMaterial({map: ORTHO}));
      ph.rotation.x = -Math.PI / 2; ph.position.set((OB.x0 + OB.x1) / 2, 0, (OB.z0 + OB.z1) / 2); ph.receiveShadow = true; G.surface.add(ph);
      const out = new THREE.Mesh(new THREE.RingGeometry(1061, 2600, 4, 1, Math.PI / 4), new THREE.MeshLambertMaterial({color: 0xD8D6D0}));
      out.rotation.x = -Math.PI / 2; out.position.y = -.05; G.surface.add(out);
      G.arbres.visible = false; // les arbres sont sur la photo
      return;
    }
    const base = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2200), new THREE.MeshLambertMaterial({color: 0xE3E0D9, map: T.card}));
    T.card.repeat.set(200, 170); base.rotation.x = -Math.PI / 2; base.position.y = -.05; base.receiveShadow = true; G.surface.add(base);
    const mGrass = new THREE.MeshLambertMaterial({map: T.grass}), mPar = new THREE.MeshLambertMaterial({map: T.parvis}), mWalk = new THREE.MeshLambertMaterial({map: T.walk});
    SCN.verts.forEach(o => { const m = polyTex(o.p, .02, mGrass, 6); if (m) { m.userData.info = {type: 'Espace vert', nom: o.n}; G.rues.add(m); pick.push(m); } });
    SCN.pietons.forEach(o => { const m = polyTex(o.p, .05, mPar, 4); if (m) { m.userData.info = {type: 'Place piétonne', nom: o.n}; G.rues.add(m); pick.push(m); } });
    SCN.eau.forEach(o => { const m = polyTex(o.p, .03, new THREE.MeshLambertMaterial({color: 0x9db8c4}), 10); if (m) G.rues.add(m); });
    const side = [[], []], road = [[], []], walk = [[], []], mark = [[], []];
    SCN.rues.forEach(o => {
      const pts = pairs(o.p); if (pts.length < 2) return; if (Math.hypot(pts[0][0], pts[0][1]) > 900) return;
      const rw = ROADW[o.k], ww = WALKW[o.k];
      const add = (A, [P, U]) => { A[0].push(...P); A[1].push(...U); };
      if (rw) {
        add(road, ribbon(pts, rw / 2, .08, rw / 2));
        if (o.k !== 'motorway' && o.k !== 'trunk' && !/_link$/.test(o.k)) add(side, ribbon(pts, rw / 2 + 3, .06, rw / 2 + 3));
        if (MARK[o.k]) { // ligne médiane en tirets de 3 m tous les 10 m
          for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az); for (let s = 0; s + 3 < L; s += 10) { const f0 = s / L, f1 = (s + 3) / L; add(mark, ribbon([[ax + (bx - ax) * f0, az + (bz - az) * f0], [ax + (bx - ax) * f1, az + (bz - az) * f1]], .08, .1)); } }
        }
      } else if (ww) add(walk, ribbon(pts, ww / 2, .07, ww / 2));
    });
    G.rues.add(meshOf(side[0], side[1], mWalk));
    G.rues.add(meshOf(walk[0], walk[1], mWalk));
    G.rues.add(meshOf(road[0], road[1], new THREE.MeshLambertMaterial({map: T.asphalt})));
    G.rues.add(meshOf(mark[0], mark[1], new THREE.MeshBasicMaterial({color: 0xF4F2EC}), false));
  };

  buildBuildings = function () {
    G.batiments.clear(); bOwner = [[], []];
    const B = [0, 1].map(() => ({wp: [], wu: [], rp: [], ep: []}));
    SCN.batiments.forEach((b, bi) => {
      const pts = pairs(b.p); if (pts.length < 3) return;
      const arena = /Adidas Arena/i.test(b.n || ''), o = B[arena ? 1 : 0], h = b.h, y0 = b.b; let acc = 0;
      if (arena && SCN.reel) return; // l'Arena est construite par buildReel d'après le vrai plan
      for (let i = 0; i < pts.length; i++) {
        const [a, c] = [pts[i], pts[(i + 1) % pts.length]], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
        const u0 = acc / (arena ? 16 : 4), u1 = (acc + L) / (arena ? 16 : 4); acc += L;
        const v0 = arena ? 0 : y0 / 4, v1 = arena ? 1 : h / 4;
        o.wp.push(a[0], y0, a[1], c[0], y0, c[1], c[0], h, c[1], a[0], y0, a[1], c[0], h, c[1], a[0], h, a[1]);
        o.wu.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1); bOwner[arena ? 1 : 0].push(bi, bi);
        o.ep.push(a[0], h, a[1], c[0], h, c[1]); if (L > 6) o.ep.push(a[0], y0, a[1], a[0], h, a[1]);
      }
      if (arena) return; // maquette ouverte : toit de l'Arena retiré pour voir l'intérieur
      let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []); } catch (e) {}
      tri.forEach(t => t.forEach(i => { o.rp.push(pts[i][0], h, pts[i][1]); o.ru = o.ru || []; o.ru.push(...ouv(pts[i][0], pts[i][1])); }));
    });
    T.card.repeat.set(1, 1);
    B.forEach((o, k) => {
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(o.wp, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(o.wu, 2)); wg.computeVertexNormals();
      const w = new THREE.Mesh(wg, new THREE.MeshLambertMaterial(k ? {map: T.facade, side: THREE.DoubleSide} : {color: 0xF6F3EC, map: IMG.enduit, side: THREE.DoubleSide}));
      w.castShadow = true; w.receiveShadow = true; w.userData.kind = 'bat'; w.userData.owner = k; G.batiments.add(w); pick.push(w);
      if (o.rp.length) { const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(o.rp, 3)); rg.computeVertexNormals(); if (ORTHO) rg.setAttribute('uv', new THREE.Float32BufferAttribute(o.ru, 2)); const r = new THREE.Mesh(rg, new THREE.MeshLambertMaterial(ORTHO ? {map: ORTHO, side: THREE.DoubleSide} : {color: 0xE6E3DC, side: THREE.DoubleSide})); r.castShadow = true; r.receiveShadow = true; G.batiments.add(r); }
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(o.ep, 3));
      G.batiments.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({color: k ? 0x3a3c3e : 0x8a877f, transparent: true, opacity: k ? .8 : .45})));
    });
  };

  // Lumière de maquette : soleil d'après-midi, ombres douces
  rnd.shadowMap.enabled = true; rnd.shadowMap.type = THREE.PCFSoftShadowMap;
  sun.intensity = .75; sun.position.set(-260, 420, 180); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {left: -450, right: 450, top: 450, bottom: -450, near: 10, far: 1400}); sun.shadow.bias = -.0006; sun.shadow.camera.updateProjectionMatrix();
  hemi.color.set(0xffffff); hemi.groundColor.set(0xb9b4a8);
  // ---------- L'Arena d'après le vrai plan (scene.reel, plan_reel.py) ----------
  const T2 = {
    plaster: tex(128, 128, (x, w, h) => grain(x, w, h, '#ebe7df', .05, 1500)),
    terrazzo: tex(256, 256, (x, w, h) => { grain(x, w, h, '#dedad2', .04, 2000); for (let i = 0; i < 900; i++) { x.fillStyle = ['#b9b2a6', '#8f8a80', '#cfc6b5', '#a59b8a'][i % 4]; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3); } }),
    parquet: tex(256, 256, (x, w, h) => { for (let r = 0; r < h; r += 16) for (let c = -(r % 64); c < w; c += 64) { const k = 200 + Math.random() * 30; x.fillStyle = `rgb(${k},${k * .78 | 0},${k * .52 | 0})`; x.fillRect(c, r, 63, 15); } x.strokeStyle = 'rgba(90,60,30,.25)'; for (let r = 0; r < h; r += 16) { x.beginPath(); x.moveTo(0, r); x.lineTo(w, r); x.stroke(); } }),
    concrete: tex(256, 256, (x, w, h) => grain(x, w, h, '#a9a69f', .1, 8000)),
    deck: tex(256, 256, (x, w, h) => { for (let r = 0; r < h; r += 12) { const k = 150 + Math.random() * 40; x.fillStyle = `rgb(${k},${k * .72 | 0},${k * .48 | 0})`; x.fillRect(0, r, w, 11); } }),
    alu: tex(256, 256, (x, w, h) => { x.fillStyle = '#d3d6d8'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 64) { x.fillStyle = 'rgba(70,75,80,.4)'; x.fillRect(i, 0, 2, h); } for (let j = 0; j < h; j += 128) { x.fillStyle = 'rgba(70,75,80,.3)'; x.fillRect(0, j, w, 2); } }),
    glass: tex(256, 256, (x, w, h) => { x.fillStyle = 'rgba(160,190,200,.55)'; x.fillRect(0, 0, w, h); x.fillStyle = '#8a6440'; for (let i = 0; i < w; i += 32) x.fillRect(i, 0, 5, h); x.fillStyle = 'rgba(50,55,60,.8)'; x.fillRect(0, h / 2 - 2, w, 4); }),
    parking: tex(256, 256, (x, w, h) => { grain(x, w, h, '#8f8d88', .1, 6000); x.fillStyle = '#f2f0ea'; for (let i = 0; i < w; i += 64) x.fillRect(i, 0, 3, h * .45); }),
  };
  const CLIP = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e4); rnd.localClippingEnabled = true;
  const cm = (o) => new THREE.MeshLambertMaterial(Object.assign({side: THREE.DoubleSide, clippingPlanes: [CLIP]}, o));
  const q2 = (q) => [[q[0], q[1]], [q[2], q[3]], [q[4], q[5]], [q[6], q[7]]];
  function slab(pts, y, mat, scale, holes) {
    const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
    (holes || []).forEach(hp => sh.holes.push(new THREE.Path(hp.map(([x, z]) => new THREE.Vector2(x, z)))));
    const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2); g.translate(0, y, 0);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / scale, uv.getY(i) / scale);
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
  }
  function walls(polys, y0, y1, matSide, matCap, uScale) { // prismes : faces latérales texturées + dessus
    const P = [], U = [], C = [];
    polys.forEach(pts => {
      let acc = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .01) continue;
        const u0 = acc / uScale, u1 = (acc + L) / uScale; acc += L;
        P.push(a[0], y0, a[1], b[0], y0, b[1], b[0], y1, b[1], a[0], y0, a[1], b[0], y1, b[1], a[0], y1, a[1]);
        U.push(u0, y0 / uScale, u1, y0 / uScale, u1, y1 / uScale, u0, y0 / uScale, u1, y1 / uScale, u0, y1 / uScale);
      }
      if (matCap && pts.length === 4) C.push(pts[0][0], y1, pts[0][1], pts[1][0], y1, pts[1][1], pts[2][0], y1, pts[2][1], pts[0][0], y1, pts[0][1], pts[2][0], y1, pts[2][1], pts[3][0], y1, pts[3][1]);
    });
    const grp = new THREE.Group();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, matSide); m.castShadow = m.receiveShadow = true; grp.add(m);
    if (C.length) { const gc = new THREE.BufferGeometry(); gc.setAttribute('position', new THREE.Float32BufferAttribute(C, 3)); gc.computeVertexNormals(); grp.add(new THREE.Mesh(gc, matCap)); }
    return grp;
  }
  function courtTexture(kind) { // tracé de terrain dessiné : basket (28 x 15) ou hand/futsal (40 x 20)
    return tex(1024, 548, (x, w, h) => {
      const im = IMG.parquet.image; if (im && im.complete) { for (let i = 0; i < w; i += 256) for (let j = 0; j < h; j += 256) x.drawImage(im, i, j, 256, 256); } else { x.fillStyle = '#d6a978'; x.fillRect(0, 0, w, h); }
      x.strokeStyle = '#f7f5f0'; x.lineWidth = 5; x.strokeRect(10, 10, w - 20, h - 20); x.beginPath(); x.moveTo(w / 2, 10); x.lineTo(w / 2, h - 10); x.stroke();
      x.beginPath(); x.arc(w / 2, h / 2, kind === 'basket' ? 66 : 60, 0, 7); x.stroke();
      if (kind === 'basket') { x.fillStyle = 'rgba(30,60,140,.55)'; [[10, h / 2 - 90, 210, 180], [w - 220, h / 2 - 90, 210, 180]].forEach(r => { x.fillRect(...r); x.strokeRect(...r); });
        [[10, 1], [w - 10, -1]].forEach(([bx, s]) => { x.beginPath(); x.arc(bx + s * 58, h / 2, 245, s > 0 ? -1.25 : Math.PI - 1.25 + 0, s > 0 ? 1.25 : Math.PI + 1.25); x.stroke(); }); }
      else { x.strokeStyle = '#2b5ba8'; [[10, 1], [w - 10, -1]].forEach(([bx, s]) => { x.beginPath(); x.arc(bx, h / 2, 150, s > 0 ? -1.57 : 1.57, s > 0 ? 1.57 : 4.71); x.stroke(); }); }
    });
  }
  function quadMesh(q, y, texture) { // un quadrilatère texturé, UV sur ses 4 coins
    const p = q2(q), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([p[0][0], y, p[0][1], p[1][0], y, p[1][1], p[2][0], y, p[2][1], p[0][0], y, p[0][1], p[2][0], y, p[2][1], p[3][0], y, p[3][1]], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, cm({map: texture})); m.receiveShadow = true; return m;
  }
  function stands(t) { // rangs interpolés entre la ligne côté terrain et la ligne du fond ; marche + contremarche
    const P = [], L = [];
    const I = [[t.inner[0], t.inner[1]], [t.inner[2], t.inner[3]]], O = [[t.outer[0], t.outer[1]], [t.outer[2], t.outer[3]]];
    const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    for (let r = 0; r < t.rows; r++) {
      const f0 = r / t.rows, f1 = (r + 1) / t.rows, h = t.y0 + r * t.rise, hb = r ? h - t.rise : (t.l >= 2 ? h - 1.2 : 0);
      const a0 = lerp(I[0], O[0], f0), b0 = lerp(I[1], O[1], f0), a1 = lerp(I[0], O[0], f1), b1 = lerp(I[1], O[1], f1);
      P.push(a0[0], h, a0[1], b0[0], h, b0[1], b1[0], h, b1[1], a0[0], h, a0[1], b1[0], h, b1[1], a1[0], h, a1[1]);
      P.push(a0[0], hb, a0[1], b0[0], hb, b0[1], b0[0], h, b0[1], a0[0], hb, a0[1], b0[0], h, b0[1], a0[0], h, a0[1]);
      const sa = lerp(a0, a1, .55), sb = lerp(b0, b1, .55); L.push(sa[0], h + .45, sa[1], sb[0], h + .45, sb[1]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    const UVt = []; for (let i = 0; i < P.length; i += 3) UVt.push((P[i] + P[i + 1]) / 3, P[i + 2] / 3); g.setAttribute('uv', new THREE.Float32BufferAttribute(UVt, 2)); g.computeVertexNormals();
    const grp = new THREE.Group(); const m = new THREE.Mesh(g, cm({map: IMG.beton})); m.castShadow = m.receiveShadow = true;
    m.userData.info = {type: 'Tribune', nom: t.n, places: '≈ ' + t.places, rangs: t.rows, source: t.e ? 'estimé d\'après la coupe AA (NP2F)' : 'plan NP2F calé sur OSM'}; pick.push(m); grp.add(m);
    // rangées de sièges noirs (sièges en plastique recyclé noir)
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    grp.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({color: 0x1d1d1f, linewidth: 2, clippingPlanes: [CLIP]})));
    return grp;
  }
  if (!G.reel) { G.reel = new THREE.Group(); scene.add(G.reel); }
  function buildReel() {
    G.reel.clear(); const R = SCN.reel; if (!R) return;
    const fp = pairs(SCN.batiments.find(b => /Adidas Arena/i.test(b.n || '')).p);
    // parking (-1, estimé) et dalle du rez-de-chaussée
    const park = slab(q2(R.volume_haut ? R.parking : R.parking), R.parking_y, cm({map: IMG.parking}), 6); park.userData.lvl = -1; G.reel.add(park);
    G.reel.add(slab(fp, .03, cm({map: IMG.dalles, color: 0xEDEAE4}), 3));
    // murs du plan, épais, enduits, coupés en noir sur le dessus comme un plan d'architecte
    G.reel.add(walls(R.murs.map(q2), 0, R.hauteur_rdc, cm({map: IMG.enduit, color: 0xF4F1EA}), cm({color: 0x2a2826}), 3));
    // aire de jeu et terrains
    G.reel.add(quadMesh(R.aire, .06, IMG.parquet)); IMG.parquet.repeat.set(6, 8);
    G.reel.add(quadMesh(R.basket, .08, courtTexture('basket')));
    G.reel.add(quadMesh(R.gymnase, .06, courtTexture('hand')));
    // tribunes
    R.tribunes.forEach(t => G.reel.add(stands(t)));
    // socle vitré à lames de bois (0 → 11,5 m), terrasse plantée, volume aluminium (11,5 → 26 m)
    G.reel.add(walls([fp], 0, R.terrasse_y, cm({map: T2.glass, transparent: true, opacity: .85, depthWrite: false}), null, 8));
    const vh = q2(R.volume_haut);
    G.reel.add(slab(fp, R.terrasse_y, cm({map: IMG.deck}), 4, [vh]));
    G.reel.add(walls([vh], R.terrasse_y, R.haut_y, cm({map: T2.alu}), null, 8));
    const roof = slab(vh, R.haut_y, cm(ORTHO ? {map: ORTHO} : {map: IMG.herbe}), 8);
    if (ORTHO) { const uv = roof.geometry.attributes.uv, pos = roof.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, ...ouv(pos.getX(i), pos.getZ(i))); } roof.userData.roof = 1; roof.visible = false; G.reel.add(roof);
    // étiquettes
    const lab = (t, x, y, z) => { // étiquette dimensionnée sur son texte, cachée quand le toit est posé
      const c = document.createElement('canvas'), k = c.getContext('2d'); k.font = '600 44px system-ui,sans-serif'; const w = Math.ceil(k.measureText(t).width) + 28;
      c.width = w; c.height = 64; k.font = '600 44px system-ui,sans-serif'; k.fillStyle = 'rgba(237,235,230,.88)'; k.fillRect(0, 0, w, 64); k.fillStyle = '#1D1F1E'; k.fillText(t, 14, 46);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), depthTest: false, transparent: true}));
      s.scale.set(w / 64 * 3.2, 3.2, 1); s.position.set(x, y, z); s.userData.label = 1; G.reel.add(s);
    };
    const c = (q) => [(q[0] + q[4]) / 2, (q[1] + q[5]) / 2];
    lab('AIRE DE JEU', ...[c(R.aire)[0], 3, c(R.aire)[1]]);
    lab('GYMNASE AIMÉE LALLEMENT', c(R.gymnase)[0] - 10, 7, c(R.gymnase)[1]);
    lab('ENTRÉE PUBLIQUE', R.entree.p[0] + 8, 8, R.entree.p[1] + 6);
    R.tribunes.forEach(t => { if (/mobiles/.test(t.n)) return; lab(t.n.toUpperCase(), (t.outer[0] + t.outer[2]) / 2 - 8, t.y0 + t.rows * t.rise + 3, (t.outer[1] + t.outer[3]) / 2); });
    R.vomitoires.forEach(v => { const g = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cm({color: 0xC98A12})); g.position.set((v.p[0] + v.p[2]) / 2, 2.5, (v.p[1] + v.p[3]) / 2); g.scale.set(v.w, 5, v.w); g.userData.info = {type: 'Vomitoire', nom: v.n, largeur: v.w + ' m (estimé)'}; pick.push(g); G.reel.add(g); });
  }
  // ---------- Leviers du juré (scene.leviers, codes du catalogue des contraintes) ----------
  // Un poteau par levier : couleur = famille, clic = fermer / rouvrir (ou activer une zone). L'état est lu par la régie et le moteur.
  const FAM = {C1: 0x1D6FB8, B1: 0x0A8A3E, B3: 0xC98A12, B5: 0x7A4FB5, D1: 0xD8572A, D2: 0xB8322A, D5: 0x1D1F1E, F1: 0x1D1F1E};
  if (!G.leviers) { G.leviers = new THREE.Group(); scene.add(G.leviers); }
  window.LEVIERS = [];
  function paintLever(o) {
    const L = o.userData.lever, on = /ouvert|^0 min|inactive|inactif/.test(L.etat);
    o.children.forEach(c => { if (c.material && c.userData.head) c.material.color.set(on ? FAM[L.code] : 0xE0461F); });
    if (o.userData.zone) o.userData.zone.visible = !on;
  }
  function buildLevers() {
    G.leviers.clear(); window.LEVIERS = [];
    (SCN.leviers || []).forEach(L => {
      if (L.type === 'parametre') return;
      const g = new THREE.Group(), y0 = L.niveau ? 5.6 : 0;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 6, 6), new THREE.MeshLambertMaterial({color: 0x1D1F1E})); post.position.y = 3; g.add(post);
      const head = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, .4), new THREE.MeshLambertMaterial({color: FAM[L.code]})); head.position.y = 6.6; head.userData.head = 1; g.add(head);
      const c = document.createElement('canvas'); c.width = 128; c.height = 64; const k = c.getContext('2d'); k.font = '700 40px system-ui,sans-serif'; k.fillStyle = '#fff'; k.textAlign = 'center'; k.fillText(L.code, 64, 46);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), depthTest: false})); s.scale.set(2.4, 1.2, 1); s.position.y = 6.6; g.add(s);
      g.position.set(L.x, y0, L.z); g.userData.lever = L;
      if (L.poly) { const z = slab(pairs(L.poly), .35, new THREE.MeshBasicMaterial({color: FAM[L.code], transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false}), 10); z.position.set(-L.x, -y0, -L.z); g.add(z); g.userData.zone = z; }
      if (L.rayon) { const z = new THREE.Mesh(new THREE.RingGeometry(0, L.rayon, 48), new THREE.MeshBasicMaterial({color: 0xE0461F, transparent: true, opacity: .25, depthWrite: false})); z.rotation.x = -Math.PI / 2; z.position.y = .4; g.add(z); g.userData.zone = z; }
      [post, head].forEach(m => { m.userData.info = {type: 'Levier ' + L.code, nom: L.nom, état: L.etat, effet: L.effet, source: L.e ? 'estimé : ' + L.source : L.source}; m.userData.leverGroup = g; pick.push(m); });
      paintLever(g); G.leviers.add(g); window.LEVIERS.push(g);
    });
  }
  window.toggleLever = id => { const g = window.LEVIERS.find(o => o.userData.lever.id === id); if (!g) return null; const L = g.userData.lever;
    L.etat = L.type === 'zone' ? (L.etat === 'inactive' ? 'active' : 'inactive') : L.type === 'point' ? (L.etat === 'inactif' ? 'actif' : 'inactif') : (L.etat === 'ouvert' ? 'fermé' : 'ouvert');
    paintLever(g); window.dispatchEvent(new CustomEvent('levier', {detail: L})); return L.etat; };
  rnd.domElement.addEventListener('dblclick', e => { // double-clic sur un poteau : bascule le levier
    const r = rnd.domElement.getBoundingClientRect(), m = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(m, cam); const h = ray.intersectObjects(G.leviers.children, true)[0];
    if (h) { let o = h.object; while (o && !o.userData.lever) o = o.parent; if (o) toggleLever(o.userData.lever.id); }
  });

  // barre des niveaux : coupe horizontale de l'Arena (le quartier n'est pas coupé)
  const LV = [['Toit', 1e4], ['Terrasse 11,5 m', 13.5], ['Balcons', 11], ['Rez-de-chaussée', 5.4], ['Parking −1', -.4]];
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:0;background:#1D1F1E;border-radius:4px;overflow:hidden;font:600 14px system-ui,sans-serif;z-index:5';
  LV.forEach(([n, y], i) => { const b = document.createElement('button'); b.textContent = n; b.style.cssText = 'all:unset;cursor:pointer;padding:9px 14px;color:#EDEBE6'; b.onclick = () => setLevel(i); b.dataset.lv = i; bar.appendChild(b); });
  document.body.appendChild(bar);
  function setLevel(i) {
    CLIP.constant = LV[i][1];
    bar.querySelectorAll('button').forEach(b => { const on = +b.dataset.lv === i; b.style.background = on ? '#EDEBE6' : 'transparent'; b.style.color = on ? '#1D1F1E' : '#EDEBE6'; });
    G.reel.traverse(o => { if (o.userData.roof) o.visible = i === 0; if (o.userData.label) o.visible = i === 2 || i === 3; });
    const under = LV[i][1] < 0; G.surface.visible = G.rues.visible = !under;
  }
  window.setLevel = setLevel;

  const baseRebuild = rebuild;
  rebuild = function () {
    if (SCN.reel && !SCN._reelOnly) { // le vrai plan remplace l'intérieur estimé
      SCN._reelOnly = 1; SCN.interieur = SCN.interieur.filter(o => !o.e); SCN.portes = SCN.portes.filter(o => !o.e); SCN.escaliers = SCN.escaliers.filter(o => !o.e); SCN.gradins = [];
    }
    baseRebuild(); buildReel(); buildLevers(); setLevel(+(QP.get('lv') || 2));
    hemi.intensity = .52; sun.intensity = 1.0;
    G.population.visible = false; // la foule viendra du moteur ; les points de placement brouillent la maquette
    ['arbres', 'abords', 'incendie', 'metro', 'gradins', 'portes'].forEach(k => G[k].traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }));
  };
})();
