// Champ de potentiel vers un groupe de sorties : Dijkstra inverse sur les cellules (8 voisins) et les liens verticaux.
export interface LinkEdge {
  fromNode: number;
  toNode: number;
  cost: number; // mètres équivalents
  index: number; // indice du lien dans la liste de la grille
}

export interface Field {
  pot: Float64Array; // coût restant jusqu'à la sortie (Infinity si inaccessible)
  next: Int32Array; // nœud suivant sur le chemin (-1 pour une sortie ou un nœud inaccessible)
  linkOut: Int32Array; // indice du lien emprunté depuis ce nœud (-1 sinon)
}

class MinHeap {
  keys: Float64Array;
  vals: Int32Array;
  n = 0;
  constructor(cap: number) {
    this.keys = new Float64Array(cap);
    this.vals = new Int32Array(cap);
  }
  push(k: number, v: number): void {
    if (this.n === this.keys.length) {
      const nk = new Float64Array(this.n * 2); nk.set(this.keys); this.keys = nk;
      const nv = new Int32Array(this.n * 2); nv.set(this.vals); this.vals = nv;
    }
    let i = this.n++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p] <= k) break;
      this.keys[i] = this.keys[p]; this.vals[i] = this.vals[p]; i = p;
    }
    this.keys[i] = k; this.vals[i] = v;
  }
  popKey = 0;
  popVal = 0;
  pop(): void {
    this.popKey = this.keys[0]; this.popVal = this.vals[0];
    const k = this.keys[--this.n], v = this.vals[this.n];
    let i = 0;
    for (;;) {
      let c = 2 * i + 1;
      if (c >= this.n) break;
      if (c + 1 < this.n && this.keys[c + 1] < this.keys[c]) c++;
      if (this.keys[c] >= k) break;
      this.keys[i] = this.keys[c]; this.vals[i] = this.vals[c]; i = c;
    }
    this.keys[i] = k; this.vals[i] = v;
  }
}

export function computeField(
  walk: Uint8Array, W: number, H: number, L: number, cs: number,
  goals: number[], links: LinkEdge[], nearWall: Uint8Array,
): Field {
  const N = W * H * L, per = W * H;
  const pot = new Float64Array(N).fill(Infinity);
  const next = new Int32Array(N).fill(-1);
  const linkOut = new Int32Array(N).fill(-1);
  const incoming = new Map<number, LinkEdge[]>();
  for (const e of links) {
    let a = incoming.get(e.toNode);
    if (!a) incoming.set(e.toNode, (a = []));
    a.push(e);
  }
  const heap = new MinHeap(1024);
  for (const g of goals) if (walk[g]) { pot[g] = 0; heap.push(0, g); }
  const ortho = cs, diag = cs * Math.SQRT2, pen = 0.6; // pénalité de proximité d'un mur (relative au pas)
  while (heap.n > 0) {
    heap.pop();
    const d = heap.popKey, n = heap.popVal;
    if (d > pot[n]) continue;
    const l = (n / per) | 0, r = n - l * per, y = (r / W) | 0, x = r - y * W;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const m = l * per + ny * W + nx;
      if (!walk[m]) continue;
      if (dx && dy && (!walk[l * per + y * W + nx] || !walk[l * per + ny * W + x])) continue;
      const step = (dx && dy ? diag : ortho) * (1 + (nearWall[m] ? pen : 0));
      const nd = d + step;
      if (nd < pot[m]) { pot[m] = nd; next[m] = n; linkOut[m] = -1; heap.push(nd, m); }
    }
    const inc = incoming.get(n);
    if (inc) for (const e of inc) {
      if (!walk[e.fromNode]) continue;
      const nd = d + e.cost;
      if (nd < pot[e.fromNode]) { pot[e.fromNode] = nd; next[e.fromNode] = n; linkOut[e.fromNode] = e.index; heap.push(nd, e.fromNode); }
    }
  }
  return { pot, next, linkOut };
}
