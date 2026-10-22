// Tests de la validation scientifique : chaque test rend un verdict, le CSV est bien formé, et les tests qui doivent passer passent.
// Les échecs assumés (Jülich 9, Forssberg 11c) et le cas sans objet (10b) ne sont PAS exigés comme passants : ils doivent rester visibles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLONNES_CSV, executerValidation, synthese, versCsv, type Resultat } from './validation.ts';

let cache: Resultat[] | null = null;
const resultats = (): Resultat[] => (cache ??= executerValidation());
const verdictDe = (id: string) => resultats().find((r) => r.id === id)?.verdict;

/** Découpe une ligne CSV en champs (guillemets doublés gérés). */
function champs(ligne: string): string[] {
  const out: string[] = [];
  let cur = '';
  let entre = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (entre) {
      if (c === '"' && ligne[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') entre = false;
      else cur += c;
    } else if (c === '"') entre = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

test('chaque test produit un verdict valide, une source et une explication', () => {
  assert.ok(resultats().length >= 14);
  for (const r of resultats()) {
    assert.ok(['passe', 'échoue', 'non applicable'].includes(r.verdict), `${r.id} : verdict ${r.verdict}`);
    assert.ok(r.source && r.url.startsWith('https://') && r.explication, `${r.id} : source, url ou explication manquante`);
  }
  assert.match(synthese(resultats()), /^\d+ passent, \d+ échouent, \d+ non applicables$/);
});

test('CSV : autant de colonnes à chaque ligne, guillemets pour les virgules', () => {
  const lignes = versCsv(resultats()).trimEnd().split('\n');
  assert.equal(lignes.length, resultats().length + 1);
  for (const l of lignes) assert.equal(champs(l).length, COLONNES_CSV.length, l.slice(0, 60));
});

test('tests attendus comme passants : RiMEA 1, 5, 8, 9 (ids 1 à 4), IMO 4 (8) et Weidmann (10a)', () => {
  for (const id of ['1', '2', '3', '4', '8', '10a']) assert.equal(verdictDe(id), 'passe', `test ${id}`);
});

test('écarts assumés affichés tels quels : Jülich échoue, mouvement de Weidmann non applicable', () => {
  assert.equal(verdictDe('9'), 'échoue');
  assert.equal(verdictDe('10b'), 'non applicable');
});
