// Format de navgrid.json (produit par build_navgrid.py) : la grille de marche du lieu, un plan par niveau.
// walk / reach : une chaîne base64 par niveau, w*h bits rangés ligne par ligne, bit de poids fort en premier.

export type TypeSortie = 'rue' | 'secours' | 'train';
export type TypeLien = 'escalator' | 'escalier' | 'ascenseur';

/** Case de la grille : [indice de niveau, ligne, colonne]. */
export type Case3 = [number, number, number];

export interface LienGrille {
  k: TypeLien;
  n?: string;
  a: Case3;
  b: Case3;
  /** longueur du trajet vertical, en mètres */
  len: number;
}

export interface SortieGrille {
  n: string;
  type: TypeSortie;
  cell: Case3;
}

export interface NavGrid {
  /** [x min, z min, x max, z max] en mètres */
  bbox: number[];
  /** taille d'une case, en mètres */
  res: number;
  w: number;
  h: number;
  /** altitude de chaque niveau (0 = rue, négatif = sous-sol) */
  levels: number[];
  walk: string[];
  reach: string[];
  links: LienGrille[];
  exits: SortieGrille[];
}

/** Polygones de la scène (SCN.interieur de la maquette) : p = x,z,x,z,... */
export interface ObjetScene {
  n?: string;
  p: number[];
}
export interface Scene {
  interieur: ObjetScene[];
}
