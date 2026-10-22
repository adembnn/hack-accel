// Réactions de TOUTE la foule : chaque personne (pas seulement celles reliées à un agent) tire, à des moments précis, une des 15
// réactions du catalogue dans une répartition (littérature ou LLM), sur son propre flux aléatoire (canaux 20 et plus). Ce fichier
// ne contient que l'état et les tirages ; l'application des effets (vitesse, délai, choix de porte...) est dans simuler.ts.
// Modèle simplifié, non certifié : toutes les contagions et les effets sans [lu] dans catalogue.ts sont des hypothèses.
import { readFileSync } from 'node:fs';
import { creerRng, creerRngPersonne, type Rng } from '../rng.ts';
import { MODELES } from './modeles.ts';
import { DISTRIBUTION_LITTERATURE, MENEUR_LITTERATURE, type Frequences } from './distribution-litterature.ts';

/** Option de `simuler`/`creerSimulation` (désactivée par défaut : `{ actif: false }` ou absente rend l'ancien comportement à l'identique). */
export interface OptionsReactions {
  actif: boolean;
  /** 'litterature', 'llm' (tous les modèles), 'llm:chinois' | 'llm:americain' | 'llm:europeen' (une famille) ou 'llm:<id de modèle>'. */
  source: string;
  /** Meneurs tirés au hasard (défaut 20) : chacun a un modèle (ou une famille) assigné et tire dans la répartition de ce modèle. */
  nb_meneurs?: number;
  /**
   * Voisinage d'une personne en marche : 'issue' (défaut) = celles qui visent la même issue ; 'salle' = celles de la même salle
   * de départ. Avant le départ, le voisinage est toujours la salle (le mouvement de test n'a pas de positions : positions
   * tirées au hasard, une par personne, dans la salle ou dans la zone d'approche de l'issue).
   */
  rayon_zone?: 'salle' | 'issue';
  /** Probabilité qu'une personne fasse un malaise pendant sa marche (défaut 0,2 %). HYPOTHÈSE : aucune mesure dans les rapports du dépôt. */
  p_malaise?: number;
  /** Pour l'analyse et les tests : force la réaction de tous les meneurs à ce moment-là (ex. 'donner_un_ordre'), au lieu du tirage. Omis = tirage. */
  reaction_meneurs?: string;
}

export const NB_MENEURS_DEFAUT = 20;
export const P_MALAISE_DEFAUT = 0.002;
export const MOMENTS = ['annonce', 'issue_bloquee', 'file_longue', 'voisin_qui_tombe', 'influence', 'malaise'] as const;
export type Moment = (typeof MOMENTS)[number];

/** Premier canal aléatoire des réactions (les canaux 0 à 8 sont pris par rng.ts et pmr.ts). */
export const CANAL_REACTIONS = 20;
const CANAL_MENEURS = 40;
const CANAL_POSITION = 41;
const CANAL_MALAISE = 42;

/** Réactions qui se propagent aux voisins via `appliquerInfluence` (consigne du ticket). */
export const CONTAGIEUSES: ReadonlySet<string> = new Set(['donner_un_ordre', 'propager_une_info', 'fuite_precipitee', 'suivre_la_foule']);

interface DistributionLlm {
  par_situation: Record<string, Frequences>;
  par_famille_situation: Record<string, Record<string, Frequences>>;
  par_modele: Record<string, Frequences>;
}
let llmCache: DistributionLlm | null = null;
/** Lit distribution-llm.json (fréquences agrégées de l'expérience LLM, aucune réponse brute). Lecture locale, aucun appel. */
export function distributionLlm(): DistributionLlm {
  return (llmCache ??= JSON.parse(readFileSync(new URL('./distribution-llm.json', import.meta.url), 'utf8')) as DistributionLlm);
}

const FAMILLES = ['chinois', 'americain', 'europeen'];

/** Valide la source et renvoie les modèles de langage qu'elle mobilise (vide pour « littérature »). Lève une erreur si inconnue. */
export function modelesDeLaSource(source: string): string[] {
  if (source === 'litterature') return [];
  const d = distributionLlm();
  if (source === 'llm') return Object.keys(d.par_modele);
  if (source.startsWith('llm:')) {
    const cle = source.slice(4);
    if (FAMILLES.includes(cle)) return MODELES.filter((m) => m.origine === cle && d.par_modele[m.id]).map((m) => m.id);
    if (d.par_modele[cle]) return [cle];
  }
  throw new Error(`source de réactions inconnue : « ${source} » (litterature, llm, llm:chinois, llm:americain, llm:europeen ou llm:<id de modèle>)`);
}

/** Répartition des personnes ordinaires pour une situation, selon la source. */
export function frequencesSituation(source: string, situation: string): Frequences {
  if (source === 'litterature') return DISTRIBUTION_LITTERATURE[situation as keyof typeof DISTRIBUTION_LITTERATURE] ?? DISTRIBUTION_LITTERATURE.annonce_sans_menace;
  modelesDeLaSource(source);
  const d = distributionLlm();
  const cle = source.slice(4);
  if (source === 'llm') return d.par_situation[situation];
  if (FAMILLES.includes(cle)) return d.par_famille_situation[cle]?.[situation] ?? d.par_situation[situation];
  return d.par_modele[cle]; // un seul modèle : sa répartition publiée est globale (pas par situation)
}

