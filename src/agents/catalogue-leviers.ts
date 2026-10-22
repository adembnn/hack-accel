// Les 46 leviers des 6 décideurs, tels que listés dans reports/catalogue-decisions-leviers.md §4
// (préfecture 8, RATP 8, sécurité du centre 10, directeur 9, UGC 7, BSPP 4).
// Chaque levier porte : bornes, délai décision → effet (minutes, H = hypothèse sauf source), contrainte, source.
// Un levier est exécutable : valider() applique les bornes, appliquer() enregistre la décision avec sa minute d'effet.
import type { Decideur, Scenario } from './types.ts';
import { PORTES } from './types.ts';
import type { EtatDecisions, Levier } from './leviers.ts';

export type TypeQuestion = 'oui_non' | 'choix' | 'score' | 'sous_ensemble' | 'oui_non_par_cible';

export interface LevierCatalogue {
  code: string;                           // P1, R2, S4, D1, U1, B3…
  decideur: Decideur;
  libelle: string;
  type: TypeQuestion;                     // type de question Jev correspondant : oui_non → noul, choix → choice, score → score
  options?: readonly string[];            // choix, sous_ensemble
  cibles?: readonly string[];             // oui_non_par_cible
  bornes?: { min: number; max: number | 'effectif' }; // score (H sauf mention)
  delai_min: [number, number];            // minutes entre la décision et son effet
  delai_source: string;                   // « H » ou la source
  contrainte: string;
  interdits?: readonly string[];          // options refusées par garde-fou (ex. alarme générale)
}

const NIVEAUX = ['0', '-1', '-2', '-3', '-4'];
const SECTION: Record<Decideur, string> = {
  prefecture: '§4.1', ratp: '§4.2', securite_centre: '§4.3', directeur: '§4.4', ugc: '§4.5', bspp: '§4.6',
};
const H = 'H';

