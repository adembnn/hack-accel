// Sols de la maquette : une seule source de vérité. La grille (navgrid.json, clé "fk") dit où un sol existe et de quel type ;
// la page dessine ces cases (texturées), et la simulation ne marche que sur les cases dont un sol est dessiné.
// Niveaux fractionnaires (-3,5, -0,75...) : rattachés au niveau entier par la même règle que build_navgrid.py (floor(v+0,25)).
// Chargeable dans le navigateur (après index.html) et dans Node (bench-sols.mjs).
const SOLS = { g: null, kind: null, N: 0, loading: false };
const SOLS_KINDS = { 1: 'zone', 2: 'couloir', 3: 'local', 4: 'quai', 5: 'passage' };
function lvm(v) { return v < 0 ? Math.floor(v + 0.25) : Math.round(v); }
function lvlsOf(ls) { const o = []; for (const v of ls) { const r = lvm(v); if (r >= -5 && r <= 0 && !o.includes(r)) o.push(r); } return o.sort((a, b) => a - b); }
// altitude du sol dessiné : alt(niveau) ; au niveau 0, 7 cm au-dessus de la chaussée (0,05) pour ne pas être recouvert
function solsY(L, altf) { return altf(L) + (L === 0 ? 0.07 : 0); }
function solsDecode(g) {
  const N = g.w * g.h; SOLS.g = g; SOLS.N = N; SOLS.kind = new Uint8Array(N * g.levels.length);
  g.fk.forEach((runs, l) => { let p = l * N; for (let i = 0; i < runs.length; i += 2) { if (runs[i]) SOLS.kind.fill(runs[i], p, p + runs[i + 1]); p += runs[i + 1]; } });
  return SOLS;
}
// type de sol sous (x, z) au niveau d'indice l (0 = aucun sol)
function solsKindAt(l, x, z) {
  const g = SOLS.g, c = Math.floor((x - g.bbox[0]) / g.res), r = Math.floor((z - g.bbox[1]) / g.res);
  if (c < 0 || r < 0 || c >= g.w || r >= g.h) return 0;
  return SOLS.kind[l * SOLS.N + r * g.w + c];
}
function solsRects(l, k) { // rectangles (c0, c1, r0, r1 inclus) du type k au niveau l : bandes par ligne, fusionnées verticalement
  const g = SOLS.g, runs = g.fk[l], out = []; let open = new Map(), p = 0;
  const rows = [];
  for (let i = 0; i < runs.length; i += 2) { const v = runs[i], n = runs[i + 1]; if (v === k) { let a = p, b = p + n; while (a < b) { const r = Math.floor(a / g.w), end = Math.min(b, (r + 1) * g.w); (rows[r] = rows[r] || []).push([a - r * g.w, end - 1 - r * g.w]); a = end; } } p += n; }
  for (let r = 0; r <= g.h; r++) {
    const cur = new Map();
    for (const [c0, c1] of rows[r] || []) { const key = c0 + ',' + c1; const o = open.get(key); if (o) { o.r1 = r; cur.set(key, o); open.delete(key); } else cur.set(key, { c0, c1, r0: r, r1: r }); }
    for (const o of open.values()) out.push(o);
    open = cur;
  }
  return out;
}
// ouvertures de façade (portes OSM, vitrines ouvertes) d'une boutique dessinée à un niveau : o._i = indice du polygone, o._L = niveau
function solsGapsOf(o) { return SOLS.g && SOLS.g.ouvertures ? SOLS.g.ouvertures.filter(q => q.room === o._i && q.l === o._L) : null; }
// Mobilier intérieur : position et orientation viennent de la grille (navgrid.json, clé "mobilier") ; les cases qu'il occupe y sont non praticables.
function solsFurniture(lvSel) {
  if (!SOLS.g || !SOLS.g.mobilier) return null;
  const grp = new THREE.Group(), by = { banc: [], plante: [], borne: [], panneau: [] };
  SOLS.g.mobilier.forEach(([L, x, z, rot, t]) => { if (lvSel === 'all' || L === +lvSel) by[t].push([x, solsY(L, alt), z, -rot]); });
  const put = (arr, geo, mat, dy) => { if (!arr.length) return; const m = new THREE.InstancedMesh(geo, mat, arr.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    arr.forEach((p, i) => { Q.setFromEuler(E.set(0, p[3], 0)); M.compose(new THREE.Vector3(p[0], p[1] + dy, p[2]), Q, new THREE.Vector3(1, 1, 1)); m.setMatrixAt(i, M); }); grp.add(m); };
  put(by.banc, new THREE.BoxGeometry(2, .45, .6), new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: .7 }), .25);
  put(by.plante, new THREE.CylinderGeometry(.6, .5, .8, 10), new THREE.MeshStandardMaterial({ color: 0x3d3d3d }), .4);
  put(by.plante, new THREE.IcosahedronGeometry(.9, 0), new THREE.MeshStandardMaterial({ color: 0x4f7a3a, roughness: .9 }), 1.5);
  put(by.borne, new THREE.BoxGeometry(.6, 1.8, .36), new THREE.MeshStandardMaterial({ color: 0x1f2328, emissive: 0x2b5d8a, emissiveIntensity: .35 }), .9);
  put(by.panneau, new THREE.BoxGeometry(2.6, .5, .08), new THREE.MeshStandardMaterial({ color: 0x0f6b45, emissive: 0x0f9a52, emissiveIntensity: .55 }), 3);
  return grp;
}
const SOLS_TEX = {
  1: () => ph('floor_tiles_06') || tileTex('#d9d0bf', 'rgba(120,105,85,.35)', 32), 2: () => ph('marble_tiles') || tileTex('#e6dfd1', 'rgba(110,95,75,.4)', 21),
  3: () => ph('large_floor_tiles_02') || tileTex('#b9a98c', 'rgba(80,65,50,.35)', 16), 4: () => tileTex('#d8d2c6', 'rgba(110,100,85,.35)', 32), 5: () => ph('marble_tiles') || tileTex('#e6dfd1', 'rgba(110,95,75,.4)', 21)
};
const SOLS_SU = { 1: 4.8, 2: 3.6, 3: 3, 4: 4, 5: 3.6 };
// Groupe THREE des sols à afficher (lvSel : 'all' ou niveau). null tant que la grille n'est pas chargée.
function solsFloors(lvSel) {
  if (!SOLS.g) return null;
  const g = SOLS.g, grp = new THREE.Group();
  for (const k of [1, 2, 3, 4, 5]) {
    const P = [], U = [], su = SOLS_SU[k];
    g.levels.forEach((L, l) => {
      if (lvSel !== 'all' && L !== +lvSel) return;
      const y = solsY(L, alt);
      for (const o of solsRects(l, k)) {
        const x0 = g.bbox[0] + o.c0 * g.res, x1 = g.bbox[0] + (o.c1 + 1) * g.res, z0 = g.bbox[1] + o.r0 * g.res, z1 = g.bbox[1] + (o.r1 + 1) * g.res;
        P.push(x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0);
        [[x0, z0], [x0, z1], [x1, z1], [x0, z0], [x1, z1], [x1, z0]].forEach(q => U.push(q[0] / su, q[1] / su));
      }
    });
    if (!P.length) continue;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: SOLS_TEX[k](), roughness: .55, metalness: .05, side: THREE.DoubleSide }));
    m.receiveShadow = true; m.userData.info = { type: 'Sol (' + SOLS_KINDS[k] + ')', source: 'grille de marche navgrid.json : on ne marche que sur un sol dessiné' };
    grp.add(m); if (typeof pick !== 'undefined') pick.push(m);
  }
  return grp;
}
// ---------- Trajets verticaux : position dessinée d'un passager sur l'objet dessiné (escalator, escalier, ascenseur) ----------
// sim.js déplace le passager en ligne droite du point de départ au centre de la case d'arrivée ; on le pose ici sur l'axe réellement dessiné
// (liens : pa = extrémité du lien « a », pb = extrémité du lien « b », en mètres, lues dans le dessin). Entrée et sortie : 6 % du trajet chacune.
const LIFTS = [];
function solsRidePos(a) {
  const g = SIM.g, k = g.links[a.ride.li], rt = rideT(k), t = Math.min(1, Math.max(0, 1 - (a.ride.t1 - SIM.T) / rt));
  const to = a.ride.to, fr = a.ride.from, toB = to === k.b || (to[0] === k.b[0] && to[1] === k.b[1] && to[2] === k.b[2]);
  const P0 = toB ? k.pa : k.pb, P1 = toB ? k.pb : k.pa, u = Math.min(1, Math.max(0, (t - .06) / .88));
  let x = P0[0] + (P1[0] - P0[0]) * u, z = P0[1] + (P1[1] - P0[1]) * u;
  const tx = g.bbox[0] + (to[2] + .5) * g.res, tz = g.bbox[1] + (to[1] + .5) * g.res;
  if (t < .06) { const w = t / .06; x = fr[1] + (P0[0] - fr[1]) * w; z = fr[2] + (P0[1] - fr[2]) * w; }
  else if (t > .94) { const w = (t - .94) / .06; x = P1[0] + (tx - P1[0]) * w; z = P1[1] + (tz - P1[1]) * w; }
  const y0 = solsY(g.levels[fr[0]], alt) , y1 = solsY(g.levels[to[0]], alt);
  return { x, z, y: y0 + (y1 - y0) * u, u, t, dx: P1[0] - P0[0], dz: P1[1] - P0[1] };
}
// Redessin des passagers en trajet et des cabines d'ascenseur (après simDraw de sim.js)
function solsDrawRiders() {
  if (typeof silBody === 'undefined' || !silBody || !SIM.A) return;
  const show = L => lvSel === 'all' || L === +lvSel, g = SIM.g, lifts = new Map(); let dirty = false;
  SIM.A.forEach((a, i) => {
    if (a.out || !a.ride || i >= silBody.instanceMatrix.count) return;
    const k = g.links[a.ride.li], p = solsRidePos(a), L0 = g.levels[a.ride.from[0]], L1 = g.levels[a.ride.to[0]];
    if (k.k === 'ascenseur') { const c = lifts.get(k.asc); if (!c || p.u > 0) lifts.set(k.asc, { y: p.y, u: p.u }); }
    if (!(show(L0) || show(L1))) return;
    const h = Math.hypot(p.dx, p.dz) > .01 ? Math.atan2(p.dx, p.dz) : Math.atan2(a.vx, a.vz);
    SQ.setFromEuler(SE.set(0, h, 0)); SM.compose(SV.set(p.x, p.y, p.z), SQ, ONE); silBody.setMatrixAt(i, SM); silHead.setMatrixAt(i, SM); dirty = true;
  });
  if (dirty) { silBody.instanceMatrix.needsUpdate = silHead.instanceMatrix.needsUpdate = true; }
  LIFTS.forEach(l => { const c = lifts.get(l.idx); if (c) l.y = c.y; if (l.y !== undefined) l.cab.position.y = l.y + 1.2 - l.g.position.y; });
}
if (typeof document !== 'undefined' && typeof simDraw === 'function') { const _sd = simDraw; simDraw = function () { _sd(); solsDrawRiders(); }; }
if (typeof document !== 'undefined' && typeof fetch === 'function') {
  SOLS.loading = true;
  fetch('navgrid.json').then(r => r.json()).then(g => { solsDecode(g); SOLS.loading = false; if (typeof SCN !== 'undefined' && SCN && typeof buildIndoor === 'function') { buildIndoor(); if (typeof rnd !== 'undefined') rnd.shadowMap.needsUpdate = true; } });
}
if (typeof module !== 'undefined') module.exports = { SOLS, lvm, lvlsOf, solsDecode, solsKindAt, solsY };
