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
for (const f of [process.env.ENV_FILE, resolve(ICI, '../../../.env')]) { if (!f) continue; try { process.loadEnvFile(f); break; } catch {} }
const PORT = Number(process.env.PORT_MAQUETTE || 8767);
const MODELE = 'claude-sonnet-5-5';
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const Action = z.object({
  type: z.enum(['zone_poser', 'zone_lever', 'cortege', 'levier', 'bouches_toutes', 'ascenseurs', 'escalators', 'evacuer', 'conseil', 'etat']),
  code: z.enum(['D1', 'D2']).nullable().describe('D1 manifestation ou rassemblement, D2 troubles ou casseurs'),
  lieu: z.string().nullable().describe('nom exact pris dans la liste des lieux (zone_poser, zone_lever, ascenseurs)'),
  cibles: z.array(z.string()).describe('noms exacts pris dans la liste des leviers ; plusieurs si l\'ordre vise plusieurs portes, issues ou bouches (sélecteurs développés) ; vide sinon'),
  action: z.enum(['fermer', 'ouvrir', 'agent', 'annonce', 'filtrer', 'arreter', 'remettre']).nullable(),
  delai_s: z.number().nullable().describe('si l\'ordre est à exécuter plus tard : délai en secondes de simulation (« dans 5 minutes » = 300) ; null = tout de suite'),
  depart: z.string().nullable().describe('cortege : lieu de départ, nom exact de la liste des lieux'),
  arrivee: z.string().nullable().describe('cortege : lieu d\'arrivée, nom exact de la liste des lieux, null si le cortège reste sur place'),
  effectif: z.number().nullable().describe('cortege : nombre de personnes si dit (« une centaine » = 100, « un millier » = 1000), sinon null'),
  nom: z.string().nullable().describe('cortege : nom du groupe s\'il en a un (« les supporters », « les syndicats »), sinon null'),
  sujet: z.enum(['sorties_fermees', 'restants', 'sortis', 'zones', 'densite', 'programme', 'general']).nullable().describe('etat : ce que le directeur veut savoir'),
});
const Sortie = z.object({
  actions: z.array(Action),
  reponse: z.string().describe('réponse courte, en français, lue à voix haute au directeur'),
  incompris: z.array(z.string()).describe('morceaux de la demande impossibles à rattacher à un nom connu'),
});

const SYSTEME = `Tu traduis les ordres oraux du directeur du Forum des Halles, en cellule de crise, en actions sur un jumeau numérique.
Une phrase peut contenir plusieurs ordres, plusieurs groupes, plusieurs lieux : produis une action par élément (deux manifestations = deux zone_poser ; trois portes fermées = un levier à trois cibles). Les champs inutiles valent null (cibles : tableau vide).
Types :
- zone_poser : une manifestation (code D1) ou des troubles (code D2) immobiles à un lieu ; lieu = nom exact de la liste des lieux.
- cortege : un groupe en mouvement (cortège, défilé, marche, « arrive de X vers Y », « part de X jusqu'à Y ») ; code D1 (manifestants, supporters, foule) ou D2 (casseurs, black blocs) ; depart et arrivee = noms exacts de la liste des lieux (arrivee null si on ne dit pas où il va) ; effectif et nom si dits. Un cortège par groupe cité.
- zone_lever : la manifestation ou les troubles sont finis ; lieu si précisé, code si précisé, sinon null.
- levier : agir sur des leviers nommés ; cibles = noms exacts de la liste des leviers ; action = fermer, ouvrir, agent (poster un agent ou un guide-file), annonce (diriger le public vers cette sortie), filtrer. Un seul levier par action, mais plusieurs cibles pour « toutes les issues rue Berger » (liste TOUTES les issues de la liste dont le nom contient rue Berger), « les trois issues côté piscine », « toutes les portes sauf Lescot » (toutes les portes de la liste, sauf Lescot), « les bouches de la porte Berger » (tous les accès Métro dont le nom contient Porte Berger). Développe toujours le sélecteur en noms exacts, sans en oublier ni en ajouter.
- bouches_toutes : TOUTES les bouches de métro et RER sans autre précision ; action = fermer ou ouvrir.
- ascenseurs : action fermer (en panne) ou ouvrir ; lieu si un endroit est cité, sinon null (tous).
- escalators : action arreter ou remettre.
- evacuer : lancer l'évacuation.
- conseil : le directeur demande quoi faire.
- etat : une question sur la situation (« quelles sorties sont fermées ? », « combien de personnes restent ? », « combien sont sortis ? », « où sont les manifestations ? », « quelle est la densité ? », « qu'est-ce qui est programmé ? ») ; sujet = sorties_fermees, restants, sortis, zones, densite, programme ou general. Tu ne réponds jamais toi-même avec un chiffre : la page calcule.
Consigne horaire : « ferme la porte Rambuteau dans 5 minutes » = levier fermer avec delai_s 300 ; « dans une heure » = 3600 ; sans délai, null. Le délai s'applique à l'action concernée seulement.
Les noms cités à l'oral sont approximatifs (« porte du Louvre », « la sortie de secours rue Berger 11 », « l'issue côté piscine 2 ») : choisis le nom exact le plus proche dans les listes. Un fait au passé (« on a fermé la porte Rambuteau ») est aussi à appliquer.
N'invente jamais un nom absent des listes : mets ce morceau dans incompris.
La réponse résume ce qui a été compris, en une ou deux phrases simples, sans chiffres inventés.`;

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
