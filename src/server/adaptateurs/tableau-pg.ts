// Adaptateur PostgreSQL de StockageTableau (lot decideurs) sur le schéma du lot aiven (infra/schema.sql).
//
// Où va chaque entrée de la boucle (une entrée = un décideur à une minute) :
//  - tableau_commun : l'entrée COMPLÈTE (actions acceptées, refusées avec leurs raisons, leçons citées) en JSON,
//    genre 'decision', auteur = le décideur. Le trigger du schéma prévient les écouteurs SSE (NOTIFY). C'est la
//    source relue par lister() : la relecture rend exactement ce qui a été écrit.
//  - decisions : une ligne par action ACCEPTÉE (levier, valeur). La colonne valeur contient
//    { valeur, lecons_utilisees } pour que « quelle décision cite quelle leçon » se demande en SQL
//    (valeur->'lecons_utilisees'). minute_simulee = minute du jour de la simulation (1160 = 19 h 20).
//    Les actions refusées ne sont pas des décisions : elles restent seulement dans tableau_commun.
// Les deux écritures se font dans une seule transaction. Toutes les requêtes sont paramétrées ($1, $2...).
import type { Decideur, EntreeTableau } from '../../agents/types.ts';
import type { StockageTableau } from '../../agents/types.ts';
import type { PoolPg } from './pool.ts';
import { transaction } from './pool.ts';

export class StockageTableauPg implements StockageTableau {
  #pool: PoolPg;
  #runId: string;
  constructor(pool: PoolPg, runId: string) { this.#pool = pool; this.#runId = runId; }

  async ajouter(entree: EntreeTableau): Promise<void> {
    await transaction(this.#pool, async (c) => {
      await c.query(
        `INSERT INTO tableau_commun (run_id, auteur, genre, contenu) VALUES ($1, $2, 'decision', $3::jsonb)`,
        [this.#runId, entree.decideur, JSON.stringify(entree)]);
      const lecons = entree.lecons_utilisees ?? [];
      for (const a of entree.actions_acceptees) {
        await c.query(
          `INSERT INTO decisions (run_id, minute_simulee, decideur, levier, valeur, justification)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [this.#runId, entree.minute, a.decideur, a.levier,
           JSON.stringify({ valeur: a.valeur ?? null, lecons_utilisees: lecons }),
           lecons.length ? `Leçons relues avant la décision : ${lecons.join(', ')}` : '']);
      }
    });
  }

  async lister(filtre: { minute?: number; decideur?: Decideur } = {}): Promise<EntreeTableau[]> {
    const r = await this.#pool.query(
      `SELECT contenu FROM tableau_commun
       WHERE run_id = $1 AND genre = 'decision'
         AND ($2::int IS NULL OR (contenu->>'minute')::int = $2::int)
         AND ($3::text IS NULL OR auteur = $3::text)
       ORDER BY id`,
      [this.#runId, filtre.minute ?? null, filtre.decideur ?? null]);
    return r.rows.map((l) => l.contenu as EntreeTableau);
  }

  // Décisions (lignes de la table decisions) dont le décideur a relu cette leçon avant de décider.
  async decisionsCitant(leconId: string): Promise<{ minute_simulee: number; decideur: string; levier: string }[]> {
    const r = await this.#pool.query(
      `SELECT minute_simulee, decideur, levier FROM decisions
       WHERE run_id = $1 AND valeur->'lecons_utilisees' @> to_jsonb($2::text)
       ORDER BY minute_simulee, id`,
      [this.#runId, leconId]);
    return r.rows as { minute_simulee: number; decideur: string; levier: string }[];
  }
}
