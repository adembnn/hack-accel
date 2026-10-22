// Types communs du lot foule-decision. Modèle simplifié, non certifié.

export type Mode = 'rester_ouvert' | 'fermer_par_etapes' | 'fermer';

/** Une issue du lieu (porte, escalator, accès métro...). */
export interface Issue {
  id: string;
  nom: string;
  /** Distance à parcourir depuis le centre de la salle de départ (m). */
  distance_m: number;
  /** Largeur utile (m) : débit max = 1,3 pers/s par mètre (SFPE, rapport criteres-jugement-crise §1). */
  largeur_m: number;
  /** Surface de la zone d'approche devant l'issue (m²), sert à la densité. */
  surface_approche_m2: number;
  /** Est-ce la porte par laquelle les gens sont entrés (familiarité, Sime 1985) ? */
  porte_entree: boolean;
  /** Visible depuis la salle (signalétique) ? */
  visible: boolean;
  /** Ouverte au départ ? */
  ouverte: boolean;
  /** Ce qu'il y a derrière : 'sur' (0), 'vigilance' (1), 'interdite' (2) ou 'cul_de_sac' (station fermée). */
  derriere: 'sur' | 'vigilance' | 'interdite' | 'cul_de_sac';
  /** Après cet instant, la station derrière devient un cul-de-sac (station fermée). */
  devient_cul_de_sac_a_s?: number;
  /** Groupe de zone pour les messages (ex. 'salle', 'niveau-3'). */
  zone: string;
}

export interface Scene {
  nom: string;
  issues: Issue[];
  /** Surface de la salle de départ (m²). */
  surface_salle_m2: number;
}

/** Plan fourni par le lot decideurs (couture de Titouan, ticket #9). */
export interface Plan {
  mode: Mode;
  /** Portes ouvertes ou fermées à partir de t_s ; omis = état de la scène. */
  portes: { id: string; ouverte: boolean; a_partir_de_s?: number }[];
  /** Phasage : vagues successives (liste d'ids d'issues ou de groupes), départ échelonné en secondes. */
  phasage_salles: { salle: string; delai_s: number }[];
  /** Guidage : issue recommandée par le personnel (agents formés présents), ou aucune. */
  guidage: { issue_id: string; personnel: number } | null;
  /** Messages par zone : la consigne reçue (issue conseillée) et sa clarté de 0 à 1. */
  messages_par_zone: { zone: string; issue_id: string | null; clarte: number; a_partir_de_s: number }[];
  confinement: boolean;
}

export type EtatPersonne = 'attente' | 'marche' | 'file' | 'hesite' | 'dehors';

export interface Personne {
  id: number;
  salle: string;
  groupe: number; // 0 = seul·e
  mobilite_reduite: boolean;
  /** Vitesse libre voulue (m/s). */
  vitesse_m_s: number;
  /** Délai de pré-mouvement tiré (s). */
  delai_s: number;
  /** Sensibilité au suivisme (logit mixte, tirée par personne). */
  suivisme: number;
  /** Familiarité : connaît les issues autres que l'entrée. */
  connait_secours: boolean;
  /** Fait confiance à la consigne. */
  confiance: number;
}

/** Ce que le comportement donne au mouvement, par personne et par pas (couture foule-mouvement). */
export interface Intention {
  id: number;
  sortie_cible: string | null;
  vitesse_voulue_m_s: number;
  groupe: number;
  etat: EtatPersonne;
}

/** Ce que le mouvement rend au comportement, par pas. */
export interface RetourMouvement {
  /** Densité (pers/m²) par zone d'approche d'issue. */
  densite_par_zone: Record<string, number>;
  /** Pression de foule de Helbing (densité x variance des vitesses) par zone. */
  pression_par_zone: Record<string, number>;
  /** Longueur de la file (personnes) par issue. */
  file_par_issue: Record<string, number>;
  /** Personnes qui viennent de sortir à ce pas : id -> issue. */
  sorties: { id: number; issue_id: string }[];
  /** Personnes arrivées devant une issue fermée à ce pas. */
  devant_issue_fermee: number[];
}

/** Interface abstraite : le lot foule-mouvement fournira le vrai. */
export interface Mouvement {
  init(scene: Scene, personnes: Personne[]): void;
  /** Avance de dt_s secondes avec les intentions du comportement et l'état des issues. */
  pas(dt_s: number, t_s: number, intentions: Intention[], ouvertes: Record<string, boolean>): RetourMouvement;
  /** Nombre de personnes pas encore sorties. */
  restantes(): number;
}

/** Résumé par minute simulée (couture de Titouan, ticket #9). */
export interface EtatMinute {
  t_s: number;
  personnes_dehors: number;
  personnes_restantes: number;
  densite_max_par_zone: Record<string, number>;
  sorties_saturees: string[];
  t90_s: number | null;
}

export interface Critere {
  /** Valeur brute. */
  valeur: number;
  /** Note de 0 (très mauvais) à 100 (très bon). */
  note: number;
}

/** Grille de critères (ordre fixé par Adem, #15 : non sortis, zone de danger, écrasement, puis délai et continuité). */
export interface Grille {
  non_sortis_22h: Critere;
  non_sortis_23h: Critere;
  non_sortis_22h_mobilite_reduite: Critere;
  zone_danger: Critere; // personnes-minutes pondérées + culs-de-sac
  ecrasement: Critere; // personnes-minutes au-dessus de 5 pers/m²
  pression_helbing_max: number; // s^-2, repère 0,02
  delai_t90_s: number | null;
  delai_t99_s: number | null;
  continuite: Critere; // part des sortis par une issue vers sûr
  total: number; // note totale 0..100, pondérée dans l'ordre de la grille
  avertissement: string;
}

export interface JournalRun {
  plan: Plan;
  graine: number;
  duree_s: number;
  minutes: EtatMinute[];
  /** Comptes de contrôle du comportement (changements d'avis, hésitations, groupes...). */
  stats: Record<string, number>;
  grille: Grille;
}

export const AVERTISSEMENT = 'modèle simplifié, non certifié';
