import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/** An app's test project: its own files, with `@` pointing at its own src. */
const app = (name: 'citizen' | 'admin') => ({
  extends: true as const,
  test: { name, include: [`apps/${name}/src/**/*.test.ts`] },
  resolve: {
    alias: { '@': fileURLToPath(new URL(`./apps/${name}/src`, import.meta.url)) },
  },
});

export default defineConfig({
  test: {
    environment: 'node',
    projects: [
      app('citizen'),
      app('admin'),
      { extends: true, test: { name: 'packages', include: ['packages/*/src/**/*.test.ts'] } },
    ],
  },
});
