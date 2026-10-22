// Foule de l'Arena pilotée par le moteur (sim/arena-sim.js) au lieu de la marche aléatoire de démonstration.
// Silhouettes instanciées (même dessin que la vue Châtelet), lecture / pause / vitesse, compteurs, et chaque levier
// actionné dans le menu (événement 'levier' émis par ../commun/regie-ui.js) est appliqué au moteur par sim.apply.
import { buildWorld, Sim, DT } from './sim/arena-sim.js';

const COL = {clothes: [0x26324d, 0x8c1f1f, 0x2f2f2f, 0xd8d1c0, 0x1f5a40, 0x9a7040, 0x55578f, 0x6b2d5c, 0x3b6e8f, 0xb85c2a], skins: [0xf1c9a5, 0xd9a37a, 0xa86f4a, 0x6e4430, 0xe8b896]};
const HES = new THREE.Color(0xF2A900), QUEUE = new THREE.Color(0xE0461F), STAFF = new THREE.Color(0xFFD100);
let world = null, sim = null, playing = false, speed = 4, acc = 0, body = null, head = null, stew = null;

function silhouettes(n) {
  const parts = [[new THREE.CylinderGeometry(.08, .07, .86, 4, 1, true), -.1, .43], [new THREE.CylinderGeometry(.08, .07, .86, 4, 1, true), .1, .43], [new THREE.CylinderGeometry(.2, .17, .66, 6, 1, false), 0, 1.17]];
  const pos = [], nor = []; parts.forEach(([g, dx, dy]) => { const gg = g.toNonIndexed(); gg.translate(dx, dy, 0); pos.push(...gg.attributes.position.array); nor.push(...gg.attributes.normal.array); });
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const hg = new THREE.SphereGeometry(.12, 6, 4); hg.translate(0, 1.64, 0);
  body = new THREE.InstancedMesh(bg, new THREE.MeshStandardMaterial({roughness: .8}), n); head = new THREE.InstancedMesh(hg, new THREE.MeshStandardMaterial({roughness: .7}), n);
  const C = new THREE.Color(); for (let i = 0; i < n; i++) { body.setColorAt(i, C.set(COL.clothes[i % 10])); head.setColorAt(i, C.set(COL.skins[(i * 7) % 5])); }
  body.frustumCulled = head.frustumCulled = false; G.foule = new THREE.Group(); G.foule.add(body, head); scene.add(G.foule);
  stew = new THREE.InstancedMesh(new THREE.CylinderGeometry(.3, .3, 2, 8).translate(0, 1, 0), new THREE.MeshStandardMaterial({color: 0xFFD100, emissive: 0x6b5a00}), 200); stew.count = 0; G.foule.add(stew);
}
const P = {x: 0, y: 0, z: 0}, M4 = new THREE.Matrix4(), HID = new THREE.Matrix4().makeTranslation(0, -9999, 0), C2 = new THREE.Color();
function draw() {
  const v = sim.view(), n = v.n;
  for (let i = 0; i < n; i++) {
    const s = v.state[i];
    if (s === 5) { body.setMatrixAt(i, HID); head.setMatrixAt(i, HID); continue; }
    world.drawPose(sim, i, P);
    M4.makeTranslation(P.x, P.y, P.z); body.setMatrixAt(i, M4); head.setMatrixAt(i, M4);
    if (s === 2) body.setColorAt(i, HES); else if (s === 3) body.setColorAt(i, QUEUE); else body.setColorAt(i, C2.set(COL.clothes[i % 10]));
  }
  body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true; if (body.instanceColor) body.instanceColor.needsUpdate = true;
  stew.count = sim.stewards.length; sim.stewards.forEach((s, k) => { world.drawPose(sim, s.i, P); M4.makeTranslation(P.x, P.y, P.z); stew.setMatrixAt(k, M4); }); stew.instanceMatrix.needsUpdate = true;
}

