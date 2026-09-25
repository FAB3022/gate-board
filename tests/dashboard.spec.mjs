import { test, expect } from '@playwright/test';

const rows = page => page.locator('#sections .task');
const row = (page, id) => page.locator(`#row-${id}`);
async function setStatus(page, id, value) {
  await row(page, id).locator('.status-btn').click();
  await page.locator(`#statusMenu [data-set-status="${value}"]`).click();
  await expect(row(page, id)).toHaveAttribute('data-status', value);
}
async function writeNote(page, id, text) {
  const input = row(page, id).locator('.note-input');
  await input.fill(text);
  await input.press('Enter');
}

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  return errors;
}

test.describe('browser-only mode', () => {
  test('renders every checklist item for both markets with no errors', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    const counts = await page.evaluate(() => ({ CA: window.CHECKLIST.CA.length, US: window.CHECKLIST.US.length }));
    expect(counts).toEqual({ CA: 117, US: 105 });
    await expect(rows(page)).toHaveCount(117);
    await expect(page.locator('#resultCount')).toHaveText('Showing 117 of 117 tasks');
    await expect(page.locator('#connText')).toHaveText('This browser only');
    await expect(page.locator('#setupNote')).toBeVisible();
    await expect(page.locator('.gate')).toHaveCount(4);
    await expect(page.locator('.gate-pill.pending')).toHaveCount(4);
    await expect(page.locator('#progressOverallText')).toHaveText('0 / 117');
    await expect(page.locator('#ringPct')).toHaveText('0%');
    await expect(page.locator('#readinessTitle')).toHaveText('Canada launch');
    await expect(row(page, 'CA-PRE-021').locator('.task-title')).toHaveText('Build claims map from the NPN licence');
    await expect(row(page, 'CA-PRE-021').locator('.task-detail')).toHaveText(/^Recommended use, dose/);

    await page.getByRole('button', { name: 'USA', exact: true }).click();
    await expect(rows(page)).toHaveCount(105);
    await expect(page.locator('#readinessTitle')).toHaveText('USA launch');
    await expect(row(page, 'US-PRE-001')).toBeVisible();
    await expect(row(page, 'CA-PRE-001')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('filters and grouping narrow and reorganise the list', async ({ page }) => {
    await page.goto('/');
    const expected = await page.evaluate(() => {
      const ca = window.CHECKLIST.CA;
      return {
        pre: ca.filter(i => i.phase === 'pre').length,
        post: ca.filter(i => i.phase === 'post').length,
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
    await page.getByRole('button', { name: 'Post-launch' }).click();
    await expect(rows(page)).toHaveCount(expected.post);
    await page.getByRole('button', { name: 'All phases' }).click();
    await page.getByText('Blocking only').click();
    await expect(rows(page)).toHaveCount(expected.blocking);
    await page.getByText('Blocking only').click();
    await page.locator('#ownerFilter').selectOption('PPC');
    await expect(rows(page)).toHaveCount(expected.ppc);
    await page.locator('#ownerFilter').selectOption('all');

    await page.locator('#groupBy').selectOption('timeline');
    await expect(page.locator('#sections .group')).toHaveCount(expected.whens);
    await expect(page.locator('#sections .group h3').first()).toHaveText('Every week until T-7');
    await expect(page.locator('#sections .group h3').nth(1)).toContainText('T-120');
    await expect(page.locator('#sections .group h3', { hasText: 'Gate 1: Creative & Copy Freeze' })).toHaveCount(1);
    await page.locator('#groupBy').selectOption('owner');
    await expect(page.locator('#sections .group')).toHaveCount(expected.owners);
    await page.locator('#groupBy').selectOption('section');

    await page.locator('#searchInput').fill('ca-pre-110');
    await expect(rows(page)).toHaveCount(1);
    await page.locator('#searchInput').fill('zzzz no match');
    await expect(page.locator('.empty-state')).toHaveText('No tasks match these filters.');
  });

  test('one-click check and the status menu save and survive reload', async ({ page }) => {
    await page.goto('/');
    await row(page, 'CA-PRE-059').locator('.check').click();
    await expect(row(page, 'CA-PRE-059')).toHaveAttribute('data-status', 'done');
    await expect(page.locator('#progressOverallText')).toHaveText('1 / 117');
    await expect(page.locator('[data-gate="1"] .gate-count')).toHaveText('1/2');

    await setStatus(page, 'CA-PRE-067', 'blocked');
    await expect(row(page, 'CA-PRE-067').locator('.note-input')).toBeFocused();
    await expect(page.locator('[data-gate="1"]')).toHaveAttribute('data-state', 'risk');
    await writeNote(page, 'CA-PRE-067', 'Waiting on final main image from Design');

    await row(page, 'CA-PRE-067').locator('.check').click();
    await expect(page.locator('[data-gate="1"]')).toHaveAttribute('data-state', 'pass');
    await expect(page.locator('[data-gate="1"] .gate-pill')).toHaveText('Passed');

    await setStatus(page, 'CA-PRE-002', 'na');
    await expect(row(page, 'CA-PRE-002').locator('.pill.warn')).toHaveText('Reason missing');
    await expect(page.locator('#progressOverallText')).toHaveText('2 / 117');
    await writeNote(page, 'CA-PRE-002', 'Relaunch; channel already exists');
    await expect(row(page, 'CA-PRE-002').locator('.pill.warn')).toHaveCount(0);
    await expect(page.locator('#progressOverallText')).toHaveText('3 / 117');

    await row(page, 'CA-PRE-059').locator('.check').click();
    await expect(row(page, 'CA-PRE-059')).toHaveAttribute('data-status', 'not_started');
    await row(page, 'CA-PRE-059').locator('.check').click();

    await page.reload();
    await expect(row(page, 'CA-PRE-059')).toHaveAttribute('data-status', 'done');
    await expect(row(page, 'CA-PRE-002').locator('.note-input')).toHaveValue('Relaunch; channel already exists');
    await expect(page.locator('[data-gate="1"] .gate-pill')).toHaveText('Passed');
    await expect(page.locator('#progressOverallText')).toHaveText('3 / 117');
    await expect(page.locator('#ringPct')).toHaveText('3%');
  });

  test('summary tiles filter the list and toggle off again', async ({ page }) => {
    await page.goto('/');
    await setStatus(page, 'CA-PRE-010', 'in_progress');
    await setStatus(page, 'CA-PRE-011', 'blocked');
    await row(page, 'CA-PRE-012').locator('.check').click();
    const blocking = await page.evaluate(() => window.CHECKLIST.CA.filter(i => i.blocking).length);

    await expect(page.locator('[data-stat="blocking"] .stat-value')).toHaveText(String(blocking - 1));
    await expect(page.locator('[data-stat="in_progress"] .stat-value')).toHaveText('1');
    await page.locator('[data-stat="blocked"]').click();
    await expect(rows(page)).toHaveCount(1);
    await expect(page.locator('[data-stat="blocked"]')).toHaveClass(/active/);
    await page.locator('[data-stat="blocking"]').click();
    await expect(rows(page)).toHaveCount(blocking - 1);
    await page.locator('[data-stat="blocking"]').click();
    await expect(rows(page)).toHaveCount(117);
  });

  test('gate 3 needs every pre-launch blocking item', async ({ page }) => {
    await page.goto('/');
    const ids = await page.evaluate(() => window.CHECKLIST.US.filter(i => i.phase === 'pre' && i.blocking).map(i => i.id));
    await page.evaluate(ids => {
      const map = {};
      for (const id of ids) map[id] = { item_id: id, market: 'US', status: 'done', note: '', updated_at: new Date().toISOString() };
      localStorage.setItem('gate-board:status:v1', JSON.stringify(map));
    }, ids);
    await page.reload();
    await page.getByRole('button', { name: 'USA', exact: true }).click();
    await expect(page.locator('[data-gate="3"]')).toHaveAttribute('data-state', 'pass');
    await expect(page.locator('[data-gate="2"]')).toHaveAttribute('data-state', 'pass');
    await expect(page.locator('[data-gate="4"]')).toHaveAttribute('data-state', 'pending');
    await setStatus(page, ids[0], 'in_progress');
    await expect(page.locator('[data-gate="3"]')).toHaveAttribute('data-state', 'pending');
  });

  test('lessons, playbook and jump-to-item work', async ({ page }) => {
    await page.goto('/');
    await row(page, 'CA-PRE-086').getByRole('button', { name: 'Why this step exists' }).click();
    await expect(row(page, 'CA-PRE-086').locator('.lesson')).toContainText('preorder');

    await page.getByRole('button', { name: 'Playbook' }).click();
    await expect(page.locator('#drawerBody')).toContainText('Launch Lead');
    await expect(page.locator('#drawerBody')).toContainText('Launch-Day Image Gate');
    await page.getByRole('button', { name: 'Lessons learned' }).click();
    await expect(page.locator('.lesson-card')).toHaveCount(25);
    await page.locator('.lesson-chip[data-jump="US-POST-203"]').first().click();
    await expect(page.locator('#playbookDrawer')).not.toHaveClass(/open/);
    await expect(page.locator('.market-tab[data-market="US"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(row(page, 'US-POST-203')).toBeInViewport();
  });

  test('groups collapse and stay collapsed; sidebar links jump to groups', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/');
    await page.locator('.group-head').first().click();
    await expect(page.locator('.group').first()).toHaveClass(/collapsed/);
    await page.reload();
    await expect(page.locator('.group').first()).toHaveClass(/collapsed/);
    await page.locator('.group-link').last().click();
    await expect(page.locator('.group').last()).toBeInViewport();
  });

  test('copy outstanding produces the channel repost', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await setStatus(page, 'CA-PRE-020', 'blocked');
    await writeNote(page, 'CA-PRE-020', 'Manufacturer NPN licence copy');
    await page.getByRole('button', { name: 'Copy outstanding' }).click();
    await expect(page.locator('#toast')).toHaveText('Outstanding items copied');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('OUTSTANDING — CANADA (Amazon.ca)');
    expect(text).toContain('Next gate: Gate 1 Creative & Copy Freeze');
    expect(text).toContain('❌ CA-PRE-020');
    expect(text).toContain('blocker: Manufacturer NPN licence copy');
    expect(text).toContain('Decisions needed (VERIFY): CA-PRE-052');
  });

  test('fits a phone screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(rows(page)).toHaveCount(117);
    await setStatus(page, 'CA-PRE-001', 'in_progress');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

const FAKE_SUPABASE = `
window.__upserts = [];
window.__failNext = false;
window.supabase = { createClient(url, key) {
  window.__client = { url, key };
  return {
    from(table) {
      return {
        select() { return Promise.resolve({ data: [{ item_id: 'CA-PRE-001', market: 'CA', status: 'done', note: '', updated_at: '2026-09-01T00:00:00Z' }], error: null }); },
        upsert(rec, opts) {
          if (window.__failNext) { window.__failNext = false; return Promise.resolve({ error: { message: 'permission denied' } }); }
          window.__upserts.push({ table, rec, opts });
          return Promise.resolve({ error: null });
        },
      };
    },
    channel() {
      const ch = {
        on(evt, filter, cb) { window.__filter = filter; window.__emit = row => cb({ new: row }); return ch; },
        subscribe(cb) { setTimeout(() => cb('SUBSCRIBED'), 0); return ch; },
      };
      return ch;
    },
  };
} };`;

test.describe('shared mode (simulated Supabase)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/supabase-js@*/**', r => r.fulfill({ contentType: 'text/javascript', body: FAKE_SUPABASE }));
    await page.route('**/config.js', r => r.fulfill({
      contentType: 'text/javascript',
      body: "window.GATE_BOARD_CONFIG = { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'anon-test' };",
    }));
  });

  test('loads, saves and receives live changes', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page.locator('#connText')).toHaveText('Shared · live');
    await expect(page.locator('#setupNote')).toBeHidden();
    await expect(row(page, 'CA-PRE-001')).toHaveAttribute('data-status', 'done');
    expect(await page.evaluate(() => window.__client)).toEqual({ url: 'https://example.supabase.co', key: 'anon-test' });
    expect(await page.evaluate(() => window.__filter)).toEqual({ event: '*', schema: 'public', table: 'launch_status' });

    await setStatus(page, 'CA-PRE-010', 'in_progress');
    await expect.poll(() => page.evaluate(() => window.__upserts.length)).toBe(1);
    const saved = await page.evaluate(() => window.__upserts[0]);
    expect(saved.table).toBe('launch_status');
    expect(saved.opts).toEqual({ onConflict: 'item_id' });
    expect(saved.rec).toMatchObject({ item_id: 'CA-PRE-010', market: 'CA', status: 'in_progress', note: '' });

    await page.evaluate(() => window.__emit({ item_id: 'CA-PRE-011', market: 'CA', status: 'blocked', note: 'Flavour re-test pending', updated_at: new Date().toISOString() }));
    await expect(row(page, 'CA-PRE-011')).toHaveAttribute('data-status', 'blocked');
    await expect(row(page, 'CA-PRE-011').locator('.note-input')).toHaveValue('Flavour re-test pending');
    expect(errors).toEqual([]);
  });

  test('a failed save is undone and explained', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#connText')).toHaveText('Shared · live');
    await page.evaluate(() => { window.__failNext = true; });
    await row(page, 'CA-PRE-012').locator('.check').click();
    await expect(page.locator('#toast')).toHaveText('Not saved: permission denied');
    await expect(row(page, 'CA-PRE-012')).toHaveAttribute('data-status', 'not_started');
  });

  test('live update does not wipe a note being typed', async ({ page }) => {
    await page.goto('/');
    await setStatus(page, 'CA-PRE-020', 'blocked');
    const note = row(page, 'CA-PRE-020').locator('.note-input');
    await note.click();
    await note.pressSequentially('Half typed');
    await page.evaluate(() => window.__emit({ item_id: 'CA-PRE-021', market: 'CA', status: 'done', note: '', updated_at: new Date().toISOString() }));
    await expect(note).toHaveValue('Half typed');
    await expect(note).toBeFocused();
    await note.press('Enter');
    await expect(row(page, 'CA-PRE-021')).toHaveAttribute('data-status', 'done');
  });
});

test('real Supabase library loads and an unreachable project is reported', async ({ page }) => {
  await page.route('**/config.js', r => r.fulfill({
    contentType: 'text/javascript',
    body: "window.GATE_BOARD_CONFIG = { supabaseUrl: 'http://127.0.0.1:9', supabaseAnonKey: 'anon-test' };",
  }));
  await page.goto('/');
  expect(await page.evaluate(() => typeof window.supabase.createClient)).toBe('function');
  await expect(page.locator('#connText')).toHaveText('Not connected', { timeout: 15000 });
  await expect(page.locator('#toast')).toContainText('Retrying in 15 seconds');
  await page.waitForTimeout(4000);
  await expect(page.locator('#connText')).toHaveText('Not connected');
  await expect(rows(page)).toHaveCount(117);
});
