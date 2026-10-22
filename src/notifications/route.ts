// Handler HTTP sans framework : routeNotifications(req, res). Le serveur le monte pour les chemins /api/notifier,
// /api/notifications, /api/missions et /api/ack.
//   POST /api/notifier      {decision, population?, agents?, sorties?, dry_run?}  aperçu par défaut (dry_run), envoi seulement si dry_run === false
//   GET  /api/notifications?destinataire=…   la consigne en attente d'une personne (téléphone ou PWA)
//   GET  /api/missions?agent=…               la fiche mission d'un agent (avec version imprimable)
//   POST /api/ack           {id}             accusé de réception (notification ou mission)
// Aucun envoi réel ici : les canaux sont injectés, ceux fournis par défaut sont le bus du téléphone simulé et le canal agent sans transport.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { creerCanalAgent, ficheImprimable, missionEnNotification, type CanalAgent } from './canaux/agent.ts';
import { creerBusTelephone, creerCanalTelephoneSimule, type BusTelephone } from './canaux/telephone-simule.ts';
import { preparerNotifications } from './dispatcher.ts';
import { calculerCouverture, preparerMissions } from './missions.ts';
import { creerSuivi, type OptionsSuivi, type Suivi } from './suivi.ts';
import type { Agent, Canal, Decision, Destinataire, Mission, NomCanal, Notification, Sorties } from './types.ts';
import { ErreurDecision, lireDestinataire } from './validation.ts';

export const TAILLE_MAX_CORPS = 4 * 1024 * 1024;
export const DESTINATAIRES_MAX = 20000;
export const AGENTS_MAX = 500;

class ErreurRequete extends Error {
  statut: number;
  raisons?: string[];
  constructor(statut: number, message: string, raisons?: string[]) {
    super(message);
    this.statut = statut;
    this.raisons = raisons;
  }
}

export interface Service {
  suivi: Suivi;
  bus: BusTelephone;
  canalAgent: CanalAgent;
  sorties?: Sorties;
  population: Destinataire[];
  agents: Agent[];
  missions: Map<string, Mission[]>;
  maintenant: () => number;
}

export interface OptionsService {
  sorties?: Sorties;
  population?: Destinataire[];
  agents?: Agent[];
  canaux?: Partial<Record<NomCanal, Canal>>;
  suivi?: Omit<OptionsSuivi, 'canaux'>;
  maintenant?: () => number;
}

export function creerService(options: OptionsService = {}): Service {
  const bus = creerBusTelephone();
  const canalAgent = creerCanalAgent();
  const maintenant = options.maintenant ?? Date.now;
  const suivi = creerSuivi({
    maintenant,
    ...options.suivi,
    canaux: { 'telephone-simule': creerCanalTelephoneSimule(bus), agent: canalAgent, ...options.canaux },
  });
  bus.surAccuse((id) => void suivi.accuser(id));
  return { suivi, bus, canalAgent, sorties: options.sorties, population: options.population ?? [], agents: options.agents ?? [], missions: new Map(), maintenant };
}

async function lireCorps(req: IncomingMessage): Promise<Record<string, unknown>> {
  const dejaLu = (req as IncomingMessage & { body?: unknown }).body;
  if (dejaLu !== undefined && typeof dejaLu === 'object' && dejaLu !== null) return dejaLu as Record<string, unknown>;
  const morceaux: Buffer[] = [];
  let taille = 0;
  for await (const m of req) {
    const b = typeof m === 'string' ? Buffer.from(m) : (m as Buffer);
    taille += b.length;
    if (taille > TAILLE_MAX_CORPS) throw new ErreurRequete(413, 'Corps de requête trop volumineux.');
    morceaux.push(b);
  }
  try {
    const v: unknown = JSON.parse(Buffer.concat(morceaux).toString('utf8'));
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error('forme');
    return v as Record<string, unknown>;
  } catch {
    throw new ErreurRequete(400, 'JSON invalide : un objet est attendu.');
  }
}

function repondre(res: ServerResponse, statut: number, corps: unknown, entetes: Record<string, string> = {}): void {
  const texte = JSON.stringify(corps);
  res.writeHead(statut, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(texte), 'cache-control': 'no-store', ...entetes });
  res.end(texte);
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function lireSorties(service: Service, brut: unknown): Sorties {
  if (service.sorties) return service.sorties;
  if (!estObjet(brut) || !Array.isArray(brut.portes) || !estObjet(brut.salles) || !estObjet(brut.zones)) {
    throw new ErreurRequete(400, 'Données du lieu (sorties) absentes : fournissez {portes, salles, zones}.');
  }
  return brut as unknown as Sorties;
}

function lirePopulation(service: Service, brut: unknown): Destinataire[] {
  if (brut === undefined) return service.population;
  if (!Array.isArray(brut)) throw new ErreurRequete(400, 'population doit être une liste.');
  if (brut.length > DESTINATAIRES_MAX) throw new ErreurRequete(400, `Au plus ${DESTINATAIRES_MAX} destinataires par requête.`);
  try {
    return brut.map(lireDestinataire);
  } catch (e) {
    if (e instanceof ErreurDecision) throw new ErreurRequete(400, 'Population invalide.', e.raisons);
    throw e;
  }
}

