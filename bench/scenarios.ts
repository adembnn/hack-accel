// Deux plans comparés par le benchmark. Scène illustrative (src/sim/behavior/scene-ugc.ts), pas un relevé.
import type { Plan } from '../src/sim/behavior/types.ts';
import { SALLES } from '../src/sim/behavior/simuler.ts';

/**
 * AVANT : la consigne du 19 oct. (version de la presse, ticket #16) : évacuation annoncée vers 20 h sans obligation, un seul
 * message flou pour tout le monde (« sortez par où vous êtes entrés »), toutes les salles en même temps, aucune porte gérée
 * (métro et RER ouverts alors qu'ils ferment à ~20 h 07), pas de personnel de guidage.
 */
export const PLAN_AVANT: Plan = {
  mode: 'fermer',
  portes: [],
  phasage_salles: [],
  guidage: null,
  messages_par_zone: SALLES.map((zone) => ({ zone, issue_id: 'principale', clarte: 0.5, a_partir_de_s: 0 })),
  confinement: false,
};

/**
 * APRÈS : plan type « décideurs » : départ par étapes (3 vagues espacées de 60 s), stations et rue barrée fermées dès le
 * début, un message clair par salle vers une issue différente (réparties à peu près selon les débits), 8 agents guident vers
 * la sortie de secours que presque personne ne connaît.
 */
export const PLAN_APRES: Plan = {
  mode: 'fermer_par_etapes',
  portes: [
    { id: 'metro', ouverte: false, a_partir_de_s: 0 },
    { id: 'ferronnerie', ouverte: false, a_partir_de_s: 0 },
  ],
  phasage_salles: SALLES.map((salle, k) => ({ salle, delai_s: Math.floor(k / 2) * 60 })),
  guidage: { issue_id: 'secours', personnel: 8 },
  messages_par_zone: SALLES.map((zone, k) => ({ zone, issue_id: ['principale', 'secours', 'escalators'][k % 3], clarte: 0.9, a_partir_de_s: 0 })),
  confinement: false,
};
