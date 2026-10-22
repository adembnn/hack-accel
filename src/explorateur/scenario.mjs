// Contraintes imposées (le directeur ne les règle pas) et leurs variantes incertaines, pour le Forum des Halles.
// Repère du moteur : mètres, x vers l'est, z vers le sud, origine au centre du Forum.
// Hypothèses (H) signalées : trajets et vitesse de la manifestation, rayons d'évitement et de blocage.

// Deux trajets plausibles de cortège (H) : par l'est (boulevard de Sébastopol puis rue Rambuteau) ou par l'ouest (rue Berger).
export const TRAJETS = {
  est: { nom: 'par l’est (Sébastopol, Rambuteau)', points: [[260, -60], [120, -70], [10, -75], [40, 40]] },
  ouest: { nom: 'par l’ouest (rue Berger)', points: [[-330, 60], [-180, 55], [-60, 70], [-40, 170]] },
};

export const IMPOSEES = {
  nom: 'Soir du 19 oct. : stations du Forum fermées par la police, manifestation qui approche',
  stations_fermees: true, // C1 : les quais RER et métro ne servent plus de sortie
  duree_s: 600, // horizon : les « non sortis » se comptent à 10 min
  population: 3200,
};

// 8 variantes = taille (500 ou 3 000) × heure d'arrivée (prévue ou 20 min plus tôt) × trajet (est ou ouest).
// Une manif plus grosse s'évite de plus loin (120 m au lieu de 60) et bloque les portes à moins de 40 m (D2, troubles).
export function variantes() {
  const v = [];
  for (const taille of [500, 3000]) for (const avance of [false, true]) for (const trajet of ['est', 'ouest'])
    v.push({ id: `${trajet}-${taille}-${avance ? 'tot' : 'prevue'}`, trajet, taille, avance,
      rayon_evite: taille >= 3000 ? 120 : 60, rayon_bloque: taille >= 3000 ? 40 : 0,
      // « prévue » : le cortège atteint le Forum vers T = 300 s ; « 20 min plus tôt » : il y est dès l'alerte.
      depart_s: avance ? -400 : -100, vitesse: 0.8 });
  return v;
}

// Position du cortège à l'instant T (interpolation le long du trajet), ou null avant son départ.
export function positionCortege(variante, T) {
  const pts = TRAJETS[variante.trajet].points;
  let reste = (T - variante.depart_s) * variante.vitesse;
  if (reste < 0) return null;
  for (let i = 1; i < pts.length; i++) {
    const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], L = Math.hypot(x1 - x0, z1 - z0);
    if (reste <= L) return [x0 + (x1 - x0) * reste / L, z0 + (z1 - z0) * reste / L];
    reste -= L;
  }
  return pts[pts.length - 1];
}
