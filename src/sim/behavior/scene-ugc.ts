// Scène ILLUSTRATIVE pour le prototype : un cinéma de ~3 000 places dans le Forum des Halles, cinq issues.
// Les distances, largeurs et surfaces sont des ordres de grandeur posés pour tester le comportement ; la vraie scène vient du
// lot jumeau-3d (scene.json + navgrid). Aucun de ces chiffres n'est un relevé. Modèle simplifié, non certifié.
import type { Scene } from './types.ts';

export const SCENE_UGC: Scene = {
  nom: 'Cinéma des Halles (scène illustrative)',
  surface_salle_m2: 4000,
  issues: [
    { id: 'principale', nom: 'Hall principal (porte d’entrée)', distance_m: 120, largeur_m: 2.4, surface_approche_m2: 400, porte_entree: true, visible: true, ouverte: true, derriere: 'vigilance', zone: 'niveau-1' },
    { id: 'secours', nom: 'Sortie de secours rue Rambuteau', distance_m: 90, largeur_m: 1.2, surface_approche_m2: 120, porte_entree: false, visible: false, ouverte: true, derriere: 'sur', zone: 'niveau-1' },
    { id: 'escalators', nom: 'Escalators vers la Place Carrée', distance_m: 150, largeur_m: 1.6, surface_approche_m2: 150, porte_entree: false, visible: true, ouverte: true, derriere: 'sur', zone: 'niveau-0' },
    { id: 'metro', nom: 'Accès métro et RER Châtelet', distance_m: 100, largeur_m: 3.0, surface_approche_m2: 500, porte_entree: false, visible: true, ouverte: true, derriere: 'sur', devient_cul_de_sac_a_s: 7 * 60, zone: 'niveau-3' },
    { id: 'ferronnerie', nom: 'Sortie rue de la Ferronnerie (périmètre barré)', distance_m: 140, largeur_m: 1.8, surface_approche_m2: 200, porte_entree: false, visible: false, ouverte: true, derriere: 'interdite', zone: 'niveau-1' },
  ],
};

/** Annonce à T0 = 20 h 00 : métro et RER fermés à 22 h (7 200 s), couvre-feu à 23 h (10 800 s) (ticket #16, version de la presse). */
export const ECHEANCES_UGC = { metro_s: 7200, couvre_feu_s: 10800 };
