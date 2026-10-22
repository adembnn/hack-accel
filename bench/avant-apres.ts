// Benchmark avant/après : consigne du 19 oct. contre plan des décideurs, mêmes graines, même population par graine.
// Lancer : node bench/avant-apres.ts [--jeu=rapport|reglage] [--graines=N]   (défaut : rapport, 100 graines 101-200).
// Jeux de graines séparés : « reglage » 1-20 (on règle les plans dessus), « rapport » 101-200 (on rapporte dessus, jamais utilisé pour régler).
// Écrit bench/resultats.csv (IC de Student, différence appariée, bootstrap, différence relative, incertitude de modèle, convergence)
// et bench/resultats-par-graine.csv. Les intervalles ne couvrent que le hasard des graines, pas l'erreur du modèle (voir bench/LISEZMOI.md).
// MODÈLE SIMPLIFIÉ, NON CERTIFIÉ : scène illustrative, mouvement de test, poids tirés d'expériences de laboratoire.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simuler } from '../src/sim/behavior/simuler.ts';
import { AVERTISSEMENT, type JournalRun } from '../src/sim/behavior/types.ts';
import { PLAN_APRES, PLAN_AVANT } from './scenarios.ts';
import { comparer, convergence, ligneCsv, nb, nRequis1pct, PLAFOND, resumer, SEUIL_MODELE_PCT, sousIncertitudeModele, verdict, type Sens } from './stats.ts';

const ici = dirname(fileURLToPath(import.meta.url));
const DUREE_S = 14400;
const arg = (nom: string) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.split('=')[1];
const JEU = arg('jeu') ?? 'rapport';
if (JEU !== 'rapport' && JEU !== 'reglage') throw new Error('--jeu doit valoir rapport ou reglage');
const NB_GRAINES = Number(arg('graines') ?? (JEU === 'rapport' ? 100 : 20));
if (!Number.isInteger(NB_GRAINES) || NB_GRAINES < 2) throw new Error('--graines doit être un entier >= 2');
const GRAINES = Array.from({ length: NB_GRAINES }, (_, k) => (JEU === 'rapport' ? 101 : 1) + k);
let COMMIT = 'inconnu';
try { COMMIT = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ici, encoding: 'utf8', stdio: 'pipe' }).trim(); } catch { /* hors dépôt git */ }

interface Critere {
  nom: string;
  unite: string;
  sens: Sens;
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

const num = (xs: (number | null)[]): number[] => xs.filter((x): x is number => x !== null);
/** Borne d'intervalle, ou « plafond » quand la variance est nulle (un IC [0 ; 0] n'est pas un résultat). */
const ic = (r: { plafond: boolean; bas: number; haut: number }, k: 'bas' | 'haut') => (r.plafond ? PLAFOND : nb(r[k]));

const debut = Date.now();
const avant = GRAINES.map((g) => simuler(PLAN_AVANT, g, DUREE_S));
const apres = GRAINES.map((g) => simuler(PLAN_APRES, g, DUREE_S));
const date = new Date().toISOString();

const entete = ['critere', 'unite', 'sens', 'jeu_graines', 'n_graines',
  'avant_moyenne', 'avant_ecart_type', 'avant_cv_pct', 'avant_ic95_bas', 'avant_ic95_haut',
  'apres_moyenne', 'apres_ecart_type', 'apres_cv_pct', 'apres_ic95_bas', 'apres_ic95_haut',
  'difference_apres_moins_avant', 'difference_ecart_type', 'difference_relative_pct', 'd_z', 'rho_avant_apres',
  'difference_ic95_t_bas', 'difference_ic95_t_haut', 'difference_ic95_boot_bas', 'difference_ic95_boot_haut',
  'seuil_modele_pct', 'sous_incertitude_modele', 'verdict', 'converge', 'n_requis_1pct',
  'avertissement', 'commit', 'date'];
const lignes = [ligneCsv(entete)];
const console_: string[] = [];
for (const c of CRITERES) {
  const a = avant.map((r) => c.lire(r));
  const b = apres.map((r) => c.lire(r));
  const sa = resumer(num(a));
  const sb = resumer(num(b));
  const cmp = comparer(a, b);
  const d = cmp.d;
  const v = verdict(cmp, c.sens, sa.moy);
  const diffs = b.flatMap((y, i) => (a[i] !== null && y !== null ? [y - (a[i] as number)] : []));
  const conv = convergence(diffs);
  const sous = Number.isFinite(cmp.diff_relative_pct) ? sousIncertitudeModele(cmp.diff_relative_pct) : null;
  lignes.push(ligneCsv([c.nom, c.unite, c.sens, JEU, cmp.n,
    nb(sa.moy), nb(sa.sd), nb(sa.cv_pct), ic(sa, 'bas'), ic(sa, 'haut'),
    nb(sb.moy), nb(sb.sd), nb(sb.cv_pct), ic(sb, 'bas'), ic(sb, 'haut'),
    nb(d.moy), nb(d.sd), nb(cmp.diff_relative_pct), nb(cmp.d_z), nb(cmp.rho),
    ic(d, 'bas'), ic(d, 'haut'), d.plafond ? PLAFOND : nb(cmp.boot_bas), d.plafond ? PLAFOND : nb(cmp.boot_haut),
    SEUIL_MODELE_PCT, sous === null ? '' : sous ? 'vrai' : 'faux', v,
    conv.converge ? 'oui' : 'non', nRequis1pct(diffs) ?? '',
    AVERTISSEMENT, COMMIT, date]));
  const dr = sous === null ? 'n/a' : `${cmp.diff_relative_pct >= 0 ? '+' : ''}${cmp.diff_relative_pct.toFixed(1)} %`;
  console_.push(`${c.nom.padEnd(34)} avant ${nb(sa.moy).padStart(10)}  après ${nb(sb.moy).padStart(10)}  écart ${dr.padStart(8)} ${d.plafond ? PLAFOND : `[${nb(d.bas)} ; ${nb(d.haut)}]`}  ${v}${sous ? ' · sous 30 % (dans l’incertitude de modèle)' : ''}  convergé : ${conv.converge ? 'oui' : 'non'}`);
}
writeFileSync(join(ici, 'resultats.csv'), lignes.join('\n') + '\n', 'utf8');

const par = [ligneCsv(['graine', 'plan', ...CRITERES.map((c) => c.nom)])];
for (const [nom, runs] of [['avant', avant], ['apres', apres]] as const) {
  runs.forEach((r, i) => par.push(ligneCsv([GRAINES[i], nom, ...CRITERES.map((c) => { const v = c.lire(r); return v === null ? '' : nb(v); })])));
}
writeFileSync(join(ici, 'resultats-par-graine.csv'), par.join('\n') + '\n', 'utf8');

console.log(`Benchmark avant/après, jeu « ${JEU} », ${GRAINES.length} graines (${GRAINES[0]}-${GRAINES[GRAINES.length - 1]}), commit ${COMMIT}, ${((Date.now() - debut) / 1000).toFixed(1)} s. ${AVERTISSEMENT}.`);
console.log('Le hasard des graines seul est couvert par l’intervalle (Student 95 %, différence appariée après − avant) ; l’écart entre modèles peut atteindre 30 %.');
for (const l of console_) console.log(l);
console.log('Écrit : bench/resultats.csv et bench/resultats-par-graine.csv');
