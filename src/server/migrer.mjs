// Applique le schéma : `DATABASE_URL=... node src/server/migrer.mjs`
import { ouvrir, migrer } from './db.mjs';

const pool = ouvrir();
await migrer(pool);
console.log('Schéma appliqué.');
await pool.end();
