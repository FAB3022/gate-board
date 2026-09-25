import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { stamp } from '../scripts/stamp-assets.mjs';

const rows = page => page.locator('#sections .task');
const row = (page, key) => page.locator(`[id="row-${key}"]`);
const panel = page => page.locator('#taskPanel');
const chip = (page, v) => page.locator(`#productChips [data-view="${v}"]`);
async function openProduct(page, pid) {
  await chip(page, pid).click();
  await expect(chip(page, pid)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(pid === 'all' ? '#overview' : '#productView')).toBeVisible();
}
async function setStatus(page, key, value) {
  await row(page, key).locator('.status-btn').click();
  await page.locator(`#statusMenu [data-set-status="${value}"]`).click();
  await expect(row(page, key)).toHaveAttribute('data-status', value);
}
async function writeNote(page, key, text) {
  const input = row(page, key).locator('.note-input');
  await input.fill(text);
  await input.press('Enter');
}
// Built-in tasks plus the example task in data/examples.js.
async function counts(page) {
  return page.evaluate(() => {
    const all = mk => [...window.CHECKLIST[mk], ...window.EXAMPLE_ITEMS.filter(e => e.market === mk)];
    return {
      CA: all('CA').length,
      US: all('US').length,
      caBlocking: all('CA').filter(i => i.blocking).length,
      caLaunchWide: all('CA').filter(i => i.scope === 'L').length,
      caPerProduct: all('CA').filter(i => i.scope === 'P').length,
      usPreBlocking: all('US').filter(i => i.phase === 'pre' && i.blocking),
    };
  });
}

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  return errors;
}

