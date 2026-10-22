// Recherche de plan : évalue les plans candidats sur 20 graines d'entraînement (1-20), choisit selon une règle fixée AVANT,
// puis ré-évalue le plan choisi (et les deux références) sur 20 graines de test jamais vues (101-120).
// Écrit bench/resultats-plans.csv. MODÈLE SIMPLIFIÉ, NON CERTIFIÉ : scène illustrative.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simuler } from '../src/sim/behavior/simuler.ts';
import { AVERTISSEMENT, type JournalRun, type Plan } from '../src/sim/behavior/types.ts';
import { PLANS_CANDIDATS } from '../src/sim/behavior/plans-candidats.ts';
import { PLAN_APRES, PLAN_AVANT } from './scenarios.ts';

const ici = dirname(fileURLToPath(import.meta.url));
const ENTRAINEMENT = Array.from({ length: 20 }, (_, k) => k + 1);
const TEST = Array.from({ length: 20 }, (_, k) => k + 101);
const DUREE_S = 14400;
const moy = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const LIRE: Record<string, (r: JournalRun) => number> = {
  non_sortis_22h: (r) => r.grille.non_sortis_22h.valeur,
  non_sortis_23h: (r) => r.grille.non_sortis_23h.valeur,
  zone_danger: (r) => r.grille.zone_danger.valeur,
  ecrasement: (r) => r.grille.ecrasement.valeur,
  t90: (r) => r.grille.delai_t90_s ?? NaN,
  t99: (r) => r.grille.delai_t99_s ?? NaN,
  continuite: (r) => r.grille.continuite.valeur,
  note_totale: (r) => r.grille.total,
};
function evaluer(plan: Plan, graines: number[]): Record<string, number> {
  const runs = graines.map((g) => simuler(plan, g, DUREE_S));
  return Object.fromEntries(Object.entries(LIRE).map(([k, f]) => [k, moy(runs.map(f))]));
}

const plans = [{ nom: 'AVANT_defaut', plan: PLAN_AVANT }, { nom: 'APRES_decideurs', plan: PLAN_APRES }, ...PLANS_CANDIDATS.map((c) => ({ nom: c.nom, plan: c.plan }))];
const ent = new Map(plans.map((p) => [p.nom, evaluer(p.plan, ENTRAINEMENT)]));
const ref = ent.get('AVANT_defaut')!;

// RÈGLE DE CHOIX (fixée avant de lancer) : éligible = ne dégrade ni les non-sortis, ni la zone de danger, ni l'écrasement,
// ni t90 par rapport au défaut AVANT ; parmi les éligibles, le plus bas en zone de danger, puis en t90. Sinon : aucun gagnant.
const eligible = (m: Record<string, number>) => m.non_sortis_22h <= ref.non_sortis_22h && m.non_sortis_23h <= ref.non_sortis_23h && m.zone_danger <= ref.zone_danger && m.ecrasement <= ref.ecrasement && m.t90 <= ref.t90;
const elig = PLANS_CANDIDATS.filter((c) => eligible(ent.get(c.nom)!)).sort((a, b) => ent.get(a.nom)!.zone_danger - ent.get(b.nom)!.zone_danger || ent.get(a.nom)!.t90 - ent.get(b.nom)!.t90);
// RÈGLE DE REPLI (ajoutée après avoir vu qu'aucun plan n'est éligible, donc déclarée comme telle) : meilleur compromis = plus bas en
// zone de danger parmi ceux qui ne dégradent ni les non-sortis ni l'écrasement ; son t90 est rapporté tel quel, sans être caché.
const compromis = PLANS_CANDIDATS.filter((c) => { const m = ent.get(c.nom)!; return m.non_sortis_22h <= ref.non_sortis_22h && m.non_sortis_23h <= ref.non_sortis_23h && m.ecrasement <= ref.ecrasement; }).sort((a, b) => ent.get(a.nom)!.zone_danger - ent.get(b.nom)!.zone_danger)[0]?.nom ?? null;
const choisi = elig[0]?.nom ?? compromis;

const test = new Map<string, Record<string, number>>();
for (const nom of ['AVANT_defaut', 'APRES_decideurs', ...(choisi ? [choisi] : [])]) test.set(nom, evaluer(plans.find((p) => p.nom === nom)!.plan, TEST));

const cols = Object.keys(LIRE);
const f = (x: number) => x.toFixed(2);
const lignes = ['jeu,graines,plan,choisi,' + cols.join(',') + ',avertissement'];
for (const p of plans) lignes.push(['entrainement', '1-20', p.nom, p.nom === choisi ? 'oui' : 'non', ...cols.map((c) => f(ent.get(p.nom)![c])), AVERTISSEMENT].join(','));
for (const [nom, m] of test) lignes.push(['test', '101-120', nom, nom === choisi ? 'oui' : 'non', ...cols.map((c) => f(m[c])), AVERTISSEMENT].join(','));
writeFileSync(join(ici, 'resultats-plans.csv'), lignes.join('\n') + '\n', 'utf8');
console.log(lignes.map((l) => l.replace(',' + AVERTISSEMENT, '')).join('\n'));
console.log('Éligibles :', elig.map((e) => e.nom).join(', ') || 'aucun', '| Choisi :', choisi ?? 'aucun');
