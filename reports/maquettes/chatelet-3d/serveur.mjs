// Serveur local de la maquette : sert reports/maquettes/ et comprend les ordres du directeur avec Claude.
// POST /api/directeur {texte, contexte} -> {actions[], reponse, incompris[]} (sortie JSON contrainte par un schéma).
// La clé vient de ANTHROPIC_API_KEY (fichier .env à la racine du dépôt, jamais lu ailleurs que par ce processus).
// Sans clé ou en cas d'erreur, la page retombe sur la compréhension par règles (directeur.js).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, '..');
try { process.loadEnvFile(resolve(ICI, '../../../.env')); } catch {}
const PORT = Number(process.env.PORT_MAQUETTE || 8767);
const MODELE = 'claude-sonnet-5-5';
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const Action = z.object({
  type: z.enum(['zone_poser', 'zone_lever', 'levier', 'bouches_toutes', 'ascenseurs', 'escalators', 'evacuer', 'conseil']),
  code: z.enum(['D1', 'D2']).nullable().describe('D1 manifestation ou rassemblement, D2 troubles ou casseurs'),
  lieu: z.string().nullable().describe('nom exact pris dans la liste des lieux'),
  cible: z.string().nullable().describe('nom exact pris dans la liste des leviers (porte, issue, bouche, ascenseur)'),
  action: z.enum(['fermer', 'ouvrir', 'agent', 'annonce', 'filtrer', 'arreter', 'remettre']).nullable(),
});
const Sortie = z.object({
  actions: z.array(Action),
  reponse: z.string().describe('réponse courte, en français, lue à voix haute au directeur'),
  incompris: z.array(z.string()).describe('morceaux de la demande impossibles à rattacher à un nom connu'),
});

const SYSTEME = `Tu traduis les ordres oraux du directeur du Forum des Halles, en cellule de crise, en actions sur un jumeau numérique.
Une phrase peut contenir plusieurs ordres : produis une action par élément (deux manifestations = deux zone_poser ; trois portes fermées = trois levier).
Types :
- zone_poser : une manifestation (code D1) ou des troubles (code D2) à un lieu ; lieu = nom exact de la liste des lieux.
- zone_lever : la manifestation ou les troubles sont finis ; lieu si précisé, code si précisé, sinon null.
- levier : agir sur un levier nommé ; cible = nom exact de la liste des leviers ; action = fermer, ouvrir, agent (poster un agent ou un guide-file), annonce (diriger le public vers cette sortie), filtrer.
- bouches_toutes : toutes les bouches de métro et RER ; action = fermer ou ouvrir.
- ascenseurs : action fermer (en panne) ou ouvrir ; lieu si un endroit est cité, sinon null (tous).
- escalators : action arreter ou remettre.
- evacuer : lancer l'évacuation.
- conseil : le directeur demande quoi faire.
Les noms cités à l'oral sont approximatifs (« porte du Louvre », « la sortie de secours rue Berger 11 », « l'issue côté piscine ») : choisis le nom exact le plus proche dans les listes. Un fait au passé (« on a fermé la porte Rambuteau ») est aussi à appliquer.
N'invente jamais un nom absent des listes : mets ce morceau dans incompris. Les champs inutiles valent null.
La réponse résume ce qui a été fait, en une ou deux phrases simples, sans chiffres inventés.`;

async function comprendre(texte, contexte) {
  const c = contexte || {};
  const listes = `Lieux : ${(c.lieux || []).join(' ; ')}
Leviers : ${(c.leviers || []).join(' ; ')}
État : ${c.etat || 'inconnu'}`;
  const r = await client.messages.parse({
    model: MODELE,
    max_tokens: 4000,
    system: SYSTEME,
    output_config: { effort: 'low', format: zodOutputFormat(Sortie) },
    messages: [{ role: 'user', content: `${listes}\n\nOrdre du directeur : « ${texte} »` }],
  });
  if (r.stop_reason === 'refusal') throw Object.assign(new Error('refus'), { status: 422 });
  if (!r.parsed_output) throw Object.assign(new Error('sortie illisible'), { status: 502 });
  return { ...r.parsed_output, modele: MODELE, jetons: r.usage };
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };
const envoyer = (res, code, corps, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(corps); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/api/directeur') {
    if (!client) return envoyer(res, 503, JSON.stringify({ erreur: 'ANTHROPIC_API_KEY absente du .env' }));
    let corps = '';
    for await (const morceau of req) { corps += morceau; if (corps.length > 200_000) return envoyer(res, 413, '{}'); }
    try {
      const { texte, contexte } = JSON.parse(corps);
      const t0 = Date.now();
      const sortie = await comprendre(String(texte || '').slice(0, 2000), contexte);
      return envoyer(res, 200, JSON.stringify({ ...sortie, ms: Date.now() - t0 }));
    } catch (e) {
      return envoyer(res, e.status && e.status < 600 ? e.status : 500, JSON.stringify({ erreur: e.message }));
    }
  }
  if (url.pathname === '/api/etat') return envoyer(res, 200, JSON.stringify({ claude: !!client, modele: MODELE }));
  const chemin = resolve(RACINE, '.' + decodeURIComponent(url.pathname).replace(/\/$/, '/index.html'));
  if (!chemin.startsWith(RACINE + sep) || chemin.includes(`${sep}node_modules${sep}`)) return envoyer(res, 403, 'interdit', 'text/plain');
  try { envoyer(res, 200, await readFile(chemin), TYPES[extname(chemin)] || 'application/octet-stream'); }
  catch { envoyer(res, 404, 'introuvable', 'text/plain'); }
}).listen(PORT, '127.0.0.1', () => console.log(`maquette : http://127.0.0.1:${PORT}/chatelet-3d/index.html · Claude ${client ? 'branché (' + MODELE + ')' : 'absent (règles seulement)'}`));

export { comprendre };
