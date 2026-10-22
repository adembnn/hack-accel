// Diffusion SSE robuste (red team A12) : tampon borné, dédoublonnage par id monotone, plafond de connexions,
// coupure des clients trop lents. Sans dépendance : testable sans réseau avec de faux clients.

export function creerFlux({ tampon = 200, maxClients = 100, maxBacklogOctets = 64 * 1024 } = {}) {
  const recents = [];           // derniers événements, ordre croissant d'id
  const clients = new Set();
  let dernierId = 0;

  /** Un client = { ecrire(chaine), arriere() -> octets en attente, fermer(), run? } */
  function envoyer(c, e) {
    if (e.id <= c.dernier) return;                       // doublon ou événement déjà rattrapé
    c.dernier = e.id;
    if (c.run && c.run !== e.run_id) return;
    c.ecrire(`id: ${e.id}\nevent: tableau\ndata: ${JSON.stringify(e)}\n\n`);
    if (c.arriere() > maxBacklogOctets) { clients.delete(c); c.fermer(); }  // client qui ne lit pas
  }

  return {
    publier(e) {
      if (!Number.isFinite(e.id) || e.id <= dernierId) return false;  // doublon : ignoré
      dernierId = e.id;
      recents.push(e);
      if (recents.length > tampon) recents.splice(0, recents.length - tampon);
      for (const c of [...clients]) envoyer(c, e);
      return true;
    },
    /** Événements gardés en mémoire après `id` (reprise avec Last-Event-ID). */
    depuis(id) { return recents.filter((e) => e.id > id); },
    taille: () => recents.length,
    nbClients: () => clients.size,
    abonner(c, depuisId = 0) {
      if (clients.size >= maxClients) throw new Error(`plafond de connexions atteint (${maxClients})`);
      c.dernier = depuisId;
      clients.add(c);
      return () => clients.delete(c);
    },
    /** Rejoue des lignes lues en base vers un client (sans doublon avec le direct). */
    rattraper(c, lignes) { for (const e of lignes) if (clients.has(c)) envoyer(c, e); },
    fermerTout() { for (const c of [...clients]) c.fermer(); clients.clear(); },
  };
}
