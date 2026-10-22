// Rédaction de l'explication et de l'ordre de service par zone.
// Trois implémentations de l'interface Redacteur :
//  - RedacteurGabarit : texte fabriqué par gabarit, sans modèle (repli et générateur de cache pour les tests) ;
//  - RedacteurRejeu   : relit un cache fichier JSON, AUCUN réseau, échoue si la demande n'est pas dans le cache ;
//  - RedacteurClaude  : appelle l'API Anthropic (clé ANTHROPIC_API_KEY lue dans l'environnement) ; PAYANT, jamais appelé
//                       par les tests ni par l'implémenteur ; exige l'accord explicite d'Adem (option autorise_payant).
// Règle des chiffres (instantané-3 §7) : le modèle écrit un gabarit à champs {{cle}} ; les nombres viennent des faits du journal.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawn } from 'node:child_process';
import type { Journal, Plan } from './types.ts';
import { remplirChamps, verifierChiffres, verifierChiffresZone, type RapportVerification } from './verificateur.ts';
import { blocDonneeNonFiable, incoherencesAvecPlan } from './limites.ts';

export type TypeTexte = 'explication' | 'ordre_de_service';
export type Porteur = 'agent_de_securite' | 'annonce_sonore' | 'ecran' | 'direction';

export interface DemandeRedaction {
  type: TypeTexte;
  zone?: string;
  porteur?: Porteur;
  faits: Record<string, string | number>;
  // Texte libre de tiers (REX, noms d'enseignes) : donnée non fiable, placée après les consignes, jamais exécutée.
  donnees_libres?: string[];
}
export interface TexteRedige { type: TypeTexte; zone?: string; porteur?: Porteur; texte: string; origine: 'gabarit' | 'rejeu' | 'claude' }

export interface Redacteur { rediger(demande: DemandeRedaction): Promise<TexteRedige> }

const heureTexte = (minute: number): string => `${Math.floor(minute / 60)} h ${String(minute % 60).padStart(2, '0')}`;

// Qui porte le message dans une zone : un agent s'il y en a un placé dans la zone, sinon l'annonce sonore si un message existe, sinon l'écran.
export function porteurDeZone(plan: Plan, zone: string): Porteur {
  if (plan.guidage.some((g) => g.agents > 0 && g.point.includes(zone))) return 'agent_de_securite';
  if (plan.messages_par_zone[zone]) return 'annonce_sonore';
  return 'ecran';
}

// Faits chiffrés tirés du journal : seule source de nombres des textes.
export function faitsExplication(journal: Journal): Record<string, string | number> {
  const der = journal.entrees[journal.entrees.length - 1];
  if (!der) throw new Error('journal vide');
  const pic = journal.entrees.reduce((m, e) => (e.note.densite_max > m.note.densite_max ? e : m), journal.entrees[0]);
    return {
    minute_fin: der.minute,
    non_sortis_fin: der.note.non_sortis,
    sortis_fin: der.etat.sortis,
    sortis_danger_fin: der.note.sortis_vers_zone_danger,
    densite_pic: pic.note.densite_max,
    minute_pic: pic.minute,
    portes_fermees: der.synthese.portes_fermees,
    agents_places: der.synthese.agents_places,
    mode: der.plan.mode,
    minute_annonce: journal.scenario.minute_annonce,
    stations_fermees_minute: journal.scenario.stations_fermees_minute,
    heure_stations: heureTexte(journal.scenario.stations_fermees_minute),
  };
}

export function faitsZone(journal: Journal, zone: string): { faits: Record<string, string | number>; porteur: Porteur } {
  const der = journal.entrees[journal.entrees.length - 1];
  if (!der) throw new Error('journal vide');
  const phasage = der.plan.phasage_salles.find((s) => s.salle === zone);
  const depart = phasage ? phasage.minute_depart : journal.scenario.minute_annonce;
  const guid = der.synthese.agents_par_zone[zone] ?? 0;
  const z = der.etat.par_zone[zone];
  return {
    porteur: porteurDeZone(der.plan, zone),
    faits: {
      zone,
      minute_depart: depart,
      heure_depart: heureTexte(depart),
      agents_zone: guid,
      personnes_restantes: z ? z.personnes : 0,
      message: der.plan.messages_par_zone[zone] ?? '',
    },
  };
}

export function demandeExplication(journal: Journal): DemandeRedaction {
  return { type: 'explication', porteur: 'direction', faits: faitsExplication(journal) };
}
export function demandeOrdre(journal: Journal, zone: string): DemandeRedaction {
  const { faits, porteur } = faitsZone(journal, zone);
  return { type: 'ordre_de_service', zone, porteur, faits };
}

