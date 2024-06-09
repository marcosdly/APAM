/// <reference types="vitest" />
import viteConfig from './vite.config';
import { defineConfig, mergeConfig, UserConfig } from 'vitest/config';

const defaults: UserConfig = {
  test: {
    include: ['**/*.browser.spec.tsx'],
    server: { sourcemap: true },
    globals: true,
    browser: {
      enabled: true,
      name: 'chrome',
      headless: true,
      // Each test in their own <iframe>
      isolate: true,
      // Create every test (iframe) at the same time
      fileParallelism: true,
    },
  },
};

export default mergeConfig(viteConfig, defineConfig(defaults));
