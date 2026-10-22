// Garde globale des appels payants : UN SEUL point que tous les transports vérifient (audit F4, A13).
// Un appel payant exige, ensemble : (1) l'autorisation explicite passée par l'appelant (accord d'Adem),
// (2) la clé du service dans l'environnement, (3) MODE_PAYANT=oui dans l'environnement. Sans cela : aucun constructeur ne réussit.
export type EnvLike = Record<string, string | undefined>;

export function gardePayant(nom: string, o: { autorise_payant?: boolean; env?: EnvLike }, nomCle: string | null): string | null {
  const env = o.env ?? process.env;
  if (o.autorise_payant !== true) throw new Error(`${nom} : appel payant non autorisé (accord d'Adem requis)`);
  const cle = nomCle ? env[nomCle] : null;
  if (nomCle && !cle) throw new Error(`${nom} : ${nomCle} absente de l'environnement`);
  if (env.MODE_PAYANT !== 'oui') throw new Error(`${nom} : MODE_PAYANT=oui absent de l'environnement (garde globale des appels payants)`);
  return cle ?? null;
}
