// Panneau « Plans du directeur » sur la vue du Forum : la consigne réelle et les 3 meilleurs plans de l'explorateur
// (src/explorateur/, résumé dans ../commun/plans-forum.json), chacun jugé sur sa pire variante de la manifestation.
// « Voir joué » applique le plan aux leviers de leviers.js (LEV, ZONES, levRefresh) et fait avancer le cortège ;
// « Retenir » émet window 'plan-retenu' {plan, ordres} pour l'ordre de service.
// Les sorties en tension et les sorties qui peuvent les soulager s'affichent sur la carte.
const css = document.createElement('style');
css.textContent = `
#pl{position:fixed;left:12px;bottom:12px;z-index:6;font:500 13px system-ui,sans-serif;color:#1D1F1E;max-width:calc(100vw - 24px)}
#pl>button.ouvrir{all:unset;cursor:pointer;background:#1D1F1E;color:#fff;font-weight:700;padding:8px 12px;border-radius:6px}
#pl .boite{display:none;background:rgba(250,248,243,.97);border:1px solid #d6d1c6;border-radius:6px;padding:10px;box-shadow:0 8px 22px rgba(0,0,0,.18)}
#pl.on .boite{display:block}#pl.on>button.ouvrir{display:none}
#pl .tete{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:8px}
#pl .tete b{font-size:14px}#pl .tete small{color:#6b665c}
#pl .cols{display:grid;grid-template-columns:repeat(4,minmax(170px,230px));gap:8px;overflow-x:auto}
#pl .col{border:1px solid #d6d1c6;border-radius:5px;background:#fff;padding:8px;display:flex;flex-direction:column;gap:6px}
#pl .col.ref{background:#f1eee7}#pl .col.choisi{outline:3px solid #0b6b45}
#pl .col h4{margin:0;font-size:13px}#pl .col h4 span{color:#6b665c;font-weight:500}
#pl ul{margin:0;padding-left:16px}#pl li{margin:1px 0}
#pl table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}#pl td{padding:1px 0}#pl td+td{text-align:right;font-weight:700}
#pl .mieux{color:#0b6b45}#pl .pire{color:#c62828}
#pl .tens{font-size:12px;color:#5a4a00;background:#fff4d6;border-radius:4px;padding:4px 6px}
#pl .acts{display:flex;gap:6px;margin-top:auto}
#pl .acts button{all:unset;cursor:pointer;padding:5px 8px;border-radius:4px;border:1px solid #1D1F1E;font-weight:600}
#pl .acts button.ret{background:#1D1F1E;color:#fff}
#pl .fermer{all:unset;cursor:pointer;color:#6b665c}`;
document.head.appendChild(css);

const root = document.createElement('div'); root.id = 'pl';
root.innerHTML = '<button class="ouvrir">Plans du directeur</button><div class="boite"></div>';
document.body.appendChild(root);
root.querySelector('.ouvrir').onclick = () => root.classList.add('on');

