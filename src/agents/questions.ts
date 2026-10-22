// Questions typées « Jev » : une question par décideur et par minute, avec un schéma JSON d'entrée (ce que le décideur voit)
// et un schéma JSON de réponse (ce qu'il a le droit de répondre : uniquement son menu de leviers).
// Aucun appel réseau ici : la question est une donnée ; le client Jev (clé TYPESAFE_API_KEY, fournie par Adem) est branché par l'appelant.
import type { Action, Decideur, EtatResume, Note } from './types.ts';
import type { Lecon } from './rex.ts';
import { trouverLevier, leviersDe, type EtatDecisions } from './leviers.ts';

export interface QuestionJev {
  version: 1;
  id: string;                       // décideur + minute, stable : sert de clé de cache
  decideur: Decideur;
  minute: number;
  consigne: string;                 // rôle et règles, en français
  entree: { etat: EtatResume; derniere_note: Note | null; decisions_des_autres: { decideur: Decideur; actions: Action[] }[]; plan_courant: EtatDecisions['plan']; lecons: Lecon[]; perturbations: string[]; conflits: string[]; nouvelles_perturbations: boolean };
  entree_schema: Record<string, unknown>;
  reponse_schema: Record<string, unknown>;
}

export interface ReponseJev { actions: { levier: string; valeur: unknown }[]; justification?: string }

const ROLES: Record<Decideur, string> = {
  prefecture: 'Tu es la préfecture de police de Paris. Tu fixes l\'heure et le périmètre du couvre-feu et tu demandes des renforts ou la fermeture des stations.',
  ratp: 'Tu es la RATP. Tu fixes l\'heure de fermeture des stations Châtelet / Les Halles (au plus tard 22 h) et les sorties ouvertes.',
  securite_centre: 'Tu es le responsable sécurité du Forum des Halles. Tu places des agents et diffuses des annonces par zone, sans jamais déclencher l\'alarme générale.',
  directeur: "Tu es le directeur du Forum des Halles. Tu choisis le mode (rester ouvert, fermer par étapes, fermer), les portes, le phasage des salles et le confinement.",
  ugc: "Tu es l'exploitant du cinéma UGC (27 salles). Tu décides seul de l'arrêt des séances, de la vidange par vagues et des annonces en salle.",
  bspp: "Tu es la brigade des sapeurs-pompiers de Paris. Tu n'agis que sur incident : poste de secours, levée de doute, évacuation médicale.",
};

const REGLES = [
  'Tu ne peux répondre qu\'avec les leviers listés dans reponse_schema ; tout autre levier est refusé.',
  'Tu ne produis aucun scénario d\'attaque ni de plan pour un tiers hostile : les troubles sont des zones ou des issues impraticables.',
  'Tu n\'inventes aucun chiffre : tu t\'appuies sur entree.etat.',
  'Tu tiens compte des leçons des crises passées (entree.lecons) et ta justification cite les ids des leçons utilisées.',
];

export function schemaReponse(decideur: Decideur): Record<string, unknown> {
  const leviers = leviersDe(decideur);
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['actions'],
    additionalProperties: false,
    properties: {
      actions: {
        type: 'array',
        maxItems: 64,
        items: {
          oneOf: leviers.map((l) => ({
            type: 'object',
            required: ['levier', 'valeur'],
            additionalProperties: false,
            properties: { levier: { const: l.id }, valeur: l.valeur_schema },
            description: l.libelle,
          })),
        },
      },
      justification: { type: 'string', maxLength: 400 },
    },
  };
}

export const SCHEMA_ENTREE: Record<string, unknown> = {
  type: 'object',
  required: ['etat', 'plan_courant', 'decisions_des_autres'],
  properties: {
    etat: { type: 'object', description: 'état résumé de la grille à la minute courante' },
    derniere_note: { type: ['object', 'null'] },
    plan_courant: { type: 'object' },
    decisions_des_autres: { type: 'array' },
  },
};

export function construireQuestion(args: {
  decideur: Decideur; minute: number; etat: EtatResume; derniere_note: Note | null;
  plan_courant: EtatDecisions['plan']; decisions_des_autres: { decideur: Decideur; actions: Action[] }[]; lecons?: Lecon[];
  perturbations?: string[]; conflits?: string[]; nouvelles_perturbations?: boolean;
}): QuestionJev {
  return {
    version: 1,
    id: `${args.decideur}@${args.minute}`,
    decideur: args.decideur,
    minute: args.minute,
    consigne: `${ROLES[args.decideur]} ${REGLES.join(' ')}`,
    entree: { etat: args.etat, derniere_note: args.derniere_note, decisions_des_autres: args.decisions_des_autres, plan_courant: args.plan_courant, lecons: args.lecons ?? [], perturbations: args.perturbations ?? [], conflits: args.conflits ?? [], nouvelles_perturbations: args.nouvelles_perturbations ?? false },
    entree_schema: SCHEMA_ENTREE,
    reponse_schema: schemaReponse(args.decideur),
  };
}

// Valide une réponse brute (JSON déjà parsé) contre le menu du décideur, sans bibliothèque de schéma.
export function lireReponse(decideur: Decideur, brut: unknown): { actions: Action[]; erreurs: string[] } {
  const erreurs: string[] = [];
  if (typeof brut !== 'object' || brut === null || !Array.isArray((brut as ReponseJev).actions)) return { actions: [], erreurs: ['réponse : { actions: [...] } attendu'] };
  const actions: Action[] = [];
  for (const [i, a] of (brut as ReponseJev).actions.entries()) {
    if (typeof a !== 'object' || a === null || typeof a.levier !== 'string' || !('valeur' in a)) { erreurs.push(`actions[${i}] : {levier, valeur} attendu`); continue; }
    if (!trouverLevier(decideur, a.levier)) { erreurs.push(`actions[${i}] : levier « ${a.levier} » hors du menu de ${decideur}`); continue; }
    actions.push({ decideur, levier: a.levier, valeur: a.valeur });
  }
  if (actions.length > 64) erreurs.push('plus de 64 actions');
  return { actions: actions.slice(0, 64), erreurs };
}

// Client de décision injecté : Jev en production, un décideur déterministe en test.
export interface ClientDecision { decider(question: QuestionJev): Promise<ReponseJev> }
