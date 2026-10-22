// Diffusion SSE robuste (red team A12) : tampon borné, dédoublonnage par id, ids acceptés dans le désordre,
// plafonds de connexions (total et par adresse), coupure des clients lents. Sans dépendance : testable sans réseau.
//
// Les id de tableau_commun (bigserial) sont attribués avant le commit : deux écritures concurrentes peuvent être
// notifiées dans l'ordre 6 puis 5. On ne compare donc jamais à « le plus grand id vu » : chaque id est dédoublonné
// individuellement (ensemble borné), pour le tampon comme pour chaque client.

const TAILLE_VUS_CLIENT = 2000;

export function creerFlux({ tampon = 200, maxClients = 100, maxParAdresse = 10, maxBacklogOctets = 64 * 1024 } = {}) {
  const recents = [];           // derniers événements, triés par id croissant
  const vus = new Set();        // ids du tampon (dédoublonnage global)
  const clients = new Set();

  /** Un client = { ecrire(chaine), arriere() -> octets en attente, fermer(), run?, adresse? } */
  function envoyer(c, e) {
    if (c.vus.has(e.id)) return;                         // déjà envoyé à ce client
    c.vus.add(e.id);
    if (c.vus.size > TAILLE_VUS_CLIENT) c.vus.delete(c.vus.values().next().value);
    if (c.run && c.run !== e.run_id) return;
    c.ecrire(`id: ${e.id}\nevent: tableau\ndata: ${JSON.stringify(e)}\n\n`);
    if (c.arriere() > maxBacklogOctets) { clients.delete(c); c.fermer(); }  // client qui ne lit pas
  }

  return {
    publier(e) {
      if (!Number.isFinite(e.id) || vus.has(e.id)) return false;     // doublon : ignoré
      vus.add(e.id);
      let i = recents.length;
      while (i > 0 && recents[i - 1].id > e.id) i--;                 // insertion triée (ids dans le désordre)
      recents.splice(i, 0, e);
      while (recents.length > tampon) vus.delete(recents.shift().id);
      for (const c of [...clients]) envoyer(c, e);
      return true;
    },
    /** Événements gardés en mémoire après `id` (reprise avec Last-Event-ID). */
    depuis(id) { return recents.filter((e) => e.id > id); },
    plusGrandId: () => (recents.length ? recents[recents.length - 1].id : 0),
    taille: () => recents.length,
    nbClients: () => clients.size,
    abonner(c) {
      if (clients.size >= maxClients) throw new Error(`plafond de connexions atteint (${maxClients})`);
      if (c.adresse && [...clients].filter((x) => x.adresse === c.adresse).length >= maxParAdresse) {
        throw new Error(`plafond par adresse atteint (${maxParAdresse})`);
      }
      c.vus = new Set();
      clients.add(c);
      return () => clients.delete(c);
    },
    /** Rejoue des lignes lues en base vers un client (sans doublon avec le direct). */
    rattraper(c, lignes) { for (const e of lignes) if (clients.has(c)) envoyer(c, e); },
    fermerTout() { for (const c of [...clients]) c.fermer(); clients.clear(); },
  };
}
