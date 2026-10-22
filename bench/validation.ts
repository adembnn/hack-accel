// Validation scientifique : notre modèle reproduit-il des résultats PUBLIÉS ? Test par test : valeur de référence, source,
// valeur simulée, tolérance, verdict honnête (« passe », « échoue », « non applicable »). Un test qui échoue reste affiché
// comme échoué, avec la raison : on ne règle jamais le modèle ni la tolérance après avoir vu le résultat.
// C'est l'inverse du benchmark de plans : ici on vérifie que le modèle fait ce que la science mesure.
// Lancer : node bench/validation.ts   (écrit bench/validation.csv). Détail du cadre : reports/maths-5-statistiques-validation.md §4.
// Chaque valeur de référence vient d'un rapport du dépôt (section citée) ; sinon le test est « non applicable ».
// MODÈLE SIMPLIFIÉ, NON CERTIFIÉ : vérification de composants, pas une validation ISO.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { creerPopulation, creerSimulation, simuler, SALLES } from '../src/sim/behavior/simuler.ts';
import { creerMouvementSimple, DEBIT_PAR_METRE } from '../src/sim/behavior/mouvement-simple.ts';
import { medianePreset, PRESET_PLANCHER, tirerDelaiLogLogistique, multiplicateurDelai } from '../src/sim/behavior/depart.ts';
import { creerRng, creerRngPersonne, CANAL } from '../src/sim/behavior/rng.ts';
import { debitWeidmann, vitesseWeidmann } from '../src/sim/metrics/pression.ts';
import type { Intention, Issue, Mouvement, Personne, Plan, Scene } from '../src/sim/behavior/types.ts';
import { PLAN_APRES, PLAN_AVANT } from './scenarios.ts';
import { ecartType, ligneCsv, moyenne, SEUIL_MODELE_PCT } from './stats.ts';

export type Verdict = 'passe' | 'échoue' | 'non applicable';

export interface Resultat {
  id: string;
  titre: string;
  /** Ce que le test vérifie, en une phrase. */
  verifie: string;
  /** Valeur de référence publiée (texte lisible, unité comprise). */
  reference: string;
  /** Source : auteur, année, section du rapport du dépôt qui la cite. */
  source: string;
  url: string;
  simule: string;
  tolerance: string;
  verdict: Verdict;
  explication: string;
}

export const COLONNES_CSV = ['id', 'titre', 'ce_qui_est_verifie', 'valeur_reference', 'source', 'url', 'valeur_simulee', 'tolerance', 'verdict', 'explication'] as const;
export const PHRASE_FINALE = "Vérification de composants (NIST TN 1822, logique ISO 20414), pas une validation ISO : le Forum n'est pas évacué pour autant comme prévu.";

// ---------- Outils de scène et de mouvement ----------

const f = (x: number, d = 2): string => x.toFixed(d).replace('.', ',');
const pct = (x: number, d = 1): string => `${f(100 * x, d)} %`;
const ecartRelPct = (sim: number, ref: number): number => (100 * (sim - ref)) / ref;
const dans = (x: number, lo: number, hi: number): boolean => x >= lo && x <= hi;

function issue(id: string, distance_m: number, largeur_m: number, surface_approche_m2 = 100): Issue {
  return { id, nom: id, distance_m, largeur_m, surface_approche_m2, porte_entree: false, visible: true, ouverte: true, derriere: 'sur', zone: 'zone_test' };
}
const scene = (nom: string, issues: Issue[]): Scene => ({ nom, issues, surface_salle_m2: 1000 });

/** Suivi d'un mouvement : instant du premier pas de marche et instant de sortie de chaque personne, issue utilisée. */
function espion(): { mouvement: Mouvement; debut: Map<number, number>; sorties: { id: number; issue: string; t: number }[] } {
  const m = creerMouvementSimple();
  const debut = new Map<number, number>();
  const sorties: { id: number; issue: string; t: number }[] = [];
  const mouvement: Mouvement = {
    init: (s, p) => m.init(s, p),
    pas(dt, t, intentions, ouvertes) {
      for (const it of intentions) if (it.etat === 'marche' && !debut.has(it.id)) debut.set(it.id, t);
      const r = m.pas(dt, t, intentions, ouvertes);
      for (const s of r.sorties) sorties.push({ id: s.id, issue: s.issue_id, t: t + dt });
      return r;
    },
    restantes: () => m.restantes(),
  };
  return { mouvement, debut, sorties };
}

