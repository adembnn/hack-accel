// Décideur par règles déterministes : le secours quand il n'y a pas de clé, pas d'autorisation, un timeout ou une réponse refusée.
// Mêmes entrées, mêmes sorties, sans appel réseau. Seuils d'alerte de CLAUDE.md : orange 3 pers./m², rouge 4 pers./m².
import { resoudreRole } from './roles.ts';
import type { Action, AgentEntree, Decision, Lot, RoleDef } from './types.ts';
import { ciblesConnues } from './valider.ts';

export const SEUIL_ORANGE = 3;
export const SEUIL_ROUGE = 4;

const ETATS_OUVERTS = new Set(['ouverte', 'ouvert']);
const ETATS_FERMES = new Set(['fermee', 'fermée', 'ferme', 'fermé']);

function decision(a: AgentEntree, action: Action, cible: string | null, message: string | null, raison: string): Decision {
  return { id: a.id, action, cible, message, raison };
}

/** Issue ouverte et sûre la moins chargée (égalité : ordre alphabétique de l'identifiant). */
function meilleureIssue(a: AgentEntree): string | null {
  const issues = (a.perception.issues ?? []).filter((i) => ETATS_OUVERTS.has(i.etat) && i.sure !== false);
  issues.sort((x, y) => (x.charge ?? 0) - (y.charge ?? 0) || x.id.localeCompare(y.id));
  return issues[0]?.id ?? null;
}

function issueFermeeSure(a: AgentEntree): string | null {
  const f = (a.perception.issues ?? []).filter((i) => ETATS_FERMES.has(i.etat) && i.sure !== false).sort((x, y) => x.id.localeCompare(y.id));
  return f[0]?.id ?? null;
}

function peut(role: RoleDef, action: Action): boolean {
  return role.actions.includes(action);
}

/** Décision d'un personnage par les règles de son rôle. Toujours valide : action permise au rôle, cible connue. */
export function decideParRegles(a: AgentEntree): Decision {
  const role = resoudreRole(a.role);
  const p = a.perception ?? {};
  const connues = ciblesConnues(a);
  const densite = typeof p.densite === 'number' && Number.isFinite(p.densite) ? p.densite : 0;
  const meilleure = meilleureIssue(a);

  // 1. L'ordre du PC passe avant tout, s'il est dans les droits du rôle et vise une cible connue.
  const c = p.consigne_pc;
  if (c && typeof c.action === 'string' && peut(role, c.action as Action)) {
    const cible = typeof c.cible === 'string' && connues.has(c.cible) ? c.cible : null;
    const besoin = ['deplacer', 'guider', 'bloquer', 'ouvrir'].includes(c.action);
    if (!besoin || cible) {
      const msg = c.action === 'crier' ? (typeof c.message === 'string' && c.message.trim() ? c.message : 'Suivez les consignes du personnel, avancez calmement.') : null;
      return decision(a, c.action as Action, c.action === 'attendre' || c.action === 'appeler_pc' ? null : cible, msg, 'Exécute la consigne reçue du PC sécurité.');
    }
  }

  // 2. Danger visible : on le signale, et on barre l'accès si le rôle le permet.
  if (typeof p.danger === 'string' && p.danger) {
    if (peut(role, 'bloquer') && connues.has(p.danger)) return decision(a, 'bloquer', p.danger, null, `Danger visible (${p.danger}) : barre l'accès et protège la foule.`);
    if (peut(role, 'appeler_pc')) return decision(a, 'appeler_pc', null, null, `Danger visible (${p.danger}) : prévient le PC sécurité.`);
  }

  // 3. Blessés : les secouristes restent, les autres préviennent.
  if ((p.blesses ?? 0) > 0 && peut(role, 'appeler_pc')) return decision(a, 'appeler_pc', null, null, `${p.blesses} personne(s) blessée(s) à signaler au PC.`);

  switch (role.famille) {
    case 'pc': {
      const f = issueFermeeSure(a);
      return f && peut(role, 'ouvrir') && densite >= SEUIL_ORANGE
        ? decision(a, 'ouvrir', f, null, 'Zone chargée et issue fermée sans danger : déverrouille depuis le PC.')
        : cri(a, role, densite, meilleure) ?? decision(a, 'attendre', null, null, 'Rien à signaler au PC.');
    }
    case 'directeur':
      return cri(a, role, densite, meilleure) ?? decision(a, 'attendre', null, null, 'Situation tenue par le dispositif en place.');
    case 'individu':
      return individu(a, role, densite, meilleure);
    default:
      return agentTerrain(a, role, densite, meilleure);
  }
}

function cri(a: AgentEntree, role: RoleDef, densite: number, issue: string | null): Decision | null {
  if (!peut(role, 'crier') || densite < SEUIL_ORANGE) return null;
  const rouge = densite >= SEUIL_ROUGE;
  return decision(a, 'crier', issue,
    issue ? `Ne poussez pas, avancez calmement vers ${issue}.` : 'Ne poussez pas, restez calmes et suivez le personnel.',
    `Densité ${densite.toFixed(1)} pers./m² (${rouge ? 'rouge' : 'orange'}) : consigne de calme${issue ? ` vers l'issue la moins chargée` : ''}.`);
}

function agentTerrain(a: AgentEntree, role: RoleDef, densite: number, issue: string | null): Decision {
  if (densite >= SEUIL_ROUGE && issue && peut(role, 'guider')) {
    return decision(a, 'guider', issue, null, `Densité ${densite.toFixed(1)} pers./m² (rouge) : détourne le flux vers ${issue}, la moins chargée.`);
  }
  const c = cri(a, role, densite, issue);
  if (c) return c;
  if (a.perception.alarme && issue && peut(role, 'guider')) return decision(a, 'guider', issue, null, `Alarme en cours : oriente le public vers ${issue}.`);
  if (a.perception.alarme && peut(role, 'appeler_pc')) return decision(a, 'appeler_pc', null, null, 'Alarme en cours : se met en liaison avec le PC.');
  return decision(a, 'attendre', null, null, 'Situation calme à son poste.');
}

function individu(a: AgentEntree, role: RoleDef, densite: number, issue: string | null): Decision {
  if ((densite >= SEUIL_ORANGE || a.perception.alarme) && issue && peut(role, 'deplacer')) {
    return decision(a, 'deplacer', issue, null, `Cherche à sortir par ${issue}, l'issue la moins chargée qu'il connaît.`);
  }
  return decision(a, 'attendre', null, null, 'Ne voit aucune raison de bouger.');
}

/** Décide un lot entier, dans l'ordre reçu. */
export function decideLotParRegles(lot: Lot): Decision[] {
  return lot.agents.map(decideParRegles);
}
