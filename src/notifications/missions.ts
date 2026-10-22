// Canal principal : le PERSONNEL (agents de sécurité, SSIAP, chefs de salle, secours). Seuls ces agents reçoivent l'interface ;
// ils guident la foule et séparent les flux. Une fiche mission par agent : où se tenir, quelle porte garder, vers quelle sortie
// diriger quelle zone, la phrase à dire au mégaphone, quand être relevé, qui appeler, le rôle PMR.
// Rien n'est inventé : tout vient de la décision, des agents et des données du lieu.
import { identifiantDecision, lib } from './dispatcher.ts';
import type { Agent, Couverture, Decision, Mission, OptionsPreparation, RoleAgent, Sorties } from './types.ts';
import { ErreurDecision, estSur, nettoyerTexte, porteOuverte, tronquer, validerDecision } from './validation.ts';

export const MEGAPHONE_MAX = 90;
export const RADIO_MAX = 160;

const ROLES: readonly RoleAgent[] = ['pc', 'chef_securite', 'ssiap', 'agent_porte', 'agent_escalier', 'agent_salle', 'pompier', 'ratp', 'police'];
const EXTERNES: readonly RoleAgent[] = ['pompier', 'ratp', 'police'];

export function validerAgents(agents: readonly Agent[], sorties: Sorties): string[] {
  const erreurs: string[] = [];
  const vus = new Set<string>();
  for (const a of agents) {
    const id = String(a?.id ?? '').slice(0, 40);
    if (!a || typeof a.id !== 'string' || !/^[\w.:@-]{1,64}$/.test(a.id)) erreurs.push(`agent ${id} : identifiant invalide`);
    else if (vus.has(a.id)) erreurs.push(`agent ${id} : identifiant en double`);
    else vus.add(a.id);
    if (!ROLES.includes(a?.role)) erreurs.push(`agent ${id} : rôle inconnu`);
    if (!['telephone', 'oreillette', 'talkie'].includes(a?.equipement)) erreurs.push(`agent ${id} : équipement inconnu`);
    if (!a?.poste || typeof a.poste.niveau !== 'string') erreurs.push(`agent ${id} : poste sans niveau`);
    else {
      if (a.poste.porte !== undefined && !sorties.portes.includes(a.poste.porte)) erreurs.push(`agent ${id} : porte inconnue`);
      if (a.poste.zone !== undefined && !(a.poste.zone in sorties.zones)) erreurs.push(`agent ${id} : zone inconnue`);
      if (a.poste.salle !== undefined && !(a.poste.salle in sorties.salles)) erreurs.push(`agent ${id} : salle inconnue`);
    }
  }
  return erreurs;
}

export function zoneDe(a: Agent, sorties: Sorties): string | undefined {
  if (a.poste.zone) return a.poste.zone;
  if (a.poste.salle) return sorties.salles[a.poste.salle]?.zone;
  if (a.poste.porte) return Object.entries(sorties.zones).find(([, z]) => z.portes.includes(a.poste.porte!))?.[0];
  return undefined;
}

/** Porte vers laquelle diriger une zone : la consigne de la zone si elle est utilisable, sinon la première porte ouverte de la zone. */
function porteDeZone(zone: string, decision: Decision, sorties: Sorties, exclure?: string): string | undefined {
  const c = decision.consignes_par_zone?.[zone];
  const ok = (p: string): boolean => p !== exclure && porteOuverte(decision, p) && sorties.portes.includes(p);
  if (c && c.clarte !== 'bloquee' && ok(c.porte)) return c.porte;
  return sorties.zones[zone]?.portes.find(ok);
}

