import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', browserName: 'chromium' },
  webServer: { command: 'node tests/server.mjs 4173', url: 'http://localhost:4173', reuseExistingServer: true },
});
