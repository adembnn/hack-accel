// Écran du poste de crise : onglets Directeur / Dispositif / Agir / Simuler / Voir (planches A + C).
// Tous les chiffres viennent d'un fichier de résultats (resultats.json, sinon l'exemple fourni, badge EXEMPLE).
import dispositifBrut from './dispositif.json';
import exempleBrut from './resultats-exemple.json';
import {
  CATALOGUE, EVENEMENT_CONTRAINTE, ONGLETS, PROPOSABLES, alertesDepuisSerie, appelerApi, badgeSource, codePourType, compteursLeviers, creerPerturbation,
  etatOnglet, formatT, jaugeTension, lieuLePlusProche, lireResultats, niveauDensite, ongletValide, phraseDelai, pointA, sortiesA, versContrainte,
  type Cible, type CodePerturbation, type Contrainte, type EntreeDispositif, type FetchLike, type NomOnglet, type Perturbation, type Resultats,
} from './logique.mjs';
import { dessiner, normaliser, type ModeVue } from './carte';
import { LIEUX, TITRES_TYPE } from './lieux';

interface Proposition { cle: string; id: string; texte: string; entree: EntreeDispositif; origine: string }
interface Decision { t: number; heure: string; texte: string; source: string; effet_t: number | null; refus: boolean }

const DISPOSITIF = dispositifBrut as EntreeDispositif[];
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...enfants: Array<Node | string>): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...enfants);
  return n;
}
const virgule = (v: number) => String(v).replace('.', ',');
const milliers = (v: number) => v.toLocaleString('fr-FR');

const S = {
  res: null as Resultats | null,
  t: 0,
  onglet: 'directeur' as NomOnglet,
  perturbations: [] as Perturbation[],
  seq: 1,
  arme: null as CodePerturbation | null,
  mode: 'foule' as ModeVue,
  calques: { sorties: true, rues: true },
  propositions: [] as Proposition[],
  vues: new Set<string>(),
  registre: [] as Decision[],
  serveur: 'Serveur des agents : pas encore interrogé.',
  voix: false,
  lecture: null as number | null,
};

// ---------- Résultats ----------

async function chargerResultats(): Promise<void> {
  try {
    const r = await fetch('./resultats.json');
    const lu = r.ok ? lireResultats(await r.json()) : null;
    if (lu) {
      S.res = lu;
      return;
    }
  } catch {
    // pas de fichier de résultats : on retombe sur l'exemple, affiché avec son badge
  }
  S.res = lireResultats(exempleBrut);
}

// ---------- Contraintes ----------

function emettre(p: Perturbation, etat: Contrainte['etat']): void {
  window.dispatchEvent(new CustomEvent<Contrainte>(EVENEMENT_CONTRAINTE, { detail: versContrainte(p, etat, S.t) }));
}

function poser(code: CodePerturbation, cible: Cible): boolean {
  const p = creerPerturbation(code, cible, S.seq);
  if (!p) return false;
  S.seq += 1;
  S.perturbations.push(p);
  emettre(p, 'pose');
  S.arme = null;
  dire(`${p.libelle}`, 'Contrainte posée');
  render();
  return true;
}

function lever(id: string): void {
  const i = S.perturbations.findIndex((p) => p.id === id);
  if (i < 0) return;
  const [p] = S.perturbations.splice(i, 1);
  emettre(p!, 'levee');
  dire(p!.libelle, 'Contrainte levée');
  render();
}

// ---------- Phrase dite (planche C) et journal ----------

const journal: Array<{ heure: string; dit: string; compris: string }> = [];
let synthese: SpeechSynthesis | null = null;
try {
  synthese = window.speechSynthesis ?? null;
} catch {
  synthese = null;
}

function dire(phrase: string, meta: string, puces: string[] = []): void {
  $('sousMeta').textContent = `${new Date().toLocaleTimeString('fr-FR')} · ${meta}`;
  $('sousPhrase').textContent = phrase;
  $('sousPuces').replaceChildren(...puces.map((p) => el('span', {}, p)));
  if (S.voix && synthese) {
    const u = new SpeechSynthesisUtterance(phrase);
    u.lang = 'fr-FR';
    synthese.speak(u);
  }
}

// ---------- Propositions au PC sécurité ----------

