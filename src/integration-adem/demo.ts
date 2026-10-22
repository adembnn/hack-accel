// npm run demo:integration-adem : boucle des décideurs (backend rules, rédacteur en rejeu) sur la vraie grille avec sim.js d'Adem.
// Aucun réseau, aucune clé. Écrit bench/integration-adem/resultats.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { lancerChaine } from './chaine.ts';
import { disponible } from './moteur.ts';

globalThis.fetch = (async () => { throw new Error('RÉSEAU INTERDIT : la chaîne tourne sans réseau'); }) as typeof fetch;

if (!disponible()) {
  console.error('navgrid.json / scene.json absents de reports/maquettes/chatelet-3d/ (gitignorés) : voir src/integration-adem/LISEZMOI.md pour les générer.');
  process.exit(1);
}
const arg = (nom: string, defaut: number) => { const k = process.argv.indexOf(`--${nom}`); return k > 0 ? Number(process.argv[k + 1]) : defaut; };
const r = await lancerChaine({ graine: arg('graine', 7), personnes: arg('personnes', 2000), horizon_min: arg('horizon', 12), journalisation: (m) => console.log(m) });
mkdirSync('bench/integration-adem', { recursive: true });
writeFileSync('bench/integration-adem/resultats.json', `${JSON.stringify(r, null, 2)}\n`);

const f = (v: number | null) => (v === null ? 'non atteint' : String(v));
console.log(`\n=== Résultat (${r.avertissement}) ===`);
console.log(`Population ${r.config.personnes}, horizon ${r.config.horizon_min} min, graine ${r.config.graine}, décideurs ${r.config.backend_decision}, réseau : non`);
console.log('                              avant     après');
console.log(`t90 (s)                  ${f(r.avant.t90_s).padStart(10)} ${f(r.apres.t90_s).padStart(9)}`);
console.log(`sortis (fin)             ${String(r.avant.sortis_fin).padStart(10)} ${String(r.apres.sortis_fin).padStart(9)}`);
console.log(`non sortis (fin)         ${String(r.avant.non_sortis_fin).padStart(10)} ${String(r.apres.non_sortis_fin).padStart(9)}`);
console.log(`vers zone de danger      ${String(r.avant.sortis_vers_zone_danger).padStart(10)} ${String(r.apres.sortis_vers_zone_danger).padStart(9)}`);
console.log(`écrasement (pers.-min)   ${String(r.avant.ecrasement_personnes_minutes).padStart(10)} ${String(r.apres.ecrasement_personnes_minutes).padStart(9)}`);
console.log(`densité max (pers./m²)   ${String(r.avant.densite_max).padStart(10)} ${String(r.apres.densite_max).padStart(9)}`);
console.log(`Plan : mode ${r.plan_choisi.mode}, portes fermées : ${Object.entries(r.plan_choisi.portes).filter(([, e]) => e === 'fermee').map(([p]) => p).join(', ') || 'aucune'}`);
console.log(`Leviers : ${r.leviers_choisis.map((l) => `${l.decideur}/${l.levier}@${l.minute}${l.repetitions > 1 ? `x${l.repetitions}` : ''}`).join(' ; ') || 'aucun'}`);
console.log(`Explication (${r.explication?.chiffres_verifies ? 'chiffres vérifiés' : 'CHIFFRES NON VÉRIFIÉS'}) : ${r.explication?.texte}`);
console.log(`Ordres de service : ${r.ordres_de_service.length}, tous vérifiés : ${r.ordres_de_service.every((o) => o.chiffres_verifies)}`);
console.log(`Temps réel : « avant » ${r.temps_reel.avant.duree_simulation_s} s, « après » ${r.temps_reel.apres.duree_simulation_s} s ; ${r.temps_reel.apres.ms_par_pas_moyen} ms par pas ; sous 10 s : ${r.temps_reel.simulation_sous_10_s ? 'oui' : 'non'}`);
console.log(`Écarts constatés : ${r.ecarts_constates.length} (voir bench/integration-adem/resultats.json et src/integration-adem/LISEZMOI.md)`);
