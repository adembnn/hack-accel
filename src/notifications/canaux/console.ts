// Canal « console » : écrit la notification dans un journal (par défaut console.log). Sert au développement et aux démonstrations sans téléphone.
import type { Canal, Destinataire, Notification } from '../types.ts';

export function creerCanalConsole(ecrire: (ligne: string) => void = (l) => console.log(l)): Canal {
  return {
    nom: 'console',
    async envoyer(n: Notification, d: Destinataire) {
      ecrire(`[${n.consigne.niveau_urgence}] ${d.id} (${d.zone}) ${n.titre} : ${n.corps}`);
      return { ok: true, remis: true };
    },
  };
}
