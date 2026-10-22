// Types du module d'envoi des consignes individuelles (lot proto/notifications).
// TypeScript pur, sans dépendance : Node 24 retire les types à l'exécution (pas d'enum, imports de types avec `import type`).
// Principe : une fois que le directeur du lieu a décidé, chaque personne reçoit sur son smartphone la consigne de SA place,
// par un canal privé et sous le libellé « Message du lieu ». On n'imite JAMAIS une alerte d'État (FR-Alert, cell broadcast).

export type Langue = 'fr' | 'en';
export type NomCanal = 'console' | 'telephone-simule' | 'web-push' | 'wallet' | 'sms' | 'agent';
export type NiveauUrgence = 'info' | 'important' | 'urgence';

/** Billet de séance : sert à choisir l'issue (salle, rang, place → issue différente). */
export interface Billet {
  salle: string;
  rang: string;
  place: string;
}

export interface Destinataire {
  id: string;
  billet?: Billet;
  /** Zone du lieu où se trouve la personne (clé de `consignes_par_zone` et de `Sorties.zones`). */
  zone: string;
  /** Niveau du bâtiment (« 0 », « -2 »…), texte. */
  niveau: string;
  /** Personne à mobilité réduite : jamais d'ascenseur en évacuation incendie. */
  pmr: boolean;
  langue: Langue;
  canal_prefere: NomCanal;
}

export interface Consigne {
  /** Identifiant de la porte à rejoindre (« refuge », « personnel » ou « sur_place » quand il n'y a pas de porte). */
  porte: string;
  /** Étapes du chemin, libellés lisibles issus des données du lieu. */
  chemin: string[];
  etape_suivante: string;
  niveau_urgence: NiveauUrgence;
  /** Durée de validité en secondes après `emis_a` (métadonnée, jamais affichée). */
  expire_s: number;
}

export interface Notification {
  /** Déterministe : `<id de décision>:<id destinataire>`. Sert l'idempotence (pas de doublon). */
  id: string;
  destinataire_id: string;
  /** Toujours « Message du lieu » (ou « Message from the venue »). */
  titre: string;
  /** 160 caractères au plus. */
  corps: string;
  consigne: Consigne;
  /** Millisecondes depuis 1970. */
  emis_a: number;
  ack?: boolean;
}

// --- Entrées venant des décideurs et du lieu ---

export type ActionDecision = 'evacuer' | 'confiner' | 'informer';
export type ContexteIncident = 'incendie' | 'securite' | 'autre';
export type Clarte = 'claire' | 'encombree' | 'bloquee';

/**
 * Forme minimale de la décision, compatible avec le `Plan` du lot décideurs (portes, messages_par_zone, confinement)
 * plus les champs que ce module lit en plus : action, contexte, consignes_par_zone, ascenseurs_interdits.
 */
export interface Decision {
  id?: string;
  action: ActionDecision;
  /** Défaut : 'autre'. 'incendie' interdit l'ascenseur et le confinement. */
  contexte?: ContexteIncident;
  portes?: Record<string, 'ouverte' | 'fermee'>;
  consignes_par_zone?: Record<string, { porte: string; clarte?: Clarte }>;
  messages_par_zone?: Record<string, string>;
  confinement?: { actif: boolean; zones: string[] };
  /** Défaut : vrai en incendie. */
  ascenseurs_interdits?: boolean;
  /** Sorties de salles par vagues (minute du jour de départ), comme dans le Plan des décideurs. */
  phasage_salles?: { salle: string; minute_depart: number }[];
  /** Agents de guidage demandés par point (porte, escalier). */
  guidage?: { point: string; agents: number }[];
  /** Minute du jour de la décision (heure d'effet des missions sans phasage). */
  minute?: number;
}

export interface IssueSalle {
  porte: string;
  chemin?: string[];
  /** Plage de rangs (numériques) servis par cette issue, bornes incluses. Sans plage : toute la salle. */
  rangs?: [number, number];
  /** Plage de places (numériques) servies par cette issue, bornes incluses. */
  places?: [number, number];
}

export interface SalleSortie {
  zone: string;
  issues: IssueSalle[];
}

export interface ZoneSortie {
  /** Portes possibles, par ordre de préférence. */
  portes: string[];
  chemins?: Record<string, string[]>;
  /** Refuge pour les personnes à mobilité réduite (libellé), sinon l'aide du personnel. */
  refuge?: string;
  ascenseur?: boolean;
}

/** Affectation salle/zone → porte, venant des données du lieu. */
export interface Sorties {
  portes: string[];
  salles: Record<string, SalleSortie>;
  zones: Record<string, ZoneSortie>;
  /** Libellés d'affichage des portes, des salles (« Lescot », « 7 »). Défaut : l'identifiant mis en forme. */
  libelles?: Record<string, string>;
  /** Postes à tenir pour guider et séparer les flux (portes, têtes d'escalier, croisements saturés). */
  postes_critiques?: PosteCritique[];
}

export interface PosteCritique {
  id: string;
  type: 'porte' | 'escalier' | 'croisement';
  niveau: string;
  zone: string;
  porte?: string;
}

export interface OptionsPreparation {
  maintenant?: () => number;
  expire_s?: number;
}

// --- Canaux et résultat d'envoi ---

export interface ResultatEnvoi {
  ok: boolean;
  /** Vrai quand le canal confirme la remise (sinon l'accusé de réception tranche). */
  remis?: boolean;
  erreur?: string;
  detail?: string;
}

export interface Canal {
  nom: NomCanal;
  envoyer(notification: Notification, destinataire: Destinataire): Promise<ResultatEnvoi>;
}

// --- Personnel (canal principal) : agents de sécurité, SSIAP, chefs de salle, secours ---

export type RoleAgent = 'pc' | 'chef_securite' | 'ssiap' | 'agent_porte' | 'agent_escalier' | 'agent_salle' | 'pompier' | 'ratp' | 'police';
export type Equipement = 'telephone' | 'oreillette' | 'talkie';

export interface Poste {
  niveau: string;
  zone?: string;
  porte?: string;
  /** Salle tenue (agent_salle). */
  salle?: string;
}

export interface Agent {
  id: string;
  role: RoleAgent;
  poste: Poste;
  equipement: Equipement;
}

/** Fiche mission : tout ce qu'un agent doit savoir et dire à son poste. */
export interface Mission {
  id: string;
  agent_id: string;
  role: RoleAgent;
  poste: Poste;
  /** 1 = le plus urgent. */
  priorite: 1 | 2 | 3;
  /** Minute du jour à laquelle la mission prend effet. */
  heure_effet_min: number;
  /** Où se tenir. */
  se_tenir: string;
  porte_a_garder?: { porte: string; etat: 'ouverte' | 'fermee' };
  dirige: { zone: string; vers: string }[];
  /** La phrase à dire à la foule au mégaphone, en une ligne (90 caractères au plus). */
  phrase_megaphone: string;
  releve: string;
  /** Identifiants des agents à appeler (PC, chef, SSIAP). */
  appeler: string[];
  role_pmr: string;
  /** Version courte lisible à voix haute (oreillette, talkie). */
  texte_radio: string;
  emis_a: number;
}

export interface Couverture {
  postes_critiques: number;
  tenus: { poste: string; agents: string[] }[];
  vides: { poste: string; zone: string; manquants: number }[];
  /** Agents manquants par zone : postes vides (ou guidage demandé moins agents présents), jamais un chiffre extérieur à l'entrée. */
  manquants_par_zone: Record<string, number>;
  agents_manquants: number;
}
