// Écrit navgrid.json (fichier généré, jamais commité) depuis la même construction que le moteur de foule : `node build_navgrid.mjs`
// Contrat commun avec la session Châtelet :
// {bbox:[x0,z0,x1,z1] en m, res, w, h, levels:[0,1,2],
//  walk:[base64 packbits w*h par niveau, ligne = z], reach:[idem, cases reliées à une sortie],
//  links:[{k:'escalator'|'escalier', n, a:[iNiveau,ligne,col], b:[...], len, debit}],
//  exits:[{id, n, type:'rue'|'train', cell:[iNiveau,ligne,col]}]}
// « packbits » : bits empaquetés (numpy.packbits, ordre par défaut = bit de poids fort d'abord, ligne par ligne), puis base64.
// Ici res = 0,5 m (et non 1 m) : le vrai plan a des couloirs de 1 m que la maille de 1 m bouche. Les liens ne contiennent que les escaliers
// (vomitoires, escaliers de balcon) et les escalators ; les ascenseurs PMR ne sont pas des liens (ils ne servent qu'au profil PMR).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildWorld, X0, Z0, GW, GH, NCL, RES } from './sim/arena-sim.js';

const DX = [1, -1, 0, 0, 1, 1, -1, -1], DZ = [0, 0, 1, -1, 1, -1, 1, -1];

export function packbits(bits) { // Uint8Array de 0/1 -> base64 (bit de poids fort d'abord)
  const out = Buffer.alloc(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i++) if (bits[i]) out[i >> 3] |= 0x80 >> (i & 7);
  return out.toString('base64');
}
export function unpackbits(b64, n) {
  const buf = Buffer.from(b64, 'base64'), out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = (buf[i >> 3] >> (7 - (i & 7))) & 1;
  return out;
}

export function makeNavgrid(world) {
  const solid = world.solid, rc = c => { const r = c % NCL; return [(c / NCL) | 0, (r / GW) | 0, r % GW]; };
  // sorties : une par segment continu de bord (à pied, 'rue'), une par bouche de métro et par quai de tram ('train')
  const exits = [];
  for (const s of world.sinks) {
    if (s.kind === 'pied') {
      const cs = s.cells.slice().sort((a, b) => a - b);
      let seg = [];
      const flush = () => { if (seg.length) { const c = seg[(seg.length / 2) | 0]; exits.push({ id: s.name + '-' + exits.length, n: s.name, type: 'rue', cell: rc(c) }); seg = []; } };
      for (const c of cs) { if (seg.length && (c - seg[seg.length - 1] > 1 && Math.abs(c - seg[seg.length - 1]) !== GW)) flush(); seg.push(c); }
      flush();
    } else {
      const free = s.cells.filter(c => !solid[c]), cx = free.reduce((a, c) => a + (c % GW), 0) / free.length, cz = free.reduce((a, c) => a + ((c / GW) | 0), 0) / free.length;
      let best = free[0], bd = Infinity; for (const c of free) { const d = Math.hypot((c % GW) - cx, ((c / GW) | 0) - cz); if (d < bd) { bd = d; best = c; } }
      exits.push({ id: s.id || s.name, n: s.name, type: 'train', cell: rc(best) });
    }
  }
  // liens : escaliers (vomitoires, balcons) et escalators
  const links = world.links.map(l => ({ k: l.kind === 'escalator' ? 'escalator' : 'escalier', n: l.name, a: rc(l.ups[(l.ups.length / 2) | 0]), b: rc(l.downs[(l.downs.length / 2) | 0]), len: +l.len.toFixed(1), debit: +(1.3 * l.width).toFixed(2) }));
  // accessibilité : cases reliées à une sortie (déplacements à 8 voisins sans coupe de coin, liens dans les deux sens)
  const N = 3 * NCL, reach = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
  const lk = new Map(); for (const l of world.links) l.ups.forEach((u, i) => { lk.set(u, l.downs[i]); lk.set(l.downs[i], u); });
  for (const e of exits) { const c = e.cell[0] * NCL + e.cell[1] * GW + e.cell[2]; if (!solid[c] && !reach[c]) { reach[c] = 1; q[qt++] = c; } }
  while (qh < qt) {
    const c = q[qh++], r = c % NCL, cx = r % GW, cz = (r / GW) | 0, base = c - r;
    for (let k = 0; k < 8; k++) {
      const nx = cx + DX[k], nz = cz + DZ[k]; if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
      const n = base + nz * GW + nx; if (solid[n] || reach[n]) continue;
      if (k >= 4 && (solid[c + DX[k]] || solid[c + DZ[k] * GW])) continue;
      reach[n] = 1; q[qt++] = n;
    }
    const o = lk.get(c); if (o !== undefined && !solid[o] && !reach[o]) { reach[o] = 1; q[qt++] = o; }
  }
  const walk = [], rch = [];
  for (let l = 0; l < 3; l++) {
    const w = new Uint8Array(NCL), r = new Uint8Array(NCL);
    for (let c = 0; c < NCL; c++) { w[c] = solid[l * NCL + c] ? 0 : 1; r[c] = reach[l * NCL + c]; }
    walk.push(packbits(w)); rch.push(packbits(r));
  }
  return { bbox: [X0, Z0, X0 + GW * RES, Z0 + GH * RES], res: RES, w: GW, h: GH, levels: [0, 1, 2], walk, reach: rch, links, exits };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const scene = JSON.parse(fs.readFileSync(path.join(here, 'scene.json'), 'utf8'));
  const ng = makeNavgrid(buildWorld(scene));
  fs.writeFileSync(path.join(here, 'navgrid.json'), JSON.stringify(ng));
  console.log(`navgrid.json : ${ng.w}x${ng.h} à ${ng.res} m, ${ng.exits.length} sorties, ${ng.links.length} liens`);
}
