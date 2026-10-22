import type { EntreeTableau, StockageTableau, Decideur } from './types.ts';

// Tableau commun en mémoire (tests, démo hors base). Copie profonde à l'écriture pour que personne ne modifie l'historique.
export class StockageMemoire implements StockageTableau {
  #lignes: EntreeTableau[] = [];
  async ajouter(entree: EntreeTableau): Promise<void> {
    this.#lignes.push(structuredClone(entree));
  }
  async lister(filtre: { minute?: number; decideur?: Decideur } = {}): Promise<EntreeTableau[]> {
    return this.#lignes
      .filter((l) => (filtre.minute === undefined || l.minute === filtre.minute) && (filtre.decideur === undefined || l.decideur === filtre.decideur))
      .map((l) => structuredClone(l));
  }
}
