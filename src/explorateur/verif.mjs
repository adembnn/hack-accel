// Vérification bloquante du lot explorateur : node src/explorateur/verif.mjs
// 1) même graine = même note ; 2) une porte fermée par le plan ne voit passer personne ;
// 3) la manifestation compte : la variante la plus dure est pire que l'absence de cortège ; 4) un mini-balayage tourne en parallèle.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DOSSIER_FORUM } from './moteur.mjs';
import { variantes } from './scenario.mjs';
import { CONSIGNE_REELLE } from './plans.mjs';
import { comparer } from './run.mjs';
import { pool, explorer } from './explorer.mjs';

let echecs = 0;
const ok = (c, msg) => { console.log(`${c ? 'OK  ' : 'ÉCHEC'} ${msg}`); if (!c) echecs++; };
if (!existsSync(join(DOSSIER_FORUM, 'navgrid.json'))) {
  console.log('ÉCHEC navgrid.json absent : dans reports/maquettes/chatelet-3d, lancer ./recuperer-osm.sh puis python build_navgrid.py');
  process.exit(1);
}
const V = variantes(), dure = V.find((v) => v.id === 'est-3000-tot');
const fermeLouvre = { ...CONSIGNE_REELLE, id: 'test-louvre-ferme', fermees: ['Porte du Louvre'] };
const P = pool(4);
const [a, b, c, d] = await Promise.all([P.run(CONSIGNE_REELLE, dure, 1000), P.run(CONSIGNE_REELLE, dure, 1000), P.run(fermeLouvre, dure, 1000), P.run(CONSIGNE_REELLE, null, 1000)]);
await P.fermer();
ok(JSON.stringify(a) === JSON.stringify(b), `même graine, même note (non sortis ${a.non_sortis}, zone danger ${a.zone_danger}, t95 ${a.t95_s} s)`);
ok(!c.par_sortie['Porte du Louvre'], `Porte du Louvre fermée : ${c.par_sortie['Porte du Louvre'] || 0} passage (ouverte : ${a.par_sortie['Porte du Louvre'] || 0})`);
ok(comparer(a, d) > 0 || a.zone_danger > d.zone_danger, `la manifestation pèse : zone danger ${a.zone_danger} avec cortège contre ${d.zone_danger} sans`);
const r = await explorer(undefined, { plans: 3, mutants: 1, meilleurs: 1, fils: 12 });
const complets = r.classement.filter((x) => !x.elague);
ok(r.runs >= V.length + 3 && r.classement.length >= 4 && complets.every((x) => x.variantes.length === V.length),
  `mini-balayage : ${r.runs} runs en ${r.duree_s} s, ${r.classement.length} plans classés (${r.plans_elagues} élagués), chaque plan complet joué sur ses ${V.length} variantes`);
console.log(echecs ? `${echecs} échec(s)` : 'Explorateur : vérification verte');
process.exit(echecs ? 1 : 0);
