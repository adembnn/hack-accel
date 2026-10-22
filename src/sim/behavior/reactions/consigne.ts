// Consigne commune donnée à chaque « personne » simulée par un modèle de langage : même texte, même situation,
// seul le modèle change. 20 profils, 10 situations (Forum des Halles, soir du 19 oct. 2026), réponse JSON imposée.
import { REACTIONS } from './catalogue.ts';

export interface Profil {
  id: string;
  age: number;
  compagnie: string;
  habitue: boolean;
  mobilite: string;
  etat_d_esprit: string;
  langue: string;
}

export interface Situation {
  id: string;
  /** Texte libre de ce que la personne perçoit. */
  perception: string;
  /** Issues connues de la personne et leur état. */
  issues: { id: string; etat: string; distance_m: number }[];
  [cle: string]: unknown;
}

const ISSUES_STANDARD = (extra: Partial<Record<string, string>> = {}): Situation['issues'] => [
  { id: 'lescot', etat: extra.lescot ?? 'ouverte', distance_m: 90 },
  { id: 'berger', etat: extra.berger ?? 'ouverte', distance_m: 140 },
  { id: 'rambuteau', etat: extra.rambuteau ?? 'ouverte', distance_m: 220 },
  { id: 'metro_chatelet', etat: extra.metro_chatelet ?? 'ouvert', distance_m: 60 },
];

export const SITUATIONS: readonly Situation[] = [
  {
    id: 'annonce_sans_menace',
    lieu: 'Forum des Halles, niveau -2, galerie commerçante',
    heure: '20:05',
    perception: "Une voix dans les haut-parleurs demande à tout le monde de quitter le centre par les sorties. Aucune fumée, aucun bruit anormal, les boutiques sont éclairées.",
    densite_pers_m2: 1.2,
    issues: ISSUES_STANDARD(),
  },
  {
    id: 'issue_bloquee',
    lieu: 'Forum des Halles, niveau -1, devant la sortie Lescot',
    heure: '20:12',
    perception: "La porte Lescot que vous aviez repérée est fermée par une grille. Un petit groupe s'est formé devant, des gens regardent leur téléphone.",
    densite_pers_m2: 2.4,
    issues: ISSUES_STANDARD({ lescot: 'fermée' }),
  },
  {
    id: 'manifestation_berger',
    lieu: 'Forum des Halles, niveau 0, côté rue Berger',
    heure: '20:20',
    perception: "Par les vitres, on voit un cortège avec des banderoles et du bruit devant la sortie Berger. Des fumigènes colorés sont visibles. Des gens reculent vers l'intérieur.",
    densite_pers_m2: 2.0,
    issues: ISSUES_STANDARD({ berger: 'à éviter (manifestation devant)' }),
  },
  {
    id: 'escalator_arrete',
    lieu: 'Forum des Halles, escalator vers la sortie',
    heure: '20:15',
    perception: "L'escalator qui monte vers la sortie s'est arrêté. Une file se forme sur les marches et dans l'escalier fixe voisin, étroit.",
    densite_pers_m2: 3.1,
    issues: ISSUES_STANDARD(),
  },
  {
    id: 'fumee',
    lieu: 'Forum des Halles, niveau -2, couloir',
    heure: '20:30',
    perception: "Une odeur de brûlé et un peu de fumée grise viennent du fond du couloir derrière vous. L'alarme sonne. Personne de l'équipe n'est visible.",
    densite_pers_m2: 2.0,
    issues: ISSUES_STANDARD(),
  },
  {
    id: 'file_longue',
    lieu: 'Forum des Halles, niveau 0, devant la sortie Rambuteau',
    heure: '20:18',
    perception: "Une file de plusieurs centaines de personnes avance lentement vers la sortie Rambuteau. L'autre sortie, Berger, est visiblement presque vide mais plus loin.",
    densite_pers_m2: 3.5,
    issues: ISSUES_STANDARD(),
  },
  {
    id: 'message_clair',
    lieu: 'Forum des Halles, niveau -1',
    heure: '20:10',
    perception: "Un écran et une voix disent clairement : « Évacuation du centre. Rejoignez la sortie Lescot, escalier B, calmement. Les accès métro sont fermés. »",
    densite_pers_m2: 1.5,
    issues: ISSUES_STANDARD({ metro_chatelet: 'fermé' }),
  },
  {
    id: 'agent_qui_guide',
    lieu: 'Forum des Halles, niveau 0',
    heure: '20:14',
    perception: "Un agent en gilet jaune lève le bras et crie de le suivre vers la sortie Berger. Il dit que Lescot est encombrée.",
    densite_pers_m2: 2.2,
    issues: ISSUES_STANDARD(),
  },
  {
    id: 'voisin_qui_tombe',
    lieu: 'Forum des Halles, niveau -1, escalier',
    heure: '20:22',
    perception: "Dans la foule qui descend l'escalier, la personne devant vous trébuche et tombe. Elle ne se relève pas tout de suite. Ceux de derrière continuent de pousser légèrement.",
    densite_pers_m2: 3.8,
    issues: ISSUES_STANDARD(),
  },
  {
    id: 'rumeur',
    lieu: 'Forum des Halles, niveau -2, galerie',
    heure: '20:09',
    perception: "Quelqu'un à côté de vous dit qu'il a lu sur les réseaux qu'il y a eu un incident dans le métro et que tout est fermé. Rien d'officiel n'a été annoncé ici.",
    densite_pers_m2: 1.6,
    issues: ISSUES_STANDARD({ metro_chatelet: 'inconnu' }),
  },
];

