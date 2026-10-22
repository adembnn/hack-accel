// Moteur de foule de l'Adidas Arena (salle de contrôle). Module ES sans dépendance : navigateur et Node.
// Repère : mètres, x vers l'est, z vers le sud, origine au centre de l'Arena. Niveaux 0 (sol), 1 (coursive + tribune basse), 2 (tribune haute + galerie).
// Modèles repris du moteur Châtelet (forum-tiroirs-v1) : départ log-logistique, choix de sortie logit, forces sociales de Helbing,
// murs par champ de distance, cartes de pentes de Dijkstra multi-niveaux par cible, liens entre niveaux à débit.
// Toute valeur marquée « estimé » est une hypothèse de l'équipe, pas une mesure (voir sim/LISEZMOI.md).

export const DT = 0.1;
export const TARGETS = ['metro12', 'tramOuest', 'tramEst', 'pied_sud', 'pied_est', 'pied_nord'];
const T_METRO = 0, T_TRAM_W = 1, T_TRAM_E = 2;

// ---------- Grille ----------
const X0 = -200, Z0 = -130, GW = 460, GH = 400, NCL = GW * GH, NL = 3, NCELL = NL * NCL;
const DX = [1, -1, 0, 0, 1, 1, -1, -1], DZ = [0, 0, 1, -1, 1, -1, 1, -1];
const WT = [1, 1, 1, 1, 1.4142135623730951, 1.4142135623730951, 1.4142135623730951, 1.4142135623730951];
const LCOST = 10.4; // coût d'un escalier dans les cartes de pentes (8 s × 1,3 m/s ; estimé)
const ALT = [0, 4, 8]; // altitude d'affichage par niveau (comme index.html : l*4)

// ---------- Modèles publiés / paramètres ----------
const R = 0.24, TAU = 0.5;
const B_DIST = 0.08;      // publié : -0,08 par mètre
const DIST_SCALE = 0.1;   // estimé : renormalisation de B_DIST pour un site de 500 m (sinon la distance écrase tout)
const B_FAM = 0.795, B_GUIDE = 2.739, B_ZONE = 1.5;
const MED_PRE = 40.5, SHAPE_PRE = 3.5;
const OBEY_ANNOUNCE = 0.8, OBEY_STEWARD = 0.7; // estimé
const STAIR_DUR = 8, FLOW_SPEC = 1.3; // pers./m/s ; durée de l'escalier (estimé)
const METRO_RATE = 4, TRAM_CAP = 300, TRAM_HEADWAY = 240; // estimé
const HC = 1.5; // taille de maille du hachage spatial
const HW = Math.ceil(GW / HC) + 2, HH = Math.ceil(GH / HC) + 2, HN = HW * HH;

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

class Heap {
  constructor(cap = 1 << 20) { this.k = new Float64Array(cap); this.v = new Int32Array(cap); this.n = 0; this.topK = 0; }
  grow() { const k = new Float64Array(this.k.length * 2), v = new Int32Array(this.v.length * 2); k.set(this.k); v.set(this.v); this.k = k; this.v = v; }
  push(key, val) {
    if (this.n === this.k.length) this.grow();
    let i = this.n++; const k = this.k, v = this.v;
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
    k[i] = key; v[i] = val;
  }
  pop() {
    const k = this.k, v = this.v; this.topK = k[0]; const rv = v[0]; const n = --this.n;
    if (n > 0) {
      const key = k[n], val = v[n]; let i = 0;
      for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= key) break; k[i] = k[c]; v[i] = v[c]; i = c; }
      k[i] = key; v[i] = val;
    }
    return rv;
  }
}

// ---------- Rastérisation ----------
function rasterPoly(p, fn) {
  const n = p.length / 2; let zmin = Infinity, zmax = -Infinity;
  for (let i = 0; i < n; i++) { const z = p[2 * i + 1]; if (z < zmin) zmin = z; if (z > zmax) zmax = z; }
  const c0 = Math.max(0, Math.floor(zmin - Z0)), c1 = Math.min(GH - 1, Math.floor(zmax - Z0));
  const xs = [];
  for (let cz = c0; cz <= c1; cz++) {
    const zc = Z0 + cz + 0.5; xs.length = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const az = p[2 * j + 1], bz = p[2 * i + 1];
      if ((az <= zc) !== (bz <= zc)) xs.push(p[2 * j] + (zc - az) / (bz - az) * (p[2 * i] - p[2 * j]));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil(xs[k] - X0 - 0.5)), b = Math.min(GW - 1, Math.floor(xs[k + 1] - X0 - 0.5));
      for (let cx = a; cx <= b; cx++) fn(cx, cz);
    }
  }
}
function rasterRect(x0, z0, x1, z1, fn) {
  const a = Math.max(0, Math.ceil(x0 - X0 - 0.5)), b = Math.min(GW - 1, Math.floor(x1 - X0 - 0.5));
  const c = Math.max(0, Math.ceil(z0 - Z0 - 0.5)), d = Math.min(GH - 1, Math.floor(z1 - Z0 - 0.5));
  for (let cz = c; cz <= d; cz++) for (let cx = a; cx <= b; cx++) fn(cx, cz);
}
const cellIdx = (l, x, z) => {
  let cx = Math.floor(x - X0), cz = Math.floor(z - Z0);
  cx = cx < 0 ? 0 : cx >= GW ? GW - 1 : cx; cz = cz < 0 ? 0 : cz >= GH ? GH - 1 : cz;
  return l * NCL + cz * GW + cx;
};
const cellX = c => X0 + ((c % NCL) % GW) + 0.5;
const cellZ = c => Z0 + (((c % NCL) / GW) | 0) + 0.5;
const cellL = c => (c / NCL) | 0;
const sdRR = (f, C, x, z) => { // distance signée à l'aire de jeu (rectangle arrondi de rayon C) : >0 vers l'extérieur
  const qx = Math.max(f[0] + C - x, 0, x - (f[2] - C)), qz = Math.max(f[1] + C - z, 0, z - (f[3] - C));
  return Math.hypot(qx, qz) - C;
};

// ---------- Moteur de champs (cartes de pentes) ----------
class Engine {
  constructor(p) {
    this.solid = p.solid; this.wd = p.wd; this.cost = p.cost; this.zoneMul = p.zoneMul; this.spd = p.spd;
    this.linkUp = p.linkUp; this.linkDown = p.linkDown; this.sinkAt = p.sinkAt; this.sinks = p.sinks;
    this.f = p.f || TARGETS.map(() => new Float64Array(NCELL).fill(Infinity)); // Float64 obligatoire (Float32 => boucle infinie)
    this.heap = new Heap(); this.inv = new Uint8Array(NCELL);
  }
  clone() {
    return new Engine({
      solid: this.solid.slice(), wd: this.wd.slice(), cost: this.cost.slice(), zoneMul: this.zoneMul.slice(), spd: this.spd,
      linkUp: this.linkUp, linkDown: this.linkDown, sinkAt: this.sinkAt, sinks: this.sinks.map(s => ({ ...s, queue: s.queue ? [] : undefined, wait: s.wait ? [] : undefined })), f: this.f.map(a => a.slice()),
    });
  }
  costCell(c) { const w = this.wd[c]; this.cost[c] = (1 / this.spd[c]) * (1 + 3 * Math.max(0, 1 - w / 1.2)) * this.zoneMul[c]; }
  wdCell(c) { // distance au mur le plus proche (carrés pleins), plafonnée à 3 m
    const solid = this.solid;
    if (solid[c]) return 0;
    const r = c % NCL, cx = r % GW, cz = (r / GW) | 0, base = c - r; let best = 3;
    for (let dz = -3; dz <= 3; dz++) {
      const nz = cz + dz; if (nz < 0 || nz >= GH) continue;
      for (let dx = -3; dx <= 3; dx++) {
        const nx = cx + dx; if (nx < 0 || nx >= GW) continue;
        if (!solid[base + nz * GW + nx]) continue;
        const ex = Math.max(Math.abs(dx) - 0.5, 0), ez = Math.max(Math.abs(dz) - 0.5, 0), d = Math.hypot(ex, ez);
        if (d < best) best = d;
      }
    }
    return best;
  }
  isSrc(c, t) { const s = this.sinkAt[c]; if (s < 0) return false; const k = this.sinks[s]; return k.target === t && k.open; }
  relax(f, c, v) {
    const solid = this.solid, cost = this.cost, heap = this.heap;
    const r = c % NCL, cx = r % GW, cz = (r / GW) | 0;
    for (let k = 0; k < 8; k++) {
      const nx = cx + DX[k], nz = cz + DZ[k];
      if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
      const n = c + DZ[k] * GW + DX[k];
      if (solid[n]) continue;
      if (k >= 4 && (solid[c + DX[k]] || solid[c + DZ[k] * GW])) continue;
      const nv = v + WT[k] * cost[n];
      if (nv < f[n]) { f[n] = nv; heap.push(nv, n); }
    }
    const u = this.linkUp[c];
    if (u >= 0 && !solid[u]) { const nv = v + LCOST; if (nv < f[u]) { f[u] = nv; heap.push(nv, u); } }
  }
  run(f) { const h = this.heap; while (h.n) { const c = h.pop(), v = h.topK; if (v > f[c]) continue; this.relax(f, c, v); } }
  fullCompute(t) {
    const f = this.f[t]; f.fill(Infinity); this.heap.n = 0;
    for (const s of this.sinks) if (s.target === t && s.open) for (const c of s.cells) if (!this.solid[c]) { f[c] = 0; this.heap.push(0, c); }
    this.run(f);
  }
  // prédécesseurs de n : cellules k telles que f[n] = f[k] + coût (arête k -> n de relax)
  hasSupport(f, n, t) {
    const solid = this.solid, cost = this.cost, inv = this.inv;
    if (this.isSrc(n, t)) return true;
    const fn = f[n], r = n % NCL, cx = r % GW, cz = (r / GW) | 0;
    for (let k = 0; k < 8; k++) {
      const nx = cx + DX[k], nz = cz + DZ[k];
      if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
      const m = n + DZ[k] * GW + DX[k];
      if (solid[m] || inv[m]) continue;
      if (k >= 4 && (solid[n + DX[k]] || solid[n + DZ[k] * GW])) continue;
      const fm = f[m]; if (fm === Infinity) continue;
      if (Math.abs(fn - (fm + WT[k] * cost[n])) < 1e-7) return true;
    }
    const d = this.linkDown[n];
    if (d >= 0 && !solid[d] && !inv[d] && f[d] !== Infinity && Math.abs(fn - (f[d] + LCOST)) < 1e-7) return true;
    return false;
  }
  // mise à jour incrémentale d'un champ après un changement de murs, de coûts ou de sources sur les cellules W (liste d'indices)
  update(t, W) {
    const f = this.f[t], solid = this.solid, cost = this.cost, inv = this.inv, S = [];
    for (const c of W) if (!inv[c]) { inv[c] = 1; S.push(c); }
    for (let i = 0; i < S.length; i++) {
      const m = S[i], fm = f[m]; if (fm === Infinity) continue;
      const r = m % NCL, cx = r % GW, cz = (r / GW) | 0;
      for (let k = 0; k < 8; k++) {
        const nx = cx + DX[k], nz = cz + DZ[k];
        if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
        const n = m + DZ[k] * GW + DX[k];
        if (solid[n] || inv[n] || f[n] === Infinity) continue;
        if (k >= 4 && (solid[m + DX[k]] || solid[m + DZ[k] * GW])) continue;
        if (Math.abs(f[n] - (fm + WT[k] * cost[n])) > 1e-7) continue;
        if (!this.hasSupport(f, n, t)) { inv[n] = 1; S.push(n); }
      }
      const u = this.linkUp[m];
      if (u >= 0 && !solid[u] && !inv[u] && f[u] !== Infinity && Math.abs(f[u] - (fm + LCOST)) < 1e-7 && !this.hasSupport(f, u, t)) { inv[u] = 1; S.push(u); }
    }
    for (const c of S) f[c] = Infinity;
    this.heap.n = 0;
    for (const c of S) {
      if (solid[c]) continue;
      if (this.isSrc(c, t)) { f[c] = 0; this.heap.push(0, c); continue; }
      let best = Infinity; const r = c % NCL, cx = r % GW, cz = (r / GW) | 0;
      for (let k = 0; k < 8; k++) {
        const nx = cx + DX[k], nz = cz + DZ[k];
        if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
        const m = c + DZ[k] * GW + DX[k];
        if (solid[m] || inv[m] || f[m] === Infinity) continue;
        if (k >= 4 && (solid[c + DX[k]] || solid[c + DZ[k] * GW])) continue;
        const v = f[m] + WT[k] * cost[c]; if (v < best) best = v;
      }
      const d = this.linkDown[c];
      if (d >= 0 && !solid[d] && !inv[d] && f[d] !== Infinity && f[d] + LCOST < best) best = f[d] + LCOST;
      if (best < Infinity) { f[c] = best; this.heap.push(best, c); }
    }
    for (const c of S) inv[c] = 0;
    this.run(f);
    return S.length;
  }
  // ré-évalue murs/coût autour des cellules changées puis met à jour les champs demandés ; renvoie des mesures
  applyChange(cells, targets = null, extra = 2) {
    const t0 = now();
    const set = new Set();
    for (const c of cells) {
      const r = c % NCL, cx = r % GW, cz = (r / GW) | 0, base = c - r;
      for (let dz = -extra; dz <= extra; dz++) for (let dx = -extra; dx <= extra; dx++) {
        const nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
        set.add(base + nz * GW + nx);
      }
    }
    for (const c of set) this.wd[c] = this.wdCell(c);
    for (const c of set) this.costCell(c);
    const W = [...set], per = {};
    const ts = targets || TARGETS.map((_, i) => i);
    for (const t of ts) per[TARGETS[t]] = this.update(t, W);
    return { ms: now() - t0, cellsChanged: cells.length, window: W.length, invalidated: per, fields: ts.map(t => TARGETS[t]) };
  }
}