export const CATALOGUE: readonly LevierCatalogue[] = [
  // ---- Préfecture (8) ----
  { code: 'P1', decideur: 'prefecture', libelle: 'Annoncer ou ne rien annoncer', type: 'oui_non', delai_min: [10, 40], delai_source: 'BFM, Le Parisien', contrainte: 'Doit publier au moins 12 h avant (tribunal administratif, 21 oct.)' },
  { code: 'P2', decideur: 'prefecture', libelle: 'Heure de début du couvre-feu', type: 'choix', options: ['22h', '23h', '24h'], delai_min: [0, 0], delai_source: 'immédiat', contrainte: 'Arrêté motivé, contestable devant le juge' },
  { code: 'P3', decideur: 'prefecture', libelle: 'Heure de début de l\'interdiction de manifester', type: 'choix', options: ['18h', '20h', '22h'], delai_min: [0, 0], delai_source: 'immédiat', contrainte: 'Arrêté motivé' },
  { code: 'P4', decideur: 'prefecture', libelle: 'Périmètre (Berger, Rambuteau, Sébastopol, Lingères, Maurice-Quentin, Breton)', type: 'choix', options: ['restreint', 'elargi'], delai_min: [0, 0], delai_source: 'immédiat', contrainte: 'Exceptions : résidents, travailleurs, secours, commerçants' },
  { code: 'P5', decideur: 'prefecture', libelle: 'Demander la fermeture de stations et son heure', type: 'choix', options: ['pas_de_fermeture', '22h', '20h30', 'tout_de_suite'], delai_min: [0, 0], delai_source: 'RATP applique sans préavis (Sortiraparis)', contrainte: 'Réouverture seulement sur accord de la police' },
  { code: 'P6', decideur: 'prefecture', libelle: 'Demander la fermeture du centre et de l\'UGC', type: 'oui_non', delai_min: [60, 180], delai_source: H, contrainte: 'Pas de texte public sur un ordre de fermeture sans incendie [?]' },
  { code: 'P7', decideur: 'prefecture', libelle: 'Camions, canons à eau, barrages sur accès', type: 'choix', options: ['aucun', 'rue_berger', 'berger_rambuteau'], delai_min: [15, 30], delai_source: H, contrainte: 'Scénario fixé d\'avance, jamais optimisé contre la foule' },
  { code: 'P8', decideur: 'prefecture', libelle: 'Renforts et messages aux exploitants (nombre d\'unités)', type: 'score', bornes: { min: 0, max: 20 }, delai_min: [5, 30], delai_source: H, contrainte: 'Forces déjà mobilisées' },
  // ---- RATP (8) ----
  { code: 'R1', decideur: 'ratp', libelle: 'Garder la station ouverte jusqu\'à l\'ordre', type: 'oui_non', delai_min: [0, 0], delai_source: 'immédiat', contrainte: 'Surcharge si tout le monde y va' },
  { code: 'R2', decideur: 'ratp', libelle: 'Fermer la station (sans arrêt, sans correspondance)', type: 'choix', options: ['22h', 'anticipe_30min', 'tout_de_suite'], delai_min: [0, 0], delai_source: 'à la demande, heure annoncée', contrainte: 'Réouverture sur accord de la police' },
  { code: 'R3', decideur: 'ratp', libelle: 'Fermer par étapes (une sortie du Forum vers le métro/RER)', type: 'choix', options: ['aucune', '1', '2', '3', '4', '5', '6', '7', '8'], delai_min: [5, 10], delai_source: H, contrainte: '8 sorties du Forum vers le métro/RER (Bonjour RATP)' },
  { code: 'R4', decideur: 'ratp', libelle: 'Offre de trains : sans arrêt, dérivation RER', type: 'choix', options: ['normale', 'reduite'], delai_min: [10, 20], delai_source: H, contrainte: 'Travaux en cours, RER B coupé après 22 h 45' },
  { code: 'R5', decideur: 'ratp', libelle: 'Annonces sonores en gare et écrans (nombre de messages)', type: 'score', bornes: { min: 0, max: 10 }, delai_min: [2, 5], delai_source: H, contrainte: 'Messages en deux langues [?]' },
  { code: 'R6', decideur: 'ratp', libelle: 'Contrôle des accès (filtrer, sens unique)', type: 'oui_non', delai_min: [5, 10], delai_source: H, contrainte: 'Le tapis roulant de Châtelet est à l\'arrêt' },
  { code: 'R7', decideur: 'ratp', libelle: 'Lever un doute colis (arrêt du trafic)', type: 'oui_non', delai_min: [30, 60], delai_source: 'RATP Group : 45 min en moyenne', contrainte: 'Hors périmètre du scénario de base, activable' },
  { code: 'R8', decideur: 'ratp', libelle: 'Renfort d\'agents de station et de sûreté', type: 'score', bornes: { min: 0, max: 20 }, delai_min: [15, 30], delai_source: H, contrainte: 'Effectifs non publics' },
  // ---- Sécurité du centre (10) ----
  { code: 'S1', decideur: 'securite_centre', libelle: 'Ouvrir ou fermer une porte précise', type: 'oui_non_par_cible', cibles: PORTES, delai_min: [2, 5], delai_source: H, contrainte: 'Sorties réglementaires non condamnables [?]' },
  { code: 'S2', decideur: 'securite_centre', libelle: 'Escaliers mécaniques : laisser, arrêter, sens sortie', type: 'choix', options: ['laisser', 'arreter', 'sens_sortie'], delai_min: [1, 3], delai_source: H, contrainte: 'CO 34 : 50 % comptent comme sorties ; règle d\'arrêt non lue [?]' },
  { code: 'S3', decideur: 'securite_centre', libelle: 'Condamner les ascenseurs', type: 'oui_non', delai_min: [1, 1], delai_source: H, contrainte: 'Piège les PMR : à coupler avec S6' },
  { code: 'S4', decideur: 'securite_centre', libelle: 'Annonce par zone ou niveau', type: 'choix', options: ['aucune', 'restreinte', 'generale'], interdits: ['generale'], delai_min: [1, 2], delai_source: H, contrainte: 'Alarme générale refusée par le produit (risque de panique)' },
  { code: 'S5', decideur: 'securite_centre', libelle: 'Placer les agents (nombre)', type: 'score', bornes: { min: 0, max: 'effectif' }, delai_min: [3, 10], delai_source: H, contrainte: 'Effectif non public ; un agent = un point' },
  { code: 'S6', decideur: 'securite_centre', libelle: 'Assistance PMR : espace d\'attente sécurisé par niveau', type: 'oui_non_par_cible', cibles: NIVEAUX, delai_min: [5, 15], delai_source: H, contrainte: 'EAS = zone à l\'abri (CO 34 §6)' },
  { code: 'S7', decideur: 'securite_centre', libelle: 'Phaser la sortie par vagues', type: 'choix', options: ['tous', '2_vagues', '3_vagues'], delai_min: [5, 5], delai_source: H, contrainte: 'Boutiques = locataires' },
  { code: 'S8', decideur: 'securite_centre', libelle: 'Confiner (garder dedans)', type: 'oui_non', delai_min: [0, 0], delai_source: 'immédiat', contrainte: 'Capacité d\'accueil de nuit inconnue [?]' },
  { code: 'S9', decideur: 'securite_centre', libelle: 'Filtrer les entrées (arrêter l\'entrée, sens unique)', type: 'oui_non', delai_min: [2, 5], delai_source: H, contrainte: 'Entrées par le métro' },
  { code: 'S10', decideur: 'securite_centre', libelle: 'Parking : sortie libre, par vagues ou fermé', type: 'choix', options: ['libre', 'par_vagues', 'ferme'], delai_min: [10, 10], delai_source: H, contrainte: 'Sortie rue Turbigo peut croiser un périmètre' },
  // ---- Directeur (9) ----
  { code: 'D1', decideur: 'directeur', libelle: 'Rester ouvert, fermer plus tôt, fermer maintenant', type: 'choix', options: ['horaire_normal', '20h', 'immediat'], delai_min: [10, 40], delai_source: 'Figaro 2025 ; BFM', contrainte: 'La fermeture fait suite à une demande préfectorale' },
  { code: 'D2', decideur: 'directeur', libelle: 'Fermer par étapes (niveaux, zones)', type: 'choix', options: ['1_etape', '2_etapes', '3_etapes'], delai_min: [5, 5], delai_source: H, contrainte: 'Locataires' },
  { code: 'D3', decideur: 'directeur', libelle: 'Portes finales et chemin', type: 'sous_ensemble', options: PORTES, delai_min: [5, 5], delai_source: H, contrainte: 'Éviter Berger et Rambuteau si le périmètre les inclut' },
  { code: 'D4', decideur: 'directeur', libelle: 'Évacuer ou confiner', type: 'oui_non', delai_min: [0, 0], delai_source: 'immédiat', contrainte: 'Pas de plan de nuit public [?]' },
  { code: 'D5', decideur: 'directeur', libelle: 'Messages aux visiteurs (écrans, haut-parleurs, langues)', type: 'choix', options: ['aucun', 'FR', 'FR_EN'], delai_min: [2, 2], delai_source: H, contrainte: 'Pas d\'alarme incendie' },
  { code: 'D6', decideur: 'directeur', libelle: 'Décalage de l\'heure de sortie des séances UGC (minutes)', type: 'score', bornes: { min: 0, max: 60 }, delai_min: [5, 15], delai_source: H, contrainte: 'UGC décide seul' },
  { code: 'D7', decideur: 'directeur', libelle: 'Demander à la préfecture un délai ou des renforts', type: 'oui_non', delai_min: [10, 30], delai_source: H, contrainte: 'La préfecture n\'est pas tenue de répondre' },
  { code: 'D8', decideur: 'directeur', libelle: 'Demander à la RATP de garder une bouche ouverte', type: 'oui_non', delai_min: [5, 15], delai_source: H, contrainte: 'R2 est décidé par la police' },
  { code: 'D9', decideur: 'directeur', libelle: 'Appeler la BSPP en renfort préventif', type: 'oui_non', delai_min: [5, 10], delai_source: H, contrainte: 'Hors incendie, seulement sur incident' },
  // ---- UGC (7) ----
  { code: 'U1', decideur: 'ugc', libelle: 'Laisser finir, arrêter ou retarder les séances', type: 'choix', options: ['laisser', 'arreter', 'retarder'], delai_min: [10, 30], delai_source: H, contrainte: '27 salles, ~3 800 places' },
  { code: 'U2', decideur: 'ugc', libelle: 'Phaser la vidange des salles', type: 'choix', options: ['tout', '2_vagues', '4_vagues'], delai_min: [5, 5], delai_source: H, contrainte: 'Plus long = plus tard dehors' },
  { code: 'U3', decideur: 'ugc', libelle: 'Annonce en salle', type: 'choix', options: ['employe', 'sonorisation', 'sonorisation_affichage'], delai_min: [1, 1], delai_source: H, contrainte: 'Annonce humaine le 19 oct.' },
  { code: 'U4', decideur: 'ugc', libelle: 'Sorties de salles utilisées', type: 'choix', options: ['hall_seul', 'toutes_issues'], delai_min: [1, 2], delai_source: H, contrainte: 'Issues de secours à usage réservé [?]' },
  { code: 'U5', decideur: 'ugc', libelle: 'Rembourser sur place', type: 'oui_non', delai_min: [0, 0], delai_source: 'immédiat', contrainte: 'Le 19 oct. : gardez votre ticket' },
  { code: 'U6', decideur: 'ugc', libelle: 'Fermer les prochaines séances de la soirée', type: 'oui_non', delai_min: [0, 0], delai_source: 'immédiat', contrainte: 'Séances de 9 h à minuit' },
  { code: 'U7', decideur: 'ugc', libelle: 'PMR et familles : sortie en dernier ou assistée', type: 'oui_non', delai_min: [2, 2], delai_source: H, contrainte: 'Peu de personnel de salle' },
  // ---- BSPP (4) ----
  { code: 'B1', decideur: 'bspp', libelle: 'Poste de secours avancé près des portes', type: 'oui_non', delai_min: [10, 10], delai_source: H, contrainte: 'Disponibilité en crise urbaine' },
  { code: 'B2', decideur: 'bspp', libelle: 'Direction des secours en cas de sinistre', type: 'oui_non', delai_min: [10, 10], delai_source: 'cible de 10 min (source secondaire)', contrainte: 'Déclenché par événement (incendie, accident)' },
  { code: 'B3', decideur: 'bspp', libelle: 'Levée de doute (colis, odeur, fumée)', type: 'oui_non', delai_min: [15, 60], delai_source: '2017 : environ 1 h', contrainte: 'Hors scénario de base, activable' },
  { code: 'B4', decideur: 'bspp', libelle: 'Évacuation médicale des blessés et PMR (nombre de personnes)', type: 'score', bornes: { min: 0, max: 20 }, delai_min: [15, 30], delai_source: H, contrainte: 'Peu de moyens, gros volumes' },
];

