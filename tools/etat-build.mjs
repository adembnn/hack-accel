// « État du build » : où en est chaque lot, d'après les tickets GitHub (un seul appel), les commits poussés par branche,
// le journal des agents de cette machine et le script de démo.
// Utilisé par journal-push.mjs (toutes les 10 min, même si rien n'a bougé) et à la main : node tools/etat-build.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.cwd();
const STAGNE = 20 * 60_000; // lot « en cours » sans signe de vie (action d'agent ici, ou commit poussé) depuis 20 min → signalé
const mins = (iso) => Math.round((Date.now() - new Date(iso)) / 60000);

function tickets() {
  const brut = execFileSync('gh', ['issue', 'list', '--state', 'all', '--limit', '100', '--json', 'number,title,labels,assignees,body,state,updatedAt,comments'], { cwd: dir, encoding: 'utf8', stdio: 'pipe', timeout: 20000 });
  return JSON.parse(brut).map((t) => {
    const corps = t.body || '';
    const coches = (corps.match(/^- \[x\]/gim) || []).length;
    const total = coches + (corps.match(/^- \[ \]/gm) || []).length;
    const lot = (corps.match(/lot\/([\w-]+)/) || [])[1] || null;
    const etapes = (corps.match(/[ÉE]tapes? de démo[^0-9\n]*([0-9][0-9, ]*)/i) || [, ''])[1].split(/[ ,]+/).filter(Boolean).map(Number);
    const bloquePar = [...(corps.split(/##\s*Bloqu[ée] par/i)[1] || '').matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
    const cs = t.comments || [];
    const dernierRouge = [...cs].reverse().find((c) => /🔴|vérification rouge/i.test(c.body));
    const dernierVert = [...cs].reverse().find((c) => /🟢|vérification verte/i.test(c.body));
    const rougeTicket = dernierRouge && !(dernierVert && dernierVert.createdAt > dernierRouge.createdAt) ? dernierRouge.createdAt : null;
    return { n: t.number, titre: t.title, lot, coches, total, etapes, bloquePar, etiquettes: t.labels.map((l) => l.name), qui: t.assignees.map((a) => a.login).join(', '), ferme: t.state === 'CLOSED', rougeTicket };
  });
}

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
        if ((l.evt === 'VerifRouge' || l.evt === 'VerifVerte') && (!e.verifT || l.t > e.verifT)) { e.verif = l.evt === 'VerifRouge' ? 'rouge' : 'verte'; e.verifT = l.t; }
      } catch {}
    }
  }
  return r;
}

function branches() {
  const r = {};
  try {
    execFileSync('git', ['fetch', '-q', '--prune'], { cwd: dir, stdio: 'pipe', timeout: 15000 });
    const brut = execFileSync('git', ['for-each-ref', 'refs/remotes/origin', '--format=%(refname:short)|%(authorname)|%(committerdate:iso-strict)|%(subject)'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    for (const l of brut.trim().split('\n')) {
      const [ref, qui, t, ...sujet] = l.split('|');
      if (!ref || ref === 'origin' || /HEAD$/.test(ref)) continue;
      r[ref.replace(/^origin\//, '')] = { qui, t, sujet: sujet.join('|').slice(0, 60) };
    }
  } catch {}
  return r;
}

function etapesDemo() {
  try { return JSON.parse(readFileSync(join(dir, 'demo', 'parcours.json'), 'utf8')).etapes || []; } catch { return []; }
}

export function etatBuild() {
  let liste;
  try { liste = tickets(); } catch (e) { return `📋 État du build : impossible de lire les tickets GitHub (${String(e.message).split('\n')[0]}). \`gh auth status\` ?`; }
  if (!liste.length) return '📋 État du build : aucun ticket encore. Les lots naissent avec to-tickets une fois le concept choisi.';
  const jl = journalParLot();
  const br = branches();
  const ouverts = new Set(liste.filter((t) => !t.ferme).map((t) => t.n));
  const lignes = liste.sort((a, b) => a.n - b.n).map((t) => {
    const j = t.lot ? jl[t.lot] : null;
    const b = t.lot ? br['lot/' + t.lot] : null;
    const bloqueurs = t.bloquePar.filter((n) => ouverts.has(n));
    let statut;
    if (t.ferme || t.etiquettes.includes('done')) statut = '✅ fusionné';
    else if (t.etiquettes.includes('bloque')) statut = '🛑 bloqué, attend un humain';
    else if (bloqueurs.length) statut = `⏳ attend ${bloqueurs.map((n) => '#' + n).join(', ')}`;
    else if (t.etiquettes.includes('in-progress')) statut = '🔧 en cours';
    else statut = '🟢 prêt, personne dessus';
    const progres = t.total ? ` · ${t.coches} critère${t.coches > 1 ? 's' : ''} sur ${t.total}` : '';
    const verif = j?.verif === 'rouge' ? ` · 🔴 vérification rouge depuis ${mins(j.verifT)} min` : t.rougeTicket && statut === '🔧 en cours' ? ` · 🔴 vérification rouge (ticket) depuis ${mins(t.rougeTicket)} min` : j?.verif === 'verte' ? ' · vérification verte' : '';
    const commit = b ? ` · dernier commit ${b.qui} il y a ${mins(b.t)} min` : statut === '🔧 en cours' ? ' · rien de poussé' : '';
    const derniereVie = [j?.t, b?.t].filter(Boolean).sort().pop();
    const stagne = statut === '🔧 en cours' && (!derniereVie || Date.now() - new Date(derniereVie) > STAGNE) ? ` · ⚠️ aucun signe de vie depuis ${derniereVie ? mins(derniereVie) + ' min' : 'le début'}` : '';
    const sansLot = !t.lot && !t.ferme ? ' · ⚠️ pas de ligne **Lot** dans le ticket' : '';
    const etapes = t.etapes.length ? ` · démo ${t.etapes.join(', ')}` : '';
    return `#${t.n} ${t.titre} · ${t.qui || 'personne'} · ${statut}${progres}${verif}${commit}${stagne}${sansLot}${etapes}`;
  });
  const lotsConnus = new Set(liste.filter((t) => t.lot).map((t) => 'lot/' + t.lot));
  for (const [ref, b] of Object.entries(br)) {
    if (ref === 'main' || lotsConnus.has(ref)) continue;
    lignes.push(`hors ticket : branche \`${ref}\` · dernier commit ${b.qui} il y a ${mins(b.t)} min · « ${b.sujet} »`);
  }
  const etapes = etapesDemo();
  let demo = '';
  if (etapes.length) {
    const faites = new Set(liste.filter((t) => t.ferme || t.etiquettes.includes('done')).flatMap((t) => t.etapes));
    const nums = etapes.map((e, i) => e.n ?? i + 1);
    const ok = nums.filter((n) => faites.has(n)), reste = nums.filter((n) => !faites.has(n));
    demo = `\nScript de démo : ${ok.length ? `étapes ${ok.join(', ')} couvertes` : 'aucune étape couverte'}${reste.length ? ` · restent ${reste.join(', ')}` : ' · tout est couvert'}`;
  }
  const faits = liste.filter((t) => t.ferme || t.etiquettes.includes('done')).length;
  return `📋 **État du build** · ${new Date().toTimeString().slice(0, 5)} · ${faits} lot${faits > 1 ? 's' : ''} fusionné${faits > 1 ? 's' : ''} sur ${liste.length}\n${lignes.join('\n')}${demo}`;
}

if (process.argv[1] && /etat-build\.mjs$/.test(process.argv[1])) console.log(etatBuild());
