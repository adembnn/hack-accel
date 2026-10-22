// Les vrais leviers de chaque décideur, extraits de reports/contraintes-forum-des-halles.md (recherche du 22 oct. 2026).
// Règle du produit : un décideur ne peut choisir QUE dans son menu ; toute action hors menu ou hors domaine est refusée
// (instantané-3 §6, preuve 4). Chaque levier porte sa source et sa limite connue.
import type { Action, Decideur, Mode, Plan, Scenario, EtatPorte } from './types.ts';
import { MODES, PORTES, planInitial } from './types.ts';
import { LEVIERS_CATALOGUE } from './catalogue-leviers.ts';

export * from './catalogue-leviers.ts';

export type { Plan, Mode } from './types.ts';

const C = 'reports/contraintes-forum-des-halles.md';
export const PERIMETRE_COUVRE_FEU = [
  'place_maurice_quentin', 'rue_berger', 'passage_des_lingeres', 'bd_sebastopol', 'rue_rambuteau', 'allee_andre_breton',
] as const; // Le Parisien / franceinfo, contraintes §3

export const CHAMPS_PLAN = ['mode', 'portes', 'phasage_salles', 'guidage', 'messages_par_zone', 'confinement'] as const;
export type ChampPlan = (typeof CHAMPS_PLAN)[number];

// État manipulé par les leviers : le plan partagé + ce qui n'est pas (encore) un champ du plan (couture à demander, voir rapport).
export interface EtatDecisions { plan: Plan; hors_plan: Record<string, unknown> }
export function etatInitial(): EtatDecisions {
  return { plan: planInitial(), hors_plan: {} };
}

export interface ContexteLevier { scenario: Scenario; etat: EtatDecisions }

