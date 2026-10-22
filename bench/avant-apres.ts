// Benchmark avant/après : consigne du 19 oct. contre plan des décideurs, mêmes graines (20), même population par graine.
// Écrit bench/resultats.csv (moyenne et intervalle de confiance à 95 %) et bench/resultats-par-graine.csv.
// MODÈLE SIMPLIFIÉ, NON CERTIFIÉ : scène illustrative, mouvement de test, poids tirés d'expériences de laboratoire.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simuler } from '../src/sim/behavior/simuler.ts';
import { AVERTISSEMENT, type JournalRun } from '../src/sim/behavior/types.ts';
import { PLAN_APRES, PLAN_AVANT } from './scenarios.ts';

const ici = dirname(fileURLToPath(import.meta.url));
const GRAINES = Array.from({ length: 20 }, (_, k) => k + 1);
const DUREE_S = 14400;
const T_STUDENT_19 = 2.093; // t de Student à 95 %, 19 degrés de liberté

interface Critere {
  nom: string;
  unite: string;
  sens: 'moins_est_mieux' | 'plus_est_mieux';
  lire: (r: JournalRun) => number | null;
}

const CRITERES: Critere[] = [
  { nom: 'non_sortis_22h', unite: 'personnes', sens: 'moins_est_mieux', lire: (r) => r.grille.non_sortis_22h.valeur },
  { nom: 'non_sortis_23h', unite: 'personnes', sens: 'moins_est_mieux', lire: (r) => r.grille.non_sortis_23h.valeur },
  { nom: 'non_sortis_22h_mobilite_reduite', unite: 'personnes', sens: 'moins_est_mieux', lire: (r) => r.grille.non_sortis_22h_mobilite_reduite.valeur },
  { nom: 'zone_danger', unite: 'personnes-minutes pondérées', sens: 'moins_est_mieux', lire: (r) => r.grille.zone_danger.valeur },
  { nom: 'ecrasement_plus_de_5_pers_m2', unite: 'personnes-minutes', sens: 'moins_est_mieux', lire: (r) => r.grille.ecrasement.valeur },
  { nom: 'pression_helbing_max', unite: 's^-2 (proxy)', sens: 'moins_est_mieux', lire: (r) => r.grille.pression_helbing_max },
  { nom: 't90', unite: 'secondes', sens: 'moins_est_mieux', lire: (r) => r.grille.delai_t90_s },
  { nom: 't99', unite: 'secondes', sens: 'moins_est_mieux', lire: (r) => r.grille.delai_t99_s },
  { nom: 'continuite_sorties_vers_lieu_sur', unite: 'personnes', sens: 'plus_est_mieux', lire: (r) => r.grille.continuite.valeur },
  { nom: 'note_totale', unite: '0 à 100', sens: 'plus_est_mieux', lire: (r) => r.grille.total },
];

export function stats(xs: number[]): { moy: number; bas: number; haut: number; n: number } {
  const n = xs.length;
  if (!n) return { moy: NaN, bas: NaN, haut: NaN, n: 0 };
  const moy = xs.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - moy) ** 2, 0) / (n - 1)) : 0;
  const t = n === 20 ? T_STUDENT_19 : 1.96;
  const demi = (t * sd) / Math.sqrt(n);
  return { moy, bas: moy - demi, haut: moy + demi, n };
}

const f = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : '');

const debut = Date.now();
const avant = GRAINES.map((g) => simuler(PLAN_AVANT, g, DUREE_S));
const apres = GRAINES.map((g) => simuler(PLAN_APRES, g, DUREE_S));

const lignes = ['critere,unite,sens,avant_moyenne,avant_ic95_bas,avant_ic95_haut,apres_moyenne,apres_ic95_bas,apres_ic95_haut,difference_apres_moins_avant,difference_ic95_bas,difference_ic95_haut,graines,avertissement'];
const console_ = [];
for (const c of CRITERES) {
  const a = avant.map((r) => c.lire(r));
  const b = apres.map((r) => c.lire(r));
  const sa = stats(a.filter((x): x is number => x !== null));
  const sb = stats(b.filter((x): x is number => x !== null));
  const diffs = a.map((x, i) => (x !== null && b[i] !== null ? (b[i] as number) - x : null)).filter((x): x is number => x !== null);
  const sd = stats(diffs);
  lignes.push([c.nom, c.unite, c.sens, f(sa.moy), f(sa.bas), f(sa.haut), f(sb.moy), f(sb.bas), f(sb.haut), f(sd.moy), f(sd.bas), f(sd.haut), `${sd.n}`, AVERTISSEMENT].join(','));
  console_.push(`${c.nom.padEnd(36)} avant ${f(sa.moy).padStart(10)} [${f(sa.bas)} ; ${f(sa.haut)}]   après ${f(sb.moy).padStart(10)} [${f(sb.bas)} ; ${f(sb.haut)}]`);
}
writeFileSync(join(ici, 'resultats.csv'), lignes.join('\n') + '\n', 'utf8');

const par = ['graine,plan,' + CRITERES.map((c) => c.nom).join(',')];
for (const [nom, runs] of [['avant', avant], ['apres', apres]] as const) {
  runs.forEach((r, i) => par.push([GRAINES[i], nom, ...CRITERES.map((c) => { const v = c.lire(r); return v === null ? '' : f(v); })].join(',')));
}
writeFileSync(join(ici, 'resultats-par-graine.csv'), par.join('\n') + '\n', 'utf8');

console.log(`Benchmark avant/après, ${GRAINES.length} graines, ${((Date.now() - debut) / 1000).toFixed(1)} s. ${AVERTISSEMENT}.`);
console.log('moyenne [intervalle de confiance à 95 %]');
for (const l of console_) console.log(l);
console.log(`Écrit : bench/resultats.csv et bench/resultats-par-graine.csv`);
