// Décisions typées : les questions (oui/non, choix, score) posées à chaque décideur, leurs réponses avec probabilité ou confiance,
// le seuil de confiance (en code), la mémoire de la décision précédente, le repli à règles déterministes et le cache de rejeu.
// Partage des rôles : Claude Haiku décide dans le menu, le code calcule et borne, Claude Sonnet rédige.
// Les questions sont des OUTILS à schéma JSON côté Claude (claude-decideurs.ts). AUCUN appel réel ici : le transport par défaut
// des tests est le rejeu (cache fichier scellé) ; le transport Claude est payant, derrière la garde MODE_PAYANT.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Action, Decideur, EtatResume } from './types.ts';
import { PORTES_VERS_PERIMETRE } from './types.ts';
import type { ClientDecision, QuestionDecision, ReponseDecision } from './questions.ts';
import { ouvrirScelle, sceller, type EntreeScellee } from './integrite.ts';
import { CATALOGUE, type LevierCatalogue } from './catalogue-leviers.ts';

export const MODELE_DECIDEURS = 'claude-haiku-5-5'; // défaut ; surchargé par l'environnement MODELE_DECIDEURS (voir claude-decideurs.ts)

// ---------- Contrat de l'API ----------
export type QuestionTypee =
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: string[] }
  | { type: 'noul'; instructions: string };

export interface RequeteTypee { model: string; state: Record<string, unknown>; questions: Record<string, QuestionTypee> }
export type ReponseQuestionTypee =
  | { choice: string; probabilities: Record<string, number>; confidence: number }
  | { score: number; probabilities: number[]; confidence: number }
  | { noul: number };
export interface ReponseTypee { model: string; answers: Record<string, ReponseQuestionTypee>; usage?: { input_tokens: number; output_tokens: number } }

export interface TransportTypee { envoyer(requete: RequeteTypee): Promise<ReponseTypee> }

// ---------- État en niveaux nommés (pas de chiffres bruts : Claude est mauvais sur chiffres et dates) ----------
export type NiveauDensite = 'faible' | 'moderee' | 'elevee' | 'critique';
export interface NiveauxEtat {
  role: Decideur;
  densite: NiveauDensite;
  tendance: 'baisse' | 'stable' | 'monte';
  zone_critique: string;
  restant: 'quasi_vide' | 'peu' | 'moitie' | 'beaucoup';
  stations: 'ouvertes_longtemps' | 'ouvertes_bientot_fermees' | 'fermees';
  sortis_vers_danger: 'aucun' | 'quelques' | 'nombreux';
  leçons: string[];
  perturbations: string[];   // ex. porte_bloquee:berger, station_fermee:chatelet, information_tardive
  conflits: string[];        // codes des conflits détectés à la minute précédente
  nouvelle_perturbation: boolean;
}

export function niveauxDe(q: QuestionDecision, seuilDensite = 5, stationsMinute = 1320, precedent?: EtatResume, population0?: number): NiveauxEtat {
  const e = q.entree.etat;
  const d = e.densite_max;
  const densite: NiveauDensite = d >= seuilDensite ? 'critique' : d >= seuilDensite * 0.6 ? 'elevee' : d >= seuilDensite * 0.3 ? 'moderee' : 'faible';
  const tendance = !precedent ? 'stable' : e.densite_max > precedent.densite_max + 0.05 ? 'monte' : e.densite_max < precedent.densite_max - 0.05 ? 'baisse' : 'stable';
  const zones = Object.entries(e.par_zone).sort(([, a], [, b]) => b.densite - a.densite);
  const total = population0 ?? e.dans_le_centre + e.sortis;
  const part = total > 0 ? e.dans_le_centre / total : 0;
  const reste = stationsMinute - e.minute;
  const dg = e.sortis_vers_zone_danger;
  return {
    role: q.decideur,
    densite,
    tendance,
    zone_critique: zones[0]?.[0] ?? 'aucune',
    restant: part < 0.05 ? 'quasi_vide' : part < 0.3 ? 'peu' : part < 0.7 ? 'moitie' : 'beaucoup',
    stations: reste <= 0 ? 'fermees' : reste <= 30 ? 'ouvertes_bientot_fermees' : 'ouvertes_longtemps',
    sortis_vers_danger: dg === 0 ? 'aucun' : dg < 100 ? 'quelques' : 'nombreux',
    leçons: q.entree.lecons.map((l) => l.id),
    perturbations: q.entree.perturbations ?? [],
    conflits: q.entree.conflits ?? [],
    nouvelle_perturbation: q.entree.nouvelles_perturbations ?? false,
  };
}