async function notifier(service: Service, corps: Record<string, unknown>) {
  if (!estObjet(corps.decision)) throw new ErreurRequete(400, 'decision absente.');
  const decision = corps.decision as unknown as Decision;
  const sorties = lireSorties(service, corps.sorties);
  const population = lirePopulation(service, corps.population);
  let agents = service.agents;
  if (corps.agents !== undefined) {
    if (!Array.isArray(corps.agents) || corps.agents.length > AGENTS_MAX) throw new ErreurRequete(400, `agents doit être une liste de ${AGENTS_MAX} au plus.`);
    agents = corps.agents as Agent[];
  }
  const envoi = corps.dry_run === false;
  const options = { maintenant: service.maintenant };
  const notifications = preparerNotifications(decision, population, sorties, options);
  const missions = preparerMissions(decision, agents, sorties, options);
  const couverture = calculerCouverture(decision, agents, sorties);
  const parZone: Record<string, number> = {};
  for (const d of population) parZone[d.zone] = (parZone[d.zone] ?? 0) + 1;
  const base = {
    dry_run: !envoi,
    notifications: notifications.length,
    missions: missions.length,
    par_zone: parZone,
    couverture,
    apercu: notifications.slice(0, 5),
    apercu_missions: missions.slice(0, 5),
  };
  if (!envoi) return base;

  service.canalAgent.enregistrer(missions, agents);
  const pairs = missions.map((m) => missionEnNotification(m, agents.find((a) => a.id === m.agent_id)!, sorties));
  for (const m of missions) service.missions.set(m.agent_id, [...(service.missions.get(m.agent_id) ?? []).filter((x) => x.id !== m.id), m]);
  const dests = [...population, ...pairs.map((p) => p.destinataire)];
  const soumises = service.suivi.soumettre([...notifications, ...pairs.map((p) => p.notification)], dests);
  const traitement = await service.suivi.traiter();
  return { ...base, ...soumises, ...traitement, taux_par_zone: service.suivi.tauxParZone() };
}

export function creerRoute(service: Service): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const chemin = url.pathname.replace(/\/+$/, '');
      if (req.method === 'POST' && chemin === '/api/notifier') {
        repondre(res, 200, await notifier(service, await lireCorps(req)));
      } else if (req.method === 'GET' && chemin === '/api/notifications') {
        const id = url.searchParams.get('destinataire');
        if (!id || id.length > 64) throw new ErreurRequete(400, 'Paramètre destinataire attendu.');
        repondre(res, 200, { destinataire: id, notifications: service.suivi.lire(id) satisfies Notification[] });
      } else if (req.method === 'GET' && chemin === '/api/missions') {
        const id = url.searchParams.get('agent');
        if (!id || id.length > 64) throw new ErreurRequete(400, 'Paramètre agent attendu.');
        const missions = service.missions.get(id) ?? [];
        for (const m of missions) if (service.suivi.entree(m.id)?.statut === 'envoyee') service.suivi.lire(id);
        repondre(res, 200, { agent: id, missions, fiches_imprimables: missions.map(ficheImprimable) });
      } else if (req.method === 'POST' && chemin === '/api/ack') {
        const corps = await lireCorps(req);
        const id = typeof corps.id === 'string' ? corps.id : typeof corps.notification_id === 'string' ? corps.notification_id : '';
        if (!id || id.length > 200) throw new ErreurRequete(400, 'id attendu.');
        if (!service.suivi.accuser(id)) throw new ErreurRequete(404, 'Notification inconnue.');
        repondre(res, 200, { ok: true });
      } else if (['/api/notifier', '/api/ack'].includes(chemin)) {
        repondre(res, 405, { erreur: 'Méthode non autorisée : POST attendu.' }, { allow: 'POST' });
      } else if (['/api/notifications', '/api/missions'].includes(chemin)) {
        repondre(res, 405, { erreur: 'Méthode non autorisée : GET attendu.' }, { allow: 'GET' });
      } else {
        repondre(res, 404, { erreur: 'Chemin inconnu.' });
      }
    } catch (err) {
      if (err instanceof ErreurRequete) repondre(res, err.statut, { erreur: err.message, raisons: err.raisons });
      else if (err instanceof ErreurDecision) repondre(res, 422, { erreur: 'Décision refusée.', raisons: err.raisons });
      else repondre(res, 500, { erreur: 'Erreur interne du module de notification.' });
    }
  };
}

let parDefaut: ((req: IncomingMessage, res: ServerResponse) => Promise<void>) | null = null;

/** Handler prêt à monter : service créé au premier appel (téléphone simulé et canal agent sans transport : aucun envoi réel). */
export function routeNotifications(req: IncomingMessage, res: ServerResponse): Promise<void> {
  parDefaut ??= creerRoute(creerService());
  return parDefaut(req, res);
}
