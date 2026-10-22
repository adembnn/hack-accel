// Simulation de foule : modèle à vitesse sans collision (CFS, Tordeux et al. 2016) sur grille multi-niveaux.
// Chaque personne choisit parmi quelques directions celle qui maximise (vitesse permise x progression vers la sortie) ;
// la vitesse permise vaut (écart devant soi) / (intervalle de temps T), plafonnée à la vitesse désirée.
import type { NavGrid } from './navgrid.ts';
import { computeField } from './field.ts';
import type { Field, LinkEdge } from './field.ts';

export interface CrowdOptions {
  dt?: number; // 0,1 s
  seed?: number;
  capacity?: number; // nombre maximal de personnes
  timeGap?: number; // T du modèle CFS, en s
  evacuation?: boolean; // vrai = ascenseurs interdits
  densityEvery?: number; // recalcul de la densité tous les n pas
  clearance?: number; // marge au mur en m
}

// Paramètres de démonstration, NON calés sur des mesures :
const STOPPED_ESCALATOR_SPEED = 0.5; // m/s, escalator arrêté parcouru à pied
const STOPPED_ESCALATOR_CAP = 0.75; // fraction du débit nominal quand il est arrêté
const ANGLES = [0, 0.45, -0.45, 0.9, -0.9, 1.35, -1.35];
const COS = ANGLES.map(Math.cos), SIN = ANGLES.map(Math.sin);

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Stats {
  time: number;
  alive: number;
  riding: number;
  exited: number;
  maxDensity: number; // personnes/m2 lissées sur 9 m2
  maxPressure: number; // densité x variance de vitesse (Helbing)
  personSecondsOver5: number; // personnes x secondes dans des zones au-dessus de 5 pers./m2
  stuck: number; // personnes sans chemin vers leur sortie
}

export class CrowdSim {
  readonly grid: NavGrid;
  readonly dt: number;
  readonly cs: number;
  readonly W: number;
  readonly H: number;
  readonly L: number;
  readonly per: number;
  time = 0;
  evacuation: boolean;
  private T: number;
  private clear: number;
  private rand: () => number;
  private walk: Uint8Array;
  private near: Uint8Array;
  private goals: number[][] = [];
  private fields: Field[] = [];
  private tokens: Float64Array;
  private linkUse: Int32Array;
  // personnes (tableaux parallèles)
  readonly cap: number;
  n = 0;
  x: Float64Array; y: Float64Array; nx: Float64Array; ny: Float64Array;
  vx: Float32Array; vy: Float32Array; r: Float32Array; v0: Float32Array;
  lvl: Uint8Array; goal: Uint8Array; state: Uint8Array; lnk: Int16Array; timer: Float32Array; exitT: Float32Array;
  // grille spatiale (seaux de 1 m)
  private bw: number;
  private bh: number;
  private bStart: Int32Array;
  private bItems: Int32Array;
  private bOf: Int32Array;
  private bFill: Int32Array;
  private bWalkArea: Float32Array;
  density: Float32Array[] = [];
  pressure: Float32Array[] = [];
  private densEvery: number;
  private stepNo = 0;
  private overSec = 0;
  private maxDens = 0;
  private maxPress = 0;
  exited = 0;
  private stuckCount = 0;
  private nbDx = new Float32Array(256);
  private nbDy = new Float32Array(256);
  private nbR = new Float32Array(256);
  private sCnt: Float32Array; private sX: Float32Array; private sY: Float32Array; private sV2: Float32Array;

