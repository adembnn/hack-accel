// Plans du directeur : ce qu'il peut régler (grill du 22 oct., sept familles).
// Un plan = { id, nom, fermees, agents, annonces, vagues, escalators, ratp }.
//   fermees   : sorties qu'il ferme (portes de rue, issues de secours une par une)
//   agents    : sorties où il poste une équipe qui guide (4 agents par sortie, H)
//   annonces  : sorties vers lesquelles les messages par zone dirigent la foule
//   vagues    : 1, 2 ou 3 vagues de sortie des salles de cinéma (deux minutes d'écart)
//   escalators: 'normal' ou 'montee' (tous dans le sens de la sortie, débit 1,25 → 2 pers./s, H)
//   ratp      : il obtient de la RATP qu'une bouche reste ouverte, filtrée (1,3 pers./s, 2 agents)
import { hasard } from './moteur.mjs';

export const AGENTS_PAR_SORTIE = 4, AGENTS_RATP = 2, AGENTS_PAR_VAGUE = 6;
export const COTE = {
  est: ['Porte Lescot', 'Porte Rambuteau', 'Issue de secours 5', 'Issue de secours 6', 'Issue de secours 7', 'Issue de secours 8', 'Issue de secours 9'],
  ouest: ['Porte Berger', 'Porte du Pont Neuf', 'Porte Marguerite de Navarre'],
};
const CIBLES = {
  aucune: [],
  louvre: ['Porte du Louvre', 'Issue de secours 1', 'Issue de secours 4'],
  nord_ouest: ['Porte du Louvre', 'Porte Saint-Eustache', 'Porte du Jour'],
  larges: ['Porte du Louvre', 'Porte du Pont Neuf', 'Porte Lescot'],
};

export const CONSIGNE_REELLE = { id: 'consigne-19-oct', nom: 'Consigne réelle du 19 oct. : tout ouvert, aucun guidage', fermees: [], agents: [], annonces: [], vagues: 1, escalators: 'normal', ratp: false };

export function agentsDuPlan(p) {
  return p.agents.length * AGENTS_PAR_SORTIE + (p.ratp ? AGENTS_RATP : 0) + (p.vagues - 1) * AGENTS_PAR_VAGUE;
}

const uniq = (a) => [...new Set(a)];
function normaliser(p, sorties) {
  const ok = (n) => sorties.includes(n);
  const fermees = uniq(p.fermees.filter(ok));
  const f = new Set(fermees);
  return { ...p, fermees, agents: uniq(p.agents.filter((n) => ok(n) && !f.has(n))), annonces: uniq(p.annonces.filter((n) => ok(n) && !f.has(n))) };
}
export const cle = (p) => JSON.stringify([[...p.fermees].sort(), [...p.agents].sort(), [...p.annonces].sort(), p.vagues, p.escalators, p.ratp]);

// Premier temps : environ 40 plans tirés de règles simples (côté fermé × cibles × moyen de guidage × vagues × RATP × escalators).
export function plansParRegles(sorties, n = 40, graine = 7) {
  const r = hasard(graine), tous = [];
  for (const cote of ['aucun', 'est', 'ouest']) for (const cible of Object.keys(CIBLES)) for (const moyen of ['annonce', 'agents', 'les_deux'])
    for (const vagues of [1, 2]) for (const ratp of [false, true]) for (const escalators of ['normal', 'montee']) {
      if (cible === 'aucune' && moyen !== 'annonce') continue;
      const c = CIBLES[cible];
      tous.push(normaliser({ id: '', nom: `côté fermé ${cote}, guidage ${cible} (${moyen}), ${vagues} vague(s)${ratp ? ', bouche RATP' : ''}${escalators === 'montee' ? ', escalators en montée' : ''}`,
        fermees: cote === 'aucun' ? [] : COTE[cote], agents: moyen === 'annonce' ? [] : c, annonces: moyen === 'agents' ? [] : c, vagues, escalators, ratp }, sorties));
    }
  for (let i = tous.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [tous[i], tous[j]] = [tous[j], tous[i]]; }
  const vus = new Set([cle(CONSIGNE_REELLE)]), choisis = [];
  for (const p of tous) { if (choisis.length >= n) break; const k = cle(p); if (vus.has(k)) continue; vus.add(k); choisis.push({ ...p, id: `R${choisis.length + 1}` }); }
  return choisis;
}

// Second temps : mutations d'un bon plan (une sortie de plus ou de moins, une équipe déplacée, une vague de plus…).
export function muter(p, sorties, n, graine) {
  const r = hasard(graine), pick = (a) => a[(r() * a.length) | 0], out = [], vus = new Set([cle(p)]);
  for (let essai = 0; out.length < n && essai < n * 20; essai++) {
    const q = { ...p, fermees: [...p.fermees], agents: [...p.agents], annonces: [...p.annonces] };
    const geste = pick(['ouvrir', 'fermer', 'agent+', 'agent-', 'deplacer', 'annonce', 'vagues', 'ratp', 'escalators']);
    const libres = sorties.filter((s) => !q.fermees.includes(s));
    if (geste === 'ouvrir' && q.fermees.length) q.fermees.splice((r() * q.fermees.length) | 0, 1);
    else if (geste === 'fermer') q.fermees.push(pick(libres));
    else if (geste === 'agent+') q.agents.push(pick(libres));
    else if (geste === 'agent-' && q.agents.length) q.agents.splice((r() * q.agents.length) | 0, 1);
    else if (geste === 'deplacer' && q.agents.length) q.agents[(r() * q.agents.length) | 0] = pick(libres);
    else if (geste === 'annonce') { const s = pick(libres); q.annonces = q.annonces.includes(s) ? q.annonces.filter((x) => x !== s) : [...q.annonces, s]; }
    else if (geste === 'vagues') q.vagues = 1 + ((q.vagues) % 3);
    else if (geste === 'ratp') q.ratp = !q.ratp;
    else if (geste === 'escalators') q.escalators = q.escalators === 'normal' ? 'montee' : 'normal';
    else continue;
    const m = normaliser(q, sorties), k = cle(m);
    if (vus.has(k)) continue; vus.add(k);
    out.push({ ...m, id: `${p.id}.${out.length + 1}`, nom: `${p.nom} ; mutation : ${geste}`, parent: p.id });
  }
  return out;
}
