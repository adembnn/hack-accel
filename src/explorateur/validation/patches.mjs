// Modifications recommandées pour sim.js. Elles sont appliquées à une COPIE du texte en mémoire (jamais au fichier) par `valider.mjs --reco`.
// Chaque entrée : [texte exact de sim.js, remplacement]. Le pas de temps (dt) est une recommandation pour l'appelant, pas un patch.
const ANISO = ['.3+.7*(1+cos)/2', 'd<.6?1:.5+.50*(1+cos)/2'];
// Vitesse désirée = v0 x Weidmann(densité locale), plancher 0,4, sauf à moins de 6 m d'une sortie (là, c'est le contact qui fixe le débit des goulots).
const VITESSE = [
  "const vd=SIM.mode==='calme'?a.v0*.7:a.v0;",
  "const vd=SIM.mode==='calme'?a.v0*.7:a.v0*((a.t>=0&&SIM.F[a.t]&&SIM.F[a.t][simCell(a)]<6)?1:Math.max(.4,1-Math.exp(-1.913*(1/Math.max(.3,(a.dens+1)/4.01)-1/5.4))));",
];
const LATERAL = [
  'ax+=F*nx;az+=F*nz;}}',
  'ax+=F*nx;az+=F*nz;if(cos>.5&&b.vx*ex+b.vz*ez<-.3){const q=2*Math.exp(-(d-2*R)/.5);ax+=q*ez;az+=-q*ex;}}}',
];
export const RECO = {
  resume: 'dt 0,05 s ; répulsion symétrique au contact (d < 0,6 m) puis anisotropie 0,5 ; vitesse désirée de Weidmann selon la densité locale ; évitement latéral des sens opposés',
  dt: 0.05,
  patches: [ANISO, VITESSE, LATERAL],
};
