// Sensibilité : le verdict « APRÈS vaut mieux qu'AVANT » tient-il si les paramètres du modèle varient dans leurs fourchettes ?
// Monte-Carlo par hypercube latin sur les seuls paramètres que simuler() accepte déjà en options (scène, population, échéances).
// Chaque jeu de paramètres : 5 graines communes (101-105) x 2 plans (AVANT, APRÈS). Lancer : node bench/sensibilite.ts [--jeux=N] (défaut 100).
// Écrit bench/sensibilite.csv (une ligne par jeu) et bench/sensibilite-resume.csv (parts et corrélations).
// MODÈLE SIMPLIFIÉ, NON CERTIFIÉ. Ça dit « le verdict est robuste (ou pas) à ces fourchettes », jamais « le modèle est exact ».
// Source de la méthode : reports/maths-5-statistiques-validation.md §3.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { creerRng } from '../src/sim/behavior/rng.ts';
import { ECHEANCES_UGC, SCENE_UGC } from '../src/sim/behavior/scene-ugc.ts';
import { simuler, type OptionsSimulation } from '../src/sim/behavior/simuler.ts';
import { AVERTISSEMENT } from '../src/sim/behavior/types.ts';
import { PLAN_APRES, PLAN_AVANT } from './scenarios.ts';
import { ligneCsv, moyenne, nb } from './stats.ts';

const ici = dirname(fileURLToPath(import.meta.url));
const DUREE_S = 14400;
const GRAINES = [101, 102, 103, 104, 105];
const N_JEUX = Number(process.argv.find((a) => a.startsWith('--jeux='))?.split('=')[1] ?? 100);
if (!Number.isInteger(N_JEUX) || N_JEUX < 2) throw new Error('--jeux doit être un entier >= 2');

/**
 * Paramètres injectables aujourd'hui et fourchettes. Le débit n'est pas une option : simuler() fixe 1,3 pers./s/m ; on le fait
 * varier en multipliant les largeurs de toutes les issues (même effet). Fourchette 0,77 à 1,46 = 1,0 à 1,9 pers./s/m (SFPE à Jülich,
 * Seyfried et al. 2007). Les autres bornes sont des fourchettes de bon sens, non sourcées : à le dire.
 */
const PARAMETRES = [
  { nom: 'facteur_debit', bas: 1.0 / 1.3, haut: 1.9 / 1.3 },
  { nom: 'facteur_distance', bas: 0.7, haut: 1.3 },
  { nom: 'part_groupes', bas: 0.5, haut: 0.9 },
  { nom: 'part_mobilite_reduite', bas: 0.02, haut: 0.08 },
  { nom: 'metro_ferme_a_s', bas: 5400, haut: 9000 },
] as const;

/** Hypercube latin : par paramètre, une strate par jeu, ordre mélangé (graine fixe : reproductible). */
function hypercubeLatin(n: number): number[][] {
  const rng = creerRng(20261022);
  const colonnes = PARAMETRES.map((p) => {
    const strates = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = rng.entier(i + 1); [strates[i], strates[j]] = [strates[j], strates[i]]; }
    return strates.map((s) => p.bas + ((s + rng.next()) / n) * (p.haut - p.bas));
  });
  return Array.from({ length: n }, (_, k) => colonnes.map((c) => c[k]));
}

function options(v: number[]): OptionsSimulation {
  const [debit, distance, groupes, pmr, metro] = v;
  return {
    scene: { ...SCENE_UGC, issues: SCENE_UGC.issues.map((i) => ({ ...i, largeur_m: i.largeur_m * debit, distance_m: i.distance_m * distance })) },
    part_groupes: groupes,
    part_mobilite_reduite: pmr,
    echeances: { ...ECHEANCES_UGC, metro_s: metro },
  };
}

const rangs = (xs: number[]): number[] => {
  const ordre = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array(xs.length).fill(0);
  ordre.forEach(([, i], k) => { r[i] = k; });
  return r;
};
/** Corrélation de rang de Spearman : indice de sensibilité bon marché (pas la PRCC complète). */
function spearman(x: number[], y: number[]): number {
  const a = rangs(x);
  const b = rangs(y);
  const ma = moyenne(a);
  const mb = moyenne(b);
  const num = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0);
  const den = Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0) * b.reduce((s, v) => s + (v - mb) ** 2, 0));
  return den === 0 ? NaN : num / den;
}