// ---------- Leviers typés par décideur (un jeu de questions par décideur) ----------
export interface SpecQuestion {
  cle: string;
  question: QuestionTypee;
  // Valeur décidée (choice → option, score → indice entier, noul → booléen) → actions du menu du décideur.
  versActions(valeur: string | number | boolean, n: NiveauxEtat, effectif: number): Action[];
}

const NIVEAUX_GUIDAGE = ['aucun', 'messages sonores', 'agents sur place', 'évacuation dirigée'];

export const SPECS_NOYAU: Record<Decideur, SpecQuestion[]> = {
  ugc: [],
  bspp: [],
  directeur: [
    {
      cle: 'plan',
      question: { type: 'choice', instructions: 'Quelle décision globale prendre maintenant pour le centre ?', criteria: {
        rester_ouvert: 'Maintenir l\'accès, aucun risque d\'écrasement identifié',
        fermer_par_etapes: 'Fermer par niveaux et par salles, la densité monte',
        fermer: 'Tout fermer : la densité est critique et continue de monter',
      } },
      versActions: (v) => [{ decideur: 'directeur', levier: 'mode', valeur: v }],
    },
    {
      cle: 'confinement',
      question: { type: 'noul', instructions: 'Faut-il confiner les personnes sur place plutôt que les évacuer, parce que la rue est dangereuse ?' },
      versActions: (v, n) => [{ decideur: 'directeur', levier: 'confinement', valeur: { actif: v === true, zones: v === true ? [n.zone_critique] : [] } }],
    },
    {
      cle: 'fermer_portes_perimetre',
      question: { type: 'noul', instructions: 'Faut-il fermer les portes qui donnent vers le périmètre de couvre-feu (Berger, Rambuteau) ?' },
      versActions: (v) => PORTES_VERS_PERIMETRE.map((p) => ({ decideur: 'directeur' as Decideur, levier: 'porte', valeur: { porte: p, etat: v === true ? 'fermee' : 'ouverte' } })),
    },
  ],
  securite_centre: [
    {
      cle: 'guidage',
      question: { type: 'score', instructions: 'Quel niveau de guidage vers les sorties faut-il dans la zone la plus dense ?', criteria: NIVEAUX_GUIDAGE },
      versActions: (v, n, effectif) => {
        const i = Number(v);
        const acts: Action[] = [];
        if (i >= 1) acts.push({ decideur: 'securite_centre', levier: 'message_zone', valeur: { zone: n.zone_critique, texte: 'Le centre ferme. Rejoignez calmement la sortie indiquée.' } });
        if (i >= 2) acts.push({ decideur: 'securite_centre', levier: 'guidage', valeur: { point: n.zone_critique, agents: Math.max(1, Math.floor(effectif * (i === 2 ? 0.25 : 0.5))) } });
        return acts;
      },
    },
  ],
  ratp: [
    {
      cle: 'correspondances',
      question: { type: 'noul', instructions: 'Faut-il assurer les correspondances tant que les stations sont ouvertes ?' },
      versActions: (v) => [{ decideur: 'ratp', levier: 'correspondances', valeur: v === true }],
    },
  ],
  prefecture: [
    {
      cle: 'renforts',
      question: { type: 'noul', instructions: 'Faut-il demander des renforts de police autour des portes qui donnent vers le périmètre de couvre-feu ?' },
      versActions: (v) => PORTES_VERS_PERIMETRE.map((p) => ({ decideur: 'prefecture' as Decideur, levier: 'renforts_portes', valeur: { porte: p, effectif: v === true ? 10 : 0 } })),
    },
  ],
};

// ---------- Questions Claude du catalogue complet (46 leviers, 6 décideurs) ----------
// oui_non → noul ; choix → choice ; score → score (niveaux nommés) ; sous_ensemble → choice sur la porte préférée ;
// oui_non_par_cible → noul sur la cible la plus critique. Les valeurs retournées passent ensuite par les bornes de leviers.ts.
const NIVEAUX_SCORE = ['aucun', 'faible', 'moyen', 'fort', 'maximum'];

