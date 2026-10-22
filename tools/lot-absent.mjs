// Stub : tant que le lot n'a pas ses tests, la commande passe.
// Quand le lot arrive, son propre script npm remplace la ligne correspondante dans package.json.
import { existsSync } from 'node:fs';

const [nom, dossier] = process.argv.slice(2);
console.log(`${nom} : lot absent (${dossier} n'existe pas encore), rien à vérifier.`);
if (existsSync(dossier)) console.log(`Attention : ${dossier} existe, remplace ce stub par la vraie commande.`);
