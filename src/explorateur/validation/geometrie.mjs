// Outils du banc de validation : géométries synthétiques au format navgrid.json, chargement de sim.js
// dans un bac à sable (même méthode que ../moteur.mjs), agents posés à la main, sonde de collisions.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { hasard } from '../hasard.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
export const SIM_JS = join(ICI, '..', '..', '..', 'reports', 'maquettes', 'chatelet-3d', 'sim.js');
export { hasard };
export const R = 0.24; // rayon de contact codé dans sim.js

const AIDES = `
function pairs(p){const a=[];for(let i=0;i<p.length;i+=2)a.push([p[i],p[i+1]]);return a;}
function pip(){return false;}
`;
let source = null;
const lireSource = () => (source ??= readFileSync(SIM_JS, 'utf8'));

// Encode un tableau de 0/1 comme sim.js le décode (b64bits : bit de poids fort d'abord).
function empaqueter(bits) {
  const o = new Uint8Array(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i++) if (bits[i]) o[i >> 3] |= 1 << (7 - (i & 7));
  return Buffer.from(o).toString('base64');
}

// marcheur(l, r, c) -> booléen ; liens : [{k, a:[l,r,c], b:[l,r,c], len}] ; sorties : [{n, type, cell:[l,r,c]}]
// Les coordonnées (cellules et mètres) sont celles de l'utilisateur, origine (0,0) : on ajoute 2 cellules de mur tout autour
// et on décale bbox en conséquence, car sim.js tronque vers zéro (x de -1 à 0 serait lu comme la case 0 : faux « praticable »).
const PAD = 2;
export function navgrid({ w, h, res = 1, levels = [0], marcheur, liens = [], sorties = [] }) {
  const W = w + 2 * PAD, H = h + 2 * PAD;
  const walk = levels.map((_, l) => {
    const bits = new Uint8Array(W * H);
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) bits[(r + PAD) * W + c + PAD] = marcheur(l, r, c) ? 1 : 0;
    return empaqueter(bits);
  });
  const dec = ([l, r, c]) => [l, r + PAD, c + PAD];
  return {
    bbox: [-PAD * res, -PAD * res, (w + PAD) * res, (h + PAD) * res], res, w: W, h: H, levels, walk, reach: walk,
    links: liens.map((k) => ({ n: '', ...k, a: dec(k.a), b: dec(k.b) })),
    exits: sorties.map((e, id) => ({ id, ...e, cell: dec(e.cell) })),
  };
}

