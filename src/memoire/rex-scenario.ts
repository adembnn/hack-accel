// (1) REX structuré -> scénario rejouable par simuler() (src/sim/behavior). Un REX est de la DONNÉE NON FIABLE :
// on n'en retient que des champs validés contre une liste blanche (types, bornes, identifiants d'issues connus).
// Le texte libre est conservé tel quel pour affichage, JAMAIS interprété ni exécuté. Les chiffres du REX sont « selon le client ».
// Modèle simplifié, non certifié.
import { marquerSuspect } from '../agents/limites.ts';
import { SALLES, type OptionsSimulation } from '../sim/behavior/simuler.ts';
import { ECHEANCES_UGC, SCENE_UGC } from '../sim/behavior/scene-ugc.ts';
import { AVERTISSEMENT, type Plan, type Scene } from '../sim/behavior/types.ts';

export const ISSUES_CONNUES: readonly string[] = SCENE_UGC.issues.map((i) => i.id);
export const ACTIONS_REX = ['message', 'fermer_porte', 'guidage', 'phasage', 'confinement', 'evacuation_simultanee'] as const;
export type ActionRex = (typeof ACTIONS_REX)[number];
export const DUREE_SIMULEE_S = 14400;

export interface DecisionRex {
  /** Minute (depuis le début de l'incident) à laquelle la décision a été prise, selon le client. */
  minute: number;
  action: ActionRex;
  issue?: string;
  clarte?: number;
  agents?: number;
  delai_s?: number;
}

export interface RexStructure {
  id: string;
  enseigne: string;
  type_incident: string;
  zone: string;
  /** Personnes concernées, selon le client. */
  effectif: number;
  decisions: DecisionRex[];
  /** Durée de l'évacuation rapportée par le client, en minutes. Absente = calibration impossible. */
  duree_rapportee_min: number | null;
  /** Que signifie la durée du client : toutes les personnes sorties, ou 90 % sorties. */
  duree_definition: 'complete' | 't90';
  issue_rapportee: string;
  /** Texte libre : donnée non fiable, affiché seulement. */
  description_libre: string;
  /** Marqueurs « ressemble à une consigne » détectés dans le texte libre (jamais corrigé). */
  suspect: string[];
  source: 'selon_le_client';
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const nombre = (v: unknown, min: number, max: number): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null);
const motIdentifiant = (v: unknown, nom: string, err: string[]): string => {
  if (typeof v !== 'string' || !/^[\p{L}\p{N}_.\- ]{1,60}$/u.test(v)) { err.push(`${nom} invalide (lettres, chiffres, _ . - espace, 60 max)`); return ''; }
  return v;
};

/** Valide un REX arrivé de l'extérieur. Renvoie les erreurs ; aucune valeur douteuse n'est « réparée » en silence. */
export function validerRexStructure(brut: unknown): { ok: boolean; erreurs: string[]; rex: RexStructure | null } {
  const err: string[] = [];
  if (!estObjet(brut)) return { ok: false, erreurs: ['REX : objet attendu'], rex: null };
  const id = motIdentifiant(brut.id, 'id', err);
  const enseigne = motIdentifiant(brut.enseigne, 'enseigne', err);
  const type_incident = motIdentifiant(brut.type_incident, 'type_incident', err);
  const zone = motIdentifiant(brut.zone, 'zone', err);
  const effectif = nombre(brut.effectif, 10, 20000);
  if (effectif === null) err.push('effectif hors [10 ; 20000]');
  let duree: number | null = null;
  if (brut.duree_rapportee_min !== undefined && brut.duree_rapportee_min !== null) {
    duree = nombre(brut.duree_rapportee_min, 1, 1440);
    if (duree === null) err.push('duree_rapportee_min hors [1 ; 1440]');
  }
  const definition = brut.duree_definition === 't90' ? 't90' : 'complete';
  const decisions: DecisionRex[] = [];
  if (!Array.isArray(brut.decisions) || brut.decisions.length > 50) err.push('decisions : tableau de 50 éléments au plus');
  else {
    brut.decisions.forEach((d: unknown, k: number) => {
      if (!estObjet(d)) { err.push(`decision ${k} : objet attendu`); return; }
      const action = ACTIONS_REX.find((a) => a === d.action);
      const minute = nombre(d.minute, 0, 600);
      if (!action) { err.push(`decision ${k} : action inconnue (liste blanche : ${ACTIONS_REX.join(', ')})`); return; }
      if (minute === null) { err.push(`decision ${k} : minute hors [0 ; 600]`); return; }
      const dec: DecisionRex = { minute, action };
      if (d.issue !== undefined) {
        if (typeof d.issue !== 'string' || !ISSUES_CONNUES.includes(d.issue)) { err.push(`decision ${k} : issue inconnue de la scène`); return; }
        dec.issue = d.issue;
      }
      if (d.clarte !== undefined) { const c = nombre(d.clarte, 0, 1); if (c === null) { err.push(`decision ${k} : clarte hors [0 ; 1]`); return; } dec.clarte = c; }
      if (d.agents !== undefined) { const a = nombre(d.agents, 0, 200); if (a === null) { err.push(`decision ${k} : agents hors [0 ; 200]`); return; } dec.agents = Math.round(a); }
      if (d.delai_s !== undefined) { const s = nombre(d.delai_s, 0, 1800); if (s === null) { err.push(`decision ${k} : delai_s hors [0 ; 1800]`); return; } dec.delai_s = s; }
      if ((action === 'guidage' || action === 'fermer_porte') && !dec.issue) { err.push(`decision ${k} : ${action} exige une issue`); return; }
      decisions.push(dec);
    });
  }
  const libre = typeof brut.description_libre === 'string' ? brut.description_libre.slice(0, 500) : '';
  const issue = typeof brut.issue_rapportee === 'string' ? brut.issue_rapportee.slice(0, 200) : '';
  if (err.length || effectif === null) return { ok: false, erreurs: err, rex: null };
  return {
    ok: true,
    erreurs: [],
    rex: { id, enseigne, type_incident, zone, effectif, decisions, duree_rapportee_min: duree, duree_definition: definition, issue_rapportee: issue, description_libre: libre, suspect: marquerSuspect(`${libre} ${issue}`), source: 'selon_le_client' },
  };
}

