// Démo « optimisation linéaire » : la borne physique de l'évacuation du Forum des Halles.
// Usage : node src/sim/optim/demo-optim.ts
import { readFileSync } from 'node:fs';
import { bornePhysique, comparerFermeture, type Borne, type GrapheForum } from './borne.ts';

const graphe = JSON.parse(readFileSync(new URL('./donnees/forum-graph.json', import.meta.url), 'utf8')) as GrapheForum;
const DEMANDE = 3000; // spectateurs du cinéma
const nom = (id: string) => graphe.nodes.find((n) => n.id === id)?.name ?? id;
const fmt = (x: number) => Math.round(x).toLocaleString('fr-FR');
const dur = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s` : 'impossible');

const base = bornePhysique(graphe, DEMANDE);
console.log('Optimisation linéaire : flot maximal sur le graphe du Forum des Halles (61 lieux, 134 passages)\n');
console.log('Capacité de chaque porte, prise seule, depuis le cinéma (personnes par heure)');
Object.entries(base.capacite_par_issue_pers_h)
  .sort((a, b) => b[1] - a[1])
  .forEach(([id, c]) => console.log(`  ${nom(id).padEnd(36)} ${fmt(c).padStart(8)}`));
console.log(`  ${'TOTAL, toutes portes ouvertes'.padEnd(36)} ${fmt(base.capacite_totale_pers_h).padStart(8)}`);
console.log('\nGoulot (coupe minimale : ces passages saturés limitent tout le reste)');
base.goulot.forEach((m) =>
  console.log(`  ${m.de} (niv. ${m.niveau_de}) -> ${m.vers}${m.type === 'porte' ? '' : ` (niv. ${m.niveau_vers})`} : ${fmt(m.capacite_pers_h)} pers./h`),
);

const ligne = (titre: string, b: Borne, perte?: number) =>
  console.log(`  ${titre.padEnd(34)} ${fmt(b.capacite_totale_pers_h).padStart(8)} pers./h   ${dur(b.t_min_s).padStart(10)}${perte === undefined ? '' : `   (capacité -${perte.toFixed(1)} %)`}`);

console.log(`\nTemps minimal pour évacuer ${fmt(DEMANDE)} personnes du cinéma`);
console.log(`  ${'Situation'.padEnd(34)} ${'capacité'.padStart(8)}          ${'T_min'.padStart(10)}`);
ligne('Toutes portes ouvertes', base);
const lescot = comparerFermeture(graphe, DEMANDE, ['S_Porte_Lescot']);
ligne('Porte Lescot fermée', lescot.apres, lescot.perte_capacite_pct);
const louvre = comparerFermeture(graphe, DEMANDE, ['S_Porte_du_Louvre']);
ligne('Porte du Louvre fermée', louvre.apres, louvre.perte_capacite_pct);
const quais = comparerFermeture(graphe, DEMANDE, graphe.nodes.filter((n) => n.kind === 'quai').map((n) => n.id));
ligne('Quais RER saturés', quais.apres, quais.perte_capacite_pct);

console.log('\nLecture : le goulot est dans les couloirs qui sortent du cinéma, pas dans les portes ; fermer Lescot ou couper les quais RER ne change rien à la borne, fermer la porte du Louvre (qui porte l\'un des deux passages saturés) la dégrade.');
console.log(`\nBorne physique : aucun plan ne peut faire mieux que ${dur(base.t_min_s)} (toutes portes ouvertes), ni que ${dur(lescot.apres.t_min_s)} avec la porte Lescot fermée.`);
console.log('Hypothèses : largeurs des portes (4 m, 1,4 m pour les secours) × 1,3 pers./s/m ; pas de 10 s ; voir src/sim/optim/LISEZMOI.md.');
console.log('Données : © contributeurs OpenStreetMap (ODbL).');
