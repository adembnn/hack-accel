// Raccord avec le moteur de mouvement (#8, SullyBck) : une MotionGrid structurelle construite depuis le Navgrid.
// Choix de raccordement : on garde les dimensions propres à chaque niveau (la rue fait 2 800 x 2 800 cellules, le Forum 1 220 x 1 380) :
// aucun rembourrage, donc aucune grande grille de rue recopiée sur les niveaux souterrains. Les données sont partagées, pas copiées.
// Tout est en mètres, repère de la scène (x vers l'est, z vers le sud), niveaux réels (0, -1 … -5).
import type { Navgrid } from './navgrid.ts';

export interface MotionNiveau {
  niveau: number; // niveau réel
  originX: number; // coin nord-ouest de la cellule (0, 0), en m
  originZ: number;
  width: number;
  height: number;
  /** 1 = praticable ; index = j * width + i. Même tableau que le Navgrid (non copié). */
  walkable: Uint8Array;
}
export interface MotionSortie { id: string; kind: 'rue' | 'secours' | 'metro'; level: number; x: number; z: number; width: number; open: boolean; outsideModel: boolean }
export interface MotionLien { id: string; kind: 'escalier' | 'escalator' | 'ascenseur'; from: { level: number; x: number; z: number }; to: { level: number; x: number; z: number }; width: number; open: boolean; estimated: boolean }
export interface MotionGrid {
  cellSize: number;
  levels: MotionNiveau[];
  exits: MotionSortie[];
  links: MotionLien[];
}

export function versMotionGrid(ng: Navgrid): MotionGrid {
  return {
    cellSize: ng.cellule_m,
    levels: ng.niveaux.map((n) => ({ niveau: n.niveau, originX: n.x0, originZ: n.z0, width: n.largeur, height: n.hauteur, walkable: n.data })),
    exits: ng.sorties.map((s) => ({ id: s.id, kind: s.genre, level: s.niveau, x: s.x, z: s.y, width: s.largeur_m, open: s.etat === 'ouverte', outsideModel: s.hors_modele })),
    links: ng.liens.map((l) => ({
      id: l.id, kind: l.type, from: { level: l.de.niveau, x: l.de.x, z: l.de.y }, to: { level: l.vers.niveau, x: l.vers.x, z: l.vers.y },
      width: l.largeur_m, open: l.etat === 'ouverte', estimated: l.estime,
    })),
  };
}

/** Cellule (i, j) d'un niveau pour un point en mètres, ou null hors de la grille. */
export function cellule(n: MotionNiveau, cellSize: number, x: number, z: number): { i: number; j: number; index: number } | null {
  const i = Math.floor((x - n.originX) / cellSize), j = Math.floor((z - n.originZ) / cellSize);
  return i < 0 || j < 0 || i >= n.width || j >= n.height ? null : { i, j, index: j * n.width + i };
}
