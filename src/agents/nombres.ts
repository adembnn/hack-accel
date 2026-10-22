// Extraction de tous les nombres d'un texte français, sous toutes leurs écritures (attaque A8 du plan red-team) :
// chiffres, milliers à espace (fine ou insécable), virgule décimale, suffixes k / M, notation scientifique,
// heures « 19 h 20 », nombres en lettres (« douze mille quatre cents »), chiffres romains en majuscules.
export interface NombreTrouve {
  texte: string;
  position: number;
  valeur: number | null;     // null pour une heure
  heure?: string;            // « 19h20 »
  decimales: number;         // décimales écrites (arrondi déclaré)
  pas?: number;              // pour k / M : pas d'arrondi déclaré (12,4 k → 100)
}

const ESP = '[ \\u00a0\\u202f]';
const MOTIFS: { re: RegExp; type: 'heure' | 'sci' | 'suffixe' | 'milliers' | 'simple' }[] = [
  { re: new RegExp(`(\\d{1,2})${ESP}?h(?:${ESP}?(\\d{2}))?(?![\\p{L}\\d])`, 'gu'), type: 'heure' },
  { re: /-?\d+(?:[.,]\d+)?[eE][+-]?\d+/g, type: 'sci' },
  { re: new RegExp(`-?\\d+(?:[.,]\\d+)?${ESP}?(?:k|M|millions?)(?![\\p{L}\\d])`, 'gu'), type: 'suffixe' },
  { re: new RegExp(`-?\\d{1,3}(?:${ESP}\\d{3})+(?:,\\d+)?`, 'g'), type: 'milliers' },
  { re: /-?\d+(?:[.,]\d+)?/g, type: 'simple' },
];

const decimalesDe = (s: string): number => (s.includes('.') ? s.split('.')[1].length : 0);

const UNITES: Record<string, number> = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12,
  treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
};
const sansAccents = (s: string): string => s.normalize('NFD').replace(/\p{Diacritic}/gu, '');

// Nombres en lettres : repère les suites de mots-nombres et les évalue. « un/une » seul n'est pas un nombre (article).
function nombresEnLettres(texte: string): NombreTrouve[] {
  const sortie: NombreTrouve[] = [];
  const re = /[\p{L}]+/gu;
  const mots = [...sansAccents(texte.toLowerCase()).matchAll(re)].map((m) => ({ m: m[0], i: m.index ?? 0 }));
  const estNombre = (w: string) => w in UNITES || w === 'cent' || w === 'cents' || w === 'mille' || w === 'million' || w === 'millions';
  let k = 0;
  while (k < mots.length) {
    if (!estNombre(mots[k].m)) { k++; continue; }
    const debutIdx = k;
    let j = k;
    while (j + 1 < mots.length && (estNombre(mots[j + 1].m) || (mots[j + 1].m === 'et' && j + 2 < mots.length && estNombre(mots[j + 2].m))) && mots[j + 1].i - (mots[j].i + mots[j].m.length) <= 1) j++;
    const groupe = mots.slice(k, j + 1).map((x) => x.m).filter((w) => w !== 'et');
    k = j + 1;
    if (groupe.length === 1 && (groupe[0] === 'un' || groupe[0] === 'une')) continue;
    let total = 0, cur = 0, precedent = '';
    for (const w of groupe) {
      if (w === 'cent' || w === 'cents') cur = (cur || 1) * 100;
      else if (w === 'mille') { total += (cur || 1) * 1000; cur = 0; }
      else if (w === 'million' || w === 'millions') { total += (cur || 1) * 1_000_000; cur = 0; }
      else if ((w === 'vingt' || w === 'vingts') && precedent === 'quatre') cur = cur - 4 + 80;
      else cur += UNITES[w];
      precedent = w;
    }
    total += cur;
    sortie.push({ texte: groupe.join(' '), position: mots[debutIdx].i, valeur: total, decimales: 0 });
  }
  return sortie;
}

const ROMAIN = /\b(?=[MDCLXVI]{2,}\b)M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})\b/g;
function valeurRomaine(s: string): number {
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let t = 0;
  for (let i = 0; i < s.length; i++) t += v[s[i]] < (v[s[i + 1]] ?? 0) ? -v[s[i]] : v[s[i]];
  return t;
}

export function extraireTousNombres(texte: string): NombreTrouve[] {
  const pris: [number, number][] = [];
  const libre = (a: number, b: number) => pris.every(([x, y]) => b <= x || a >= y);
  const sortie: NombreTrouve[] = [];
  for (const { re, type } of MOTIFS) {
    for (const m of texte.matchAll(re)) {
      const a = m.index ?? 0, b = a + m[0].length;
      if (!libre(a, b)) continue;
      pris.push([a, b]);
      if (type === 'heure') { sortie.push({ texte: m[0], position: a, valeur: null, heure: `${Number(m[1])}h${m[2] ?? '00'}`, decimales: 0 }); continue; }
      if (type === 'sci') { sortie.push({ texte: m[0], position: a, valeur: Number(m[0].replace(',', '.')), decimales: 0 }); continue; }
      if (type === 'suffixe') {
        const mant = m[0].match(/^-?\d+(?:[.,]\d+)?/)![0].replace(',', '.');
        const mult = /k$/.test(m[0]) ? 1000 : 1_000_000;
        sortie.push({ texte: m[0], position: a, valeur: Number(mant) * mult, decimales: 0, pas: mult / 10 ** decimalesDe(mant) });
        continue;
      }
      const net = m[0].replace(new RegExp(ESP, 'g'), '').replace(',', '.');
      sortie.push({ texte: m[0], position: a, valeur: Number(net), decimales: decimalesDe(net) });
    }
  }
  for (const n of nombresEnLettres(texte)) sortie.push(n);
  for (const m of texte.matchAll(ROMAIN)) if (m[0].length >= 2 && libre(m.index ?? 0, (m.index ?? 0) + m[0].length)) sortie.push({ texte: m[0], position: m.index ?? 0, valeur: valeurRomaine(m[0]), decimales: 0 });
  return sortie.sort((x, y) => x.position - y.position);
}
