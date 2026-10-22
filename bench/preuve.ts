// Preuve multi-situations (étape 6 du script de démo) : « sans » notre solution (consigne du 19 oct.) contre « avec » (meilleur plan).
// Lancer : node bench/preuve.ts [--graines=10] [--situations=B1-secours,C1-metro,...] [--moteur=test|simjs] [--reactions=litterature|llm|llm:chinois|llm:americain|llm:europeen|llm:<id de modèle>]
// Sans --reactions (défaut), la foule n'a pas de réactions propres et la ligne du jury est celle d'avant. Dans tous les cas, un petit
// tableau compare, sur les situations de blocage (dont deux « blocages surprise »), foule sans réactions / littérature / LLM.
// Écrit bench/out/preuve.csv et bench/out/preuve-resume.json (dossier ignoré par git : données générées, jamais commitées).
// MODÈLE SIMPLIFIÉ, NON CERTIFIÉ : scène illustrative, mouvement de test. Les intervalles ne couvrent que le hasard des graines.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AVERTISSEMENT } from '../src/sim/behavior/types.ts';
import {
  choisirPlanAvec, comparerReactions, creerMoteur, CRITERES, GRAINES_DEPART, ISSUES, lancer, lignesCsv, PLAN_AVANT, REACTIONS, resumerPreuve, SITUATIONS, SITUATIONS_SURPRISE,
  type LigneReactions, type ResultatCritere, type ResultatSituation,
} from './preuve-lib.ts';

const ici = dirname(fileURLToPath(import.meta.url));
const arg = (nom: string) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.split('=')[1];

const nbGraines = Number(arg('graines') ?? 10);
if (!Number.isInteger(nbGraines) || nbGraines < 2) throw new Error('--graines doit être un entier >= 2');
const graines = Array.from({ length: nbGraines }, (_, k) => GRAINES_DEPART + k);
const choix = arg('situations')?.split(',').map((s) => s.trim()).filter(Boolean);
const inconnues = (choix ?? []).filter((id) => !SITUATIONS.some((s) => s.id === id));
if (inconnues.length) throw new Error(`situations inconnues : ${inconnues.join(', ')}. Possibles : ${SITUATIONS.map((s) => s.id).join(', ')}`);
const situations = choix ? SITUATIONS.filter((s) => choix.includes(s.id)) : SITUATIONS;
const sourceReactions = arg('reactions');
const moteur = creerMoteur(arg('moteur') ?? 'test', sourceReactions ? { actif: true, source: sourceReactions } : undefined);
const avec = choisirPlanAvec();
let commit = 'inconnu';
try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ici, encoding: 'utf8', stdio: 'pipe' }).trim(); } catch { /* hors dépôt git */ }

const debut = Date.now();
const res = lancer(moteur, situations, graines, PLAN_AVANT, avec.plan);
const duree_s = (Date.now() - debut) / 1000;
const resume = resumerPreuve(res);

// ---------- Sorties fichiers ----------
const out = join(ici, 'out');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'preuve.csv'), lignesCsv(res, { plan_avec: avec.source, moteur: moteur.nom }).join('\n') + '\n', 'utf8');

// Report de charge : sorties par issue de la situation moins celles de la situation « base » (même plan), si « base » a été jouée.
const base = res.find((r) => r.situation.id === 'base');
const report = (r: ResultatSituation, plan: 'sans' | 'avec') => base ? Object.fromEntries(ISSUES.map((id) => [id, Math.round((r.sorties_par_issue[plan][id] - base.sorties_par_issue[plan][id]) * 10) / 10])) : null;
const resumeJson = {
  moteur: moteur.nom,
  avertissement: AVERTISSEMENT,
  commit,
  date: new Date().toISOString(),
  duree_s: Math.round(duree_s * 10) / 10,
  graines,
  plan_avec: { source: avec.source, raison: avec.raison },
  n_situations: res.length,
  ...resume,
  situations: res.map((r) => ({
    id: r.situation.id, libelle: r.situation.libelle, lieu: r.situation.lieu, codes: r.situation.codes, issues_bloquees: r.situation.bloquees,
    n_graines: r.n_graines,
    criteres: Object.fromEntries(r.criteres.map((c) => [c.nom, { sans: c.sans, avec: c.avec, ecart_pct: Number.isFinite(c.ecart_pct) ? c.ecart_pct : null, verdict: c.verdict, sous_incertitude_modele: c.sous_incertitude_modele }])),
    reactions: r.reactions,
    sorties_par_issue: r.sorties_par_issue,
    report_de_charge_vs_base: { sans: report(r, 'sans'), avec: report(r, 'avec') },
  })),
};
writeFileSync(join(out, 'preuve-resume.json'), JSON.stringify(resumeJson, null, 2) + '\n', 'utf8');

// ---------- Terminal ----------
const f = (x: number) => (!Number.isFinite(x) ? 'n/a' : Math.abs(x) >= 100 ? Math.round(x).toString() : x.toFixed(x === Math.round(x) ? 0 : Math.abs(x) < 10 ? 2 : 1));
const marque: Record<string, string> = { mieux: '✓', pire: '✗' };
const cellule = (c: ResultatCritere) => {
  const e = Number.isFinite(c.ecart_pct) ? `${c.ecart_pct >= 0 ? '+' : ''}${c.ecart_pct.toFixed(0)}%` : '';
  return `${f(c.sans)}→${f(c.avec)} ${e}${marque[c.verdict] ?? ' '}`.trim();
};
const largeur = [20, 20, 22, 17, 17, 22, 12];
const ligne = (cols: string[]) => cols.map((c, k) => c.padEnd(largeur[k])).join(' ');

