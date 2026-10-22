// Contraintes imposées (le directeur ne les règle pas) et leurs variantes incertaines, pour le Forum des Halles.
// Chaque variante cumule de nombreuses perturbations tirées du catalogue de l'équipe (reports/catalogue-perturbations.md) :
// cortèges (D1), troubles (D2), colis suspect (D5), incendie voisin (D7), travaux de voirie (D9), issues bloquées (B1),
// escalators arrêtés (B3), ascenseurs en panne (B5), éclairage coupé (B6), fumée qui s'étend (B8), sol glissant (B9),
// panique (A5), rumeur (A6), personnes à mobilité réduite (E2), groupes agités (E6), information tardive (F1),
// consigne contradictoire (F4).
// Repère du moteur : mètres, x vers l'est, z vers le sud, origine au centre du Forum.
// Hypothèses (H) : trajets et vitesse des cortèges, rayons, effets chiffrés de chaque perturbation (voir EFFETS).
import { hasard } from './hasard.mjs';

export const TRAJETS = {
  est: { nom: 'par l’est (Sébastopol, Rambuteau)', points: [[260, -60], [120, -70], [10, -75], [40, 40]] },
  ouest: { nom: 'par l’ouest (rue Berger)', points: [[-330, 60], [-180, 55], [-60, 70], [-40, 170]] },
  nord: { nom: 'par le nord (Turbigo, Montmartre)', points: [[-40, -330], [-60, -200], [-100, -110], [-200, -60]] },
  sud: { nom: 'par le sud (Rivoli, Pont-Neuf)', points: [[-120, 330], [-130, 200], [-131, 60], [57, 41]] },
};
// Lieux de rue autour du Forum (H), près des portes
export const LIEUX = {
  lescot: { nom: 'porte Lescot', x: 57, z: 41 }, louvre: { nom: 'porte du Louvre', x: -225, z: -47 }, berger: { nom: 'rue Berger', x: -44, z: 75 },
  rambuteau: { nom: 'rue Rambuteau', x: 4, z: -75 }, pontneuf: { nom: 'porte du Pont-Neuf', x: -131, z: 39 }, jour: { nom: 'rue du Jour', x: -230, z: -130 },
  eustache: { nom: 'Saint-Eustache', x: -102, z: -105 }, navarre: { nom: 'rue Marguerite de Navarre', x: -43, z: 177 },
};

export const IMPOSEES = {
  nom: 'Soir du 19 oct. : stations du Forum fermées par la police, manifestations et incidents en série autour et dans le Forum',
  stations_fermees: true, // C1
  duree_s: 600, // les « non sortis » se comptent à 10 min
  population: 3200,
};

// Effets chiffrés (H, à caler) : multiplicateurs de vitesse, parts de la foule, délais
export const EFFETS = { eclairage: 0.6, glissant: 0.7, pmr_v0: 0.5, agites_v0: 1.2, agites_suivisme: 2, panique_v0: 1.3, escalator_arrete_debit: 0.9 };