export interface Levier {
  id: string;
  decideur: Decideur;
  libelle: string;
  champ: ChampPlan | 'hors_plan';
  // 'source' = appui public cité ; 'bon_sens' = pratique d'opérateur sans texte (contraintes §5, en-tête).
  statut: 'source' | 'bon_sens';
  source: string;
  limite: string;
  // Description de la valeur attendue (sert au schéma de la question Jev).
  valeur_schema: Record<string, unknown>;
  exemple: unknown;
  valider(valeur: unknown, ctx: ContexteLevier): string[];
  appliquer(etat: EtatDecisions, valeur: unknown): EtatDecisions;
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const estEntier = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const clone = (e: EtatDecisions): EtatDecisions => structuredClone(e);
const INTERDIT_ALARME = /alarme\s+(g[ée]n[ée]rale|incendie)|\bincendie\b/i;

function valideMinute(m: unknown, ctx: ContexteLevier, nom: string): string[] {
  if (!estEntier(m)) return [`${nom} doit être un entier (minute du jour)`];
  if (m < ctx.scenario.minute_annonce || m > ctx.scenario.stations_fermees_minute)
    return [`${nom}=${m} hors de [${ctx.scenario.minute_annonce}, ${ctx.scenario.stations_fermees_minute}] (annonce → fermeture des stations)`];
  return [];
}

function planSet(etat: EtatDecisions, f: (p: Plan) => void): EtatDecisions {
  const e = clone(etat);
  f(e.plan);
  return e;
}
function horsPlanSet(etat: EtatDecisions, cle: string, valeur: unknown): EtatDecisions {
  const e = clone(etat);
  e.hors_plan[cle] = structuredClone(valeur);
  return e;
}

export const LEVIERS_NOYAU: readonly Levier[] = [
  // ---------------- Directeur du centre ----------------
  {
    id: 'mode', decideur: 'directeur', champ: 'mode', statut: 'bon_sens',
    libelle: 'Rester ouvert, fermer par étapes, ou fermer',
    source: `${C} §5 « Fixer l'heure de fermeture des boutiques et zones, par niveau » ; trois valeurs à confirmer par Adem (ticket D3)`,
    limite: 'Boutiques = locataires : le directeur coordonne, il ne commande pas toujours [?]',
    valeur_schema: { type: 'string', enum: [...MODES] }, exemple: 'fermer_par_etapes',
    valider: (v) => (typeof v === 'string' && (MODES as readonly string[]).includes(v) ? [] : [`mode inconnu : ${String(v)}`]),
    appliquer: (e, v) => planSet(e, (p) => { p.mode = v as Mode; }),
  },
  {
    id: 'porte', decideur: 'directeur', champ: 'portes', statut: 'source',
    libelle: 'Choisir quelles portes (9 + Canopée + parking) restent ouvertes',
    source: `${C} §5 et §2 (liste Westfield des accès)`,
    limite: "Trop de portes fermées = goulot ; les sorties réglementaires ne sont pas libres de fermeture [?] (le plan exige au moins 4 portes ouvertes tant qu'on n'est pas en mode fermer)",
    valeur_schema: { type: 'object', required: ['porte', 'etat'], properties: { porte: { type: 'string', enum: [...PORTES] }, etat: { type: 'string', enum: ['ouverte', 'fermee'] } } },
    exemple: { porte: 'berger', etat: 'fermee' },
    valider: (v, ctx) => {
      if (!estObjet(v)) return ['valeur attendue : {porte, etat}'];
      const r: string[] = [];
      if (typeof v.porte !== 'string' || !PORTES.includes(v.porte)) r.push(`porte inconnue : ${String(v.porte)}`);
      if (v.etat !== 'ouverte' && v.etat !== 'fermee') r.push(`état de porte inconnu : ${String(v.etat)}`);
      const bloquees = ((ctx.etat.hors_plan.perturbations as { portes_bloquees?: string[] } | undefined)?.portes_bloquees) ?? [];
      if (v.etat === 'ouverte' && typeof v.porte === 'string' && bloquees.includes(v.porte)) r.push(`la porte ${v.porte} est bloquée (perturbation B1) : impossible de l'ouvrir`);
      return r;
    },
    appliquer: (e, v) => planSet(e, (p) => { const x = v as { porte: string; etat: EtatPorte }; p.portes[x.porte] = x.etat; }),
  },
  {
    id: 'phasage_salle', decideur: 'directeur', champ: 'phasage_salles', statut: 'bon_sens',
    libelle: 'Phaser la sortie par niveau, secteur ou salle (heure de départ par salle)',
    source: `${C} §5 « Phaser par niveau / secteur » ; cinéma UGC 27 salles, ~3 800 places (§2)`,
    limite: 'Phasage entre niveaux : les escaliers deviennent le goulot',
    valeur_schema: { type: 'object', required: ['salle', 'minute_depart'], properties: { salle: { type: 'string', minLength: 1 }, minute_depart: { type: 'integer' } } },
    exemple: { salle: 'ugc_07', minute_depart: 1180 },
    valider: (v, ctx) => {
      if (!estObjet(v)) return ['valeur attendue : {salle, minute_depart}'];
      const r: string[] = [];
      if (typeof v.salle !== 'string' || !v.salle) r.push('salle vide');
      return r.concat(valideMinute(v.minute_depart, ctx, 'minute_depart'));
    },
    appliquer: (e, v) => planSet(e, (p) => {
      const x = v as { salle: string; minute_depart: number };
      p.phasage_salles = p.phasage_salles.filter((s) => s.salle !== x.salle).concat([{ salle: x.salle, minute_depart: x.minute_depart }]);
    }),
  },
  {
    id: 'confinement', decideur: 'directeur', champ: 'confinement', statut: 'bon_sens',
    libelle: "Confiner (garder les gens dedans) au lieu d'évacuer",
    source: `${C} §5 « Confinement »`,
    limite: "Après 22 h plus de métro ; le centre ferme à 20 h 30 ; durée et capacité d'accueil de nuit non prévues [?]",
    valeur_schema: { type: 'object', required: ['actif', 'zones'], properties: { actif: { type: 'boolean' }, zones: { type: 'array', items: { type: 'string' } } } },
    exemple: { actif: true, zones: ['niveau_-3'] },
    valider: (v) => {
      if (!estObjet(v) || typeof v.actif !== 'boolean' || !Array.isArray(v.zones) || !v.zones.every((z) => typeof z === 'string' && z)) return ['valeur attendue : {actif:boolean, zones:string[]}'];
      return v.actif && v.zones.length === 0 ? ['confinement actif sans zone'] : [];
    },
    appliquer: (e, v) => planSet(e, (p) => { const x = v as { actif: boolean; zones: string[] }; p.confinement = { actif: x.actif, zones: x.actif ? [...x.zones] : [] }; }),
  },
  {
    id: 'coordination_ugc_ratp', decideur: 'directeur', champ: 'hors_plan', statut: 'bon_sens',
    libelle: "Coordonner avec UGC et RATP l'heure de sortie du cinéma sur les trains encore actifs",
    source: `${C} §5 « Coordination avec UGC et RATP »`,
    limite: 'Le 19 oct. le cinéma a été prévenu « à la dernière minute » (Télérama)',
    valeur_schema: { type: 'object', required: ['minute_sortie_cinema'], properties: { minute_sortie_cinema: { type: 'integer' } } },
    exemple: { minute_sortie_cinema: 1190 },
    valider: (v, ctx) => (estObjet(v) ? valideMinute(v.minute_sortie_cinema, ctx, 'minute_sortie_cinema') : ['valeur attendue : {minute_sortie_cinema}']),
    appliquer: (e, v) => horsPlanSet(e, 'coordination_ugc_ratp', v),
  },
  {
    id: 'escalators', decideur: 'directeur', champ: 'hors_plan', statut: 'source',
    libelle: 'Escalators : marche, arrêt ou sens unique',
    source: `${C} §1 (CO 34 §4 : 50 % comptent comme sorties) et §5`,
    limite: "Règle d'arrêt en évacuation [?] ; pas encore un champ de Plan (couture à demander au lot #8)",
    valeur_schema: { type: 'string', enum: ['marche', 'arret', 'sens_unique_sortie'] }, exemple: 'sens_unique_sortie',
    valider: (v) => (['marche', 'arret', 'sens_unique_sortie'].includes(v as string) ? [] : [`mode d'escalator inconnu : ${String(v)}`]),
    appliquer: (e, v) => horsPlanSet(e, 'escalators', v),
  },
  {
    id: 'parking_vagues', decideur: 'directeur', champ: 'hors_plan', statut: 'bon_sens',
    libelle: 'Parking (~2 100 places, rue Turbigo) : évacuer les voitures en 1 à 3 vagues',
    source: `${C} §2 et §5 « Parking »`,
    limite: 'Sortie rue Turbigo : peut croiser un périmètre ; non étudié ; pas encore un champ de Plan',
    valeur_schema: { type: 'integer', minimum: 1, maximum: 3 }, exemple: 2,
    valider: (v) => (estEntier(v) && v >= 1 && v <= 3 ? [] : ['vagues attendues : entier de 1 à 3']),
    appliquer: (e, v) => horsPlanSet(e, 'parking_vagues', v),
  },
  // ---------------- Sécurité du centre ----------------
  {
    id: 'guidage', decideur: 'securite_centre', champ: 'guidage', statut: 'bon_sens',
    libelle: 'Placer des agents (portes, escaliers, ascenseurs)',
    source: `${C} §5 « Placer les agents » ; SSIAP / poste central de sécurité [?] §1`,
    limite: "Effectif inconnu (paramètre du scénario) ; un agent ne couvre qu'un point",
    valeur_schema: { type: 'object', required: ['point', 'agents'], properties: { point: { type: 'string', minLength: 1 }, agents: { type: 'integer', minimum: 0 } } },
    exemple: { point: 'porte_lescot', agents: 3 },
    valider: (v, ctx) => {
      if (!estObjet(v)) return ['valeur attendue : {point, agents}'];
      const r: string[] = [];
      if (typeof v.point !== 'string' || !v.point) r.push('point vide');
      if (!estEntier(v.agents) || v.agents < 0) r.push('agents : entier ≥ 0');
      else if (v.agents > ctx.scenario.effectif_securite) r.push(`agents=${v.agents} dépasse l'effectif disponible (${ctx.scenario.effectif_securite})`);
      return r;
    },
    appliquer: (e, v) => planSet(e, (p) => {
      const x = v as { point: string; agents: number };
      p.guidage = p.guidage.filter((g) => g.point !== x.point).concat(x.agents > 0 ? [{ point: x.point, agents: x.agents }] : []);
    }),
  },
  {
    id: 'message_zone', decideur: 'securite_centre', champ: 'messages_par_zone', statut: 'source',
    libelle: "Annonces sonores et écrans par zone (annonce « douce », jamais l'alarme générale)",
    source: `${C} §5 « Annonces sonores et écrans » ; §1 : alarme générale vs restreinte (MS 61 à 67)`,
    limite: 'Pas de traduction = touristes perdus ; une alarme incendie créerait une panique inutile',
    valeur_schema: { type: 'object', required: ['zone', 'texte'], properties: { zone: { type: 'string', minLength: 1 }, texte: { type: 'string', minLength: 1, maxLength: 280 } } },
    exemple: { zone: 'niveau_-2', texte: 'Le centre ferme. Rejoignez la sortie Lescot.' },
    valider: (v) => {
      if (!estObjet(v)) return ['valeur attendue : {zone, texte}'];
      const r: string[] = [];
      if (typeof v.zone !== 'string' || !v.zone) r.push('zone vide');
      if (typeof v.texte !== 'string' || !v.texte.trim()) r.push('texte vide');
      else {
        if (v.texte.length > 280) r.push('texte > 280 caractères');
        if (INTERDIT_ALARME.test(v.texte)) r.push('message qui évoque une alarme générale ou un incendie : interdit');
      }
      return r;
    },
    appliquer: (e, v) => planSet(e, (p) => { const x = v as { zone: string; texte: string }; p.messages_par_zone[x.zone] = x.texte.trim(); }),
  },
  // ---------------- RATP ----------------
  {
    id: 'heure_fermeture_stations', decideur: 'ratp', champ: 'hors_plan', statut: 'source',
    libelle: 'Heure de fermeture des stations Châtelet / Les Halles (au plus tard 22 h)',
    source: `${C} §3 : fermeture dès 22 h à la demande de la préfecture, sans correspondance (Le Parisien, Sortiraparis, actu.fr)`,
    limite: 'Réouverture sur autorisation de la préfecture, souvent sans préavis ; on ne peut pas dépasser 22 h',
    valeur_schema: { type: 'integer', description: 'minute du jour' }, exemple: 1320,
    valider: (v, ctx) => valideMinute(v, ctx, 'heure_fermeture_stations'),
    appliquer: (e, v) => horsPlanSet(e, 'heure_fermeture_stations', v),
  },
  {
    id: 'correspondances', decideur: 'ratp', champ: 'hors_plan', statut: 'source',
    libelle: 'Assurer ou non les correspondances tant que les stations sont ouvertes',
    source: `${C} §3 : « aucune correspondance » après la fermeture ; §6 critère 4 (continuité tant que le métro roule)`,
    limite: 'Aucun chiffre public de capacité de quai',
    valeur_schema: { type: 'boolean' }, exemple: true,
    valider: (v) => (typeof v === 'boolean' ? [] : ['booléen attendu']),
    appliquer: (e, v) => horsPlanSet(e, 'correspondances', v),
  },
  {
    id: 'sorties_metro', decideur: 'ratp', champ: 'hors_plan', statut: 'source',
    libelle: 'Sorties métro/RER du Forum ouvertes (8 sorties numérotées)',
    source: `${C} §2 (Bonjour RATP : 8 sorties, certaines avec ascenseur, d'autres escalators seulement)`,
    limite: "L'ascenseur est un goulot pour les personnes à mobilité réduite",
    valeur_schema: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 8 } }, exemple: [1, 2, 3, 4, 5, 6, 7, 8],
    valider: (v) => (Array.isArray(v) && v.every((n) => estEntier(n) && n >= 1 && n <= 8) && new Set(v).size === v.length ? [] : ["liste d'entiers distincts de 1 à 8 attendue"]),
    appliquer: (e, v) => horsPlanSet(e, 'sorties_metro', v),
  },
  // ---------------- Préfecture ----------------
  {
    id: 'minute_annonce', decideur: 'prefecture', champ: 'hors_plan', statut: 'source',
    libelle: "Heure de l'annonce du couvre-feu (carte de scénario « annonce à T ± x min »)",
    source: `${C} §0 écart 2 : annonce vers 19 h 20 (BFM, HuffPost)`,
    limite: "Jouable seulement avant l'annonce ; fixe ensuite",
    valeur_schema: { type: 'integer', description: 'minute du jour' }, exemple: 1160,
    valider: (v, ctx) => (estEntier(v) && v >= ctx.scenario.minute_annonce - 60 && v <= ctx.scenario.minute_annonce + 60 ? [] : [`minute_annonce hors de ± 60 min autour de ${ctx.scenario.minute_annonce}`]),
    appliquer: (e, v) => horsPlanSet(e, 'minute_annonce', v),
  },
  {
    id: 'perimetre_couvre_feu', decideur: 'prefecture', champ: 'hors_plan', statut: 'source',
    libelle: 'Périmètre du couvre-feu (rues Berger, Rambuteau, Sébastopol…)',
    source: `${C} §3 : périmètre publié (Le Parisien, franceinfo)`,
    limite: 'Exceptions : résidents, travailleurs, secours, commerçants',
    valeur_schema: { type: 'array', items: { type: 'string', enum: [...PERIMETRE_COUVRE_FEU] } }, exemple: [...PERIMETRE_COUVRE_FEU],
    valider: (v) => (Array.isArray(v) && v.every((z) => (PERIMETRE_COUVRE_FEU as readonly string[]).includes(z as string)) ? [] : ['zones hors du périmètre publié']),
    appliquer: (e, v) => horsPlanSet(e, 'perimetre_couvre_feu', v),
  },
  {
    id: 'demande_fermeture_stations', decideur: 'prefecture', champ: 'hors_plan', statut: 'source',
    libelle: 'Demander à la RATP la fermeture des stations',
    source: `${C} §3 : « à la demande de la préfecture » (Sortiraparis)`,
    limite: "La RATP exécute ; l'heure précise reste son levier",
    valeur_schema: { type: 'boolean' }, exemple: true,
    valider: (v) => (typeof v === 'boolean' ? [] : ['booléen attendu']),
    appliquer: (e, v) => horsPlanSet(e, 'demande_fermeture_stations', v),
  },
  {
    id: 'renforts_portes', decideur: 'prefecture', champ: 'hors_plan', statut: 'bon_sens',
    libelle: "Renforts de police autour d'une porte",
    source: `${C} §5 « Demander des renforts à la préfecture » ; §3 (camions, canons à eau, rondes Brav-M)`,
    limite: 'Forces déjà mobilisées, pas de garantie ; effectif non public (paramètre)',
    valeur_schema: { type: 'object', required: ['porte', 'effectif'], properties: { porte: { type: 'string', enum: [...PORTES] }, effectif: { type: 'integer', minimum: 0, maximum: 50 } } },
    exemple: { porte: 'berger', effectif: 10 },
    valider: (v) => {
      if (!estObjet(v)) return ['valeur attendue : {porte, effectif}'];
      const r: string[] = [];
      if (typeof v.porte !== 'string' || !PORTES.includes(v.porte)) r.push(`porte inconnue : ${String(v.porte)}`);
      if (!estEntier(v.effectif) || v.effectif < 0 || v.effectif > 50) r.push('effectif : entier de 0 à 50 (borne H)');
      return r;
    },
    appliquer: (e, v) => {
      const x = v as { porte: string; effectif: number };
      const courant = (e.hors_plan.renforts_portes as Record<string, number> | undefined) ?? {};
      return horsPlanSet(e, 'renforts_portes', { ...courant, [x.porte]: x.effectif });
    },
  },
];

