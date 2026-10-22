// Modifications recommandées pour sim.js, essayées par `valider.mjs --reco=NOM`. Elles sont appliquées à une COPIE du texte
// de sim.js en mémoire (jamais au fichier). Chaque patch : [texte exact de sim.js, remplacement].
// Le pas de temps (dt) est une recommandation pour l'appelant (index.html appelle simStep(.1)), pas un patch.

// Anisotropie de la répulsion : poids .3 (derrière) à 1 (devant). Non réciproque => une file compacte est freinée par ceux de devant
// plus qu'elle n'est poussée par ceux de derrière : effondrement du flux dès 2 p/m2. Option 1 : .75 ; option 2 : réciproque au contact seulement.
export const ANISO75 = ['.3+.7*(1+cos)/2', '.75+.25*(1+cos)/2'];
export const ANISO_CONTACT = ['.3+.7*(1+cos)/2', 'd<.6?1:.3+.7*(1+cos)/2'];

// Évitement latéral des marcheurs qui arrivent en sens inverse (poussée vers la droite du cap, 2 m/s2, portée 0,5 m).
export const LATERAL = [
  'ax+=F*nx;az+=F*nz;}}',
  'ax+=F*nx;az+=F*nz;if(cos>.5&&b.vx*ex+b.vz*ez<-.3){const q=2*Math.exp(-(d-2*R)/.5);ax+=q*ez;az+=-q*ex;}}}',
];

// Vitesse désirée = v0 x Weidmann(densité locale estimée par a.dens), plancher 0,4, sauf à moins de 6 cases d'une sortie.
export const VITESSE = [
  "const vd=SIM.mode==='calme'?a.v0*.7:a.v0;",
  "const vd=SIM.mode==='calme'?a.v0*.7:a.v0*((a.t>=0&&SIM.F[a.t]&&SIM.F[a.t][simCell(a)]<6)?1:Math.max(.4,1-Math.exp(-1.913*(1/Math.max(.3,(a.dens+1)/4.01)-1/5.4))));",
];

export const CONFIGS = {
  K1: { resume: 'dt 0,05 s + évitement latéral', dt: 0.05, patches: [LATERAL] },
  K2: { resume: 'dt 0,05 s + évitement latéral + anisotropie 0,75', dt: 0.05, patches: [ANISO75, LATERAL] },
  K3: { resume: 'dt 0,05 s + évitement latéral + anisotropie 0,75 + vitesse de Weidmann', dt: 0.05, patches: [ANISO75, VITESSE, LATERAL] },
  K4: { resume: 'dt 0,05 s + évitement latéral + répulsion réciproque au contact', dt: 0.05, patches: [ANISO_CONTACT, LATERAL] },
};
export const DEFAUT = 'K1';
