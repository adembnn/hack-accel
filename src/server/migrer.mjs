// Applique le schéma : `DATABASE_URL=... node src/server/migrer.mjs`
import { ouvrir, migrer } from './db.mjs';
import { masquer } from './valider.mjs';

try {
  const pool = ouvrir();
  await migrer(pool);
  console.log('Schéma appliqué.');
  await pool.end();
} catch (e) {
  console.error('migration impossible :', masquer(e.message));   // jamais l'objet d'erreur brut
  process.exit(1);
}
