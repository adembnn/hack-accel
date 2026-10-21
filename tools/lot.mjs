// Le ticket d'un lot, lu une fois et mis en cache 30 min dans journal/lot-<nom>.json.
// Utilisé par le garde-fou, verif.mjs, fusionner.mjs et le hook de fin de réponse, pour qu'ils voient tous la même chose.
// Exporte : trouverTicket(nom, dir) → { numero, titre, dossiers, verification[], bloquePar[], coches, total } | null (absent) | undefined (GitHub injoignable)
//           PARTAGE : fichiers que tout lot peut toucher (dépendances, config, tests) · LIBRE : fichiers du harnais, hors code
//           estLibre(chemin), estPartage(chemin), regexLot(nom)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const LIBRE = /^(\.claude|tools|docs|kickoff|reports|demo|journal|captures|\.github|\.githooks)\/|^[^/]+\.md$|^(\.gitignore|\.gitattributes|\.env\.example|LICENSE)$/;
export const PARTAGE = /^(package\.json|package-lock\.json|pnpm-lock\.yaml|tsconfig[^/]*\.json|vite\.config\.[cm]?[jt]s|next\.config\.[cm]?[jt]s|Containerfile|Dockerfile|compose[^/]*\.ya?ml|\.dockerignore|\.npmrc|\.prettierrc[^/]*|eslint\.config\.[cm]?[jt]s|\.eslintrc[^/]*)$|^(tests?|__tests__|e2e)\//;
export const estLibre = (chemin) => LIBRE.test(chemin);
export const estPartage = (chemin) => PARTAGE.test(chemin);
export const regexLot = (nom) => new RegExp(`lot/${nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`);

const CACHE_MS = 30 * 60_000;
const placeholder = (s) => /<[^>]*>/.test(s);

export function lireTicket(corps, numero, titre) {
  const m = corps.match(/\*\*Dossiers\*\*\s*:\s*([^\n]+)/i);
  const dossiers = m ? [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1].replace(/\/$/, '')).filter((d) => !placeholder(d)) : [];
  const v = corps.match(/\*\*Vérification\*\*\s*:\s*([^\n]+)/i);
  const verification = v ? [...v[1].matchAll(/`([^`]+)`/g)].map((x) => x[1]).filter((c) => !placeholder(c) && !/tools\/verif\.mjs/.test(c)) : [];
  const bloquePar = [...(corps.split(/##\s*Bloqu[ée] par/i)[1] || '').matchAll(/#(\d+)/g)].map((x) => Number(x[1]));
  const coches = (corps.match(/^- \[x\]/gim) || []).length;
  const total = coches + (corps.match(/^- \[ \]/gm) || []).length;
  return { numero, titre, dossiers, verification, bloquePar, coches, total };
}

export function trouverTicket(nom, dir, { frais = false } = {}) {
  const cacheDir = join(dir, 'journal');
  const cache = join(cacheDir, `lot-${nom}.json`);
  if (!frais) {
    try { const c = JSON.parse(readFileSync(cache, 'utf8')); if (Date.now() - c.t < CACHE_MS && c.numero) return c; } catch {}
  }
  let liste;
  try { liste = JSON.parse(execFileSync('gh', ['issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,body,title'], { cwd: dir, encoding: 'utf8', stdio: 'pipe', timeout: 8000 })); }
  catch { return undefined; }
  const re = regexLot(nom);
  const t = liste.find((x) => re.test(x.body || ''));
  if (!t) return null; // jamais mis en cache : le ticket peut naître dans la minute
  const ticket = { t: Date.now(), ...lireTicket(t.body || '', t.number, t.title) };
  try { mkdirSync(cacheDir, { recursive: true }); writeFileSync(cache, JSON.stringify(ticket)); } catch {}
  return ticket;
}

// Les tickets ouverts (numéros) pour savoir si un bloquant est encore ouvert.
export function ticketsOuverts(dir) {
  try { return JSON.parse(execFileSync('gh', ['issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number'], { cwd: dir, encoding: 'utf8', stdio: 'pipe', timeout: 8000 })).map((x) => x.number); }
  catch { return undefined; }
}
