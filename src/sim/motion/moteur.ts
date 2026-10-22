// Moteur de foule : port TypeScript de reports/maquettes/chatelet-3d/sim.js (même physique, mêmes constantes, même ordre
// des tirages au hasard). Cartes de pentes par groupe de sortie (Dial), départ log-logistique, choix de sortie logit
// (Lovreglio), suivisme, hésitation devant une issue fermée, forces sociales avec contact corps dur, escalators et
// escaliers à débit limité. Pas de globale, pas de DOM : tout l'état vit dans l'objet rendu par creerMoteur.
import { hasard } from './hasard';
import type { NavGrid, ObjetScene, Scene } from './navgrid';
import type { Etat, Groupe, Intention, Lien, Moteur, OptionsMoteur, Personne, Profil } from './types';

const R = 0.24; // rayon du corps, en mètres
const B = 16384; // anneau de seaux du Dial
const VOISINS: [number, number, number][] = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4], [1, -1, 1.4], [-1, 1, 1.4], [-1, -1, 1.4],
];
const VOISINS_ENTIERS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

function bits(s: string, n: number): Uint8Array {
  const b = atob(s);
  const u = new Uint8Array(n);
  for (let i = 0; i < n; i++) u[i] = (b.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  return u;
}

function paires(p: number[]): [number, number][] {
  const a: [number, number][] = [];
  for (let i = 0; i < p.length; i += 2) a.push([p[i], p[i + 1]]);
  if (a.length > 1 && a[0][0] === a[a.length - 1][0] && a[0][1] === a[a.length - 1][1]) a.pop();
  return a;
}

function dansPolygone(px: number, pz: number, pts: [number, number][]): boolean {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i];
    const [xj, zj] = pts[j];
    if (zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

/** Durée d'un trajet vertical : escalator 0,75 m/s, escalier 0,55 m/s, ascenseur (portes + trajet) ~1,3 m/s équivalent. */
export const dureeTrajet = (k: { k: string; len: number }): number =>
  k.len / (k.k === 'escalator' ? 0.75 : k.k === 'ascenseur' ? 1.3 : 0.55);

export function creerMoteur(navgrid: NavGrid, opts: OptionsMoteur): Moteur {
  const rnd = hasard(opts.graine);
  const ll = (med: number, b: number): number => {
    const u = Math.min(0.999, Math.max(0.001, rnd()));
    return med * Math.pow(u / (1 - u), 1 / b);
  };
  const gauss = (): number => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2832 * rnd());

  // copie de la grille : le moteur modifie les liens (ouverture, débit) sans toucher à l'entrée
  const g: NavGrid = { ...navgrid, links: navgrid.links.map((k) => ({ ...k })), exits: navgrid.exits };
  const N = g.w * g.h;
  const L = g.levels.length;
  const walk = new Uint8Array(N * L);
  const reach = new Uint8Array(N * L);
  for (let l = 0; l < L; l++) {
    walk.set(bits(g.walk[l], N), l * N);
    reach.set(bits(g.reach[l], N), l * N);
  }

  const linkAt = new Map<number, number[]>();
  const links: Lien[] = g.links.map((k, i) => {
    const ia = k.a[0] * N + k.a[1] * g.w + k.a[2];
    const ib = k.b[0] * N + k.b[1] * g.w + k.b[2];
    const lien: Lien = { ...k, open: true, free: [0, 0], debit: k.k === 'escalator' ? 1.25 : 2.0, ia, ib };
    for (const c of [ia, ib]) {
      const l = linkAt.get(c);
      if (l) l.push(i);
      else linkAt.set(c, [i]);
    }
    return lien;
  });

  // groupes de sortie : chaque porte de rue, les issues de secours, et « train » (tous les quais)
  const groups: Groupe[] = [];
  g.exits.forEach((e) => {
    if (e.type !== 'rue') return;
    const G = groups.find((x) => x.n === e.n);
    if (G) G.cells.push(e);
    else groups.push({ n: e.n, type: 'rue', cells: [e], open: true, zone: /Berger|Rambuteau/.test(e.n) });
  });
  if (g.exits.some((e) => e.type === 'secours')) {
    groups.push({ n: 'Issues de secours', type: 'secours', cells: g.exits.filter((e) => e.type === 'secours'), open: true, zone: false });
  }
  groups.push({ n: 'Quais RER et métro', type: 'train', cells: g.exits.filter((e) => e.type === 'train'), open: true, zone: false });

  const intentions = new Map<number, Intention>();

  const S: Moteur = {
    mode: 'calme',
    g, N, L, walk, reach, groups, links, linkAt,
    F: groups.map(() => new Float32Array(N * L)),
    A: null,
    T: 0, out: 0, outBy: {}, expo: 0, dmax: 0, zoneOut: 0,
    delay: 0,
    zoneOn: true,
    spawn, alerte, pas, champ, champs, setIntention, etat,
  };

  function resetCompteurs(): void {
    S.T = 0; S.out = 0; S.outBy = {}; S.expo = 0; S.dmax = 0; S.zoneOut = 0;
  }

  function champ(k: number): void {
    const f = S.F[k];
    f.fill(1e9);
    const G = groups[k];
    if (!G.open) return;
    const buckets: number[][] = Array.from({ length: B }, () => []);
    let cnt = 0;
    const push = (i: number, d: number): void => {
      f[i] = d;
      buckets[Math.round(d) % B].push(i);
      cnt++;
    };
    G.cells.forEach((e) => push(e.cell[0] * N + e.cell[1] * g.w + e.cell[2], 0));
    let cur = 0;
    let guard = 0;
    while (cnt > 0 && guard < 5e7) {
      const bk = buckets[cur % B];
      if (!bk.length) { cur++; continue; }
      const i = bk.pop() as number;
      cnt--; guard++;
      const d = f[i];
      if (Math.round(d) !== cur % B && Math.round(d) > cur) continue;
      const l = (i / N) | 0;
      const rem = i - l * N;
      const r = (rem / g.w) | 0;
      const c = rem - r * g.w;
      for (const [dr, dc, w] of VOISINS) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= g.h || cc >= g.w) continue;
        const j = i + dr * g.w + dc;
        if (!walk[j]) continue;
        if (dr && dc && (!walk[i + dr * g.w] || !walk[i + dc])) continue;
        const nd = d + w;
        // Float32 : la comparaison exige un vrai gain, sinon on boucle sur des égalités arrondies
        if (nd < f[j] - 1e-3) push(j, nd);
      }
      const ls = linkAt.get(i);
      if (ls) {
        for (const li of ls) {
          const k2 = links[li];
          if (!k2.open) continue;
          const j = k2.ia === i ? k2.ib : k2.ia;
          const nd = d + k2.len * 1.4;
          if (nd < f[j] - 1e-3) push(j, nd);
        }
      }
    }
  }

  function champs(): void {
    groups.forEach((_, k) => champ(k));
  }

  /** Passe de « calme » à « évacuation » sans déplacer personne : chacun garde sa place et tire son délai de départ. */
  function alerte(): void {
    if (!S.A) return;
    S.A.forEach((a) => {
      if (a.ride) {
        const to = a.ride.to;
        a.l = to[0];
        a.x = g.bbox[0] + (to[2] + 0.5) * g.res;
        a.z = g.bbox[1] + (to[1] + 0.5) * g.res;
        a.ride = null;
      }
      a.t = -1; a.next = 0; a.hes = 0; a.stopT = 0;
      a.pre = a.kind === 'cine' ? ll(40.5, 3.5) : a.kind === 'rer' ? ll(20, 3) : ll(30, 3.5);
    });
    resetCompteurs();
    S.mode = 'evac';
  }

  function spawn(n: number, scene: Scene): void {
    const A: Personne[] = [];
    S.A = A;
    resetCompteurs();
    const ugc = scene.interieur.filter((o: ObjetScene) => /UGC|Cin[ée]/i.test(o.n || '')).map((o) => paires(o.p));
    const inPoly = (x: number, z: number): boolean => ugc.some((p) => dansPolygone(x, z, p));
    type Cand = [number, number, number, boolean];
    const cand: Cand[] = [];
    for (let l = 0; l < L; l++) {
      for (let r = 0; r < g.h; r += 1) {
        for (let c = 0; c < g.w; c += 1) {
          const i = l * N + r * g.w + c;
          if (!reach[i]) continue;
          const x = g.bbox[0] + (c + 0.5) * g.res;
          const z = g.bbox[1] + (r + 0.5) * g.res;
          cand.push([l, x, z, inPoly(x, z) && (g.levels[l] === -3 || g.levels[l] === -2)]);
        }
      }
    }
    const cin = cand.filter((c) => c[3]);
    const oth = cand.filter((c) => !c[3]);
    const pick = (arr: Cand[], k: number, kind: Profil): void => {
      for (let j = 0; j < k && arr.length; j++) {
        const c = arr[(rnd() * arr.length) | 0];
        A.push({
          l: c[0],
          x: c[1] + (rnd() - 0.5) * 0.8,
          z: c[2] + (rnd() - 0.5) * 0.8,
          vx: 0, vz: 0, kind,
          v0: Math.max(0.7, 1.34 + 0.26 * gauss()),
          pre: kind === 'cine' ? ll(40.5, 3.5) : kind === 'rer' ? ll(20, 3) : ll(30, 3.5),
          bh: Math.max(0, 1 + 0.6 * gauss()),
          fam: (rnd() * groups.length) | 0,
          t: -1, next: 0, hes: 0, ride: null, out: false, dens: 0,
        });
      }
    };
    const nc = Math.round(n * (cin.length ? 0.55 : 0));
    pick(cin, nc, 'cine');
    pick(oth.filter((c) => g.levels[c[0]] <= -4), Math.round(n * 0.2), 'rer');
    pick(oth.filter((c) => g.levels[c[0]] > -4), n - A.length, 'client');
  }

  function cellule(a: Personne): number {
    const c = ((a.x - g.bbox[0]) / g.res) | 0;
    const r = ((a.z - g.bbox[1]) / g.res) | 0;
    if (c < 0 || r < 0 || c >= g.w || r >= g.h) return -1;
    return a.l * N + r * g.w + c;
  }

  function praticable(l: number, x: number, z: number): boolean {
    const c = ((x - g.bbox[0]) / g.res) | 0;
    const r = ((z - g.bbox[1]) / g.res) | 0;
    if (c < 0 || r < 0 || c >= g.w || r >= g.h) return false;
    return walk[l * N + r * g.w + c] === 1;
  }
  const libreEn = (l: number, x: number, z: number): boolean =>
    praticable(l, x - R, z - R) && praticable(l, x + R, z - R) && praticable(l, x - R, z + R) && praticable(l, x + R, z + R);

  const clef = (l: number, x: number, z: number): number => l * 1e6 + ((x + 400) | 0) * 1000 + ((z + 400) | 0);

  /** Choix de sortie : logit sur distance, familiarité, zone de troubles, suivisme, agent et annonce. */
  function choisir(a: Personne, herd: Record<number, number>): number {
    let s = 0;
    const u: number[] = [];
    const i = cellule(a);
    groups.forEach((G, k) => {
      const d = S.F[k][i];
      if (!G.open || d >= 1e9) { u.push(0); return; }
      const V = -0.04 * d + (a.fam === k ? 0.795 : 0) - (S.zoneOn && G.zone ? 1.5 : 0) + a.bh * (herd[k] || 0) + (G.agent && d < 40 ? 2.739 : 0) + (G.annonce ? 1 : 0);
      const e = Math.exp(Math.max(-30, Math.min(30, V)));
      u.push(e);
      s += e;
    });
    if (!s) return -1;
    let x = rnd() * s;
    for (let k = 0; k < u.length; k++) {
      x -= u[k];
      if (x <= 0) return k;
    }
    return u.length - 1;
  }

  /** À la sortie d'un escalator : la place libre la plus proche (pas d'empilement au même point). */
  function placer(a: Personne, x0: number, z0: number, H: Map<number, Personne[]>): void {
    let bx = x0;
    let bz = z0;
    let bd = -1;
    for (let t = 0; t < 12; t++) {
      const r = t ? 0.35 + 0.12 * t : 0;
      const th = t * 2.4;
      const x = x0 + r * Math.cos(th);
      const z = z0 + r * Math.sin(th);
      if (!libreEn(a.l, x, z)) continue;
      let dm = 9;
      const L2 = H.get(clef(a.l, x, z));
      if (L2) for (const b of L2) {
        if (b.out || b.ride || b.l !== a.l) continue;
        dm = Math.min(dm, Math.hypot(b.x - x, b.z - z));
      }
      if (dm >= 2 * R + 0.05) { bx = x; bz = z; bd = dm; break; }
      if (dm > bd) { bd = dm; bx = x; bz = z; }
    }
    a.x = bx; a.z = bz; a.vx = a.vz = 0;
    const L3 = H.get(clef(a.l, bx, bz));
    if (L3) L3.push(a);
    else H.set(clef(a.l, bx, bz), [a]);
  }

  function indiceGroupe(c: string | number | undefined): number {
    if (c === undefined) return -1;
    return typeof c === 'number' ? c : groups.findIndex((G) => G.n === c);
  }

  function setIntention(id: number, intention: Intention): void {
    intentions.set(id, { ...intentions.get(id), ...intention });
  }

  function pas(dt: number): void {
    const A = S.A;
    if (!A) return;
    S.T += dt;
    const H = new Map<number, Personne[]>();
    for (const a of A) {
      if (a.out || a.ride) continue;
      const kk = clef(a.l, a.x, a.z);
      let L2 = H.get(kk);
      if (!L2) H.set(kk, (L2 = []));
      L2.push(a);
    }
    for (let pi = 0; pi < A.length; pi++) {
      const a = A[pi];
      if (a.out) continue;
      if (a.ride) {
        if (S.T >= a.ride.t1) {
          const to = a.ride.to;
          a.l = to[0];
          placer(a, g.bbox[0] + (to[2] + 0.5) * g.res, g.bbox[1] + (to[1] + 0.5) * g.res, H);
          a.ride = null;
        }
        continue;
      }
      const intention = intentions.size ? intentions.get(pi) : undefined;
      let ex = 0;
      let ez = 0;
      const vcible = intention?.vitesse_voulue_m_s ?? a.v0;
      const vd = S.mode === 'calme' ? a.v0 * 0.7 : vcible;
      if (S.mode === 'calme') {
        // avant l'alerte : les spectateurs restent assis, les autres flânent ; demi-tour devant un mur ; pauses ; prennent parfois un escalator
        if (a.kind === 'cine') { a.vx *= 0.5; a.vz *= 0.5; }
        else if ((a.stopT ?? 0) > 0) { a.stopT = (a.stopT as number) - dt; }
        else {
          if (a.wh === undefined) a.wh = rnd() * 6.283;
          a.wh += (rnd() - 0.5) * 0.25;
          ex = Math.cos(a.wh); ez = Math.sin(a.wh);
          if (!libreEn(a.l, a.x + ex * 1.2, a.z + ez * 1.2)) a.wh += 1.6 + rnd() * 2.5;
          if (rnd() < 0.0015) a.stopT = 2 + rnd() * 8;
          const i = cellule(a);
          const ls = i >= 0 ? linkAt.get(i) : undefined;
          if (ls && rnd() < 0.35) {
            const li = ls[(rnd() * ls.length) | 0];
            const k = links[li];
            if (k.open) {
              const dir = k.ia === i ? 0 : 1;
              if (S.T >= k.free[dir]) {
                k.free[dir] = S.T + 1 / k.debit;
                a.ride = { li, t1: S.T + dureeTrajet(k), to: dir === 0 ? k.b : k.a, from: [a.l, a.x, a.z] };
                continue;
              }
            }
          }
        }
      } else {
        if (S.T < a.pre + S.delay) continue;
        if (a.t >= 0 && !groups[a.t].open) { if (a.hes <= 0) a.hes = 2 + rnd() * 3; }
        if (a.hes > 0) {
          a.hes -= dt; a.vx *= 0.7; a.vz *= 0.7;
          if (a.hes > 0) continue;
          a.next = 0;
        }
        if (S.T >= a.next) {
          const herd: Record<number, number> = {};
          let nn = 0;
          for (let ix = -4; ix <= 4; ix += 2) {
            for (let iz = -4; iz <= 4; iz += 2) {
              const L2 = H.get(clef(a.l, a.x + ix, a.z + iz));
              if (!L2) continue;
              for (const b of L2) {
                if (b === a || b.t < 0) continue;
                herd[b.t] = (herd[b.t] || 0) + 1;
                nn++;
              }
            }
          }
          if (nn) for (const k in herd) herd[k] /= nn;
          // l'intention fixée par le comportement pilote le choix tant que la sortie visée est ouverte
          const vise = indiceGroupe(intention?.sortie_cible);
          if (vise >= 0 && vise < groups.length && groups[vise].open) a.t = vise;
          else if (a.t < 0 || !groups[a.t].open || rnd() < 0.1) a.t = choisir(a, herd);
          a.next = S.T + (a.t < 0 ? 2 : 8);
          // case isolée (aucune sortie calculable d'ici) : on rejoint la case praticable voisine reliée la plus proche (2 m au plus)
          if (a.t < 0) {
            const i = cellule(a);
            let bj = -1;
            let bd = 9;
            for (let dr = -2; dr <= 2; dr++) {
              for (let dc = -2; dc <= 2; dc++) {
                const j = i + dr * g.w + dc;
                if (!walk[j]) continue;
                if (!S.F.some((F, k) => groups[k].open && F[j] < 1e9)) continue;
                const d = Math.hypot(dr, dc);
                if (d < bd) { bd = d; bj = j; }
              }
            }
            if (bj >= 0) {
              const rem = bj - a.l * N;
              const r = (rem / g.w) | 0;
              const c = rem - r * g.w;
              a.x = g.bbox[0] + (c + 0.5) * g.res;
              a.z = g.bbox[1] + (r + 0.5) * g.res;
              a.next = 0;
            }
          }
        }
        if (a.t < 0) continue;
        const i = cellule(a);
        if (i < 0) { a.out = true; continue; }
        const f = S.F[a.t];
        if (f[i] < 1.6 && groups[a.t].filtre) {
          const G2 = groups[a.t];
          if (S.T < (G2.nextFree || 0)) { a.vx *= 0.3; a.vz *= 0.3; continue; }
          G2.nextFree = S.T + 1 / 1.3;
        }
        if (f[i] < 1.6) {
          a.out = true;
          S.out++;
          const n = groups[a.t].n;
          S.outBy[n] = (S.outBy[n] || 0) + 1;
          if (groups[a.t].zone) S.zoneOut++;
          continue;
        }
        let ls = linkAt.get(i);
        let depuis: number | undefined;
        if (!ls) {
          for (const o of [1, -1, g.w, -g.w, g.w + 1, g.w - 1, -g.w + 1, -g.w - 1]) {
            const q = linkAt.get(i + o);
            if (q) { ls = q.map((li) => li); depuis = i + o; break; }
          }
        }
        if (ls) {
          const ib = depuis ?? i;
          for (const li of ls) {
            const k = links[li];
            if (!k.open) continue;
            const other = k.ia === ib ? k.ib : k.ia;
            if (f[other] + k.len * 1.4 <= f[ib] + 0.5) {
              const dir = k.ia === ib ? 0 : 1;
              if (S.T >= k.free[dir]) {
                k.free[dir] = S.T + 1 / k.debit;
                a.ride = { li, t1: S.T + dureeTrajet(k), to: dir === 0 ? k.b : k.a, from: [a.l, a.x, a.z] };
              } else { a.vx *= 0.5; a.vz *= 0.5; }
              break;
            }
          }
          if (a.ride) continue;
        }
        // direction : descente de la carte de pentes (gradient sur les 8 voisins)
        const w = g.w;
        let bx = 0;
        let bz = 0;
        let best = f[i];
        for (const [dr, dc] of VOISINS_ENTIERS) {
          const j = i + dr * w + dc;
          if (!walk[j]) continue;
          const v = f[j];
          if (v < best) { best = v; bx = dc; bz = dr; }
        }
        const m = Math.hypot(bx, bz) || 1;
        ex = bx / m; ez = bz / m;
      }
      let ax = (vd * ex - a.vx) / 0.5;
      let az = (vd * ez - a.vz) / 0.5;
      let crowd = 0;
      for (let ix = -1; ix <= 1; ix++) {
        for (let iz = -1; iz <= 1; iz++) {
          const L2 = H.get(clef(a.l, a.x + ix, a.z + iz));
          if (!L2) continue;
          for (const b of L2) {
            if (b === a) continue;
            const dx = a.x - b.x;
            const dz = a.z - b.z;
            const d = Math.hypot(dx, dz) || 1e-3;
            if (d > 1.6) continue;
            if (d < 1.13) crowd++;
            const nx = dx / d;
            const nz = dz / d;
            const cos = -(nx * ex + nz * ez);
            const wgt = 0.3 + (0.7 * (1 + cos)) / 2;
            const F = 25 * Math.exp((2 * R - d) / 0.08) * wgt;
            ax += F * nx; az += F * nz;
          }
        }
      }
      a.dens = crowd;
      a.vx += ax * dt; a.vz += az * dt;
      const sp = Math.hypot(a.vx, a.vz);
      const vm = 1.3 * (intention?.vitesse_voulue_m_s !== undefined ? Math.max(a.v0, intention.vitesse_voulue_m_s) : a.v0);
      if (sp > vm) { a.vx *= vm / sp; a.vz *= vm / sp; }
      for (let ix = -1; ix <= 1; ix++) {
        for (let iz = -1; iz <= 1; iz++) {
          const L2 = H.get(clef(a.l, a.x + ix, a.z + iz));
          if (!L2) continue;
          for (const b of L2) {
            if (b === a || b.out || b.ride) continue;
            const dx = a.x - b.x;
            const dz = a.z - b.z;
            const d = Math.hypot(dx, dz) || 1e-3;
            if (d < 2 * R) {
              const p = (2 * R - d) * 0.5;
              const px = a.x + (dx / d) * p;
              const pz = a.z + (dz / d) * p;
              if (libreEn(a.l, px, pz)) { a.x = px; a.z = pz; }
            }
          }
        }
      }
      const nx = a.x + a.vx * dt;
      const nz = a.z + a.vz * dt;
      if (libreEn(a.l, nx, a.z)) a.x = nx; else a.vx *= -0.1;
      if (libreEn(a.l, a.x, nz)) a.z = nz; else a.vz *= -0.1;
    }
    // densité par m² et exposition (personnes-secondes au-dessus de 5 pers./m²)
    if (((S.T / dt) | 0) % 5 === 0) {
      const D = new Map<number, number>();
      for (const a of A) {
        if (a.out || a.ride) continue;
        const k = a.l * 1e6 + (Math.floor(a.x) + 400) * 1000 + (Math.floor(a.z) + 400);
        D.set(k, (D.get(k) || 0) + 1);
      }
      let e = 0;
      for (const v of D.values()) {
        if (v > S.dmax) S.dmax = v;
        if (v > 5) e += v;
      }
      S.expo += e * dt * 5;
    }
  }

  function etat(): Etat {
    let chevauchements = 0;
    let dansMur = 0;
    const present = (S.A ?? []).filter((a) => !a.out && !a.ride);
    const H = new Map<number, number[]>();
    present.forEach((a, n) => {
      const i = cellule(a);
      if (i < 0 || !walk[i]) dansMur++;
      const k = clef(a.l, a.x, a.z);
      const l = H.get(k);
      if (l) l.push(n);
      else H.set(k, [n]);
    });
    present.forEach((a, n) => {
      for (let ix = -1; ix <= 1; ix++) {
        for (let iz = -1; iz <= 1; iz++) {
          for (const m of H.get(clef(a.l, a.x + ix, a.z + iz)) ?? []) {
            if (m <= n) continue;
            const b = present[m];
            if (Math.hypot(a.x - b.x, a.z - b.z) < 2 * R - 0.005) chevauchements++;
          }
        }
      }
    });
    return { T: S.T, out: S.out, outBy: { ...S.outBy }, expo: S.expo, dmax: S.dmax, zoneOut: S.zoneOut, chevauchements, dansMur };
  }

  champs();
  return S;
}
