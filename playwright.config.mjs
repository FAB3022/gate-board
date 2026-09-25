import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  reporter: 'list',
  // Set BASE_URL to test a deployed copy, e.g. BASE_URL=https://fab3022.github.io/gate-board/ npm test
  use: { baseURL: process.env.BASE_URL || 'http://localhost:4173', browserName: 'chromium' },
  webServer: process.env.BASE_URL ? undefined : { command: 'node tests/server.mjs 4173', url: 'http://localhost:4173', reuseExistingServer: true },
});