/**
 * Fait marcher des personnes (vitesse, issue) tout droit vers leur issue, toutes au même instant, avec le mouvement de test seul
 * (sans le comportement). Rend l'instant de sortie de chacune et la densité maximale de la zone d'approche, seconde par seconde.
 */
function marcher(s: Scene, specs: { vitesse: number; issue: string }[], dt = 0.1) {
  const mv = creerMouvementSimple();
  const gens: Personne[] = specs.map((p, id) => ({ id, salle: SALLES[0], groupe: 0, mobilite_reduite: false, vitesse_m_s: p.vitesse, delai_s: 0, suivisme: 0, connait_secours: true, confiance: 1 }));
  mv.init(s, gens);
  const sortie: number[] = new Array(specs.length).fill(NaN);
  const intentions: Intention[] = specs.map((p, id) => ({ id, sortie_cible: p.issue, vitesse_voulue_m_s: p.vitesse, groupe: 0, etat: 'marche' }));
  const ouvertes = Object.fromEntries(s.issues.map((i) => [i.id, true]));
  const densite: number[] = []; // une valeur par seconde simulée
  let t = 0;
  while (mv.restantes() > 0 && t < 7200) {
    const r = mv.pas(dt, t, intentions, ouvertes);
    t += dt;
    for (const x of r.sorties) sortie[x.id] = t;
    if (Math.abs(t - Math.round(t)) < dt / 2) densite.push(Math.max(0, ...Object.values(r.densite_par_zone)));
  }
  return { sortie, densite, fin: t };
}

/** Plan « fermer » sans message ni guidage : départ ordonné, clarté par défaut (voir simuler.ts). */
const PLAN_SIMPLE: Plan = { mode: 'fermer', portes: [], phasage_salles: [], guidage: null, messages_par_zone: [], confinement: false };

const GRAINES = (n: number, debut = 1): number[] => Array.from({ length: n }, (_, k) => debut + k);

// ---------- Les tests ----------

const URL_RIMEA = 'https://link.springer.com/article/10.1007/978-3-319-27753-0_8';
const URL_IMO = 'https://imorules.com/GUID-9EC122B0-DBCC-405B-8650-82D745790F54.html';
const SRC_RIMEA = 'RiMEA guide v2.2.1 (Crowd Control/Siemens, Springer), rapport maths-5 §4';

function rimea1(): Resultat {
  const s = scene('couloir 40 m', [issue('couloir', 40, 10)]);
  const t = marcher(s, [{ vitesse: 1.33, issue: 'couloir' }]).sortie[0];
  return {
    id: '1', titre: 'RiMEA 1 : une personne, couloir de 40 m',
    verifie: 'Une personne à 1,33 m/s traverse 40 m en un temps plausible (mouvement de test seul).',
    reference: '26 à 34 s (40 / 1,33 = 30,1 s)', source: SRC_RIMEA, url: URL_RIMEA,
    simule: `${f(t, 1)} s`, tolerance: '26 à 34 s', verdict: dans(t, 26, 34) ? 'passe' : 'échoue',
    explication: 'Test de composant : le mouvement fait marcher en ligne droite à la vitesse donnée, puis sert la file au débit de la porte.',
  };
}