const LIB = { 'est': 'par l’est', 'ouest': 'par l’ouest' };
const varLib = (id, V) => { const v = V.find((x) => x.id === id); return v ? `manif ${v.taille} pers. ${LIB[v.trajet]}, ${v.avance ? '20 min plus tôt' : 'à l’heure prévue'}` : 'sans manif'; };
// Nom affiché : celui de la vue (LEV.nom, ex. « Issue rue Berger 11 ») quand on le trouve
const court = (n) => { const L = typeof LEV !== 'undefined' && LEV.find((l) => nomLev(l) === n); return (L && L.type === 'issue' ? L.nom : n).replace('Porte ', ''); };
const mmss = (s) => (s == null ? 'pas atteint' : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`);

// Ordres du plan, en phrases de PC sécurité
export function ordres(p) {
  const o = [];
  if (p.fermees.length) o.push(`Fermer : ${p.fermees.map(court).join(', ')}`);
  p.agents.forEach((s, i) => o.push(`Équipe ${String.fromCharCode(65 + i)} (4 agents) à ${court(s)} : guider vers la sortie`));
  if (p.annonces.length) o.push(`Messages par zone : diriger vers ${p.annonces.map(court).join(', ')}`);
  if (p.vagues > 1) o.push(`Sortie des salles du cinéma en ${p.vagues} vagues, 2 min d’écart (${(p.vagues - 1) * 6} agents)`);
  if (p.escalators === 'montee') o.push('Tous les escalators dans le sens de la sortie');
  if (p.ratp) o.push('Demander à la RATP de garder une bouche ouverte, filtrée (2 agents)');
  if (!o.length) o.push('Tout ouvert, aucun guidage');
  return o;
}

let R = null, choisi = null;
function colonne(x, i, ref) {
  const p = x.plan, n = x.pire, b = ref?.pire;
  const cmp = (v, w, inv) => (w == null || v === w ? '' : (v < w) !== !!inv ? 'mieux' : 'pire');
  const t = (n.tension || []).slice(0, 2);
  return `<div class="col ${ref ? '' : 'ref'} ${choisi === p.id ? 'choisi' : ''}" data-i="${i}">
   <h4>${ref ? `Plan ${i}` : 'Consigne réelle'} <span>· ${p.id}</span></h4>
   <ul>${ordres(p).map((s) => `<li>${s}</li>`).join('')}</ul>
   <table>
    <tr><td>Écrasement (ligne rouge)</td><td class="${n.rouge ? 'pire' : ''}">${n.rouge ? 'dépassée' : 'tenue'}</td></tr>
    <tr><td>Non sortis à 10 min</td><td class="${cmp(n.non_sortis, b?.non_sortis)}">${n.non_sortis}</td></tr>
    <tr><td>Bloqués sans chemin (stations fermées)</td><td class="${cmp(n.pieges_restants, b?.pieges_restants)}">${n.pieges_restants ?? '–'} / ${n.pieges ?? '–'}</td></tr>
    <tr><td>Sortis côté manif</td><td class="${cmp(n.zone_danger, b?.zone_danger)}">${n.zone_danger}</td></tr>
    <tr><td>95 % dehors</td><td class="${cmp(n.t95_s ?? 1e9, b ? b.t95_s ?? 1e9 : null)}">${mmss(n.t95_s)}</td></tr>
    <tr><td>Agents demandés</td><td>${n.agents}</td></tr>
   </table>
   <small>Pire cas : ${varLib(n.variante, R.variantes)}</small>
   ${t.map((s) => `<div class="tens"><b>${court(s.sortie)} en tension</b> : ${s.file_max} en file à ${mmss(s.a_s)}${s.delestage.length ? ` ; soulager par ${s.delestage.map((d) => `${court(d.sortie)} (+${d.detour_m} m)`).join(', ')}` : ''}</div>`).join('')}
   <div class="acts"><button class="voir">Voir joué</button>${ref ? '<button class="ret">Retenir</button>' : ''}</div></div>`;
}
function rendre() {
  const box = root.querySelector('.boite');
  if (!R) { box.innerHTML = '<div class="tete"><b>Plans du directeur</b><button class="fermer">✕</button></div>Aucun classement : lancer <code>node src/explorateur/explorer.mjs</code>.'; return; }
  const ref = R.reference;
  box.innerHTML = `<div class="tete"><div><b>Plans du directeur</b> <small>${R.imposees.nom} · ${R.plans_essayes} plans essayés, ${R.runs} simulations · chaque plan jugé sur la pire de ${R.variantes.length} variantes</small></div><button class="fermer">✕</button></div>
   <div class="cols">${colonne(ref, 0, null)}${R.meilleurs.map((x, i) => colonne(x, i + 1, ref)).join('')}</div>`;
  box.querySelector('.fermer').onclick = () => root.classList.remove('on');
  box.querySelectorAll('.col').forEach((c) => {
    const i = +c.dataset.i, x = i ? R.meilleurs[i - 1] : ref;
    c.querySelector('.voir').onclick = () => jouerDansLaVue(x);
    const r = c.querySelector('.ret'); if (r) r.onclick = () => { choisi = x.plan.id; rendre(); window.dispatchEvent(new CustomEvent('plan-retenu', { detail: { plan: x.plan, ordres: ordres(x.plan), note: x.pire } })); };
  });
}

// ---------- Jouer un plan dans la vue ----------
let minuteur = null, mesTensions = null;
// Correspondance stable avec leviers.js : porte-<k> = groupe k du moteur ; issue-<j> = « Issue de secours j+1 » de l'explorateur (ordre navgrid)
function nomLev(L) { return L.type === 'porte' ? SIM.groups[L.grp]?.n : L.type === 'issue' ? `Issue de secours ${+L.id.split('-')[1] + 1}` : null; }
async function jouerDansLaVue(x) {
  if (typeof LEV === 'undefined' || typeof levRefresh !== 'function') return;
  const p = x.plan, v = R.variantes.find((w) => w.id === x.pire.variante), { positionCortege } = await import('../../../src/explorateur/scenario.mjs'); // la page doit être servie depuis la racine du dépôt
  clearInterval(minuteur);
  // contraintes imposées : stations fermées (toutes les bouches), sauf la bouche gardée par la RATP si le plan l'obtient
  const bouches = LEV.filter((L) => L.type === 'bouche');
  bouches.forEach((L, i) => { L.etat = p.ratp && i === 0 ? 'ouvert' : 'fermé'; });
  LEV.forEach((L) => { const n = nomLev(L); if (!n) return; L.etat = p.fermees.includes(n) ? 'fermé' : 'ouvert'; L.agent = p.agents.includes(n); L.annonce = p.annonces.includes(n); });
  // manifestation : un cortège qui avance (zone D1), et des troubles qui bloquent les portes au contact si elle est grosse (D2)
  for (let k = ZONES.length - 1; k >= 0; k--) if (ZONES[k].plan) { ZONES[k].mesh.parent?.remove(ZONES[k].mesh); ZONES.splice(k, 1); }
  const poser = (code) => { if (typeof addZone !== 'function') return null; addZone(code, 0, 0); const Z = ZONES[ZONES.length - 1]; Z.plan = true; Z.x0 = 0; Z.z0 = 0; return Z; };
  const zs = v ? [poser('D1'), v.rayon_bloque ? poser('D2') : null].filter(Boolean) : [];
  if (zs[0]) zs[0].r = v.rayon_evite - 25; if (zs[1]) zs[1].r = v.rayon_bloque - 10;
  const bouger = () => { const c = v && positionCortege(v, SIM.T || 0); zs.forEach((Z) => { const [cx, cz] = c || [9e3, 9e3]; Z.x = cx; Z.z = cz; Z.mesh.position.set(cx - Z.x0, 0, cz - Z.z0); }); levRefresh(); };
  bouger();
  if (typeof calm === 'function') calm();
  if (p.escalators === 'montee') SIM.g.links.forEach((k) => { if (k.k === 'escalator') k.debit = 2.0; });
  const T = SIM.groups.find((G) => G.type === 'train'); if (T && p.ratp) T.filtre = true;
  document.getElementById('evacGo')?.click();
  if (p.vagues > 1) { let i = 0; SIM.A.forEach((a) => { if (a.kind === 'cine') a.pre += 120 * (i++ % p.vagues); }); }
  montrerTensions(x.pire.tension || []);
  minuteur = setInterval(bouger, 1000);
}

// Repères sur la carte : sortie en tension (ambre, nombre en file) et sorties de délestage (vert, détour)
function montrerTensions(liste) {
  if (mesTensions) scene.remove(mesTensions);
  mesTensions = new THREE.Group(); scene.add(mesTensions);
  const pos = (n) => { const L = LEV.find((l) => nomLev(l) === n); return L ? [L.x, (L.y || 0), L.z] : null; };
  const etiquette = (txt, fond, [x, y, z]) => {
    const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = '700 30px system-ui'; const w = g.measureText(txt).width + 24; c.width = w; c.height = 46;
    g.font = '700 30px system-ui'; g.fillStyle = fond; g.fillRect(0, 0, w, 46); g.fillStyle = '#fff'; g.fillText(txt, 12, 33);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), sizeAttenuation: false, depthTest: false }));
    s.scale.set(0.024 * w / 46, 0.024, 1); s.position.set(x, y + 22, z); s.center.set(0.5, 0); s.renderOrder = 22; mesTensions.add(s);
  };
  liste.forEach((t) => {
    const a = pos(t.sortie); if (!a) return; etiquette(`${court(t.sortie)} : ${t.file_max} en file`, '#b26a00', a);
    t.delestage.forEach((d) => { const b = pos(d.sortie); if (b) etiquette(`→ ${court(d.sortie)} +${d.detour_m} m`, '#0b6b45', b); });
  });
}

fetch('../commun/plans-forum.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((j) => { R = j; rendre(); });
