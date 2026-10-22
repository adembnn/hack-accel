// Modèles interrogés via OpenRouter. Identifiants vérifiés le 22 oct. 2026 par `GET https://openrouter.ai/api/v1/models`
// (route gratuite, sans clé) ; prix en dollars par million de jetons, tels que listés ce jour-là.
// Mélange voulu : trois familles (chinoise, américaine, européenne), grands et petits modèles.
export type Origine = 'chinois' | 'americain' | 'europeen';
export type Taille = 'grand' | 'petit';

export interface Modele {
  id: string;
  origine: Origine;
  taille: Taille;
  /** Prix en $ par million de jetons envoyés / produits (liste OpenRouter, 22 oct. 2026). */
  prix_entree: number;
  prix_sortie: number;
  /** Modèle capable de « réfléchir » avant de répondre : on le coupe, sinon les 150 jetons de réponse sont mangés. */
  raisonnement?: boolean;
}

export const DATE_VERIFICATION = '2026-10-22';

export const MODELES: readonly Modele[] = [
  { id: 'qwen/qwen3-235b-a22b-2507', origine: 'chinois', taille: 'grand', prix_entree: 0.09, prix_sortie: 0.55 },
  { id: 'deepseek/deepseek-chat-v3.1', origine: 'chinois', taille: 'grand', prix_entree: 0.25, prix_sortie: 0.95, raisonnement: true },
  { id: 'moonshotai/kimi-k2-0905', origine: 'chinois', taille: 'grand', prix_entree: 0.6, prix_sortie: 2.5 },
  { id: 'z-ai/glm-4.5-air', origine: 'chinois', taille: 'petit', prix_entree: 0.13, prix_sortie: 0.85, raisonnement: true },
  { id: 'meta-llama/llama-3.3-70b-instruct', origine: 'americain', taille: 'grand', prix_entree: 0.1, prix_sortie: 0.32 },
  { id: 'anthropic/claude-haiku-5.5', origine: 'americain', taille: 'grand', prix_entree: 0.1, prix_sortie: 0.5, raisonnement: true },
  { id: 'openai/gpt-4o-mini', origine: 'americain', taille: 'petit', prix_entree: 0.15, prix_sortie: 0.6 },
  { id: 'google/gemini-2.5-flash-lite', origine: 'americain', taille: 'petit', prix_entree: 0.1, prix_sortie: 0.4 },
  { id: 'mistralai/mistral-large-2512', origine: 'europeen', taille: 'grand', prix_entree: 0.5, prix_sortie: 1.5 },
  { id: 'mistralai/mistral-small-3.2-24b-instruct', origine: 'europeen', taille: 'petit', prix_entree: 0.094, prix_sortie: 0.25 },
];

export function modele(id: string): Modele | undefined {
  return MODELES.find((m) => m.id === id);
}
