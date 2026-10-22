import { describe, expect, it } from 'vitest';
import { BASELINE, TITRE } from './accueil';

describe('accueil', () => {
  it('porte le nom Refuge et une baseline', () => {
    expect(TITRE).toBe('Refuge');
    expect(BASELINE.length).toBeGreaterThan(10);
  });
});
