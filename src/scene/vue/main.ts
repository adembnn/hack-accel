// Point d'entrée de la page : charge scene.json, navgrid.json et acces-forum.json (bundlés par Vite, aucun réseau) puis démarre la vue.
import sceneJson from '../scene.json';
import navgridJson from '../navgrid.json?raw';
import acces from '../acces-forum.json';
import { lireNavgrid } from '../navgrid.ts';
import type { Scene } from '../types.ts';
import type { AccesForum } from '../leviers.ts';
import { demarrer } from './vue.ts';

const hote = document.getElementById('view')!;
try {
  const v = demarrer({ scene: sceneJson as unknown as Scene, navgrid: lireNavgrid(navgridJson), acces: acces as AccesForum[], hote });
  document.getElementById('load')!.remove();
  document.getElementById('foot')!.insertAdjacentText('afterbegin', `${v.stats.batiments} bâtiments · ${v.stats.rues} rues · ${v.stats.leviers} leviers · `);
} catch (e) {
  document.getElementById('load')!.textContent = 'Erreur : ' + String(e);
  throw e;
}