// ---------- Monde ----------
export function buildWorld(scene) {
  const t0 = now();
  const solid = new Uint8Array(NCELL), spd = new Float32Array(NCELL).fill(1);
  solid.fill(1, NCL); // niveaux 1 et 2 : tout est mur, on creuse ensuite
  const set0 = (cx, cz, v) => { solid[cz * GW + cx] = v; };
  // --- niveau 0 : bâtiments ---
  const arena = scene.batiments.find(b => b.n === 'Adidas Arena');
  if (!arena) throw new Error("buildWorld : bâtiment « Adidas Arena » introuvable dans scene.json");
  for (const b of scene.batiments) if (b !== arena) rasterPoly(b.p, (cx, cz) => set0(cx, cz, 1));
  const inArena = new Uint8Array(NCL);
  rasterPoly(arena.p, (cx, cz) => { inArena[cz * GW + cx] = 1; set0(cx, cz, 1); });
  const isIn = (cx, cz) => cx >= 0 && cz >= 0 && cx < GW && cz < GH && inArena[cz * GW + cx] === 1;
  // hall (rect -50..30 x 36..55,8) hors anneau de façade
  const hall = scene.interieur.find(o => /^Hall/.test(o.n));
  const hp = hall.p; const hx0 = Math.min(hp[0], hp[2], hp[4]), hx1 = Math.max(hp[0], hp[2], hp[4]), hz0 = Math.min(hp[1], hp[3], hp[5]), hz1 = Math.max(hp[1], hp[3], hp[5]);
  rasterRect(hx0, hz0, hx1, hz1, (cx, cz) => {
    if (!isIn(cx, cz)) return;
    for (let k = 0; k < 8; k++) if (!isIn(cx + DX[k], cz + DZ[k])) return; // anneau de façade : reste mur
    set0(cx, cz, 0);
  });
  // portes publiques
  const doors = scene.portes.filter(p => p.k === 'entrance' && p.l.includes(0) && !/gymnase|logistique|fermé/i.test(p.n));
  const gates = [];
  const ab = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
  for (let i = 0; i < arena.p.length; i += 2) { ab.x0 = Math.min(ab.x0, arena.p[i]); ab.x1 = Math.max(ab.x1, arena.p[i]); ab.z0 = Math.min(ab.z0, arena.p[i + 1]); ab.z1 = Math.max(ab.z1, arena.p[i + 1]); }
  for (const d of doors) {
    const sides = [[0, 1, ab.z1 - d.z], [0, -1, d.z - ab.z0], [1, 0, ab.x1 - d.x], [-1, 0, d.x - ab.x0]].sort((a, b) => a[2] - b[2]);
    const [dx, dz] = sides[0]; // direction vers l'extérieur
    let cx = Math.floor(d.x - dx * 12 - X0), cz = Math.floor(d.z - dz * 12 - Z0);
    if (!isIn(cx, cz)) throw new Error('buildWorld : porte ' + d.n + ' : point intérieur hors de l\'Arena');
    while (isIn(cx + dx, cz + dz)) { cx += dx; cz += dz; } // dernière cellule de l'Arena = façade
    const ux = dz !== 0 ? 1 : 0, uz = dx !== 0 ? 1 : 0; // axe transversal
    const deep = d.n === 'Porte Chapelle' ? 9 : 6, half = d.n === 'Porte Chapelle' ? 4 : d.w / 2;
    const cells = [], pocket = [];
    for (let k = -deep; k <= 0; k++) for (let s = -Math.ceil(half); s <= Math.ceil(half); s++) {
      if (Math.abs(s) > half - 0.5 + (d.n === 'Porte Chapelle' ? 0.5 : 0) && Math.abs(s) > 0) { if (Math.abs(s) - 0.5 >= half) continue; }
      const px = cx + dx * k + ux * s, pz = cz + dz * k + uz * s;
      if (px < 0 || pz < 0 || px >= GW || pz >= GH) continue;
      set0(px, pz, 0); pocket.push(pz * GW + px);
      if (k >= -1 && Math.abs(s) - 0.5 < d.w / 2) cells.push(pz * GW + px); // cellules que la fermeture remplit (façade, 2 m)
    }
    gates.push({ name: d.n, x: d.x, z: d.z, w: d.w, dir: [dx, dz], facade: [X0 + cx + 0.5, Z0 + cz + 0.5], cells, pocket, open: true });
  }
  // sorties : intérieur de l'Arena (niveau 0) = surface de l'emprise
  // --- niveau 1 ---
  const [g0, g1] = scene.gradins; const FL = g0.floor, C = g0.corner;
  const lowOut = g0.off + g0.rows * g0.depth; // 10,3
  const WALL = 1.3; // mur tribune / coursive (estimé : épaisseur)
  const L1 = NCL, L2 = 2 * NCL;
  const open1 = (cx, cz) => { solid[L1 + cz * GW + cx] = 0; };
  for (const o of scene.interieur) if (/^Coursive/.test(o.n)) rasterPoly(o.p, open1);
  // coins non couverts par les bandes (rectangle intérieur hors tribune) : traités comme coursive (estimé)
  const innerBox = [FL[0] - lowOut, FL[1] - lowOut, FL[2] + lowOut, FL[3] + lowOut];
  rasterRect(innerBox[0], innerBox[1], innerBox[2], innerBox[3], (cx, cz) => {
    const x = X0 + cx + 0.5, z = Z0 + cz + 0.5, sd = sdRR(FL, C, x, z);
    if (sd > lowOut + 0.5) open1(cx, cz);
  });
  // tribune basse : anneau de rangs, vitesse x0,5 ; mur au-delà ; aire de jeu exclue
  const spdL1 = L1;
  rasterRect(innerBox[0] - 2, innerBox[1] - 2, innerBox[2] + 2, innerBox[3] + 2, (cx, cz) => {
    const x = X0 + cx + 0.5, z = Z0 + cz + 0.5, sd = sdRR(FL, C, x, z), c = L1 + cz * GW + cx;
    if (sd < g0.off - 0.5) { solid[c] = 1; return; }
    if (sd <= lowOut + 0.5) { solid[c] = 0; spd[c] = 0.5; return; }
    if (sd <= lowOut + 0.5 + WALL) { solid[c] = 1; return; }
  });
  // vomitoires : percements du mur
  const vom = scene.portes.filter(p => p.k === 'vomitoire');
  const vomitoires = vom.map(v => {
    // point du mur le plus proche : on projette radialement depuis le rectangle réduit
    const qx = Math.min(Math.max(v.x, FL[0] + C), FL[2] - C), qz = Math.min(Math.max(v.z, FL[1] + C), FL[3] - C);
    let nx = v.x - qx, nz = v.z - qz; const len = Math.hypot(nx, nz) || 1; nx /= len; nz /= len;
    const rad = C + lowOut + 0.5 + WALL / 2; let gx = qx + nx * rad, gz = qz + nz * rad; // centre du percement
    if (Math.abs(nx) > 0.99) gz = Math.floor(gz) + 0.5; else if (Math.abs(nz) > 0.99) gx = Math.floor(gx) + 0.5; // centré sur une maille : 3 mailles de large
    const tx = -nz, tz = nx, cells = [];
    rasterRect(gx - 4, gz - 4, gx + 4, gz + 4, (cx, cz) => {
      const x = X0 + cx + 0.5, z = Z0 + cz + 0.5, sd = sdRR(FL, C, x, z);
      if (sd <= lowOut + 0.49 || sd > lowOut + 0.5 + WALL + 0.6) return; // seulement le mur (et 0,6 m de part et d'autre)
      const off = (x - gx) * tx + (z - gz) * tz;
      if (Math.abs(off) <= v.w / 2 + 0.3) cells.push(L1 + cz * GW + cx); // 2,4 m annoncés -> 3 mailles (3 m)
    });
    if (Math.abs(nx) > 0.3 && Math.abs(nz) > 0.3) { // percement en diagonale : on l'élargit d'une maille pour que les déplacements en diagonale passent
      for (const c0 of [...cells]) {
        const r0 = c0 % NCL, cx0 = r0 % GW, cz0 = (r0 / GW) | 0;
        for (let k = 0; k < 4; k++) {
          const cx = cx0 + DX[k], cz = cz0 + DZ[k], c = L1 + cz * GW + cx;
          const sd = sdRR(FL, C, X0 + cx + 0.5, Z0 + cz + 0.5);
          if (solid[c] && sd > lowOut + 0.49 && sd <= lowOut + 0.5 + WALL + 0.6 && !cells.includes(c)) cells.push(c);
        }
      }
    }
    for (const c of cells) solid[c] = 0;
    return { name: v.n, x: v.x, z: v.z, w: v.w, cells, open: true, g: [gx, gz] };
  });
  // --- niveau 2 : tribune haute x0,5 + galerie 3 m ---
  const hiOut = g1.off + g1.rows * g1.depth; // 17,2
  const gal = 3;
  rasterRect(FL[0] - hiOut - gal - 2, FL[1] - hiOut - gal - 2, FL[2] + hiOut + gal + 2, FL[3] + hiOut + gal + 2, (cx, cz) => {
    const x = X0 + cx + 0.5, z = Z0 + cz + 0.5, sd = sdRR(FL, C, x, z), c = L2 + cz * GW + cx;
    if (sd >= g1.off - 0.5 && sd <= hiOut + 0.5) { solid[c] = 0; spd[c] = 0.5; } else if (sd > hiOut + 0.5 && sd <= hiOut + 0.5 + gal) { solid[c] = 0; }
  });
  // --- barrages ---
  const barrages = [];
  const mkBarrage = (key, name, namePat, hint) => {
    let best = null;
    for (const r of scene.rues) {
      if (!namePat.test(r.n) || !/primary|secondary|tertiary|trunk/.test(r.k)) continue;
      for (let i = 0; i + 3 < r.p.length; i += 2) {
        const ax = r.p[i], az = r.p[i + 1], bx = r.p[i + 2], bz = r.p[i + 3], L = Math.hypot(bx - ax, bz - az) || 1;
        for (let s = 0; s <= L; s += 1) {
          const px = ax + (bx - ax) * s / L, pz = az + (bz - az) * s / L, d = Math.hypot(px - hint[0], pz - hint[1]);
          if (!best || d < best.d) best = { d, px, pz, tx: (bx - ax) / L, tz: (bz - az) / L };
        }
      }
    }
    if (!best) throw new Error('buildWorld : barrage ' + name + ' : rue introuvable');
    const nx = -best.tz, nz = best.tx, seen = new Set(), cells = [];
    for (let s = -40; s <= 40; s += 0.5) for (const k of [-0.75, 0.25]) {
      const x = best.px + nx * s + best.tx * k, z = best.pz + nz * s + best.tz * k;
      if (x < X0 + 1 || x > X0 + GW - 1 || z < Z0 + 1 || z > Z0 + GH - 1) continue;
      const c = cellIdx(0, x, z); if (!seen.has(c)) { seen.add(c); cells.push(c); }
    }
    barrages.push({ key, name, x: best.px, z: best.pz, cells, on: false });
  };
  mkBarrage('ney_est', 'bd Ney est', /^Boulevard Ney$/i, [115, 128]);
  mkBarrage('chapelle_nord', 'av. de la Porte de la Chapelle nord', /^Avenue de la Porte de la Chapelle$/i, [-85, -75]);
  mkBarrage('rue_chapelle_sud', 'rue de la Chapelle sud', /^Rue de la Chapelle$/i, [-108, 255]);
  // --- cibles ---
  const sinks = [];
  const bouches = scene.metro.filter(m => m.t === 'metro' && Math.hypot(m.x, m.z) < 300).sort((a, b) => a.z - b.z);
  bouches.forEach((b, i) => {
    const cells = []; const cx = Math.floor(b.x - X0), cz = Math.floor(b.z - Z0);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { set0(cx + dx, cz + dz, 0); cells.push((cz + dz) * GW + cx + dx); }
    sinks.push({ kind: 'metro', target: T_METRO, name: 'Métro ' + (b.n || i), idx: i, x: b.x, z: b.z, cells, open: true, queue: [], credit: 0 });
  });
  const quaiOf = { tramOuest: 'Porte de la Chapelle', tramEst: 'Colette Besson' };
  for (const [tn, qn] of Object.entries(quaiOf)) {
    const cells = [];
    for (const q of scene.quais.filter(q => q.n === qn)) rasterPoly(q.p, (cx, cz) => { set0(cx, cz, 0); cells.push(cz * GW + cx); });
    const xs = cells.map(c => cellX(c)), zs = cells.map(c => cellZ(c));
    sinks.push({ kind: 'tram', target: TARGETS.indexOf(tn), name: tn + ' (' + qn + ')', x: xs.reduce((a, b) => a + b, 0) / xs.length, z: zs.reduce((a, b) => a + b, 0) / zs.length, cells, open: true, wait: [], nextTrain: tn === 'tramOuest' ? 90 : 150, lastTrain: 0 });
  }
  // à pied : bords du domaine sur les grands axes (cellules du bord à 12 m d'un croisement de rue principale, sinon tout le bord)
  const edges = { pied_sud: { z: Z0 + GH - 0.5, vert: false }, pied_est: { x: X0 + GW - 0.5, vert: true }, pied_nord: { z: Z0 + 0.5, vert: false } };
  for (const [tn, e] of Object.entries(edges)) {
    const cross = [];
    for (const r of scene.rues) {
      if (!/primary|secondary|trunk|tertiary/.test(r.k)) continue;
      for (let i = 0; i + 3 < r.p.length; i += 2) {
        const ax = r.p[i], az = r.p[i + 1], bx = r.p[i + 2], bz = r.p[i + 3];
        if (e.vert) { const L = X0 + GW; if ((ax - L) * (bx - L) <= 0 && ax !== bx) cross.push(az + (L - ax) / (bx - ax) * (bz - az)); }
        else { const L = e.z < 0 ? Z0 : Z0 + GH; if ((az - L) * (bz - L) <= 0 && az !== bz) cross.push(ax + (L - az) / (bz - az) * (bx - ax)); }
      }
    }
    const cells = [];
    const lo = e.vert ? Z0 : X0, hi = e.vert ? Z0 + GH : X0 + GW;
    for (let u = lo + 0.5; u < hi; u += 1) {
      if (cross.length && !cross.some(c => Math.abs(c - u) < 12)) continue;
      const c = e.vert ? cellIdx(0, e.x, u) : cellIdx(0, u, e.z);
      if (!solid[c]) cells.push(c);
    }
    sinks.push({ kind: 'pied', target: TARGETS.indexOf(tn), name: tn, cells, open: true });
  }
  const sinkAt = new Int16Array(NCELL).fill(-1);
  sinks.forEach((s, i) => { for (const c of s.cells) sinkAt[c] = i; });
  // --- liens entre niveaux ---
  const linkUp = new Int32Array(NCELL).fill(-1), linkDown = new Int32Array(NCELL).fill(-1); // linkUp[bas] = haut ; linkDown[haut] = bas
  const links = [], linkOf = new Int16Array(NCELL).fill(-1);
  const mkLink = (name, kind, lUp, xu, zu, lDn, xd, zd, width, axis) => {
    const ups = [], downs = [], n = Math.round(width);
    for (let s = 0; s < n; s++) {
      const o = s - (n - 1) / 2, a = axis === 'x' ? [o, 0] : [0, o];
      const cu = cellIdx(lUp, xu + a[0], zu + a[1]), cd = cellIdx(lDn, xd + a[0], zd + a[1]);
      if (solid[cu] || solid[cd]) continue;
      ups.push(cu); downs.push(cd); linkUp[cd] = cu; linkDown[cu] = cd; linkOf[cu] = links.length;
    }
    if (!ups.length) throw new Error('buildWorld : lien ' + name + ' sans cellule praticable');
    links.push({ id: links.length, name, kind, lUp, lDn, width, gap: 1 / (FLOW_SPEC * width), dur: STAIR_DUR, ups, downs, x: xu, z: zu });
  };
  for (const g of gates) {
    if (g.name === 'Porte Chapelle') mkLink('Escalier ' + g.name, 'hall', 1, -52, g.z, 0, g.facade[0] + 4, g.z, 4, 'z');
    else mkLink('Escalier ' + g.name, 'hall', 1, g.x, 46, 0, g.x, g.facade[1] - 4.5, 4, 'x');
  }
  const rgal = hiOut + 0.5 + gal / 2, cdiag = Math.SQRT1_2;
  for (const [sx, sz, nm] of [[-1, -1, 'nord-ouest'], [1, -1, 'nord-est'], [-1, 1, 'sud-ouest'], [1, 1, 'sud-est']]) {
    const qx = sx < 0 ? FL[0] + C : FL[2] - C, qz = sz < 0 ? FL[1] + C : FL[3] - C;
    const x = qx + sx * cdiag * (C + rgal), z = qz + sz * cdiag * (C + rgal);
    mkLink('Escalier galerie ' + nm, 'galerie', 2, x, z, 1, x, z, 3, 'x');
  }
  // --- sièges ---
  const seats = [];
  scene.gradins.forEach((g, ti) => {
    const lvl = ti === 0 ? 1 : 2;
    for (let row = 0; row < g.rows; row++) {
      const d = g.off + (row + 0.5) * g.depth, rr = g.corner + d, f = g.floor;
      const sx = f[2] - f[0] - 2 * g.corner, sz = f[3] - f[1] - 2 * g.corner, arc = Math.PI / 2 * rr;
      const Ltot = 2 * sx + 2 * sz + 4 * arc, n = Math.round(Ltot / 0.5), st = Ltot / n;
      const cxs = [f[2] - g.corner, f[2] - g.corner, f[0] + g.corner, f[0] + g.corner], czs = [f[1] + g.corner, f[3] - g.corner, f[3] - g.corner, f[1] + g.corner];
      for (let k = 0; k < n; k++) {
        let u = k * st, x, z;
        if (u < sx) { x = f[0] + g.corner + u; z = f[1] - d; }
        else if ((u -= sx) < arc) { const a = -Math.PI / 2 + u / rr; x = cxs[0] + rr * Math.cos(a); z = czs[0] + rr * Math.sin(a); }
        else if ((u -= arc) < sz) { x = f[2] + d; z = f[1] + g.corner + u; }
        else if ((u -= sz) < arc) { const a = u / rr; x = cxs[1] + rr * Math.cos(a); z = czs[1] + rr * Math.sin(a); }
        else if ((u -= arc) < sx) { x = f[2] - g.corner - u; z = f[3] + d; }
        else if ((u -= sx) < arc) { const a = Math.PI / 2 + u / rr; x = cxs[2] + rr * Math.cos(a); z = czs[2] + rr * Math.sin(a); }
        else if ((u -= arc) < sz) { x = f[0] - d; z = f[3] - g.corner - u; }
        else { u -= sz; const a = Math.PI + u / rr; x = cxs[3] + rr * Math.cos(a); z = czs[3] + rr * Math.sin(a); }
        seats.push({ x, z, l: lvl, tier: ti, row, k, n, y: g.y0 + row * g.rise + 0.7 });
      }
    }
  });
  const places = scene.gradins.reduce((a, g) => a + g.places, 0);
  // --- champs ---
  const wd = new Float32Array(NCELL), cost = new Float64Array(NCELL), zoneMul = new Float32Array(NCELL).fill(1);
  const eng = new Engine({ solid, wd, cost, zoneMul, spd, linkUp, linkDown, sinkAt, sinks });
  const t1 = now();
  { // wd exact : on part des cellules ouvertes proches d'un mur
    const R3 = 3;
    wd.fill(3);
    for (let l = 0; l < NL; l++) for (let cz = 0; cz < GH; cz++) for (let cx = 0; cx < GW; cx++) {
      const c = l * NCL + cz * GW + cx;
      if (!solid[c]) continue;
      wd[c] = 0;
      let edge = false;
      for (let k = 0; k < 4 && !edge; k++) { const nx = cx + DX[k], nz = cz + DZ[k]; if (nx >= 0 && nz >= 0 && nx < GW && nz < GH && !solid[l * NCL + nz * GW + nx]) edge = true; }
      if (!edge) continue;
      for (let dz = -R3; dz <= R3; dz++) { const nz = cz + dz; if (nz < 0 || nz >= GH) continue; for (let dx = -R3; dx <= R3; dx++) { const nx = cx + dx; if (nx < 0 || nx >= GW) continue; const n = l * NCL + nz * GW + nx; if (solid[n]) continue; const d = Math.hypot(Math.max(Math.abs(dx) - 0.5, 0), Math.max(Math.abs(dz) - 0.5, 0)); if (d < wd[n]) wd[n] = d; } }
    }
  }
  for (let c = 0; c < NCELL; c++) eng.costCell(c);
  const t2 = now();
  const fieldMs = [];
  TARGETS.forEach((_, t) => { const a = now(); eng.fullCompute(t); fieldMs.push(Math.round(now() - a)); });
  const world = {
    solid, spd, inArena, gates, vomitoires, barrages, bouches, sinks, sinkAt, links, linkOf, seats, places, engine: eng, bounds: { X0, Z0, GW, GH },
    info: { buildMs: Math.round(now() - t0), geometryMs: Math.round(t1 - t0), distanceMs: Math.round(t2 - t1), fieldMs, seats: seats.length, places },
  };
  return world;
}

