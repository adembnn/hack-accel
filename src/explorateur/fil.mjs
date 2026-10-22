// Fil de calcul : reçoit des runs {plan, variante, graine}, rend leurs notes.
import { parentPort } from 'node:worker_threads';
import { jouer } from './run.mjs';

parentPort.on('message', async (job) => {
  try { parentPort.postMessage({ id: job.id, note: await jouer(job.plan, job.variante, job.graine) }); }
  catch (e) { parentPort.postMessage({ id: job.id, erreur: String(e && e.stack || e) }); }
});
