import * as e1 from './exp1-diagramme.mjs';
import * as e2 from './exp2-goulot.mjs';
import { RECO } from './patches.mjs';
const [AN, VD, LA] = RECO.patches;
const an = (r, l) => ['.3+.7*(1+cos)/2', `d<${r}?1:${l}+${(1 - l).toFixed(2)}*(1+cos)/2`];
const jeux = { 'r.5 l.3': [an(.5, .3), LA], 'r.5 l.5': [an(.5, .5), LA], 'r.55 l.4': [an(.55, .4), LA], 'r.6 l.3': [an(.6, .3), LA], 'r.6 l.5': [an(.6, .5), LA], 'r.6 l.5 +VD': [an(.6, .5), VD, LA] };
const out = await Promise.all(Object.entries(jeux).map(async ([n, p]) => {
  const d1 = (await e2.job({ largeur: 2, patches: p, dt: .05, graine: 1 })).ligne.Js;
  const d3 = (await e2.job({ largeur: 3, patches: p, dt: .05, graine: 1 })).ligne.Js;
  const c = [];
  for (const rho of [2, 3]) { const r = await e1.job({ rho, patches: p, dt: .05, chauffe: 25, mesure: 20 }); c.push(`rho${rho}: v ${r.ligne.v.toFixed(2)} (W ${r.ligne.vW.toFixed(2)}) chev ${(100 * r.sonde.agentsChevauchants / r.sonde.agentPas).toFixed(1)}%`); }
  return `${n.padEnd(14)} porte2m ${d1.toFixed(2)} porte3m ${d3.toFixed(2)} | ${c.join(' | ')}`;
}));
console.log(out.join('\n'));