const debut = Date.now();
const jeux = hypercubeLatin(N_JEUX);
const lignes = [ligneCsv(['jeu', ...PARAMETRES.map((p) => p.nom), 'danger_avant', 'danger_apres', 'danger_diff_relative_pct', 't90_avant', 't90_apres', 't90_diff_relative_pct', 'apres_meilleur_danger', 'apres_meilleur_t90', 'avertissement'])];
const dangerRel: number[] = [];
const t90Rel: number[] = [];
jeux.forEach((v, k) => {
  const o = options(v);
  const moy = (plan: typeof PLAN_AVANT, lire: (r: ReturnType<typeof simuler>) => number | null) => {
    const xs = GRAINES.map((g) => lire(simuler(plan, g, DUREE_S, o))).filter((x): x is number => x !== null);
    return xs.length ? moyenne(xs) : NaN;
  };
  const dA = moy(PLAN_AVANT, (r) => r.grille.zone_danger.valeur);
  const dB = moy(PLAN_APRES, (r) => r.grille.zone_danger.valeur);
  const tA = moy(PLAN_AVANT, (r) => r.grille.delai_t90_s);
  const tB = moy(PLAN_APRES, (r) => r.grille.delai_t90_s);
  const rd = (100 * (dB - dA)) / dA;
  const rt = (100 * (tB - tA)) / tA;
  dangerRel.push(rd);
  t90Rel.push(rt);
  lignes.push(ligneCsv([k + 1, ...v.map((x) => nb(x, 4)), nb(dA), nb(dB), nb(rd), nb(tA), nb(tB), nb(rt), dB < dA ? 'vrai' : 'faux', tB < tA ? 'vrai' : 'faux', AVERTISSEMENT]));
});
writeFileSync(join(ici, 'sensibilite.csv'), lignes.join('\n') + '\n', 'utf8');

const part = (xs: number[]) => (100 * xs.filter((x) => x < 0).length) / xs.length;
const q = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))];
const resume = [ligneCsv(['mesure', 'valeur', 'n_jeux', 'graines_par_jeu', 'avertissement'])];
const ajouter = (m: string, v: number | string) => resume.push(ligneCsv([m, typeof v === 'number' ? nb(v) : v, N_JEUX, GRAINES.length, AVERTISSEMENT]));
ajouter('part_jeux_apres_meilleur_zone_danger_pct', part(dangerRel));
ajouter('part_jeux_apres_meilleur_t90_pct', part(t90Rel));
ajouter('zone_danger_diff_relative_pct_p5', q(dangerRel, 0.05));
ajouter('zone_danger_diff_relative_pct_p95', q(dangerRel, 0.95));
ajouter('t90_diff_relative_pct_p5', q(t90Rel, 0.05));
ajouter('t90_diff_relative_pct_p95', q(t90Rel, 0.95));
PARAMETRES.forEach((p, i) => {
  const col = jeux.map((v) => v[i]);
  ajouter(`spearman_${p.nom}_zone_danger_diff_relative`, spearman(col, dangerRel));
  ajouter(`spearman_${p.nom}_t90_diff_relative`, spearman(col, t90Rel));
});
writeFileSync(join(ici, 'sensibilite-resume.csv'), resume.join('\n') + '\n', 'utf8');

console.log(`Sensibilité : ${N_JEUX} jeux x ${GRAINES.length} graines x 2 plans, ${((Date.now() - debut) / 1000).toFixed(1)} s. ${AVERTISSEMENT}.`);
console.log(`APRÈS reste meilleur sur la zone de danger dans ${part(dangerRel).toFixed(0)} % des jeux (écart relatif 5-95 % : ${q(dangerRel, 0.05).toFixed(1)} à ${q(dangerRel, 0.95).toFixed(1)} %).`);
console.log(`APRÈS reste meilleur sur t90 dans ${part(t90Rel).toFixed(0)} % des jeux (écart relatif 5-95 % : ${q(t90Rel, 0.05).toFixed(1)} à ${q(t90Rel, 0.95).toFixed(1)} %).`);
console.log('Écrit : bench/sensibilite.csv et bench/sensibilite-resume.csv');
