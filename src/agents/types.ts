// Types communs du lot « decideurs ». TypeScript pur, sans dépendance (Node 24 supprime les types à l'exécution :
// pas d'enum, pas de propriété de paramètre de constructeur, imports de types avec `import type`).
// Hypothèses marquées (H) = valeurs non publiques, à confirmer ; voir reports/contraintes-forum-des-halles.md §7.

// Les quatre décideurs qui jouent à chaque minute (instantané-3 §9) ; UGC et BSPP complètent les six acteurs du catalogue.
export type DecideurJeu = 'prefecture' | 'ratp' | 'securite_centre' | 'directeur';
export type Decideur = DecideurJeu | 'ugc' | 'bspp';
export const ACTEURS_CATALOGUE: readonly Decideur[] = ['prefecture', 'ratp', 'securite_centre', 'directeur', 'ugc', 'bspp'];
export const DECIDEURS: readonly DecideurJeu[] = ['prefecture', 'ratp', 'securite_centre', 'directeur'];
// Ordre de jeu à chaque minute : les meneurs (préfecture, RATP) s'engagent, le directeur répond (rapport instantané-3 §3, Stackelberg).
export const ORDRE_DE_JEU: readonly DecideurJeu[] = ['prefecture', 'ratp', 'securite_centre', 'directeur'];

export type Mode = 'rester_ouvert' | 'fermer_par_etapes' | 'fermer';
export const MODES: readonly Mode[] = ['rester_ouvert', 'fermer_par_etapes', 'fermer'];

// Portes publiques du Forum : 9 portes + Canopée + parking (reports/contraintes §2, source Westfield / Bonjour RATP).
export const PORTES: readonly string[] = [
  'lescot', 'berger', 'rambuteau', 'pont_neuf', 'saint_eustache', 'jour', 'louvre',
  'marguerite_de_navarre', 'canopee', 'parking_turbigo',
];
// Portes qui donnent vers le périmètre de couvre-feu (rues Berger et Rambuteau, contraintes §3 et §8 point 3).
export const PORTES_VERS_PERIMETRE: readonly string[] = ['berger', 'rambuteau'];
export const NIVEAUX: readonly string[] = ['0', '-1', '-2', '-3', '-4'];

export type EtatPorte = 'ouverte' | 'fermee';

export interface Plan {
  mode: Mode;
  portes: Record<string, EtatPorte>;
  // Sorties de salles par vagues : la salle (ex. « ugc_07 », « niveau_-2 ») part à `minute_depart` (minute du jour, 1160 = 19 h 20).
  phasage_salles: { salle: string; minute_depart: number }[];
  // Agents de guidage placés à un point (porte, escalier, ascenseur).
  guidage: { point: string; agents: number }[];
  // Texte de l'annonce par zone. Jamais « alarme générale » (contraintes §1).
  messages_par_zone: Record<string, string>;
  // Confinement : garder les gens à l'intérieur dans ces zones.
  confinement: { actif: boolean; zones: string[] };
}

export interface Scenario {
  graine: number;
  minute_annonce: number;           // 1160 = 19 h 20 (BFM, HuffPost)
  stations_fermees_minute: number;  // 1320 = 22 h (Le Parisien)
  couvre_feu_debut_minute: number;  // 1380 = 23 h
  effectif_securite: number;        // P : paramètre à saisir, jamais présenté comme un fait
  population: Record<string, number>; // personnes par zone au départ (H : plage à saisir)
}

export function planInitial(): Plan {
  const portes: Record<string, EtatPorte> = {};
  for (const p of PORTES) portes[p] = 'ouverte';
  return { mode: 'rester_ouvert', portes, phasage_salles: [], guidage: [], messages_par_zone: {}, confinement: { actif: false, zones: [] } };
}

// --- Interfaces injectées (le vrai simulateur vient des lots #8 / #9) ---

export interface Grille {
  niveaux: string[];
  portes: string[];
  zones: string[];
  // Densité maximale tolérée avant « alerte rouge » (pers./m², H : criteres-jugement-crise §2).
  seuil_densite: number;
}

export interface EtatZone { personnes: number; densite: number }

export interface EtatResume {
  minute: number;
  dans_le_centre: number;
  sortis: number;
  sortis_vers_zone_danger: number;
  densite_max: number;
  par_zone: Record<string, EtatZone>;
  debit_portes: Record<string, number>;
  // Pression de foule de Helbing (densité × variance de vitesse), fournie par le simulateur quand il la calcule.
  pression_max?: number;
}

export interface Simulateur {
  grille(): Grille;
  initialiser(scenario: Scenario): void;
  // Joue `minutes` minutes simulées avec ce plan, renvoie l'état résumé en fin de pas.
  avancer(plan: Plan, minutes: number): EtatResume;
  etat(): EtatResume;
}

// Note d'un état, ordre de grille décidé par Adem (#15) : non-sortis, puis zone de danger, puis écrasement.
export interface Note {
  minute: number;
  ligne_rouge: boolean;
  non_sortis: number;
  sortis_vers_zone_danger: number;
  densite_max: number;
  // Écrasement (décision d'Adem, #15) : personnes-minutes cumulées au-dessus de 5 pers./m², sans durée minimale.
  ecrasement_personnes_minutes: number;
  pression_max?: number;
}

export interface Action { decideur: Decideur; levier: string; valeur: unknown }

export interface EntreeTableau {
  minute: number;
  decideur: Decideur;
  actions_acceptees: Action[];
  actions_refusees: { action: Action; raisons: string[] }[];
  // Ids des leçons du REX montrées au décideur et citées par sa décision.
  lecons_utilisees?: string[];
}

export interface EntreeJournal {
  minute: number;
  plan: Plan;
  etat: EtatResume;
  note: Note;
  hors_plan: Record<string, unknown>;
  // Événements de la minute : perturbations reçues (événement `contrainte`) et conflits déclenchés.
  evenements?: { contraintes: unknown[]; conflits: unknown[] };
  // Agrégats calculés par le code, pour que tout nombre d'un texte se retrouve littéralement dans le journal.
  synthese: { portes_fermees: number; portes_ouvertes: number; agents_places: number; agents_par_zone: Record<string, number> };
  decisions: EntreeTableau[];
}

export interface Journal {
  scenario: Scenario;
  entrees: EntreeJournal[];
}

// Stockage du tableau commun. En mémoire ici ; le lot aiven fournira l'implémentation PostgreSQL.
export interface StockageTableau {
  ajouter(entree: EntreeTableau): Promise<void>;
  lister(filtre?: { minute?: number; decideur?: Decideur }): Promise<EntreeTableau[]>;
}
