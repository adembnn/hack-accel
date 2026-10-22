import { defineConfig } from 'vitest/config';

// La page d'accueil est dans src/app/ (dossier du lot socle) : Vite part de là, la sortie va dans dist/ à la racine.
export default defineConfig({
  root: 'src/app',
  build: { outDir: '../../dist', emptyOutDir: true },
  server: { port: 5173 },
  test: { include: ['**/*.test.ts'] },
});
