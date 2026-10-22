import type { Case3, LienGrille, NavGrid, Scene, SortieGrille, TypeSortie } from './navgrid';

export interface Groupe {
  n: string;
  type: TypeSortie;
  cells: SortieGrille[];
  open: boolean;
  /** zone de troubles : les gens l'évitent */
  zone: boolean;
  agent?: boolean;
  annonce?: boolean;
  filtre?: boolean;
  nextFree?: number;
}

export interface Lien extends LienGrille {
  open: boolean;
  /** passages par seconde et par sens */
  debit: number;
  /** instant où le lien sera de nouveau libre, par sens [a vers b, b vers a] */
  free: [number, number];
  ia: number;
  ib: number;
}

export interface Trajet {
  li: number;
  t1: number;
  to: Case3;
  from: [number, number, number];
}

export type Profil = 'cine' | 'rer' | 'client';

export interface Personne {
  l: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  kind: Profil;
  /** vitesse de marche voulue */
  v0: number;
  /** délai avant de partir après l'alerte */
  pre: number;
  /** goût du suivisme */
  bh: number;
  /** sortie familière (indice de groupe) */
  fam: number;
  /** sortie visée (indice de groupe, -1 si aucune) */
  t: number;
  next: number;
  hes: number;
  ride: Trajet | null;
  out: boolean;
  dens: number;
  wh?: number;
  stopT?: number;
  /** champs ajoutés par les consommateurs (explorateur) */
  v0b?: number;
  piege?: boolean;
}

export interface Intention {
  /** nom ou indice du groupe de sortie visé */
  sortie_cible?: string | number;
  vitesse_voulue_m_s?: number;
}

export interface Etat {
  T: number;
  out: number;
  outBy: Record<string, number>;
  expo: number;
  dmax: number;
  zoneOut: number;
  /** paires de personnes plus proches que deux rayons de corps (moins 5 mm de tolérance) */
  chevauchements: number;
  /** personnes dont la case n'est pas praticable */
  dansMur: number;
}

export interface Moteur {
  mode: 'calme' | 'evac';
  g: NavGrid;
  N: number;
  L: number;
  walk: Uint8Array;
  reach: Uint8Array;
  groups: Groupe[];
  links: Lien[];
  linkAt: Map<number, number[]>;
  /** cartes de pentes : une par groupe de sortie, N*L flottants (1e9 = inatteignable) */
  F: Float32Array[];
  A: Personne[] | null;
  T: number;
  out: number;
  outBy: Record<string, number>;
  expo: number;
  dmax: number;
  zoneOut: number;
  /** retard d'alerte ajouté au délai de chacun */
  delay: number;
  zoneOn: boolean;
  spawn(n: number, scene: Scene): void;
  alerte(): void;
  pas(dt: number): void;
  /** recalcule la carte de pentes du groupe k (à appeler après avoir ouvert/fermé une sortie ou un lien) */
  champ(k: number): void;
  champs(): void;
  setIntention(id: number, intention: Intention): void;
  etat(): Etat;
}

export interface OptionsMoteur {
  graine: number;
}