// Un monde neuf avec une géométrie donnée. patches : [[ancien, nouveau], ...] appliqués au texte de sim.js (en mémoire seulement).
// anneau : [x0, x1] rend l'axe x périodique (couloir en boucle) : voisinage, distances et clés de la grille de hachage sont
// pris modulo x1 − x0. Seule la géométrie des voisins change ; les forces, vitesses et contacts de sim.js sont ceux de l'original.
export async function monde(grille, graine = 1, patches = [], anneau = null) {
  let code = lireSource();
  if (anneau) {
    patches = [...patches,
      ['const g=SIM.g,H=new Map(),key=(l,x,z)=>l*1e6+((x+400)|0)*1000+((z+400)|0);', 'const g=SIM.g,H=new Map(),key=(l,x,z)=>l*1e6+((__w(x)+400)|0)*1000+((z+400)|0);'],
      ['const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz)||1e-3', 'const dx=__d(a.x-b.x),dz=a.z-b.z,d=Math.hypot(dx,dz)||1e-3']];
  }
  for (const [de, vers] of patches) {
    if (!code.includes(de)) throw new Error(`patch introuvable dans sim.js : ${de}`);
    code = code.split(de).join(vers);
  }
  const rng = hasard(graine);
  const ctx = vm.createContext({
    SCN: { interieur: [] }, atob: (s) => Buffer.from(s, 'base64').toString('latin1'),
    fetch: async () => ({ json: async () => grille }), setTimeout, console, __rng: rng,
    __w: (x) => (anneau ? (x >= anneau[1] ? x - (anneau[1] - anneau[0]) : x < anneau[0] ? x + (anneau[1] - anneau[0]) : x) : x),
    __d: (dx) => (anneau ? ((P) => (dx > P / 2 ? dx - P : dx < -P / 2 ? dx + P : dx))(anneau[1] - anneau[0]) : dx),
  });
  vm.runInContext(`Math.random=__rng;${AIDES}${code}\n;globalThis.__SIM=SIM;`, ctx, { filename: 'sim.js' });
  await vm.runInContext('simLoad()', ctx);
  const SIM = ctx.__SIM;
  const fn = (nom) => vm.runInContext(nom, ctx);
  SIM.A = []; SIM.mode = 'evac'; fn('simResetCounters')();
  const gauss = () => Math.sqrt(-2 * Math.log(rng() + 1e-9)) * Math.cos(6.2832 * rng());
  const m = {
    SIM, ctx, rng, gauss, freeAt: fn('freeAt'), simStep: fn('simStep'),
    groupe: (nom) => SIM.groups.findIndex((G) => G.n === nom),
    // même tirage de vitesse libre que simSpawn : max(0,7 ; 1,34 + 0,26 N(0,1))
    ajouter({ l = 0, x, z, t, v0, vx = 0, vz = 0, dir = 0 }) {
      const a = { l, x, z, vx, vz, kind: 'client', v0: v0 ?? Math.max(0.7, 1.34 + 0.26 * gauss()), pre: 0, bh: 0, fam: 0,
        t, next: 1e9, hes: 0, ride: null, out: false, dens: 0, stopT: 0, dir };
      SIM.A.push(a); return a;
    },
  };
  return m;
}

// ---- Sonde : collisions, murs, densité maximale (expérience 4), cumulée sur tous les runs ----
export function creerSonde() {
  return { pas: 0, agentPas: 0, agentsChevauchants: 0, paires: 0, penMax: 0, dansMur: 0, corpsDansMur: 0, rhoCaseMax: 0, rhoLisseMax: 0, runs: 0, parRun: [] };
}
export function observer(s, m, lisser) {
  const S = m.SIM, g = S.g, N = S.N;
  const act = S.A.filter((a) => !a.out && !a.ride);
  s.pas++; s.agentPas += act.length;
  const H = new Map(), cle = (l, ix, iz) => l * 1e7 + (ix + 5000) * 10000 + (iz + 5000);
  for (const a of act) { const k = cle(a.l, Math.floor(a.x), Math.floor(a.z)); (H.get(k) ?? H.set(k, []).get(k)).push(a); }
  const seuil = 2 * R - 0.02, touche = new Set();
  for (const a of act) {
    const c = ((a.x - g.bbox[0]) / g.res) | 0, r = ((a.z - g.bbox[1]) / g.res) | 0;
    if (c < 0 || r < 0 || c >= g.w || r >= g.h || !S.walk[a.l * N + r * g.w + c]) s.dansMur++;
    else if (!m.freeAt(a.l, a.x, a.z)) s.corpsDansMur++;
    const ix = Math.floor(a.x), iz = Math.floor(a.z);
    let proches = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const b of H.get(cle(a.l, ix + dx, iz + dz)) ?? []) {
      if (b === a) continue;
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d < seuil) { if (a.x < b.x || (a.x === b.x && a.z < b.z)) { s.paires++; } touche.add(a); s.penMax = Math.max(s.penMax, 2 * R - d); }
      if (d < 1) proches++;
    }
    if (lisser) s.rhoLisseMax = Math.max(s.rhoLisseMax, (proches + 1) / Math.PI);
  }
  s.agentsChevauchants += touche.size;
  for (const v of H.values()) s.rhoCaseMax = Math.max(s.rhoCaseMax, v.length);
}
