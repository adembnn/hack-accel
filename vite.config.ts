import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173 },
  test: { include: ['src/**/*.test.ts'] },
});