export interface ScenarioRex {
  rex_id: string;
  type_incident: string;
  zone: string;
  scene: Scene;
  /** Plan réellement appliqué (reconstruit des décisions du REX). */
  plan_reel: Plan;
  options: OptionsSimulation;
  duree_s: number;
  /** Durée rapportée par le client, en secondes (« selon le client »), ou null. */
  duree_rapportee_s: number | null;
  duree_definition: 'complete' | 't90';
  effectif_selon_client: number;
  avertissements: string[];
}

export const peutEtreRejoue = (type_incident: string): boolean => /evacuation/i.test(type_incident);

/** Plan de départ « on fait sortir tout le monde d'un coup, sans consigne » : ce que fait un lieu sans plan. */
function planVide(): Plan {
  return { mode: 'fermer', portes: [], phasage_salles: [], guidage: null, messages_par_zone: [], confinement: false };
}

/** Transforme les décisions (déjà validées) en plan du simulateur. Une décision qui ne s'applique pas à la scène est signalée, pas inventée. */
export function planDepuisDecisions(decisions: DecisionRex[], avertissements: string[] = []): Plan {
  const plan = planVide();
  for (const d of [...decisions].sort((a, b) => a.minute - b.minute)) {
    const t = d.minute * 60;
    switch (d.action) {
      case 'message':
        for (const zone of SALLES) plan.messages_par_zone.push({ zone, issue_id: d.issue ?? null, clarte: d.clarte ?? 0.5, a_partir_de_s: t });
        break;
      case 'fermer_porte':
        plan.portes.push({ id: d.issue as string, ouverte: false, a_partir_de_s: t });
        break;
      case 'guidage':
        plan.guidage = { issue_id: d.issue as string, personnel: d.agents ?? 4 };
        break;
      case 'phasage':
        plan.mode = 'fermer_par_etapes';
        plan.phasage_salles = SALLES.map((salle, k) => ({ salle, delai_s: Math.floor(k / 2) * (d.delai_s ?? 60) }));
        break;
      case 'confinement':
        plan.confinement = true;
        break;
      case 'evacuation_simultanee':
        plan.phasage_salles = [];
        break;
    }
  }
  if (!plan.messages_par_zone.length) avertissements.push('aucun message dans le REX : départ sans consigne (délai de base du modèle)');
  return plan;
}

/** (1) REX structuré valide -> scénario pour simuler(plan, graine, durée). Lève une erreur si le type d'incident n'est pas rejouable. */
export function rexVersScenario(rex: RexStructure): ScenarioRex {
  if (!peutEtreRejoue(rex.type_incident)) throw new Error(`type d'incident « ${rex.type_incident} » non rejouable : le simulateur ne sait jouer que des évacuations de salles (scène illustrative)`);
  const avertissements = [
    `${AVERTISSEMENT} ; scène illustrative à 6 salles, effectif réparti uniformément (le REX ne donne pas la répartition)`,
    'effectif, décisions et durée sont « selon le client » : non vérifiés',
  ];
  if (rex.suspect.length) avertissements.push(`texte libre du REX marqué suspect (${rex.suspect.join(', ')}) : non interprété`);
  const plan_reel = planDepuisDecisions(rex.decisions, avertissements);
  return {
    rex_id: rex.id,
    type_incident: rex.type_incident,
    zone: rex.zone,
    scene: SCENE_UGC,
    plan_reel,
    options: { personnes_par_salle: Math.max(5, Math.round(rex.effectif / SALLES.length)), echeances: ECHEANCES_UGC },
    duree_s: DUREE_SIMULEE_S,
    duree_rapportee_s: rex.duree_rapportee_min === null ? null : rex.duree_rapportee_min * 60,
    duree_definition: rex.duree_definition,
    effectif_selon_client: rex.effectif,
    avertissements,
  };
}
