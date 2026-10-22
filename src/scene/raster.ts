// Rasterisation sur grille de 0,5 m : polygones, segments épaissis, disques. Valeurs de cellule : 0 bloqué, 1 praticable, 2 praticable estimé.
export const CELLULE_M = 0.5;

export class Grille {
  readonly x0: number;
  readonly z0: number;
  readonly largeur: number;
  readonly hauteur: number;
  data: Uint8Array;
  constructor(x0: number, z0: number, largeur: number, hauteur: number, data?: Uint8Array) {
    this.x0 = x0; this.z0 = z0; this.largeur = largeur; this.hauteur = hauteur;
    this.data = data ?? new Uint8Array(largeur * hauteur);
  }
  static couvrant(xmin: number, zmin: number, xmax: number, zmax: number): Grille {
    return new Grille(xmin, zmin, Math.ceil((xmax - xmin) / CELLULE_M), Math.ceil((zmax - zmin) / CELLULE_M));
  }
  col(x: number): number { return Math.floor((x - this.x0) / CELLULE_M); }
  lig(z: number): number { return Math.floor((z - this.z0) / CELLULE_M); }
  indice(x: number, z: number): number {
    const i = this.col(x), j = this.lig(z);
    return i < 0 || j < 0 || i >= this.largeur || j >= this.hauteur ? -1 : j * this.largeur + i;
  }
  centre(idx: number): [number, number] {
    const i = idx % this.largeur, j = (idx - i) / this.largeur;
    return [this.x0 + (i + 0.5) * CELLULE_M, this.z0 + (j + 0.5) * CELLULE_M];
  }

  /** Remplit un polygone (anneau aplati [x,z,...], règle pair-impair) avec la valeur v. */
  remplir(p: number[], v: number): void {
    const n = p.length / 2;
    if (n < 3) return;
    let zmin = Infinity, zmax = -Infinity;
    for (let k = 0; k < n; k++) { const z = p[2 * k + 1]; if (z < zmin) zmin = z; if (z > zmax) zmax = z; }
    const j0 = Math.max(0, this.lig(zmin)), j1 = Math.min(this.hauteur - 1, this.lig(zmax));
    const xs: number[] = [];
    for (let j = j0; j <= j1; j++) {
      const zc = this.z0 + (j + 0.5) * CELLULE_M;
      xs.length = 0;
      for (let k = 0, m = n - 1; k < n; m = k++) {
        const za = p[2 * k + 1], zb = p[2 * m + 1];
        if ((za > zc) !== (zb > zc)) xs.push(p[2 * k] + ((zc - za) / (zb - za)) * (p[2 * m] - p[2 * k]));
      }
      xs.sort((a, b) => a - b);
      for (let s = 0; s + 1 < xs.length; s += 2) {
        const i0 = Math.max(0, Math.ceil((xs[s] - this.x0) / CELLULE_M - 0.5));
        const i1 = Math.min(this.largeur - 1, Math.floor((xs[s + 1] - this.x0) / CELLULE_M - 0.5));
        for (let i = i0; i <= i1; i++) this.data[j * this.largeur + i] = v;
      }
    }
  }

  /** Pose un disque de rayon r (m) ; si seulementVide, ne touche pas aux cellules déjà praticables. */
  disque(x: number, z: number, r: number, v: number, seulementVide = false): void {
    const i0 = Math.max(0, this.col(x - r)), i1 = Math.min(this.largeur - 1, this.col(x + r));
    const j0 = Math.max(0, this.lig(z - r)), j1 = Math.min(this.hauteur - 1, this.lig(z + r));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const dx = this.x0 + (i + 0.5) * CELLULE_M - x, dz = this.z0 + (j + 0.5) * CELLULE_M - z;
        if (dx * dx + dz * dz <= r * r) {
          const k = j * this.largeur + i;
          if (!(seulementVide && this.data[k] > 0)) this.data[k] = v;
        }
      }
    }
  }

  /** Trace une polyligne [x,z,...] d'épaisseur 2·demi (m). */
  trait(p: number[], demi: number, v: number): void {
    for (let k = 0; k + 3 < p.length; k += 2) {
      const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3];
      const L = Math.hypot(bx - ax, bz - az);
      const pas = Math.max(1, Math.ceil(L / (CELLULE_M * 0.6)));
      for (let s = 0; s <= pas; s++) this.disque(ax + ((bx - ax) * s) / pas, az + ((bz - az) * s) / pas, demi, v);
    }
  }
}
