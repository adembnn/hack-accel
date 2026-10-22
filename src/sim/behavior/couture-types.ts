// Copie de la couture du lot decideurs (#10), lot/decideurs src/agents/types.ts @ 60fb9d1 ; ne pas diverger, signaler tout
// changement sur #10. Seuls les types et constantes dont la simulation a besoin sont recopiés, à l'identique.
// Le champ `consignes_par_zone` (porte + clarté de 0 à 1), que nous avions demandé à #10, est déjà dans leur Plan à 60fb9d1 :
// aucune extension locale n'est nécessaire. Noms de zones : `niveau_<n>` ou `salle_<kk>` (GLOSSARY.md).

export type Mode = 'rester_ouvert' | 'fermer_par_etapes' | 'fermer';

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
  // Consigne structurée par zone (couture avec foule-decision) : la porte indiquée et la clarté du message, de 0 à 1.
  // Absence d'entrée = pas de consigne pour la zone. Zone de la forme niveau_<n> ou salle_<kk> ; le texte reste dans messages_par_zone.
  consignes_par_zone?: Record<string, { porte: string; clarte: number }>;
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
  // Proxy de pression de foule inspiré de Helbing (densité × variance de vitesse) fourni par le simulateur de test : ce n'est PAS une mesure.
  pression_max?: number;
}

export interface Simulateur {
  grille(): Grille;
  initialiser(scenario: Scenario): void;
  // Joue `minutes` minutes simulées avec ce plan, renvoie l'état résumé en fin de pas.
  avancer(plan: Plan, minutes: number): EtatResume;
  etat(): EtatResume;
}
