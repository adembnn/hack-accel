// Flot maximal (algorithme de Dinic) et coupe minimale sur un graphe orienté à capacités réelles.
//
// Un problème de flot est un programme linéaire : maximiser le flux sortant de la source, sous les contraintes
// « flux ≤ capacité » sur chaque arc et « ce qui entre = ce qui sort » en chaque nœud intermédiaire.
// Dinic le résout exactement (pas d'approximation, pas de bibliothèque). Par dualité, la valeur du flot maximal
// est égale à la capacité de la coupe minimale (le plus petit ensemble d'arcs dont la suppression sépare la source
// du puits) : la coupe est donc le certificat du résultat, et c'est elle qui désigne le goulot.

export interface ArcEntree {
  de: number;
  vers: number;
  capacite: number; // peut valoir Infinity
}

export interface ResultatFlot {
  valeur: number;
  flux: number[]; // flux porté par chaque arc d'entrée, dans le même ordre
  indices_coupe: number[]; // indices (dans les arcs d'entrée) des arcs de la coupe minimale
  cote_source: boolean[]; // nœuds atteignables depuis la source dans le réseau résiduel
}

const EPS = 1e-9;

export function fluxMax(nb_noeuds: number, arcs: ArcEntree[], source: number, puits: number): ResultatFlot {
  // Paires d'arcs : l'arc 2k va dans le sens voulu, l'arc 2k+1 est son inverse (réseau résiduel).
  const vers: number[] = [];
  const reste: number[] = [];
  const adj: number[][] = Array.from({ length: nb_noeuds }, () => []);
  arcs.forEach((a, k) => {
    vers.push(a.vers, a.de);
    reste.push(a.capacite, 0);
    adj[a.de].push(2 * k);
    adj[a.vers].push(2 * k + 1);
  });

  const niveau = new Int32Array(nb_noeuds);
  const courant = new Int32Array(nb_noeuds);

  const bfs = (): boolean => {
    niveau.fill(-1);
    niveau[source] = 0;
    const file = [source];
    for (let i = 0; i < file.length; i++) {
      const u = file[i];
      for (const e of adj[u]) {
        if (reste[e] > EPS && niveau[vers[e]] < 0) {
          niveau[vers[e]] = niveau[u] + 1;
          file.push(vers[e]);
        }
      }
    }
    return niveau[puits] >= 0;
  };

  const dfs = (u: number, pousse: number): number => {
    if (u === puits) return pousse;
    for (; courant[u] < adj[u].length; courant[u]++) {
      const e = adj[u][courant[u]];
      const v = vers[e];
      if (reste[e] > EPS && niveau[v] === niveau[u] + 1) {
        const d = dfs(v, Math.min(pousse, reste[e]));
        if (d > EPS) {
          reste[e] -= d;
          reste[e ^ 1] += d;
          return d;
        }
      }
    }
    return 0;
  };

  let valeur = 0;
  while (bfs()) {
    courant.fill(0);
    for (let d = dfs(source, Infinity); d > EPS; d = dfs(source, Infinity)) valeur += d;
  }

  // Le dernier BFS n'atteint plus le puits : les nœuds de niveau >= 0 forment le côté source de la coupe minimale.
  const cote_source = Array.from(niveau, (n) => n >= 0);
  const flux = arcs.map((_a, k) => reste[2 * k + 1]); // le résiduel inverse égale le flux poussé
  const indices_coupe: number[] = [];
  arcs.forEach((a, k) => {
    if (cote_source[a.de] && !cote_source[a.vers] && a.capacite > EPS) indices_coupe.push(k);
  });
  return { valeur, flux, indices_coupe, cote_source };
}
