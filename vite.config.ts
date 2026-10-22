import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173 },
  // Les tests des lots (scene, sim, agents, integration) utilisent node:test : ils tournent via `npm run test:lots`, pas sous vitest.
  test: { include: ['src/app/**/*.test.ts'] },
});