// Profils : les deux premiers sont ceux de l'expérience par défaut (contrastés sur presque tous les critères).
export const PROFILS: readonly Profil[] = [
  { id: 'p01', age: 34, compagnie: 'seul', habitue: true, mobilite: 'normale', etat_d_esprit: 'calme, pressé', langue: 'français' },
  { id: 'p02', age: 71, compagnie: 'avec son conjoint', habitue: false, mobilite: 'marche lente, canne', etat_d_esprit: 'anxieux', langue: 'anglais' },
  { id: 'p03', age: 22, compagnie: "avec 3 amis", habitue: true, mobilite: 'normale', etat_d_esprit: 'détendu, curieux', langue: 'français' },
  { id: 'p04', age: 40, compagnie: 'avec 2 enfants de 6 et 9 ans', habitue: false, mobilite: 'normale, poussette', etat_d_esprit: 'inquiet pour les enfants', langue: 'espagnol' },
  { id: 'p05', age: 58, compagnie: 'seul', habitue: true, mobilite: 'normale', etat_d_esprit: 'méfiant envers les annonces', langue: 'français' },
  { id: 'p06', age: 19, compagnie: 'avec un ami', habitue: false, mobilite: 'normale', etat_d_esprit: 'excité, filme avec son téléphone', langue: 'anglais' },
  { id: 'p07', age: 47, compagnie: 'seule', habitue: false, mobilite: 'fauteuil roulant', etat_d_esprit: 'prudent', langue: 'français' },
  { id: 'p08', age: 29, compagnie: 'seul', habitue: false, mobilite: 'normale', etat_d_esprit: 'très stressé, déjà vécu une agression', langue: 'arabe' },
  { id: 'p09', age: 63, compagnie: 'seul', habitue: true, mobilite: 'normale', etat_d_esprit: 'imperturbable, travaille sur place', langue: 'français' },
  { id: 'p10', age: 36, compagnie: 'avec un collègue', habitue: true, mobilite: 'normale', etat_d_esprit: 'organisé, a un rôle de sécurité secouriste', langue: 'français' },
  { id: 'p11', age: 15, compagnie: 'avec sa classe de 12 élèves et un professeur', habitue: false, mobilite: 'normale', etat_d_esprit: 'bruyant, distrait', langue: 'français' },
  { id: 'p12', age: 52, compagnie: 'avec sa mère de 84 ans', habitue: false, mobilite: 'normale, accompagne une personne âgée', etat_d_esprit: 'responsable', langue: 'italien' },
  { id: 'p13', age: 26, compagnie: 'seule', habitue: false, mobilite: 'normale', etat_d_esprit: 'touriste, ne comprend pas les annonces', langue: 'chinois' },
  { id: 'p14', age: 44, compagnie: 'seul', habitue: true, mobilite: 'normale', etat_d_esprit: 'agacé, pense à une fausse alerte', langue: 'français' },
  { id: 'p15', age: 31, compagnie: 'avec sa compagne enceinte de 8 mois', habitue: false, mobilite: 'marche lente', etat_d_esprit: 'inquiet', langue: 'français' },
  { id: 'p16', age: 67, compagnie: 'seul', habitue: true, mobilite: 'normale', etat_d_esprit: 'confiant dans les consignes officielles', langue: 'français' },
  { id: 'p17', age: 24, compagnie: 'avec un groupe de 6 personnes', habitue: false, mobilite: 'normale', etat_d_esprit: 'euphorique, sortie entre amis', langue: 'allemand' },
  { id: 'p18', age: 38, compagnie: 'seul', habitue: false, mobilite: 'normale, deux grosses valises', etat_d_esprit: 'pressé de rejoindre son train', langue: 'néerlandais' },
  { id: 'p19', age: 55, compagnie: 'seul', habitue: true, mobilite: 'normale', etat_d_esprit: 'sceptique, suit les autres', langue: 'français' },
  { id: 'p20', age: 17, compagnie: 'seul', habitue: true, mobilite: 'normale', etat_d_esprit: 'sur son téléphone, casque audio', langue: 'français' },
];

const LISTE_ACTIONS = REACTIONS.map((r) => `- ${r.id} : ${r.description}`).join('\n');

/** Consigne commune (message « system »). Aucun mot chargé (« panique », « danger imminent ») n'y figure. */
export const CONSIGNE = `Tu joues le rôle d'une personne réelle présente dans le Forum des Halles à Paris un soir de 2026, au moment décrit ci-dessous. Tu n'es pas un assistant : tu réagis comme cette personne le ferait vraiment, avec ses connaissances limitées, son caractère et ses proches.
Tu reçois en JSON ton profil et la situation que tu perçois. Choisis UNE seule réaction dans la liste fermée suivante :
${LISTE_ACTIONS}

Réponds uniquement par un objet JSON, sans texte autour, de la forme :
{"action": "<identifiant de la liste>", "issue": "<identifiant d'une issue de la situation ou null>", "intensite": <nombre de 0 à 1>, "raison": "<au plus 20 mots>"}
"intensite" mesure à quel point tu fais cette réaction (0 = à peine, 1 = à fond). "issue" est celle vers laquelle tu te diriges, ou null si tu ne te diriges vers aucune.`;

export function messages(profil: Profil, situation: Situation): { role: 'system' | 'user'; content: string }[] {
  return [
    { role: 'system', content: CONSIGNE },
    { role: 'user', content: JSON.stringify({ profil, situation }) },
  ];
}
