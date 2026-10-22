// Canal « sms » : STUB avec interface. Opt-in obligatoire : on n'écrit qu'aux numéros dont la personne a accepté de recevoir
// les messages du lieu (case cochée à l'achat du billet). Aucun fournisseur n'est branché : sans `fournisseur` injecté, rien ne part.
// Le SMS n'est PAS un cell broadcast ni une alerte d'État : c'est un message ordinaire d'un expéditeur déclaré (« Lieu »).
// Ce qui manque : un contrat avec un fournisseur SMS (clé API en variable d'environnement), un expéditeur alphanumérique déclaré,
// le recueil du consentement (RGPD) et le stockage du numéro séparé de l'identité.
import type { Canal, Destinataire, Notification, ResultatEnvoi } from '../types.ts';

export interface FournisseurSms {
  envoyer(numero: string, texte: string): Promise<ResultatEnvoi>;
}

export interface OptionsSms {
  fournisseur?: FournisseurSms;
  /** Numéro de téléphone d'un destinataire qui a donné son accord, sinon undefined. */
  numeroOptIn: (destinataireId: string) => string | undefined;
}

export function creerCanalSms(options: OptionsSms): Canal {
  return {
    nom: 'sms',
    async envoyer(n: Notification, d: Destinataire): Promise<ResultatEnvoi> {
      const numero = options.numeroOptIn(d.id);
      if (!numero) return { ok: false, erreur: 'pas_d_opt_in' };
      if (!options.fournisseur) return { ok: false, erreur: 'non_configure', detail: 'stub : aucun fournisseur SMS branché' };
      return options.fournisseur.envoyer(numero, `${n.titre} : ${n.corps}`);
    },
  };
}
