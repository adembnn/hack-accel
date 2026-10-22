// npm run demo:integration : lance la chaîne complète (aucun réseau, aucune clé) et écrit bench/integration/resultats.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { lancerChaine } from './chaine.ts';

globalThis.fetch = (async () => { throw new Error('RÉSEAU INTERDIT : la chaîne d\'intégration tourne sans réseau'); }) as typeof fetch;

const arg = (nom: string, defaut: number) => { const k = process.argv.indexOf(`--${nom}`); return k > 0 ? Number(process.argv[k + 1]) : defaut; };
const r = await lancerChaine({
  graine: arg('graine', 7),
  personnes_par_salle: arg('par-salle', 100),
  horizon_min: arg('horizon', 10),
  journalisation: (m) => console.log(m),
});
mkdirSync('bench/integration', { recursive: true });
writeFileSync('bench/integration/resultats.json', `${JSON.stringify(r, null, 2)}\n`);

const f = (v: number | null) => (v === null ? 'non atteint' : String(v));
console.log('\n=== Résultat (modèle simplifié, non certifié) ===');
console.log(`Population ${r.config.personnes}, horizon ${r.config.horizon_min} min, graine ${r.config.graine}, décideurs en mode ${r.config.backend_decision}, réseau : non`);
console.log('                         avant     après');
console.log(`t90 (s)               ${f(r.avant.t90_s).padStart(9)} ${f(r.apres.t90_s).padStart(9)}`);
console.log(`non sortis (fin)      ${String(r.avant.non_sortis_fin).padStart(9)} ${String(r.apres.non_sortis_fin).padStart(9)}`);
console.log(`zone de danger (p-m)  ${String(r.avant.zone_danger_valeur).padStart(9)} ${String(r.apres.zone_danger_valeur).padStart(9)}`);
console.log(`écrasement (p-min)    ${String(r.avant.ecrasement_personnes_minutes).padStart(9)} ${String(r.apres.ecrasement_personnes_minutes).padStart(9)}`);
console.log(`pression Helbing max  ${String(r.avant.pression_helbing_max).padStart(9)} ${String(r.apres.pression_helbing_max).padStart(9)}`);
console.log(`note totale           ${String(r.avant.note_totale).padStart(9)} ${String(r.apres.note_totale).padStart(9)}`);
console.log(`Mode choisi : ${r.plan_choisi.mode} ; portes fermées : ${Object.entries(r.plan_choisi.portes).filter(([, e]) => e === 'fermee').map(([p]) => p).join(', ') || 'aucune'}`);
console.log(`Leviers choisis : ${r.leviers_choisis.map((l) => `${l.decideur}/${l.levier}@${l.minute}${l.repetitions > 1 ? `x${l.repetitions}` : ''}`).join(' ; ') || 'aucun'}`);
console.log(`Décisions citant le REX : ${r.decisions_citees.filter((d) => d.lecons_citees.length).length} sur ${r.decisions_citees.length}`);
console.log(`Explication (${r.explication?.chiffres_verifies ? 'chiffres vérifiés' : 'CHIFFRES NON VÉRIFIÉS'}) : ${r.explication?.texte}`);
console.log(`Ordres de service : ${r.ordres_de_service.length}, tous vérifiés : ${r.ordres_de_service.every((o) => o.chiffres_verifies)}`);
console.log(`Écarts constatés : ${r.ecarts_constates.length} (voir bench/integration/resultats.json et src/integration/LISEZMOI.md)`);
console.log(`Temps total : ${Math.round(r.performance.total_ms / 1000)} s pour ${r.performance.simulations_completes} simulations complètes`);