function rimea5(): Resultat {
  // 6 salles x 20 personnes, départs échelonnés par salle (10 à 60 s) en plus du délai propre à chaque personne (10 à 100 s et plus)
  const phasage = SALLES.map((salle, k) => ({ salle, delai_s: 10 + 10 * k }));
  const plan: Plan = { ...PLAN_SIMPLE, phasage_salles: phasage };
  const e = espion();
  const opts = { scene: scene('salle', [issue('A', 20, 6, 300), issue('B', 25, 6, 300)]), mouvement: e.mouvement, personnes_par_salle: 20 };
  const sim = creerSimulation(opts.scene, 7, opts);
  while (sim.t_s < 600 && !sim.fini()) sim.pas(1, plan);
  const attendu = (p: Personne) => (phasage.find((x) => x.salle === p.salle)?.delai_s ?? 0) + p.delai_s * multiplicateurDelai({ clarte: 0.6, guide: false, ordonne: true });
  let n = 0;
  let pireEcart = 0;
  let min = Infinity;
  let max = 0;
  for (const p of sim.personnes) {
    const a = attendu(p);
    const obs = e.debut.get(p.id);
    if (a > 590) continue; // part après l'horizon du test
    n++;
    min = Math.min(min, a);
    max = Math.max(max, a);
    pireEcart = Math.max(pireEcart, obs === undefined ? Infinity : Math.abs(obs - a));
  }
  return {
    id: '2', titre: 'RiMEA 5 : délais de départ fixés',
    verifie: 'Chaque personne commence à marcher à l’instant de départ qui lui a été fixé (phasage de salle + délai personnel).',
    reference: 'chaque personne part à son heure (délais 10 à 100 s)', source: SRC_RIMEA, url: URL_RIMEA,
    simule: `${n} personnes, délais de ${f(min, 0)} à ${f(max, 0)} s, pire écart ${f(pireEcart, 2)} s`, tolerance: 'écart < 1 s (pas de temps du moteur)',
    verdict: n > 0 && pireEcart < 1 ? 'passe' : 'échoue',
    explication: 'Le moteur avance par pas de 1 s : l’heure observée est l’heure fixée arrondie au pas supérieur (écart inférieur à 1 s).',
  };
}

function rimea8(): Resultat {
  const s = scene('couloir large', [issue('A', 60, 3, 200)]);
  const total = (v: number) => Math.max(...marcher(s, Array.from({ length: 50 }, () => ({ vitesse: v, issue: 'A' }))).sortie);
  const [lent, normal, vite] = [0.8, 1.2, 1.6].map(total);
  const largeur = (w: number) => Math.max(...marcher(scene('porte', [issue('A', 30, w, 200)]), Array.from({ length: 100 }, () => ({ vitesse: 1.2, issue: 'A' }))).sortie);
  const [etroite, large] = [largeur(1), largeur(3)];
  const ok = lent > normal && normal > vite && etroite > large;
  return {
    id: '3', titre: 'RiMEA 8 : un paramètre individuel change le temps total',
    verifie: 'Plus la vitesse de marche est grande, plus le temps total baisse ; une porte plus large vide plus vite.',
    reference: 'sens attendu : temps décroissant avec la vitesse (3 niveaux)', source: SRC_RIMEA, url: URL_RIMEA,
    simule: `0,8 / 1,2 / 1,6 m/s : ${f(lent, 1)} / ${f(normal, 1)} / ${f(vite, 1)} s ; porte 1 m contre 3 m : ${f(etroite, 1)} contre ${f(large, 1)} s`,
    tolerance: 'ordre strict des temps', verdict: ok ? 'passe' : 'échoue',
    explication: 'Test de sens, pas de valeur : 50 personnes, une porte de 3 m, vitesses identiques dans chaque essai.',
  };
}

function rimea9(): Resultat {
  const sans_delai = { contexte: 0.01, forme: PRESET_PLANCHER.forme, p_reste: 0 }; // RiMEA 9 n'a pas de pré-mouvement
  const issues = (k: number) => Array.from({ length: k }, (_, j) => issue(`P${j + 1}`, 30, 1.2, 150));
  const temps = (k: number, graine: number) => simuler(PLAN_SIMPLE, graine, 7200, { scene: scene(`${k} sorties`, issues(k)), population_par_salle: { salle_01: 1000 }, depart: sans_delai }).duree_s;
  const rapports = GRAINES(5).map((g) => temps(4, g) / temps(2, g));
  const r = moyenne(rapports);
  return {
    id: '4', titre: 'RiMEA 9 : 1 000 personnes, 4 sorties puis 2',
    verifie: 'Fermer 2 sorties sur 4 environ double le temps d’évacuation (rapport temps(4) / temps(2)).',
    reference: 'rapport entre 0,4 et 0,6', source: SRC_RIMEA, url: URL_RIMEA,
    simule: `rapport moyen ${f(r, 2)} (5 graines, de ${f(Math.min(...rapports), 2)} à ${f(Math.max(...rapports), 2)})`, tolerance: '0,4 à 0,6', verdict: dans(r, 0.4, 0.6) ? 'passe' : 'échoue',
    explication: 'Sorties identiques (30 m, 1,2 m de large), départs sans délai de pré-mouvement comme dans le test RiMEA ; le débit proportionnel à la largeur donne un rapport proche de 0,5.',
  };
}