// Menu complet : 16 leviers exécutables du noyau (Plan) + les 46 du catalogue (6 décideurs).
export const LEVIERS: readonly Levier[] = [...LEVIERS_NOYAU, ...LEVIERS_CATALOGUE];

// Contraintes imposées de l'extérieur : pas des leviers (rien ne les change dans le jeu).
export const CONTRAINTES_FIXES = [
  { id: 'couvre_feu_23h_6h', valeur: '23 h-6 h', source: `${C} §0 écart 1 (Le Parisien)` },
  { id: 'fermeture_stations_22h', valeur: '22 h', source: `${C} §3` },
  { id: 'pas_alarme_generale', valeur: 'interdit par le produit', source: `${C} §1 (alarme incendie = panique inutile)` },
] as const;

export function leviersDe(decideur: Decideur): Levier[] {
  return LEVIERS.filter((l) => l.decideur === decideur);
}
export function trouverLevier(decideur: Decideur, id: string): Levier | undefined {
  return LEVIERS.find((l) => l.decideur === decideur && l.id === id);
}

// Invariants du plan entier (indépendants de qui a agi).
export function verifierPlan(plan: Plan, scenario: Scenario, bloquees = 0): string[] {
  const r: string[] = [];
  for (const p of Object.keys(plan.portes)) if (!PORTES.includes(p)) r.push(`porte inconnue dans le plan : ${p}`);
  const ouvertes = Object.values(plan.portes).filter((e) => e === 'ouverte').length;
  const minimum = Math.min(4, PORTES.length - bloquees);
  if (plan.mode !== 'fermer' && ouvertes < minimum) r.push(`seulement ${ouvertes} portes ouvertes : minimum ${minimum} hors mode fermer (H, goulot)`);
  const agents = plan.guidage.reduce((s, g) => s + g.agents, 0);
  if (agents > scenario.effectif_securite) r.push(`${agents} agents placés pour un effectif de ${scenario.effectif_securite}`);
  for (const [z, t] of Object.entries(plan.messages_par_zone)) if (INTERDIT_ALARME.test(t)) r.push(`message de la zone ${z} évoque une alarme générale ou un incendie`);
  if (plan.confinement.actif && plan.confinement.zones.length === 0) r.push('confinement actif sans zone');
  for (const s of plan.phasage_salles)
    if (s.minute_depart < scenario.minute_annonce || s.minute_depart > scenario.stations_fermees_minute) r.push(`phasage de ${s.salle} hors fenêtre annonce → 22 h`);
  return r;
}

