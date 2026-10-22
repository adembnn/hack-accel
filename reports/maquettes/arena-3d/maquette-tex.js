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
      for (let i = 0; i < pts.length; i++) {
        const [a, c] = [pts[i], pts[(i + 1) % pts.length]], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
        const u0 = acc / (arena ? 16 : 6), u1 = (acc + L) / (arena ? 16 : 6); acc += L;
        const v0 = arena ? 0 : y0 / 6, v1 = arena ? 1 : h / 6;
        o.wp.push(a[0], y0, a[1], c[0], y0, c[1], c[0], h, c[1], a[0], y0, a[1], c[0], h, c[1], a[0], h, a[1]);
        o.wu.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1); bOwner[arena ? 1 : 0].push(bi, bi);
        o.ep.push(a[0], h, a[1], c[0], h, c[1]); if (L > 6) o.ep.push(a[0], y0, a[1], a[0], h, a[1]);
      }
      if (arena) return; // maquette ouverte : toit de l'Arena retiré pour voir l'intérieur
      let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []); } catch (e) {}
      tri.forEach(t => t.forEach(i => o.rp.push(pts[i][0], h, pts[i][1])));
    });
    T.card.repeat.set(1, 1);
    B.forEach((o, k) => {
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(o.wp, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(o.wu, 2)); wg.computeVertexNormals();
      const w = new THREE.Mesh(wg, new THREE.MeshLambertMaterial(k ? {map: T.facade, side: THREE.DoubleSide} : {color: 0xF3F1EC, map: T.card, side: THREE.DoubleSide}));
      w.castShadow = true; w.receiveShadow = true; w.userData.kind = 'bat'; w.userData.owner = k; G.batiments.add(w); pick.push(w);
      if (o.rp.length) { const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(o.rp, 3)); rg.computeVertexNormals(); const r = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({color: 0xE6E3DC, side: THREE.DoubleSide})); r.castShadow = true; r.receiveShadow = true; G.batiments.add(r); }
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(o.ep, 3));
      G.batiments.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({color: k ? 0x3a3c3e : 0x8a877f, transparent: true, opacity: k ? .8 : .45})));
    });
  };

  // Lumière de maquette : soleil d'après-midi, ombres douces
  rnd.shadowMap.enabled = true; rnd.shadowMap.type = THREE.PCFSoftShadowMap;
  sun.intensity = .75; sun.position.set(-260, 420, 180); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {left: -450, right: 450, top: 450, bottom: -450, near: 10, far: 1400}); sun.shadow.bias = -.0006; sun.shadow.camera.updateProjectionMatrix();
  hemi.color.set(0xffffff); hemi.groundColor.set(0xb9b4a8);
  const baseRebuild = rebuild;
  rebuild = function () {
    baseRebuild();
    hemi.intensity = .52; sun.intensity = 1.0;
    G.population.visible = false; // la foule viendra du moteur ; les points de placement brouillent la maquette
    ['arbres', 'abords', 'incendie', 'metro', 'gradins', 'portes'].forEach(k => G[k].traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }));
  };
})();