function rimea10(): Resultat {
  const s = scene('3 portes', [issue('A', 40, 2.4, 200), issue('B', 40, 2.4, 200), issue('C', 40, 2.4, 200)]);
  const part = (plan: Plan, graine: number): number => {
    const e = espion();
    simuler(plan, graine, 3600, { scene: s, mouvement: e.mouvement, population_par_salle: { salle_01: 60 } });
    return e.sorties.filter((x) => x.issue === 'B').length / e.sorties.length;
  };
  const message: Plan = { ...PLAN_SIMPLE, messages_par_zone: [{ zone: 'salle_01', issue_id: 'B', clarte: 1, a_partir_de_s: 0 }] };
  const guide: Plan = { ...PLAN_SIMPLE, guidage: { issue_id: 'B', personnel: 100 } };
  const gs = GRAINES(20);
  const pm = moyenne(gs.map((g) => part(message, g)));
  const pg = moyenne(gs.map((g) => part(guide, g)));
  return {
    id: '5', titre: 'RiMEA 10 : suivre l’issue assignée',
    verifie: 'Avec une consigne claire (message) ou un guidage, la grande majorité sort par l’issue indiquée (3 portes identiques, hasard attendu : 33 %).',
    reference: 'grande majorité par l’issue assignée (RiMEA ne chiffre pas)', source: SRC_RIMEA, url: URL_RIMEA,
    simule: `message clair : ${pct(pm, 0)} ; guidage de tous : ${pct(pg, 0)} (20 graines)`, tolerance: 'au moins 70 % (seuil du test, choisi avant la mesure)',
    verdict: pm >= 0.7 && pg >= 0.7 ? 'passe' : 'échoue',
    explication: 'Le poids de la consigne (2,739 x confiance x clarté) est un logit : il oriente, il n’oblige pas. Le seuil de 70 % est le nôtre, la norme ne fixe pas de nombre.',
  };
}

function rimea11(): Resultat {
  const s = scene('porte proche et porte lointaine', [issue('proche', 30, 2.4, 200), issue('loin', 60, 2.4, 200)]);
  const parts = GRAINES(20).map((g) => {
    const e = espion();
    simuler(PLAN_SIMPLE, g, 3600, { scene: s, mouvement: e.mouvement, population_par_salle: { salle_01: 200 } });
    return e.sorties.filter((x) => x.issue === 'proche').length / e.sorties.length;
  });
  const proche = moyenne(parts);
  const loin = 1 - proche;
  return {
    id: '6', titre: 'RiMEA 11 : choix de l’issue',
    verifie: 'Plus de monde choisit la porte proche, mais au moins 20 % prennent l’autre (délestage).',
    reference: 'plus de monde vers la proche, au moins 20 % vers l’autre', source: SRC_RIMEA, url: URL_RIMEA,
    simule: `proche ${pct(proche, 0)}, lointaine ${pct(loin, 0)} (20 graines, 200 personnes)`, tolerance: 'proche > lointaine et lointaine >= 20 %',
    verdict: proche > loin && loin >= 0.2 ? 'passe' : 'échoue',
    explication: 'Deux portes de même largeur, à 30 m et 60 m. Le délestage vient de l’attente en file dans le coût de chaque porte.',
  };
}

function rimea12(): Resultat {
  const rng = creerRng(12);
  const specs = Array.from({ length: 100 }, () => ({ vitesse: Math.min(1.6, Math.max(0.8, rng.normal(1.2, 0.2))), issue: 'goulot' }));
  const r = marcher(scene('goulot 1,2 m', [issue('goulot', 25, 1.2, 30)]), specs);
  const pic = Math.max(...r.densite);
  const tPic = r.densite.indexOf(pic) + 1;
  const montee = r.densite[0] < pic && tPic > 1;
  return {
    id: '7', titre: 'RiMEA 12 (partiel) : densité avant le goulot, pas après',
    verifie: 'La densité de la zone d’approche monte quand la foule arrive au goulot (partie « avant » seulement).',
    reference: 'densité forte en amont du goulot, faible en aval', source: SRC_RIMEA, url: URL_RIMEA,
    simule: `amont : pic ${f(pic, 2)} pers./m² à ${tPic} s, vide en fin ; aval : 0 par construction`, tolerance: 'pic amont >= 2 pers./m²',
    verdict: pic >= 2 && montee ? 'passe' : 'échoue',
    explication: 'PARTIEL : le modèle n’a pas de zone en aval (les gens disparaissent à la porte), donc « pas de densité après » est vrai par construction et ne prouve rien. Seule la montée en amont est testée.',
  };
}