test.describe('release safety and layout', () => {
  test('every local file link carries its current content fingerprint', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const local = [...html.matchAll(/(?:src|href)="((?!https?:|data:)[^"]+\.(?:js|css)[^"]*)"/g)].map(m => m[1]);
    expect(local.length).toBeGreaterThanOrEqual(7);
    for (const ref of local) expect(ref).toMatch(/\?v=[a-f0-9]{10}$/);
    expect(html).toMatch(/<meta name="build" content="[a-f0-9]{10}">/);
    expect(stamp(html), 'Run: node scripts/stamp-assets.mjs').toBe(html);
  });

  for (const [w, h] of [[2560, 1280], [1440, 900], [1100, 800], [390, 844]]) {
    test(`product bar lines up with the dashboard and Add product works at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('./');
      await expect(chip(page, 'all')).toBeVisible();
      const bar = await page.locator('.product-bar-inner').boundingBox();
      const layout = await page.locator('.layout').boundingBox();
      const pad = await page.locator('.layout').evaluate(el => parseFloat(getComputedStyle(el).paddingLeft));
      expect(Math.abs(bar.x - (layout.x + pad))).toBeLessThanOrEqual(1);
      expect(Math.abs((bar.x + bar.width) - (layout.x + layout.width - pad))).toBeLessThanOrEqual(1);
      const btn = await page.locator('#addProductBtn').boundingBox();
      expect(btn.x).toBeGreaterThanOrEqual(bar.x);
      expect(btn.x + btn.width).toBeLessThanOrEqual(bar.x + bar.width + 0.5);
      expect(btn.y).toBeGreaterThanOrEqual(bar.y);
      expect(btn.y + btn.height).toBeLessThanOrEqual(bar.y + bar.height + 0.5);
      // Every chip, the Add product chip included, sits on a row with the same height and centre line as its neighbours.
      const boxes = await page.locator('#productChips .product-chip').evaluateAll(els => els.map(el => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, mid: r.top + r.height / 2, h: r.height };
      }));
      expect(boxes.length).toBe(6);
      const heights = boxes.map(b => b.h);
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          const overlapX = a.left < b.right - 0.5 && b.left < a.right - 0.5;
          const overlapY = a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
          expect(overlapX && overlapY, `chips ${i} and ${j} overlap`).toBe(false);
          if (overlapY) expect(Math.abs(a.mid - b.mid)).toBeLessThanOrEqual(1);
        }
      }
      if (w >= 1440) {
        const rowsUsed = new Set(boxes.map(b => Math.round(b.mid)));
        expect(rowsUsed.size, 'all products fit on one row').toBe(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await page.locator('#addProductBtn').click();
      await expect(page.locator('#productFormModal')).toBeVisible();
      await expect(page.locator('#pName')).toBeFocused();
      await expect(page.locator('#productForm')).toBeInViewport();
    });
  }

  test('an open tab offers a reload when a newer version is published', async ({ page }) => {
    await page.route(/build-check=/, r => r.fulfill({ contentType: 'text/html', body: '<meta name="build" content="0123456789">' }));
    await page.goto('./');
    await expect(page.locator('#updateBanner')).toBeVisible();
    await expect(page.locator('#updateBanner')).toContainText('A new version of Gate Board is available.');
    await page.unroute(/build-check=/);
    await page.locator('#updateReload').click();
    await page.waitForLoadState('load');
    await expect(chip(page, 'all')).toBeVisible();
    await expect(page.locator('#updateBanner')).toBeHidden();
  });
});

test.describe('products', () => {
  test('opens on the all-products overview with the Electrolytes flavours', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('./');
    await expect(page.locator('#overview')).toBeVisible();
    await expect(page.locator('#productView')).toBeHidden();
    await expect(chip(page, 'all')).toHaveText(/All products \(4\)/);
    await expect(page.locator('#overview h2')).toHaveText('Canada launch · 4 products');
    await expect(page.locator('.p-card:not(.launch-wide) .p-name')).toHaveText([
      'Electrolytes · Lemon Lime', 'Electrolytes · Blueberry Lemonade', 'Electrolytes · Peach Pomelo', 'Electrolytes · Strawberry Kiwi',
    ]);
    await expect(page.locator('[data-product-card="lemlim"] .p-meta')).toHaveText('Lemon Lime · Stick pack · 20 sticks × 4 g');
    await expect(page.locator('[data-product-card="launch"] .p-name')).toHaveText('Launch-wide tasks');
    const c = await counts(page);
    await expect(page.locator('#progressOverallText')).toHaveText(`0 / ${c.caLaunchWide + 4 * c.caPerProduct}`);
    await expect(page.locator('.matrix thead th.p-col')).toHaveCount(4);
    await expect(page.locator('.matrix [data-matrix-row]')).toHaveCount(c.caPerProduct);
    await expect(page.locator('#brandSub')).toHaveText('Nutratology · Canada · Amazon.ca · 4 products');

    await page.getByRole('button', { name: 'USA', exact: true }).click();
    await expect(page.locator('#overview h2')).toHaveText('USA launch · 1 product');
    await expect(page.locator('.p-card:not(.launch-wide) .p-name')).toHaveText(['Product A']);
    expect(errors).toEqual([]);
  });

  test('per-product tasks keep separate statuses; launch-wide tasks are shared', async ({ page }) => {
    await page.goto('./');
    await openProduct(page, 'lemlim');
    await expect(rows(page)).toHaveCount(118);
    await expect(page.locator('#resultCount')).toHaveText('Showing 118 of 118 tasks for Electrolytes · Lemon Lime');
    await expect(page.locator('#readinessTitle')).toHaveText('Electrolytes · Lemon Lime');
    await expect(row(page, 'CA-PRE-001').locator('.pill.launch-wide')).toBeVisible();
    await expect(row(page, 'CA-PRE-020:lemlim').locator('.pill.launch-wide')).toHaveCount(0);

    await row(page, 'CA-PRE-020:lemlim').locator('.check').click();
    await row(page, 'CA-PRE-001').locator('.check').click();
    await expect(page.locator('#progressOverallText')).toHaveText('2 / 118');

    await openProduct(page, 'blulem');
    await expect(row(page, 'CA-PRE-020:blulem')).toHaveAttribute('data-status', 'not_started');
    await expect(row(page, 'CA-PRE-001')).toHaveAttribute('data-status', 'done');
    await expect(page.locator('#progressOverallText')).toHaveText('1 / 118');

    await page.reload();
    await expect(chip(page, 'blulem')).toHaveAttribute('aria-pressed', 'true');
    await openProduct(page, 'all');
    await expect(page.locator('[data-product-card="lemlim"] .p-ring span')).toHaveText('2%');
    const cell = page.locator('[data-matrix-row="CA-PRE-020"] [data-open="CA-PRE-020:lemlim"]');
    await expect(cell).toHaveText('Done');
    await cell.click();
    await expect(panel(page).locator('.tp-product')).toHaveText(/Electrolytes · Lemon Lime/);
    await expect(panel(page).locator('.other-product')).toHaveCount(4);
    await panel(page).locator('.other-product[data-open="CA-PRE-020:pchpom"]').click();
    await expect(panel(page).locator('.tp-product')).toHaveText(/Peach Pomelo/);
    await panel(page).locator('[data-panel-status="blocked"]').click();
    await page.locator('#tpNote').fill('Peach Pomelo NPN pending');
    await page.locator('#tpNote').blur();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-product-card="pchpom"] .p-stat.bad b')).toHaveText('1');
    await expect(chip(page, 'pchpom').locator('.chip-blocked')).toBeVisible();

    await page.locator('.p-card[data-product-card="pchpom"] [data-view="pchpom"]').click();
    await expect(row(page, 'CA-PRE-020:pchpom').locator('.note-input')).toHaveValue('Peach Pomelo NPN pending');
  });

  test('gates are per product, and the overview needs every product', async ({ page }) => {
    await page.goto('./');
    await openProduct(page, 'lemlim');
    await row(page, 'CA-PRE-059:lemlim').locator('.check').click();
    await row(page, 'CA-PRE-067:lemlim').locator('.check').click();
    await expect(page.locator('[data-gate="1"]')).toHaveAttribute('data-state', 'pass');
    await openProduct(page, 'blulem');
    await expect(page.locator('[data-gate="1"]')).toHaveAttribute('data-state', 'pending');
    await openProduct(page, 'all');
    await expect(page.locator('[data-gate="1"] .gate-count')).toHaveText('2/8');
    await expect(page.locator('[data-product-card="lemlim"] .p-gate')).toContainText('Gate 2 Compliance Sign-off');
    await expect(page.locator('[data-product-card="blulem"] .p-gate')).toContainText('Gate 1 Creative & Copy Freeze');
  });

  test('add, rename and remove a product', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('./');
    await page.locator('#addProductBtn').click();
    await page.locator('#productFormSubmit').click();
    await expect(page.locator('#pNameError')).toBeVisible();
    await page.locator('#pName').fill('Electrolytes · Mango');
    await page.locator('#pFlavour').fill('Mango');
    await page.locator('#pFormat').fill('Stick pack');
    await page.locator('#pSize').fill('20 sticks × 4 g');
    await page.locator('#pAsin').fill('bad');
    await page.locator('#productFormSubmit').click();
    await expect(page.locator('#pAsinError')).toBeVisible();
    await page.locator('#pAsin').fill('b0abcd1234');
    await page.locator('#productFormSubmit').click();
    await expect(page.locator('#toast')).toHaveText('Product added');
    await expect(page.locator('#productView')).toBeVisible();
    await expect(page.locator('#readinessTitle')).toHaveText('Electrolytes · Mango');
    await expect(rows(page)).toHaveCount(118);
    await expect(chip(page, 'all')).toHaveText(/All products \(5\)/);

    await openProduct(page, 'all');
    const card = page.locator('.p-card', { hasText: 'Electrolytes · Mango' });
    await expect(card.locator('.p-meta')).toHaveText('Mango · Stick pack · 20 sticks × 4 g');
    await card.getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('#pAsin')).toHaveValue('B0ABCD1234');
    await page.locator('#pName').fill('Electrolytes · Mango Passion');
    await page.locator('#productFormSubmit').click();
    await expect(page.locator('#toast')).toHaveText('Product updated');
    await expect(page.locator('.p-card', { hasText: 'Mango Passion' })).toHaveCount(1);

    await page.reload();
    await expect(page.locator('.p-card', { hasText: 'Mango Passion' })).toHaveCount(1);
    await page.locator('.p-card', { hasText: 'Mango Passion' }).getByRole('button', { name: 'Edit' }).click();
    await page.locator('#productRemoveBtn').click();
    await expect(page.locator('#productRemoveConfirm')).toContainText('statuses are kept');
    await page.locator('#productRemoveConfirmBtn').click();
    await expect(page.locator('#toast')).toHaveText('Product removed');
    await expect(chip(page, 'all')).toHaveText(/All products \(4\)/);
    await page.reload();
    await expect(page.locator('.p-card', { hasText: 'Mango' })).toHaveCount(0);

    await page.getByRole('button', { name: 'USA', exact: true }).click();
    await page.locator('[data-product-card="proda1"]').getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('#productRemoveBtn')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('copy outstanding covers one product or every product', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./');
    await openProduct(page, 'lemlim');
    await setStatus(page, 'CA-PRE-020:lemlim', 'blocked');
    await writeNote(page, 'CA-PRE-020:lemlim', 'Manufacturer NPN licence copy');
    await page.getByRole('button', { name: 'Copy outstanding' }).click();
    await expect(page.locator('#toast')).toHaveText('Outstanding items copied');
    let text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('OUTSTANDING — CANADA (Amazon.ca) — Electrolytes · Lemon Lime');
    expect(text).toContain('❌ CA-PRE-020 Decide NPN basis');
    expect(text).toContain('blocker: Manufacturer NPN licence copy');
    expect(text).toContain('CA-PRE-001 Define scope');
    expect(text).toContain('[launch-wide]');
    expect(text).toContain('Decisions needed (VERIFY): CA-PRE-052');

    await openProduct(page, 'all');
    await page.getByRole('button', { name: 'Copy outstanding' }).click();
    await expect(page.locator('#toast')).toHaveText('Outstanding items copied');
    text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('— all 4 products —');
    expect(text).toContain('[Electrolytes · Strawberry Kiwi]');
  });
});

test.describe('tasks in a product view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await openProduct(page, 'lemlim');
  });

  test('renders every task with clear titles and no errors', async ({ page }) => {
    const errors = trackErrors(page);
    const c = await counts(page);
    expect([c.CA, c.US]).toEqual([118, 106]);
    await expect(rows(page)).toHaveCount(118);
    await expect(page.locator('#connText')).toHaveText('This browser only');
    await expect(page.locator('#setupNote')).toBeVisible();
    await expect(page.locator('.gate')).toHaveCount(4);
    await expect(page.locator('.gate-pill.pending')).toHaveCount(4);
    await expect(row(page, 'CA-PRE-021:lemlim').locator('.task-title')).toHaveText('Build claims map from the NPN licence');
    await expect(row(page, 'CA-PRE-021:lemlim').locator('.task-detail')).toHaveText(/^Recommended use, dose/);
    await page.getByRole('button', { name: 'USA', exact: true }).click();
    await openProduct(page, 'proda1');
    await expect(rows(page)).toHaveCount(106);
    expect(errors).toEqual([]);
  });

  test('the Slack example task shows with its source', async ({ page }) => {
    const ex = row(page, 'CA-NEW-slk001:lemlim');
    await expect(ex.locator('.pill.slack')).toHaveText('From Slack');
    await expect(ex.locator('.pill.added')).toHaveText('Added');
    await expect(ex.locator('xpath=ancestor::section//h3')).toContainText('Creatives');
    await ex.locator('.task-open').click();
    await expect(panel(page).locator('.origin-card')).toContainText('#june-launch-2026');
    await expect(panel(page).locator('.origin-card a')).toHaveAttribute('href', /^https:\/\/nutratology-atlantis\.slack\.com\//);
    await expect(panel(page)).toContainText('Gate 3: Go / No-Go');
  });

  test('task detail panel: status, notes, prev/next, deep link', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await row(page, 'CA-PRE-020:lemlim').locator('.task-open').click();
    await expect(panel(page)).toHaveClass(/open/);
    await expect(page).toHaveURL(/#CA-PRE-020:lemlim$/);
    await expect(page.locator('#tpTitle')).toHaveText('Decide NPN basis');
    await expect(panel(page).locator('.facts')).toContainText('90 days before launch');
    await expect(page.locator('#panelPos')).toHaveText(/^\d+ of 118$/);

    await panel(page).locator('[data-panel-status="blocked"]').click();
    await expect(row(page, 'CA-PRE-020:lemlim')).toHaveAttribute('data-status', 'blocked');
    await expect(page.locator('#tpNote')).toBeFocused();
    await page.locator('#tpNote').fill('Waiting on manufacturer licence copy');
    await page.locator('#tpNote').blur();
    await expect(row(page, 'CA-PRE-020:lemlim').locator('.note-input')).toHaveValue('Waiting on manufacturer licence copy');

    await page.locator('#panelCopyLink').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/#CA-PRE-020:lemlim$/);
    await page.locator('#panelNext').click();
    await expect(page.locator('#tpTitle')).toHaveText('Build claims map from the NPN licence');
    await page.locator('#panelPrev').click();
    await expect(page.locator('#tpTitle')).toHaveText('Decide NPN basis');
    await page.keyboard.press('Escape');
    await expect(panel(page)).not.toHaveClass(/open/);
    await expect(page).not.toHaveURL(/#/);

    await row(page, 'CA-PRE-030:lemlim').locator('.task-meta').click({ position: { x: 2, y: 2 } });
    await expect(page.locator('#tpTitle')).toHaveText('Define SKU structure');
    await page.keyboard.press('Escape');

    await row(page, 'CA-PRE-110').locator('.task-open').click();
    await expect(panel(page).locator('.tp-shared')).toContainText('shared by every product');
    await expect(panel(page).locator('.other-product')).toHaveCount(0);

    await page.goto('./#US-POST-203:proda1');
    await expect(panel(page)).toHaveClass(/open/);
    await expect(page.locator('#tpTitle')).toHaveText('Gate 4: turn PPC on only after correct images are live');
    await expect(page.locator('.market-tab[data-market="US"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(chip(page, 'proda1')).toHaveAttribute('aria-pressed', 'true');
  });

  test('add, edit and remove a task', async ({ page }) => {
    const errors = trackErrors(page);
    await page.getByRole('button', { name: 'Add task' }).click();
    await page.locator('#taskFormSubmit').click();
    await expect(page.locator('#fTitleError')).toBeVisible();
    await page.locator('#fTitle').fill('Confirm 3PL has launch stock for website orders');
    await page.locator('#fWhen').fill('soon');
    await page.locator('#fLink').fill('javascript:alert(1)');
    await page.locator('#taskFormSubmit').click();
    await expect(page.locator('#fWhenError')).toBeVisible();
    await expect(page.locator('#fLinkError')).toBeVisible();
    await page.locator('#fWhen').fill('T-10');
    await page.locator('#fLink').fill('https://docs.google.com/spreadsheets/d/example');
    await page.locator('#fOwner').selectOption('Ops / Inventory');
    await page.locator('#fSection').selectOption('A5. Production and inventory');
    await page.getByText('Blocking: must be done').click();
    await page.locator('#taskFormSubmit').click();

    await expect(page.locator('#toast')).toHaveText('Task added');
    await expect(rows(page)).toHaveCount(119);
    await expect(page.locator('#tpTitle')).toHaveText('Confirm 3PL has launch stock for website orders');
    const key = await page.evaluate(() => location.hash.slice(1));
    expect(key).toMatch(/^CA-NEW-[a-z0-9]{6}:lemlim$/);
    await expect(row(page, key).locator('xpath=ancestor::section//h3')).toContainText('Production and inventory');

    await panel(page).getByRole('button', { name: 'Edit task' }).click();
    await page.locator('#fTitle').fill('Confirm 3PL and office have launch stock');
    await page.locator('#taskFormSubmit').click();
    await expect(page.locator('#toast')).toHaveText('Task updated');
    await expect(row(page, key).locator('.task-open')).toHaveText('Confirm 3PL and office have launch stock');

    await page.keyboard.press('Escape');
    await openProduct(page, 'strkiw');
    await expect(rows(page)).toHaveCount(119);
    await page.reload();
    await expect(rows(page)).toHaveCount(119);

    await row(page, key.replace('lemlim', 'strkiw')).locator('.task-open').click();
    await panel(page).getByRole('button', { name: 'Remove' }).click();
    await expect(panel(page).locator('.confirm-row')).toContainText('mark it N/A with a reason instead');
    await panel(page).getByRole('button', { name: 'Remove task' }).click();
    await expect(page.locator('#toast')).toHaveText('Task removed');
    await expect(rows(page)).toHaveCount(118);
    expect(errors).toEqual([]);
  });

  test('filters and grouping narrow and reorganise the list', async ({ page }) => {
    const expected = await page.evaluate(() => {
      const ca = [...window.CHECKLIST.CA, ...window.EXAMPLE_ITEMS.filter(e => e.market === 'CA')];
      return {
        pre: ca.filter(i => i.phase === 'pre').length,
        blocking: ca.filter(i => i.blocking).length,
        ppc: ca.filter(i => i.owner === 'PPC').length,
        sections: new Set(ca.map(i => i.section)).size,
        whens: new Set(ca.map(i => i.when)).size,
        owners: new Set(ca.map(i => i.owner)).size,
      };
    });
    await expect(page.locator('#sections .group')).toHaveCount(expected.sections);
    await page.getByRole('button', { name: 'Pre-launch' }).click();
    await expect(rows(page)).toHaveCount(expected.pre);
    await page.getByRole('button', { name: 'All phases' }).click();
    await page.getByText('Blocking only', { exact: true }).click();
    await expect(rows(page)).toHaveCount(expected.blocking);
    await page.getByText('Blocking only', { exact: true }).click();
    await page.locator('#ownerFilter').selectOption('PPC');
    await expect(rows(page)).toHaveCount(expected.ppc);
    await page.locator('#ownerFilter').selectOption('all');
    await page.locator('#groupBy').selectOption('timeline');
    await expect(page.locator('#sections .group')).toHaveCount(expected.whens);
    await expect(page.locator('#sections .group h3').first()).toHaveText('Every week until T-7');
    await page.locator('#groupBy').selectOption('owner');
    await expect(page.locator('#sections .group')).toHaveCount(expected.owners);
    await page.locator('#groupBy').selectOption('section');
    await page.locator('#searchInput').fill('main image owner');
    await expect(rows(page)).toHaveCount(1);
    await page.locator('#searchInput').fill('zzzz no match');
    await expect(page.locator('.empty-state')).toHaveText('No tasks match these filters.');
  });

  test('one-click check, status menu, N/A reasons and reload', async ({ page }) => {
    await row(page, 'CA-PRE-059:lemlim').locator('.check').click();
    await expect(panel(page)).not.toHaveClass(/open/);
    await expect(page.locator('#progressOverallText')).toHaveText('1 / 118');
    await setStatus(page, 'CA-PRE-067:lemlim', 'blocked');
    await expect(row(page, 'CA-PRE-067:lemlim').locator('.note-input')).toBeFocused();
    await expect(page.locator('[data-gate="1"]')).toHaveAttribute('data-state', 'risk');
    await writeNote(page, 'CA-PRE-067:lemlim', 'Waiting on final main image from Design');
    await row(page, 'CA-PRE-067:lemlim').locator('.check').click();
    await expect(page.locator('[data-gate="1"]')).toHaveAttribute('data-state', 'pass');
    await expect(row(page, 'CA-PRE-067:lemlim').locator('.note-snippet')).toContainText('Waiting on final main image');

    await setStatus(page, 'CA-PRE-002', 'na');
    await expect(row(page, 'CA-PRE-002').locator('.pill.warn')).toHaveText('Reason missing');
    await expect(page.locator('#progressOverallText')).toHaveText('2 / 118');
    await writeNote(page, 'CA-PRE-002', 'Relaunch; channel already exists');
    await expect(page.locator('#progressOverallText')).toHaveText('3 / 118');

    await page.reload();
    await expect(row(page, 'CA-PRE-059:lemlim')).toHaveAttribute('data-status', 'done');
    await expect(row(page, 'CA-PRE-002').locator('.note-input')).toHaveValue('Relaunch; channel already exists');
    await expect(page.locator('[data-gate="1"] .gate-pill')).toHaveText('Passed');
  });

  test('summary tiles filter the list and toggle off again', async ({ page }) => {
    await setStatus(page, 'CA-PRE-010:lemlim', 'in_progress');
    await setStatus(page, 'CA-PRE-011:lemlim', 'blocked');
    await row(page, 'CA-PRE-012:lemlim').locator('.check').click();
    const { caBlocking } = await counts(page);
    await expect(page.locator('[data-stat="blocking"] .stat-value')).toHaveText(String(caBlocking - 1));
    await page.locator('[data-stat="blocked"]').click();
    await expect(rows(page)).toHaveCount(1);
    await page.locator('[data-stat="blocking"]').click();
    await expect(rows(page)).toHaveCount(caBlocking - 1);
    await page.locator('[data-stat="blocking"]').click();
    await expect(rows(page)).toHaveCount(118);
  });

  test('gate 3 needs every pre-launch blocking task, added ones included', async ({ page }) => {
    const { usPreBlocking } = await counts(page);
    const keys = usPreBlocking.filter(i => i.id !== 'US-NEW-slk001').map(i => (i.scope === 'P' ? `${i.id}:proda1` : i.id));
    await page.evaluate(keys => {
      const map = {};
      for (const k of keys) map[k] = { item_id: k, market: 'US', status: 'done', note: '', updated_at: new Date().toISOString() };
      localStorage.setItem('gate-board:status:v1', JSON.stringify(map));
    }, keys);
    await page.reload();
    await page.getByRole('button', { name: 'USA', exact: true }).click();
    await openProduct(page, 'proda1');
    await expect(page.locator('[data-gate="3"]')).toHaveAttribute('data-state', 'pending');
    await row(page, 'US-NEW-slk001:proda1').locator('.check').click();
    await expect(page.locator('[data-gate="3"]')).toHaveAttribute('data-state', 'pass');
  });

  test('lessons, playbook and jump-to-task work', async ({ page }) => {
    await row(page, 'CA-PRE-086:lemlim').getByRole('button', { name: 'Why this step exists' }).click();
    await expect(row(page, 'CA-PRE-086:lemlim').locator('.lesson')).toContainText('preorder');
    await page.getByRole('button', { name: 'Playbook' }).click();
    await page.getByRole('button', { name: 'Lessons learned' }).click();
    await expect(page.locator('.lesson-card')).toHaveCount(25);
    await page.locator('.lesson-chip[data-jump="US-POST-203"]').first().click();
    await expect(page.locator('.market-tab[data-market="US"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(row(page, 'US-POST-203:proda1')).toBeInViewport();
  });

  test('groups collapse and stay collapsed', async ({ page }) => {
    await page.locator('.group-head').first().click();
    await expect(page.locator('.group').first()).toHaveClass(/collapsed/);
    await page.reload();
    await expect(page.locator('.group').first()).toHaveClass(/collapsed/);
  });

  test('fits a phone screen, including overview, panel and forms', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await expect(rows(page)).toHaveCount(118);
    expect(await overflow()).toBeLessThanOrEqual(0);
    await row(page, 'CA-NEW-slk001:lemlim').locator('.task-open').click();
    await expect(panel(page)).toBeInViewport();
    expect(await overflow()).toBeLessThanOrEqual(0);
    await page.keyboard.press('Escape');
    await openProduct(page, 'all');
    expect(await overflow()).toBeLessThanOrEqual(0);
    await page.locator('#addProductBtn').click();
    await expect(page.locator('#productForm')).toBeInViewport();
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
});

const FAKE_SUPABASE = `
window.__upserts = [];
window.__failNext = false;
window.__emit = {};
window.supabase = { createClient(url, key) {
  window.__client = { url, key };
  const rows = {
    launch_status: [{ item_id: 'CA-PRE-001', market: 'CA', status: 'done', note: '', updated_at: '2026-09-01T00:00:00Z' }],
    launch_items: [{ id: 'CA-NEW-abc123', data: { id: 'CA-NEW-abc123', market: 'CA', phase: 'pre', section: 'A5. Production and inventory', when: 'T-10', owner: 'Ops / Inventory', title: 'Task added by a teammate', link: 'javascript:alert(1)', createdAt: '2026-09-20T00:00:00Z' } }],
    launch_products: [{ id: 'mango1', data: { id: 'mango1', market: 'CA', name: 'Electrolytes · Mango', flavour: 'Mango', order: 5 } }],
  };
  return {
    from(table) {
      return {
        select() { return Promise.resolve({ data: rows[table], error: null }); },
        upsert(rec, opts) {
          if (window.__failNext) { window.__failNext = false; return Promise.resolve({ error: { message: 'permission denied' } }); }
          window.__upserts.push({ table, rec, opts });
          return Promise.resolve({ error: null });
        },
      };
    },
    channel() {
      const ch = {
        on(evt, filter, cb) { window.__emit[filter.table] = row => cb({ new: row }); return ch; },
        subscribe(cb) { setTimeout(() => cb('SUBSCRIBED'), 0); return ch; },
      };
      return ch;
    },
  };
} };`;

test.describe('shared mode (simulated Supabase)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/supabase-js@*/**', r => r.fulfill({ contentType: 'text/javascript', body: FAKE_SUPABASE }));
    await page.route('**/config.js*', r => r.fulfill({
      contentType: 'text/javascript',
      body: "window.GATE_BOARD_CONFIG = { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'anon-test' };",
    }));
  });

  test('loads, saves and receives live changes', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('./');
    await expect(page.locator('#connText')).toHaveText('Shared · live');
    await expect(chip(page, 'all')).toHaveText(/All products \(5\)/);
    await openProduct(page, 'mango1');
    await expect(row(page, 'CA-PRE-001')).toHaveAttribute('data-status', 'done');
    await expect(row(page, 'CA-NEW-abc123:mango1').locator('.task-open')).toHaveText('Task added by a teammate');

    await setStatus(page, 'CA-PRE-010:mango1', 'in_progress');
    await expect.poll(() => page.evaluate(() => window.__upserts.length)).toBe(1);
    const saved = await page.evaluate(() => window.__upserts[0]);
    expect(saved.table).toBe('launch_status');
    expect(saved.opts).toEqual({ onConflict: 'item_id' });
    expect(saved.rec).toMatchObject({ item_id: 'CA-PRE-010:mango1', market: 'CA', status: 'in_progress', note: '' });

    await page.evaluate(() => window.__emit.launch_status({ item_id: 'CA-PRE-011:mango1', market: 'CA', status: 'blocked', note: 'Flavour re-test pending', updated_at: new Date().toISOString() }));
    await expect(row(page, 'CA-PRE-011:mango1')).toHaveAttribute('data-status', 'blocked');
    await page.evaluate(() => window.__emit.launch_products({ id: 'grape1', market: 'CA', data: { id: 'grape1', market: 'CA', name: 'Electrolytes · Grape', order: 6 } }));
    await expect(chip(page, 'grape1')).toHaveText(/Electrolytes · Grape/);
    await page.evaluate(() => window.__emit.launch_items({ id: 'CA-NEW-zzz999', market: 'CA', data: { id: 'CA-NEW-zzz999', market: 'CA', phase: 'post', section: 'B2. First 14 days', when: 'T+2', owner: 'CX / Support', scope: 'L', title: 'Live task from another viewer' } }));
    await expect(row(page, 'CA-NEW-zzz999').locator('.task-open')).toHaveText('Live task from another viewer');
    expect(errors).toEqual([]);
  });

  test('products and added tasks save to their shared tables', async ({ page }) => {
    await page.goto('./');
    await page.locator('#addProductBtn').click();
    await page.locator('#pName').fill('Electrolytes · Watermelon');
    await page.locator('#productFormSubmit').click();
    await expect.poll(() => page.evaluate(() => window.__upserts.filter(u => u.table === 'launch_products').length)).toBe(1);
    const p = await page.evaluate(() => window.__upserts.find(u => u.table === 'launch_products'));
    expect(p.opts).toEqual({ onConflict: 'id' });
    expect(p.rec.id).toMatch(/^[a-z0-9]{6}$/);
    expect(p.rec.data).toMatchObject({ name: 'Electrolytes · Watermelon', market: 'CA', order: 6 });

    await page.getByRole('button', { name: 'Add task' }).click();
    await page.locator('#fTitle').fill('Shared added task');
    await page.locator('#taskFormSubmit').click();
    await expect.poll(() => page.evaluate(() => window.__upserts.filter(u => u.table === 'launch_items').length)).toBe(1);
    const t = await page.evaluate(() => window.__upserts.find(u => u.table === 'launch_items'));
    expect(t.rec.id).toMatch(/^CA-NEW-[a-z0-9]{6}$/);
    expect(t.rec.data).toMatchObject({ title: 'Shared added task', owner: 'Launch Lead', when: 'T-14' });
    await expect(page.locator('#tpTitle')).toHaveText('Shared added task');
    await expect(panel(page).locator('.tp-product')).toHaveText(/Watermelon/);
  });

  test('links from other viewers are only shown if they are https', async ({ page }) => {
    await page.goto('./#CA-NEW-abc123:lemlim');
    await expect(page.locator('#tpTitle')).toHaveText('Task added by a teammate');
    await expect(panel(page).locator('.origin-card')).toHaveCount(0);
  });

  test('a failed save is undone and explained', async ({ page }) => {
    await page.goto('./');
    await openProduct(page, 'lemlim');
    await page.evaluate(() => { window.__failNext = true; });
    await row(page, 'CA-PRE-012:lemlim').locator('.check').click();
    await expect(page.locator('#toast')).toHaveText('Not saved: permission denied');
    await expect(row(page, 'CA-PRE-012:lemlim')).toHaveAttribute('data-status', 'not_started');

    await page.evaluate(() => { window.__failNext = true; });
    await page.locator('#addProductBtn').click();
    await page.locator('#pName').fill('This one fails');
    await page.locator('#productFormSubmit').click();
    await expect(page.locator('#toast')).toHaveText('Not saved: permission denied');
    await expect(chip(page, 'all')).toHaveText(/All products \(5\)/);
  });

  test('live updates do not wipe a note being typed', async ({ page }) => {
    await page.goto('./');
    await openProduct(page, 'lemlim');
    await setStatus(page, 'CA-PRE-020:lemlim', 'blocked');
    const note = row(page, 'CA-PRE-020:lemlim').locator('.note-input');
    await note.click();
    await note.pressSequentially('Half typed');
    await page.evaluate(() => window.__emit.launch_status({ item_id: 'CA-PRE-021:lemlim', market: 'CA', status: 'done', note: '', updated_at: new Date().toISOString() }));
    await expect(note).toHaveValue('Half typed');
    await expect(note).toBeFocused();
    await note.press('Enter');
    await expect(row(page, 'CA-PRE-021:lemlim')).toHaveAttribute('data-status', 'done');

    await row(page, 'CA-PRE-030:lemlim').locator('.task-open').click();
    await page.locator('#tpNote').click();
    await page.locator('#tpNote').pressSequentially('Panel note in progress');
    await page.evaluate(() => window.__emit.launch_status({ item_id: 'CA-PRE-031:lemlim', market: 'CA', status: 'done', note: '', updated_at: new Date().toISOString() }));
    await expect(page.locator('#tpNote')).toHaveValue('Panel note in progress');
    await expect(page.locator('#tpNote')).toBeFocused();
  });
});

test('real Supabase library loads and an unreachable project is reported', async ({ page }) => {
  await page.route('**/config.js*', r => r.fulfill({
    contentType: 'text/javascript',
    body: "window.GATE_BOARD_CONFIG = { supabaseUrl: 'http://127.0.0.1:9', supabaseAnonKey: 'anon-test' };",
  }));
  await page.goto('./');
  expect(await page.evaluate(() => typeof window.supabase.createClient)).toBe('function');
  await expect(page.locator('#connText')).toHaveText('Not connected', { timeout: 15000 });
  await expect(page.locator('#toast')).toContainText('Retrying in 15 seconds');
  await page.waitForTimeout(4000);
  await expect(page.locator('#connText')).toHaveText('Not connected');
  await expect(page.locator('.p-card:not(.launch-wide)')).toHaveCount(4);
});