  constructor(grid: NavGrid, o: CrowdOptions = {}) {
    this.grid = grid;
    this.dt = o.dt ?? 0.1;
    this.cs = grid.cellSize;
    this.W = grid.width; this.H = grid.height; this.L = grid.levels; this.per = this.W * this.H;
    this.evacuation = o.evacuation ?? true;
    this.T = o.timeGap ?? 1.3;
    this.clear = o.clearance ?? 0.1;
    this.rand = rng(o.seed ?? 1);
    this.densEvery = o.densityEvery ?? 5;
    const N = this.per * this.L;
    this.walk = new Uint8Array(N);
    this.near = new Uint8Array(N);
    const c = (this.cap = o.capacity ?? 8192);
    this.x = new Float64Array(c); this.y = new Float64Array(c); this.nx = new Float64Array(c); this.ny = new Float64Array(c);
    this.vx = new Float32Array(c); this.vy = new Float32Array(c); this.r = new Float32Array(c); this.v0 = new Float32Array(c);
    this.lvl = new Uint8Array(c); this.goal = new Uint8Array(c); this.state = new Uint8Array(c);
    this.lnk = new Int16Array(c).fill(-1); this.timer = new Float32Array(c); this.exitT = new Float32Array(c).fill(-1);
    this.tokens = new Float64Array(grid.links.length);
    this.linkUse = new Int32Array(grid.links.length);
    const bpm = Math.round(1 / this.cs); // cellules par seau
    this.bw = Math.ceil(this.W / bpm); this.bh = Math.ceil(this.H / bpm);
    const nb = this.bw * this.bh * this.L;
    this.bStart = new Int32Array(nb + 1); this.bFill = new Int32Array(nb);
    this.bItems = new Int32Array(c); this.bOf = new Int32Array(c).fill(-1);
    this.bWalkArea = new Float32Array(nb);
    this.sCnt = new Float32Array(nb); this.sX = new Float32Array(nb); this.sY = new Float32Array(nb); this.sV2 = new Float32Array(nb);
    for (let l = 0; l < this.L; l++) {
      this.density.push(new Float32Array(this.bw * this.bh));
      this.pressure.push(new Float32Array(this.bw * this.bh));
    }
    this.goals.push(grid.exits.map((e) => e.level * this.per + e.y * this.W + e.x));
    this.refreshRouting();
  }

  /** Groupe de sorties supplémentaire (ex. seulement la sortie nord) ; renvoie son indice. */
  addGoalGroup(cells: { level: number; x: number; y: number }[]): number {
    this.goals.push(cells.map((e) => e.level * this.per + e.y * this.W + e.x));
    this.refreshRouting();
    return this.goals.length - 1;
  }