function imo4(): Resultat {
  const s = scene('sortie 1 m', [issue('porte', 10, 1, 50)]);
  const r = marcher(s, Array.from({ length: 100 }, () => ({ vitesse: 1.2, issue: 'porte' })));
  const t = r.sortie.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  const debit = (t.length - 1) / (t[t.length - 1] - t[0]);
  return {
    id: '8', titre: 'IMO 4 : débit d’une sortie de 1 m',
    verifie: '100 personnes devant une sortie de 1 m : le débit ne dépasse pas la limite de la circulaire.',
    reference: 'débit <= 1,33 pers./s', source: 'IMO MSC.1/Circ.1533 (test 4), rapport maths-5 §4', url: URL_IMO,
    simule: `${f(debit, 2)} pers./s`, tolerance: '<= 1,33 pers./s', verdict: debit <= 1.33 ? 'passe' : 'échoue',
    explication: `TAUTOLOGIE : le débit est fixé par construction à ${f(DEBIT_PAR_METRE, 1)} pers./s par mètre de largeur (SFPE). Ce test vérifie que le code applique cette valeur, pas que la valeur est juste (voir Jülich).`,
  };
}

function julich(): Resultat {
  const mesure = (largeur: number) => {
    const r = marcher(scene(`goulot ${largeur} m`, [issue('g', 10, largeur, 100)]), Array.from({ length: 60 }, () => ({ vitesse: 1.2, issue: 'g' })));
    const t = r.sortie.slice().sort((a, b) => a - b);
    return (t.length - 1) / (t[t.length - 1] - t[0]) / largeur;
  };
  const js = moyenne([0.8, 1.0, 1.2].map(mesure));
  const ecart = ecartRelPct(js, 1.9);
  return {
    id: '9', titre: 'Jülich : débit spécifique d’un goulot',
    verifie: 'Le débit par mètre de largeur d’une porte (largeurs 0,8 à 1,2 m, 60 personnes) est comparé aux mesures de laboratoire.',
    reference: '1,9 pers./(m·s) (goulots 0,8 à 1,2 m, 20 à 60 personnes)', source: 'Seyfried et al. (Jülich), rapport maths-5 §4', url: 'https://arxiv.org/pdf/physics/0702004v2',
    simule: `${f(js, 2)} pers./(m·s), écart ${f(ecart, 0)} %`, tolerance: `± ${SEUIL_MODELE_PCT} % (incertitude entre logiciels de référence, RiMEA)`,
    verdict: Math.abs(ecart) <= SEUIL_MODELE_PCT ? 'passe' : 'échoue',
    explication: 'ÉCHEC ASSUMÉ : notre 1,3 est la valeur de dimensionnement SFPE, prudente ; les gens réels passent plus vite en laboratoire. L’écart est le résultat, il est publié et non corrigé : nos temps d’évacuation sont plutôt pessimistes sur ce point.',
  };
}

