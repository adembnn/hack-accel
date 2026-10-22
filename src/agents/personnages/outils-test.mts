// Aides communes aux tests du lot personnages (pas un test lui-même).
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
import { ROLES } from './roles.ts';
import type { AgentEntree, Lot } from './types.ts';

export const PERCEPTION_CHARGEE = {
  zone: 'hall-lescot',
  densite: 3.6,
  alarme: true,
  issues: [
    { id: 'porte-lescot', etat: 'ouverte', charge: 3.9 },
    { id: 'porte-berger', etat: 'ouverte', charge: 1.2 },
    { id: 'porte-rambuteau', etat: 'fermee', charge: 0 },
  ],
  zones: [{ id: 'hall-lescot', densite: 3.6 }],
  cibles: ['escalier-nord'],
};

/** n agents, un par rôle dans l'ordre de ROLES (en boucle). */
export function agents(n: number, perception: AgentEntree['perception'] = PERCEPTION_CHARGEE): AgentEntree[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${String(i).padStart(2, '0')}`, role: ROLES[i % ROLES.length].id, perception: structuredClone(perception) }));
}

export function lot(n: number, T = 120, perception?: AgentEntree['perception']): Lot {
  return { T, agents: agents(n, perception) };
}

/** Réponse de l'API Messages avec un tool_use « decider ». */
export function reponseApi(decisions: unknown[], usage = { input_tokens: 900, output_tokens: 300 }): Response {
  return new Response(JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', content: [{ type: 'tool_use', id: 'tu_1', name: 'decider', input: { decisions } }], stop_reason: 'tool_use', usage }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

export const ENV_PAYANT = { ANTHROPIC_API_KEY: 'cle-factice-de-test', MODE_PAYANT: 'oui' };
