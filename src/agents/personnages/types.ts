// Types partagés du lot personnages (#38) et cerveau (#39).
// Format d'échange fixé par l'orchestrateur : POST /api/agents {T, agents:[{id, role, perception}]}
// -> {decisions:[{id, action, cible, message, raison}]}.

/** Menu fermé des actions : toute autre valeur est refusée. */
export const ACTIONS = ['deplacer', 'guider', 'crier', 'bloquer', 'ouvrir', 'appeler_pc', 'attendre'] as const;
export type Action = (typeof ACTIONS)[number];

export const FAMILLES = ['pc', 'securite', 'pompiers', 'directeur', 'ratp', 'police', 'cinema', 'commerce', 'individu'] as const;
export type Famille = (typeof FAMILLES)[number];

/** Ce qu'un personnage voit autour de lui. Les champs sont optionnels : un personnage ne voit pas tout. */
export interface Perception {
  zone?: string;
  /** Densité locale en personnes par mètre carré. */
  densite?: number;
  alarme?: boolean;
  /** Zone ou objet dangereux visible (colis, fumée, foule agressive), exprimé par son identifiant. */
  danger?: string | null;
  blesses?: number;
  issues?: { id: string; etat: string; charge?: number; sure?: boolean }[];
  zones?: { id: string; densite?: number }[];
  /** Identifiants que ce personnage connaît et peut viser en plus des issues et zones. */
  cibles?: string[];
  /** Ordre reçu du PC sécurité par radio. */
  consigne_pc?: { action: string; cible?: string | null; message?: string | null } | null;
  [autre: string]: unknown;
}

export interface AgentEntree {
  id: string;
  role: string;
  perception: Perception;
}

export interface Lot {
  T: number;
  agents: AgentEntree[];
}

export interface Decision {
  id: string;
  action: Action;
  cible: string | null;
  message: string | null;
  raison: string;
}

export interface RoleDef {
  id: string;
  famille: Famille;
  nom: string;
  description: string;
  /** Champs de Perception que ce personnage voit réellement. */
  voit: (keyof Perception)[];
  actions: Action[];
  limites: string[];
  /** Portée de la voix en mètres, borne l'effet d'un cri dans la simulation. */
  portee_voix_m: number;
  /** Poids de sa consigne sur la foule, de 0 (aucun) à 1 (autorité reconnue). */
  influence: number;
}

export type SourceDecision = 'cache' | 'haiku' | 'regles';

export interface ReponseCerveau {
  decisions: Decision[];
  source: SourceDecision;
  appels: number;
  jetons: { entree: number; sortie: number };
  alertes: string[];
}
