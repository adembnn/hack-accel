// Banc de validation du moteur de foule : node src/explorateur/validation/valider.mjs [--reco] [--rapide]
// Lance les expériences 1 à 5 en parallèle (worker_threads), imprime mesuré vs référence et un verdict PASS / ÉCART.
// --reco : rejoue tout avec les modifications recommandées (patches.mjs) appliquées à une COPIE de sim.js en mémoire.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { CONFIGS, DEFAUT } from './patches.mjs';

const ICI = fileURLToPath(import.meta.url);

if (!isMainThread) {
  const { mod, params } = workerData;
  const { job } = await import(new URL(mod, import.meta.url));
  parentPort.postMessage(await job(params));
}

function lancer(mod, params) {
  return new Promise((ok, ko) => {
    const w = new Worker(ICI, { workerData: { mod, params } });
    w.once('message', ok); w.once('error', ko);
  });
}
async function pool(taches, n) {
  const res = new Array(taches.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < taches.length) { const k = i++; res[k] = await lancer(...taches[k]); }
  }));
  return res;
}
const moy = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : 'n/a').replace('.', ',');
const pad = (s, n) => String(s).padEnd(n);
const verdict = (ok) => (ok ? 'PASS' : 'ÉCART');

async function principal() {
  const argReco = process.argv.find((a) => a.startsWith('--reco')), rapide = process.argv.includes('--rapide');
  const nomCfg = argReco ? (argReco.split('=')[1] || DEFAUT) : null, RECO = nomCfg ? CONFIGS[nomCfg] : null, reco = !!RECO;
  const patches = reco ? RECO.patches : [];
  const t0 = Date.now();
  const seeds = rapide ? [1] : [1, 2];
  const { DENSITES, weidmann, tolV } = await import('./exp1-diagramme.mjs');
  const taches = [];
  const dt = reco ? RECO.dt : 0.1;
  const marque = (nom, mod, params) => taches.push([mod, { ...params, patches, dt }, nom]);
  for (const rho of DENSITES) for (const graine of seeds) marque('e1', './exp1-diagramme.mjs', { rho, graine });
  const portes = [[1, 1], [1, 2], [1, 3], [0.2, 0.8], [0.2, 1.2], [0.2, 1.6], [0.2, 2.0], [0.2, 2.4]];
  for (const [res, largeur] of portes) for (const graine of [1, 2, 3]) marque('e2', './exp2-goulot.mjs', { res, largeur, graine });
  for (const type of ['escalier', 'escalator']) for (const graine of seeds) marque('e3', './exp3-escaliers.mjs', { type, graine });
  for (const graine of seeds) marque('e5', './exp5-contre-flux.mjs', { rho: 1, graine });
  const n = Math.max(2, Math.min(10, cpus().length - 6));
  console.log(`Banc de validation du moteur de foule${reco ? ' [AVEC modifications ' + nomCfg + ' : ' + RECO.resume + ']' : ' [sim.js tel quel]'} : ${taches.length} runs sur ${n} fils.\n`);
  const res = await pool(taches.map((t) => [t[0], t[1]]), n);
  const de = (nom) => res.filter((_, i) => taches[i][2] === nom);
  const sondes = res.map((r) => r.sonde);
  const vUni = (() => { const g = res.filter((_, i) => taches[i][2] === 'e1').map((r) => r.ligne).filter((x) => x.rhoVoulue === 1); return moy(g.map((x) => x.v)); })();
  const synthese = [];

  // --- 1 ---
  console.log('=== 1. Diagramme fondamental (couloir en anneau 40 x 4 m, 2 graines) - réf. Weidmann 1993 : v0 = 1,34 m/s, rho_max = 5,4 p/m2 ===');
  console.log(pad('rho voulue', 11) + pad('rho mesurée', 12) + pad('v sim (m/s)', 12) + pad('v Weidmann', 11) + pad('J sim', 8) + pad('J Weidmann', 11) + pad('tolérance', 14) + 'verdict');
  const r1 = de('e1').map((r) => r.ligne);
  let ok1 = 0, tot1 = 0, jmax = 0;
  for (const rho of DENSITES) {
    const g = r1.filter((x) => x.rhoVoulue === rho), rm = moy(g.map((x) => x.rho)), v = moy(g.map((x) => x.v)), J = moy(g.map((x) => x.J));
    const vW = weidmann(rm), tol = tolV(vW), ok = Math.abs(v - vW) <= tol;
    if (rho <= 4) { tot1++; ok1 += ok; }
    jmax = Math.max(jmax, J);
    console.log(pad(f(rho, 1), 11) + pad(f(rm), 12) + pad(f(v), 12) + pad(f(vW), 11) + pad(f(J), 8) + pad(f(rm * vW), 11) + pad(`±${f(tol)} m/s`, 14) + verdict(ok));
  }
  const okJ = jmax >= 0.98 && jmax <= 1.63;
  console.log(`Débit spécifique maximal du couloir : ${f(jmax)} p/m/s ; référence SFPE/Fruin 1,3 (tolérance ±25 % : 0,98 à 1,63) -> ${verdict(okJ)}`);
  synthese.push(['1 Diagramme fondamental v(rho)', `${ok1}/${tot1} densités (0,5 à 4) dans la tolérance`, 'Weidmann 1993', verdict(ok1 === tot1)]);
  synthese.push(['1 Débit maximal J', `${f(jmax)} p/m/s`, 'SFPE/Fruin 1,3 +-25 %', verdict(okJ)]);

  // --- 2 ---
  console.log('\n=== 2. Goulot : salle 12 x 10 m, 150 personnes, une porte - réf. J_s ~ 1,6-1,9 p/m/s (Seyfried 2009, Kretz 2006, Liddle), dimensionnement 1,3 ===');
  console.log(pad('grille', 9) + pad('porte (m)', 11) + pad('flux (p/s)', 12) + pad('J_s (p/m/s)', 13) + pad('sortis', 9) + 'tolérance [1,3 ; 2,0]  verdict');
  const r2 = de('e2').map((r) => r.ligne);
  const js = [];
  for (const [res, largeur] of portes) {
    const g = r2.filter((x) => x.res === res && Math.abs(x.largeur - largeur) < 1e-6), fl = moy(g.map((x) => x.flux)), Js = moy(g.map((x) => x.Js)), so = moy(g.map((x) => x.sortis));
    js.push(Js);
    const ok = Js >= 1.3 && Js <= 2.0;
    console.log(pad(res === 1 ? '1 m' : '0,2 m', 9) + pad(f(largeur, 1), 11) + pad(f(fl), 12) + pad(f(Js), 13) + pad(f(so, 0) + '/150', 9) + pad('', 23) + verdict(ok));
  }
  const n2 = js.filter((x) => x >= 1.3 && x <= 2.0).length;
  console.log(`J_s moyen toutes largeurs : ${f(moy(js))} p/m/s (min ${f(Math.min(...js))}, max ${f(Math.max(...js))}) ; ${n2}/${js.length} largeurs dans [1,3 ; 2,0].`);
  synthese.push(['2 Goulot J_s', `${f(moy(js))} p/m/s (${f(Math.min(...js))} à ${f(Math.max(...js))})`, 'Seyfried/Kretz 1,6-1,9 ; SFPE 1,3', verdict(n2 === js.length)]);

  // --- 3 ---
  console.log('\n=== 3. Escalier et escalator : file de 120 personnes au pied, lien de 7 m le long de la pente ===');
  console.log(pad('lien', 11) + pad('débit mesuré', 14) + pad('param.', 8) + pad('trajet (s)', 12) + pad('v pente', 11) + 'référence');
  const r3 = de('e3').map((r) => r.ligne);
  for (const type of ['escalier', 'escalator']) {
    const g = r3.filter((x) => x.type === type), d = moy(g.map((x) => x.debit)), tr = moy(g.map((x) => x.trajet)), v = moy(g.map((x) => x.vPente));
    if (type === 'escalier') {
      const okv = v >= 0.5 && v <= 0.7, okd = Math.abs(d - g[0].debitParam) <= 0.1 * g[0].debitParam;
      console.log(pad(type, 11) + pad(f(d) + ' p/s', 14) + pad(g[0].debitParam, 8) + pad(f(tr, 1), 12) + pad(f(v) + ' m/s', 11) + `v 0,5-0,7 (Fruin 1971, Weidmann 1993) -> ${verdict(okv)} ; débit = paramètre +-10 % -> ${verdict(okd)}`);
      synthese.push(['3 Escalier : vitesse le long de la pente', `${f(v)} m/s`, '0,5-0,7 m/s', verdict(okv)]);
      synthese.push(['3 Escalier : débit', `${f(d)} p/s (largeur non modélisée)`, 'SFPE 1,0-1,3 p/m/s x 1,5-2,5 m', verdict(d >= 1.5 && d <= 3.2)]);
    } else {
      const okd = d >= 1.0 && d <= 1.4, okv = Math.abs(v - 0.75) <= 0.05;
      console.log(pad(type, 11) + pad(f(d) + ' p/s', 14) + pad(g[0].debitParam, 8) + pad(f(tr, 1), 12) + pad(f(v) + ' m/s', 11) + `débit pratique 1,0-1,4 p/s (Al-Sharif 1996, Kinsey) -> ${verdict(okd)} ; v 0,75 +-0,05 -> ${verdict(okv)}`);
      synthese.push(['3 Escalator : débit', `${f(d)} p/s`, '1,0-1,4 p/s', verdict(okd)]);
      synthese.push(['3 Escalator : vitesse', `${f(v)} m/s`, '0,75 m/s nominal', verdict(okv)]);
    }
  }

  // --- 5 ---
  console.log('\n=== 5. Contre-flux : couloir en anneau 40 x 4 m, 1 p/m2 mélangé 50/50, 150 s, 2 graines ===');
  const r5 = de('e5').map((r) => r.ligne);
  const phi = moy(r5.map((x) => x.phiFin)), nulle = moy(r5.map((x) => x.phiNulle));
  console.log(`Paramètre d'ordre Phi final : ${f(phi)} (hypothèse nulle, directions mélangées : ${f(nulle, 3)} ; files parfaites : 1,00)`);
  console.log('Phi(t) graine 1 : ' + r5[0].serie.map(([t, p]) => `${t}s:${f(p)}`).join('  '));
  console.log(`Bandes de direction dominante sur 3,4 m : ${f(moy(r5.map((x) => x.files)), 1)} ; vitesse moyenne |vx| = ${f(moy(r5.map((x) => x.vit)))} m/s ; dérive nette = ${f(moy(r5.map((x) => x.vitMoyDir)))} m/s`);
  const prog = moy(r5.map((x) => x.vitMoyDir)), okProg = prog >= 0.7 * vUni;
  const v5 = phi >= 0.5 ? 'PASS' : phi >= 0.2 ? 'ÉCART (files partielles)' : 'ÉCART (pas de files)';
  console.log(`Progression nette dans le sens voulu : ${f(prog)} m/s contre ${f(vUni)} m/s en flux unique à 1 p/m2 (tolérance : >= 70 %) -> ${verdict(okProg)}`);
  console.log(`Verdict files : ${v5} (PASS si Phi >= 0,5 ; partiel 0,2-0,5)`);
  synthese.push(['5 Contre-flux : files', `Phi = ${f(phi)} (nul ${f(nulle, 2)})`, 'Helbing-Molnár 1995 ; Zhang 2012 : files nettes', v5]);
  synthese.push(['5 Contre-flux : progression', `${f(prog)} m/s (${f((100 * prog) / vUni, 0)} % du flux unique)`, '>= 70 % du flux unique', verdict(okProg)]);

  // --- 4 ---
  const cumul = (liste) => liste.reduce((a, s) => ({ agentPas: a.agentPas + s.agentPas, ag: a.ag + s.agentsChevauchants, pen: Math.max(a.pen, s.penMax), mur: a.mur + s.dansMur, corps: a.corps + s.corpsDansMur, cm: Math.max(a.cm, s.rhoCaseMax), ls: Math.max(a.ls, s.rhoLisseMax) }), { agentPas: 0, ag: 0, pen: 0, mur: 0, corps: 0, cm: 0, ls: 0 });
  const dense = (i) => taches[i][2] === 'e1' && taches[i][1].rho >= 2;
  const Sf = cumul(sondes.filter((_, i) => !dense(i))), Sd = cumul(sondes.filter((_, i) => dense(i))), St = cumul(sondes);
  console.log(`
=== 4. Collisions, murs, densité maximale (${taches.length} runs, ${f(St.agentPas / 1e6)} M observations marcheur-pas) ===`);
  const ligne4 = (nom, S) => console.log(`${pad(nom, 42)}chevauchement (d < 0,46 m) : ${pad(f((100 * S.ag) / S.agentPas, 2) + ' %', 9)} pén. max ${f(S.pen)} m | centre hors case praticable : ${S.mur} | corps dans un mur : ${S.corps} | case 1 m2 max : ${S.cm} | lissée max : ${f(S.ls)} p/m2`);
  ligne4('Régime courant (rho < 2, goulots, liens)', Sf);
  ligne4('Couloir dense (rho voulue >= 2)', Sd);
  console.log('Repères : diamètre du corps 0,48 m ; empilement hexagonal maximal = 5,01 p/m2 ; limite physique citée ~6-8 p/m2.');
  const frF = Sf.ag / Sf.agentPas, frD = Sd.ag / Math.max(1, Sd.agentPas);
  synthese.push(['4 Marcheurs dans un mur (centre)', `${St.mur}`, '0', verdict(St.mur === 0)]);
  synthese.push(['4 Chevauchements, régime courant', `${f(100 * frF, 2)} %, pén. max ${f(Sf.pen)} m`, '< 1 % et < 0,12 m', verdict(frF < 0.01 && Sf.pen < 0.12)]);
  synthese.push(['4 Chevauchements, couloir dense', `${f(100 * frD, 2)} %, pén. max ${f(Sd.pen)} m`, '< 1 % et < 0,12 m', verdict(frD < 0.01 && Sd.pen < 0.12)]);
  synthese.push(['4 Densité max lissée (tous runs)', `${f(St.ls)} p/m2 (case 1 m2 : ${St.cm})`, '<= 8 p/m2', verdict(St.ls <= 8)]);


  console.log('\n=== SYNTHÈSE ===');
  console.log(pad('Mesure', 40) + pad('Mesuré', 50) + pad('Référence', 50) + 'Verdict');
  for (const [a, b, c, d] of synthese) console.log(pad(a, 40) + pad(b, 50) + pad(c, 50) + d);
  console.log(`\nDurée : ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
}

if (isMainThread) await principal();
