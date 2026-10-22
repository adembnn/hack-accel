// Canal « wallet » : STUB documenté. Mise à jour d'un pass Apple Wallet (billet de cinéma) avec un message sur l'écran verrouillé.
// Rien n'est envoyé : `envoyer` renvoie toujours { ok:false, erreur:'non_configure' }. Ce fichier fige le format et liste ce qui manque.
//
// Comment ça marche (Apple PassKit, « Updating a pass ») :
//  1. Le billet est un pass .pkpass (zip signé : pass.json, manifest.json, signature, images). Le spectateur l'a ajouté à son Wallet.
//  2. pass.json contient webServiceURL (HTTPS) et authenticationToken (16 caractères au moins). À l'ajout, l'iPhone appelle
//     POST {webServiceURL}/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber} avec le pushToken.
//     Notre serveur doit mémoriser ce pushToken par numéro de série (donc par billet).
//  3. Pour pousser une mise à jour, le serveur envoie une notification APNs VIDE ({}) à ce pushToken, sujet (topic) = passTypeIdentifier,
//     authentifiée par le certificat du Pass Type ID (HTTP/2, api.push.apple.com).
//  4. L'iPhone rappelle GET {webServiceURL}/v1/passes/{passTypeIdentifier}/{serialNumber} et reçoit le pass mis à jour.
//  5. Si un champ du pass change ET porte `changeMessage` (ex. "%@"), iOS affiche ce texte en notification sur l'écran verrouillé.
//     C'est le seul message visible : il doit donc tenir dans la valeur du champ (court, 160 caractères au plus ici).
//
// Ce qui manque pour passer en réel :
//  - un compte Apple Developer Program (payant) et un identifiant Pass Type ID (pass.<domaine>) ;
//  - le certificat de signature du pass (.p12) et le certificat intermédiaire Apple WWDR ;
//  - la signature du pass : manifest.json (empreintes SHA-1 de chaque fichier) signé en PKCS#7 détaché ;
//  - un service HTTPS public qui implémente les 5 routes du protocole (enregistrement, désenregistrement, liste des mises à jour,
//    pass à jour, journal) ;
//  - un client HTTP/2 vers APNs avec ce certificat ;
//  - que le cinéma émette ses billets en pass Wallet : sans pass déjà ajouté par la personne, aucun message n'est possible ;
//  - côté Google : Google Wallet utilise l'API « message » des objets (Add message to object), même idée, compte Google Cloud requis.
// Limite : un pass ne notifie qu'à l'écran verrouillé sans son ni vibration insistante garantis ; ce n'est pas une alerte, c'est un message.
import type { Canal, Destinataire, Notification } from '../types.ts';

/** Fragment de pass.json à écrire pour qu'une consigne apparaisse sur l'écran verrouillé. Fonction pure, utilisable dès maintenant. */
export function champsPassPourMessage(n: Notification, d: Destinataire): Record<string, unknown> {
  return {
    serialNumber: `${d.id}`,
    backFields: [
      {
        key: 'message_du_lieu',
        label: n.titre,
        value: n.corps,
        changeMessage: '%@',
      },
    ],
  };
}

export function creerCanalWalletStub(): Canal {
  return {
    nom: 'wallet',
    async envoyer() {
      return { ok: false, erreur: 'non_configure', detail: 'stub : certificat Pass Type ID, service HTTPS et APNs manquants (voir le commentaire du fichier)' };
    },
  };
}