/** Répartition d'un meneur : celle de son modèle (globale, toutes situations), ou le profil hypothétique de la littérature. */
export function frequencesMeneur(modele: string | null): Frequences {
  return modele === null ? MENEUR_LITTERATURE : distributionLlm().par_modele[modele];
}

/** Tirage dans une répartition de fréquences (normalisée ici), un seul nombre aléatoire consommé. */
export function tirerDans(freq: Frequences, u: number): string {
  const cles = Object.keys(freq).sort();
  const total = cles.reduce((a, k) => a + freq[k], 0);
  let reste = u * total;
  for (const k of cles) {
    reste -= freq[k];
    if (reste < 0) return k;
  }
  return cles[cles.length - 1];
}

export interface Reactions {
  readonly options: Required<OptionsReactions>;
  readonly meneurs: ReadonlyMap<number, string | null>;
  estMeneur(i: number): boolean;
  /** Tire la réaction de la personne i à ce moment, dans la situation donnée ; `remplace` : réaction précédente du même moment, décomptée. */
  tirer(i: number, moment: Moment, situation: string, remplace?: string): string;
  /** Flux d'influence de la personne i pour un moment (un tirage par voisin). */
  fluxInfluence(i: number, moment: Moment): Rng;
  /** Position tirée au hasard dans le carré unité (stable pour la personne). */
  position(i: number): readonly [number, number];
  /** Instant relatif (s, dans les 10 premières minutes de marche) du malaise de la personne, ou undefined. */
  malaiseApres(i: number): number | undefined;
  /** Compteurs : nombre de chaque réaction par moment. */
  readonly comptes: Record<Moment, Record<string, number>>;
  /** Personnes touchées (au moins une fois) par l'influence d'un voisin. */
  readonly touchees: Set<number>;
  /** Personnes qui ont adopté, via l'influence, au moins une réaction de meneur. */
  readonly touchees_par_meneur: Set<number>;
}

export function creerReactions(graine: number, n: number, opts: OptionsReactions): Reactions {
  const options: Required<OptionsReactions> = {
    actif: opts.actif,
    source: opts.source,
    nb_meneurs: Math.min(n, Math.max(0, opts.nb_meneurs ?? NB_MENEURS_DEFAUT)),
    rayon_zone: opts.rayon_zone ?? 'issue',
    p_malaise: opts.p_malaise ?? P_MALAISE_DEFAUT,
    reaction_meneurs: opts.reaction_meneurs ?? '',
  };
  const modeles = modelesDeLaSource(options.source);
  // meneurs : tirage sans remise (Fisher-Yates partiel), puis un modèle assigné chacun
  const rM = creerRng(graine ^ CANAL_MENEURS);
  const ids = Array.from({ length: n }, (_, k) => k);
  const meneurs = new Map<number, string | null>();
  for (let k = 0; k < options.nb_meneurs; k++) {
    const j = k + Math.floor(rM.next() * (n - k));
    [ids[k], ids[j]] = [ids[j], ids[k]];
    meneurs.set(ids[k], modeles.length ? modeles[Math.floor(rM.next() * modeles.length)] : null);
  }
  const flux = new Map<number, Rng>(); // un flux par (personne, moment)
  const fluxDe = (i: number, moment: Moment) => {
    const cle = i * 16 + MOMENTS.indexOf(moment);
    let r = flux.get(cle);
    if (!r) flux.set(cle, (r = creerRngPersonne(graine, i, CANAL_REACTIONS + MOMENTS.indexOf(moment))));
    return r;
  };
  const comptes = Object.fromEntries(MOMENTS.map((m) => [m, {} as Record<string, number>])) as Record<Moment, Record<string, number>>;
  const pos = new Map<number, readonly [number, number]>();
  return {
    options,
    meneurs,
    estMeneur: (i) => meneurs.has(i),
    tirer(i, moment, situation, remplace) {
      const u = fluxDe(i, moment).next();
      const freq = meneurs.has(i) ? frequencesMeneur(meneurs.get(i)!) : frequencesSituation(options.source, situation);
      const r = options.reaction_meneurs && meneurs.has(i) ? options.reaction_meneurs : tirerDans(freq, u);
      if (remplace) comptes[moment][remplace]--;
      comptes[moment][r] = (comptes[moment][r] ?? 0) + 1;
      return r;
    },
    fluxInfluence: (i, moment) => creerRngPersonne(graine, i, CANAL_REACTIONS + 16 + MOMENTS.indexOf(moment)),
    position(i) {
      let p = pos.get(i);
      if (!p) {
        const r = creerRngPersonne(graine, i, CANAL_POSITION);
        pos.set(i, (p = [r.next(), r.next()]));
      }
      return p;
    },
    malaiseApres(i) {
      if (options.p_malaise <= 0) return undefined;
      const r = creerRngPersonne(graine, i, CANAL_MALAISE);
      return r.next() < options.p_malaise ? r.next() * 600 : undefined;
    },
    comptes,
    touchees: new Set(),
    touchees_par_meneur: new Set(),
  };
}
