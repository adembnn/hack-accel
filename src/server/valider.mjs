// Validation des entrées avant toute écriture (red team A1, A2, A10). Aucune correction silencieuse :
// une valeur hors plage est REFUSÉE (HTTP 422) ; un texte louche est MARQUÉ (suspect), jamais réécrit.

export const LIMITES = {
  texte: 500,            // caractères par champ texte (A10)
  etiquettes: 10,        // étiquettes par REX
  etiquette: 80,
  corps: 64 * 1024,      // octets d'un corps HTTP (A10)
  dureeMinutesMax: 24 * 60,
  personnesMax: 100_000, // un REX ne peut pas toucher plus que la capacité d'un grand site
  debit: 9,              // personnes/seconde pour l'ensemble du lieu, borne dure
};

const MOTIFS = [
  [/ignore\w*\s+(tes|vos|les|toutes?|previous|all|your)?\s*(consignes?|instructions?|règles?|rules?)/i, 'ignore_consignes'],
  [/\b(system|assistant|developer)\s*(prompt|:)/i, 'role_systeme'],
  [/<\s*\/?\s*[a-z_]+[^>]*>/i, 'balise'],
  [/<\|/, 'jeton_special'],
  [/\b(ordonne|ordonner|tu dois|you must|override)\b/i, 'imperatif'],
  [/```/, 'bloc_code'],
];

/** Motifs d'injection repérés dans un texte. Ne modifie rien. */
export function motifsSuspects(...textes) {
  const trouves = new Set();
  for (const t of textes) for (const [re, nom] of MOTIFS) if (re.test(String(t ?? ''))) trouves.add(nom);
  return [...trouves];
}

const erreur = (m) => Object.assign(new Error(m), { code: 422 });

function texte(c, nom, { requis = false } = {}) {
  const v = c[nom];
  if (v === undefined || v === null || v === '') {
    if (requis) throw erreur(`champ manquant : ${nom}`);
    return '';
  }
  if (typeof v !== 'string') throw erreur(`${nom} doit être du texte`);
  if (v.length > LIMITES.texte) throw erreur(`${nom} dépasse ${LIMITES.texte} caractères`);
  if (v.includes('\u0000')) throw erreur(`${nom} contient un caractère interdit`);
  return v;
}

function entier(c, nom, max) {
  const v = c[nom];
  if (v === undefined || v === null) return null;
  if (!Number.isInteger(v) || v < 0 || v > max) throw erreur(`${nom} hors plage (0 à ${max})`);
  return v;
}

/** Valide un REX ; renvoie l'objet nettoyé + le marquage suspect. Lève une erreur 422 sinon. */
export function validerRex(c, aujourdhui = new Date()) {
  if (c === null || typeof c !== 'object' || Array.isArray(c)) throw erreur('objet attendu');
  const rex = {
    enseigneId: texte(c, 'enseigneId', { requis: true }),
    dateIncident: texte(c, 'dateIncident', { requis: true }),
    zone: texte(c, 'zone'),
    typeIncident: texte(c, 'typeIncident', { requis: true }),
    description: texte(c, 'description', { requis: true }),
    decisionsPrises: texte(c, 'decisionsPrises'),
    resultat: texte(c, 'resultat'),
    leconsEnseigne: texte(c, 'leconsEnseigne'),
    dureeMinutes: entier(c, 'dureeMinutes', LIMITES.dureeMinutesMax),
    personnesTouchees: entier(c, 'personnesTouchees', LIMITES.personnesMax),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rex.dateIncident) || Number.isNaN(Date.parse(rex.dateIncident))) {
    throw erreur('dateIncident doit être AAAA-MM-JJ');
  }
  const d = new Date(rex.dateIncident + 'T00:00:00Z');
  if (d.getUTCFullYear() < 2000) throw erreur('dateIncident trop ancienne');
  if (d > aujourdhui) throw erreur('dateIncident dans le futur');
  // Cohérence physique : plus de personnes que le débit ne le permet en la durée annoncée = faux chiffre (A1).
  if (rex.dureeMinutes !== null && rex.personnesTouchees !== null && rex.dureeMinutes > 0) {
    const parSeconde = rex.personnesTouchees / (rex.dureeMinutes * 60);
    if (parSeconde > LIMITES.debit) {
      throw erreur(`débit implausible : ${parSeconde.toFixed(1)} personnes/s sur l'ensemble du lieu (borne ${LIMITES.debit})`);
    }
  }
  const etiquettes = c.etiquettes ?? [];
  if (!Array.isArray(etiquettes) || etiquettes.length > LIMITES.etiquettes
      || etiquettes.some((e) => typeof e !== 'string' || e.length === 0 || e.length > LIMITES.etiquette)) {
    throw erreur(`etiquettes : au plus ${LIMITES.etiquettes} textes de ${LIMITES.etiquette} caractères`);
  }
  rex.etiquettes = etiquettes;
  rex.motifsSuspects = motifsSuspects(rex.description, rex.decisionsPrises, rex.resultat, rex.leconsEnseigne, rex.zone, ...etiquettes);
  return rex;
}

/** Masque identifiants et mots de passe d'une URL de connexion avant d'écrire un journal (A17). */
export function masquer(texte) {
  return String(texte)
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]*@/gi, '$1***@')
    .replace(/(password|passwd|pwd|token|api[_-]?key|secret)(["'=:\s]+)[^\s"',&]+/gi, '$1$2***');
}