// ---------- Tableau de bord minimal ----------
const hud = document.createElement('div');
hud.id = 'fHud'; hud.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);display:flex;gap:14px;align-items:center;background:rgba(250,248,243,.95);border:1px solid #d6d1c6;border-radius:6px;padding:8px 12px;font:500 13px system-ui,sans-serif;color:#1D1F1E;z-index:6';
hud.innerHTML = `<button id="fPlay" style="all:unset;cursor:pointer;background:#1D1F1E;color:#fff;padding:6px 12px;border-radius:4px;font-weight:700">▶ Coup de sifflet</button>
 <span>Vitesse <select id="fSpd"><option value="1">×1</option><option value="4" selected>×4</option><option value="16">×16</option></select></span>
 <button id="fRst" style="all:unset;cursor:pointer;padding:6px 8px;border:1px solid #d6d1c6;border-radius:4px">Recommencer</button>
 <span id="fClock" style="font-variant-numeric:tabular-nums;font-weight:700">22:12:00</span>
 <span>Dans l'Arena <b id="fIn">–</b></span><span>Sortis <b id="fOut">–</b></span><span>Densité max <b id="fDen">–</b> pers./m²</span><span id="fAl" style="color:#E0461F"></span>`;
document.body.appendChild(hud);
const $ = id => document.getElementById(id);
window.ARENA = {get sim() { return sim; }, get world() { return world; }, get playing() { return playing; }, get speed() { return speed; }, toggle() { $('fPlay').click(); }, setSpeed(v) { speed = +v; $('fSpd').value = String(v); }, reset() { $('fRst').click(); }};
const clock = T => { const s = Math.round(22 * 3600 + 12 * 60 + T), h = s / 3600 | 0, m = (s % 3600) / 60 | 0; return [h, m, s % 60].map(v => String(v).padStart(2, '0')).join(':'); };
function counters() { const s = sim.stats || {}; $('fClock').textContent = clock(sim.T); $('fIn').textContent = s.inside ?? '–'; $('fOut').textContent = s.outside ?? '–'; $('fDen').textContent = (sim.curDens || 0).toFixed(1); }
$('fPlay').onclick = () => { playing = !playing; $('fPlay').textContent = playing ? '⏸ Pause' : '▶ Reprendre'; };
$('fSpd').onchange = e => speed = +e.target.value;
$('fRst').onclick = () => { reset(); playing = false; $('fPlay').textContent = '▶ Coup de sifflet'; };

// ---------- Leviers → moteur ----------
const closed = L => !/ouvert|^0 min|inactive|inactif/.test(L.etat);
addEventListener('levier', e => {
  const d = e.detail; if (!sim || !d || !d.levier) return; const L = d.levier, a = d.action;
  let r = null;
  if (['fermer', 'ouvrir', 'arreter', 'activer', 'lever', 'poser', 'deplacer', 'filtrer'].includes(a)) { if (a === 'deplacer' && closed(L)) sim.apply(L, false); r = sim.apply(L, closed(L)); }
  else if (a === 'agent') { const id = sim.addSteward({x: L.x + 1.5, z: L.z + 1.5, level: L.niveau || 0, team: 'PC'}); sim.orderSteward(id, 'hold'); r = {agent: id}; }
  else if (a === 'annonce') { sim.announce('tout', ['metro', 'station'].includes(L.type) ? 'tramEst' : 'tramOuest'); r = {annonce: true}; }
  $('fAl').textContent = r && r.applied === false ? 'Sans effet sur la géométrie du moteur : ' + (r.reason || '') : `${L.code} ${L.nom} : ${L.etat}`;
});

function reset() { sim = new Sim(world, {seed: 22102026, fill: 1}); (SCN.leviers || []).forEach(L => { if (closed(L)) sim.apply(L, true); }); draw(); counters(); window.dispatchEvent(new CustomEvent('arena-reset')); }
function loop(now) {
  if (sim && playing) { acc += Math.min(.1, (now - (loop.t || now)) / 1000) * speed; let k = 0; while (acc >= DT && k < 24) { sim.step(); acc -= DT; k++; } draw(); if (Math.round(sim.T * 10) % 5 === 0) counters(); }
  loop.t = now; requestAnimationFrame(loop);
}
(async function wait() { // attend la vue chargée par index.html ; le moteur lit sa propre copie intacte de scene.json
  if (typeof SCN === 'undefined' || !SCN || !SCN.batiments) return setTimeout(wait, 200);
  const sc = await (await fetch('scene.json')).json(); world = buildWorld(sc); silhouettes(world.seats ? world.seats.length + 400 : 9000); sols();
  reset(); window.dispatchEvent(new CustomEvent('arena-pret')); const base = rebuild; rebuild = function () { base(); if (G.population) G.population.visible = false; }; if (G.population) G.population.visible = false;
  requestAnimationFrame(loop);
})();
