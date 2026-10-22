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
if (typeof document !== 'undefined' && typeof fetch === 'function') {
  SOLS.loading = true;
  fetch('navgrid.json').then(r => r.json()).then(g => { solsDecode(g); SOLS.loading = false; if (typeof SCN !== 'undefined' && SCN && typeof buildIndoor === 'function') { buildIndoor(); if (typeof rnd !== 'undefined') rnd.shadowMap.needsUpdate = true; } });
}
if (typeof module !== 'undefined') module.exports = { SOLS, lvm, lvlsOf, solsDecode, solsKindAt, solsY };
