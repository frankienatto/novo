import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
      },
    })
  )
);
