// Génère resultats.exemple.json : un rejeu ILLUSTRATIF (source "exemple") pour l'écran de démo.
// Les positions sont tirées au hasard (graine fixe) sur des polygones réels de scene.json et glissent vers la sortie de rue la plus proche ;
// ce n'est PAS une simulation. Les métriques sont des valeurs de remplissage rondes, à remplacer par la sortie du vrai moteur.
// Usage : node src/app/ui/generer-exemple.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const scene = JSON.parse(readFileSync(new URL('../../scene/scene.json', import.meta.url), 'utf8'));
let graine = 42;
const alea = () => ((graine = (graine * 1664525 + 1013904223) % 4294967296) / 4294967296);

const zones = scene.interieur.filter((o) => o.l.length === 1 && o.l[0] >= -1 && Math.hypot(o.p[0], o.p[1]) < 160);
const sorties = scene.sorties.filter((s) => s.genre === 'rue' && s.niveau === 0 && Math.hypot(s.x, s.z) < 260);
const pts = [];
for (let i = 0; i < 90; i++) {
  const z = zones[Math.floor(alea() * zones.length)];
  const k = Math.floor(alea() * (z.p.length / 2)) * 2;
  const x = z.p[k], y = z.p[k + 1], n = z.l[0];
  const s = sorties.reduce((a, b) => (Math.hypot(a.x - x, a.z - y) < Math.hypot(b.x - x, b.z - y) ? a : b));
  pts.push({ x, y, n, s, d: 6 + Math.floor(alea() * 6) }); // d = trame à laquelle le point atteint la sortie
}
const NB = 14;
const serie = [];
for (let t = 0; t < NB; t++) {
  const points = [];
  for (const p of pts) {
    if (t >= p.d) continue;
    const a = t / p.d;
    points.push([Math.round(p.x + (p.s.x - p.x) * a), Math.round(p.y + (p.s.z - p.y) * a), a < 0.5 ? p.n : 0]);
  }
  const tension = Math.round(Math.min(1, 0.15 + 0.85 * Math.sin((t / (NB - 1)) * Math.PI) ** 1.5) * 100) / 100;
  serie.push({ t_s: t * 30, tension, points });
}
const sortie = {
  source: 'exemple',
  rejeu: true,
  titre: 'Exemple illustratif : sortie du cinéma, un plan comparé à l\'absence de plan',
  _note: 'Fichier de démonstration du format. Valeurs de remplissage, pas un résultat de simulation. Remplacer par la sortie du moteur (champ source: "simulation").',
  duree_s: serie[NB - 1].t_s,
  metriques: [
    { cle: 'evacues_pct', libelle: 'Évacués', unite: '%', avant: 70, apres: 90, sens: 'haut_mieux' },
    { cle: 'temps_s', libelle: 'Temps de sortie', unite: 's', avant: 600, apres: 420, sens: 'bas_mieux' },
    { cle: 'pers_min_dense', libelle: 'Personnes-minutes > 5 p/m²', unite: '', avant: 300, apres: 100, sens: 'bas_mieux' },
    { cle: 'en_zone_danger', libelle: 'Sortis en zone de danger', unite: '', avant: 40, apres: 0, sens: 'bas_mieux' },
  ],
  serie,
  alertes: [
    { t_s: 60, niveau: 'info', texte: 'Annonce diffusée (exemple)' },
    { t_s: 120, niveau: 'alerte', texte: 'Densité élevée près d\'une sortie (exemple)' },
    { t_s: 240, niveau: 'critique', texte: 'Pic de tension (exemple)' },
    { t_s: 360, niveau: 'info', texte: 'Évacuation en cours de résorption (exemple)' },
  ],
};
writeFileSync(new URL('./resultats.exemple.json', import.meta.url), JSON.stringify(sortie, null, 1));
console.log('écrit : resultats.exemple.json,', serie.length, 'trames');
