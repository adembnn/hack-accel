// Petites grilles de test qui implémentent NavGrid (le vrai produit viendra du lot jumeau-3d).
import type { Cell, Door, NavGrid, VerticalLink } from './navgrid.ts';

export class TestGrid implements NavGrid {
  readonly cellSize = 0.5;
  readonly width: number;
  readonly height: number;
  readonly levels: number;
  readonly doors: Door[] = [];
  readonly links: VerticalLink[] = [];
  readonly exits: Cell[] = [];
  private base: Uint8Array[];

  constructor(width: number, height: number, levels: number) {
    this.width = width;
    this.height = height;
    this.levels = levels;
    this.base = [];
    for (let l = 0; l < levels; l++) this.base.push(new Uint8Array(width * height));
  }

  isWalkable(level: number, x: number, y: number): boolean {
    if (level < 0 || level >= this.levels || x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    if (!this.base[level][y * this.width + x]) return false;
    return !this.closedDoorAt(level, x, y);
  }

  private closedDoorAt(level: number, x: number, y: number): boolean {
    for (const d of this.doors) {
      if (d.open || d.level !== level) continue;
      for (const c of d.cells) if (c.x === x && c.y === y) return true;
    }
    return false;
  }

  fill(level: number, x0: number, y0: number, x1: number, y1: number, v: number): void {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.base[level][y * this.width + x] = v;
  }

  addDoor(id: string, level: number, x: number, y0: number, y1: number, open = true): Door {
    this.fill(level, x, y0, x, y1, 1);
    const cells: { x: number; y: number }[] = [];
    for (let y = y0; y <= y1; y++) cells.push({ x, y });
    const d: Door = { id, level, cells, width: cells.length * this.cellSize, open };
    this.doors.push(d);
    return d;
  }
}

/** Une salle, un mur, une porte de largeur donnée, une zone extérieure avec sorties (essai de débit de porte). */
export function buildDoorRoom(doorWidthM: number): TestGrid {
  const W = 40, H = 20;
  const g = new TestGrid(W, H, 1);
  g.fill(0, 1, 1, 23, H - 2, 1); // salle 11,5 x 9 m
  g.fill(0, 25, 1, W - 1, H - 2, 1); // extérieur
  const n = Math.round(doorWidthM / 0.5);
  const y0 = Math.floor((H - n) / 2);
  g.addDoor('porte', 0, 24, y0, y0 + n - 1);
  for (let y = 1; y <= H - 2; y++) g.exits.push({ level: 0, x: W - 2, y });
  return g;
}

export interface BuildingOpts {
  width?: number; // cellules
  height?: number;
  doors?: number; // portes dans la cloison du niveau 0
  doorWidthCells?: number;
  escalators?: number;
  stairs?: number;
}

/**
 * Bâtiment à 2 niveaux. Niveau 1 : grande salle avec escalators (descente) et escaliers.
 * Niveau 0 : salle, cloison à x = largeur/2 percée de portes, sorties à l'est. Un ascenseur relie les niveaux.
 */
export function buildTestBuilding(o: BuildingOpts = {}): TestGrid {
  const W = o.width ?? 80, H = o.height ?? 50;
  const nDoors = o.doors ?? 2, dw = o.doorWidthCells ?? 4;
  const nEsc = o.escalators ?? 1, nSt = o.stairs ?? 1;
  const g = new TestGrid(W, H, 2);
  g.fill(1, 1, 1, W - 2, H - 2, 1);
  g.fill(0, 1, 1, W - 2, H - 2, 1);
  const wall = Math.floor(W / 2);
  g.fill(0, wall, 1, wall, H - 2, 0);
  const pitch = Math.floor((H - 2) / nDoors);
  for (let i = 0; i < nDoors; i++) {
    const yc = 1 + i * pitch + Math.floor(pitch / 2);
    g.addDoor('porte' + i, 0, wall, yc - Math.floor(dw / 2), yc - Math.floor(dw / 2) + dw - 1);
  }
  for (let y = 1; y <= H - 2; y++) g.exits.push({ level: 0, x: W - 2, y });
  const lw = 4; // largeur d'un lien en cellules (2 m)
  const lx = 6;
  let idx = 0;
  const placeLink = (kind: 'escalator' | 'stairs', n: number, cap: number, speed: number, len: number): void => {
    for (let i = 0; i < n; i++) {
      const yc = 4 + Math.floor((idx++ * (H - 8)) / Math.max(1, nEsc + nSt));
      for (let k = 0; k < lw; k++) {
        const y = Math.min(H - 3, yc + k);
        g.links.push({
          id: `${kind}${i}_${k}`, kind, from: { level: 1, x: lx, y }, to: { level: 0, x: lx, y },
          length: len, speed, capacity: cap / lw, running: kind === 'escalator' ? true : undefined,
        });
      }
    }
  };
  placeLink('escalator', nEsc, 1.3, 0.5, 7); // ~1,3 pers/s pour 2 m de large (valeur de démonstration)
  placeLink('stairs', nSt, 1.6, 0.6, 7);
  g.links.push({ id: 'ascenseur', kind: 'elevator', from: { level: 1, x: W - 6, y: 4 }, to: { level: 0, x: W - 6, y: 4 }, length: 8, speed: 1.5, capacity: 0.4 });
  return g;
}
