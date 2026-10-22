// Jev via la passerelle Vercel AI Gateway (crédits de 120 $ offerts aux participants) et sélecteur de backend.
// Format vérifié le 22 oct. 2026 sur https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe et https://docs.typesafe.ai/api :
//  - POST https://ai-gateway.vercel.sh/typesafe/v1/systemone, en-tête Authorization: Bearer <AI_GATEWAY_API_KEY> ;
//  - corps identique à TypeSafe direct (model, state, questions) ; modèle `typesafe-ai/jev-1.14.0` (préfixe de fournisseur) ;
//  - question oui/non = `noul` (pas `boolean` : `boolean` est le nom de l'autre API HTTP /v1/evaluate, non utilisée ici) ;
//  - réponse : { model, answers: { cle: { type, noul | choice+probabilities+confidence | score+... } }, usage, provider_metadata }.
// Aucun appel réseau n'est fait par ce fichier tant qu'on n'appelle pas envoyer() sur un transport payant autorisé.
import type { Decideur } from './types.ts';
import { DECIDEURS } from './types.ts';
import type { ClientDecision } from './questions.ts';
import {
  ClientJev, MODELE_JEV, TransportEnregistreurJev, TransportHttpJev, TransportRejeuJev, reponsesParRegles,
  type NiveauxEtat, type ReponseSystemOne, type RequeteJev, type TransportJev,
} from './jev.ts';

export const URL_GATEWAY = 'https://ai-gateway.vercel.sh/typesafe/v1/systemone';
export const MODELE_GATEWAY = `typesafe-ai/${MODELE_JEV}`; // typesafe-ai/jev-1.14.0

export class ErreurJevGateway extends Error {
  statut: number | null;
  constructor(message: string, statut: number | null) { super(message); this.statut = statut; }
}

export interface OptionsGateway {
  autorise_payant: boolean;                 // accord explicite d'Adem ; sinon le constructeur refuse
  env?: Record<string, string | undefined>; // défaut : process.env (seule AI_GATEWAY_API_KEY est lue)
  fetchImpl?: typeof fetch;
  timeout_ms?: number;                      // défaut 8000
  plafond_appels?: number;                  // défaut 300
  url?: string;
}

export class TransportJevGateway implements TransportJev {
  #cle: string;
  #fetch: typeof fetch;
  #timeout: number;
  #plafond: number;
  #url: string;
  appels = 0;
  jetons_entree = 0;
  jetons_sortie = 0;
  constructor(o: OptionsGateway) {
    if (!o.autorise_payant) throw new Error('TransportJevGateway : appel payant non autorisé (accord d\'Adem requis)');
    const cle = (o.env ?? process.env).AI_GATEWAY_API_KEY;
    if (!cle) throw new Error('TransportJevGateway : AI_GATEWAY_API_KEY absente de l\'environnement');
    this.#cle = cle;
    this.#fetch = o.fetchImpl ?? fetch;
    this.#timeout = o.timeout_ms ?? 8000;
    this.#plafond = o.plafond_appels ?? 300;
    this.#url = o.url ?? URL_GATEWAY;
  }

  // Corps exact envoyé : seul le nom du modèle change (préfixe typesafe-ai/). Les questions noul restent noul.
  corps(r: RequeteJev): Record<string, unknown> {
    const model = r.model.startsWith('typesafe-ai/') ? r.model : `typesafe-ai/${r.model}`;
    return { model, state: r.state, questions: r.questions };
  }

  async envoyer(r: RequeteJev): Promise<ReponseSystemOne> {
    if (this.appels >= this.#plafond) throw new ErreurJevGateway(`plafond de ${this.#plafond} appels atteint`, null);
    this.appels++;
    let rep: Response;
    try {
      rep = await this.#fetch(this.#url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${this.#cle}` },
        body: JSON.stringify(this.corps(r)),
        signal: AbortSignal.timeout(this.#timeout),
      });
    } catch (e) {
      const nom = (e as Error).name;
      throw new ErreurJevGateway(nom === 'TimeoutError' || nom === 'AbortError' ? `délai de ${this.#timeout} ms dépassé` : `échec réseau : ${(e as Error).message}`, null);
    }
    if (rep.status === 401) throw new ErreurJevGateway('401 : clé AI Gateway refusée', 401);
    if (rep.status === 429) throw new ErreurJevGateway('429 : limite de débit', 429);
    if (!rep.ok) throw new ErreurJevGateway(`la passerelle a répondu ${rep.status}`, rep.status);
    const corps = (await rep.json()) as ReponseSystemOne;
    if (!corps || typeof corps !== 'object' || typeof corps.answers !== 'object') throw new ErreurJevGateway('réponse sans answers', rep.status);
    this.jetons_entree += corps.usage?.input_tokens ?? 0;
    this.jetons_sortie += corps.usage?.output_tokens ?? 0;
    // On ne garde que ce dont le code a besoin (pas provider_metadata) ; le modèle demandé reste celui du cache.
    return { model: r.model, answers: corps.answers, usage: corps.usage };
  }
}

// Transport « règles » : fabrique des réponses au format Jev à partir de l'état en niveaux nommés, sans réseau.
export class TransportRegles implements TransportJev {
  async envoyer(r: RequeteJev): Promise<ReponseSystemOne> {
    return { model: 'regles', answers: reponsesParRegles(r.state as unknown as NiveauxEtat) };
  }
}

export type Backend = 'rules' | 'jev-gateway' | 'jev-direct';

export interface OptionsSelecteur {
  env?: Record<string, string | undefined>; // lit DECIDER_BACKEND (défaut rules)
  autorise_payant?: boolean;                // défaut false : jev-* refuse de démarrer
  cache?: string;                           // fichier de rejeu ; consulté AVANT tout appel payant
  fetchImpl?: typeof fetch;
  effectif_securite?: number;
}

export function backendDepuisEnv(env: Record<string, string | undefined> = process.env): Backend {
  const b = env.DECIDER_BACKEND?.trim() || 'rules';
  if (b !== 'rules' && b !== 'jev-gateway' && b !== 'jev-direct') throw new Error(`DECIDER_BACKEND inconnu : « ${b} » (rules | jev-gateway | jev-direct)`);
  return b;
}

// Quatre clients de décision (un par décideur). rules : aucun réseau. jev-* : cache d'abord, appel payant seulement sur absence,
// et seulement si autorise_payant ; toute erreur (401, 429, délai…) retombe sur les règles dans ClientJev.
export function creerClientsDecision(o: OptionsSelecteur = {}): Record<Decideur, ClientDecision> & { backend: Backend } {
  const env = o.env ?? process.env;
  const backend = backendDepuisEnv(env);
  let transport: TransportJev;
  if (backend === 'rules') transport = new TransportRegles();
  else {
    const payant = backend === 'jev-gateway'
      ? new TransportJevGateway({ autorise_payant: o.autorise_payant === true, env, fetchImpl: o.fetchImpl })
      : new TransportHttpJev({ autorise_payant: o.autorise_payant === true, env, fetchImpl: o.fetchImpl });
    transport = o.cache ? new TransportEnregistreurJev(new TransportRejeuJev(o.cache), payant) : payant;
  }
  const clients = {} as Record<Decideur, ClientDecision>;
  for (const d of DECIDEURS) clients[d] = new ClientJev({ transport, effectif_securite: o.effectif_securite });
  return Object.assign(clients, { backend });
}
