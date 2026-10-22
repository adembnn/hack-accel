// Canal « telephone-simule » : un petit bus d'événements en mémoire. L'écran de la maquette (faux iPhone) s'abonne et affiche
// la notification reçue par la personne cliquée. Aucune dépendance, aucun module Node : utilisable aussi côté navigateur.
//
// Usage côté écran :
//   const bus = creerBusTelephone();
//   const arreter = bus.abonner('perso-12', (evt) => afficherSurFauxIphone(evt.notification));
//   const canal = creerCanalTelephoneSimule(bus);   // à passer au service d'envoi
//   bus.accuser('<id notification>');               // quand on touche la notification sur le faux téléphone
import type { Canal, Destinataire, Notification } from '../types.ts';

export interface EvenementTelephone {
  type: 'notification';
  destinataire: Destinataire;
  notification: Notification;
}

export type Ecouteur = (evt: EvenementTelephone) => void;

export interface BusTelephone {
  /** Abonne un écouteur à un destinataire, ou à tous avec '*'. Renvoie la fonction de désabonnement. */
  abonner(destinataireId: string | '*', ecouteur: Ecouteur): () => void;
  publier(evt: EvenementTelephone): void;
  /** Dernières notifications reçues par ce destinataire (les plus récentes en dernier). */
  historique(destinataireId: string): Notification[];
  /** Branche l'accusé de réception (appelé quand la personne ouvre la notification sur le faux téléphone). */
  surAccuse(fn: (notificationId: string) => void): void;
  accuser(notificationId: string): void;
}

const HISTORIQUE_MAX = 20;

export function creerBusTelephone(): BusTelephone {
  const parDestinataire = new Map<string, Set<Ecouteur>>();
  const historiques = new Map<string, Notification[]>();
  let accuseur: ((id: string) => void) | undefined;
  return {
    abonner(id, ecouteur) {
      let s = parDestinataire.get(id);
      if (!s) parDestinataire.set(id, (s = new Set()));
      s.add(ecouteur);
      return () => void s.delete(ecouteur);
    },
    publier(evt) {
      const h = historiques.get(evt.destinataire.id) ?? [];
      h.push(evt.notification);
      if (h.length > HISTORIQUE_MAX) h.shift();
      historiques.set(evt.destinataire.id, h);
      for (const e of [...(parDestinataire.get(evt.destinataire.id) ?? []), ...(parDestinataire.get('*') ?? [])]) {
        try {
          e(evt);
        } catch {
          // un écouteur défaillant ne doit pas empêcher les autres de recevoir la consigne
        }
      }
    },
    historique: (id) => [...(historiques.get(id) ?? [])],
    surAccuse(fn) {
      accuseur = fn;
    },
    accuser(id) {
      accuseur?.(id);
    },
  };
}

export function creerCanalTelephoneSimule(bus: BusTelephone): Canal {
  return {
    nom: 'telephone-simule',
    async envoyer(notification, destinataire) {
      bus.publier({ type: 'notification', destinataire, notification });
      return { ok: true, remis: true };
    },
  };
}
