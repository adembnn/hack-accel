// Types communs du lot « événements » (cortège, alertes, plans). TypeScript pur, sans dépendance, sans DOM.
// Repère : mètres, x vers l'est, y vers le sud (même repère que src/scene/contrainte.ts de la branche proto/jumeau-3d).
// Niveau : 0 = rue, -1 à -5 = souterrain. Les types « Contrainte » et « PlanDecideur » ci-dessous sont des COPIES
// structurelles des types de proto/jumeau-3d (src/scene/contrainte.ts) et de lot/decideurs (src/agents/types.ts) :
// tant que ces branches ne sont pas dans main, on évite l'import ; à la fusion, remplacer par `import type`.

export interface Point { x: number; y: number }
export interface Position extends Point { niveau: number }

export type TypeContrainte = 'porte' | 'sortie' | 'bouche_metro' | 'escalier' | 'escalator' | 'ascenseur' | 'barrage';
export type EtatContrainte = 'ouverte' | 'fermee' | 'bloquee';
export interface Contrainte {
  id: string;
  type: TypeContrainte;
  niveau: number;
  x: number;
  y: number;
  largeur_m: number;
  etat: EtatContrainte;
}

export type ModePlan = 'rester_ouvert' | 'fermer_par_etapes' | 'fermer';
export interface PlanDecideur {
  mode: ModePlan;
  portes: Record<string, 'ouverte' | 'fermee'>;
  phasage_salles: { salle: string; minute_depart: number }[];
  guidage: { point: string; agents: number }[];
  messages_par_zone: Record<string, string>;
  confinement: { actif: boolean; zones: string[] };
}

/** Graine déterministe : mulberry32. Même graine, même suite. */
export function mulberry32(graine: number): () => number {
  let a = graine | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