console.log(`Preuve multi-situations · moteur ${moteur.nom} · réactions de la foule : ${sourceReactions ?? 'désactivées'} · ${res.length} situations × ${graines.length} graines (${graines[0]}-${graines[graines.length - 1]}) × 2 plans · ${duree_s.toFixed(1)} s · commit ${commit}`);
console.log(`${AVERTISSEMENT}. SANS = consigne du 19 oct. (PLAN_AVANT) ; AVEC = ${avec.source} (${avec.raison}).`);
console.log('Cellule : moyenne sans→avec, écart relatif ; ✓ = meilleur, ✗ = pire (IC 95 % de la différence appariée exclut 0, hasard des graines seulement). Un écart sous 30 % reste dans l’incertitude de modèle.\n');
console.log(ligne(['situation', ...CRITERES.map((c) => c.nom)]));
for (const r of res) console.log(ligne([r.situation.id, ...r.criteres.map(cellule)]));

const bloquees = res.filter((r) => r.situation.bloquees.length);
if (bloquees.length) {
  console.log('\nRéactions mesurées quand une issue est bloquée (moyennes par run, sans → avec) :');
  console.log(['situation'.padEnd(24), ...REACTIONS.map((k) => k.padEnd(27))].join(' '));
  for (const r of bloquees) console.log([r.situation.id.padEnd(24), ...REACTIONS.map((k) => `${f(r.reactions.sans[k])} → ${f(r.reactions.avec[k])}`.padEnd(27))].join(' '));
  console.log('\nSorties par issue (sans → avec), issue bloquée marquée [X] :');
  console.log(['situation'.padEnd(24), ...ISSUES.map((id) => id.padEnd(17))].join(' '));
  for (const r of bloquees) console.log([r.situation.id.padEnd(24), ...ISSUES.map((id) => `${f(r.sorties_par_issue.sans[id])} → ${f(r.sorties_par_issue.avec[id])}${r.situation.bloquees.includes(id) ? ' [X]' : ''}`.padEnd(17))].join(' '));
}

// Réactions de la foule : mêmes situations, mêmes personnes, plan « avec », 5 graines (le calcul reste court).
const debutR = Date.now();
const grainesR = graines.slice(0, 5);
const sitR = [...SITUATIONS.filter((s) => s.id === 'B1-principale'), ...SITUATIONS_SURPRISE];
const lignesR: LigneReactions[] = sitR.flatMap((s) => comparerReactions(s, avec.plan, grainesR));
const fr = (x: number | null, d = 0) => (x === null || !Number.isFinite(x) ? 'n/a' : x.toFixed(d));
console.log(`\nRéactions de la foule, mêmes situations (plan « avec », ${grainesR.length} graines, moyennes par run, ${((Date.now() - debutR) / 1000).toFixed(0)} s) :`);
console.log(['situation'.padEnd(26), 'foule'.padEnd(14), 'hésit.'.padStart(7), 'demi-t.'.padStart(8), 'ont changé'.padStart(11), 'par issue touchée'.padStart(18), 'par les autres'.padStart(15), 'non sortis 22h'.padStart(15), 't90 (s)'.padStart(9), 'réactions'.padStart(10), 'touchés %'.padStart(10)].join(' '));
for (const l of lignesR) console.log([l.situation.padEnd(26), l.variante.padEnd(14), fr(l.hesitations).padStart(7), fr(l.demi_tours).padStart(8), `${fr(l.ont_change_pct, 1)} %`.padStart(11), fr(l.sortis_issue_touchee).padStart(18), fr(l.sortis_autres_issues).padStart(15), fr(l.non_sortis_22h).padStart(15), fr(l.t90_s).padStart(9), fr(l.reactions_tirees).padStart(10), fr(l.part_touchee_influence_pct, 1).padStart(10)].join(' '));

console.log('\nRésumé par critère (médiane de l’écart relatif sur les situations où « sans » n’est pas nul) :');
for (const c of CRITERES) {
  const v = resume.par_critere[c.nom];
  console.log(`  ${c.nom.padEnd(16)} médiane ${v.mediane_ecart_pct === null ? 'n/a' : `${v.mediane_ecart_pct > 0 ? '+' : ''}${v.mediane_ecart_pct} %`}  (${v.n_definies} définies) · meilleur ${v.meilleure_dans} · pire ${v.pire_dans} · indistinct ${v.indistinct_dans} · sous 30 % ${v.sous_incertitude_modele_dans}`);
}
console.log(`\nLIGNE POUR LE JURY : ${resume.ligne_jury}`);
console.log(`(${AVERTISSEMENT} ; scène illustrative ; plan « avec » : ${avec.source}.)`);
if (duree_s > 120) console.log('ATTENTION : plus de 2 minutes ; réduire --graines ou --situations.');
console.log('Écrit : bench/out/preuve.csv et bench/out/preuve-resume.json');