  /** À appeler après tout changement d'état de la grille (porte, lien, escalator, mode évacuation). */
  refreshRouting(): void {
    const { W, H, L, per, grid } = this;
    for (let l = 0; l < L; l++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) this.walk[l * per + y * W + x] = grid.isWalkable(l, x, y) ? 1 : 0;
    for (let l = 0; l < L; l++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = l * per + y * W + x;
      let nw = 0;
      if (this.walk[i]) {
        for (let dy = -1; dy <= 1 && !nw; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H || !this.walk[l * per + yy * W + xx]) { nw = 1; break; }
        }
      }
      this.near[i] = nw;
    }
    const edges: LinkEdge[] = [];
    grid.links.forEach((lk, index) => {
      if (!this.linkActive(index)) return;
      const e = this.linkEff(index);
      edges.push({
        fromNode: lk.from.level * per + lk.from.y * W + lk.from.x,
        toNode: lk.to.level * per + lk.to.y * W + lk.to.x,
        cost: (lk.length / e.speed) * 1.3, index,
      });
    });
    this.fields = this.goals.map((g) => computeField(this.walk, W, H, L, this.cs, g, edges, this.near));
    const bpm = Math.round(1 / this.cs);
    this.bWalkArea.fill(0);
    for (let l = 0; l < L; l++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (this.walk[l * per + y * W + x]) this.bWalkArea[(l * this.bh + ((y / bpm) | 0)) * this.bw + ((x / bpm) | 0)] += this.cs * this.cs;
    }
  }

  private linkActive(i: number): boolean {
    const lk = this.grid.links[i];
    if (lk.enabled === false) return false;
    if (lk.kind === 'elevator' && this.evacuation) return false;
    return true;
  }
  private linkEff(i: number): { speed: number; capacity: number } {
    const lk = this.grid.links[i];
    if (lk.kind === 'escalator' && lk.running === false) return { speed: STOPPED_ESCALATOR_SPEED, capacity: lk.capacity * STOPPED_ESCALATOR_CAP };
    return { speed: lk.speed, capacity: lk.capacity };
  }

  setDoorOpen(id: string, open: boolean): void {
    const d = this.grid.doors.find((q) => q.id === id);
    if (!d) throw new Error('porte inconnue ' + id);
    d.open = open;
    this.refreshRouting();
  }
  /** Arrête ou relance les escalators dont l'identifiant commence par le préfixe. */
  setEscalatorRunning(prefix: string, running: boolean): void {
    for (const lk of this.grid.links) if (lk.kind === 'escalator' && lk.id.startsWith(prefix)) lk.running = running;
    this.refreshRouting();
  }
  setLinkEnabled(prefix: string, enabled: boolean): void {
    for (const lk of this.grid.links) if (lk.id.startsWith(prefix)) lk.enabled = enabled;
    this.refreshRouting();
  }
  setEvacuation(on: boolean): void {
    this.evacuation = on;
    this.refreshRouting();
  }
  /** Nombre de passages cumulés sur les liens dont l'identifiant commence par le préfixe. */
  linkUsage(prefix: string): number {
    let s = 0;
    this.grid.links.forEach((lk, i) => { if (lk.id.startsWith(prefix)) s += this.linkUse[i]; });
    return s;
  }

  private free(l: number, px: number, py: number): boolean {
    const c = this.clear, cs = this.cs, W = this.W, H = this.H, base = l * this.per;
    const x0 = Math.floor((px - c) / cs), x1 = Math.floor((px + c) / cs), y0 = Math.floor((py - c) / cs), y1 = Math.floor((py + c) / cs);
    if (x0 < 0 || y0 < 0 || x1 >= W || y1 >= H) return false;
    return (this.walk[base + y0 * W + x0] & this.walk[base + y0 * W + x1] & this.walk[base + y1 * W + x0] & this.walk[base + y1 * W + x1]) === 1;
  }

  addAgent(level: number, px: number, py: number, o: { goal?: number; v0?: number; r?: number } = {}): number {
    if (this.n >= this.cap) throw new Error('capacité dépassée');
    if (!this.free(level, px, py)) throw new Error('position non praticable');
    const i = this.n++;
    this.x[i] = px; this.y[i] = py; this.lvl[i] = level; this.goal[i] = o.goal ?? 0;
    const g = (): number => (this.rand() + this.rand() + this.rand() - 1.5) / 1.5;
    this.v0[i] = o.v0 ?? Math.min(1.8, Math.max(0.9, 1.34 + 0.2 * g()));
    this.r[i] = o.r ?? 0.2 + 0.03 * g();
    this.state[i] = 0; this.lnk[i] = -1; this.exitT[i] = -1; this.vx[i] = 0; this.vy[i] = 0;
    return i;
  }

  /** Place n personnes au hasard sur des cellules praticables éloignées des murs et des sorties. */
  spawnRandom(n: number, opts: { levels?: number[]; region?: { x0: number; y0: number; x1: number; y1: number } } = {}): void {
    const levels = opts.levels ?? Array.from({ length: this.L }, (_, i) => i);
    const rg = opts.region ?? { x0: 0, y0: 0, x1: this.W - 1, y1: this.H - 1 };
    const cand: number[] = [];
    for (const l of levels) for (let y = rg.y0; y <= rg.y1; y++) for (let x = rg.x0; x <= rg.x1; x++) {
      const i = l * this.per + y * this.W + x;
      if (this.walk[i] && !this.near[i] && this.fields[0].pot[i] > 3) cand.push(i);
    }
    if (!cand.length) throw new Error('aucune cellule libre');
    for (let k = 0; k < n; k++) {
      const c = cand[(this.rand() * cand.length) | 0];
      const l = (c / this.per) | 0, r = c - l * this.per, cy = (r / this.W) | 0, cx = r - cy * this.W;
      this.addAgent(l, (cx + 0.2 + 0.6 * this.rand()) * this.cs, (cy + 0.2 + 0.6 * this.rand()) * this.cs);
    }
  }

  private buildHash(): void {
    const { bw, bh } = this;
    const nb = bw * bh * this.L, bs = this.bStart;
    bs.fill(0);
    for (let i = 0; i < this.n; i++) {
      if (this.state[i] !== 0) { this.bOf[i] = -1; continue; }
      const bx = Math.min(bw - 1, this.x[i] | 0), by = Math.min(bh - 1, this.y[i] | 0);
      const k = (this.lvl[i] * bh + by) * bw + bx;
      this.bOf[i] = k;
      bs[k + 1]++;
    }
    for (let k = 0; k < nb; k++) bs[k + 1] += bs[k];
    this.bFill.set(bs.subarray(0, nb));
    for (let i = 0; i < this.n; i++) {
      const k = this.bOf[i];
      if (k >= 0) this.bItems[this.bFill[k]++] = i;
    }
  }

  step(): void {
    const { dt, cs, W, per, bw, bh } = this;
    this.time += dt;
    this.stepNo++;
    for (let l = 0; l < this.tokens.length; l++) {
      if (this.linkActive(l)) this.tokens[l] = Math.min(1.5, this.tokens[l] + this.linkEff(l).capacity * dt);
    }
    this.buildHash();
    this.stuckCount = 0;
    const T = this.T;
    for (let i = 0; i < this.n; i++) {
      const st = this.state[i];
      if (st === 2) continue;
      if (st === 1) {
        this.timer[i] -= dt;
        if (this.timer[i] <= 0) {
          const lk = this.grid.links[this.lnk[i]];
          this.lvl[i] = lk.to.level;
          this.x[i] = (lk.to.x + 0.5) * cs; this.y[i] = (lk.to.y + 0.5) * cs;
          this.state[i] = 0; this.lnk[i] = -1; this.vx[i] = 0; this.vy[i] = 0;
        }
        this.nx[i] = this.x[i]; this.ny[i] = this.y[i];
        continue;
      }
      const l = this.lvl[i];
      let px = this.x[i], py = this.y[i];
      let cx = (px / cs) | 0, cy = (py / cs) | 0;
      if (!this.free(l, px, py)) {
        // une porte s'est fermée sous ses pieds : on le ramène à la cellule praticable voisine
        const q = this.rescue(l, cx, cy);
        if (q) { px = q[0]; py = q[1]; this.x[i] = px; this.y[i] = py; cx = (px / cs) | 0; cy = (py / cs) | 0; }
      }
      const node = l * per + cy * W + cx;
      const f = this.fields[this.goal[i]];
      if (f.pot[node] === 0) { this.state[i] = 2; this.exited++; this.exitT[i] = this.time; this.nx[i] = px; this.ny[i] = py; continue; }
      if (!isFinite(f.pot[node])) { this.stuckCount++; this.vx[i] = 0; this.vy[i] = 0; this.nx[i] = px; this.ny[i] = py; continue; }
      // lien vertical à prendre depuis cette cellule ?
      const lo = f.linkOut[node];
      if (lo >= 0 && this.tokens[lo] >= 1) {
        const L0 = this.grid.links[lo];
        const ddx = (L0.from.x + 0.5) * cs - px, ddy = (L0.from.y + 0.5) * cs - py;
        if (ddx * ddx + ddy * ddy < 0.1) {
          this.tokens[lo] -= 1; this.linkUse[lo]++;
          this.state[i] = 1; this.lnk[i] = lo; this.timer[i] = L0.length / this.linkEff(lo).speed;
          this.nx[i] = px; this.ny[i] = py;
          continue;
        }
      }
      // cible : centre de la cellule 3 pas plus loin sur le même niveau
      let tn = node;
      for (let k = 0; k < 3; k++) {
        const nn = f.next[tn];
        if (nn < 0 || f.linkOut[tn] >= 0 || ((nn / per) | 0) !== l) break;
        tn = nn;
      }
      const tr = tn - l * per, ty = (tr / W) | 0, tx = tr - ty * W;
      let ex = (tx + 0.5) * cs - px, ey = (ty + 0.5) * cs - py;
      const dist = Math.hypot(ex, ey);
      if (dist < 1e-6) { this.vx[i] = 0; this.vy[i] = 0; this.nx[i] = px; this.ny[i] = py; continue; }
      ex /= dist; ey /= dist;
      const atEnd = tn === node || f.linkOut[tn] >= 0;
      // voisins proches
      const ri = this.r[i], v0 = this.v0[i];
      let nn = 0;
      const b = this.bOf[i], bx = b % bw, by = ((b / bw) | 0) % bh, base = l * bh;
      for (let yy = Math.max(0, by - 2); yy <= Math.min(bh - 1, by + 2); yy++) {
        for (let xx = Math.max(0, bx - 2); xx <= Math.min(bw - 1, bx + 2); xx++) {
          const k = (base + yy) * bw + xx;
          for (let q = this.bStart[k]; q < this.bStart[k + 1]; q++) {
            const j = this.bItems[q];
            if (j === i) continue;
            const dx = this.x[j] - px, dy = this.y[j] - py;
            if (dx * dx + dy * dy > 3.6 || nn >= 256 || dx * ex + dy * ey < -0.5) continue;
            this.nbDx[nn] = dx; this.nbDy[nn] = dy; this.nbR[nn] = ri + this.r[j];
            nn++;
          }
        }
      }
      // meilleure direction
      let bestScore = -1, bsp = 0, bdx = ex, bdy = ey;
      const flip = i & 1 ? -1 : 1;
      for (let a = 0; a < ANGLES.length; a++) {
        if (bestScore >= v0 * COS[a]) break; // les directions suivantes ne peuvent plus faire mieux
        const s = SIN[a] * flip;
        const dx = ex * COS[a] - ey * s, dy = ex * s + ey * COS[a];
        let gap = v0 * T;
        for (let q = 0; q < nn; q++) {
          const along = this.nbDx[q] * dx + this.nbDy[q] * dy;
          if (along <= 0) continue;
          const perp = Math.abs(this.nbDx[q] * dy - this.nbDy[q] * dx);
          if (perp >= this.nbR[q]) continue;
          const g = along - this.nbR[q];
          if (g < gap) gap = g;
        }
        let sp = gap > 0 ? Math.min(v0, gap / T) : 0;
        if (atEnd) sp = Math.min(sp, dist / dt);
        if (sp > 0 && !this.free(l, px + dx * sp * dt, py + dy * sp * dt)) sp = 0;
        const score = sp * COS[a];
        if (score > bestScore + 1e-9) { bestScore = score; bsp = sp; bdx = dx; bdy = dy; }
      }
      const mx = bsp > 0 ? px + bdx * bsp * dt : px, my = bsp > 0 ? py + bdy * bsp * dt : py;
      this.vx[i] = (mx - px) / dt; this.vy[i] = (my - py) / dt;
      this.nx[i] = mx; this.ny[i] = my;
    }
    for (let i = 0; i < this.n; i++) if (this.state[i] === 0) { this.x[i] = this.nx[i]; this.y[i] = this.ny[i]; }
    if (this.stepNo % this.densEvery === 0) this.updateDensity();
  }

  private rescue(l: number, cx: number, cy: number): [number, number] | null {
    for (let rad = 1; rad < 8; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= this.W || y >= this.H) continue;
      const px = (x + 0.5) * this.cs, py = (y + 0.5) * this.cs;
      if (this.free(l, px, py)) return [px, py];
    }
    return null;
  }

  /** Densité (pers./m2, fenêtre de 3x3 m) et pression de Helbing (densité x variance de vitesse) par seau de 1 m. */
  updateDensity(): void {
    const { bw, bh, L } = this;
    const cnt = this.sCnt, sx = this.sX, sy = this.sY, s2 = this.sV2;
    cnt.fill(0); sx.fill(0); sy.fill(0); s2.fill(0);
    for (let i = 0; i < this.n; i++) {
      if (this.state[i] !== 0) continue;
      const k = this.bOf[i];
      if (k < 0) continue;
      cnt[k]++; sx[k] += this.vx[i]; sy[k] += this.vy[i]; s2[k] += this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i];
    }
    this.maxDens = 0; this.maxPress = 0;
    const dtd = this.dt * this.densEvery;
    for (let l = 0; l < L; l++) for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      let c = 0, a = 0, ax = 0, ay = 0, a2 = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= bw || yy >= bh) continue;
        const k = (l * bh + yy) * bw + xx;
        c += cnt[k]; a += this.bWalkArea[k]; ax += sx[k]; ay += sy[k]; a2 += s2[k];
      }
      const o = y * bw + x;
      if (c === 0 || a < 1e-6) { this.density[l][o] = 0; this.pressure[l][o] = 0; continue; }
      const d = c / a, variance = Math.max(0, a2 / c - (ax * ax + ay * ay) / (c * c));
      this.density[l][o] = d;
      this.pressure[l][o] = d * variance;
      if (d > this.maxDens) this.maxDens = d;
      if (d * variance > this.maxPress) this.maxPress = d * variance;
      if (d > 5) this.overSec += cnt[(l * bh + y) * bw + x] * dtd;
    }
  }

  densityAt(level: number, xm: number, ym: number): number {
    return this.density[level][Math.min(this.bh - 1, ym | 0) * this.bw + Math.min(this.bw - 1, xm | 0)];
  }
  pressureAt(level: number, xm: number, ym: number): number {
    return this.pressure[level][Math.min(this.bh - 1, ym | 0) * this.bw + Math.min(this.bw - 1, xm | 0)];
  }

  /** Vrai si la personne i (hors transport) est dans une cellule praticable : contrôle 0 traversée de mur. */
  inWalkable(i: number): boolean {
    const cx = (this.x[i] / this.cs) | 0, cy = (this.y[i] / this.cs) | 0;
    return this.x[i] >= 0 && this.y[i] >= 0 && cx < this.W && cy < this.H && this.walk[this.lvl[i] * this.per + cy * this.W + cx] === 1;
  }

  /** Nombre de personnes qui en chevauchent une autre de plus de 30 % de la somme des rayons. */
  overlapCount(): number {
    this.buildHash();
    let c = 0;
    for (let i = 0; i < this.n; i++) {
      const b = this.bOf[i];
      if (b < 0) continue;
      const bx = b % this.bw, by = ((b / this.bw) | 0) % this.bh, base = this.lvl[i] * this.bh;
      let hit = false;
      for (let yy = Math.max(0, by - 1); yy <= Math.min(this.bh - 1, by + 1) && !hit; yy++) {
        for (let xx = Math.max(0, bx - 1); xx <= Math.min(this.bw - 1, bx + 1) && !hit; xx++) {
          const k = (base + yy) * this.bw + xx;
          for (let q = this.bStart[k]; q < this.bStart[k + 1]; q++) {
            const j = this.bItems[q];
            if (j === i) continue;
            if (Math.hypot(this.x[j] - this.x[i], this.y[j] - this.y[i]) < (this.r[i] + this.r[j]) * 0.7) { hit = true; break; }
          }
        }
      }
      if (hit) c++;
    }
    return c;
  }

  stats(): Stats {
    let alive = 0, riding = 0;
    for (let i = 0; i < this.n; i++) { if (this.state[i] === 0) alive++; else if (this.state[i] === 1) riding++; }
    return {
      time: this.time, alive, riding, exited: this.exited, maxDensity: this.maxDens, maxPressure: this.maxPress,
      personSecondsOver5: this.overSec, stuck: this.stuckCount,
    };
  }
}