function canonique(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonique).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonique((v as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(v);
}
export function cleDeDemande(d: DemandeRedaction): string {
  return createHash('sha256').update(canonique({ type: d.type, zone: d.zone ?? null, porteur: d.porteur ?? null, faits: d.faits })).digest('hex').slice(0, 24);
}

// ---------- Gabarit (déterministe, sans modèle) ----------
export class RedacteurGabarit implements Redacteur {
  async rediger(d: DemandeRedaction): Promise<TexteRedige> {
    const gabarit = d.type === 'explication'
      ? 'Plan retenu : mode {{mode}}, {{portes_fermees}} porte(s) fermée(s), {{agents_places}} agent(s) de guidage. À {{minute_fin}} minutes du jour, {{sortis_fin}} personnes sont sorties, {{non_sortis_fin}} restent dans le centre et {{sortis_danger_fin}} ont été dirigées vers une zone de danger. La densité maximale a atteint {{densite_pic}} pers./m² à la minute {{minute_pic}}. Les stations ferment à {{heure_stations}}.'
      : 'Zone {{zone}} : départ à {{heure_depart}} ({{agents_zone}} agent(s) sur place, {{personnes_restantes}} personnes à faire sortir). Message : {{message}}';
    return { type: d.type, zone: d.zone, porteur: d.porteur, texte: remplirChamps(gabarit, d.faits), origine: 'gabarit' };
  }
}

// ---------- Rejeu (cache fichier, aucun réseau) ----------
export class ErreurRejeuAbsent extends Error {
  cle: string;
  constructor(cle: string, type: string) { super(`rejeu : aucune réponse en cache pour ${type} (clé ${cle}) ; aucun appel réseau n'est fait`); this.cle = cle; }
}

export class RedacteurRejeu implements Redacteur {
  #chemin: string;
  #cache: Record<string, TexteRedige>;
  constructor(chemin: string) {
    this.#chemin = chemin;
    this.#cache = existsSync(chemin) ? (JSON.parse(readFileSync(chemin, 'utf8')) as Record<string, TexteRedige>) : {};
  }
  async rediger(d: DemandeRedaction): Promise<TexteRedige> {
    const cle = cleDeDemande(d);
    const t = this.#cache[cle];
    if (!t) throw new ErreurRejeuAbsent(cle, d.type);
    return { ...t, origine: 'rejeu' };
  }
  enregistrer(d: DemandeRedaction, t: TexteRedige): void {
    this.#cache[cleDeDemande(d)] = t;
    mkdirSync(dirname(this.#chemin), { recursive: true });
    writeFileSync(this.#chemin, `${JSON.stringify(this.#cache, null, 2)}\n`);
  }
  get taille(): number { return Object.keys(this.#cache).length; }
}

// Sur absence dans le cache, délègue puis enregistre. Sert à remplir le cache UNE fois (avec accord d'Adem si le délégué est payant).
export class RedacteurEnregistreur implements Redacteur {
  #delegue: Redacteur;
  #rejeu: RedacteurRejeu;
  constructor(delegue: Redacteur, rejeu: RedacteurRejeu) { this.#delegue = delegue; this.#rejeu = rejeu; }
  async rediger(d: DemandeRedaction): Promise<TexteRedige> {
    try { return await this.#rejeu.rediger(d); }
    catch (e) {
      if (!(e instanceof ErreurRejeuAbsent)) throw e;
      const t = await this.#delegue.rediger(d);
      this.#rejeu.enregistrer(d, t);
      return t;
    }
  }
}

// ---------- Claude (payant) ----------
export interface OptionsClaude {
  autorise_payant: boolean;                 // accord explicite d'Adem ; sinon le constructeur refuse
  env?: Record<string, string | undefined>; // défaut : process.env
  modele?: string;
  fetchImpl?: typeof fetch;
}

export class RedacteurClaude implements Redacteur {
  #cle: string;
  #modele: string;
  #fetch: typeof fetch;
  constructor(o: OptionsClaude) {
    if (!o.autorise_payant) throw new Error('RedacteurClaude : appel payant non autorisé (accord d\'Adem requis, voir LISEZMOI règle 9)');
    const cle = (o.env ?? process.env).ANTHROPIC_API_KEY;
    if (!cle) throw new Error('RedacteurClaude : ANTHROPIC_API_KEY absente de l\'environnement');
    this.#cle = cle;
    this.#modele = o.modele ?? 'claude-sonnet-5-5';
    this.#fetch = o.fetchImpl ?? fetch;
  }
  async rediger(d: DemandeRedaction): Promise<TexteRedige> {
    const { systeme, utilisateur } = construirePrompt(d);
    const reponse = await this.#fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': this.#cle, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: this.#modele, max_tokens: 600, system: systeme, messages: [{ role: 'user', content: utilisateur }] }),
    });
    if (!reponse.ok) throw new Error(`Anthropic a répondu ${reponse.status}`);
    const corps = (await reponse.json()) as { content?: { type: string; text?: string }[] };
    const gabarit = (corps.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('').trim();
    return { type: d.type, zone: d.zone, porteur: d.porteur, texte: remplirChamps(gabarit, d.faits), origine: 'claude' };
  }
}

// Lanceur de la CLI `claude -p` non interactif, prompt sur l'entrée standard, abonnement de l'équipe (aucune clé facturée).
export type LanceurCli = (prompt: string) => Promise<string>;
export const lanceurClaudeCli: LanceurCli = (prompt) => new Promise((resolve, reject) => {
  const p = spawn('claude', ['-p'], { stdio: ['pipe', 'pipe', 'pipe'], shell: process.platform === 'win32' });
  let sortie = '', erreur = '';
  p.stdout.on('data', (b) => { sortie += b; });
  p.stderr.on('data', (b) => { erreur += b; });
  p.on('error', reject);
  p.on('close', (code) => (code === 0 ? resolve(sortie.trim()) : reject(new Error(`claude -p a échoué (code ${code}) : ${erreur.slice(0, 200)}`))));
  p.stdin.end(prompt);
});

export interface OptionsClaudeCli { autorise: boolean; lanceur?: LanceurCli }

// Deuxième implémentation Claude : via la CLI, abonnement de l'équipe. Jamais appelée dans les tests (lanceur injecté ou absent).
export class RedacteurClaudeCli implements Redacteur {
  #lanceur: LanceurCli;
  constructor(o: OptionsClaudeCli) {
    if (!o.autorise) throw new Error('RedacteurClaudeCli : lancement non autorisé (option autorise requise)');
    this.#lanceur = o.lanceur ?? lanceurClaudeCli;
  }
  async rediger(d: DemandeRedaction): Promise<TexteRedige> {
    const { systeme, utilisateur } = construirePrompt(d);
    const gabarit = await this.#lanceur(`${systeme}\n\n${utilisateur}`);
    return { type: d.type, zone: d.zone, porteur: d.porteur, texte: remplirChamps(gabarit, d.faits), origine: 'claude' };
  }
}

export function construirePrompt(d: DemandeRedaction): { systeme: string; utilisateur: string } {
  const champs = Object.keys(d.faits).map((k) => `{{${k}}}`).join(', ');
  const consigne = d.type === 'explication'
    ? 'Explique en 4 phrases maximum, en français clair, pourquoi ce plan a été retenu pour le directeur du centre.'
    : `Écris l'ordre de service court (3 phrases maximum) pour la zone ${d.zone ?? ''}, prononcé par : ${d.porteur ?? 'le responsable de zone'}.`;
  return {
    systeme: `Tu rédiges pour un centre commercial souterrain. Règle absolue : n'écris AUCUN nombre toi-même ; pour tout chiffre ou heure, utilise un champ parmi ${champs}. N'évoque jamais d'alarme générale ni d'incendie. Réponds par le texte seul.`,
    utilisateur: `CONSIGNES\n${consigne}\nFaits disponibles (clé = valeur) : ${JSON.stringify(d.faits)}${d.donnees_libres?.length ? `\n${blocDonneeNonFiable(d.donnees_libres).bloc}` : ''}`,
  };
}

// ---------- Rédiger puis vérifier : un texte qui contient un chiffre absent du journal est rejeté ----------
export class ErreurChiffres extends Error {
  rapport: RapportVerification;
  constructor(rapport: RapportVerification) { super(`chiffres non retrouvés dans le journal : ${rapport.non_retrouves.map((n) => n.texte).join(', ')}`); this.rapport = rapport; }
}
export class ErreurIncoherence extends Error {
  problemes: string[];
  constructor(problemes: string[]) { super(`texte incohérent avec le plan : ${problemes.join(' ; ')}`); this.problemes = problemes; }
}

function controler(texte: TexteRedige, d: DemandeRedaction, journal: Journal): RapportVerification {
  // Pour un ordre de service, seuls les nombres de SA zone (et les nombres globaux) sont admis (A9).
  const rapport = d.zone ? verifierChiffresZone(texte.texte, journal, d.zone) : verifierChiffres(texte.texte, journal);
  if (!rapport.ok) throw new ErreurChiffres(rapport);
  const inco = incoherencesAvecPlan(texte.texte, journal.entrees[journal.entrees.length - 1].plan);
  if (inco.length) throw new ErreurIncoherence(inco);
  return rapport;
}

export interface OptionsVerifie { essais?: number; repli?: boolean }

// Rédiger puis vérifier. Un texte avec un chiffre inventé, hors zone, ou incohérent avec le plan est rejeté ;
// un seul nouvel essai, puis repli sur un gabarit sans modèle (A7). Avec repli:false, l'erreur remonte.
export async function redigerVerifie(r: Redacteur, d: DemandeRedaction, journal: Journal, o: OptionsVerifie = {}): Promise<{ texte: TexteRedige; rapport: RapportVerification; repli: boolean; tentatives: number }> {
  const essais = o.essais ?? 2;
  let derniere: unknown;
  for (let i = 1; i <= essais; i++) {
    try {
      const texte = await r.rediger(d);
      return { texte, rapport: controler(texte, d, journal), repli: false, tentatives: i };
    } catch (e) {
      if (e instanceof ErreurRejeuAbsent) throw e; // pas de repli silencieux sur une absence de cache
      derniere = e;
    }
  }
  if (o.repli === false) throw derniere;
  const texte = await new RedacteurGabarit().rediger(d);
  return { texte, rapport: controler(texte, d, journal), repli: true, tentatives: essais };
}