function sortiesLibres(n: number): string[] {
  if (!S.res) return [];
  const fermes = new Set(S.perturbations.map((p) => p.lieuId));
  return [...sortiesA(S.res, S.t)]
    .filter((s) => !fermes.has(s.id))
    .sort((a, b) => a.densite - b.densite)
    .slice(0, n)
    .map((s) => LIEUX.find((l) => l.id === s.id)?.nom ?? s.id);
}

function texteProposition(id: string): string {
  const libres = sortiesLibres(2);
  switch (id) {
    case 'sonorisation': return `Message de sonorisation : « Quittez le centre par ${libres[0] ?? 'la sortie la moins chargée'} »`;
    case 'guide-serre-files': return `Guide-files à ${libres.join(' et ') || 'deux portes'}`;
    case 'liaison-ratp': return 'Demander à la RATP de rouvrir au moins un accès des stations du Forum';
    case 'alarme-generale': return "Déclencher l'alarme générale : évacuation de tout le centre";
    case 'lev-doute': return "Ne pas attendre la fin de la levée de doute (5 min au plus) : alarme générale immédiate";
    case 'issues-controle': return "Déverrouiller depuis le PC sécurité toutes les issues à contrôle d'accès";
    case 'cinema-l': return "Demander à l'UGC d'interrompre les séances et de faire sortir les salles par vagues";
    default: return DISPOSITIF.find((e) => e.id === id)?.nom ?? id;
  }
}

function proposer(id: string, origine: string, cle = `${id}@${S.seq}-${S.propositions.length}-${S.registre.length}`): void {
  const entree = DISPOSITIF.find((e) => e.id === id);
  if (!entree || S.propositions.some((p) => p.id === id) || S.vues.has(cle)) return;
  S.vues.add(cle);
  S.propositions.push({ cle, id, texte: texteProposition(id), entree, origine });
}

/** Règles simples, en attendant les agents : elles ne lisent que le fichier de résultats et les perturbations posées. */
function evaluerRegles(): void {
  if (!S.res) return;
  const niv = niveauDensite(pointA(S.res, S.t).densite_max);
  if (niv !== 'normal') proposer('sonorisation', 'seuil orange franchi', 'regle:sonorisation');
  if (niv === 'rouge') proposer('guide-serre-files', 'seuil rouge franchi', 'regle:guide-files');
  if (S.perturbations.some((p) => p.code === 'C1')) proposer('liaison-ratp', 'bouche de métro fermée', 'regle:ratp');
}

function decider(prop: Proposition, valide: boolean): void {
  S.propositions = S.propositions.filter((p) => p !== prop);
  const delai = prop.entree.delai_s;
  S.registre.push({
    t: Math.round(S.t),
    heure: new Date().toLocaleTimeString('fr-FR'),
    texte: valide ? prop.texte : `Refusé : ${prop.texte}`,
    source: prop.entree.nom,
    effet_t: valide && delai != null ? Math.round(S.t + delai) : null,
    refus: !valide,
  });
  if (valide) {
    window.dispatchEvent(new CustomEvent('decision-pc', { detail: { id: prop.id, texte: prop.texte, t: S.t, delai_s: delai } }));
    dire(prop.texte, 'Validé par le chef de poste', [phraseDelai(delai) || 'effet à confirmer']);
  }
  render();
}

// ---------- Appels serveur ----------

const fetchNavigateur: FetchLike = (url, init) => fetch(url, init);

function contexte() {
  return {
    lieux: LIEUX.map((l) => l.nom),
    leviers: LIEUX.map((l) => l.nom),
    etat: `t=${Math.round(S.t)} s ; perturbations : ${S.perturbations.map((p) => p.libelle).join(', ') || 'aucune'}`,
  };
}

const norme = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const lieuParNom = (nom: unknown) => (typeof nom === 'string' && nom ? LIEUX.find((l) => norme(l.nom) === norme(nom) || norme(l.nom).includes(norme(nom))) : undefined);