function phrase(a: Agent, decision: Decision, sorties: Sorties, zone: string | undefined): string {
  const generique = 'Restez calmes et suivez les indications du personnel.';
  let p: string;
  if (decision.action !== 'evacuer') p = decision.action === 'confiner' ? 'Restez calmes, attendez les indications du personnel.' : generique;
  else if (EXTERNES.includes(a.role) || a.role === 'pc') p = 'Suivez les indications du personnel.';
  else {
    const vers = zone ? porteDeZone(zone, decision, sorties, a.poste.porte) : undefined;
    const versTxt = vers ? lib(sorties, vers) : undefined;
    if (a.role === 'agent_porte' && a.poste.porte) {
      const fermee = !porteOuverte(decision, a.poste.porte);
      if (fermee) p = versTxt ? `Cette porte est fermée. Allez vers ${versTxt}, sans courir.` : generique;
      else p = `Sortie par ${lib(sorties, a.poste.porte)} : avancez calmement, sans courir.`;
    } else if (a.role === 'agent_escalier') p = versTxt ? `Une personne après l'autre, rejoignez ${versTxt}.` : generique;
    else if (a.role === 'agent_salle' && a.poste.salle) p = versTxt ? `Salle ${lib(sorties, a.poste.salle)} : sortez rang par rang vers ${versTxt}.` : generique;
    else p = versTxt ? `Suivez le personnel vers ${versTxt}, calmement.` : generique;
  }
  p = tronquer(nettoyerTexte(p, MEGAPHONE_MAX), MEGAPHONE_MAX);
  return estSur(p) ? p : generique;
}

function lignePmr(a: Agent, decision: Decision, sorties: Sorties, zone: string | undefined, ascenseurInterdit: boolean): string {
  if (decision.action !== 'evacuer') return 'Aidez les personnes à mobilité réduite à rester en sécurité sur place, avec vous.';
  const z = zone ? sorties.zones[zone] : undefined;
  if (ascenseurInterdit) {
    return z?.refuge
      ? `Aucun ascenseur. Orientez les personnes à mobilité réduite vers ${lib(sorties, z.refuge)} et restez avec elles.`
      : 'Aucun ascenseur. Gardez les personnes à mobilité réduite près d\'une issue et demandez de l\'aide au PC.';
  }
  const vers = zone ? porteDeZone(zone, decision, sorties) : undefined;
  void a;
  return vers ? `Aidez les personnes à mobilité réduite à rejoindre ${lib(sorties, vers)}.` : 'Aidez les personnes à mobilité réduite et demandez de l\'aide au PC.';
}

function priorite(role: RoleAgent, decision: Decision): 1 | 2 | 3 {
  if (decision.action === 'informer') return 3;
  if (decision.action === 'confiner') return EXTERNES.includes(role) ? 3 : 2;
  if (EXTERNES.includes(role)) return 3;
  return role === 'agent_salle' ? 2 : 1;
}

