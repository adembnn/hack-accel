// Interface abstraite de la grille de navigation (couture avec le lot jumeau-3d).
// Cellules praticables de 0,5 m, un tableau par niveau, liens verticaux, portes avec largeur et état.

export interface Cell {
  level: number;
  x: number;
  y: number;
}

export type LinkKind = 'stairs' | 'escalator' | 'elevator';

/** Lien vertical orienté (un sens). Un escalier à double sens = deux liens. */
export interface VerticalLink {
  id: string;
  kind: LinkKind;
  from: Cell;
  to: Cell;
  /** Longueur parcourue en mètres (pente comprise). */
  length: number;
  /** Vitesse de transport en m/s (escalator en marche, ascenseur). */
  speed: number;
  /** Débit maximal en personnes par seconde. */
  capacity: number;
  /** Escalator en marche ? (faux = arrêté, il se parcourt alors comme un escalier). Ignoré hors escalator. */
  running?: boolean;
  /** Faux = lien hors service (exclu du calcul d'itinéraire). */
  enabled?: boolean;
}

export interface Door {
  id: string;
  level: number;
  /** Cellules occupées par le vantail (praticables seulement si la porte est ouverte). */
  cells: { x: number; y: number }[];
  /** Largeur libre en mètres. */
  width: number;
  open: boolean;
}

export interface NavGrid {
  /** Côté d'une cellule en mètres (0,5). */
  readonly cellSize: number;
  readonly width: number;
  readonly height: number;
  readonly levels: number;
  /** Cellule praticable, état des portes compris. */
  isWalkable(level: number, x: number, y: number): boolean;
  readonly doors: readonly Door[];
  readonly links: readonly VerticalLink[];
  /** Cellules de sortie du bâtiment : une personne qui y arrive est sortie. */
  readonly exits: readonly Cell[];
}
