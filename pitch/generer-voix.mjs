// Génère la voix off du MP4 avec ElevenLabs, un mp3 par plan.
// Sans --oui-payant : n'affiche que le plan d'appel (caractères, URL, voix), sans aucun réseau.
// Avec --oui-payant ET ELEVENLABS_API_KEY dans l'environnement : appelle l'API et écrit pitch/audio/plan-N.mp3.
// Usage : node pitch/generer-voix.mjs [--oui-payant]
// Aucune dépendance. Ne lit aucun fichier .env : la clé vient uniquement de l'environnement.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dossier = dirname(fileURLToPath(import.meta.url));
const MODELE = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const VOIX = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
const OUI = process.argv.includes('--oui-payant');
const cle = process.env.ELEVENLABS_API_KEY || '';

const texte = readFileSync(join(dossier, 'voix-off.md'), 'utf8');
const plans = texte.split(/^## /m).slice(1)
  .filter((bloc) => /^Plan \d+/.test(bloc))
  .map((bloc) => {
    const [titre, ...corps] = bloc.split('\n');
    const m = titre.match(/Plan (\d+)/);
    return { n: Number(m[1]), titre: titre.trim(), texte: corps.join('\n').trim() };
  });

const marqueurs = plans.filter((p) => p.texte.includes('A_REMPLIR'));
if (marqueurs.length) {
  console.log('Refus : texte incomplet (A_REMPLIR) dans : ' + marqueurs.map((p) => 'plan ' + p.n).join(', '));
  process.exit(1);
}

let total = 0;
console.log(`Modèle : ${MODELE} · voix : ${VOIX}`);
for (const p of plans) {
  const n = [...p.texte].length;
  total += n;
  console.log(`Plan ${p.n} : ${n} caractères -> pitch/audio/plan-${p.n}.mp3`);
}
console.log(`Total : ${total} caractères (quota gratuit : 10 000 par mois)`);

if (!OUI) {
  console.log('Mode à blanc : aucun appel réseau. Pour générer : ELEVENLABS_API_KEY=... node pitch/generer-voix.mjs --oui-payant');
  process.exit(0);
}
if (!cle) {
  console.log('Refus : --oui-payant demandé mais ELEVENLABS_API_KEY absente de l\'environnement.');
  process.exit(1);
}

const sortie = join(dossier, 'audio');
mkdirSync(sortie, { recursive: true });
for (const p of plans) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOIX}`, {
    method: 'POST',
    headers: { 'xi-api-key': cle, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: p.texte, model_id: MODELE }),
  });
  if (!r.ok) {
    console.log(`Erreur plan ${p.n} : HTTP ${r.status}`);
    process.exit(1);
  }
  writeFileSync(join(sortie, `plan-${p.n}.mp3`), Buffer.from(await r.arrayBuffer()));
  console.log(`Écrit : pitch/audio/plan-${p.n}.mp3`);
}
