// outil de mise au point (pas dans le livrable final) : essaie des jeux de patches sur l'exp 1
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
if (!isMainThread) {
  const { mod, params } = workerData; const { job } = await import(new URL(mod, import.meta.url));
  parentPort.postMessage(await job(params));
} else {
  const DT0 = +(process.env.DT || 0.1);
  const L0 = '.3+.7*(1+cos)/2';
  const jeux = JSON.parse(process.argv[2]);   // { nom: [[de,vers],...] }
  const rhos = JSON.parse(process.argv[3] || '[1,2,3,4]');
  const mod = process.argv[4] || './exp1-diagramme.mjs';
  const taches = [];
  for (const [nom, patches] of Object.entries(jeux)) for (const rho of rhos) taches.push([nom, rho, patches]);
  const res = new Array(taches.length); let i = 0;
  await Promise.all(Array.from({ length: 12 }, async () => { while (i < taches.length) { const k = i++; const [nom, rho, patches] = taches[k];
    res[k] = await new Promise((ok, ko) => { const w = new Worker(ICI, { workerData: { mod, params: { rho, patches, chauffe: 25, mesure: 20, dt: DT0 } } }); w.once('message', ok); w.once('error', ko); }); } }));
  taches.forEach(([nom, rho], k) => { const { ligne: l, sonde: s } = res[k];
    console.log(nom.padEnd(14), 'rho', String(rho).padEnd(4), 'rhoMes', l.rho.toFixed(2), 'v', l.v.toFixed(2), 'vW', l.vW.toFixed(2), 'J', l.J.toFixed(2), 'chev%', (100 * s.agentsChevauchants / s.agentPas).toFixed(2), 'pen', s.penMax.toFixed(2), 'lisse', s.rhoLisseMax.toFixed(1)); });
}