function weidmann(): Resultat[] {
  const v175 = vitesseWeidmann(1.75);
  const v4 = vitesseWeidmann(4);
  let rhoMax = 0;
  let jMax = 0;
  for (let rho = 0.1; rho < 5.3; rho += 0.01) if (debitWeidmann(rho) > jMax) { jMax = debitWeidmann(rho); rhoMax = rho; }
  const ok = Math.abs(v175 - 0.7) <= 0.02 && Math.abs(jMax - 1.22) <= 0.02 && Math.abs(rhoMax - 1.75) <= 0.1 && Math.abs(v4 - 0.16) <= 0.02;
  const src = 'Weidmann 1993, forme de Eq. 2 dans arXiv 0810.4590, rapport maths-4 §3';
  const url = 'https://arxiv.org/pdf/0810.4590';
  return [
    {
      id: '10a', titre: 'Weidmann 1993 : fonctions de pression.ts',
      verifie: 'vitesseWeidmann et debitWeidmann redonnent le diagramme fondamental publié (v0 1,34 ; γ 1,913 ; ρmax 5,4).',
      reference: 'v(1,75) = 0,70 m/s ; débit max 1,22 pers./(m·s) vers 1,75 pers./m² ; v(4) = 0,16 m/s', source: src, url,
      simule: `v(1,75) = ${f(v175)} m/s ; débit max ${f(jMax)} à ${f(rhoMax)} pers./m² ; v(4) = ${f(v4)} m/s`, tolerance: '± 0,02 sur v et le débit, ± 0,1 sur la densité',
      verdict: ok ? 'passe' : 'échoue',
      explication: 'Vérification de la formule codée (les valeurs de référence viennent du calcul du rapport sur cette même formule), pas une mesure indépendante.',
    },
    {
      id: '10b', titre: 'Weidmann 1993 : mouvement de test',
      verifie: 'La vitesse du mouvement de test baisse-t-elle avec la densité comme le diagramme de Weidmann ?',
      reference: 'même courbe que ci-dessus (test proposé, rapport maths-4 §3 : flux ≈ 1,2 x largeur vers 1,75 pers./m², ± 20 %)', source: src, url,
      simule: 'sans objet', tolerance: 'sans objet', verdict: 'non applicable',
      explication: 'Le mouvement de test est un modèle de files : marche en ligne droite à vitesse constante puis service à débit fixe, sans relation vitesse-densité (voir bench/PLANS.md). Il n’a pas de diagramme fondamental à comparer. À tester quand foule-mouvement fournira les vitesses.',
    },
  ];
}

function forssberg(): Resultat[] {
  const rng = creerRng(2019);
  const tirages = Array.from({ length: 5000 }, () => tirerDelaiLogLogistique(rng, medianePreset(PRESET_PLANCHER), PRESET_PLANCHER.forme)).sort((a, b) => a - b);
  const med = (tirages[2499] + tirages[2500]) / 2;
  const moy = moyenne(tirages);
  const sd = ecartType(tirages);
  const ligne = (id: string, nom: string, ref: number, sim: number): Resultat => {
    const ecart = ecartRelPct(sim, ref);
    return {
      id, titre: `Forssberg 2019 : ${nom} du délai de départ`,
      verifie: `${nom[0].toUpperCase()}${nom.slice(1)} de 5 000 délais tirés (préréglage plancher) contre les 891 spectateurs de cinéma, alarme vocale.`,
      reference: `${f(ref, 1)} s`, source: 'Forssberg et al., Fire Technology 55(6), 2019, tableau 6 (cinéma, voix, 891 pers. : médiane 40,5 s, moyenne 44,0 s, écart-type 18,0 s, min 17, max 138), rapport maths-2 §1', url: 'https://link.springer.com/article/10.1007/s10694-019-00881-1',
      simule: `${f(sim, 1)} s, écart ${f(ecart, 1)} %`, tolerance: '± 10 % (une loi ajustée doit retrouver les moments de ses données)',
      verdict: Math.abs(ecart) <= 10 ? 'passe' : 'échoue',
      explication: id === '11c'
        ? 'ÉCHEC ASSUMÉ : la loi log-logistique ajustée (médiane 40,5 ; forme 5,8) sous-estime la dispersion mesurée, comme l’annonce le rapport maths-2 §1 (≈ 14 contre 18). Les départs très tardifs sont donc un peu sous-représentés.'
        : id === '11b' ? 'La loi ajustée donne une moyenne un peu plus basse que la moyenne observée (rapport maths-2 §1 : 42,6 contre 44,0).' : 'La médiane est le paramètre d’échelle de la loi : l’accord est attendu.',
    };
  };
  return [ligne('11a', 'médiane', 40.5, med), ligne('11b', 'moyenne', 44.0, moy), ligne('11c', 'écart-type', 18.0, sd)];
}

