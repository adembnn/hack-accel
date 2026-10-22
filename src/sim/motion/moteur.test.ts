import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { creerMoteur, hasard } from './index';
import type { Moteur } from './index';
import { navgridSynthetique, sceneSynthetique } from './navgrid-synthetique';

const POPULATION = 300;
const DT = 0.1;
const SIM_JS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'reports', 'maquettes', 'chatelet-3d', 'sim.js');

function jouer(graine: number, avant: (m: Moteur) => void = () => {}, duree = 300, calme = 0): Moteur {
  const m = creerMoteur(navgridSynthetique(), { graine });
  avant(m);
  m.spawn(POPULATION, sceneSynthetique());
  for (let i = 0; i < calme / DT; i++) m.pas(DT);
  m.alerte();
  for (let i = 0; i < duree / DT; i++) m.pas(DT);
  return m;
}

// Le sim.js d'origine, chargé tel quel dans un bac à sable comme le fait l'explorateur, avec le même hasard à graine.
type Origine = { SIM: Record<string, any>; spawn: Function; alerte: Function; pas: Function; champ: Function }; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type
async function origine(graine: number): Promise<Origine> {
  const navgrid = navgridSynthetique();
  const aides = `
function pairs(p){const a=[];for(let i=0;i<p.length;i+=2)a.push([p[i],p[i+1]]);if(a.length>1&&a[0][0]===a[a.length-1][0]&&a[0][1]===a[a.length-1][1])a.pop();return a;}
function pip(px,pz,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,zi]=pts[i],[xj,zj]=pts[j];if((zi>pz)!==(zj>pz)&&px<(xj-xi)*(pz-zi)/(zj-zi)+xi)c=!c;}return c;}
`;
  const ctx = vm.createContext({
    SCN: sceneSynthetique(),
    atob: (s: string) => Buffer.from(s, 'base64').toString('latin1'),
    fetch: async () => ({ json: async () => navgrid }),
    setTimeout, console,
    __rng: hasard(graine),
  });
  vm.runInContext(`Math.random=__rng;${aides}${readFileSync(SIM_JS, 'utf8')}\n;globalThis.__SIM=SIM;`, ctx, { filename: 'sim.js' });
  await vm.runInContext('simLoad()', ctx);
  const fn = (nom: string) => vm.runInContext(nom, ctx);
  return { SIM: ctx.__SIM, spawn: fn('simSpawn'), alerte: fn('simAlert'), pas: fn('simStep'), champ: fn('simField') };
}

describe('moteur de foule', () => {
  it('même graine, même résultat ; autre graine, autre résultat', () => {
    const a = jouer(7), b = jouer(7), c = jouer(8);
    expect(a.etat()).toEqual(b.etat());
    expect(a.A?.map((p) => [p.x, p.z, p.out])).toEqual(b.A?.map((p) => [p.x, p.z, p.out]));
    expect(c.A?.map((p) => [p.x, p.z])).not.toEqual(a.A?.map((p) => [p.x, p.z]));
    expect(a.etat().out).toBeGreaterThan(0);
  });

  it('personne dans une case non praticable pendant tout le run', () => {
    const m = creerMoteur(navgridSynthetique(), { graine: 3 });
    m.spawn(POPULATION, sceneSynthetique());
    m.alerte();
    let pires = 0;
    for (let i = 0; i < 3000; i++) {
      m.pas(DT);
      if (i % 10 === 0) pires = Math.max(pires, m.etat().dansMur);
    }
    expect(pires).toBe(0);
    expect(m.etat().out).toBeGreaterThan(100);
  });

  it('une sortie fermée ne reçoit aucun passage, les autres si', () => {
    const m = jouer(5, (e) => { e.groups[0].open = false; e.champs(); });
    const etat = m.etat();
    expect(etat.outBy['Porte Nord'] ?? 0).toBe(0);
    expect((etat.outBy['Rambuteau'] ?? 0) + (etat.outBy['Porte Est'] ?? 0)).toBeGreaterThan(50);
  });

  it('setIntention : la sortie visée est suivie', () => {
    const m = creerMoteur(navgridSynthetique(), { graine: 11 });
    m.spawn(POPULATION, sceneSynthetique());
    const ids = m.A!.map((_, i) => i).filter((i) => m.A![i].l === 0).slice(0, 15);
    ids.forEach((i) => m.setIntention(i, { sortie_cible: 'Porte Est' }));
    m.alerte();
    for (let i = 0; i < 3000; i++) m.pas(DT);
    const sortis = ids.filter((i) => m.A![i].out);
    expect(sortis.length).toBeGreaterThan(0);
    expect(m.etat().outBy['Porte Est']).toBeGreaterThanOrEqual(sortis.length);
  });

  it('équivalent à sim.js d\'origine : sortis à 300 s identiques (écart max 2 %)', async () => {
    for (const [graine, fermer] of [[1, -1], [2, 1]] as const) {
      const o = await origine(graine);
      if (fermer >= 0) { o.SIM.groups[fermer].open = false; o.champ(fermer); }
      o.spawn(POPULATION);
      for (let i = 0; i < 100; i++) o.pas(DT);
      o.alerte();
      for (let i = 0; i < 3000; i++) o.pas(DT);

      const m = creerMoteur(navgridSynthetique(), { graine });
      if (fermer >= 0) { m.groups[fermer].open = false; m.champ(fermer); }
      m.spawn(POPULATION, sceneSynthetique());
      for (let i = 0; i < 100; i++) m.pas(DT);
      m.alerte();
      for (let i = 0; i < 3000; i++) m.pas(DT);

      const sortisO = o.SIM.out as number;
      expect(sortisO).toBeGreaterThan(50);
      expect(Math.abs(m.out - sortisO) / sortisO).toBeLessThanOrEqual(0.02);
      // en pratique : bit à bit, grâce au même ordre des tirages
      expect(m.out).toBe(sortisO);
      expect(m.outBy).toEqual(o.SIM.outBy);
      expect(m.T).toBeCloseTo(o.SIM.T, 9);
      expect(m.expo).toBe(o.SIM.expo);
      expect(m.dmax).toBe(o.SIM.dmax);
      const A = o.SIM.A as { x: number; z: number; l: number; out: boolean }[];
      expect(m.A!.map((p) => [p.l, p.x, p.z, p.out])).toEqual(A.map((p) => [p.l, p.x, p.z, p.out]));
    }
  }, 120_000);
});
