// demo:memoire : REX -> scénario -> calibration -> rejeu contrefactuel -> leçon -> mesure avec/sans mémoire.
// Aucun réseau, aucun modèle payant, aucune clé. Écrit bench/memoire/resultats.json. Modèle simplifié, non certifié.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calibrer } from '../../src/memoire/calibration.ts';
import { mesurerMemoire, type RapportMemoire } from '../../src/memoire/mesure-memoire.ts';
import { CRITERES, RegistreRunsMemoire, rejouerContrefactuel, type RapportRejeu } from '../../src/memoire/rejeu.ts';
import { rexVersScenario, validerRexStructure, type RexStructure } from '../../src/memoire/rex-scenario.ts';
import type { Ecart, Resume } from '../../src/memoire/stats.ts';
import { AVERTISSEMENT } from '../../src/sim/behavior/types.ts';

const ici = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(readFileSync(join(ici, '../../../recherche/09-rex-seed.json'), 'utf8')) as Record<string, unknown>[];
const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : 'n/a');
const pm = (r: Resume | Ecart, d = 1) => `${f(r.moyenne, d)} ± ${f(r.ic95, d)}`;

function charger(brut: unknown): RexStructure {
  const v = validerRexStructure(brut);
  if (!v.ok || !v.rex) throw new Error(`REX rejeté : ${v.erreurs.join(' ; ')}`);
  return v.rex;
}

// --- A. REX réel du corpus public (UGC, 19 oct.) : pas de durée rapportée -> calibration refusée ---------------------------------
const ugc = corpus.find((r) => String(r.enseigne_ou_zone).startsWith('UGC'))!;
const rexUgc = charger({
  id: 'rex_ugc_19oct', enseigne: 'UGC', type_incident: 'evacuation_cinema', zone: 'ugc', effectif: ugc.personnes,
  // Interprétation de l'analyste du texte de presse (« sortir par les accès d'entrée »), pas une déclaration du client.
  decisions: [{ minute: 0, action: 'evacuation_simultanee' }, { minute: 0, action: 'message', issue: 'principale', clarte: 0.5 }],
  duree_rapportee_min: ugc.duree_min, issue_rapportee: String(ugc.resultat), description_libre: String(ugc.resume),
});
const scUgc = rexVersScenario(rexUgc);
const calUgc = calibrer(scUgc);

// --- B. REX DE DÉMONSTRATION FICTIF (pas un retour client) avec une durée rapportée, pour exercer toute la chaîne -----------------
const rexDemo = charger({
  id: 'rex_demo_fictif', enseigne: 'Cinéma de démonstration', type_incident: 'evacuation_cinema', zone: 'ugc', effectif: 3000,
  decisions: [{ minute: 0, action: 'evacuation_simultanee' }, { minute: 0, action: 'message', issue: 'principale', clarte: 0.5 }],
  duree_rapportee_min: 9, duree_definition: 'complete', issue_rapportee: 'sorties encombrées, plus de 3 000 personnes selon le client',
  description_libre: 'EXEMPLE FICTIF DE DÉMONSTRATION : aucune donnée réelle.',
});
const scDemo = rexVersScenario(rexDemo);
const cal = calibrer(scDemo);
const registre = new RegistreRunsMemoire();
const rejeu: RapportRejeu = await rejouerContrefactuel(scDemo, cal.params, registre);

// Scénario TEST différent du REX source : autre effectif (1 800 au lieu de 3 000), autres graines, autre plan réel.
const rexTest = charger({ ...JSON.parse(JSON.stringify(rexDemo)), id: 'scenario_test_1800', effectif: 1800, decisions: [{ minute: 0, action: 'evacuation_simultanee' }], duree_rapportee_min: null });
const scTest = rexVersScenario(rexTest);
const memoire: RapportMemoire = await mesurerMemoire(scTest, cal.params, rejeu.lecon ? [rejeu.lecon] : []);

const resultats = {
  source: 'simulation' as const,
  avertissement: AVERTISSEMENT,
  mention: 'Chiffres du REX : selon le client. Chiffres de rejeu et de mémoire : selon la simulation. Aucune affirmation de vies sauvées.',
  rex_corpus_ugc: { rex_id: rexUgc.id, calibration: { statut: calUgc.statut, raison: calUgc.raison } },
  rex_demo_fictif: { rex_id: rexDemo.id, avertissements: scDemo.avertissements, calibration: cal },
  rejeu,
  runs_enregistres: [...registre.runs.keys()],
  memoire,
};
writeFileSync(join(ici, 'resultats.json'), JSON.stringify(resultats, null, 2) + '\n', 'utf8');

// --- Rapport lisible -------------------------------------------------------------------------------------------------------------
console.log(`MÉMOIRE DES CRISES — ${AVERTISSEMENT} (source : simulation)\n`);
console.log(`A. REX réel du corpus (${rexUgc.id}) : calibration ${calUgc.statut} — ${calUgc.raison}`);
console.log(`\nB. REX de démonstration FICTIF (${rexDemo.id}), durée rapportée selon le client : ${rexDemo.duree_rapportee_min} min`);
console.log(`   Calibration ${cal.statut} : délai x${f(cal.params.echelle_delai, 2)}, suivisme ${f(cal.params.suivisme_moyen, 3)} (bornes ${cal.bornes.echelle_delai.join('–')} et ${cal.bornes.suivisme_moyen.join('–')})`);
if (cal.avant && cal.controle) console.log(`   durée simulée : avant ${f(cal.avant.moyenne / 60)} min, après ${f(cal.controle.moyenne / 60)} ± ${f(cal.controle.ic95 / 60)} min (graines de contrôle) ; écart restant ${f(cal.ecart_restant_pct!)} %`);
console.log(`   ${cal.raison}`);
console.log(`\nREJEU CONTREFACTUEL (${rejeu.graines.length} graines, selon la simulation ; écart = décideurs - plan appliqué, négatif = mieux) :`);
for (const c of CRITERES) console.log(`   ${c.padEnd(15)} appliqué ${pm(rejeu.reel[c], 0).padEnd(16)} décideurs ${pm(rejeu.decideurs[c], 0).padEnd(16)} écart ${pm(rejeu.ecarts[c], 0)} ${rejeu.ecarts[c].significatif ? `(${rejeu.ecarts[c].sens})` : '(dans l\'intervalle)'}`);
console.log(`   Leçon : statut ${rejeu.lecon!.statut} — ${rejeu.motif_lecon}`);
console.log(`\nMÉMOIRE sur un scénario test différent (${scTest.effectif_selon_client} personnes, ${memoire.graines.length} graines, avec - sans, négatif = la mémoire aide) :`);
console.log(`   leçons fournies : ${memoire.lecons_fournies.map((l) => `${l.id} [${l.statut}]`).join(', ') || 'aucune'} ; plans différents : ${memoire.plans_differents}/${memoire.graines.length}`);
for (const c of CRITERES) console.log(`   ${c.padEnd(15)} sans ${pm(memoire.sans_memoire[c], 0).padEnd(16)} avec ${pm(memoire.avec_memoire[c], 0).padEnd(16)} effet ${pm(memoire.effets[c], 0)} => ${memoire.verdict[c]}`);
console.log(`\nÉcrit : bench/memoire/resultats.json`);
