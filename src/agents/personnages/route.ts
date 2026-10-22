// Handler HTTP sans framework pour POST /api/agents. Le serveur (src/server) le monte : routeAgents(req, res).
// Entrée  : {T, agents:[{id, role, perception}]}
// Sortie  : {decisions:[{id, action, cible, message, raison}]}
// L'origine de la décision (haiku, cache ou regles) et le coût passent par les en-têtes x-cerveau-*, pour ne pas changer le format fixé.
import type { IncomingMessage, ServerResponse } from 'node:http';
// @ts-expect-error TS5097 : Node charge le .ts tel quel (à retirer si tsconfig active allowImportingTsExtensions)
import { creerCerveau, type Cerveau } from './cerveau.ts';
import type { AgentEntree, Lot } from './types.ts';

export const TAILLE_MAX_CORPS = 256 * 1024;
export const AGENTS_MAX = 200;
const PERCEPTION_MAX = 8000;

class ErreurRequete extends Error {
  statut: number;
  constructor(statut: number, message: string) {
    super(message);
    this.statut = statut;
  }
}

async function lireCorps(req: IncomingMessage): Promise<unknown> {
  const dejaLu = (req as IncomingMessage & { body?: unknown }).body;
  if (dejaLu !== undefined && typeof dejaLu === 'object') return dejaLu;
  const morceaux: Buffer[] = [];
  let taille = 0;
  for await (const m of req) {
    const b = typeof m === 'string' ? Buffer.from(m) : (m as Buffer);
    taille += b.length;
    if (taille > TAILLE_MAX_CORPS) throw new ErreurRequete(413, 'Corps de requête trop volumineux.');
    morceaux.push(b);
  }
  try {
    return JSON.parse(Buffer.concat(morceaux).toString('utf8'));
  } catch {
    throw new ErreurRequete(400, 'JSON invalide.');
  }
}

/** Vérifie la forme de la requête ; ne laisse passer que id, role et perception. */
export function lireLot(brut: unknown): Lot {
  if (typeof brut !== 'object' || brut === null) throw new ErreurRequete(400, 'Corps attendu : {T, agents}.');
  const { T, agents } = brut as { T?: unknown; agents?: unknown };
  if (typeof T !== 'number' || !Number.isFinite(T)) throw new ErreurRequete(400, 'T doit être un nombre.');
  if (!Array.isArray(agents) || agents.length === 0) throw new ErreurRequete(400, 'agents doit être une liste non vide.');
  if (agents.length > AGENTS_MAX) throw new ErreurRequete(400, `Au plus ${AGENTS_MAX} agents par requête.`);
  const vus = new Set<string>();
  const propres: AgentEntree[] = agents.map((a: unknown, i) => {
    const o = (a ?? {}) as { id?: unknown; role?: unknown; perception?: unknown };
    if (typeof o.id !== 'string' || o.id === '' || o.id.length > 64) throw new ErreurRequete(400, `agents[${i}].id invalide.`);
    if (typeof o.role !== 'string' || o.role === '' || o.role.length > 64) throw new ErreurRequete(400, `agents[${i}].role invalide.`);
    if (vus.has(o.id)) throw new ErreurRequete(400, `Identifiant en double : ${o.id}.`);
    vus.add(o.id);
    const perception = o.perception ?? {};
    if (typeof perception !== 'object' || Array.isArray(perception)) throw new ErreurRequete(400, `agents[${i}].perception doit être un objet.`);
    if (JSON.stringify(perception).length > PERCEPTION_MAX) throw new ErreurRequete(400, `agents[${i}].perception trop volumineuse.`);
    return { id: o.id, role: o.role, perception: perception as AgentEntree['perception'] };
  });
  return { T, agents: propres };
}

function repondre(res: ServerResponse, statut: number, corps: unknown, entetes: Record<string, string> = {}): void {
  const texte = JSON.stringify(corps);
  res.writeHead(statut, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(texte), ...entetes });
  res.end(texte);
}

export function creerRoute(cerveau: Cerveau): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'POST') {
      repondre(res, 405, { erreur: 'Méthode non autorisée : POST attendu.' }, { allow: 'POST' });
      return;
    }
    try {
      const lot = lireLot(await lireCorps(req));
      const r = await cerveau.decider(lot);
      repondre(res, 200, { decisions: r.decisions }, {
        'x-cerveau-source': r.source,
        'x-cerveau-appels': String(r.appels),
        'x-cerveau-jetons': `${r.jetons.entree}/${r.jetons.sortie}`,
      });
    } catch (err) {
      if (err instanceof ErreurRequete) repondre(res, err.statut, { erreur: err.message });
      else repondre(res, 500, { erreur: 'Erreur interne du cerveau.' });
    }
  };
}

let parDefaut: ((req: IncomingMessage, res: ServerResponse) => Promise<void>) | null = null;

/** Handler prêt à monter : cerveau créé au premier appel, configuré par l'environnement. */
export function routeAgents(req: IncomingMessage, res: ServerResponse): Promise<void> {
  parDefaut ??= creerRoute(creerCerveau({ fichierCache: process.env.CACHE_PERSONNAGES }));
  return parDefaut(req, res);
}
