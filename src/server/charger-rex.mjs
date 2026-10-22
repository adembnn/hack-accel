// Charge le corpus de départ de REX publics (recherche/09-rex-seed.json) dans PostgreSQL. Idempotent :
// rejouable sans doublon (empreinte unique par REX, texte unique par leçon).
//   DATABASE_URL=... node src/server/charger-rex.mjs [chemin-du-json]
// Ce sont des données publiques sourcées (source_url, confiance) ; les leçons entrent TOUJOURS en statut non_verifiee.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as db from './db.mjs';
import { masquer } from './valider.mjs';

const RACINE = fileURLToPath(new URL('../../', import.meta.url));
export const CHEMIN_PAR_DEFAUT = [`${RACINE}recherche/09-rex-seed.json`, `${RACINE}../recherche/09-rex-seed.json`]
  .find(existsSync) ?? `${RACINE}recherche/09-rex-seed.json`;

const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export async function chargerRex(pool, chemin = CHEMIN_PAR_DEFAUT) {
  const brut = JSON.parse(readFileSync(chemin, 'utf8'));
  const liste = Array.isArray(brut) ? brut : Object.values(brut);
  await db.enregistrerScene(pool, { id: 'forum-des-halles', nom: 'Forum des Halles (Châtelet)' });
  await db.enregistrerScene(pool, { id: 'rex-publics', nom: 'REX publics hors Forum (autres sites, pour comparaison)' });
  const bilan = { rex: 0, rexDejaPresents: 0, lecons: 0 };

  for (const x of liste) {
    const duForum = /halles|châtelet|chatelet/i.test(`${x.lieu} ${x.enseigne_ou_zone}`);
    const sceneId = duForum ? 'forum-des-halles' : 'rex-publics';
    const enseigneId = slug(x.enseigne_ou_zone);
    await db.enregistrerEnseigne(pool, { id: enseigneId, sceneId, nom: x.enseigne_ou_zone, zone: x.lieu ?? '' });
    const empreinte = createHash('sha256').update([x.date, enseigneId, x.type_incident, x.source_url].join('|')).digest('hex');
    const etiquettes = [`incident:${slug(x.type_incident.split(/ [/(]/)[0])}`, duForum ? 'lieu:forum-des-halles' : 'lieu:externe'];
    const rex = await db.enregistrerRex(pool, {
      enseigneId, dateIncident: x.date, zone: x.lieu ?? '', typeIncident: x.type_incident, description: x.resume,
      decisionsPrises: x.decisions ?? '', resultat: x.resultat ?? '',
      dureeMinutes: x.duree_min ?? null, personnesTouchees: x.personnes ?? null,
      leconsEnseigne: (x.lecons ?? []).join(' | '), etiquettes,
      sourceUrl: x.source_url ?? null, confiance: x.confiance ?? null, empreinte,
    });
    if (rex) bilan.rex++; else bilan.rexDejaPresents++;
    const rexId = rex?.id ?? (await pool.query('SELECT id FROM rex_crises WHERE empreinte=$1', [empreinte])).rows[0].id;
    for (const texte of x.lecons ?? []) {
      // Les leçons servent aux décideurs du Forum, d'où qu'elles viennent ; la provenance dit d'où.
      await db.enregistrerLecon(pool, {
        sceneId: 'forum-des-halles', texte, etiquettes, auteur: 'corpus-public', rexIds: [rexId],
        provenance: { source: x.source_url ?? null, origine: duForum ? 'forum' : 'rex public externe', confiance_source: x.confiance ?? null },
      });
      bilan.lecons++;
    }
  }
  return bilan;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const pool = db.ouvrir();
    await db.migrer(pool);
    console.log(await chargerRex(pool, process.argv[2]));
    await pool.end();
  } catch (e) {
    console.error('chargement impossible :', masquer(e.message));
    process.exit(1);
  }
}
