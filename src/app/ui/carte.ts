// Plan schématique en canvas 2D. Les densités et flux des sorties viennent du fichier de résultats, rien n'est inventé ici.
import { niveauDensite, type Lieu, type Perturbation, type Sortie } from './logique.mjs';
import { EMPREINTE, LIEUX, RUES } from './lieux';

export type ModeVue = 'foule' | 'densite' | 'flux';
export interface EtatCarte {
  mode: ModeVue;
  sorties: ReadonlyArray<Sortie>;
  perturbations: ReadonlyArray<Perturbation>;
  calques: { sorties: boolean; rues: boolean };
  interieurEstime: boolean;
}

const COULEURS = { fond: '#15181b', rue: '#2c3238', texte: '#9aa2a9', clair: '#e6e8ea', rouge: '#ff4d4f', ambre: '#f5b83d', gris: '#6c747b' };
const RAYON_ZONE: Record<string, number> = { D1: 0.085, D2: 0.06, D5: 0.04 };

export function dessiner(canvas: HTMLCanvasElement, e: EtatCarte): void {
  const dpr = window.devicePixelRatio || 1;
  const L = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (canvas.width !== Math.round(L * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(L * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COULEURS.fond;
  ctx.fillRect(0, 0, L, H);
  // le plan garde le rapport 16/10 et se centre
  const w = Math.min(L, H * 1.6);
  const h = w / 1.6;
  const ox = (L - w) / 2;
  const oy = (H - h) / 2;
  const X = (x: number) => ox + x * w;
  const Y = (y: number) => oy + y * h;

  if (e.calques.rues) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = COULEURS.rue;
    ctx.lineWidth = Math.max(10, w * 0.022);
    for (const r of RUES) {
      ctx.beginPath();
      r.pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
      ctx.stroke();
    }
    ctx.fillStyle = COULEURS.gris;
    ctx.font = `500 ${Math.max(10, w * 0.011)}px system-ui, sans-serif`;
    for (const r of RUES) ctx.fillText(r.nom, X(r.label[0]), Y(r.label[1]));
  }

  ctx.fillStyle = '#20252a';
  ctx.strokeStyle = e.interieurEstime ? COULEURS.gris : COULEURS.texte;
  ctx.setLineDash(e.interieurEstime ? [6, 5] : []);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(X(EMPREINTE.x), Y(EMPREINTE.y), EMPREINTE.w * w, EMPREINTE.h * h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COULEURS.gris;
  ctx.font = `600 ${Math.max(10, w * 0.011)}px system-ui, sans-serif`;
  ctx.fillText(e.interieurEstime ? 'Forum des Halles · intérieur estimé' : 'Forum des Halles', X(EMPREINTE.x) + 10, Y(EMPREINTE.y) + 18);

  // zones D1 / D2 / D5
  for (const p of e.perturbations) {
    if (p.x === undefined || p.y === undefined || !(p.code in RAYON_ZONE)) continue;
    const r = RAYON_ZONE[p.code]! * w;
    ctx.save();
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,77,79,.12)';
    ctx.fillRect(X(p.x) - r, Y(p.y) - r, r * 2, r * 2);
    ctx.strokeStyle = 'rgba(255,77,79,.45)';
    ctx.lineWidth = 2;
    for (let k = -r * 2; k < r * 2; k += 12) {
      ctx.beginPath();
      ctx.moveTo(X(p.x) + k, Y(p.y) - r);
      ctx.lineTo(X(p.x) + k + r * 2, Y(p.y) + r);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = COULEURS.rouge;
    ctx.setLineDash([7, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COULEURS.rouge;
    ctx.font = `700 ${Math.max(10, w * 0.0105)}px system-ui, sans-serif`;
    ctx.fillText(`${p.nom.toUpperCase()} · ${p.code}`, X(p.x) - r * 0.8, Y(p.y) - r - 6);
  }

  if (!e.calques.sorties) return;
  const ferme = new Set(e.perturbations.map((p) => p.lieuId).filter(Boolean));
  const parId = new Map(e.sorties.map((s) => [s.id, s]));
  const centre = { x: X(EMPREINTE.x + EMPREINTE.w / 2), y: Y(EMPREINTE.y + EMPREINTE.h / 2) };
  for (const l of LIEUX) {
    const s = parId.get(l.id);
    const clos = ferme.has(l.id);
    if (e.mode === 'flux' && s && !clos) flecheFlux(ctx, centre, X(l.x), Y(l.y), s.flux, niveauDensite(s.densite));
  }
  for (const l of LIEUX) pastille(ctx, l, X(l.x), Y(l.y), w, parId.get(l.id), ferme.has(l.id), e.mode);
}

function flecheFlux(ctx: CanvasRenderingContext2D, de: { x: number; y: number }, ax: number, ay: number, flux: number, niv: string) {
  ctx.strokeStyle = niv === 'rouge' ? COULEURS.rouge : niv === 'orange' ? COULEURS.ambre : 'rgba(230,232,234,.45)';
  ctx.lineWidth = Math.max(1, flux * 3);
  ctx.beginPath();
  ctx.moveTo(de.x, de.y);
  ctx.lineTo(ax, ay);
  ctx.stroke();
}

function pastille(ctx: CanvasRenderingContext2D, l: Lieu, x: number, y: number, w: number, s: Sortie | undefined, clos: boolean, mode: ModeVue) {
  const niv = s ? niveauDensite(s.densite) : 'normal';
  const couleur = clos ? COULEURS.rouge : niv === 'rouge' ? COULEURS.rouge : niv === 'orange' ? COULEURS.ambre : COULEURS.clair;
  const r = Math.max(5, w * 0.0075);
  ctx.fillStyle = clos ? '#2b1618' : '#1f2225';
  ctx.strokeStyle = couleur;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (l.type === 'bouche') ctx.rect(x - r, y - r, r * 2, r * 2);
  else ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (clos) {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y - r * 0.6);
    ctx.lineTo(x + r * 0.6, y + r * 0.6);
    ctx.moveTo(x + r * 0.6, y - r * 0.6);
    ctx.lineTo(x - r * 0.6, y + r * 0.6);
    ctx.stroke();
  }
  const detail = !s || clos ? '' : mode === 'densite' || mode === 'foule' ? ` · ${String(s.densite).replace('.', ',')}/m²` : ` · ${String(s.flux).replace('.', ',')} p/s/m`;
  ctx.font = `600 ${Math.max(10, w * 0.0105)}px system-ui, sans-serif`;
  const txt = `${l.nom}${detail}`;
  const tw = ctx.measureText(txt).width;
  ctx.fillStyle = 'rgba(21,24,27,.85)';
  ctx.fillRect(x + r + 3, y - 9, tw + 8, 18);
  ctx.fillStyle = couleur;
  ctx.fillText(txt, x + r + 7, y + 4);
}

/** Convertit un clic (px écran) en coordonnées normalisées du plan, avec la même géométrie que dessiner(). */
export function normaliser(canvas: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } | null {
  const r = canvas.getBoundingClientRect();
  const w = Math.min(r.width, r.height * 1.6);
  const h = w / 1.6;
  const x = (clientX - r.left - (r.width - w) / 2) / w;
  const y = (clientY - r.top - (r.height - h) / 2) / h;
  return x < 0 || x > 1 || y < 0 || y > 1 ? null : { x, y };
}