// ---------- Simulation ----------
const S_SEATED = 0, S_WALK = 1, S_HES = 2, S_QUEUE = 3, S_STAIRS = 4, S_GONE = 5;
const STATE_NAME = ['seated', 'walking', 'hesitating', 'queueing', 'stairs', 'gone'];

export class Sim {
  constructor(world, opts = {}) {
    this.world = world; this.seed = opts.seed ?? 1; this.rand = rng(this.seed);
    this.eng = world.engine.clone(); this.T = 0; this.stepCount = 0;
    this.dyn = new Uint8Array(NCELL); this.base = world.solid;
    this.gates = world.gates.map(g => ({ ...g })); this.vomitoires = world.vomitoires.map(v => ({ ...v }));
    this.barrages = world.barrages.map(b => ({ ...b }));
    this.sinks = this.eng.sinks; this.links = world.links.map(l => ({ ...l })); this.infoDelay = 0; this.timers = []; this.pmrOut = [];
    this.linkNext = world.links.map(() => 0);
    this.stationOpen = true; this.tramHeadway = TRAM_HEADWAY;
    this.zones = []; this.zoneCount = new Uint8Array(NCELL); this.announces = []; this.alertLog = []; this.pendingAlerts = [];
    this.alertActive = new Map(); this.orders = []; this.stewards = []; this.stewardTok = 1; this.nextId = 1;
    this.recalcLog = []; this.lastRecalc = null; this.absorbLog = []; this.closedAt = new Map();
    this.exposure = 0; this.zoneExposure = 0; this.dmax = 0; this.dmaxAt = null; this.t95 = null;
    this.byTarget = Object.fromEntries(TARGETS.map(k => [k, 0]));
    this.hStart = new Int32Array(HN * NL + 1); this.hOrder = new Int32Array(0); this.stats = null;
    this.spawn(opts.fill ?? 0.85);
    this.hOrder = new Int32Array(this.cap);
    this.refreshStats();
  }

