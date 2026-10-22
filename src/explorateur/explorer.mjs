// L'explorateur : joue des centaines de runs en parallèle et classe les plans du directeur sur leur pire variante.
// Usage : node src/explorateur/explorer.mjs [--plans 40] [--mutants 6] [--meilleurs 5] [--fils N]
import { Worker } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { IMPOSEES, variantes } from './scenario.mjs';
import { CONSIGNE_REELLE, plansParRegles, muter } from './plans.mjs';
import { preparerMonde, sortiesDuMonde, pireNote, comparer } from './run.mjs';
import { versVue, SORTIE_VUE } from './vers-vue.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));

export function pool(nFils) {
  const fils = Array.from({ length: nFils }, () => new Worker(join(ICI, 'fil.mjs')));
  const libres = [...fils], file = [], attente = new Map();
  let id = 0;
  const lancer = () => {
    while (libres.length && file.length) { const w = libres.pop(), j = file.shift(); w.job = j; w.postMessage(j.msg); }
  };
  fils.forEach((w) => w.on('message', (r) => {
    const j = attente.get(r.id); attente.delete(r.id); libres.push(w); lancer();
    r.erreur ? j.rej(new Error(r.erreur)) : j.res(r.note);
  }));
  return {
    run: (plan, variante, graine) => new Promise((res, rej) => { const msg = { id: ++id, plan, variante, graine }; attente.set(msg.id, { res, rej }); file.push({ msg }); lancer(); }),
    fermer: () => Promise.all(fils.map((w) => w.terminate())),
  };
}

export async function explorer(imposees = IMPOSEES, o = {}) {
  const t0 = Date.now(), V = variantes(), graine = (i) => 1000 + i;
  const sorties = sortiesDuMonde(await preparerMonde(1));
  const P = pool(o.fils ?? Math.max(1, availableParallelism() - 2));
  let runs = 0, ordre = V.map((_, i) => i);
  const garde = o.meilleurs ?? 5, finis = [];
  const compter = (n) => { runs++; if (o.bavard && runs % 40 === 0) console.log(`  ${runs} runs (${Math.round((Date.now() - t0) / 1000)} s)`); return n; };
  // Le classement se fait sur la pire variante : un plan dont la pire note partielle est déjà moins bonne que celle du
  // 5e meilleur plan complet ne peut plus entrer dans les 5 premiers. On joue donc les variantes les plus dures d'abord,
  // et on arrête ce plan-là (élagage exact, sans approximation).
  const seuil = () => (finis.length >= garde ? [...finis].sort(comparer)[garde - 1] : null);
  const evaluer = async (plans, etape, { complet = false } = {}) => Promise.all(plans.map(async (plan) => {
    const notes = [];
    if (complet) notes.push(...await Promise.all(V.map((v, i) => P.run(plan, v, graine(i)).then(compter))));
    else for (const i of ordre) {
      notes.push(compter(await P.run(plan, V[i], graine(i))));
      const s = seuil();
      if (s && comparer(pireNote(notes), s) > 0) return { plan, etape, pire: pireNote(notes), variantes: notes, elague: true };
    }
    const pire = pireNote(notes); finis.push(pire);
    return { plan, etape, pire, variantes: notes, elague: false };
  }));
  try {
    const base = await evaluer([CONSIGNE_REELLE], 'référence', { complet: true });
    ordre = base[0].variantes.map((n, i) => [n, i]).sort((x, y) => comparer(y[0], x[0])).map((x) => x[1]);
    const temps1 = await evaluer(plansParRegles(sorties, o.plans ?? 40), 'règles');
    const tri = (a) => [...a].sort((x, y) => comparer(x.pire, y.pire));
    const meilleurs = tri(temps1.filter((r) => !r.elague)).slice(0, garde);
    const temps2 = await evaluer(meilleurs.flatMap((r, i) => muter(r.plan, sorties, o.mutants ?? 6, 77 + i)), 'mutation');
    // Les plans complets d'abord, classés ; les plans élagués ensuite (leur note est une borne : « au moins aussi mauvais »).
    const tous = [...base, ...temps1, ...temps2], classement = [...tri(tous.filter((r) => !r.elague)), ...tri(tous.filter((r) => r.elague))];
    const rang = (id) => classement.findIndex((r) => r.plan.id === id) + 1;
    return { imposees, variantes: V, ordre_variantes: ordre.map((i) => V[i].id), plans_essayes: tous.length, plans_elagues: tous.filter((r) => r.elague).length, sorties, runs, duree_s:Math.round((Date.now() - t0) / 1000), reference: base[0], rang_reference: rang(CONSIGNE_REELLE.id), classement };
  } finally { await P.fermer(); }
}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? Number(process.argv[i + 1]) : d; };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await explorer(IMPOSEES, { plans: arg('plans', 40), mutants: arg('mutants', 6), meilleurs: arg('meilleurs', 5), fils: arg('fils', undefined), bavard: true });
  writeFileSync(join(ICI, 'resultats.json'), JSON.stringify(r));
  writeFileSync(SORTIE_VUE, JSON.stringify(versVue(r), null, 1));
  const ligne = (x) => { const p = x.pire; return `${x.plan.id.padEnd(16)} rouge ${p.rouge ? 'OUI' : 'non'}  non sortis ${String(p.non_sortis).padStart(4)}  zone danger ${String(p.zone_danger).padStart(4)}  t95 ${String(p.t95_s ?? '—').padStart(4)} s  agents ${String(p.agents).padStart(3)}  pire variante ${p.variante}`; };
  console.log(`\n${r.plans_essayes} plans essayés (${r.plans_elagues} élagués avant la fin), ${r.runs} runs en ${r.duree_s} s. Référence (consigne réelle) classée ${r.rang_reference}e sur ${r.classement.length}.`);
  console.log('Référence :', ligne(r.reference));
  console.log('Trois meilleurs :'); r.classement.slice(0, 3).forEach((x) => console.log('  ' + ligne(x) + '\n    ' + x.plan.nom));
}
