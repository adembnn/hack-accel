// Résumé lisible par la vue 3D : la consigne réelle et les 3 meilleurs plans, avec leur pire variante.
// Écrit reports/maquettes/commun/plans-forum.json (donnée générée, non commitée). Usage : node src/explorateur/vers-vue.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ICI = dirname(fileURLToPath(import.meta.url));
export const SORTIE_VUE = join(ICI, '..', '..', 'reports', 'maquettes', 'commun', 'plans-forum.json');

export function versVue(r) {
  const court = (x) => ({ plan: x.plan, etape: x.etape, pire: x.pire, variantes: x.variantes.map(({ par_sortie, ...n }) => n) });
  return {
    genere: new Date().toISOString(), imposees: r.imposees, variantes: r.variantes, runs: r.runs, duree_s: r.duree_s,
    plans_essayes: r.plans_essayes, plans_elagues: r.plans_elagues, rang_reference: r.rang_reference,
    reference: court(r.reference), meilleurs: r.classement.filter((x) => !x.elague).slice(0, 3).map(court),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = JSON.parse(readFileSync(join(ICI, 'resultats.json'), 'utf8'));
  writeFileSync(SORTIE_VUE, JSON.stringify(versVue(r), null, 1));
  console.log('Écrit', SORTIE_VUE);
}