async function envoyerAuDirecteur(texte: string): Promise<void> {
  journal.unshift({ heure: new Date().toLocaleTimeString('fr-FR'), dit: texte, compris: 'envoi au serveur…' });
  dire(texte, 'Le directeur');
  render();
  const r = await appelerApi('/api/directeur', { texte, contexte: contexte() }, fetchNavigateur);
  const entree = journal[0]!;
  if (!r.ok) {
    entree.compris = r.message;
    S.serveur = r.message;
    dire(texte, 'Le directeur', ["Ordre non compris : serveur absent"]);
    render();
    return;
  }
  const d = (r.data ?? {}) as { actions?: Array<Record<string, unknown>>; reponse?: unknown; incompris?: unknown[] };
  const faits: string[] = [];
  for (const a of Array.isArray(d.actions) ? d.actions : []) {
    if (a.type === 'zone_poser' && ['D1', 'D2', 'D5'].includes(String(a.code))) {
      const l = lieuParNom(a.lieu);
      if (l && poser(String(a.code) as CodePerturbation, { x: l.x, y: l.y })) faits.push(`${a.code} posée près de ${l.nom}`);
    } else if (a.type === 'levier' && a.action === 'fermer') {
      const l = lieuParNom(a.cible);
      if (l && poser(codePourType(l.type), { lieu: l })) faits.push(`${l.nom} fermé`);
    }
  }
  entree.compris = typeof d.reponse === 'string' && d.reponse ? d.reponse : faits.join(' ; ') || 'Aucune action reconnue.';
  S.serveur = 'Serveur du directeur : réponse reçue.';
  dire(texte, 'Le directeur', faits);
  render();
}

async function interrogerAgents(): Promise<void> {
  const r = await appelerApi('/api/agents', { contexte: contexte(), resultats_source: S.res?.source }, fetchNavigateur);
  if (!r.ok) {
    S.serveur = r.message;
  } else {
    const liste = (r.data as { propositions?: Array<{ id?: string }> } | null)?.propositions;
    let n = 0;
    for (const p of Array.isArray(liste) ? liste : []) {
      if (typeof p.id === 'string' && PROPOSABLES.includes(p.id)) {
        proposer(p.id, 'agents', `agents:${p.id}`);
        n += 1;
      }
    }
    S.serveur = `Agents : ${n} proposition${n > 1 ? 's' : ''} reçue${n > 1 ? 's' : ''}.`;
  }
  render();
}

// ---------- Construction des panneaux ----------

const panneaux: Record<NomOnglet, HTMLElement> = {} as Record<NomOnglet, HTMLElement>;

function construire(): void {
  const nav = $('onglets');
  for (const o of ONGLETS) {
    const b = el('button', { type: 'button', role: 'tab', id: `onglet-${o.id}`, 'data-onglet': o.id, 'aria-controls': `panneau-${o.id}` }, o.titre);
    nav.append(b);
    const p = el('div', { class: 'panneau', role: 'tabpanel', id: `panneau-${o.id}`, 'aria-labelledby': `onglet-${o.id}` });
    panneaux[o.id] = p;
    $('panneaux').append(p);
  }
  nav.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button[data-onglet]');
    if (b) choisirOnglet(ongletValide(b.getAttribute('data-onglet')));
  });
  construireDirecteur();
  construireDispositif();
  construireAgir();
  construireSimuler();
  construireVoir();
}

function choisirOnglet(o: NomOnglet): void {
  S.onglet = o;
  try {
    localStorage.setItem('onglet', o);
  } catch {
    // stockage indisponible : l'onglet n'est simplement pas mémorisé
  }
  render();
}

function construireDirecteur(): void {
  const p = panneaux.directeur;
  const saisie = el('form', { class: 'saisie' });
  const champ = el('input', { type: 'text', id: 'dirTxt', placeholder: 'Dites ou tapez un ordre', 'aria-label': 'Ordre au directeur', autocomplete: 'off' });
  const micro = el('button', { type: 'button', id: 'dirMic', 'aria-label': 'Parler' }, 'Parler');
  saisie.append(champ, micro, el('button', { type: 'submit' }, 'Envoyer'));
  saisie.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = champ.value.trim();
    if (t) {
      champ.value = '';
      void envoyerAuDirecteur(t);
    }
  });
  type Reco = { lang: string; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; start(): void };
  const w = window as unknown as { SpeechRecognition?: new () => Reco; webkitSpeechRecognition?: new () => Reco };
  const Reconnaissance = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Reconnaissance) {
    micro.setAttribute('disabled', '');
    micro.textContent = 'Micro indisponible';
  } else {
    micro.addEventListener('click', () => {
      const r = new Reconnaissance();
      r.lang = 'fr-FR';
      micro.classList.add('ecoute');
      r.onresult = (e) => {
        const t = e.results[0]?.[0]?.transcript;
        if (t) void envoyerAuDirecteur(t);
      };
      r.onend = () => micro.classList.remove('ecoute');
      r.start();
    });
  }
  p.append(
    el('h2', {}, 'À valider ', el('b', { id: 'nbProp' })),
    el('div', { id: 'listeProp' }),
    el('div', { class: 'etat-serveur', id: 'etatServeur', role: 'status' }),
    el('h2', {}, 'Journal vocal'),
    el('div', { id: 'journal' }),
    saisie,
  );
}