export function specDepuisCatalogue(l: LevierCatalogue): SpecQuestion {
  const base = { cle: l.code };
  const enonce = `${l.libelle} (contrainte : ${l.contrainte}) ?`;
  const agir = (valeur: unknown): Action[] => [{ decideur: l.decideur, levier: l.code, valeur }];
  switch (l.type) {
    case 'oui_non':
      return { ...base, question: { type: 'noul', instructions: enonce }, versActions: (v) => agir(v === true) };
    case 'choix': {
      const options = (l.options ?? []).filter((o) => !l.interdits?.includes(o));
      return { ...base, question: { type: 'choice', instructions: enonce, criteria: Object.fromEntries(options.map((o) => [o, o.replace(/_/g, ' ')])) }, versActions: (v) => agir(v) };
    }
    case 'score':
      return {
        ...base,
        question: { type: 'score', instructions: enonce, criteria: NIVEAUX_SCORE },
        versActions: (v, _n, effectif) => {
          const max = l.bornes?.max === 'effectif' ? effectif : (l.bornes?.max ?? 0);
          const min = l.bornes?.min ?? 0;
          return agir(Math.round(min + (Math.min(Math.max(Number(v), 0), 4) / 4) * (max - min)));
        },
      };
    case 'sous_ensemble':
      return { ...base, question: { type: 'choice', instructions: enonce, criteria: Object.fromEntries((l.options ?? []).map((o) => [o, o.replace(/_/g, ' ')])) }, versActions: (v) => agir([String(v)]) };
    case 'oui_non_par_cible':
      return { ...base, question: { type: 'noul', instructions: enonce }, versActions: (v, n) => agir({ cible: l.cibles?.includes(n.zone_critique) ? n.zone_critique : (l.cibles ?? [])[0], oui: v === true }) };
  }
}

export const SPECS_CATALOGUE: Record<Decideur, SpecQuestion[]> = Object.fromEntries(
  (['prefecture', 'ratp', 'securite_centre', 'directeur', 'ugc', 'bspp'] as Decideur[]).map((d) => [d, CATALOGUE.filter((l) => l.decideur === d).map(specDepuisCatalogue)]),
) as Record<Decideur, SpecQuestion[]>;

// ---------- Décision à partir des réponses ----------
export const SEUIL_CONFIANCE = 0.6;
export const ZONE_INCERTAINE: [number, number] = [0.35, 0.65];

export function valeurDecidee(spec: SpecQuestion, rep: ReponseQuestionTypee | undefined, seuil = SEUIL_CONFIANCE): string | number | boolean | null {
  if (!rep) return null;
  if (spec.question.type === 'noul' && 'noul' in rep) {
    if (rep.noul > ZONE_INCERTAINE[1]) return true;
    if (rep.noul < ZONE_INCERTAINE[0]) return false;
    return null;
  }
  if (spec.question.type === 'choice' && 'choice' in rep) return rep.confidence >= seuil ? rep.choice : null;
  if (spec.question.type === 'score' && 'score' in rep) return rep.confidence >= seuil ? Math.round(rep.score) : null;
  return null;
}

// ---------- Repli à règles déterministes (Claude indisponible) : fabrique des réponses au format Claude ----------
export function reponsesParRegles(n: NiveauxEtat): Record<string, ReponseQuestionTypee> {
  const critique = n.densite === 'critique';
  const elevee = n.densite === 'elevee' || critique;
  const choix = critique ? 'fermer' : elevee || n.stations === 'ouvertes_bientot_fermees' ? 'fermer_par_etapes' : 'rester_ouvert';
  const probas = { rester_ouvert: 0.05, fermer_par_etapes: 0.05, fermer: 0.05, [choix]: 0.9 };
  return {
    plan: { choice: choix, probabilities: probas, confidence: 0.9 },
    confinement: { noul: n.stations === 'fermees' && n.sortis_vers_danger !== 'aucun' ? 0.9 : 0.1 },
    fermer_portes_perimetre: { noul: n.sortis_vers_danger === 'aucun' && !elevee ? 0.1 : 0.9 },
    guidage: { score: critique ? 3 : elevee ? 2 : n.restant === 'quasi_vide' ? 0 : 1, probabilities: [0, 0, 0, 0], confidence: 0.9 },
    correspondances: { noul: n.stations === 'fermees' ? 0.1 : 0.9 },
    renforts: { noul: n.sortis_vers_danger === 'aucun' ? 0.1 : 0.9 },
  };
}

// ---------- Client Claude (implémente ClientDecision) ----------
export interface OptionsClientTypee {
  transport: TransportTypee;
  modele?: string;
  seuil_confiance?: number;
  effectif_securite?: number;
  plafond_requetes?: number;        // garde-fou de coût (reco : 300)
  stations_minute?: number;
  surRepli?: (decideur: Decideur, raison: string) => void;
  catalogue?: boolean;              // poser aussi les questions des 46 leviers du catalogue (défaut : non)
}