  // ----- population -----
  spawn(fill) {
    const w = this.world, r = this.rand;
    const p = Math.min(1, fill * w.places / w.seats.filter(s => s.k % 12 !== 11).length);
    const occ = [];
    for (const s of w.seats) if (s.k % 12 !== 11 && r() < p) occ.push(s);
    const NP = occ.length, MAXS = 64, cap = NP + MAXS;
    this.NP = NP; this.cap = cap; this.nSt = 0;
    const F = n => new Float64Array(n), I = n => new Int32Array(n), B = n => new Uint8Array(n);
    this.x = F(cap); this.z = F(cap); this.vx = F(cap); this.vz = F(cap); this.ex = F(cap); this.ez = F(cap);
    this.v0 = F(cap); this.pre = F(cap); this.next = F(cap); this.hes = F(cap); this.bh = F(cap); this.dAvg = F(cap); this.rideT1 = F(cap);
    this.lv = B(cap); this.st = B(cap); this.tgt = new Int8Array(cap).fill(-1); this.fam = new Int8Array(cap).fill(-1);
    this.gid = I(cap); this.buddy = I(cap).fill(-1); this.rideLink = new Int16Array(cap).fill(-1); this.rideDown = I(cap);
    this.obeyA = B(cap); this.obeyS = B(cap); this.tier = B(cap); this.sy = F(cap); this.tokSeen = I(cap); this.annSeen = I(cap); this.kind = B(cap);
    this.spotX = F(cap); this.spotZ = F(cap); this.waitLink = new Int16Array(cap).fill(-1); this.onSink = new Int16Array(cap).fill(-1);
    const g = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.2832 * r());
    const ll = (med, b) => { const u = Math.min(0.999, Math.max(0.001, r())); return med * Math.pow(u / (1 - u), 1 / b); };
    const famDraw = () => { const u = r(); if (u < 0.55) return 0; if (u < 0.675) return 1; if (u < 0.80) return 2; const v = r(); return v < 0.35 ? 3 : v < 0.65 ? 4 : 5; };
    let i = 0, left = 0, gpre = 0, gfam = 0, glead = -1, gidn = 0, prevSeat = null;
    for (const s of occ) {
      const adj = prevSeat && prevSeat.tier === s.tier && prevSeat.row === s.row && s.k === prevSeat.k + 1;
      if (left <= 0 || !adj) { // nouveau groupe : 1 (60 %), 2 (24 %), 3 (16 %) ; estimé
        const u = r(); left = u < 0.6 ? 1 : u < 0.84 ? 2 : 3; gpre = ll(MED_PRE, SHAPE_PRE); gfam = famDraw(); glead = i; gidn++;
      }
      this.x[i] = s.x; this.z[i] = s.z; this.lv[i] = s.l; this.sy[i] = s.y; this.tier[i] = s.l; this.st[i] = S_SEATED;
      this.pre[i] = gpre + r() * 4; this.fam[i] = gfam; this.gid[i] = gidn; this.buddy[i] = glead === i ? -1 : glead;
      this.v0[i] = Math.max(0.75, 1.34 + 0.26 * g()); this.bh[i] = Math.max(0, 1 + 0.6 * g());
      this.obeyA[i] = r() < OBEY_ANNOUNCE ? 1 : 0; this.obeyS[i] = r() < OBEY_STEWARD ? 1 : 0;
      this.next[i] = 0; left--; prevSeat = s; i++;
    }
    this.total = NP;
    // entiers de comptage
    this.nOut = 0;
  }
  get N() { return this.NP + this.nSt; }

  // ----- murs dynamiques -----
  _setSolid(cells, delta) {
    const out = [];
    for (const c of cells) { this.dyn[c] += delta; this.eng.solid[c] = (this.base[c] || this.dyn[c] > 0) ? 1 : 0; out.push(c); }
    return out;
  }
  _eject(cells) { // personnes prises dans un mur qui vient de se fermer : on les pousse vers la cellule libre la plus proche
    const cs = new Set(cells); let n = 0;
    for (let i = 0; i < this.N; i++) {
      if (this.st[i] === S_GONE || this.st[i] === S_SEATED || this.st[i] === S_STAIRS) continue;
      const c = cellIdx(this.lv[i], this.x[i], this.z[i]);
      if (!this.eng.solid[c]) continue;
      const r = c % NCL, cx = r % GW, cz = (r / GW) | 0, base = c - r;
      let found = -1;
      for (let rad = 1; rad < 12 && found < 0; rad++) for (let dz = -rad; dz <= rad && found < 0; dz++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue;
        const nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
        const k = base + nz * GW + nx; if (!this.eng.solid[k] && !this._blockedCell(k)) { found = k; break; }
      }
      if (found >= 0) { this.x[i] = cellX(found) + (this.rand() - 0.5) * 0.4; this.z[i] = cellZ(found) + (this.rand() - 0.5) * 0.4; this.vx[i] = this.vz[i] = 0; n++; }
    }
    return n;
  }
  _blockedCell(k) { // une cellule libre dont les 8 voisines sont libres (pour y poser une personne de rayon R)
    const r = k % NCL, cx = r % GW, cz = (r / GW) | 0, base = k - r;
    for (let j = 0; j < 8; j++) { const nx = cx + DX[j], nz = cz + DZ[j]; if (nx < 0 || nz < 0 || nx >= GW || nz >= GH || this.eng.solid[base + nz * GW + nx]) return true; }
    return false;
  }
  _recalc(what, cells, targets) {
    const m = this.eng.applyChange(cells, targets);
    const ej = this._eject(cells);
    const rec = { t: this.T, what, ms: +m.ms.toFixed(1), fields: m.fields, window: m.window, invalidatedByField: m.invalidated, ejected: ej };
    this.lastRecalc = rec; this.recalcLog.push(rec); return rec;
  }
  _find(list, id, label) {
    if (typeof id === 'number') return list[id];
    const s = String(id).toLowerCase();
    return list.find(e => (e.name || '').toLowerCase() === s || (e.key || '').toLowerCase() === s) || list.find(e => (e.name || '').toLowerCase().includes(s)) || (() => { throw new Error(label + ' inconnu : ' + id); })();
  }
  _gateOrVom(id) {
    if (typeof id === 'string' && /vomitoire/i.test(id)) return this._find(this.vomitoires, id, 'vomitoire');
    if (typeof id === 'object' && id) return id;
    return null;
  }
  setGate(id, open) {
    const g = typeof id === 'string' && /vomitoire/i.test(id) ? this._find(this.vomitoires, id, 'vomitoire') : this._find(this.gates, id, 'porte');
    if (g.open === !!open) return null;
    g.open = !!open; if (!open) this.closedAt.set(g, this.T);
    const cells = this._setSolid(g.cells, open ? -1 : 1);
    return this._recalc((open ? 'ouvre ' : 'ferme ') + g.name, cells);
  }
  setVomitoire(id, open) {
    const g = typeof id === 'number' ? this.vomitoires[id - 1] : this._find(this.vomitoires, typeof id === 'string' && !/vomitoire/i.test(id) ? 'Vomitoire ' + id : id, 'vomitoire');
    if (!g) throw new Error('vomitoire inconnu : ' + id);
    if (g.open === !!open) return null;
    g.open = !!open; if (!open) this.closedAt.set(g, this.T);
    const cells = this._setSolid(g.cells, open ? -1 : 1);
    return this._recalc((open ? 'ouvre ' : 'ferme ') + g.name, cells);
  }
  _metroSet(list, open) {
    const cells = [], released = [];
    for (const s of list) {
      if (s.open === !!open) continue;
      s.open = !!open;
      if (!open) {
        this.closedAt.set(s, this.T);
        for (const c of s.cells) cells.push(c);
        for (const i of s.queue) { this.st[i] = S_HES; this.hes[i] = 2 + this.rand() * 3; this.onSink[i] = -1; this.tgt[i] = -1; released.push(i); }
        s.queue = []; s.credit = 0;
      } else for (const c of s.cells) cells.push(c);
    }
    if (!cells.length) return null;
    return this._recalc((open ? 'ouvre' : 'ferme') + ' métro', cells, [T_METRO]);
  }
  setMetroEntrance(i, open) { const s = this.sinks.filter(k => k.kind === 'metro')[i]; if (!s) throw new Error('bouche de métro inconnue : ' + i); return this._metroSet([s], open); }
  setMetroStation(open) { this.stationOpen = !!open; return this._metroSet(this.sinks.filter(k => k.kind === 'metro'), open); }
  setTramStop(name, open) { // arrêt de tram fermé : plus de rame, la foule se reporte
    const s = this.sinks.find(k => k.kind === 'tram' && (k.name === name || TARGETS[k.target] === name)); if (!s) throw new Error('arrêt inconnu : ' + name);
    if (s.open === !!open) return null; s.open = !!open;
    if (!open) { this.closedAt.set(s, this.T); for (const i of s.wait) { this.st[i] = S_HES; this.hes[i] = 2 + this.rand() * 3; this.tgt[i] = -1; this.onSink[i] = -1; } s.wait = []; }
    return this._recalc((open ? 'ouvre ' : 'ferme ') + s.name, s.cells, [s.target]);
  }
  // Catalogue de contraintes de l'équipe : applique (on=true) ou lève (on=false) un levier {code,id,nom,type,x,z,niveau,...}.
  apply(lev, on = true) {
    const near = (list, x, z, max) => { let b = null, bd = max; for (const e of list) { const ex = e.x ?? e.g?.[0], ez = e.z ?? e.g?.[1], d = Math.hypot(ex - x, ez - z); if (d < bd) { bd = d; b = e; } } return b; };
    const out = { code: lev.code, id: lev.id, on, applied: false, detail: '' };
    this._levZones = this._levZones || new Map();
    switch (lev.code) {
      case 'C1': {
        if (lev.type === 'station') { out.recalc = this.setMetroStation(!on); out.applied = true; out.detail = 'station entière'; }
        else if (lev.type === 'metro') {
          const b = near(this.sinks.filter(k => k.kind === 'metro'), lev.x, lev.z, 120);
          if (b) { out.recalc = this.setMetroEntrance(b.idx, !on); out.applied = true; out.detail = b.name; } else out.detail = "aucune bouche modélisée à moins de 120 m (seules les bouches < 300 m de l'Arena le sont)";
        } else if (lev.type === 'tram') {
          const b = near(this.sinks.filter(k => k.kind === 'tram'), lev.x, lev.z, 150);
          if (b) { out.recalc = this.setTramStop(b.name, !on); out.applied = true; out.detail = b.name; } else out.detail = 'aucun arrêt de tram modélisé à moins de 150 m';
        }
        break;
      }
      case 'B1': {
        const list = lev.type === 'vomitoire' ? this.vomitoires : this.gates;
        const g = near(list, lev.x, lev.z, lev.type === 'vomitoire' ? 40 : 15);
        if (g) { out.recalc = lev.type === 'vomitoire' ? this.setVomitoire(this.vomitoires.indexOf(g) + 1, !on) : this.setGate(this.gates.indexOf(g), !on); out.applied = true; out.detail = g.name; }
        else out.detail = 'pas de porte/vomitoire de la géométrie estimée à moins de ' + (lev.type === 'vomitoire' ? 40 : 15) + ' m (issue du plan NP2F non modélisée)';
        break;
      }
      case 'B3': { // escalator -> escalier : 0,7 m/s au lieu de 1,3 m/s, débit réduit dans le même rapport
        const k = near(this.links.filter(l => l.kind === 'hall'), lev.x, lev.z, 30);
        if (k) { const f = on ? 1.3 / 0.7 : 1; k.dur = STAIR_DUR * f; k.gap = (1 / (FLOW_SPEC * k.width)) * f; out.applied = true; out.detail = k.name + ' : durée ' + k.dur.toFixed(1) + ' s, écart ' + k.gap.toFixed(2) + ' s'; }
        else out.detail = 'aucun escalier modélisé à moins de 30 m';
        break;
      }
      case 'B5': this.pmrOut = on ? [...this.pmrOut, lev.id] : this.pmrOut.filter(i => i !== lev.id); out.detail = 'enregistré ; pas de profil PMR dans cette population : aucun effet sur la foule'; break;
      case 'D1': case 'D2': {
        if (on && !this._levZones.has(lev.id)) this._levZones.set(lev.id, this.addDangerZone(lev.poly ? { level: 0, poly: lev.poly, x: lev.x, z: lev.z } : { level: 0, x: lev.x, z: lev.z, r: lev.rayon ?? 20 }));
        if (!on && this._levZones.has(lev.id)) { this.removeDangerZone(this._levZones.get(lev.id)); this._levZones.delete(lev.id); }
        out.applied = true; out.detail = 'zone à éviter (coût x5)'; break;
      }
      case 'D5': {
        if (on && !this._levZones.has(lev.id)) this._levZones.set(lev.id, this.addDangerZone({ level: 0, x: lev.x, z: lev.z, r: lev.rayon ?? 50, closed: true, minutes: lev.duree_min ?? 60 }));
        if (!on && this._levZones.has(lev.id)) { this.removeDangerZone(this._levZones.get(lev.id)); this._levZones.delete(lev.id); }
        out.applied = true; out.detail = 'zone fermée r=' + (lev.rayon ?? 50) + ' m pendant ' + (lev.duree_min ?? 60) + ' min'; break;
      }
      case 'F1': this.infoDelay = on ? (lev.retard_min ?? 0) * 60 : 0; out.applied = true; out.detail = 'annonces et ordres retardés de ' + this.infoDelay + ' s'; break;
      default: throw new Error('code de levier inconnu : ' + lev.code);
    }
    out.recalcMs = out.recalc ? out.recalc.ms : 0;
    return out;
  }
  setTramHeadway(sec) {
    this.tramHeadway = sec;
    for (const s of this.sinks) if (s.kind === 'tram') s.nextTrain = Math.max(this.T + 1, s.lastTrain + sec);
  }
  setBarrage(name, on) {
    const b = this._find(this.barrages, name, 'barrage');
    if (b.on === !!on) return null;
    b.on = !!on; const cells = this._setSolid(b.cells, on ? 1 : -1);
    return this._recalc((on ? 'pose ' : 'lève ') + 'barrage ' + b.name, cells);
  }
  // zone à éviter (coût x5, estimé) ; {level,x,z,r} ou {level,poly:[x,z,...]} ; closed:true = zone fermée (murs) ; minutes = durée avant levée automatique
  addDangerZone({ level = 0, x, z, r, poly = null, closed = false, minutes = 0 }) {
    const id = this.nextId++, cells = [];
    if (poly) rasterPoly(poly, (cx, cz) => cells.push(level * NCL + cz * GW + cx));
    else {
      const c0 = cellIdx(level, x, z), cr = c0 % NCL, cx = cr % GW, cz = (cr / GW) | 0, rr = Math.ceil(r);
      for (let dz = -rr; dz <= rr; dz++) for (let dx = -rr; dx <= rr; dx++) {
        if (dx * dx + dz * dz > r * r) continue;
        const nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
        cells.push(level * NCL + nz * GW + nx);
      }
    }
    this.zones.push({ id, level, x, z, r, cells, closed });
    if (closed) { this._setSolid(cells, 1); this._recalc('zone fermée ' + id, cells); }
    else { for (const c of cells) { this.zoneCount[c]++; this.eng.zoneMul[c] = 5; } this._recalc('zone de danger ' + id, cells, null, 0); }
    if (minutes > 0) this.timers.push({ at: this.T + minutes * 60, fn: () => this.removeDangerZone(id) });
    return id;
  }
  removeDangerZone(id) {
    const k = this.zones.findIndex(z => z.id === id); if (k < 0) return null;
    const z = this.zones[k]; this.zones.splice(k, 1);
    if (z.closed) this._setSolid(z.cells, -1);
    else for (const c of z.cells) { if (--this.zoneCount[c] === 0) this.eng.zoneMul[c] = 1; }
    return this._recalc('fin zone de danger ' + id, z.cells);
  }
  holdSector(tier, untilT) {
    const lvl = tier === 'basse' || tier === 1 ? 1 : tier === 'haute' || tier === 2 ? 2 : -1;
    if (lvl < 0) throw new Error("tribune inconnue : " + tier + " (attendu 'basse'|'haute'|1|2)");
    let n = 0;
    for (let i = 0; i < this.NP; i++) if (this.st[i] === S_SEATED && this.tier[i] === lvl) { this.pre[i] = Math.max(this.pre[i], untilT) + this.rand() * 30; n++; } // lâcher étalé sur 30 s (estimé)
    return n;
  }
  _zoneTest(zone) { // zone : 'parvis'|'hall'|'coursive'|'tribune_basse'|'tribune_haute'|'galerie'|'tout' ou {x0,z0,x1,z1,level?} ou {x,z,r,level?}
    const w = this.world;
    if (typeof zone === 'object') {
      return (i) => (zone.level == null || this.lv[i] === zone.level) && (zone.r != null ? Math.hypot(this.x[i] - zone.x, this.z[i] - zone.z) <= zone.r : this.x[i] >= zone.x0 && this.x[i] <= zone.x1 && this.z[i] >= zone.z0 && this.z[i] <= zone.z1);
    }
    switch (zone) {
      case 'tout': return () => true;
      case 'parvis': return i => this.lv[i] === 0 && !w.inArena[cellIdx(0, this.x[i], this.z[i])] && this.x[i] > -90 && this.x[i] < 60 && this.z[i] > 50 && this.z[i] < 125;
      case 'hall': return i => this.lv[i] === 0 && w.inArena[cellIdx(0, this.x[i], this.z[i])] === 1;
      case 'coursive': return i => this.lv[i] === 1 && this.eng.spd[cellIdx(1, this.x[i], this.z[i])] === 1;
      case 'tribune_basse': return i => this.lv[i] === 1 && this.eng.spd[cellIdx(1, this.x[i], this.z[i])] < 1;
      case 'tribune_haute': return i => this.lv[i] === 2 && this.eng.spd[cellIdx(2, this.x[i], this.z[i])] < 1;
      case 'galerie': return i => this.lv[i] === 2 && this.eng.spd[cellIdx(2, this.x[i], this.z[i])] === 1;
      default: throw new Error('zone inconnue : ' + zone);
    }
  }
  announce(zone, target) {
    const t = typeof target === 'number' ? target : TARGETS.indexOf(target);
    if (t < 0) throw new Error('cible inconnue : ' + target);
    const id = this.nextId++, test = this._zoneTest(zone);
    const t0 = this.T + this.infoDelay; this.announces.push({ id, zone, target: t, test: i => this.T >= t0 && test(i), t0 });
    return id;
  }
  clearAnnounce(id) { this.announces = this.announces.filter(a => a.id !== id); }

  // ----- agents -----
  addSteward({ x, z, level = 0, team = '' }) {
    if (this.nSt >= 64) throw new Error('64 agents maximum');
    const i = this.NP + this.nSt++, id = this.nextId++;
    this.kind[i] = 1; this.x[i] = x; this.z[i] = z; this.lv[i] = level; this.st[i] = S_WALK; this.v0[i] = 1.34; this.tgt[i] = -1;
    this.stewards.push({ id, i, team, mode: 'hold', path: null, pi: 0, guide: null, then: null, goal: null });
    if (this.eng.solid[cellIdx(level, x, z)]) console.warn('agent ' + id + ' posé dans un mur (' + x + ',' + z + ')');
    return id;
  }
  _stewardsOf(sel) { return typeof sel === 'number' ? this.stewards.filter(s => s.id === sel) : this.stewards.filter(s => s.team === sel); }
  orderSteward(sel, order) {
    if (typeof order === 'string') order = { type: order };
    const list = this._stewardsOf(sel);
    for (const s of list) this.orders.push({ at: this.T + this.infoDelay + 5 + this.rand() * 10, s, order }); // délai radio 5 à 15 s (estimé)
    return list.length;
  }
  _element(el) {
    const e = typeof el === 'object' ? el : null;
    const lists = [this.gates, this.vomitoires, this.barrages, this.sinks.filter(k => k.kind === 'metro')];
    if (e) return e;
    const s = String(el).toLowerCase();
    for (const L of lists) { const f = L.find(k => (k.name || '').toLowerCase() === s || (k.key || '').toLowerCase() === s); if (f) return f; }
    for (const L of lists) { const f = L.find(k => (k.name || '').toLowerCase().includes(s)); if (f) return f; }
    throw new Error('élément inconnu : ' + el);
  }
  _applyElement(el, open) {
    if (this.gates.includes(el)) this.setGate(this.gates.indexOf(el), open);
    else if (this.vomitoires.includes(el)) this.setVomitoire(this.vomitoires.indexOf(el) + 1, open);
    else if (this.barrages.includes(el)) this.setBarrage(el.key, !open); // « fermer » un barrage = le poser
    else if (el.kind === 'metro') this.setMetroEntrance(el.idx, open);
  }
  _execOrder(s, o) {
    const type = o.type || o.op;
    const i = s.i;
    if (type === 'hold') { s.mode = 'hold'; s.path = null; s.guide = null; }
    else if (type === 'redirect') {
      const t = typeof o.target === 'number' ? o.target : TARGETS.indexOf(o.target); if (t < 0) throw new Error('cible inconnue : ' + o.target);
      s.mode = 'hold'; s.path = null; s.guide = { target: t, radius: o.radius ?? 15, tok: this.stewardTok++ };
    } else if (type === 'goto' || type === 'close' || type === 'open') {
      let gx = o.x, gz = o.z, gl = o.level ?? 0, then = null;
      if (type !== 'goto') {
        const el = this._element(o.element ?? o.el ?? o.target);
        gx = el.x ?? el.g?.[0]; gz = el.z ?? el.g?.[1]; gl = this.vomitoires.includes(el) ? 1 : 0;
        if (this.gates.includes(el)) { gx = el.facade[0] - el.dir[0] * 3; gz = el.facade[1] - el.dir[1] * 3; }
        then = { el, open: type === 'open' };
      }
      s.guide = null; s.then = then; s.goal = [gx, gz, gl];
      s.path = this._plan(cellIdx(this.lv[i], this.x[i], this.z[i]), cellIdx(gl, gx, gz)); s.pi = 0; s.mode = s.path ? 'walk' : 'hold';
      if (!s.path && then) { this._applyElement(then.el, then.open); s.then = null; } // chemin introuvable : l'ordre est appliqué sur place (consigné)
      if (!s.path) s.unreachable = (s.unreachable || 0) + 1;
    } else throw new Error("ordre inconnu : " + type);
  }
  _plan(from, to) { // Dijkstra inverse depuis le but jusqu'au départ (liens dans les deux sens), coûts de la grille
    const eng = this.eng, solid = eng.solid, cost = eng.cost;
    if (solid[to]) return null;
    const dist = new Map(), h = new Heap(1 << 16); dist.set(to, 0); h.push(0, to);
    while (h.n) {
      const c = h.pop(), v = h.topK; if (v > dist.get(c)) continue;
      if (c === from) break;
      const r = c % NCL, cx = r % GW, cz = (r / GW) | 0;
      for (let k = 0; k < 8; k++) {
        const nx = cx + DX[k], nz = cz + DZ[k]; if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
        const n = c + DZ[k] * GW + DX[k]; if (solid[n]) continue;
        if (k >= 4 && (solid[c + DX[k]] || solid[c + DZ[k] * GW])) continue;
        const nv = v + WT[k] * cost[n]; if (nv < (dist.get(n) ?? Infinity)) { dist.set(n, nv); h.push(nv, n); }
      }
      for (const n of [eng.linkUp[c], eng.linkDown[c]]) if (n >= 0 && !solid[n]) { const nv = v + LCOST; if (nv < (dist.get(n) ?? Infinity)) { dist.set(n, nv); h.push(nv, n); } }
    }
    if (!dist.has(from)) return null;
    const path = [from]; let c = from, guard = 0;
    while (c !== to && guard++ < 5000) {
      let best = c, bv = dist.get(c);
      const r = c % NCL, cx = r % GW, cz = (r / GW) | 0;
      for (let k = 0; k < 8; k++) {
        const nx = cx + DX[k], nz = cz + DZ[k]; if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
        const n = c + DZ[k] * GW + DX[k]; if (solid[n] || (k >= 4 && (solid[c + DX[k]] || solid[c + DZ[k] * GW]))) continue;
        const v = dist.get(n); if (v !== undefined && v < bv) { bv = v; best = n; }
      }
      for (const n of [eng.linkUp[c], eng.linkDown[c]]) if (n >= 0) { const v = dist.get(n); if (v !== undefined && v < bv) { bv = v; best = n; } }
      if (best === c) return null; c = best; path.push(c);
    }
    return path;
  }

  // ----- sorties / puits -----
  _absorb(i, sink) {
    this.st[i] = S_GONE; this.nOut++;
    this.byTarget[TARGETS[sink.target]]++;
    this.absorbLog.push({ t: this.T, sink: sink.name, open: sink.open });
    if (sink.kind === 'metro' && !sink.open) this.violations = (this.violations || 0) + 1;
  }
  _trains() {
    for (const s of this.sinks) {
      if (s.kind !== 'tram' || this.T < s.nextTrain) continue;
      const n = Math.min(TRAM_CAP, s.wait.length);
      for (let k = 0; k < n; k++) this._absorb(s.wait[k], s);
      s.wait = s.wait.slice(n); s.lastTrain = this.T; s.nextTrain = this.T + this.tramHeadway; s.lastBoarded = n;
    }
    for (const s of this.sinks) {
      if (s.kind !== 'metro' || !s.open) continue;
      s.credit = Math.min(s.credit + METRO_RATE * DT, 4);
      while (s.credit >= 1 && s.queue.length) { s.credit -= 1; this._absorb(s.queue.shift(), s); }
    }
  }

  // ----- choix de cible -----
  _avail(t) {
    if (t === T_METRO) return this.sinks.some(s => s.kind === 'metro' && s.open);
    if (t === T_TRAM_W || t === T_TRAM_E) return this.sinks.some(s => s.kind === 'tram' && s.target === t && s.open);
    return true;
  }
  _choose(i, herd) {
    const eng = this.eng, c = cellIdx(this.lv[i], this.x[i], this.z[i]);
    const fs = [];
    let fmin = Infinity;
    for (let t = 0; t < 6; t++) { const v = this._avail(t) ? eng.f[t][c] : Infinity; fs.push(v); if (v < fmin) fmin = v; }
    if (fmin === Infinity) return -1;
    const g = new Float64Array(6);
    // guidage : agents en « redirect » dans leur rayon, annonces de la zone, zone de danger sur la cible
    if (this.kind[i] === 0) {
      for (const s of this.stewards) {
        if (!s.guide || this.lv[s.i] !== this.lv[i]) continue;
        if (Math.hypot(this.x[i] - this.x[s.i], this.z[i] - this.z[s.i]) <= s.guide.radius && this.obeyS[i]) g[s.guide.target] += B_GUIDE;
      }
      for (const a of this.announces) if (this.obeyA[i] && a.test(i)) g[a.target] += B_GUIDE;
    }
    const u = new Float64Array(6); let sum = 0;
    for (let t = 0; t < 6; t++) {
      if (fs[t] === Infinity) continue;
      let V = -B_DIST * DIST_SCALE * (fs[t] - fmin) + (this.fam[i] === t ? B_FAM : 0) + g[t] + this.bh[i] * (herd ? herd[t] : 0);
      if (this.zones.length) for (const s of this.sinks) if (s.target === t && s.kind !== 'pied' && s.cells.length && this.zoneCount[s.cells[0]]) V -= B_ZONE;
      u[t] = Math.exp(Math.max(-30, Math.min(30, V))); sum += u[t];
    }
    let x = this.rand() * sum;
    for (let t = 0; t < 6; t++) { if (u[t] === 0) continue; x -= u[t]; if (x <= 0) return t; }
    return fs.findIndex(v => v < Infinity);
  }

  // ----- pas de temps -----
  step() {
    const dt = DT, eng = this.eng, solid = eng.solid, wd = eng.wd, spd = eng.spd;
    this.T += dt; this.stepCount++; const T = this.T;
    const { x, z, vx, vz, ex, ez, v0, lv, st, tgt } = this;
    const N = this.N;
    // ordres radio arrivés
    if (this.orders.length) { const keep = []; for (const o of this.orders) { if (o.at <= T) this._execOrder(o.s, o.order); else keep.push(o); } this.orders = keep; }
    // départs
    for (let i = 0; i < this.NP; i++) if (st[i] === S_SEATED && T >= this.pre[i]) { st[i] = S_WALK; this.tgt[i] = this._avail(this.fam[i]) ? this.fam[i] : -1; this.next[i] = T + 10; }
    if (this.timers.length) { const keep = []; for (const t of this.timers) { if (t.at <= T) t.fn(); else keep.push(t); } this.timers = keep; }
    // trains et débit métro
    this._trains();
    // liste active + hachage
    const cnt = this.hStart; cnt.fill(0);
    let na = 0; const hOrder = this.hOrder, act = this.act || (this.act = new Int32Array(this.cap)), hid = this.hid || (this.hid = new Int32Array(this.cap));
    for (let i = 0; i < N; i++) {
      const s = st[i]; if (s === S_SEATED || s === S_GONE || s === S_STAIRS) continue;
      act[na++] = i;
      const h = lv[i] * HN + (((z[i] - Z0) / HC | 0) + 1) * HW + ((x[i] - X0) / HC | 0) + 1;
      hid[i] = h; cnt[h + 1]++;
    }
    for (let h = 0; h < HN * NL; h++) cnt[h + 1] += cnt[h];
    const fill = this.hFill || (this.hFill = new Int32Array(HN * NL)); fill.fill(0);
    for (let a = 0; a < na; a++) { const i = act[a], h = hid[i]; hOrder[cnt[h] + fill[h]++] = i; }
    // fin d'escalier
    for (let i = 0; i < N; i++) if (st[i] === S_STAIRS && T >= this.rideT1[i]) {
      const c = this.rideDown[i]; x[i] = cellX(c) + (this.rand() - 0.5) * 0.5; z[i] = cellZ(c) + (this.rand() - 0.5) * 0.5; lv[i] = cellL(c);
      vx[i] = vz[i] = 0; st[i] = S_WALK; this.rideLink[i] = -1; this.next[i] = 0;
    }
    let dens4 = 0, dmaxStep = 0, dAt = -1;
    for (let a = 0; a < na; a++) {
      const i = act[a];
      if (this.kind[i] === 1) { this._stewardMove(i, dt); continue; }
      let s = st[i];
      const cx0 = Math.floor(x[i] - X0), cz0 = Math.floor(z[i] - Z0);
      const c = lv[i] * NCL + cz0 * GW + cx0;
      if (s === S_HES) { this.hes[i] -= dt; vx[i] *= 0.7; vz[i] *= 0.7; if (this.hes[i] <= 0) { st[i] = s = S_WALK; this.next[i] = 0; } }
      if (s === S_WALK) {
        // choix de cible
        let need = tgt[i] < 0 || !this._avail(tgt[i]) || eng.f[tgt[i]][c] === Infinity;
        if (need && tgt[i] >= 0 && this.hes[i] <= 0 && s !== S_HES) { this.hes[i] = 2 + this.rand() * 3; st[i] = S_HES; tgt[i] = -2; continue; }
        if (tgt[i] === -2) { tgt[i] = -1; need = true; }
        let persuaded = false;
        if (!need && this.stewards.length && (this.stepCount + i) % 5 === 0) {
          for (const sw of this.stewards) {
            if (!sw.guide || lv[sw.i] !== lv[i] || this.tokSeen[i] === sw.guide.tok) continue;
            if (Math.hypot(x[i] - x[sw.i], z[i] - z[sw.i]) <= sw.guide.radius) { this.tokSeen[i] = sw.guide.tok; persuaded = true; break; }
          }
        }
        if (!need && !persuaded && this.announces.length && (this.stepCount + i) % 5 === 0) {
          for (const a of this.announces) if (this.annSeen[i] !== a.id && this.obeyA[i] && a.test(i)) { this.annSeen[i] = a.id; persuaded = true; break; }
        }
        if (need || persuaded || T >= this.next[i]) {
          const herd = this._herd(i);
          const old = tgt[i];
          const k = need || persuaded || this.rand() < 0.1 ? this._choose(i, herd) : old;
          tgt[i] = k; this.next[i] = T + 10;
          if (k < 0) { st[i] = S_HES; this.hes[i] = 3; continue; }
        }
        const sk = this.world.sinkAt[c];
        if (sk >= 0) {
          const sink = this.sinks[sk];
          if (sink.target === tgt[i]) {
            if (sink.kind === 'pied') { this._absorb(i, sink); continue; }
            if (sink.kind === 'metro' && sink.open) { st[i] = S_QUEUE; this.onSink[i] = sk; sink.queue.push(i); this._spot(i, sink); continue; }
            if (sink.kind === 'tram') { st[i] = S_QUEUE; this.onSink[i] = sk; sink.wait.push(i); this._spot(i, sink); continue; }
          }
        }
        const dl = eng.linkDown[c];
        if (dl >= 0 && eng.f[tgt[i]][dl] + LCOST <= eng.f[tgt[i]][c] + 0.5) {
          const L = this.world.linkOf[c];
          if (L >= 0) {
            if (T >= this.linkNext[L]) { this.linkNext[L] = T + this.links[L].gap; st[i] = S_STAIRS; this.rideT1[i] = T + this.links[L].dur; this.rideDown[i] = dl; this.rideLink[i] = L; this.waitLink[i] = -1; continue; }
            this.waitLink[i] = L; vx[i] *= 0.5; vz[i] *= 0.5; continue;
          }
        }
        this.waitLink[i] = -1;
      }
      // direction souhaitée
      let dxn = 0, dzn = 0, vmax = v0[i];
      if (st[i] === S_WALK && tgt[i] >= 0) {
        const f = eng.f[tgt[i]], fc = f[c];
        let sx = 0, sz = 0;
        for (let k = 0; k < 8; k++) {
          const nx = cx0 + DX[k], nz = cz0 + DZ[k]; if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
          const n = c + DZ[k] * GW + DX[k]; const fn = f[n]; if (fn === Infinity || solid[n]) continue;
          if (k >= 4 && (solid[c + DX[k]] || solid[c + DZ[k] * GW])) continue;
          const gr = (fc - fn) / WT[k]; if (gr > 0) { sx += gr * DX[k] / WT[k]; sz += gr * DZ[k] / WT[k]; }
        }
        const m = Math.hypot(sx, sz);
        if (m > 0) { dxn = sx / m; dzn = sz / m; }
        dxn = 0.65 * dxn + 0.35 * ex[i]; dzn = 0.65 * dzn + 0.35 * ez[i]; const mm = Math.hypot(dxn, dzn) || 1; dxn /= mm; dzn /= mm; ex[i] = dxn; ez[i] = dzn;
        vmax = v0[i] * spd[c]; if (m === 0) vmax = 0;
      } else if (st[i] === S_QUEUE) { // file d'attente : on gagne sa place dans la zone du quai / de la bouche, puis on attend
        const sdx = this.spotX[i] - x[i], sdz = this.spotZ[i] - z[i], sd = Math.sqrt(sdx * sdx + sdz * sdz);
        if (sd > 0.5) { dxn = sdx / sd; dzn = sdz / sd; vmax = 0.6; } else vmax = 0;
      } else vmax = 0;
      let ax = (vmax * dxn - vx[i]) / TAU, az = (vmax * dzn - vz[i]) / TAU, crowd = 0;
      // voisins
      const h = hid[i], xi = x[i], zi = z[i];
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const hh = h + dz * HW + dx, e = cnt[hh + 1];
        for (let q = cnt[hh]; q < e; q++) {
          const j = hOrder[q]; if (j === i) continue;
          const ddx = xi - x[j], ddz = zi - z[j], d2 = ddx * ddx + ddz * ddz; if (d2 > 1.0) continue; // coupure à 1 m (force < 0,04 m/s² au-delà) ; estimé
          const d = Math.sqrt(d2) || 1e-3, rj = this.kind[j] ? (this.stewards.length && this._stPosted(j) ? 0.5 : 0.3) : R;
          if (d < 1.0 && this.kind[j] === 0) crowd++;
          const nx = ddx / d, nz = ddz / d, cs = -(nx * dxn + nz * dzn), wgt = 0.3 + 0.7 * (1 + cs) / 2, f = 25 * Math.exp((R + rj - d) / 0.08) * wgt;
          ax += f * nx; az += f * nz;
        }
      }
      if (this.buddy[i] >= 0) { const b = this.buddy[i]; if (st[b] !== S_GONE && st[b] !== S_SEATED && lv[b] === lv[i]) { const bx = x[b] - xi, bz = z[b] - zi, bd = Math.hypot(bx, bz); if (bd > 1.6 && bd < 10) { ax += 0.8 * bx / bd; az += 0.8 * bz / bd; } } }
      const dens = (crowd + 1) / Math.PI; this.dAvg[i] = this.dAvg[i] * 0.8 + dens * 0.2;
      const da = this.dAvg[i]; if (da > 4) dens4++; if (da > dmaxStep) { dmaxStep = da; dAt = i; }
      const wdc = wd[c];
      if (wdc < 1) {
        const gx = (cx0 + 1 < GW ? wd[c + 1] : wdc) - (cx0 > 0 ? wd[c - 1] : wdc), gz = (cz0 + 1 < GH ? wd[c + GW] : wdc) - (cz0 > 0 ? wd[c - GW] : wdc), gm = Math.hypot(gx, gz) || 1;
        const f = 30 * Math.exp((R - wdc) / 0.12); ax += f * gx / gm; az += f * gz / gm;
      }
      ax += (this.rand() - 0.5); az += (this.rand() - 0.5); // bruit de ±0,5 m/s² : casse les voûtes de blocage (estimé)
      vx[i] += ax * dt; vz[i] += az * dt;
      const sp = Math.sqrt(vx[i] * vx[i] + vz[i] * vz[i]), vm = 1.25 * v0[i]; if (sp > vm) { vx[i] *= vm / sp; vz[i] *= vm / sp; }
      const l = lv[i];
      if (this._blk(l, xi, zi)) { // déjà en recouvrement d'un mur (siège en bord de tribune, arrivée d'escalier) : on recentre doucement dans la maille
        const ccx = X0 + cx0 + 0.5, ccz = Z0 + cz0 + 0.5, ddx = ccx - xi, ddz = ccz - zi, dd = Math.sqrt(ddx * ddx + ddz * ddz) || 1, stp = Math.min(0.1, dd);
        x[i] = xi + ddx / dd * stp; z[i] = zi + ddz / dd * stp; vx[i] *= 0.5; vz[i] *= 0.5; continue;
      }
      const nxp = xi + vx[i] * dt, nzp = zi + vz[i] * dt;
      if (!this._blk(l, nxp, zi)) x[i] = nxp; else vx[i] *= -0.1;
      if (!this._blk(l, x[i], nzp)) z[i] = nzp; else vz[i] *= -0.1;
    }
    // correction des chevauchements
    for (let a = 0; a < na; a++) {
      const i = act[a]; if (this.kind[i] === 1 && this._stPosted(i)) continue;
      const h = hid[i];
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const hh = h + dz * HW + dx, e = cnt[hh + 1];
        for (let q = cnt[hh]; q < e; q++) {
          const j = hOrder[q]; if (j <= i && !(this.kind[j] === 1 && this._stPosted(j))) continue;
          const jp = this.kind[j] === 1 && this._stPosted(j);
          const ddx = x[i] - x[j], ddz = z[i] - z[j], rs = jp ? (R + 0.5) * 0.92 : 2 * R * 0.92, d2 = ddx * ddx + ddz * ddz;
          if (d2 >= rs * rs || d2 < 1e-8) continue;
          const d = Math.sqrt(d2);
          const p = jp ? (rs - d) : (rs - d) / 2, px = ddx / d * p, pz = ddz / d * p, l = lv[i];
          if (!this._blk(l, x[i] + px, z[i] + pz)) { x[i] += px; z[i] += pz; }
          if (!jp && !this._blk(lv[j], x[j] - px, z[j] - pz)) { x[j] -= px; z[j] -= pz; }
        }
      }
    }
    // statistiques de densité (par pas)
    this.exposure += dens4 * dt;
    if (dmaxStep > this.dmax) { this.dmax = dmaxStep; this.dmaxAt = { x: +x[dAt].toFixed(1), z: +z[dAt].toFixed(1), level: lv[dAt], t: +T.toFixed(1) }; }
    if (this.zones.length) { let n = 0; for (let a = 0; a < na; a++) { const i = act[a]; if (this.kind[i] === 0 && this.zoneCount[cellIdx(lv[i], x[i], z[i])]) n++; } this.zoneExposure += n * dt; }
    if (this.stepCount % 10 === 0) { this.refreshStats(); this._alerts(); }
  }
  _spot(i, sink) { // place d'attente tirée au hasard dans la zone du puits (estimé)
    const c = sink.cells[(this.rand() * sink.cells.length) | 0];
    this.spotX[i] = cellX(c) + (this.rand() - 0.5) * 0.8; this.spotZ[i] = cellZ(c) + (this.rand() - 0.5) * 0.8;
  }
  _stPosted(j) { const s = this.stewards[j - this.NP]; return s && (s.mode === 'hold'); }
  _blk(l, px, pz) {
    const solid = this.eng.solid, b = l * NCL;
    const x0 = Math.floor(px - R - X0), x1 = Math.floor(px + R - X0), z0 = Math.floor(pz - R - Z0), z1 = Math.floor(pz + R - Z0);
    if (x0 < 0 || z0 < 0 || x1 >= GW || z1 >= GH) return true;
    return solid[b + z0 * GW + x0] === 1 || solid[b + z0 * GW + x1] === 1 || solid[b + z1 * GW + x0] === 1 || solid[b + z1 * GW + x1] === 1;
  }
  _herd(i) {
    const herd = this._herdBuf || (this._herdBuf = new Float64Array(6)); herd.fill(0);
    const cnt = this.hStart, h = this.hid[i]; let n = 0;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const hh = h + dz * HW + dx; if (hh < 0 || hh >= HN * NL) continue; const e = cnt[hh + 1];
      for (let q = cnt[hh]; q < e; q++) { const j = this.hOrder[q]; if (j === i || this.kind[j] || this.tgt[j] < 0 || this.st[j] === S_SEATED) continue; herd[this.tgt[j]]++; n++; }
    }
    if (n) for (let t = 0; t < 6; t++) herd[t] /= n;
    return herd;
  }
  _stewardMove(i, dt) {
    const s = this.stewards[i - this.NP];
    if (s.mode === 'hold') { this.vx[i] = this.vz[i] = 0; return; }
    if (s.mode === 'ride') { if (this.T >= this.rideT1[i]) { const c = this.rideDown[i]; this.x[i] = cellX(c); this.z[i] = cellZ(c); this.lv[i] = cellL(c); s.mode = 'walk'; } return; }
    if (s.mode === 'walk' && s.path) {
      while (s.pi < s.path.length - 1) {
        const c = s.path[s.pi + 1];
        if (cellL(c) !== this.lv[i]) { this.rideT1[i] = this.T + STAIR_DUR; this.rideDown[i] = c; s.pi++; s.mode = 'ride'; return; }
        if (Math.hypot(cellX(c) - this.x[i], cellZ(c) - this.z[i]) < 0.9) s.pi++; else break;
      }
      if (s.pi >= s.path.length - 1) {
        s.mode = 'hold'; s.path = null;
        if (s.then) { this._applyElement(s.then.el, s.then.open); s.then = null; }
        return;
      }
      const c = s.path[s.pi + 1], dx = cellX(c) - this.x[i], dz = cellZ(c) - this.z[i], d = Math.hypot(dx, dz) || 1;
      let vxn = 1.3 * dx / d, vzn = 1.3 * dz / d;
      const nxp = this.x[i] + vxn * dt, nzp = this.z[i] + vzn * dt;
      if (!this._blk(this.lv[i], nxp, this.z[i])) this.x[i] = nxp;
      if (!this._blk(this.lv[i], this.x[i], nzp)) this.z[i] = nzp;
    }
  }

  // ----- statistiques / alertes -----
  refreshStats() {
    const N = this.N, st = this.st, w = this.world;
    let inside = 0, outsideCount = 0, active = 0;
    const qLink = {}, qGate = {};
    for (const l of this.links) qLink[l.name] = 0;
    const els = [...this.gates.map(g => ({ e: g, x: g.facade[0] - g.dir[0] * 3, z: g.facade[1] - g.dir[1] * 3, l: 0 })), ...this.vomitoires.map(v => ({ e: v, x: v.g[0], z: v.g[1], l: 1 })), ...this.sinks.filter(k => k.kind === 'metro').map(k => ({ e: k, x: k.x, z: k.z, l: 0 }))];
    for (const q of els) qGate[q.e.name] = 0;
    for (let i = 0; i < this.NP; i++) {
      const s = st[i]; if (s === S_GONE) continue;
      const l = this.lv[i];
      if (l > 0 || w.inArena[cellIdx(0, this.x[i], this.z[i])]) inside++; else outsideCount++;
      if (s === S_SEATED || s === S_STAIRS) continue;
      active++;
      if (s !== S_WALK && s !== S_HES && s !== S_QUEUE) continue;
      if (this.vx[i] * this.vx[i] + this.vz[i] * this.vz[i] > 0.25) continue; // « en file » = moins de 0,5 m/s
      for (const k of this.links) if (k.lUp === l && Math.abs(this.x[i] - k.x) < 8 && Math.abs(this.z[i] - k.z) < 8) qLink[k.name]++;
      for (const q of els) if (q.l === l && Math.abs(this.x[i] - q.x) < 6 && Math.abs(this.z[i] - q.z) < 6) qGate[q.e.name]++;
    }
    // personnes sur escalier comptées dans le niveau de départ : on les range à l'intérieur
    for (let i = 0; i < this.NP; i++) if (st[i] === S_STAIRS) { /* déjà compté plus haut via lv (niveau d'origine) */ }
    this.insideCount = inside; this.outsideCount = outsideCount; this.activeCount = active;
    if (this.t95 === null && this.total - inside >= 0.95 * this.total) this.t95 = this.T;
    this.stats = { inside, outside: this.total - inside, byTarget: { ...this.byTarget }, queueByLink: qLink, queueByGate: qGate };
  }
  _raise(key, type, where, value) {
    if (this.alertActive.has(key)) { this.alertActive.set(key, this.T); return; }
    this.alertActive.set(key, this.T);
    const a = { t: +this.T.toFixed(1), type, where, value: +(+value).toFixed(2) }; this.alertLog.push(a); this.pendingAlerts.push(a);
  }
  _alerts() {
    const T = this.T;
    for (const [k, t] of this.alertActive) if (T - t > 10) this.alertActive.delete(k); // l'alerte retombe si la condition n'a pas été revue depuis 10 s
    if (this.dmaxAt && this.curDens > 4) { /* géré ci-dessous */ }
    // densité : on regarde les pics actuels (moyenne glissante par personne)
    let best4 = 0, bi = -1;
    for (let i = 0; i < this.NP; i++) { const s = this.st[i]; if (s === S_SEATED || s === S_GONE || s === S_STAIRS) continue; if (this.dAvg[i] > best4) { best4 = this.dAvg[i]; bi = i; } }
    this.curDens = best4;
    if (bi >= 0 && best4 > 4) {
      const where = 'niveau ' + this.lv[bi] + ' (' + Math.round(this.x[bi] / 10) * 10 + ', ' + Math.round(this.z[bi] / 10) * 10 + ')';
      this._raise('d4:' + where, 'densite>4', where, best4);
      if (best4 > 5) this._raise('d5:' + where, 'densite>5', where, best4);
    }
    for (const l of this.links) { const q = this.stats.queueByLink[l.name]; if (q >= 40) this._raise('lien:' + l.name, 'lien_sature', l.name, q); } // 40 personnes en attente (estimé)
    const closed = [...this.gates, ...this.vomitoires, ...this.sinks.filter(k => k.kind === 'metro')].filter(e => !e.open);
    for (const e of closed) { const q = this.stats.queueByGate[e.name]; if (q >= 15) this._raise('porte:' + e.name, 'porte_fermee_file', e.name, q); } // 15 personnes devant (estimé)
  }

  snapshot() {
    const people = [];
    for (let i = 0; i < this.NP; i++) {
      const s = this.st[i]; if (s === S_GONE) continue;
      const l = this.lv[i];
      people.push({ x: +this.x[i].toFixed(2), z: +this.z[i].toFixed(2), level: l, y: s === S_SEATED || (l > 0 && this.eng.spd[cellIdx(l, this.x[i], this.z[i])] < 1) ? +this.sy[i].toFixed(1) : ALT[l], state: STATE_NAME[s] });
    }
    const stewards = this.stewards.map(s => ({ id: s.id, team: s.team, x: +this.x[s.i].toFixed(2), z: +this.z[s.i].toFixed(2), level: this.lv[s.i], mode: s.mode, guide: s.guide ? { target: TARGETS[s.guide.target], radius: s.guide.radius } : null }));
    const alerts = this.pendingAlerts; this.pendingAlerts = [];
    const c = this.stats;
    return { T: +this.T.toFixed(1), people, stewards, counters: { inside: c.inside, outside: c.outside, byTarget: c.byTarget, queueByLink: c.queueByLink, queueByGate: c.queueByGate, maxDensity: +(this.curDens || 0).toFixed(2), densityHotspot: this.dmaxAt, exposure: +this.exposure.toFixed(0) }, alerts };
  }
  // vue légère pour le rendu : tableaux typés partagés (ne pas modifier)
  view() { return { T: this.T, n: this.NP, x: this.x, z: this.z, level: this.lv, state: this.st, y: this.sy }; }
}
