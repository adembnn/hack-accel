import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// La page d'accueil est dans src/app/ (dossier du lot socle) : Vite part de là, la sortie va dans dist/ à la racine.
export default defineConfig({
  root: 'src/app',
  build: { outDir: '../../dist', emptyOutDir: true },
  server: { port: 5173 },
  // dir : les tests des lots (src/sim/...) sont cherchés dans tout src/, pas seulement sous la racine src/app.
  test: { include: ['**/*.test.ts'], dir: fileURLToPath(new URL('./src', import.meta.url)) },
});