export interface ResultatApplication {
  etat: EtatDecisions;
  acceptees: Action[];
  refusees: { action: Action; raisons: string[] }[];
}

// Applique une liste d'actions d'UN décideur : refuse tout levier inconnu pour lui, toute valeur hors domaine,
// et toute action qui casserait un invariant du plan (annulée, les autres continuent).
export function appliquerActions(etat: EtatDecisions, actions: Action[], ctx: { scenario: Scenario }): ResultatApplication {
  const bloquees = ((etat.hors_plan.perturbations as { portes_bloquees?: string[] } | undefined)?.portes_bloquees ?? []).length;
  let courant = etat;
  const acceptees: Action[] = [];
  const refusees: { action: Action; raisons: string[] }[] = [];
  for (const a of actions) {
    const lev = trouverLevier(a.decideur, a.levier);
    if (!lev) { refusees.push({ action: a, raisons: [`levier « ${a.levier} » absent du menu de ${a.decideur}`] }); continue; }
    const raisons = lev.valider(a.valeur, { scenario: ctx.scenario, etat: courant });
    if (raisons.length) { refusees.push({ action: a, raisons }); continue; }
    const essai = lev.appliquer(courant, a.valeur);
    const casse = verifierPlan(essai.plan, ctx.scenario, bloquees);
    if (casse.length) { refusees.push({ action: a, raisons: casse }); continue; }
    courant = essai;
    acceptees.push(a);
  }
  return { etat: courant, acceptees, refusees };
}