const estEntier = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

function borneMax(l: LevierCatalogue, sc: Scenario): number {
  return l.bornes ? (l.bornes.max === 'effectif' ? sc.effectif_securite : l.bornes.max) : 0;
}

export function validerCatalogue(l: LevierCatalogue, v: unknown, sc: Scenario): string[] {
  switch (l.type) {
    case 'oui_non': return typeof v === 'boolean' ? [] : [`${l.code} : booléen attendu`];
    case 'choix': {
      if (typeof v !== 'string' || !l.options?.includes(v)) return [`${l.code} : option hors de {${l.options?.join(', ')}}`];
      if (l.interdits?.includes(v)) return [`${l.code} : option « ${v} » interdite par le produit (${l.contrainte})`];
      return [];
    }
    case 'score': {
      const max = borneMax(l, sc);
      return estEntier(v) && v >= (l.bornes?.min ?? 0) && v <= max ? [] : [`${l.code} : entier de ${l.bornes?.min ?? 0} à ${max} attendu`];
    }
    case 'sous_ensemble':
      return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && l.options?.includes(x)) && new Set(v).size === v.length ? [] : [`${l.code} : sous-ensemble non vide et sans doublon de {${l.options?.join(', ')}}`];
    case 'oui_non_par_cible': {
      if (typeof v !== 'object' || v === null) return [`${l.code} : {cible, oui} attendu`];
      const x = v as Record<string, unknown>;
      return [...(typeof x.cible === 'string' && l.cibles?.includes(x.cible) ? [] : [`${l.code} : cible hors de {${l.cibles?.join(', ')}}`]), ...(typeof x.oui === 'boolean' ? [] : [`${l.code} : oui doit être booléen`])];
    }
  }
}

