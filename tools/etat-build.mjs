// « État du build » : où en est chaque lot, d'après les tickets GitHub, le journal des agents et le script de démo.
// Utilisé par journal-push.mjs (toutes les 10 min, même si rien n'a bougé) et à la main : node tools/etat-build.mjs
import { execSync, execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.cwd();
const STAGNE = 20 * 60_000; // lot « en cours » sans action d'agent depuis 20 min → signalé

function tickets() {
  const brut = execSync('gh issue list --state all --limit 100 --json number,title,labels,assignees,body,state,updatedAt', { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
  return JSON.parse(brut).map((t) => {
    const corps = t.body || '';
    const coches = (corps.match(/^- \[x\]/gim) || []).length;
    const total = coches + (corps.match(/^- \[ \]/gm) || []).length;
    const lot = (corps.match(/lot\/([\w-]+)/) || [])[1] || t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const etapes = (corps.match(/[ÉE]tape[s]? de démo[^0-9\n]*([0-9][0-9, ]*)/i) || [, ''])[1].split(/[ ,]+/).filter(Boolean).map(Number);
    const blocSection = corps.split(/##\s*Bloqu[ée] par/i)[1] || '';
    const bloquePar = [...blocSection.matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
    const etiquettes = t.labels.map((l) => l.name);
    return { n: t.number, titre: t.title, lot, coches, total, etapes, bloquePar, etiquettes, qui: t.assignees.map((a) => a.login).join(', '), ferme: t.state === 'CLOSED', maj: t.updatedAt };
  });
}

// Dernière activité d'agent et dernier résultat de vérification par lot, d'après journal/*.jsonl (toutes machines présentes ici).
function journalParLot() {
  const r = {};
  const d = join(dir, 'journal');
  if (!existsSync(d)) return r;
  for (const f of readdirSync(d).filter((x) => x.endsWith('.jsonl'))) {
    for (const s of readFileSync(join(d, f), 'utf8').split('\n')) {
      try {
        const l = JSON.parse(s);
        const e = (r[l.lot] ||= { t: l.t, verif: null, verifT: null });
        if (l.t > e.t) e.t = l.t;
        if (l.evt === 'VerifRouge' && (!e.verifT || l.t > e.verifT)) { e.verif = 'rouge'; e.verifT = l.t; }
        if (l.evt === 'VerifVerte' && (!e.verifT || l.t > e.verifT)) { e.verif = 'verte'; e.verifT = l.t; }
      } catch {}
    }
  }
  return r;
}

// Dernier commit poussé sur chaque branche distante (toutes machines) : { 'lot/x': { qui, t, sujet } }.
function branches() {
  const r = {};
  try {
    execFileSync('git', ['fetch', '-q', '--prune'], { cwd: dir, stdio: 'pipe' });
    const brut = execFileSync('git', ['for-each-ref', 'refs/remotes/origin', '--format=%(refname:short)|%(authorname)|%(committerdate:iso-strict)|%(subject)'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    for (const l of brut.trim().split('\n')) {
      const [ref, qui, t, ...sujet] = l.split('|');
      if (!ref || ref === 'origin' || /HEAD$/.test(ref)) continue;
      r[ref.replace(/^origin\//, '')] = { qui, t, sujet: sujet.join('|').slice(0, 60) };
    }
  } catch {}
  return r;
}

// Commentaires « vérification rouge » postés sur un ticket par le hook d'une autre machine.
function rougeSurTicket(n) {
  try {
    const c = JSON.parse(execSync(`gh issue view ${n} --json comments -q .comments`, { cwd: dir, encoding: 'utf8', stdio: 'pipe' }));
    const dernier = [...c].reverse().find((x) => /🔴|vérification rouge/i.test(x.body));
    if (!dernier) return null;
    const vert = [...c].reverse().find((x) => /🟢|vérification verte/i.test(x.body));
    if (vert && vert.createdAt > dernier.createdAt) return null;
    return dernier.createdAt;
  } catch { return null; }
}

function etapesDemo() {
  try { return JSON.parse(readFileSync(join(dir, 'demo', 'parcours.json'), 'utf8')).etapes || []; } catch { return []; }
}

const mins = (iso) => Math.round((Date.now() - new Date(iso)) / 60000);

export function etatBuild() {
  let liste;
  try { liste = tickets(); } catch (e) { return `📋 État du build : impossible de lire les tickets GitHub (${String(e.message).split('\n')[0]}). \`gh auth status\` ?`; }
  if (!liste.length) return '📋 État du build : aucun ticket encore. Les lots naissent avec /to-tickets une fois le concept choisi.';
  const jl = journalParLot();
  const br = branches();
  const ouverts = new Set(liste.filter((t) => !t.ferme).map((t) => t.n));
  const lignes = liste.sort((a, b) => a.n - b.n).map((t) => {
    const j = jl[t.lot];
    const b = br['lot/' + t.lot];
    const bloqueurs = t.bloquePar.filter((n) => ouverts.has(n));
    let statut;
    if (t.ferme || t.etiquettes.includes('done')) statut = '✅ fusionné';
    else if (t.etiquettes.includes('bloque')) statut = '🛑 bloqué, attend un humain';
    else if (bloqueurs.length) statut = `⏳ attend ${bloqueurs.map((n) => '#' + n).join(', ')}`;
    else if (t.etiquettes.includes('in-progress')) statut = '🔧 en cours';
    else statut = '🟢 prêt, personne dessus';
    const progres = t.total ? ` · ${t.coches} critère${t.coches > 1 ? 's' : ''} sur ${t.total}` : '';
    const rougeAilleurs = statut === '🔧 en cours' && j?.verif !== 'rouge' ? rougeSurTicket(t.n) : null;
    const verif = j?.verif === 'rouge' ? ` · 🔴 vérification rouge depuis ${mins(j.verifT)} min` : rougeAilleurs ? ` · 🔴 vérification rouge (ticket) depuis ${mins(rougeAilleurs)} min` : j?.verif === 'verte' ? ' · vérification verte' : '';
    const commit = b ? ` · dernier commit ${b.qui} il y a ${mins(b.t)} min` : statut === '🔧 en cours' ? ' · rien de poussé' : '';
    const derniereVie = [j?.t, b?.t].filter(Boolean).sort().pop();
    const stagne = statut === '🔧 en cours' && (!derniereVie || Date.now() - new Date(derniereVie) > STAGNE) ? ` · ⚠️ aucun signe de vie depuis ${derniereVie ? mins(derniereVie) + ' min' : 'le début'}` : '';
    const etapes = t.etapes.length ? ` · démo ${t.etapes.join(', ')}` : '';
    return `#${t.n} ${t.titre} · ${t.qui || 'personne'} · ${statut}${progres}${verif}${commit}${stagne}${etapes}`;
  });
  const lotsConnus = new Set(liste.map((t) => 'lot/' + t.lot));
  for (const [ref, b] of Object.entries(br)) {
    if (ref === 'main' || lotsConnus.has(ref)) continue;
    lignes.push(`hors ticket : branche \`${ref}\` · dernier commit ${b.qui} il y a ${mins(b.t)} min · « ${b.sujet} »`);
  }
  const etapes = etapesDemo();
  let demo = '';
  if (etapes.length) {
    const faites = new Set(liste.filter((t) => t.ferme || t.etiquettes.includes('done')).flatMap((t) => t.etapes));
    const ok = etapes.map((e, i) => e.n ?? i + 1).filter((n) => faites.has(n));
    const reste = etapes.map((e, i) => e.n ?? i + 1).filter((n) => !faites.has(n));
    demo = `\nScript de démo : ${ok.length ? `étapes ${ok.join(', ')} couvertes` : 'aucune étape couverte'}${reste.length ? ` · restent ${reste.join(', ')}` : ' · tout est couvert'}`;
  }
  const faits = liste.filter((t) => t.ferme || t.etiquettes.includes('done')).length;
  return `📋 **État du build** · ${new Date().toTimeString().slice(0, 5)} · ${faits} lot${faits > 1 ? 's' : ''} fusionné${faits > 1 ? 's' : ''} sur ${liste.length}\n${lignes.join('\n')}${demo}`;
}

if (process.argv[1] && /etat-build\.mjs$/.test(process.argv[1])) console.log(etatBuild());
