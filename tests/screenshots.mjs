// Captures preview screenshots: node tests/screenshots.mjs <outDir> [baseUrl]
import { chromium } from '@playwright/test';

const out = process.argv[2] || '.';
const base = process.argv[3] || 'http://localhost:4173/';
const browser = await chromium.launch();
const shots = [
  { name: 'desktop-light', viewport: { width: 1440, height: 1000 }, colorScheme: 'light' },
  { name: 'desktop-dark', viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' },
  { name: 'phone', viewport: { width: 390, height: 1400 }, colorScheme: 'light' },
];
for (const s of shots) {
  const page = await browser.newPage({ viewport: s.viewport, colorScheme: s.colorScheme });
  await page.goto(base);
  await page.evaluate(() => {
    const now = new Date().toISOString();
    const rec = (id, status, note = '') => [id, { item_id: id, market: 'CA', status, note, updated_at: now }];
    localStorage.setItem('gate-board:status:v1', JSON.stringify(Object.fromEntries([
      rec('CA-PRE-001', 'done'), rec('CA-PRE-002', 'done'), rec('CA-PRE-003', 'done'),
      rec('CA-PRE-005', 'in_progress'), rec('CA-PRE-006', 'blocked', 'Waiting on production timeline from manufacturer'),
      rec('CA-PRE-010', 'done'), rec('CA-PRE-011', 'in_progress'),
    ])));
  });
  await page.reload();
  await page.locator('#row-CA-PRE-005 [data-lesson]').click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${s.name}.png`, fullPage: s.name === 'phone' ? false : false });
  await page.close();
}
await browser.close();
