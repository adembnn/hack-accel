// Validation d'une décision : la sortie du modèle (ou d'une règle) est une donnée, jamais une instruction.
// Rien de ce qui est écrit dans message ou raison n'est exécuté ni interprété : seuls action et cible, tirées
// de listes fermées, agissent sur la simulation.
import { ACTIONS, type Action, type AgentEntree, type Decision, type RoleDef } from './types.ts';

export const MESSAGE_MAX = 140;
export const RAISON_MAX = 200;

/** Verbes de violence : une consigne qui les contient est refusée (le produit sert la sécurité, jamais l'attaque). */
const CONSIGNE_VIOLENTE = /(attaqu|agress|frapp|tabass|lynch|tuer|tuez|massacr|pietin(e|ez|er)\b|ecrase[zr]\b|foncez sur|eliminez|cassez|chargez (la|les|sur))/;

function sansAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function consigneViolente(texte: string): boolean {
  return CONSIGNE_VIOLENTE.test(sansAccents(texte));
}

/** Texte libre : sans balises ni caractères de contrôle, espaces compactés, tronqué avec « … ». */
export function nettoyerTexte(brut: unknown, max: number): string {
  if (typeof brut !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const propre = brut.replace(/[\u0000-\u001f\u007f<>`]/g, ' ').replace(/\s+/g, ' ').trim();
  return propre.length > max ? `${propre.slice(0, max - 1).trimEnd()}…` : propre;
}

/** Identifiants que ce personnage peut viser : issues, zones et cibles déclarées dans sa perception. */
export function ciblesConnues(agent: AgentEntree): Set<string> {
  const p = agent.perception ?? {};
  const ids = new Set<string>();
  for (const i of p.issues ?? []) if (typeof i?.id === 'string') ids.add(i.id);
  for (const z of p.zones ?? []) if (typeof z?.id === 'string') ids.add(z.id);
  for (const c of p.cibles ?? []) if (typeof c === 'string') ids.add(c);
  if (typeof p.danger === 'string') ids.add(p.danger);
  return ids;
}

export type Verdict = { ok: true; decision: Decision } | { ok: false; motif: string };

const NECESSITE_CIBLE: ReadonlySet<Action> = new Set(['deplacer', 'guider', 'bloquer', 'ouvrir']);
const SANS_CIBLE: ReadonlySet<Action> = new Set(['appeler_pc', 'attendre']);

export function validerDecision(brute: unknown, agent: AgentEntree, role: RoleDef): Verdict {
  if (typeof brute !== 'object' || brute === null) return { ok: false, motif: 'décision absente' };
  const b = brute as Record<string, unknown>;
  if (b.id !== agent.id) return { ok: false, motif: 'identifiant inattendu' };
  if (typeof b.action !== 'string' || !(ACTIONS as readonly string[]).includes(b.action)) return { ok: false, motif: 'action hors du menu' };
  const action = b.action as Action;
  if (!role.actions.includes(action)) return { ok: false, motif: `action « ${action} » interdite au rôle ${role.id}` };

  const connues = ciblesConnues(agent);
  let cible: string | null = null;
  if (typeof b.cible === 'string' && b.cible !== '') {
    if (!connues.has(b.cible)) return { ok: false, motif: 'cible inconnue de ce personnage' };
    cible = b.cible;
  }
  if (NECESSITE_CIBLE.has(action) && cible === null) return { ok: false, motif: `action « ${action} » sans cible` };
  if (SANS_CIBLE.has(action)) cible = null;

  const message = nettoyerTexte(b.message, MESSAGE_MAX);
  const raison = nettoyerTexte(b.raison, RAISON_MAX);
  if (consigneViolente(message) || consigneViolente(raison)) return { ok: false, motif: 'consigne violente refusée' };
  if (action === 'crier' && message === '') return { ok: false, motif: 'cri sans message' };

  return { ok: true, decision: { id: agent.id, action, cible, message: message === '' ? null : message, raison: raison === '' ? 'Sans raison donnée.' : raison } };
}