function construireDispositif(): void {
  const p = panneaux.dispositif;
  p.append(el('h2', {}, 'Dispositif en place'), el('p', { class: 'aide' }, "Ce qui existe déjà au Forum ou est obligatoire. L'outil propose au PC sécurité ; le chef de poste décide."));
  const familles = new Map<string, EntreeDispositif[]>();
  for (const e of DISPOSITIF) familles.set(e.famille, [...(familles.get(e.famille) ?? []), e]);
  let i = 0;
  for (const [nom, liste] of familles) {
    const d = el('details', { class: 'fam' }, el('summary', {}, `${nom} · ${liste.length}`));
    if (i++ < 2) d.setAttribute('open', '');
    for (const e of liste) {
      const delai = e.delai_s != null ? ` · délai ${e.delai_s >= 60 ? Math.round(e.delai_s / 60) + ' min' : e.delai_s + ' s'}` : '';
      const it = el('div', { class: 'it' }, el('b', {}, e.nom), el('span', { class: 'c' }, e.certitude), el('br'), el('span', { class: 'm' }, `${e.acteur ?? ''}${delai}`), el('br'), e.role ?? '');
      if (PROPOSABLES.includes(e.id)) {
        const b = el('button', { type: 'button', 'data-proposer': e.id }, 'Proposer au PC sécurité');
        it.append(el('br'), b);
      } else if (e.levier) it.append(el('div', { class: 'm' }, `Levier : ${e.levier}`));
      d.append(it);
    }
    p.append(d);
  }
  p.append(el('h2', {}, 'Registre de sécurité'), el('div', { id: 'regList' }));
  p.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button[data-proposer]');
    if (!b) return;
    const id = b.getAttribute('data-proposer')!;
    S.propositions = S.propositions.filter((q) => q.id !== id);
    proposer(id, 'demande du directeur');
    choisirOnglet('directeur');
  });
}

function construireAgir(): void {
  const p = panneaux.agir;
  p.append(el('h2', {}, 'Perturbations posables'), el('p', { class: 'aide', id: 'aideAgir' }, 'Choisissez une perturbation. Un clic sur un lieu du plan l’ouvre ou le ferme.'));
  const cat = el('div', { class: 'cat', id: 'cat' });
  for (const d of CATALOGUE) cat.append(el('button', { type: 'button', 'data-code': d.code }, el('b', {}, `${d.code} · ${d.famille}`), d.nom));
  const ligne = el('div', { class: 'ligne-pose', id: 'lignePose' });
  p.append(cat, ligne, el('h2', {}, 'En cours'), el('div', { id: 'enCours' }), el('div', { class: 'ligne-pose' }, el('button', { type: 'button', id: 'toutRouvrir' }, 'Tout rouvrir')));
  cat.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button[data-code]');
    if (!b) return;
    const code = b.getAttribute('data-code') as CodePerturbation;
    S.arme = S.arme === code ? null : code;
    render();
  });
  $('toutRouvrir').addEventListener('click', () => [...S.perturbations].forEach((q) => lever(q.id)));
}

function construireSimuler(): void {
  const p = panneaux.simuler;
  p.append(
    el('h2', {}, 'Avant / après le plan ', el('span', { id: 'badgeComp' })),
    el('div', { id: 'comp' }),
    el('h2', {}, 'Agents'),
    el('div', { class: 'ligne-pose' }, el('button', { type: 'button', id: 'btnAgents' }, 'Demander l’avis des agents')),
    el('p', { class: 'aide' }, 'Appelle POST /api/agents. Sans serveur, un message le dit ; rien ne casse.'),
  );
  $('btnAgents').addEventListener('click', () => void interrogerAgents());
}

