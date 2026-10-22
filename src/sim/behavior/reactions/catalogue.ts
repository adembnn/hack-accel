// Catalogue de 15 réactions possibles d'une personne face à un événement, avec l'EFFET chiffré sur son comportement.
// Chaque effet est relié à une constante publiée du dépôt (sortie.ts, depart.ts, mouvement-simple.ts) ou étiqueté
// « hypothèse » (réglage à balayer, aucune mesure). Les descriptions sont NEUTRES : le mot « panique » n'apparaît jamais
// dans ce que lit le modèle de langage (il ne doit pas être poussé vers une réponse).
import { POIDS, SUIVISME_SURPRIS } from '../sortie.ts';
import {
  CONTEXTE_SANS_MENACE_CENTRAL,
  CONTEXTE_SANS_MENACE_MAX,
  FACTEUR_GUIDAGE,
  FACTEUR_SANS_ORDRE_HYPOTHESE,
} from '../depart.ts';

export type Famille = 'obeir' | 'decider' | 'urgence' | 'information' | 'attente' | 'entraide' | 'autre';

/** Ce qu'une réaction transmet à ses voisins qui l'adoptent. */
export interface Contagion {
  rayon_m: number;
  /** Probabilité d'adoption pour un voisin de confiance 1 (hypothèse : aucun chiffre publié pour la contagion, rapport 4 §5). */
  proba: number;
  mult_delai?: number;
  mult_vitesse?: number;
  /** Bonus d'utilité vers l'issue citée (même unité que POIDS de sortie.ts). */
  bonus_issue?: number;
}

export interface Effet {
  /** Multiplicateur de la vitesse de marche (1 = inchangé, 0 = ne bouge pas). */
  mult_vitesse: number;
  /** Multiplicateur du délai avant départ (1 = inchangé), au sens de depart.ts. */
  mult_delai: number;
  /** Bonus d'utilité vers l'issue citée dans la réponse (logit de sortie.ts). */
  bonus_issue: number;
  /** Multiplicateur du débit de la porte franchie par la personne (« plus vite = plus lent » : < 1). */
  mult_debit_porte: number;
  /** Influence sur les voisins, ou null. */
  contagion: Contagion | null;
  /** D'où vient le chiffre : constante publiée du dépôt, ou « hypothèse ». */
  source: string;
}

export interface Reaction {
  id: string;
  /** Description neutre, telle qu'elle est donnée au modèle de langage. */
  description: string;
  famille: Famille;
  effet: Effet;
}

/** Poids de foule pour 10 personnes qui vont vers la même porte : 10 x β_p (sortie.ts, utilité de la porte). */
const FOULE_10_SUIVISTE = 10 * POIDS.suivisme_moyen; // 0,76
const FOULE_10_SURPRIS = 10 * SUIVISME_SURPRIS; // 2,33

const neutre = { mult_vitesse: 1, mult_delai: 1, bonus_issue: 0, mult_debit_porte: 1, contagion: null };