export class ClientTypee implements ClientDecision {
  #o: OptionsClientTypee;
  #memoire = new Map<string, string | number | boolean>();
  #precedent: EtatResume | undefined;
  requetes = 0;
  replis = 0;
  constructor(o: OptionsClientTypee) { this.#o = o; }

  async decider(q: QuestionDecision): Promise<ReponseDecision> {
    const n = niveauxDe(q, 5, this.#o.stations_minute ?? 1320, this.#precedent);
    this.#precedent = q.entree.etat;
    const specs = this.#o.catalogue ? [...SPECS_NOYAU[q.decideur], ...SPECS_CATALOGUE[q.decideur]] : SPECS_NOYAU[q.decideur];
    let answers: Record<string, ReponseQuestionTypee>;
    let source = 'claude';
    try {
      if (this.#o.plafond_requetes !== undefined && this.requetes >= this.#o.plafond_requetes) throw new Error('plafond de requêtes atteint');
      this.requetes++;
      const etat: Record<string, unknown> = { ...n };
      delete etat.leçons;
      const res = await this.#o.transport.envoyer({
        model: this.#o.modele ?? MODELE_DECIDEURS,
        state: { ...etat, lecons_du_retour_d_experience: n.leçons, lecons_validees_par_simulation: q.entree.lecons_validees ?? [] },
        questions: Object.fromEntries(specs.map((s) => [s.cle, s.question])),
      });
      answers = res.answers;
    } catch (err) {
      this.replis++;
      source = 'regles';
      this.#o.surRepli?.(q.decideur, (err as Error).message);
      answers = reponsesParRegles(n);
    }
    const actions: ReponseDecision['actions'] = [];
    const notes: string[] = [];
    for (const s of specs) {
      const cleM = `${q.decideur}/${s.cle}`;
      let v = valeurDecidee(s, answers[s.cle], this.#o.seuil_confiance);
      if (v === null) {
        const avant = this.#memoire.get(cleM);
        notes.push(`${s.cle}: hésitation, décision précédente gardée`);
        if (avant === undefined) continue;
        v = avant;
      } else this.#memoire.set(cleM, v);
      for (const a of s.versActions(v, n, this.#o.effectif_securite ?? 20)) actions.push({ levier: a.levier, valeur: a.valeur });
    }
    const lecons = n.leçons.length ? ` Leçons citées : ${n.leçons.join(', ')}.` : '';
    return { actions, justification: `source=${source}. ${notes.join(' ; ')}${lecons}`.slice(0, 400) };
  }
}

// ---------- Transports ----------
export function cleDeRequete(r: RequeteTypee): string {
  const canon = (v: unknown): string => Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`).join(',')}}` : JSON.stringify(v);
  return createHash('sha256').update(canon({ model: r.model, state: r.state, questions: r.questions })).digest('hex').slice(0, 24);
}

export class ErreurRejeuTypeeAbsent extends Error {
  cle: string;
  constructor(cle: string) { super(`rejeu Claude : requête ${cle} absente du cache ; aucun appel réseau n'est fait`); this.cle = cle; }
}

// Rejeu : cache fichier JSON { cle: ReponseTypee }. Aucun réseau, échoue si absent.
export class TransportRejeuTypee implements TransportTypee {
  #chemin: string;
  #cache: Record<string, EntreeScellee<ReponseTypee>>;
  constructor(chemin: string) {
    this.#chemin = chemin;
    this.#cache = existsSync(chemin) ? (JSON.parse(readFileSync(chemin, 'utf8')) as Record<string, EntreeScellee<ReponseTypee>>) : {};
  }
  async envoyer(r: RequeteTypee): Promise<ReponseTypee> {
    const cle = cleDeRequete(r);
    const brut = this.#cache[cle];
    if (!brut) throw new ErreurRejeuTypeeAbsent(cle);
    return structuredClone(ouvrirScelle<ReponseTypee>(brut, cle));
  }
  enregistrer(r: RequeteTypee, rep: ReponseTypee): void {
    this.#cache[cleDeRequete(r)] = sceller(rep);
    mkdirSync(dirname(this.#chemin), { recursive: true });
    writeFileSync(this.#chemin, `${JSON.stringify(this.#cache, null, 2)}\n`);
  }
}

// Enregistreur : sur absence dans le cache, délègue (transport payant) puis enregistre. Pour remplir le cache une fois, avec accord.
export class TransportEnregistreurTypee implements TransportTypee {
  #rejeu: TransportRejeuTypee;
  #delegue: TransportTypee;
  constructor(rejeu: TransportRejeuTypee, delegue: TransportTypee) { this.#rejeu = rejeu; this.#delegue = delegue; }
  async envoyer(r: RequeteTypee): Promise<ReponseTypee> {
    try { return await this.#rejeu.envoyer(r); }
    catch (e) {
      if (!(e instanceof ErreurRejeuTypeeAbsent)) throw e;
      const rep = await this.#delegue.envoyer(r);
      this.#rejeu.enregistrer(r, rep);
      return rep;
    }
  }
}