function schemaValeur(l: LevierCatalogue): Record<string, unknown> {
  switch (l.type) {
    case 'oui_non': return { type: 'boolean' };
    case 'choix': return { type: 'string', enum: (l.options ?? []).filter((o) => !l.interdits?.includes(o)) };
    case 'score': return { type: 'integer', minimum: l.bornes?.min ?? 0, maximum: l.bornes?.max === 'effectif' ? 'effectif du scénario' : l.bornes?.max };
    case 'sous_ensemble': return { type: 'array', items: { type: 'string', enum: [...(l.options ?? [])] }, minItems: 1, uniqueItems: true };
    case 'oui_non_par_cible': return { type: 'object', required: ['cible', 'oui'], properties: { cible: { type: 'string', enum: [...(l.cibles ?? [])] }, oui: { type: 'boolean' } } };
  }
}

function exemple(l: LevierCatalogue): unknown {
  switch (l.type) {
    case 'oui_non': return true;
    case 'choix': return (l.options ?? []).find((o) => !l.interdits?.includes(o));
    case 'score': return l.bornes?.min ?? 0;
    case 'sous_ensemble': return [(l.options ?? [])[0]];
    case 'oui_non_par_cible': return { cible: (l.cibles ?? [])[0], oui: true };
  }
}

// Décision enregistrée : valeur + minute de décision + minute d'effet (décision + délai minimal). Les consommateurs
// (simulateur, boucle) lisent hors_plan.catalogue[code] et ne l'appliquent qu'à partir de effectif_minute.
export interface DecisionEnregistree { valeur: unknown; decide_minute: number; effectif_minute: number; delai_source: string }