export const REACTIONS: readonly Reaction[] = [
  {
    id: 'suivre_consigne',
    description: "faire ce que dit l'annonce ou l'agent, en allant vers l'issue indiquée",
    famille: 'obeir',
    effet: {
      ...neutre,
      mult_delai: FACTEUR_GUIDAGE,
      bonus_issue: POIDS.personnel,
      contagion: { rayon_m: 3, proba: 0.3, bonus_issue: FOULE_10_SUIVISTE },
      source: 'bonus = POIDS.personnel 2,739 et délai x FACTEUR_GUIDAGE 0,8 (publiés) ; rayon et proba de contagion : hypothèse',
    },
  },
  {
    id: 'choisir_seul',
    description: "décider soi-même de l'issue, sans attendre de consigne ni regarder les autres, souvent celle par laquelle on est entré",
    famille: 'decider',
    effet: {
      ...neutre,
      bonus_issue: POIDS.connue,
      source: 'bonus = POIDS.connue 0,795 (porte déjà connue, publié)',
    },
  },
  {
    id: 'suivre_la_foule',
    description: 'aller là où va la majorité des gens autour de soi',
    famille: 'decider',
    effet: {
      ...neutre,
      bonus_issue: FOULE_10_SURPRIS,
      contagion: { rayon_m: 2, proba: 0.2, bonus_issue: FOULE_10_SUIVISTE },
      source: 'bonus = 10 x SUIVISME_SURPRIS 0,233 ; contagion 10 x POIDS.suivisme_moyen 0,076 (publiés) ; rayon et proba : hypothèse',
    },
  },
  {
    id: 'fuite_precipitee',
    description: "courir vers la sortie la plus proche en ignorant les files d'attente",
    famille: 'urgence',
    effet: {
      ...neutre,
      mult_vitesse: 1.3,
      mult_delai: 0.5,
      mult_debit_porte: 0.6,
      contagion: { rayon_m: 5, proba: 0.25, mult_delai: 0.7, mult_vitesse: 1.15 },
      source: 'débit x 0,6 = plancher « plus vite = plus lent » de mouvement-simple.ts ; vitesse, délai, contagion : hypothèse',
    },
  },
  {
    id: 'bousculer',
    description: 'avancer en poussant les personnes qui gênent pour passer plus vite',
    famille: 'urgence',
    effet: {
      ...neutre,
      mult_vitesse: 1.15,
      mult_debit_porte: 0.7,
      contagion: { rayon_m: 2, proba: 0.15, mult_vitesse: 1.1 },
      source: 'hypothèse (débit voisin du plancher 0,6 de mouvement-simple.ts « plus vite = plus lent »)',
    },
  },
  {
    id: 's_informer',
    description: "s'arrêter pour chercher ce qui se passe (regarder autour, interroger quelqu'un, consulter son téléphone) avant de décider",
    famille: 'information',
    effet: {
      ...neutre,
      mult_vitesse: 0.5,
      mult_delai: CONTEXTE_SANS_MENACE_CENTRAL,
      source: "délai x CONTEXTE_SANS_MENACE_CENTRAL 1,5 (hypothèse encadrée, depart.ts) : la recherche d'information retarde le départ",
    },
  },
  {
    id: 'se_figer',
    description: 'rester immobile sur place sans rien faire, sans parler',
    famille: 'attente',
    effet: {
      ...neutre,
      mult_vitesse: 0,
      mult_delai: CONTEXTE_SANS_MENACE_MAX,
      contagion: { rayon_m: 2, proba: 0.1, mult_delai: 1.5 },
      source: 'délai x CONTEXTE_SANS_MENACE_MAX 2,5 (borne haute, depart.ts) ; contagion : hypothèse',
    },
  },
  {
    id: 'rester_a_l_abri',
    description: "rester à l'intérieur, dans un endroit fermé ou un coin, jusqu'à ce que la situation soit claire",
    famille: 'attente',
    effet: {
      ...neutre,
      mult_vitesse: 0,
      mult_delai: FACTEUR_SANS_ORDRE_HYPOTHESE,
      contagion: { rayon_m: 2, proba: 0.1, mult_delai: 1.5 },
      source: 'délai x FACTEUR_SANS_ORDRE_HYPOTHESE 30 (hypothèse sans source, depart.ts) ; contagion : hypothèse',
    },
  },
  {
    id: 'finir_son_activite',
    description: "terminer ce qu'on était en train de faire (achat, repas, film, conversation) avant de bouger",
    famille: 'attente',
    effet: {
      ...neutre,
      mult_delai: 2,
      source: 'délai x 2 : hypothèse comprise entre CONTEXTE_SANS_MENACE_CENTRAL 1,5 et CONTEXTE_SANS_MENACE_MAX 2,5 (depart.ts)',
    },
  },
  {
    id: 'revenir_chercher_quelqu_un',
    description: 'retourner sur ses pas ou attendre pour retrouver un proche, un enfant ou un ami avant de partir',
    famille: 'entraide',
    effet: {
      ...neutre,
      mult_vitesse: 0.8,
      mult_delai: 1.3,
      source: 'délai x 1,3 : hypothèse voisine de « on attend le dernier prêt » (+17 à +34 % selon la taille du groupe, maths-3 §1.4) ; 28,2 % cherchent un membre perdu (maths-3 §1.5)',
    },
  },
  {
    id: 'donner_un_ordre',
    description: 'dire à voix haute aux gens autour de soi quoi faire et où aller',
    famille: 'entraide',
    effet: {
      ...neutre,
      mult_vitesse: 0.9,
      mult_delai: FACTEUR_GUIDAGE,
      bonus_issue: POIDS.personnel / 2,
      contagion: { rayon_m: 5, proba: 0.4, mult_delai: FACTEUR_GUIDAGE, bonus_issue: POIDS.personnel / 2 },
      source: "borné par POIDS.personnel 2,739 et FACTEUR_GUIDAGE 0,8 (publiés) ; la moitié du poids d'un agent : hypothèse (un inconnu n'est pas un agent)",
    },
  },
  {
    id: 'aider',
    description: 'aider une personne qui en a besoin à avancer (âgé, enfant, blessé, personne chargée) en ralentissant avec elle',
    famille: 'entraide',
    effet: {
      ...neutre,
      mult_vitesse: 0.7,
      mult_delai: 1.2,
      contagion: { rayon_m: 2, proba: 0.3, mult_vitesse: 0.8 },
      source: "vitesse x 0,7 = 0,5 / 0,7 m/s d'un comportement coopératif fort (von Krüchten 2017, maths-3 §1.4) ; délai et contagion : hypothèse",
    },
  },
  {
    id: 'propager_une_info',
    description: "répéter ou transmettre à haute voix ou par message ce qu'on sait de la situation, vrai ou non, à ceux qui sont près",
    famille: 'information',
    effet: {
      ...neutre,
      contagion: { rayon_m: 8, proba: 0.5, mult_delai: 0.9, bonus_issue: FOULE_10_SUIVISTE },
      source: "hypothèse (aucun chiffre publié pour la transmission d'une information entre voisins, rapport 4 §5) ; bonus borné par 10 x POIDS.suivisme_moyen",
    },
  },
  {
    id: 'malaise',
    description: "ne plus pouvoir bouger normalement (vertige, essoufflement, jambes qui lâchent) et s'arrêter ou s'asseoir",
    famille: 'autre',
    effet: {
      ...neutre,
      mult_vitesse: 0,
      mult_debit_porte: 0.5,
      contagion: { rayon_m: 2, proba: 0.3, mult_vitesse: 0.8 },
      source: "hypothèse (la personne gêne le passage : débit x 0,5 ; ses voisins ralentissent pour l'aider)",
    },
  },
  {
    id: 'autre',
    description: 'une autre réaction qui ne correspond à aucune des précédentes (à préciser dans la raison)',
    famille: 'autre',
    effet: { ...neutre, source: 'neutre : aucun effet' },
  },
];

export const IDS_REACTIONS: readonly string[] = REACTIONS.map((r) => r.id);

export function reaction(id: string): Reaction {
  return REACTIONS.find((r) => r.id === id) ?? REACTIONS[REACTIONS.length - 1];
}
