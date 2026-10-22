// Adaptateur 1 : navgrid.json du lot jumeau-3d (RLE, repère mètres, niveaux 0 à -5) -> interface NavGrid du lot foule-mouvement
// (même largeur/hauteur pour tous les niveaux, indices de niveau 0..n-1, cellules entières).
// Écarts assumés (voir LISEZMOI.md) : recadrage sur le Forum ; vitesses et débits des liens = valeurs de démonstration.
import { readFileSync } from 'node:fs';
import { lireNavgrid, type Navgrid, type NiveauGrille } from '../scene/navgrid.ts';
import type { Scene as SceneJumeau } from '../scene/types.ts';
import type { Cell, NavGrid, VerticalLink } from '../sim/motion/navgrid.ts';

/** Recadrage (mètres) : couvre les niveaux souterrains (x -293..72, z -101..340) et les sorties de rue du niveau 0. */
export const CADRE_M = { x0: -360, z0: -285, x1: 260, z1: 345 };
export const NIVEAUX_GRILLE = [0, -1, -2, -3, -4, -5] as const; // indice motion = -niveau

/** Côté de cellule de la grille jumeau-3d (0,5 m). Le moteur de mouvement tourne en 1 m (agrégation 2x2) : son coût par pas dépend de la surface de la grille. */
const CS_SOURCE = 0.5;
export const AGREGATION = 2;
const CS = CS_SOURCE * AGREGATION;

export class GrilleIntegree implements NavGrid {
  readonly cellSize = CS;
  readonly width: number;
  readonly height: number;
  readonly levels = NIVEAUX_GRILLE.length - 1; // niveau -5 abandonné (1 327 m², sans lien vers les sorties)
  readonly doors = [];
  readonly links: VerticalLink[] = [];
  readonly exits: Cell[] = [];
  readonly data: Uint8Array[] = [];
  readonly cadre = CADRE_M;
  /** Écarts mesurés pendant la conversion (affichés dans le rapport). */
  readonly ecarts: Record<string, number | string[]> = {};

  readonly ng: Navgrid;
  constructor(ng: Navgrid) {
    this.ng = ng;
    this.width = Math.round((CADRE_M.x1 - CADRE_M.x0) / CS);
    this.height = Math.round((CADRE_M.z1 - CADRE_M.z0) / CS);
    for (const niv of NIVEAUX_GRILLE.slice(0, this.levels)) {
      const n = ng.niveaux.find((q) => q.niveau === niv);
      const buf = new Uint8Array(this.width * this.height);
      if (n) this.recadrer(n, buf);
      this.data.push(buf);
    }
    this.convertirLiens();
  }

  /** Agrège les cellules de 0,5 m en cellules de 1 m : praticable si au moins 2 sous-cellules sur 4 le sont. */
  private recadrer(n: NiveauGrille, out: Uint8Array): void {
    const di = Math.round((CADRE_M.x0 - n.x0) / CS_SOURCE);
    const dj = Math.round((CADRE_M.z0 - n.z0) / CS_SOURCE);
    const A = AGREGATION;
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      let c = 0;
      for (let b = 0; b < A; b++) for (let a = 0; a < A; a++) {
        const i = x * A + a + di, j = y * A + b + dj;
        if (i >= 0 && j >= 0 && i < n.largeur && j < n.hauteur && n.data[j * n.largeur + i]) c++;
      }
      out[y * this.width + x] = c >= 2 ? 1 : 0;
    }
  }

  isWalkable(level: number, x: number, y: number): boolean {
    if (level < 0 || level >= this.levels || x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.data[level][y * this.width + x] === 1;
  }

  /** Mètres (repère de la scène) -> cellule du cadre. */
  cellule(niveau: number, xm: number, zm: number): Cell {
    return { level: -niveau, x: Math.floor((xm - CADRE_M.x0) / CS), y: Math.floor((zm - CADRE_M.z0) / CS) };
  }
  centre(c: Cell): { xm: number; zm: number } {
    return { xm: CADRE_M.x0 + (c.x + 0.5) * CS, zm: CADRE_M.z0 + (c.y + 0.5) * CS };
  }
  dansCadre(xm: number, zm: number): boolean {
    return xm >= CADRE_M.x0 && xm < CADRE_M.x1 && zm >= CADRE_M.z0 && zm < CADRE_M.z1;
  }

  /** Cellule praticable la plus proche (anneaux croissants, rayon max en cellules), ou null. */
  plusProche(c: Cell, rayon = 12): Cell | null {
    for (let r = 0; r <= rayon; r++) {
      let meilleur: Cell | null = null;
      let dmin = Infinity;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!this.isWalkable(c.level, c.x + dx, c.y + dy)) continue;
        const d = dx * dx + dy * dy;
        if (d < dmin) { dmin = d; meilleur = { level: c.level, x: c.x + dx, y: c.y + dy }; }
      }
      if (meilleur) return meilleur;
    }
    return null;
  }

  private convertirLiens(): void {
    const ignores: string[] = [];
    for (const l of this.ng.liens) {
      if (l.etat !== 'ouverte') { ignores.push(`${l.id} (${l.etat})`); continue; }
      const a0 = this.cellule(l.de.niveau, l.de.x, l.de.y);
      const b0 = this.cellule(l.vers.niveau, l.vers.x, l.vers.y);
      const a = this.plusProche(a0, 10);
      const b = this.plusProche(b0, 10);
      if (!a || !b || a.level === b.level) { ignores.push(`${l.id} (extrémité hors zone praticable ou hors cadre)`); continue; }
      const dh = Math.hypot((a.x - b.x) * CS, (a.y - b.y) * CS);
      const dv = Math.abs(a.level - b.level) * 6; // 6 m d'étage (scene.json : etage)
      const longueur = Math.hypot(dh, dv);
      // Valeurs de DÉMONSTRATION du lot foule-mouvement (non calées) : escalier 0,6 m/s, escalator 0,5 m/s, ascenseur 1 m/s ;
      // débit = 1 pers/s par mètre de largeur (escalier), 0,8 (escalator), 0,3 (ascenseur).
      const kind = l.type === 'escalier' ? 'stairs' : l.type === 'escalator' ? 'escalator' : 'elevator';
      const vitesse = kind === 'stairs' ? 0.6 : kind === 'escalator' ? 0.5 : 1;
      const cap = Math.max(0.3, l.largeur_m * (kind === 'stairs' ? 1 : kind === 'escalator' ? 0.8 : 0.3));
      // Sens inconnus dans scene.json pour la plupart des escalators : on pose les deux sens (écart documenté).
      for (const [from, to, suf] of [[a, b, 'a'], [b, a, 'r']] as [Cell, Cell, string][]) {
        this.links.push({ id: `${l.id}-${suf}`, kind, from, to, length: longueur, speed: vitesse, capacity: cap, running: true });
      }
    }
    this.ecarts.liens_ignores = ignores;
  }
}

export function chargerNavgrid(chemin = new URL('../scene/navgrid.json', import.meta.url)): Navgrid {
  return lireNavgrid(readFileSync(chemin, 'utf8'));
}

export function chargerScene(chemin = new URL('../scene/scene.json', import.meta.url)): SceneJumeau {
  return JSON.parse(readFileSync(chemin, 'utf8')) as SceneJumeau;
}
