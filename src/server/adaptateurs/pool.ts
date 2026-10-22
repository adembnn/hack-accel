// Forme minimale d'un pool node-postgres (`pg.Pool`), pour typer les adaptateurs sans dépendre de @types/pg.
export type Ligne = Record<string, unknown>;
export interface Requetable { query(texte: string, valeurs?: unknown[]): Promise<{ rows: Ligne[]; rowCount: number | null }> }
export interface Connexion extends Requetable { release(): void }
export interface PoolPg extends Requetable { connect(): Promise<Connexion> }

// Exécute `corps` dans une transaction sur une connexion dédiée ; ROLLBACK si le corps échoue.
export async function transaction<T>(pool: PoolPg, corps: (c: Connexion) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await corps(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
