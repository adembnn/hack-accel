// Adaptateur PostgreSQL de StockageRex (lot decideurs) sur le schéma du lot aiven (infra/schema.sql).
//
// REX -> rex_crises (+ enseignes). Les champs du lot decideurs qui n'ont pas de colonne propre sont codés ainsi :
//  - id (texte, ex. « r1 ») : étiquette `rex:<id>` dans rex_crises.etiquettes (index GIN) ; les leçons y renvoient.
//  - mesures (liste) : JSON dans decisions_prises ; efficace : resultat = 'efficace' | 'inefficace' | ''.
//  - enseigne (nom) : ligne de enseignes (id = nom sans accents ni majuscules, préfixé par la scène si ce nom existe déjà dans une autre scène).
//  - duree_min : arrondie à l'entier (la colonne duree_minutes est un entier).
//  - date : seule la partie jour (AAAA-MM-JJ) est conservée (colonne date).
//  - empreinte : empreinteRex(), index unique du schéma -> un REX en double est refusé comme en mémoire.
//  - suspect / motifs_suspects : posés par validerRex (marqués, jamais corrigés ni supprimés).
// Les REX chargés par le lot aiven (charger-rex.mjs) sans étiquette `rex:` sont relus avec l'id `db:<id>`.
//
// RÔLE D'ÉCRITURE (A4 du red team). Le schéma crée `enseigne_ecriture` (NOLOGIN, INSERT sur rex_crises seulement,
// ni lecture, ni DDL). Une connexion ne peut pas s'authentifier sous un rôle NOLOGIN : l'adaptateur garde donc la
// connexion du serveur et ENDOSSE le rôle par `SET LOCAL ROLE enseigne_ecriture` à l'intérieur de la transaction
// qui insère le REX (SET LOCAL : le rôle est rendu automatiquement au COMMIT/ROLLBACK, jamais conservé par le pool).
// Condition : l'utilisateur de DATABASE_URL doit pouvoir endosser le rôle (superutilisateur, ou membre avec
// l'option SET : `GRANT enseigne_ecriture TO <utilisateur> WITH SET TRUE`, à faire par l'administrateur Aiven,
// notamment depuis PostgreSQL 16 où le créateur d'un rôle n'obtient plus l'option SET d'office).
// Sous ce rôle, seul l'INSERT du REX est exécuté, sans RETURNING ni ON CONFLICT (qui demanderaient SELECT).
// L'enseigne elle-même (table enseignes) et les lectures passent par le rôle normal du serveur.
//
// LEÇONS -> lecons + lecons_sources. texte = énoncé ; statut = celui du lot decideurs (non_verifiee | contradictoire
// | validee_par_simulation) ; provenance = { auteur, date, run_id?, validation?, adaptateur: 'decideurs', detail }
// où detail porte les champs sans colonne (id, type_incident, zone, fréquence, durées, chiffres, sources).
// Une leçon validée exige un run existant (uuid de la table runs) : la base l'impose (lecons_validee_exige_run) et
// l'adaptateur refuse avant d'écrire si le run n'est pas un uuid. remplacerLecons ne touche que les leçons écrites par
// cet adaptateur (provenance.adaptateur = 'decideurs') : les leçons d'autres lots restent intactes.
import type { Lecon, RexCrise, StockageRex, StatutLecon } from '../../agents/rex.ts';
import { LIMITES, validerRex, empreinteRex } from '../../agents/limites.ts';
import type { PoolPg } from './pool.ts';
import { transaction } from './pool.ts';

const ROLE_ENSEIGNE = 'enseigne_ecriture';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const idEnseigne = (nom: string): string =>
  nom.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'enseigne';

const jour = (date: string): string => {
  const m = /^\d{4}-\d{2}-\d{2}/.exec(date);
  return m ? m[0] : new Date(date).toISOString().slice(0, 10);
};

function lireMesures(texte: string): string[] {
  try {
    const x: unknown = JSON.parse(texte);
    if (Array.isArray(x) && x.every((m) => typeof m === 'string')) return x;
  } catch { /* texte libre d'un REX chargé par un autre lot */ }
  return texte ? [texte] : [];
}

export class StockageRexPg implements StockageRex {
  #pool: PoolPg;
  #sceneId: string;
  constructor(pool: PoolPg, sceneId: string) { this.#pool = pool; this.#sceneId = sceneId; }

  // enseignes.id est unique pour toute la base : si le nom normalisé appartient déjà à une AUTRE scène,
  // l'enseigne de cette scène prend l'id préfixé `<scène>:<nom>`.
  async #idEnseigneDeLaScene(nom: string): Promise<string> {
    const simple = idEnseigne(nom);
    const r = await this.#pool.query('SELECT scene_id FROM enseignes WHERE id = $1', [simple]);
    return !r.rowCount || r.rows[0].scene_id === this.#sceneId ? simple : `${this.#sceneId}:${simple}`;
  }