const nomLieu = (k) => LIEUX[k].nom;
const TIRAGES = {
  cortege: (r, pick) => { const taille = pick([300, 800, 1500, 3000, 6000]); const trajet = pick(Object.keys(TRAJETS)); const avance = r() < 0.5;
    return { code: 'D1', type: 'cortege', trajet, taille, avance, rayon_evite: 50 + taille / 40, rayon_bloque: taille >= 3000 ? 40 : 0, depart_s: avance ? -400 : -100 - r() * 200, vitesse: 0.6 + r() * 0.4,
      nom: `manif ${taille} pers. ${TRAJETS[trajet].nom.split(' (')[0]}${avance ? ', en avance' : ''}` }; },
  troubles: (r, pick) => { const l = pick(Object.keys(LIEUX)); return { code: 'D2', type: 'zone', ...LIEUX[l], rayon_evite: 70, rayon_bloque: 30, debut_s: Math.round(r() * 300), nom: `troubles ${nomLieu(l)}` }; },
  colis: (r, pick) => { const l = pick(Object.keys(LIEUX)); return { code: 'D5', type: 'zone', ...LIEUX[l], rayon_evite: 80, rayon_bloque: 50, debut_s: Math.round(r() * 400), nom: `colis suspect ${nomLieu(l)}` }; },
  incendie: (r, pick) => { const l = pick(Object.keys(LIEUX)); return { code: 'D7', type: 'zone', ...LIEUX[l], rayon_evite: 120, rayon_bloque: 60, debut_s: Math.round(r() * 300), nom: `incendie voisin ${nomLieu(l)}` }; },
  travaux: (r, pick) => { const l = pick(Object.keys(LIEUX)); return { code: 'D9', type: 'zone', ...LIEUX[l], rayon_evite: 25, rayon_bloque: 15, debut_s: 0, nom: `travaux de voirie ${nomLieu(l)}` }; },
  fumee: (r, pick) => { const l = pick(Object.keys(LIEUX)); return { code: 'B8', type: 'zone', ...LIEUX[l], x: LIEUX[l].x + (r() - 0.5) * 40, rayon_evite: 20, rayon_bloque: 10, croissance: 0.15 + r() * 0.2, debut_s: Math.round(r() * 300), nom: `fumée qui s'étend près de ${nomLieu(l)}` }; },
  issues: (r) => ({ code: 'B1', type: 'issues', n: 1 + ((r() * 3) | 0), graine: (r() * 1e9) | 0, nom: '' }),
  escalators: (r) => ({ code: 'B3', type: 'escalators', part: 0.15 + r() * 0.35, graine: (r() * 1e9) | 0, nom: '' }),
  ascenseurs: (r) => ({ code: 'B5', type: 'ascenseurs', part: 0.3 + r() * 0.7, graine: (r() * 1e9) | 0, nom: '' }),
  eclairage: (r) => ({ code: 'B6', type: 'lent', effet: EFFETS.eclairage, rayon: 30 + r() * 30, debut_s: Math.round(r() * 200), graine: (r() * 1e9) | 0, nom: 'éclairage coupé dans une galerie' }),
  glissant: (r) => ({ code: 'B9', type: 'lent', effet: EFFETS.glissant, rayon: 10 + r() * 15, debut_s: 0, graine: (r() * 1e9) | 0, nom: 'sol glissant ou obstacle' }),
  panique: (r) => ({ code: 'A5', type: 'panique', rayon: 25 + r() * 25, debut_s: 60 + Math.round(r() * 300), graine: (r() * 1e9) | 0, nom: 'mouvement de panique' }),
  rumeur: (r) => ({ code: 'A6', type: 'rumeur', part: 0.1 + r() * 0.25, debut_s: 30 + Math.round(r() * 200), graine: (r() * 1e9) | 0, nom: '' }),
  pmr: (r) => ({ code: 'E2', type: 'profil', profil: 'pmr', part: 0.03 + r() * 0.07, graine: (r() * 1e9) | 0, nom: '' }),
  agites: (r) => ({ code: 'E6', type: 'profil', profil: 'agites', part: 0.05 + r() * 0.15, graine: (r() * 1e9) | 0, nom: '' }),
  tardive: (r) => ({ code: 'F1', type: 'tardive', retard_s: 60 + Math.round(r() * 180), nom: '' }),
  contradictoire: (r) => ({ code: 'F4', type: 'contradictoire', debut_s: 60 + Math.round(r() * 200), graine: (r() * 1e9) | 0, nom: 'annonce contradictoire vers une porte côté manif' }),
};
const nomEv = (e) => e.nom || ({
  B1: `${e.n} issue(s) de secours condamnée(s)`, B3: `${Math.round(e.part * 100)} % des escalators arrêtés`, B5: `${Math.round(e.part * 100)} % des ascenseurs en panne`,
  A6: `rumeur : ${Math.round(e.part * 100)} % de la foule change de sortie`, E2: `${Math.round(e.part * 100)} % de personnes à mobilité réduite`,
  E6: `${Math.round(e.part * 100)} % de groupes agités`, F1: `information retardée de ${e.retard_s} s`,
}[e.code]);

// n variantes, chacune avec 6 à 14 perturbations simultanées (au moins un cortège), reproductibles par graine.
export function variantes(n = 8, graine = 2210) {
  const V = [];
  for (let v = 0; v < n; v++) {
    const r = hasard(graine + v * 101), pick = (a) => a[(r() * a.length) | 0];
    const k = 6 + ((r() * 9) | 0), types = Object.keys(TIRAGES), evs = [TIRAGES.cortege(r, pick)];
    const UNIQUES = { tardive: 'F1', pmr: 'E2', agites: 'E6', escalators: 'B3', ascenseurs: 'B5' };
    while (evs.length < k) { const t = pick(types); if (UNIQUES[t] && evs.some((e) => e.code === UNIQUES[t])) continue; const e = TIRAGES[t](r, pick); if (e.nom && evs.some((x) => x.nom === e.nom)) continue; evs.push(e); }
    evs.forEach((e) => { e.nom = nomEv(e); });
    V.push({ id: `V${v + 1}`, evenements: evs, nom: `${evs.length} perturbations : ${evs.map((e) => `${e.code} ${e.nom}`).join(' ; ')}` });
  }
  return V;
}

export function positionCortege(e, T) {
  const pts = TRAJETS[e.trajet].points;
  let reste = (T - e.depart_s) * e.vitesse;
  if (reste < 0) return null;
  for (let i = 1; i < pts.length; i++) {
    const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], L = Math.hypot(x1 - x0, z1 - z0);
    if (reste <= L) return [x0 + (x1 - x0) * reste / L, z0 + (z1 - z0) * reste / L];
    reste -= L;
  }
  return pts[pts.length - 1];
}

// Zones de rue actives à l'instant T (à éviter, et à bloquer si rayon_bloque) : [{x, z, rayon_evite, rayon_bloque, ev}]
export function zonesActives(variante, T) {
  if (!variante) return [];
  return variante.evenements.flatMap((e) => {
    if (e.type === 'cortege') { const c = positionCortege(e, T); return c ? [{ x: c[0], z: c[1], rayon_evite: e.rayon_evite, rayon_bloque: e.rayon_bloque, ev: e }] : []; }
    if (e.type === 'zone' && T >= e.debut_s) { const g = e.croissance ? e.croissance * (T - e.debut_s) : 0; return [{ x: e.x, z: e.z, rayon_evite: e.rayon_evite + g, rayon_bloque: e.rayon_bloque + g, ev: e }]; }
    return [];
  });
}