function groupes(): Resultat[] {
  const graines = GRAINES(10);
  const seuls: number[] = [];
  const parTaille: number[][] = [];
  for (const g of graines) {
    const gens = creerPopulation(g, { part_groupes: 0.7 });
    const taille = new Map<number, number>();
    for (const p of gens) if (p.groupe) taille.set(p.groupe, (taille.get(p.groupe) ?? 0) + 1);
    const nSeuls = gens.filter((p) => !p.groupe).length;
    seuls.push(nSeuls / gens.length);
    const unites = nSeuls + taille.size;
    const part = (k: number) => (k === 1 ? nSeuls : [...taille.values()].filter((x) => (k === 5 ? x >= 5 : x === k)).length) / unites;
    parTaille.push([1, 2, 3, 4, 5].map(part));
  }
  const moy = [0, 1, 2, 3, 4].map((k) => moyenne(parTaille.map((l) => l[k])));
  const ref = [0.52, 0.31, 0.12, 0.038, 0.011];
  const pire = Math.max(...moy.map((m, k) => Math.abs(m - ref[k])));
  const seul = moyenne(seuls);
  const src = 'Moussaïd et al. 2010, PLoS ONE (rue de Toulouse, samedi : 70 % en groupe), rapport maths-3 §1.1 et §1.2';
  const url = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2850937';
  return [
    {
      id: '12a', titre: 'Moussaïd 2010 : part de personnes seules',
      verifie: 'Avec 70 % de personnes en groupe demandé, la population tirée contient la part de personnes seules attendue.',
      reference: '30 % de personnes seules (70 % en groupe le samedi ; 55 % en semaine)', source: src, url,
      simule: `${pct(seul)} seules (10 graines, 3 000 personnes)`, tolerance: '± 3 points', verdict: Math.abs(seul - 0.3) <= 0.03 ? 'passe' : 'échoue',
      explication: 'Part imposée par construction (λ = −ln(1 − 0,7)). Le 70 % est celui d’un samedi de shopping : aucune mesure pour un soir de cinéma.',
    },
    {
      id: '12b', titre: 'Moussaïd 2010 : répartition des tailles',
      verifie: 'Taille des unités (seul, paire, trio, quatuor, 5 et plus) : les paires dominent parmi les groupes, loi de Poisson tronquée à zéro.',
      reference: 'seuls 52 % ; paires 31 % ; trios 12 % ; quatuors 3,8 % ; 5 et plus 1,1 % (calcul du rapport pour λ = 1,2)',
      source: `${src} (valeurs de λ ajustées illisibles dans l'article : référence = calcul du rapport, pas mesure directe)`, url,
      simule: `${moy.map((m) => pct(m, 1)).join(' ; ')}`, tolerance: '± 3 points sur chaque classe',
      verdict: pire <= 0.03 ? 'passe' : 'échoue',
      explication: 'Vérifie que le code tire bien la loi décrite. Écart maximal observé : ' + f(100 * pire, 1) + ' points. Qualitativement, Moussaïd observe des groupes de 2 à 4, les paires les plus fréquentes.',
    },
  ];
}

function changementAvis(): Resultat {
  const parPlan = ([PLAN_AVANT, PLAN_APRES] as Plan[]).map((p) => moyenne(GRAINES(20, 101).map((g) => simuler(p, g, 14400).stats.part_ayant_change)));
  const m = moyenne(parPlan);
  return {
    id: '13', titre: 'Changement d’avis : part de personnes qui changent d’issue',
    verifie: 'Part de personnes ayant changé d’issue au moins une fois, scène illustrative, plans avant et après (20 graines chacun).',
    reference: '3 à 12 % (0 à 7,5 % en vraies foules, Liao 2017 ; 7 à 15 % en réalité virtuelle, Bode et Codling 2013)', source: 'Liao et al. 2017 (J. R. Soc. Interface) ; Bode et Codling 2013 (Animal Behaviour), rapport maths-3 §2.1', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5332561',
    simule: `avant ${pct(parPlan[0])}, après ${pct(parPlan[1])}`, tolerance: 'chaque plan entre 3 et 12 %', verdict: parPlan.every((x) => dans(x, 0.03, 0.12)) ? 'passe' : 'échoue',
    explication: `Moyenne des deux plans : ${pct(m)}. La constante du logit de Haghani et Sarvi (−5,0) a été recalée pour viser cette fourchette (sources : essais et erreurs des auteurs), donc ce test vérifie le recalage, il n’est pas indépendant.`,
  };
}