function construireVoir(): void {
  const p = panneaux.voir;
  const coche = (id: string, libelle: string, ok: boolean, f: (v: boolean) => void) => {
    const c = el('input', { type: 'checkbox', id });
    c.checked = ok;
    c.addEventListener('change', () => {
      f(c.checked);
      render();
    });
    return el('label', { class: 'coche' }, c, libelle);
  };
  p.append(
    el('h2', {}, 'Vue du plan'),
    el('div', { id: 'voirModes', class: 'ligne-pose' }),
    el('h2', {}, 'Calques'),
    coche('cqSorties', 'Sorties, issues, bouches, leviers', true, (v) => (S.calques.sorties = v)),
    coche('cqRues', 'Rues', true, (v) => (S.calques.rues = v)),
    el('h2', {}, 'Voix'),
    coche('cqVoix', 'Lire les réponses à voix haute', false, (v) => (S.voix = v)),
  );
}

const MODES: Array<[ModeVue, string]> = [['foule', 'Foule'], ['densite', 'Densité'], ['flux', 'Flux vers les sorties']];

function construireModes(): void {
  for (const hote of [$('modes'), $('voirModes')]) {
    for (const [m, nom] of MODES) {
      const b = el('button', { type: 'button', 'data-mode': m, 'aria-pressed': 'false' }, nom);
      b.addEventListener('click', () => {
        S.mode = m;
        render();
      });
      hote.append(b);
    }
  }
}

// ---------- Rendu ----------

