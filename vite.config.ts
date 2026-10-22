import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// La page d'accueil est dans src/app/ (dossier du lot socle) : Vite part de là, la sortie va dans dist/ à la racine.
export default defineConfig({
  root: 'src/app',
  build: { outDir: '../../dist', emptyOutDir: true },
  server: { port: 5173 },
  // dir : les tests des lots (src/sim/...) sont cherchés dans tout src/, pas seulement sous la racine src/app.
  // Les tests de src/sim/behavior, src/sim/metrics (lot #9) et src/sim/optim (lot #41) tournent avec node --test (npm run test:behavior) : vitest les ignore.
  test: { include: ['**/*.test.ts'], exclude: ['**/node_modules/**', 'sim/behavior/**', 'sim/metrics/**', 'sim/optim/**'], dir: fileURLToPath(new URL('./src', import.meta.url)) },
});
