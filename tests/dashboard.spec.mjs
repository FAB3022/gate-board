import { test, expect } from '@playwright/test';

const rows = page => page.locator('#sections .task');
const row = (page, id) => page.locator(`#row-${id}`);
const panel = page => page.locator('#taskPanel');
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
// Built-in checklist items plus the example task that ships in data/examples.js.
async function counts(page) {
  return page.evaluate(() => {
    const ex = window.EXAMPLE_ITEMS;
    const all = mk => [...window.CHECKLIST[mk], ...ex.filter(e => e.market === mk)];
    return {
      CA: all('CA').length,
      US: all('US').length,
      caBlocking: all('CA').filter(i => i.blocking).length,
      usPreBlockingIds: all('US').filter(i => i.phase === 'pre' && i.blocking).map(i => i.id),
    };
  });
}

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  return errors;
}

test.describe('browser-only mode', () => {
  test('renders every task for both markets with no errors', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('./');
    const c = await counts(page);
    expect([c.CA, c.US]).toEqual([118, 106]);
    await expect(rows(page)).toHaveCount(118);
    await expect(page.locator('#resultCount')).toHaveText('Showing 118 of 118 tasks');
    await expect(page.locator('#connText')).toHaveText('This browser only');
    await expect(page.locator('#setupNote')).toBeVisible();
    await expect(page.locator('.gate')).toHaveCount(4);
    await expect(page.locator('.gate-pill.pending')).toHaveCount(4);
    await expect(page.locator('#progressOverallText')).toHaveText('0 / 118');
    await expect(page.locator('#readinessTitle')).toHaveText('Canada launch');
    await expect(row(page, 'CA-PRE-021').locator('.task-title')).toHaveText('Build claims map from the NPN licence');
    await expect(row(page, 'CA-PRE-021').locator('.task-detail')).toHaveText(/^Recommended use, dose/);

    await page.getByRole('button', { name: 'USA', exact: true }).click();
    await expect(rows(page)).toHaveCount(106);
    await expect(page.locator('#readinessTitle')).toHaveText('USA launch');
    await expect(row(page, 'CA-PRE-001')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('the Slack example task shows in both markets with its source', async ({ page }) => {
    await page.goto('./');
    const ca = row(page, 'CA-NEW-slk001');
    await expect(ca.locator('.pill.slack')).toHaveText('From Slack');
    await expect(ca.locator('.pill.added')).toHaveText('Added');
    await expect(ca.locator('.pill.blocking')).toBeVisible();
    await expect(ca.locator('xpath=ancestor::section//h3')).toContainText('Creatives');
    await ca.locator('.task-open').click();
    await expect(panel(page)).toHaveClass(/open/);
    await expect(panel(page).locator('.origin-card')).toContainText('#june-launch-2026');
    await expect(panel(page).locator('.origin-card a')).toHaveAttribute('href', /^https:\/\/nutratology-atlantis\.slack\.com\//);
    await expect(panel(page).locator('.origin-card a')).toHaveAttribute('target', '_blank');
    await expect(panel(page)).toContainText('Gate 3: Go / No-Go');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'USA', exact: true }).click();
    await expect(row(page, 'US-NEW-slk001').locator('xpath=ancestor::section//h3')).toContainText('Listing build');
  });

  test('task detail panel: status, notes, prev/next, deep link', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./');
    await row(page, 'CA-PRE-020').locator('.task-open').click();
    await expect(panel(page)).toHaveClass(/open/);
    await expect(page).toHaveURL(/#CA-PRE-020$/);
    await expect(page.locator('#tpTitle')).toHaveText('Decide NPN basis');
    await expect(panel(page).locator('.facts')).toContainText('Regulatory / Compliance');
    await expect(panel(page).locator('.facts')).toContainText('90 days before launch');
    await expect(panel(page).locator('.facts')).toContainText('Gate 3: Go / No-Go');
    await expect(page.locator('#panelPos')).toHaveText(/^\d+ of 118$/);

    await panel(page).locator('[data-panel-status="blocked"]').click();
    await expect(row(page, 'CA-PRE-020')).toHaveAttribute('data-status', 'blocked');
    await expect(page.locator('#tpNote')).toBeFocused();
    await page.locator('#tpNote').fill('Waiting on manufacturer licence copy');
    await page.locator('#tpNote').blur();
    await expect(row(page, 'CA-PRE-020').locator('.note-input')).toHaveValue('Waiting on manufacturer licence copy');
    await expect(page.locator('[data-gate="3"]')).toHaveAttribute('data-state', 'risk');

    await page.locator('#panelCopyLink').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/#CA-PRE-020$/);

    await page.locator('#panelNext').click();
    await expect(page.locator('#tpTitle')).toHaveText('Build claims map from the NPN licence');
    await page.locator('#panelPrev').click();
    await expect(page.locator('#tpTitle')).toHaveText('Decide NPN basis');

    await page.keyboard.press('Escape');
    await expect(panel(page)).not.toHaveClass(/open/);
    await expect(page).not.toHaveURL(/#/);

    // Clicking a row outside its buttons also opens the panel.
    await row(page, 'CA-PRE-030').locator('.task-meta').click({ position: { x: 2, y: 2 } });
    await expect(page.locator('#tpTitle')).toHaveText('Define SKU structure');

    // A shared link opens straight into the task, switching market if needed.
    await page.goto('./#US-POST-203');
    await expect(panel(page)).toHaveClass(/open/);
    await expect(page.locator('#tpTitle')).toHaveText('Gate 4: turn PPC on only after correct images are live');
    await expect(page.locator('.market-tab[data-market="US"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('add, edit and remove a task', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('./');
    await page.getByRole('button', { name: 'Add task' }).click();
    await expect(page.locator('#taskFormModal')).toBeVisible();
    await page.locator('#taskFormSubmit').click();
    await expect(page.locator('#fTitleError')).toBeVisible();
    await page.locator('#fTitle').fill('Confirm 3PL has launch stock for website orders');
    await page.locator('#fDetail').fill('Check units at the 3PL and the office before go-live.');
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
    await expect(page.locator('#fBlocking')).toBeChecked();
    await page.locator('#taskFormSubmit').click();

    await expect(page.locator('#taskFormModal')).toBeHidden();
    await expect(page.locator('#toast')).toHaveText('Task added');
    await expect(rows(page)).toHaveCount(119);
    await expect(page.locator('#tpTitle')).toHaveText('Confirm 3PL has launch stock for website orders');
    const id = await page.evaluate(() => location.hash.slice(1));
    expect(id).toMatch(/^CA-NEW-[a-z0-9]{6}$/);
    await expect(row(page, id).locator('xpath=ancestor::section//h3')).toContainText('Production and inventory');
    await expect(row(page, id).locator('.pill.blocking')).toBeVisible();
    await expect(panel(page).locator('.origin-card a')).toHaveText(/Open link/);
    const caPreBlocking = await page.evaluate(() => [...window.CHECKLIST.CA, ...window.EXAMPLE_ITEMS]
      .filter(i => i.market === 'CA' && i.phase === 'pre' && i.blocking).length);
    await expect(page.locator('[data-gate="3"] .gate-count')).toHaveText(`0/${caPreBlocking + 1}`);

    await panel(page).getByRole('button', { name: 'Edit task' }).click();
    await expect(page.locator('#fMarket')).toBeDisabled();
    await expect(page.locator('#fTitle')).toHaveValue('Confirm 3PL has launch stock for website orders');
    await page.locator('#fTitle').fill('Confirm 3PL and office have launch stock');
    await page.locator('#taskFormSubmit').click();
    await expect(page.locator('#toast')).toHaveText('Task updated');
    await expect(row(page, id).locator('.task-open')).toHaveText('Confirm 3PL and office have launch stock');

    await page.reload();
    await expect(rows(page)).toHaveCount(119);
    await expect(panel(page)).toHaveClass(/open/);
    await expect(page.locator('#tpTitle')).toHaveText('Confirm 3PL and office have launch stock');

    await panel(page).getByRole('button', { name: 'Remove' }).click();
    await expect(panel(page).locator('.confirm-row')).toContainText('mark it N/A with a reason instead');
    await panel(page).getByRole('button', { name: 'Keep task' }).click();
    await panel(page).getByRole('button', { name: 'Remove' }).click();
    await panel(page).getByRole('button', { name: 'Remove task' }).click();
    await expect(page.locator('#toast')).toHaveText('Task removed');
    await expect(rows(page)).toHaveCount(118);
    await page.reload();
    await expect(rows(page)).toHaveCount(118);
    await expect(row(page, id)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('added task in the other market switches to it', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Add task' }).click();
    await page.locator('#fMarket').selectOption('US');
    await page.locator('#fPhase').selectOption('post');
    await expect(page.locator('#fSection option').first()).toHaveText('D1. Launch-day runbook (T0)');
    await page.locator('#fTitle').fill('Post launch recap in the channel');
    await page.locator('#fWhen').fill('T+1');
    await page.locator('#taskFormSubmit').click();
    await expect(page.locator('.market-tab[data-market="US"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(rows(page)).toHaveCount(107);
  });

  test('filters and grouping narrow and reorganise the list', async ({ page }) => {
    await page.goto('./');
    const expected = await page.evaluate(() => {
      const ca = [...window.CHECKLIST.CA, ...window.EXAMPLE_ITEMS.filter(e => e.market === 'CA')];
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
    await page.getByText('Blocking only', { exact: true }).click();
    await expect(rows(page)).toHaveCount(expected.blocking);
    await page.getByText('Blocking only', { exact: true }).click();
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
    await page.locator('#searchInput').fill('main image owner');
    await expect(rows(page)).toHaveCount(1);
    await page.locator('#searchInput').fill('zzzz no match');
    await expect(page.locator('.empty-state')).toHaveText('No tasks match these filters.');
  });

  test('one-click check and the status menu save and survive reload', async ({ page }) => {
    await page.goto('./');
    await row(page, 'CA-PRE-059').locator('.check').click();
    await expect(row(page, 'CA-PRE-059')).toHaveAttribute('data-status', 'done');
    await expect(panel(page)).not.toHaveClass(/open/);
    await expect(page.locator('#progressOverallText')).toHaveText('1 / 118');
    await expect(page.locator('[data-gate="1"] .gate-count')).toHaveText('1/2');

    await setStatus(page, 'CA-PRE-067', 'blocked');
    await expect(row(page, 'CA-PRE-067').locator('.note-input')).toBeFocused();
    await expect(page.locator('[data-gate="1"]')).toHaveAttribute('data-state', 'risk');
    await writeNote(page, 'CA-PRE-067', 'Waiting on final main image from Design');

    await row(page, 'CA-PRE-067').locator('.check').click();
    await expect(page.locator('[data-gate="1"]')).toHaveAttribute('data-state', 'pass');
    await expect(row(page, 'CA-PRE-067').locator('.note-snippet')).toContainText('Waiting on final main image');

    await setStatus(page, 'CA-PRE-002', 'na');
    await expect(row(page, 'CA-PRE-002').locator('.pill.warn')).toHaveText('Reason missing');
    await expect(page.locator('#progressOverallText')).toHaveText('2 / 118');
    await writeNote(page, 'CA-PRE-002', 'Relaunch; channel already exists');
    await expect(row(page, 'CA-PRE-002').locator('.pill.warn')).toHaveCount(0);
    await expect(page.locator('#progressOverallText')).toHaveText('3 / 118');

    await page.reload();
    await expect(row(page, 'CA-PRE-059')).toHaveAttribute('data-status', 'done');
    await expect(row(page, 'CA-PRE-002').locator('.note-input')).toHaveValue('Relaunch; channel already exists');
    await expect(page.locator('[data-gate="1"] .gate-pill')).toHaveText('Passed');
    await expect(page.locator('#progressOverallText')).toHaveText('3 / 118');
  });

  test('summary tiles filter the list and toggle off again', async ({ page }) => {
    await page.goto('./');
    await setStatus(page, 'CA-PRE-010', 'in_progress');
    await setStatus(page, 'CA-PRE-011', 'blocked');
    await row(page, 'CA-PRE-012').locator('.check').click();
    const { caBlocking } = await counts(page);
    await expect(page.locator('[data-stat="blocking"] .stat-value')).toHaveText(String(caBlocking - 1));
    await expect(page.locator('[data-stat="in_progress"] .stat-value')).toHaveText('1');
    await page.locator('[data-stat="blocked"]').click();
    await expect(rows(page)).toHaveCount(1);
    await page.locator('[data-stat="blocking"]').click();
    await expect(rows(page)).toHaveCount(caBlocking - 1);
    await page.locator('[data-stat="blocking"]').click();
    await expect(rows(page)).toHaveCount(118);
  });

  test('gate 3 needs every pre-launch blocking task, added ones included', async ({ page }) => {
    await page.goto('./');
    const { usPreBlockingIds } = await counts(page);
    expect(usPreBlockingIds).toContain('US-NEW-slk001');
    const withoutExample = usPreBlockingIds.filter(id => id !== 'US-NEW-slk001');
    await page.evaluate(ids => {
      const map = {};
      for (const id of ids) map[id] = { item_id: id, market: 'US', status: 'done', note: '', updated_at: new Date().toISOString() };
      localStorage.setItem('gate-board:status:v1', JSON.stringify(map));
    }, withoutExample);
    await page.reload();
    await page.getByRole('button', { name: 'USA', exact: true }).click();
    await expect(page.locator('[data-gate="3"]')).toHaveAttribute('data-state', 'pending');
    await row(page, 'US-NEW-slk001').locator('.check').click();
    await expect(page.locator('[data-gate="3"]')).toHaveAttribute('data-state', 'pass');
    await expect(page.locator('[data-gate="4"]')).toHaveAttribute('data-state', 'pending');
  });

  test('lessons, playbook and jump-to-item work', async ({ page }) => {
    await page.goto('./');
    await row(page, 'CA-PRE-086').getByRole('button', { name: 'Why this step exists' }).click();
    await expect(row(page, 'CA-PRE-086').locator('.lesson')).toContainText('preorder');
    await expect(panel(page)).not.toHaveClass(/open/);

    await page.getByRole('button', { name: 'Playbook' }).click();
    await expect(page.locator('#drawerBody')).toContainText('Launch Lead');
    await page.getByRole('button', { name: 'Lessons learned' }).click();
    await expect(page.locator('.lesson-card')).toHaveCount(25);
    await page.locator('.lesson-chip[data-jump="US-POST-203"]').first().click();
    await expect(page.locator('#playbookDrawer')).not.toHaveClass(/open/);
    await expect(page.locator('.market-tab[data-market="US"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(row(page, 'US-POST-203')).toBeInViewport();
  });

  test('groups collapse and stay collapsed; sidebar links jump to groups', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('./');
    await page.locator('.group-head').first().click();
    await expect(page.locator('.group').first()).toHaveClass(/collapsed/);
    await page.reload();
    await expect(page.locator('.group').first()).toHaveClass(/collapsed/);
    await page.locator('.group-link').last().click();
    await expect(page.locator('.group').last()).toBeInViewport();
  });

  test('copy outstanding produces the channel repost', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./');
    await setStatus(page, 'CA-PRE-020', 'blocked');
    await writeNote(page, 'CA-PRE-020', 'Manufacturer NPN licence copy');
    await page.getByRole('button', { name: 'Copy outstanding' }).click();
    await expect(page.locator('#toast')).toHaveText('Outstanding items copied');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('OUTSTANDING — CANADA (Amazon.ca)');
    expect(text).toContain('❌ CA-PRE-020');
    expect(text).toContain('blocker: Manufacturer NPN licence copy');
    expect(text).toContain('CA-NEW-slk001 Assign a main image owner');
    expect(text).toContain('Decisions needed (VERIFY): CA-PRE-052');
  });

  test('fits a phone screen, including the task panel and form', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    await expect(rows(page)).toHaveCount(118);
    await setStatus(page, 'CA-PRE-001', 'in_progress');
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    await row(page, 'CA-NEW-slk001').locator('.task-open').click();
    await expect(panel(page)).toBeInViewport();
    expect(await overflow()).toBeLessThanOrEqual(0);
    await page.keyboard.press('Escape');
    await page.locator('#addTaskBtn').click();
    await expect(page.locator('#taskForm')).toBeInViewport();
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
    launch_items: [{ id: 'CA-NEW-abc123', data: { id: 'CA-NEW-abc123', market: 'CA', phase: 'pre', section: 'A5. Production and inventory', when: 'T-10', owner: 'Ops / Inventory', scope: 'P', blocking: false, source: 'ADD', title: 'Task added by a teammate', detail: '', link: 'javascript:alert(1)', createdAt: '2026-09-20T00:00:00Z' } }],
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
    await page.route('**/config.js', r => r.fulfill({
      contentType: 'text/javascript',
      body: "window.GATE_BOARD_CONFIG = { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'anon-test' };",
    }));
  });

  test('loads, saves and receives live changes', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('./');
    await expect(page.locator('#connText')).toHaveText('Shared · live');
    await expect(page.locator('#setupNote')).toBeHidden();
    await expect(row(page, 'CA-PRE-001')).toHaveAttribute('data-status', 'done');
    await expect(row(page, 'CA-NEW-abc123').locator('.task-open')).toHaveText('Task added by a teammate');
    await expect(rows(page)).toHaveCount(119);

    await setStatus(page, 'CA-PRE-010', 'in_progress');
    await expect.poll(() => page.evaluate(() => window.__upserts.length)).toBe(1);
    const saved = await page.evaluate(() => window.__upserts[0]);
    expect(saved.table).toBe('launch_status');
    expect(saved.opts).toEqual({ onConflict: 'item_id' });
    expect(saved.rec).toMatchObject({ item_id: 'CA-PRE-010', market: 'CA', status: 'in_progress', note: '' });

    await page.evaluate(() => window.__emit.launch_status({ item_id: 'CA-PRE-011', market: 'CA', status: 'blocked', note: 'Flavour re-test pending', updated_at: new Date().toISOString() }));
    await expect(row(page, 'CA-PRE-011')).toHaveAttribute('data-status', 'blocked');
    await expect(row(page, 'CA-PRE-011').locator('.note-input')).toHaveValue('Flavour re-test pending');

    await page.evaluate(() => window.__emit.launch_items({ id: 'CA-NEW-zzz999', market: 'CA', data: { id: 'CA-NEW-zzz999', market: 'CA', phase: 'post', section: 'B2. First 14 days', when: 'T+2', owner: 'CX / Support', title: 'Live task from another viewer' } }));
    await expect(row(page, 'CA-NEW-zzz999').locator('.task-open')).toHaveText('Live task from another viewer');
    expect(errors).toEqual([]);
  });

  test('added tasks save to the shared table; unsafe links are dropped', async ({ page }) => {
    await page.goto('./');
    await row(page, 'CA-NEW-abc123').locator('.task-open').click();
    await expect(panel(page).locator('.origin-card')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Add task' }).click();
    await page.locator('#fTitle').fill('Shared added task');
    await page.locator('#taskFormSubmit').click();
    await expect.poll(() => page.evaluate(() => window.__upserts.filter(u => u.table === 'launch_items').length)).toBe(1);
    const saved = await page.evaluate(() => window.__upserts.find(u => u.table === 'launch_items'));
    expect(saved.opts).toEqual({ onConflict: 'id' });
    expect(saved.rec.id).toMatch(/^CA-NEW-[a-z0-9]{6}$/);
    expect(saved.rec.market).toBe('CA');
    expect(saved.rec.data).toMatchObject({ title: 'Shared added task', owner: 'Launch Lead', when: 'T-14' });
  });

  test('a failed save is undone and explained', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#connText')).toHaveText('Shared · live');
    await page.evaluate(() => { window.__failNext = true; });
    await row(page, 'CA-PRE-012').locator('.check').click();
    await expect(page.locator('#toast')).toHaveText('Not saved: permission denied');
    await expect(row(page, 'CA-PRE-012')).toHaveAttribute('data-status', 'not_started');

    await page.evaluate(() => { window.__failNext = true; });
    await page.getByRole('button', { name: 'Add task' }).click();
    await page.locator('#fTitle').fill('This one fails');
    await page.locator('#taskFormSubmit').click();
    await expect(page.locator('#toast')).toHaveText('Not saved: permission denied');
    await expect(rows(page)).toHaveCount(119);
  });

  test('live update does not wipe a note being typed', async ({ page }) => {
    await page.goto('./');
    await setStatus(page, 'CA-PRE-020', 'blocked');
    const note = row(page, 'CA-PRE-020').locator('.note-input');
    await note.click();
    await note.pressSequentially('Half typed');
    await page.evaluate(() => window.__emit.launch_status({ item_id: 'CA-PRE-021', market: 'CA', status: 'done', note: '', updated_at: new Date().toISOString() }));
    await expect(note).toHaveValue('Half typed');
    await expect(note).toBeFocused();
    await note.press('Enter');
    await expect(row(page, 'CA-PRE-021')).toHaveAttribute('data-status', 'done');

    await row(page, 'CA-PRE-030').locator('.task-open').click();
    await page.locator('#tpNote').click();
    await page.locator('#tpNote').pressSequentially('Panel note in progress');
    await page.evaluate(() => window.__emit.launch_status({ item_id: 'CA-PRE-031', market: 'CA', status: 'done', note: '', updated_at: new Date().toISOString() }));
    await expect(page.locator('#tpNote')).toHaveValue('Panel note in progress');
    await expect(page.locator('#tpNote')).toBeFocused();
  });
});

test('real Supabase library loads and an unreachable project is reported', async ({ page }) => {
  await page.route('**/config.js', r => r.fulfill({
    contentType: 'text/javascript',
    body: "window.GATE_BOARD_CONFIG = { supabaseUrl: 'http://127.0.0.1:9', supabaseAnonKey: 'anon-test' };",
  }));
  await page.goto('./');
  expect(await page.evaluate(() => typeof window.supabase.createClient)).toBe('function');
  await expect(page.locator('#connText')).toHaveText('Not connected', { timeout: 15000 });
  await expect(page.locator('#toast')).toContainText('Retrying in 15 seconds');
  await page.waitForTimeout(4000);
  await expect(page.locator('#connText')).toHaveText('Not connected');
  await expect(rows(page)).toHaveCount(118);
});