export function preparerMissions(decision: Decision, agents: readonly Agent[], sorties: Sorties, options: OptionsPreparation = {}): Mission[] {
  const erreurs = [...validerDecision(decision, sorties).erreurs, ...validerAgents(agents, sorties)];
  if (erreurs.length > 0) throw new ErreurDecision(erreurs);
  const maintenant = (options.maintenant ?? Date.now)();
  const idDecision = identifiantDecision(decision);
  const ascenseurInterdit = decision.ascenseurs_interdits ?? (decision.contexte ?? 'autre') === 'incendie';
  const pc = agents.filter((a) => a.role === 'pc').map((a) => a.id);
  const chefs = agents.filter((a) => a.role === 'chef_securite').map((a) => a.id);
  const ssiap = agents.filter((a) => a.role === 'ssiap').map((a) => a.id);

  return agents.map((a): Mission => {
    const zone = zoneDe(a, sorties);
    const portePoste = a.poste.porte;
    const etat = portePoste ? (porteOuverte(decision, portePoste) ? 'ouverte' : 'fermee') : undefined;
    const coordination = a.role === 'pc' || a.role === 'chef_securite' || a.role === 'ssiap';
    const zonesDirigees = coordination ? Object.keys(sorties.zones) : zone ? [zone] : [];
    const dirige = zonesDirigees.map((z) => {
      const vers = decision.action === 'evacuer' ? porteDeZone(z, decision, sorties, a.poste.porte) : undefined;
      return { zone: z, vers: vers ? lib(sorties, vers) : 'sur place' };
    });
    const niveau = `niveau ${a.poste.niveau}`;
    const se_tenir = a.poste.salle
      ? `Salle ${lib(sorties, a.poste.salle)}, ${niveau}`
      : portePoste
        ? `Porte ${lib(sorties, portePoste)}, ${niveau}`
        : a.role === 'agent_escalier'
          ? `Tête d'escalier, ${niveau}${zone ? `, zone ${lib(sorties, zone)}` : ''}`
          : coordination
            ? a.role === 'pc' ? 'PC sécurité' : `Zone ${zone ? lib(sorties, zone) : 'à parcourir'}, ${niveau}`
            : `Zone ${zone ? lib(sorties, zone) : 'du lieu'}, ${niveau}`;
    const depart = a.poste.salle ? decision.phasage_salles?.find((p) => p.salle === a.poste.salle)?.minute_depart : undefined;
    const megaphone = phrase(a, decision, sorties, zone);
    const appeler = (a.role === 'pc' ? [...chefs, ...ssiap] : a.role === 'chef_securite' ? [...pc, ...ssiap] : [...pc, ...chefs, ...ssiap]).filter((id) => id !== a.id);
    const radio: string[] = [`${se_tenir}.`];
    if (etat) radio.push(`Porte ${etat === 'fermee' ? 'fermée' : 'ouverte'}.`);
    radio.push(`Dites : ${megaphone}`);
    let texte_radio = '';
    for (const r of radio) if (`${texte_radio} ${r}`.trim().length <= RADIO_MAX) texte_radio = `${texte_radio} ${r}`.trim();
    if (!texte_radio) texte_radio = tronquer(`${se_tenir}. ${megaphone}`, RADIO_MAX);
    return {
      id: `${idDecision}:mission:${a.id}`,
      agent_id: a.id,
      role: a.role,
      poste: a.poste,
      priorite: priorite(a.role, decision),
      heure_effet_min: depart ?? decision.minute ?? 0,
      se_tenir,
      porte_a_garder: portePoste && etat ? { porte: portePoste, etat } : undefined,
      dirige,
      phrase_megaphone: megaphone,
      releve: a.poste.salle ? 'Relève quand la salle est vide, sur ordre du PC.' : a.role === 'pc' ? 'Vous gardez la coordination jusqu\'à la fin de l\'incident.' : 'Restez au poste jusqu\'à la relève ordonnée par le PC.',
      appeler,
      role_pmr: lignePmr(a, decision, sorties, zone, ascenseurInterdit),
      texte_radio,
      emis_a: maintenant,
    };
  });
}

const TYPE_ROLE: Record<string, readonly RoleAgent[]> = {
  porte: ['agent_porte'],
  escalier: ['agent_escalier'],
  croisement: ['agent_escalier', 'agent_porte', 'agent_salle'],
};

/**
 * Combien de postes critiques sont tenus et lesquels ne le sont pas. Un poste est requis une fois, ou autant que le guidage
 * du plan le demande (`guidage[point = id du poste ou porte]`). Les manquants viennent uniquement de l'entrée.
 */
export function calculerCouverture(decision: Decision, agents: readonly Agent[], sorties: Sorties): Couverture {
  const postes = sorties.postes_critiques ?? [];
  const tenus: Couverture['tenus'] = [];
  const vides: Couverture['vides'] = [];
  const manquants_par_zone: Record<string, number> = {};
  let total = 0;
  for (const p of postes) {
    const presents = agents.filter((a) => {
      if (!TYPE_ROLE[p.type]?.includes(a.role) && a.role !== 'ssiap' && a.role !== 'chef_securite') return false;
      if (p.porte) return a.poste.porte === p.porte;
      return a.poste.niveau === p.niveau && (a.poste.zone ?? zoneDe(a, sorties)) === p.zone;
    });
    const requis = Math.max(1, decision.guidage?.find((g) => g.point === p.id || (p.porte !== undefined && g.point === p.porte))?.agents ?? 1);
    if (presents.length > 0) tenus.push({ poste: p.id, agents: presents.map((a) => a.id) });
    const manque = Math.max(0, requis - presents.length);
    if (manque > 0) {
      vides.push({ poste: p.id, zone: p.zone, manquants: manque });
      manquants_par_zone[p.zone] = (manquants_par_zone[p.zone] ?? 0) + manque;
      total += manque;
    }
  }
  return { postes_critiques: postes.length, tenus, vides, manquants_par_zone, agents_manquants: total };
}