  async ajouterRex(r: RexCrise): Promise<void> {
    const v = validerRex(r);
    if (!v.ok) throw new Error(`REX rejeté : ${v.erreurs.join(' ; ')}`);
    const enseigneId = await this.#idEnseigneDeLaScene(r.enseigne);
    const deja = await this.#pool.query('SELECT count(*)::int AS n FROM rex_crises WHERE enseigne_id = $1', [enseigneId]);
    if ((deja.rows[0].n as number) >= LIMITES.rex_par_enseigne) throw new Error(`plus de ${LIMITES.rex_par_enseigne} REX pour l'enseigne ${r.enseigne}`);
    try {
      await transaction(this.#pool, async (c) => {
        await c.query(
          `INSERT INTO enseignes (id, scene_id, nom, zone) VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom`, [enseigneId, this.#sceneId, r.enseigne, r.zone]);
        await c.query(`SET LOCAL ROLE ${ROLE_ENSEIGNE}`);
        await c.query(
          `INSERT INTO rex_crises (enseigne_id, date_incident, zone, type_incident, description, decisions_prises, resultat,
             duree_minutes, personnes_touchees, etiquettes, suspect, motifs_suspects, empreinte)
           VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10::text[], $11, $12::text[], $13)`,
          [enseigneId, jour(r.date), r.zone, r.type_incident, r.description, JSON.stringify(r.mesures),
           r.efficace === undefined ? '' : r.efficace ? 'efficace' : 'inefficace',
           Math.round(r.duree_min), r.personnes_touchees ?? null,
           [`rex:${r.id}`, `type:${r.type_incident}`, `zone:${r.zone}`],
           v.suspects.length > 0, v.suspects, empreinteRex(r)]);
        await c.query('RESET ROLE');
      });
    } catch (e) {
      if ((e as { code?: string }).code === '23505') throw new Error('REX en double (même empreinte)');
      throw e;
    }
  }

  async listerRex(): Promise<RexCrise[]> {
    const r = await this.#pool.query(
      `SELECT x.id, e.nom, x.zone, x.type_incident, to_char(x.date_incident, 'YYYY-MM-DD') AS jour, x.duree_minutes,
              x.personnes_touchees, x.description, x.decisions_prises, x.resultat,
              (SELECT substr(t, 5) FROM unnest(x.etiquettes) t WHERE t LIKE 'rex:%' LIMIT 1) AS id_rex
       FROM rex_crises x JOIN enseignes e ON e.id = x.enseigne_id
       WHERE e.scene_id = $1 ORDER BY x.id`, [this.#sceneId]);
    return r.rows.map((l) => ({
      id: (l.id_rex as string | null) ?? `db:${l.id}`,
      enseigne: l.nom as string,
      zone: l.zone as string,
      type_incident: l.type_incident as string,
      date: l.jour as string,
      duree_min: (l.duree_minutes as number | null) ?? 0,
      ...(l.personnes_touchees === null ? {} : { personnes_touchees: l.personnes_touchees as number }),
      description: l.description as string,
      mesures: lireMesures(l.decisions_prises as string),
      ...(l.resultat === 'efficace' ? { efficace: true } : l.resultat === 'inefficace' ? { efficace: false } : {}),
    }));
  }

  async remplacerLecons(lecons: Lecon[]): Promise<void> {
    for (const l of lecons) {
      if (l.statut === 'validee_par_simulation' && !UUID.test(l.provenance.validation?.run_id ?? '')) {
        throw new Error(`leçon ${l.id} : validée par simulation, mais le run de validation n'est pas un uuid de la table runs`);
      }
    }
    await transaction(this.#pool, async (c) => {
      await c.query(`DELETE FROM lecons WHERE scene_id = $1 AND provenance->>'adaptateur' = 'decideurs'`, [this.#sceneId]);
      for (const l of lecons) {
        const validee = l.statut === 'validee_par_simulation';
        const detail = { id: l.id, type_incident: l.type_incident, zone: l.zone, frequence: l.frequence,
          duree_moyenne_min: l.duree_moyenne_min, duree_max_min: l.duree_max_min, chiffres: l.chiffres, sources: l.sources };
        const ins = await c.query(
          `INSERT INTO lecons (scene_id, texte, etiquettes, auteur, statut, provenance, run_validation)
           VALUES ($1, $2, $3::text[], $4, $5, $6::jsonb, $7::uuid)
           ON CONFLICT (scene_id, (md5(texte))) DO NOTHING RETURNING id`,
          [this.#sceneId, l.enonce, [`lecon:${l.id}`, `type:${l.type_incident}`, `zone:${l.zone}`], l.provenance.auteur, l.statut,
           JSON.stringify({ ...l.provenance, adaptateur: 'decideurs', detail }),
           validee ? l.provenance.validation?.run_id : null]);
        if (!ins.rowCount) throw new Error(`leçon ${l.id} : un énoncé identique existe déjà pour cette scène`);
        for (const src of l.sources) {
          const rex = await c.query(
            `SELECT x.id FROM rex_crises x JOIN enseignes e ON e.id = x.enseigne_id
             WHERE e.scene_id = $1 AND ($2 = ANY(x.etiquettes) OR x.id::text = $3) ORDER BY x.id LIMIT 1`,
            [this.#sceneId, `rex:${src}`, src.startsWith('db:') ? src.slice(3) : '']);
          if (!rex.rowCount) throw new Error(`leçon ${l.id} : source REX introuvable (${src})`);
          await c.query('INSERT INTO lecons_sources (lecon_id, rex_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [ins.rows[0].id, rex.rows[0].id]);
        }
      }
    });
  }

  async listerLecons(): Promise<Lecon[]> {
    const r = await this.#pool.query(
      `SELECT texte, statut, provenance FROM lecons
       WHERE scene_id = $1 AND provenance->>'adaptateur' = 'decideurs' ORDER BY id`, [this.#sceneId]);
    return r.rows.map((l) => {
      const provenance = { ...(l.provenance as Record<string, unknown>) };
      const detail = provenance.detail;
      delete provenance.detail;
      delete provenance.adaptateur;
      return { ...(detail as Omit<Lecon, 'enonce' | 'statut' | 'provenance'>), enonce: l.texte as string,
        statut: l.statut as StatutLecon, provenance: provenance as Lecon['provenance'] };
    });
  }
}