function render(): void {
  const r = S.res;
  if (!r) return;
  const pt = pointA(r, S.t);
  const niv = niveauDensite(pt.densite_max);
  evaluerRegles();

  // bandeau d'avertissement
  const badges = $('badges');
  badges.replaceChildren();
  const bs = badgeSource(r);
  if (bs) badges.append(el('span', { class: 'badge', title: 'Chiffres d’exemple, pas une simulation' }, bs));
  if (r.interieur_estime) badges.append(el('span', { class: 'badge', title: "L'intérieur du bâtiment n'est pas mesuré" }, 'INTÉRIEUR ESTIMÉ'));
  $('scenario').textContent = r.scenario;

  // bandeau haut
  const phase = $('phase');
  phase.className = S.t > 0 ? (niv === 'rouge' ? 'alerte' : niv === 'orange' ? 'orange' : '') : '';
  phase.querySelector('strong')!.textContent = S.t > 0 ? 'ÉVACUATION' : 'VEILLE';
  $('horloge').textContent = formatT(S.t);
  $('dateLib').textContent = 'Temps simulé';
  const pert = $('pert');
  pert.replaceChildren();
  if (S.perturbations.length === 0) pert.append(el('span', { class: 'vide' }, 'Aucune perturbation posée'));
  for (const q of S.perturbations) {
    const b = el('button', { type: 'button', 'data-lever': q.id, title: 'Lever cette perturbation' }, q.libelle);
    pert.append(b);
  }
  const alarme = $('alarme');
  const alarmeOn = S.registre.some((d) => !d.refus && /alarme générale/i.test(d.texte));
  alarme.className = alarmeOn ? 'on' : '';
  alarme.querySelector('strong')!.textContent = alarmeOn ? 'validée au PC' : 'non déclenchée';

  // onglets
  const ctx = { propositionsEnAttente: S.propositions.length, decisionsRegistre: S.registre.length, perturbationsActives: S.perturbations.length, niveau: niv };
  for (const o of ONGLETS) {
    const b = $<HTMLButtonElement>(`onglet-${o.id}`);
    const e = etatOnglet(o.id, ctx);
    b.className = e.ton === 'neutre' ? '' : e.ton;
    b.setAttribute('aria-selected', String(S.onglet === o.id));
    b.tabIndex = S.onglet === o.id ? 0 : -1;
    b.replaceChildren(o.titre, ...(e.pastille ? [el('span', { class: 'pastille' }, String(e.pastille))] : []));
    panneaux[o.id].hidden = S.onglet !== o.id;
  }

  renderDirecteur();
  renderRegistre();
  renderAgir();
  renderSimuler();
  for (const b of document.querySelectorAll<HTMLElement>('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode));
  $<HTMLInputElement>('cqSorties').checked = S.calques.sorties;

  // chiffres clés
  const gr = $('chiffres');
  const cellule = (lib: string, val: string, sous: string, ton = '') => el('div', { class: ton }, el('small', {}, lib), el('strong', {}, val), el('span', { class: 'sub' }, sous));
  gr.replaceChildren(
    cellule('NON SORTIS', milliers(pt.non_sortis), `sur ${milliers(r.total_personnes)}`),
    cellule('DENSITÉ MAX', virgule(pt.densite_max), `pers./m²${pt.densite_lieu ? ' · ' + pt.densite_lieu : ''}`, niv === 'normal' ? '' : niv),
    cellule('PERS.·MIN > 5/m²', milliers(pt.personnes_min_sup5), 'cumulé depuis le début', pt.personnes_min_sup5 > 0 ? 'orange' : ''),
    cellule('VERS LA ZONE', String(pt.vers_zone), 'sorties côté zone de danger', pt.vers_zone > 0 ? 'rouge' : ''),
  );
  if (S.perturbations.length > 0) gr.append(el('div', { class: '', style: 'grid-column:1 / -1;border-right:0' }, el('span', { class: 'sub' }, 'Ces chiffres ne tiennent pas encore compte des perturbations posées : ils viendront de la simulation.')));
  const bc = $('badgeChiffres');
  bc.replaceChildren(...(bs ? [el('span', { class: 'badge' }, bs)] : []));

  // jauge
  const j = jaugeTension(pt.densite_max);
  const rempli = $('jaugeRempli');
  rempli.style.width = `${j.position * 100}%`;
  rempli.className = `rempli ${j.niveau === 'normal' ? '' : j.niveau}`;
  $('repO').style.left = `${j.orange * 100}%`;
  $('repR').style.left = `${j.rouge * 100}%`;
  $('jauge').setAttribute('aria-valuenow', String(pt.densite_max));

  // fil d'alertes
  const al = alertesDepuisSerie(r.serie);
  $('alertes').replaceChildren(
    ...(al.length ? al : []).map((a) => el('li', { class: `${a.niveau}${a.t > S.t ? ' futur' : ''}` }, el('time', {}, formatT(a.t)), el('span', {}, a.texte))),
    ...(al.length ? [] : [el('li', {}, el('span', { class: 'sub' }, 'Aucun seuil franchi dans la série.'))]),
  );

  // dispositif (résumé)
  const etatD = (id: string) => (S.registre.some((d) => !d.refus && d.source === DISPOSITIF.find((e) => e.id === id)?.nom) ? 's' : S.propositions.some((p) => p.id === id) ? 'e' : '');
  const ligneD = (id: string, lib: string) => {
    const c = etatD(id);
    return el('li', { class: c }, el('i'), el('span', {}, lib), el('em', {}, c === 's' ? 'validée' : c === 'e' ? 'proposée' : 'prête'));
  };
  $('dispoRes').replaceChildren(ligneD('lev-doute', 'Levée de doute'), ligneD('sonorisation', 'Sonorisation'), ligneD('alarme-generale', 'Alarme générale'), ligneD('issues-controle', "Issues à contrôle d'accès"), ligneD('liaison-ratp', 'Liaison RATP'));

  // leviers
  const cpt = compteursLeviers(LIEUX, S.perturbations);
  $('leviers').replaceChildren(
    ...(Object.keys(TITRES_TYPE) as Array<keyof typeof TITRES_TYPE>).map((t) => {
      const c = cpt[t] ?? { ouverts: 0, total: 0 };
      return el('div', { class: c.ouverts < c.total ? 'x' : '' }, TITRES_TYPE[t], el('b', {}, `${c.ouverts}/${c.total}`));
    }),
  );

  // curseur et chronologie
  const cur = $<HTMLInputElement>('curseur');
  cur.max = String(r.horizon_s);
  cur.step = '5';
  cur.value = String(S.t);
  $('curseurT').textContent = formatT(S.t);
  $('lecture').textContent = S.lecture === null ? '▶' : '❚❚';
  renderFrise(r);

  // plan
  dessiner($<HTMLCanvasElement>('carte'), { mode: S.mode, sorties: sortiesA(r, S.t), perturbations: S.perturbations, calques: S.calques, interieurEstime: r.interieur_estime });
  $('carte').style.cursor = S.arme ? 'crosshair' : 'default';
}

function renderDirecteur(): void {
  $('nbProp').textContent = String(S.propositions.length);
  const liste = $('listeProp');
  if (S.propositions.length === 0) liste.replaceChildren(el('div', { class: 'vide' }, 'Rien à valider. Les propositions arrivent ici quand un seuil est franchi ou sur demande.'));
  else {
    liste.replaceChildren(
      ...S.propositions.map((q, i) => {
        const ok = el('button', { type: 'button', class: 'ok' }, 'Valider');
        const no = el('button', { type: 'button' }, 'Refuser');
        ok.addEventListener('click', () => decider(q, true));
        no.addEventListener('click', () => decider(q, false));
        return el(
          'article',
          { class: 'prop' },
          el('div', { class: 'n' }, `PROPOSITION ${i + 1}${i === 0 ? ' · PLUS URGENTE' : ''}`),
          el('p', {}, q.texte),
          el('div', { class: 'src' }, `PC sécurité · ${phraseDelai(q.entree.delai_s) || 'délai non connu'} · ${q.origine} · ${q.entree.certitude}`),
          el('div', { class: 'btns' }, ok, no),
        );
      }),
    );
  }
  $('etatServeur').textContent = S.serveur;
  $('journal').replaceChildren(
    ...(journal.length ? journal : []).map((l) => el('div', { class: 'lig' }, el('time', {}, l.heure), el('span', {}, el('q', {}, l.dit), el('br'), l.compris))),
    ...(journal.length ? [] : [el('div', { class: 'vide' }, 'Parlez ou tapez. L’outil écrit ce qu’il comprend avant d’agir.')]),
  );
}

function renderRegistre(): void {
  const reg = $('regList');
  if (S.registre.length === 0) reg.replaceChildren(el('div', {}, 'Aucune décision encore.'));
  else reg.replaceChildren(...[...S.registre].reverse().map((d) => el('div', {}, `${d.heure} · ${formatT(d.t)} · ${d.texte}${d.effet_t != null ? ` · effet à ${formatT(d.effet_t)}` : ''}`)));
}

function renderAgir(): void {
  for (const b of document.querySelectorAll<HTMLElement>('#cat button')) b.classList.toggle('arme', b.dataset.code === S.arme);
  const ligne = $('lignePose');
  ligne.replaceChildren();
  const def = CATALOGUE.find((d) => d.code === S.arme);
  if (def?.pose === 'lieu') {
    const sel = el('select', { 'aria-label': 'Lieu' });
    for (const l of LIEUX.filter((x) => def.typesCible?.includes(x.type))) sel.append(el('option', { value: l.id }, l.nom));
    const b = el('button', { type: 'button' }, 'Poser');
    b.addEventListener('click', () => poser(def.code, { lieu: LIEUX.find((l) => l.id === sel.value) }));
    ligne.append(sel, b);
  } else if (def?.pose === 'carte') {
    ligne.append(el('span', { class: 'vide' }, 'Cliquez sur le plan pour poser la zone.'));
  } else if (def?.pose === 'delai') {
    const n = el('input', { type: 'number', min: '1', max: '600', value: '90', 'aria-label': 'Retard en secondes' });
    const b = el('button', { type: 'button' }, 'Poser');
    b.addEventListener('click', () => poser(def.code, { delai_s: Number(n.value) }));
    ligne.append(n, el('span', {}, 's de retard'), b);
  }
  const enCours = $('enCours');
  if (S.perturbations.length === 0) enCours.replaceChildren(el('div', { class: 'vide' }, 'Aucune.'));
  else enCours.replaceChildren(...S.perturbations.map((q) => { const b = el('button', { type: 'button', 'data-lever': q.id }, `Lever · ${q.libelle}`); b.style.cssText = 'margin:0 12px 6px;display:block'; return b; }));
}

function renderSimuler(): void {
  const r = S.res!;
  const bs = badgeSource(r);
  $('badgeComp').replaceChildren(...(bs ? [el('span', { class: 'badge' }, bs)] : []));
  const lignes: Array<[string, (b: Resultats['avant']) => number, (v: number) => string]> = [
    ['Non sortis', (b) => b.non_sortis, milliers],
    ['Pers.·min > 5/m²', (b) => b.personnes_min_sup5, milliers],
    ['Vers la zone', (b) => b.vers_zone, String],
    ['Temps d’évacuation', (b) => b.temps_evacuation_s, (v) => formatT(v).slice(2)],
  ];
  const table = el('table', { class: 'comp' }, el('thead', {}, el('tr', {}, el('th', {}, ''), el('th', {}, 'AVANT'), el('th', {}, 'APRÈS'), el('th', {}, 'ÉCART'))));
  const corps = el('tbody');
  for (const [lib, f, fmt] of lignes) {
    const a = f(r.avant);
    const b = f(r.apres);
    corps.append(el('tr', {}, el('td', {}, lib), el('td', {}, fmt(a)), el('td', { class: b < a ? 'mieux' : '' }, fmt(b)), el('td', {}, a === 0 ? '—' : `${b - a > 0 ? '+' : ''}${Math.round(((b - a) / a) * 100)} %`)));
  }
  table.append(corps);
  $('comp').replaceChildren(table);
}

function renderFrise(r: Resultats): void {
  const piste = $('piste');
  const pc = (t: number) => `${Math.min(100, Math.max(0, (t / r.horizon_s) * 100))}%`;
  const evts = [
    ...r.jalons.map((j) => ({ t: j.t, lib: j.libelle, cls: j.type === 'danger' ? 'danger' : '' })),
    ...S.registre.filter((d) => d.effet_t != null).map((d) => ({ t: d.effet_t!, lib: d.source, cls: d.effet_t! > S.t ? 'futur' : '' })),
  ].sort((a, b) => a.t - b.t);
  const nodes: HTMLElement[] = [el('div', { class: 'axe' }), el('div', { class: 'futur', style: `left:${pc(S.t)}` })];
  evts.forEach((e, i) => {
    const futur = e.t > S.t && !e.cls ? ' futur' : '';
    const n = el('div', { class: `ev ${e.cls}${futur}${i % 2 ? ' bas' : ''}`, style: `left:${pc(e.t)}` }, el('b', {}, formatT(e.t).slice(2)), e.lib);
    nodes.push(n);
  });
  nodes.push(el('div', { class: 'maint', style: `left:${pc(S.t)}` }, el('span', {}, 'MAINTENANT')));
  piste.replaceChildren(...nodes);
}

// ---------- Démarrage ----------

function brancher(): void {
  $('pert').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button[data-lever]');
    if (b) lever(b.getAttribute('data-lever')!);
  });
  $('enCours').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button[data-lever]');
    if (b) lever(b.getAttribute('data-lever')!);
  });
  $('curseur').addEventListener('input', (e) => {
    S.t = Number((e.target as HTMLInputElement).value);
    render();
  });
  $('lecture').addEventListener('click', () => {
    if (S.lecture !== null) {
      clearInterval(S.lecture);
      S.lecture = null;
    } else {
      if (S.res && S.t >= S.res.horizon_s) S.t = 0;
      S.lecture = window.setInterval(() => {
        S.t = Math.min(S.res!.horizon_s, S.t + 10);
        if (S.t >= S.res!.horizon_s && S.lecture !== null) {
          clearInterval(S.lecture);
          S.lecture = null;
        }
        render();
      }, 200);
    }
    render();
  });
  const canvas = $<HTMLCanvasElement>('carte');
  canvas.addEventListener('click', (e) => {
    const pos = normaliser(canvas, e.clientX, e.clientY);
    if (!pos) return;
    const def = CATALOGUE.find((d) => d.code === S.arme);
    if (def?.pose === 'carte') {
      poser(def.code, pos);
      return;
    }
    const l = lieuLePlusProche(LIEUX, pos.x, pos.y);
    if (!l) return;
    const active = S.perturbations.find((q) => q.lieuId === l.id);
    if (active) lever(active.id);
    else poser(codePourType(l.type), { lieu: l });
  });
  new ResizeObserver(() => render()).observe(canvas);
}

async function demarrer(): Promise<void> {
  await chargerResultats();
  if (!S.res) {
    document.body.textContent = 'Aucun fichier de résultats exploitable.';
    return;
  }
  try {
    S.onglet = ongletValide(localStorage.getItem('onglet'));
  } catch {
    S.onglet = 'directeur';
  }
  const param = new URLSearchParams(location.search).get('t');
  if (param !== null && Number.isFinite(Number(param))) S.t = Number(param);
  construire();
  construireModes();
  brancher();
  render();
}

void demarrer();