function personnel(): Resultat {
  const s = scene('2 portes identiques', [issue('A', 40, 3, 200), issue('B', 40, 3, 200)]);
  const plan: Plan = { ...PLAN_SIMPLE, guidage: { issue_id: 'B', personnel: 1.5 } }; // 1,5 x 40 / 200 = 30 % de guidés
  const guides: number[] = [];
  const autres: number[] = [];
  for (const g of GRAINES(20)) {
    const e = espion();
    simuler(plan, g, 3600, { scene: s, mouvement: e.mouvement, population_par_salle: { salle_01: 200 } });
    const sortieDe = new Map(e.sorties.map((x) => [x.id, x.issue]));
    for (let i = 0; i < 200; i++) (creerRngPersonne(g, i, CANAL.guidage).next() < 0.3 ? guides : autres).push(sortieDe.get(i) === 'B' ? 1 : 0);
  }
  const pg = moyenne(guides);
  const pa = moyenne(autres);
  return {
    id: '14', titre: 'Personnel de guidage : part des guidés qui prennent l’issue indiquée',
    verifie: 'Deux portes identiques, un agent indique B à 30 % des personnes ; on mesure leur part qui sort par B.',
    reference: 'environ 90 % (VR station de métro, 131 participants)', source: 'Fire Technology 2025 (Lu, Rodriguez, …, Lovreglio), rapport maths-3 §4.1', url: 'https://link.springer.com/content/pdf/10.1007/s10694-025-01746-6.pdf',
    simule: `guidés ${pct(pg, 0)} (${guides.length} personnes) ; non guidés ${pct(pa, 0)} (20 graines)`, tolerance: '90 % ± 10 points', verdict: Math.abs(pg - 0.9) <= 0.1 ? 'passe' : 'échoue',
    explication: 'Le poids 2,739 vient de cette même étude (logit multinomial) : avec deux portes identiques on retrouve ce que la VR mesure. Le taux des non guidés (> 50 %) montre aussi l’imitation.',
  };
}

/** Exécute les 14 tests (18 lignes : 10a-b, 11a-c, 12a-b) dans l'ordre. Environ 20 s. */
export function executerValidation(): Resultat[] {
  return [rimea1(), rimea5(), rimea8(), rimea9(), rimea10(), rimea11(), rimea12(), imo4(), julich(), ...weidmann(), ...forssberg(), ...groupes(), changementAvis(), personnel()];
}

export function versCsv(r: Resultat[]): string {
  const lignes = r.map((x) => ligneCsv([x.id, x.titre, x.verifie, x.reference, x.source, x.url, x.simule, x.tolerance, x.verdict, x.explication]));
  return [ligneCsv([...COLONNES_CSV]), ...lignes].join('\n') + '\n';
}

export function synthese(r: Resultat[]): string {
  const n = (v: Verdict) => r.filter((x) => x.verdict === v).length;
  return `${n('passe')} passent, ${n('échoue')} échouent, ${n('non applicable')} non applicables`;
}

function afficher(r: Resultat[]): void {
  const cols: [string, number, (x: Resultat) => string][] = [
    ['Test', 4, (x) => x.id],
    ['Ce qui est comparé', 42, (x) => x.titre],
    ['Référence', 36, (x) => x.reference],
    ['Simulé', 46, (x) => x.simule],
    ['Verdict', 14, (x) => x.verdict],
  ];
  const coupe = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n));
  console.log('\nValidation scientifique du modèle de comportement (modèle simplifié, non certifié)\n');
  console.log(cols.map(([nom, n]) => nom.padEnd(n)).join(' │ '));
  console.log(cols.map(([, n]) => '─'.repeat(n)).join('─┼─'));
  for (const x of r) console.log(cols.map(([, n, g]) => coupe(g(x), n)).join(' │ '));
  console.log('\nÀ lire (échecs et cas sans objet, jamais cachés) :');
  for (const x of r.filter((y) => y.verdict !== 'passe')) console.log(`\n[${x.id}] ${x.verdict.toUpperCase()} : ${x.titre}\n  Référence : ${x.reference}\n  Simulé : ${x.simule} (tolérance : ${x.tolerance})\n  Pourquoi : ${x.explication}\n  Source : ${x.source}`);
  console.log(`\nSynthèse : ${synthese(r)}.\n${PHRASE_FINALE}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = executerValidation();
  writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'validation.csv'), versCsv(r));
  afficher(r);
}