export function appliquerCatalogue(etat: EtatDecisions, l: LevierCatalogue, valeur: unknown, minute: number): EtatDecisions {
  const e = structuredClone(etat);
  const cat = (e.hors_plan.catalogue as Record<string, DecisionEnregistree> | undefined) ?? {};
  cat[l.code] = { valeur: structuredClone(valeur), decide_minute: minute, effectif_minute: minute + l.delai_min[0], delai_source: l.delai_source };
  e.hors_plan.catalogue = cat;
  // D1 est aussi le « mode » du Plan partagé (couture avec le simulateur).
  if (l.code === 'D1') e.plan.mode = valeur === 'horaire_normal' ? 'rester_ouvert' : valeur === 'immediat' ? 'fermer' : 'fermer_par_etapes';
  return e;
}

export function decisionsEnVigueur(etat: EtatDecisions, minute: number): Record<string, unknown> {
  const cat = (etat.hors_plan.catalogue as Record<string, DecisionEnregistree> | undefined) ?? {};
  return Object.fromEntries(Object.entries(cat).filter(([, d]) => d.effectif_minute <= minute).map(([c, d]) => [c, d.valeur]));
}

export function enLevier(l: LevierCatalogue): Levier {
  return {
    id: l.code,
    decideur: l.decideur,
    libelle: l.libelle,
    champ: l.code === 'D1' ? 'mode' : 'hors_plan',
    statut: 'source',
    source: `reports/catalogue-decisions-leviers.md ${SECTION[l.decideur]} ${l.code}`,
    limite: `${l.contrainte} ; délai ${l.delai_min[0]}-${l.delai_min[1]} min (${l.delai_source})`,
    valeur_schema: schemaValeur(l),
    exemple: exemple(l),
    valider: (v, ctx) => validerCatalogue(l, v, ctx.scenario),
    appliquer: (e, v) => appliquerCatalogue(e, l, v, Number((e.hors_plan.minute_courante as number | undefined) ?? 0)),
  };
}

export const LEVIERS_CATALOGUE: readonly Levier[] = CATALOGUE.map(enLevier);
export const parCode = (code: string): LevierCatalogue | undefined => CATALOGUE.find((l) => l.code === code);
