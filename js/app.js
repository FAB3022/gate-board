(function () {
  const DATA = window.CHECKLIST;
  const EXAMPLES = window.EXAMPLE_ITEMS || [];
  const DEFAULT_PRODUCTS = window.DEFAULT_PRODUCTS || [];
  const MARKET_NAMES = { CA: 'CANADA (Amazon.ca)', US: 'USA (Amazon.com)' };
  const MARKET_TITLES = { CA: 'Canada launch', US: 'USA launch' };
  const MARKET_LONG = { CA: 'Canada · Amazon.ca', US: 'USA · Amazon.com' };

  // Gate 3 covers every pre-launch BLOCKING task, per the skill's shared foundation.
  const GATES = [
    { n: 1, name: 'Creative & Copy Freeze', when: 'T-14', ids: { CA: ['CA-PRE-059', 'CA-PRE-067'], US: ['US-PRE-065', 'US-PRE-066'] } },
    { n: 2, name: 'Compliance Sign-off', when: 'T-7', ids: { CA: ['CA-PRE-110'], US: ['US-PRE-100'] } },
    { n: 3, name: 'Go / No-Go', when: 'T-2', allPreBlocking: true },
    { n: 4, name: 'Launch-Day Image Gate', when: 'T0', ids: { CA: ['CA-POST-202'], US: ['US-POST-203'] } },
  ];

  const STATUSES = {
    not_started: { label: 'Not started', short: 'To do', icon: '⚪' },
    in_progress: { label: 'In progress', short: 'Doing', icon: '⏳' },
    blocked: { label: 'Blocked', short: 'Blocked', icon: '❌' },
    done: { label: 'Done', short: 'Done', icon: '✅' },
    na: { label: 'N/A', short: 'N/A', icon: '➖' },
  };
  const SOURCES = {
    OBS: { label: 'Proven practice', long: 'OBS: observed in past launches; this is how the team actually works.' },
    ADD: { label: 'Required addition', long: 'ADD: not seen in past launches but required for a complete, compliant launch.' },
    VERIFY: { label: 'Verify first', long: 'VERIFY: an assumption or regulatory/policy point. Confirm it against the current official source before relying on it.' },
  };
  const WHEN_OPTIONS = ['Weekly', 'T-120', 'T-90', 'T-75', 'T-60', 'T-45', 'T-30', 'T-21', 'T-14', 'T-7', 'T-3', 'T-2', 'T0', 'T+1', 'T+3', 'T+7', 'T+10', 'T+14', 'T+21', 'T+30'];

  const ICON = {
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    caret: '<svg class="caret" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    caretSm: '<svg class="caret-sm" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    ban: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    done: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4"/></svg>',
    slack: '<svg viewBox="0 0 24 24"><path d="M10 3a2 2 0 1 0 0 4h2V5a2 2 0 0 0-2-2zM3 10a2 2 0 0 0 2 2h5V10a2 2 0 0 0-4 0M14 21a2 2 0 1 0 0-4h-2v2a2 2 0 0 0 2 2zM21 14a2 2 0 0 0-2-2h-5v2a2 2 0 0 0 4 0"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>',
  };

  const ROLES = [
    ['Launch Lead', 'Launch channel, master checklist, kickoff, launch date, go/no-go call, huddles, announcements, retrospective'],
    ['Product Development', 'Formula/spec, taste and quality testing, flavour decisions'],
    ['Regulatory / Compliance', 'NPN basis and claims map (CA), FDA/DSHEA claims and disclaimers (US), label compliance, COA verification, Amazon compliance submissions'],
    ['Sourcing / Production', 'Manufacturer POs, production timeline, label and bottle orders, COAs and lab tests'],
    ['Ops / Inventory', 'SKU and barcode setup, inventory workflows and sheet, FBA capacity, shipments, check-in'],
    ['Design', 'Packaging, labels, renders, listing images, A+ (EBC), brand story, storefront assets, e-books, product PDFs'],
    ['Listings / Catalog', 'Listing creation, copy upload, backend attributes and search terms, variations, Vine listings, browse node/GL, flat files, Seller Support cases'],
    ['Keyword Research', 'Competitor file, Master Keyword List (MKL), Data Dive priority tags, rank radar'],
    ['Pricing / Finance', 'Launch price, List Price, promotions plan, COGS in MRP and inventory sheet, price tests'],
    ['PPC', 'Campaign build, keyword alignment, go-live, bid management, PPC reporting'],
    ['Brand / Traffic', 'External traffic 2-step URLs and traffic split, Brand Expand (BEX), storefront, MYE image tests'],
    ['Marketing', 'Meta ambassador ads, affiliate platform (Levanta)'],
    ['Outreach', 'Outreach scripts, agent onboarding, link testing'],
    ['Email / Retention', 'Klaviyo flows, Typeform triggers, n8n properties'],
    ['CX / Support', 'Onsite support portal, help centre (Gorgias), COA and e-book articles, refund/replacement workflows, FAQ answers, ticket QA'],
    ['Data / Tracking', 'Tracking sheets, Helium 10 automation and review requests, performance snapshots'],
  ];
  const ROLE_NAMES = ROLES.map(r => r[0]);
  const CADENCE = [
    ['T-90 to T-60', 'Kickoff: scope, SKU structure, regulatory basis, production timeline'],
    ['Weekly', 'Pre-launch sync and outstanding-items repost until T-7'],
    ['T-14', 'Gate 1: Creative & Copy Freeze'],
    ['T-7', 'Gate 2: Compliance Sign-off'],
    ['T-3', 'Copy and images uploaded to Amazon (processing buffer)'],
    ['T-2', 'Gate 3: Go / No-Go readiness review'],
    ['T0', 'Gate 4 image check, launch-day runbook, check-in huddle, "live" announcement'],
    ['T+1 to T+3', 'Daily status: PDP, indexing, PPC delivery, suppressions'],
    ['T+7', 'Week-1 performance snapshot'],
    ['Every ~5 days', 'Refreshed snapshot until T+30'],
    ['T+30', 'Decision review (scale / hold / fix), retrospective, hand over'],
  ];
  const TOOLS = [
    ['Seller Central', 'Listings, Vine, cases, compliance docs (per marketplace)'],
    ['Flat file upload', 'Bulk or stuck listing updates'],
    ['Data Dive', 'Keyword research, MKL, rank radar, listing builder'],
    ['Helium 10', 'Review requests, negative-ASIN automation, product PDFs, rank data'],
    ['MRP', 'COGS, PPC data, early sales data'],
    ['Amplify room', 'Launch performance snapshot'],
    ['Pixelfy / Bitly', 'External traffic 2-step URLs (Notion links page per marketplace)'],
    ['Levanta', 'Affiliate (active ASINs only)'],
    ['Klaviyo, n8n, Typeform', 'Email flows and triggers'],
    ['Onsite / Gorgias', 'Support portal and knowledge base'],
    ['Figma / Google Drive', 'Design reviews; final files'],
    ['Notion', 'Product list and product info'],
  ];

  const lessonsById = {};
  for (const l of DATA.lessons) for (const id of l.ids) (lessonsById[id] = lessonsById[id] || []).push(l);

  const BUILTIN = {};
  for (const mk of ['CA', 'US']) {
    BUILTIN[mk] = DATA[mk].map(it => {
      const [title, detail] = splitTask(it.task);
      return { ...it, title, detail, custom: false };
    });
  }

  const savedView = readLocal('gate-board:view:v1', {});
  const state = {
    market: 'CA',
    view: { CA: typeof savedView.CA === 'string' ? savedView.CA : 'all', US: typeof savedView.US === 'string' ? savedView.US : 'all' },
    phase: 'all',
    status: 'all',
    owner: 'all',
    groupBy: 'section',
    blockingOnly: false,
    search: '',
    matrixOpenOnly: true,
    records: {},
    customRaw: {},
    productRaw: {},
    openLessons: new Set(),
    collapsed: new Set(readLocal('gate-board:collapsed:v2', [])),
    panelKey: null,
    editingId: null,
    editingProductId: null,
    confirmRemove: false,
  };
  for (const ex of EXAMPLES) state.customRaw[ex.id] = ex;
  for (const p of DEFAULT_PRODUCTS) state.productRaw[p.id] = p;
  let ITEMS = { CA: [], US: [] };
  let PRODUCTS = { CA: [], US: [] };
  let itemById = {};
  let productById = {};
  let store = null;
  let pendingRender = false;
  let loaded = false;
  let menuFor = null;

  const $ = id => document.getElementById(id);

  function readLocal(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function writeLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

  // "Verify PDP: title, bullets…" → title "Verify PDP", detail "Title, bullets…"
  function splitTask(task) {
    const colon = task.match(/^(.{6,70}?):\s+(.+)$/);
    if (colon && !/^Gate \d$/.test(colon[1])) return [colon[1], capitalize(colon[2])];
    const semi = task.indexOf('; ');
    if (semi > 0 && semi < 110) return [task.slice(0, semi), capitalize(task.slice(semi + 2))];
    return [task, ''];
  }
  function initials(owner) {
    const words = owner.split(/[\s/]+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  function hue(owner) {
    let h = 0;
    for (const c of owner) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }
  function offset(when) {
    const m = String(when).replace(/\s/g, '').match(/^T([+-]\d+|0)$/);
    return m ? Number(m[1]) : -999;
  }
  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  function formatDay(ymd) {
    const d = new Date(ymd + 'T12:00:00');
    if (isNaN(d)) return ymd;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function randomChars(n) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return [...bytes].map(b => chars[b % 36]).join('');
  }
  function ringSvg(fraction) {
    const c = 2 * Math.PI * 22;
    return `<svg viewBox="0 0 54 54" aria-hidden="true"><circle class="bg" cx="27" cy="27" r="22"/><circle class="fg" cx="27" cy="27" r="22" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - fraction)}"/></svg>`;
  }
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  function sanitizeOrigin(o) {
    if (!o || typeof o !== 'object') return null;
    return {
      type: o.type === 'slack' ? 'slack' : 'other',
      channel: str(o.channel, 80),
      date: /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : '',
      summary: str(o.summary, 1200),
    };
  }
  const safeLink = v => (/^https:\/\/[^\s"'<>]+$/i.test(str(v, 500)) ? str(v, 500) : '');

  // Added tasks and products can come from other viewers (shared mode), so every field is checked before use.
  function sanitizeCustom(raw) {
    if (!raw || typeof raw !== 'object' || raw.removed) return null;
    const id = String(raw.id || '');
    if (!/^(CA|US)-NEW-[a-z0-9]{6}$/.test(id)) return null;
    const title = str(raw.title, 200);
    if (!title) return null;
    return {
      id,
      market: id.slice(0, 2),
      phase: raw.phase === 'post' ? 'post' : 'pre',
      section: str(raw.section, 120) || 'Added tasks',
      when: /^(T([+-]\d{1,3}|0)|Weekly)$/.test(raw.when) ? raw.when : 'T0',
      owner: str(raw.owner, 60) || 'Launch Lead',
      scope: raw.scope === 'L' ? 'L' : 'P',
      blocking: raw.blocking === true,
      source: SOURCES[raw.source] ? raw.source : 'ADD',
      title,
      detail: str(raw.detail, 1000),
      task: title,
      link: safeLink(raw.link),
      origin: sanitizeOrigin(raw.origin),
      createdAt: str(raw.createdAt, 40),
      custom: true,
    };
  }
  function sanitizeProduct(raw) {
    if (!raw || typeof raw !== 'object' || raw.removed) return null;
    const id = String(raw.id || '');
    if (!/^[a-z0-9]{6}$/.test(id) || !['CA', 'US'].includes(raw.market)) return null;
    const name = str(raw.name, 80);
    if (!name) return null;
    return {
      id,
      market: raw.market,
      name,
      flavour: str(raw.flavour, 60),
      format: str(raw.format, 60),
      size: str(raw.size, 60),
      asin: /^[A-Z0-9]{10}$/.test(str(raw.asin, 10)) ? str(raw.asin, 10) : '',
      sku: str(raw.sku, 60),
      notes: str(raw.notes, 500),
      origin: sanitizeOrigin(raw.origin),
      link: safeLink(raw.link),
      order: Number.isFinite(raw.order) ? raw.order : 999,
      createdAt: str(raw.createdAt, 40),
    };
  }

  function rebuildItems() {
    const customs = Object.values(state.customRaw).map(sanitizeCustom).filter(Boolean)
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '') || a.id.localeCompare(b.id));
    const next = {};
    for (const mk of ['CA', 'US']) {
      const mine = customs.filter(c => c.market === mk);
      const lastIndex = {};
      BUILTIN[mk].forEach((it, i) => { lastIndex[it.section] = i; });
      const list = [];
      BUILTIN[mk].forEach((it, i) => {
        list.push(it);
        if (lastIndex[it.section] === i) list.push(...mine.filter(c => c.section === it.section));
      });
      list.push(...mine.filter(c => lastIndex[c.section] === undefined));
      next[mk] = list;
    }
    ITEMS = next;
    itemById = {};
    for (const mk of ['CA', 'US']) for (const it of ITEMS[mk]) itemById[it.id] = it;
  }
  function rebuildProducts() {
    const all = Object.values(state.productRaw).map(sanitizeProduct).filter(Boolean)
      .sort((a, b) => a.order - b.order || (a.createdAt || '').localeCompare(b.createdAt || '') || a.id.localeCompare(b.id));
    PRODUCTS = { CA: all.filter(p => p.market === 'CA'), US: all.filter(p => p.market === 'US') };
    productById = {};
    for (const p of all) productById[p.id] = p;
    for (const mk of ['CA', 'US']) {
      if (state.view[mk] !== 'all' && !PRODUCTS[mk].some(p => p.id === state.view[mk])) state.view[mk] = 'all';
    }
  }

  function sectionsFor(market, phase) {
    return [...new Set(BUILTIN[market].filter(it => it.phase === phase).map(it => it.section))];
  }

  // ---------- Units: a task for one product, or a once-per-launch task ----------

  function view() { return state.view[state.market]; }
  function unitKey(item, pid) { return item.scope === 'P' ? `${item.id}:${pid}` : item.id; }
  function parseKey(key) {
    const [id, pid] = String(key).split(':');
    const item = itemById[id];
    if (!item) return null;
    if (item.scope === 'P') {
      const product = productById[pid];
      if (!product || product.market !== item.market) return null;
      return { key: `${id}:${pid}`, item, product };
    }
    return { key: id, item, product: null };
  }
  function unitsFor(market, v) {
    const pids = v === 'all' ? PRODUCTS[market].map(p => p.id) : [v];
    const out = [];
    for (const item of ITEMS[market]) {
      if (item.scope === 'L') out.push({ key: item.id, item, product: null });
      else for (const pid of pids) out.push({ key: `${item.id}:${pid}`, item, product: productById[pid] });
    }
    return out;
  }

  function statusOf(key) {
    const r = state.records[key];
    return r && STATUSES[r.status] ? r.status : 'not_started';
  }
  function noteOf(key) {
    const r = state.records[key];
    return (r && typeof r.note === 'string' && r.note) || '';
  }
  // N/A only counts once a reason is recorded (skill rule: "N/A items carry a reason").
  function isComplete(key) {
    const s = statusOf(key);
    return s === 'done' || (s === 'na' && noteOf(key).trim() !== '');
  }

  function gateItemIds(gate, market) {
    if (gate.allPreBlocking) return ITEMS[market].filter(it => it.phase === 'pre' && it.blocking).map(it => it.id);
    return gate.ids[market];
  }
  function gatesForItem(item) {
    return GATES.filter(g => gateItemIds(g, item.market).includes(item.id));
  }
  function gateState(gate, market, v) {
    const ids = new Set(gateItemIds(gate, market));
    const units = unitsFor(market, v).filter(u => ids.has(u.item.id));
    const done = units.filter(u => isComplete(u.key)).length;
    let s = 'pending';
    if (units.some(u => statusOf(u.key) === 'blocked')) s = 'risk';
    else if (done === units.length) s = 'pass';
    return { state: s, done, total: units.length };
  }
  function summaryOf(units) {
    const done = units.filter(u => isComplete(u.key)).length;
    const blocking = units.filter(u => u.item.blocking);
    return {
      total: units.length,
      done,
      pct: units.length ? Math.round((done / units.length) * 100) : 0,
      blockingTotal: blocking.length,
      blockingOpen: blocking.filter(u => !isComplete(u.key)).length,
      blocked: units.filter(u => statusOf(u.key) === 'blocked').length,
      inProgress: units.filter(u => statusOf(u.key) === 'in_progress').length,
      doneOnly: units.filter(u => statusOf(u.key) === 'done').length,
    };
  }
  function nextGate(market, v) {
    for (const g of GATES) {
      const gs = gateState(g, market, v);
      if (gs.state !== 'pass') return { g, gs };
    }
    return null;
  }

  // ---------- Header, product bar, sidebar ----------

  function renderProductBar() {
    const products = PRODUCTS[state.market];
    const allSum = summaryOf(unitsFor(state.market, 'all'));
    const chip = (v, label, sum, icon, full) => `<button type="button" class="product-chip" data-view="${esc(v)}" aria-pressed="${view() === v}"${full ? ` title="${esc(full)}"` : ''}>
        ${icon || ''}<span>${esc(label)}</span>
        <span class="chip-bar"><span style="width:${sum.pct}%"></span></span><span class="chip-pct">${sum.pct}%</span>
        ${sum.blocked ? `<span class="chip-blocked" title="${sum.blocked} blocked"></span>` : ''}
      </button>`;
    $('productChips').innerHTML = chip('all', `All products (${products.length})`, allSum, ICON.grid) +
      '<span class="chip-divider" aria-hidden="true"></span>' +
      products.map(p => chip(p.id, p.flavour || p.name, summaryOf(unitsFor(state.market, p.id)), '', p.name)).join('') +
      `<button type="button" class="product-chip add-chip" id="addProductBtn" data-add-product>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Add product</span>
      </button>`;
    $('brandSub').textContent = `Nutratology · ${MARKET_LONG[state.market]} · ${products.length} product${products.length === 1 ? '' : 's'}`;
  }

  function renderGates() {
    $('gateStrip').innerHTML = GATES.map(g => {
      const gs = gateState(g, state.market, view());
      const label = gs.state === 'pass' ? 'Passed' : gs.state === 'risk' ? 'At risk' : 'Pending';
      const icon = gs.state === 'pass' ? ICON.check : gs.state === 'risk' ? '!' : g.n;
      return `<li class="gate" data-gate="${g.n}" data-state="${gs.state}">
        <span class="gate-icon">${icon}</span>
        <div>
          <div class="gate-name">${esc(g.name)}</div>
          <div class="gate-sub mono">${g.when} · <span class="gate-count">${gs.done}/${gs.total}</span> ready</div>
        </div>
        <span class="gate-pill ${gs.state}">${label}</span>
      </li>`;
    }).join('');
  }

  function renderSummary() {
    const v = view();
    const sum = summaryOf(unitsFor(state.market, v));
    const circumference = 2 * Math.PI * 50;
    const ring = $('ringFg');
    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference * (1 - (sum.total ? sum.done / sum.total : 0)));
    $('ringPct').textContent = sum.pct + '%';
    $('readinessTitle').textContent = v === 'all' ? MARKET_TITLES[state.market] : productById[v].name;
    $('progressOverallText').textContent = `${sum.done} / ${sum.total}`;
    $('progressBlockText').textContent = `${sum.blockingTotal - sum.blockingOpen} / ${sum.blockingTotal}`;
    $('progressBlockFill').style.width = (sum.blockingTotal ? Math.round(((sum.blockingTotal - sum.blockingOpen) / sum.blockingTotal) * 100) : 0) + '%';
    if (v === 'all') return;

    const tiles = [
      { key: 'blocking', label: 'Blocking open', value: sum.blockingOpen, hint: `of ${sum.blockingTotal} blocking tasks`, color: 'var(--blocked)', soft: 'var(--blocked-soft)', icon: ICON.lock },
      { key: 'blocked', label: 'Blocked', value: sum.blocked, hint: 'need a decision or input', color: 'var(--blocked)', soft: 'var(--blocked-soft)', icon: ICON.ban },
      { key: 'in_progress', label: 'In progress', value: sum.inProgress, hint: 'being worked on', color: 'var(--progress)', soft: 'var(--progress-soft)', icon: ICON.clock },
      { key: 'done', label: 'Done', value: sum.doneOnly, hint: `of ${sum.total} tasks`, color: 'var(--done)', soft: 'var(--done-soft)', icon: ICON.done },
    ];
    const activeKey = state.blockingOnly && state.status === 'open' ? 'blocking'
      : !state.blockingOnly && ['blocked', 'in_progress', 'done'].includes(state.status) ? state.status : null;
    $('stats').innerHTML = tiles.map(t => `
      <button type="button" class="stat${t.key === activeKey ? ' active' : ''}" data-stat="${t.key}" style="--stat-color:${t.color};--stat-soft:${t.soft}" aria-pressed="${t.key === activeKey}">
        <span class="stat-top"><span class="stat-icon">${t.icon}</span>${t.label}</span>
        <span class="stat-value">${t.value}</span>
        <span class="stat-hint">${t.hint}</span>
      </button>`).join('');
  }

  function renderOwnerFilter() {
    const owners = [...new Set(ITEMS[state.market].map(it => it.owner))].sort();
    if (!owners.includes(state.owner)) state.owner = 'all';
    $('ownerFilter').innerHTML = `<option value="all">All</option>` +
      owners.map(o => `<option value="${esc(o)}"${o === state.owner ? ' selected' : ''}>${esc(o)}</option>`).join('');
  }

  // ---------- Product view: task list ----------

  function matches(u) {
    const it = u.item;
    if (state.phase !== 'all' && it.phase !== state.phase) return false;
    if (state.blockingOnly && !it.blocking) return false;
    if (state.owner !== 'all' && it.owner !== state.owner) return false;
    if (state.status === 'open' && isComplete(u.key)) return false;
    if (state.status !== 'all' && state.status !== 'open' && statusOf(u.key) !== state.status) return false;
    if (state.search) {
      const hay = `${it.id} ${it.title} ${it.detail} ${it.owner} ${it.section}`.toLowerCase();
      if (!hay.includes(state.search)) return false;
    }
    return true;
  }

  function groupKeyOf(it) {
    if (state.groupBy === 'timeline') return it.when;
    if (state.groupBy === 'owner') return it.owner;
    return it.section;
  }
  function groupLabel(key) {
    if (state.groupBy === 'section') {
      const m = key.match(/^([A-D]\d+)\.\s+(.*)$/);
      return m ? { code: m[1], title: m[2] } : { code: '', title: key };
    }
    if (state.groupBy === 'timeline') {
      if (key === 'Weekly') return { code: '', title: 'Every week until T-7' };
      const gate = GATES.find(g => g.when === key);
      const phase = offset(key) < 0 ? 'before launch' : offset(key) === 0 ? 'launch day' : 'after launch';
      return { code: key, title: gate ? `Gate ${gate.n}: ${gate.name}` : capitalize(phase) };
    }
    return { code: '', title: key };
  }
  function orderedGroups(units) {
    const keys = [...new Set(units.map(u => groupKeyOf(u.item)))];
    if (state.groupBy === 'timeline') keys.sort((a, b) => offset(a) - offset(b));
    if (state.groupBy === 'owner') keys.sort();
    return keys;
  }
  function visibleUnits() {
    if (view() === 'all') return [];
    const units = unitsFor(state.market, view()).filter(matches);
    const out = [];
    for (const key of orderedGroups(units)) out.push(...units.filter(u => groupKeyOf(u.item) === key));
    return out;
  }

  function taskHtml(u) {
    const it = u.item;
    const key = u.key;
    const status = statusOf(key);
    const note = noteOf(key);
    const lessons = lessonsById[it.id];
    const showNote = status === 'blocked' || status === 'na';
    const placeholder = status === 'na' ? 'Why this does not apply (required)' : 'What is blocking this, and which role needs to act?';
    const lessonOpen = lessons && state.openLessons.has(key);
    return `<article class="task${state.panelKey === key ? ' selected' : ''}" id="row-${key}" data-key="${key}" data-status="${status}">
      <button type="button" class="check" data-check="${key}" aria-label="${status === 'done' ? 'Mark not started' : 'Mark done'}: ${it.id}" aria-pressed="${status === 'done'}">${ICON.check}</button>
      <div class="task-body">
        <div class="task-title"><button type="button" class="task-open" data-open="${key}">${esc(it.title)}</button></div>
        ${it.detail ? `<div class="task-detail">${esc(it.detail)}</div>` : ''}
        <div class="task-meta">
          <span class="owner"><span class="avatar" style="--h:${hue(it.owner)}">${esc(initials(it.owner))}</span>${esc(it.owner)}</span>
          <span class="pill mono">${esc(it.when)}</span>
          ${it.blocking ? `<span class="pill blocking">${ICON.lock}Blocking</span>` : ''}
          ${it.scope === 'L' ? `<span class="pill launch-wide" title="One status shared by every product in this launch">${ICON.users}Launch-wide</span>` : ''}
          ${it.custom ? '<span class="pill added">Added</span>' : ''}
          ${it.origin && it.origin.type === 'slack' ? `<span class="pill slack">${ICON.slack}From Slack</span>` : ''}
          ${it.source === 'VERIFY' ? '<span class="pill src-pill-VERIFY">Verify first</span>' : ''}
          ${it.source === 'ADD' ? '<span class="pill src-pill-ADD">Required addition</span>' : ''}
          ${status === 'na' && !note.trim() ? `<span class="pill warn">${ICON.alert}Reason missing</span>` : ''}
          <span class="task-id mono" title="Checklist ID"><span class="src-dot src-${it.source}"></span> ${it.id}</span>
          ${lessons ? `<button type="button" class="link-btn" data-lesson="${key}" aria-expanded="${lessonOpen}">${ICON.bulb}Why this step exists</button>` : ''}
        </div>
        ${showNote ? `<input type="text" class="note-input" data-key="${key}" maxlength="1000" placeholder="${placeholder}" value="${esc(note)}" aria-label="Note for ${it.id}">` : ''}
        ${!showNote && note ? `<div class="note-snippet">${ICON.note}<span>${esc(note)}</span></div>` : ''}
        ${lessonOpen ? lessons.map(lessonHtml).join('') : ''}
      </div>
      <div class="status-cell">
        <button type="button" class="status-btn st-${status}" data-menu="${key}" aria-haspopup="menu" aria-label="Status for ${it.id}: ${STATUSES[status].label}">
          <span class="st-dot"></span><span class="st-label">${STATUSES[status].label}</span>${ICON.caretSm}
        </button>
      </div>
    </article>`;
  }
  function lessonHtml(l) {
    return `<div class="lesson">
      <div class="l-head">Lesson ${l.n}: ${esc(l.what)}</div>
      <div class="l-row"><b>Impact:</b> ${esc(l.impact)}</div>
      <div class="l-row l-ctrl"><b>Control:</b> ${esc(l.control)}</div>
    </div>`;
  }

  function renderList() {
    const all = unitsFor(state.market, view());
    const units = all.filter(matches);
    $('resultCount').textContent = `Showing ${units.length} of ${all.length} tasks for ${productById[view()].name}`;
    $('navTitle').textContent = { section: 'Workstreams', timeline: 'Timeline', owner: 'Owners' }[state.groupBy];
    if (!units.length) {
      $('sections').innerHTML = '<div class="empty-state">No tasks match these filters.</div>';
      $('groupNav').innerHTML = '';
      return;
    }
    const keys = orderedGroups(units);
    const allKeys = orderedGroups(all);
    $('groupNav').innerHTML = allKeys.map(key => {
      const members = all.filter(u => groupKeyOf(u.item) === key);
      const done = members.filter(u => isComplete(u.key)).length;
      const blocked = members.filter(u => statusOf(u.key) === 'blocked').length;
      const lbl = groupLabel(key);
      const idx = keys.indexOf(key);
      return `<button type="button" class="group-link${blocked ? ' has-blocked' : ''}" data-goto="${idx}" ${idx < 0 ? 'disabled' : ''}>
        <span class="gl-name">${lbl.code ? `<span class="mono">${esc(lbl.code)}</span> ` : ''}${esc(lbl.title)}</span>
        <span class="gl-count mono">${blocked ? `${blocked} blocked` : `${done}/${members.length}`}</span>
        <span class="gl-bar"><span style="width:${Math.round((done / members.length) * 100)}%"></span></span>
      </button>`;
    }).join('');

    $('sections').innerHTML = keys.map((key, idx) => {
      const members = all.filter(u => groupKeyOf(u.item) === key);
      const shown = units.filter(u => groupKeyOf(u.item) === key);
      const done = members.filter(u => isComplete(u.key)).length;
      const blocked = members.filter(u => statusOf(u.key) === 'blocked').length;
      const ckey = `${state.market}::${state.groupBy}::${key}`;
      const collapsed = state.collapsed.has(ckey);
      const lbl = groupLabel(key);
      return `<section class="group${collapsed ? ' collapsed' : ''}" id="grp-${idx}">
        <button type="button" class="group-head" data-collapse="${esc(ckey)}" aria-expanded="${!collapsed}">
          <h3>${lbl.code ? `<span class="mono muted">${esc(lbl.code)}</span> ` : ''}${esc(lbl.title)}</h3>
          <span class="group-meta">
            ${blocked ? `<span class="group-blocked">${blocked} blocked</span>` : ''}
            <span class="group-bar"><span style="width:${Math.round((done / members.length) * 100)}%"></span></span>
            <span class="group-count mono">${done}/${members.length}</span>
            ${ICON.caret}
          </span>
        </button>
        <div class="group-body">${shown.map(taskHtml).join('')}</div>
      </section>`;
    }).join('');
  }

  // ---------- Overview: all products ----------

  function productMeta(p) {
    return [p.flavour, p.format, p.size].filter(Boolean).join(' · ');
  }

  function renderOverview() {
    const products = PRODUCTS[state.market];
    const launchUnits = unitsFor(state.market, 'all').filter(u => u.item.scope === 'L');
    const ls = summaryOf(launchUnits);
    const card = p => {
      const s = summaryOf(unitsFor(state.market, p.id));
      const ng = nextGate(state.market, p.id);
      return `<article class="p-card" data-product-card="${p.id}">
        <div class="p-card-top">
          <div class="p-ring">${ringSvg(s.total ? s.done / s.total : 0)}<span>${s.pct}%</span></div>
          <div>
            <div class="p-name">${esc(p.name)}</div>
            <div class="p-meta">${esc(productMeta(p) || 'No details yet')}</div>
          </div>
        </div>
        <div class="p-stats">
          <div class="p-stat"><b>${s.blockingOpen}</b><span>Blocking open</span></div>
          <div class="p-stat${s.blocked ? ' bad' : ''}"><b>${s.blocked}</b><span>Blocked</span></div>
          <div class="p-stat"><b>${s.done}/${s.total}</b><span>Complete</span></div>
        </div>
        <div class="p-gate">${ng ? `Next: Gate ${ng.g.n} ${esc(ng.g.name)} · <span class="mono">${ng.gs.done}/${ng.gs.total}</span>${ng.gs.state === 'risk' ? ' <span class="gate-pill risk">At risk</span>' : ''}` : '<span class="gate-pill pass">All gates passed</span>'}</div>
        <div class="p-actions">
          <button type="button" class="btn btn-sm btn-primary" data-view="${p.id}">Open tasks</button>
          <button type="button" class="btn btn-sm" data-edit-product="${p.id}">Edit</button>
        </div>
      </article>`;
    };

    const perProduct = ITEMS[state.market].filter(it => it.scope === 'P');
    let rowsHtml = '';
    let lastSection = null;
    let shownCount = 0;
    for (const it of perProduct) {
      const keys = products.map(p => `${it.id}:${p.id}`);
      if (state.matrixOpenOnly && keys.every(isComplete)) continue;
      if (it.section !== lastSection) {
        lastSection = it.section;
        rowsHtml += `<tr class="sec-row"><td colspan="${products.length + 1}">${esc(it.section)}</td></tr>`;
      }
      shownCount++;
      rowsHtml += `<tr data-matrix-row="${it.id}">
        <td class="t-cell">
          <div class="t-title">${esc(it.title)}</div>
          <div class="t-sub"><span class="mono">${it.id}</span><span>${esc(it.owner)}</span><span class="mono">${esc(it.when)}</span>${it.blocking ? `<span class="pill blocking">${ICON.lock}Blocking</span>` : ''}</div>
        </td>
        ${products.map(p => {
          const k = `${it.id}:${p.id}`;
          const s = statusOf(k);
          return `<td class="cell"><button type="button" class="cell-btn st-${s}" data-open="${k}" aria-label="${esc(p.name)}: ${STATUSES[s].label}"><span class="st-dot"></span>${STATUSES[s].short}</button></td>`;
        }).join('')}
      </tr>`;
    }

    $('overview').innerHTML = `
      <div class="ov-head">
        <div>
          <h2>${MARKET_TITLES[state.market]} · ${products.length} product${products.length === 1 ? '' : 's'}</h2>
          <p>Per-product tasks are tracked separately for each product. Once-per-launch tasks share one status.</p>
        </div>
        <button type="button" class="btn btn-primary" data-add-product>${ICON.box}<span>Add product</span></button>
      </div>
      <div class="product-cards">
        ${products.map(card).join('')}
        <article class="p-card launch-wide" data-product-card="launch">
          <div class="p-card-top">
            <div class="p-ring">${ringSvg(ls.total ? ls.done / ls.total : 0)}<span>${ls.pct}%</span></div>
            <div>
              <div class="p-name">Launch-wide tasks</div>
              <div class="p-meta">Shared by every product: channel, kickoff, compliance sign-off, go/no-go…</div>
            </div>
          </div>
          <div class="p-stats">
            <div class="p-stat"><b>${ls.blockingOpen}</b><span>Blocking open</span></div>
            <div class="p-stat${ls.blocked ? ' bad' : ''}"><b>${ls.blocked}</b><span>Blocked</span></div>
            <div class="p-stat"><b>${ls.done}/${ls.total}</b><span>Complete</span></div>
          </div>
          <div class="p-gate">They appear in every product's task list with a "Launch-wide" tag.</div>
        </article>
      </div>
      <section class="matrix-card">
        <div class="matrix-head">
          <div>
            <h3>Compare products</h3>
            <p>Status of each per-product task across products. Click a status to open that task for that product.</p>
          </div>
          <div class="segmented" role="group" aria-label="Rows">
            <button type="button" data-matrix="open" class="${state.matrixOpenOnly ? 'active' : ''}">Not done everywhere</button>
            <button type="button" data-matrix="all" class="${state.matrixOpenOnly ? '' : 'active'}">All tasks</button>
          </div>
        </div>
        <div class="matrix-scroll">
          ${shownCount ? `<table class="matrix">
            <thead><tr><th>Task</th>${products.map(p => `<th class="p-col"><button type="button" data-view="${p.id}">${esc(p.flavour || p.name)}</button></th>`).join('')}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>` : '<div class="empty-inline">Every per-product task is done for every product.</div>'}
        </div>
      </section>`;
  }

  // ---------- Task panel (item-level view) ----------

  function panelNoteHint(key) {
    const s = statusOf(key);
    if (s === 'na' && !noteOf(key).trim()) return { cls: 'warn', text: 'N/A only counts as done once a reason is written here.' };
    if (s === 'na') return { cls: '', text: 'This reason is shown to everyone viewing the dashboard.' };
    if (s === 'blocked') return { cls: 'warn', text: 'Say what is needed and which role has to act. This shows in the outstanding-items post.' };
    return { cls: '', text: 'Notes are visible to everyone viewing this dashboard.' };
  }

  function renderPanel() {
    const u = state.panelKey && parseKey(state.panelKey);
    if (!u) return;
    const { item: it, product, key } = u;
    const status = statusOf(key);
    const note = noteOf(key);
    const rec = state.records[key];
    const gates = gatesForItem(it);
    const lessons = lessonsById[it.id] || [];
    const hint = panelNoteHint(key);
    const order = visibleUnits();
    const pos = order.findIndex(x => x.key === key);
    $('panelPrev').disabled = pos <= 0;
    $('panelNext').disabled = pos < 0 || pos >= order.length - 1;
    $('panelPos').textContent = pos >= 0 ? `${pos + 1} of ${order.length}` : '';

    const origin = it.origin;
    const originHtml = origin || it.link ? `<div class="tp-section">
        <span class="tp-label">${origin && origin.type === 'slack' ? 'Source' : 'Link'}</span>
        <div class="origin-card">
          ${origin ? `<div class="o-head">${origin.type === 'slack' ? ICON.slack : ICON.note}${origin.type === 'slack' ? 'From Slack' : 'Added'}${origin.channel ? ` · ${esc(origin.channel)}` : ''}${origin.date ? ` · ${esc(formatDay(origin.date))}` : ''}</div>` : ''}
          ${origin && origin.summary ? `<p>${esc(origin.summary)}</p>` : ''}
          ${it.link ? `<a href="${esc(it.link)}" target="_blank" rel="noopener noreferrer">${origin && origin.type === 'slack' ? 'Open Slack thread' : 'Open link'} ${ICON.ext}</a>` : ''}
        </div>
      </div>` : '';

    const others = it.scope === 'P' ? PRODUCTS[it.market].map(p => {
      const k = `${it.id}:${p.id}`;
      const s = statusOf(k);
      return `<button type="button" class="other-product${k === key ? ' current' : ''}" data-open="${k}">
        <span>${esc(p.name)}</span><span class="cell-btn st-${s}"><span class="st-dot"></span>${STATUSES[s].label}</span>
      </button>`;
    }).join('') : '';

    $('panelBody').innerHTML = `
      <div class="tp-chips">
        <span class="tp-market ${it.market}">${MARKET_LONG[it.market]}</span>
        ${product ? `<span class="tp-product">${ICON.box} ${esc(product.name)}</span>` : `<span class="pill launch-wide">${ICON.users}Launch-wide</span>`}
        <span class="task-id mono"><span class="src-dot src-${it.source}"></span> ${it.id}</span>
        ${it.blocking ? `<span class="pill blocking">${ICON.lock}Blocking</span>` : ''}
        ${it.custom ? '<span class="pill added">Added</span>' : ''}
        ${origin && origin.type === 'slack' ? `<span class="pill slack">${ICON.slack}From Slack</span>` : ''}
      </div>
      <h2 class="tp-title" id="tpTitle">${esc(it.title)}</h2>
      ${it.detail ? `<p class="tp-detail">${esc(it.detail)}</p>` : ''}
      ${product ? '' : '<p class="tp-shared">This task is done once for the whole launch. Its status is shared by every product.</p>'}

      <div class="tp-section">
        <span class="tp-label">Status${product ? ` for ${esc(product.name)}` : ''}</span>
        <div class="status-choices" role="group" aria-label="Status">
          ${Object.entries(STATUSES).map(([v, m]) => `<button type="button" class="status-choice st-${v}" data-panel-status="${v}" aria-pressed="${v === status}"><span class="st-dot"></span>${m.label}</button>`).join('')}
        </div>
      </div>

      <div class="tp-section">
        <label class="tp-label" for="tpNote">${status === 'na' ? 'Reason it does not apply' : status === 'blocked' ? 'Blocker' : 'Notes'}</label>
        <textarea class="tp-note" id="tpNote" maxlength="1000" placeholder="${status === 'na' ? 'Why this does not apply to this launch' : status === 'blocked' ? 'What is blocking this, and which role needs to act?' : 'Progress, decisions, links…'}">${esc(note)}</textarea>
        <p class="tp-note-hint ${hint.cls}" id="tpNoteHint">${hint.text}</p>
      </div>

      ${others ? `<div class="tp-section">
        <span class="tp-label">This task in each product</span>
        <div class="other-products">${others}</div>
      </div>` : ''}

      <div class="tp-section">
        <span class="tp-label">Details</span>
        <dl class="facts">
          <div class="fact"><dt>Owner role</dt><dd><span class="owner"><span class="avatar" style="--h:${hue(it.owner)}">${esc(initials(it.owner))}</span>${esc(it.owner)}</span></dd></div>
          <div class="fact"><dt>When</dt><dd class="mono">${esc(it.when)}<span class="sub">${it.when === 'Weekly' ? 'Every week until T-7' : offset(it.when) < 0 ? `${-offset(it.when)} days before launch` : offset(it.when) === 0 ? 'Launch day' : `${offset(it.when)} days after launch`}</span></dd></div>
          <div class="fact"><dt>Phase</dt><dd>${it.phase === 'pre' ? 'Pre-launch' : 'Post-launch'}</dd></div>
          <div class="fact"><dt>Workstream</dt><dd>${esc(it.section)}</dd></div>
          <div class="fact"><dt>Scope</dt><dd>${it.scope === 'L' ? 'Once per launch' : 'Per product'}</dd></div>
          <div class="fact"><dt>Blocking</dt><dd>${it.blocking ? 'Yes<span class="sub">Must be done, or N/A with a reason, before the phase closes</span>' : 'No'}</dd></div>
          <div class="fact"><dt>Source tag</dt><dd>${esc(SOURCES[it.source].label)}<span class="sub">${esc(SOURCES[it.source].long)}</span></dd></div>
          <div class="fact"><dt>Counts toward</dt><dd>${gates.length ? gates.map(g => `Gate ${g.n}: ${esc(g.name)}`).join('<br>') : 'Overall progress only'}</dd></div>
        </dl>
      </div>

      ${originHtml}

      ${lessons.length ? `<div class="tp-section">
        <span class="tp-label">Why this step exists</span>
        ${lessons.map(lessonHtml).join('')}
      </div>` : ''}

      <div class="tp-footer">
        ${state.confirmRemove ? `<div class="confirm-row">
            <span>Remove this task for everyone? If it just does not apply to this launch, mark it N/A with a reason instead.</span>
            <span class="spacer"></span>
            <button type="button" class="btn btn-sm" data-remove-cancel>Keep task</button>
            <button type="button" class="btn btn-sm btn-danger-solid" data-remove-confirm>Remove task</button>
          </div>` : `
          <span>${rec && rec.updated_at ? `Status last changed ${esc(formatDate(rec.updated_at))}` : 'Status not changed yet'}</span>
          <span class="spacer"></span>
          ${it.custom
            ? `<button type="button" class="btn btn-sm" data-edit-task="${it.id}">${ICON.edit}<span>Edit task</span></button>
               <button type="button" class="btn btn-sm btn-danger" data-remove-task="${it.id}">${ICON.trash}<span>Remove</span></button>`
            : '<span>From the launch skill checklist. Edit it in the skill and rebuild the data.</span>'}`}
      </div>`;
  }

  function markSelectedRow() {
    document.querySelectorAll('.task.selected').forEach(el => el.classList.remove('selected'));
    const row = state.panelKey && $('row-' + state.panelKey);
    if (row) row.classList.add('selected');
  }
  function openPanel(key, { focus = true } = {}) {
    const u = parseKey(key);
    if (!u) return;
    closeMenu();
    state.panelKey = u.key;
    state.confirmRemove = false;
    renderPanel();
    $('taskPanel').classList.add('open');
    $('taskPanel').setAttribute('aria-hidden', 'false');
    $('panelBackdrop').classList.add('open');
    markSelectedRow();
    if (location.hash !== '#' + u.key) history.replaceState(null, '', '#' + u.key);
    if (focus) $('panelClose').focus();
  }
  function closePanel() {
    if (!state.panelKey) return;
    const key = state.panelKey;
    state.panelKey = null;
    state.confirmRemove = false;
    $('taskPanel').classList.remove('open');
    $('taskPanel').setAttribute('aria-hidden', 'true');
    $('panelBackdrop').classList.remove('open');
    markSelectedRow();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    const opener = document.querySelector(`[data-open="${key}"]`);
    if (opener) opener.focus({ preventScroll: true });
  }
  function stepPanel(delta) {
    const order = visibleUnits();
    const pos = order.findIndex(x => x.key === state.panelKey);
    const next = order[pos + delta];
    if (!next) return;
    openPanel(next.key, { focus: false });
    const row = $('row-' + next.key);
    if (row) row.scrollIntoView({ block: 'nearest' });
  }

  // ---------- Add / edit task form ----------

  function fillSectionOptions(selected) {
    const sections = sectionsFor($('fMarket').value, $('fPhase').value);
    $('fSection').innerHTML = sections.map(s => `<option value="${esc(s)}"${s === selected ? ' selected' : ''}>${esc(s)}</option>`).join('');
  }
  function setFieldError(field, ok) {
    $(field + 'Error').hidden = ok;
    $(field).closest('.field').classList.toggle('invalid', !ok);
  }
  function openForm(editId) {
    const it = editId ? itemById[editId] : null;
    state.editingId = it ? it.id : null;
    $('taskFormTitle').textContent = it ? 'Edit task' : 'Add a task';
    $('taskFormSubmit').textContent = it ? 'Save changes' : 'Add task';
    $('fOwner').innerHTML = ROLE_NAMES.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
    $('whenOptions').innerHTML = WHEN_OPTIONS.map(w => `<option value="${w}"></option>`).join('');
    $('fMarket').value = it ? it.market : state.market;
    $('fMarket').disabled = !!it;
    $('fPhase').value = it ? it.phase : 'pre';
    fillSectionOptions(it ? it.section : null);
    $('fTitle').value = it ? it.title : '';
    $('fDetail').value = it ? it.detail : '';
    $('fOwner').value = it && ROLE_NAMES.includes(it.owner) ? it.owner : 'Launch Lead';
    $('fWhen').value = it ? it.when : 'T-14';
    $('fScope').value = it ? it.scope : 'P';
    $('fSource').value = it ? it.source : 'ADD';
    $('fBlocking').checked = it ? it.blocking : false;
    $('fLink').value = it ? it.link : '';
    ['fTitle', 'fWhen', 'fLink'].forEach(f => setFieldError(f, true));
    $('taskFormModal').hidden = false;
    $('fTitle').focus();
  }
  function closeForm() {
    $('taskFormModal').hidden = true;
    state.editingId = null;
  }
  function validateForm() {
    const checks = [
      ['fTitle', $('fTitle').value.trim().length > 0],
      ['fWhen', /^(T([+-]\d{1,3}|0)|Weekly)$/.test($('fWhen').value.trim())],
      ['fLink', !$('fLink').value.trim() || /^https:\/\/[^\s"'<>]+$/i.test($('fLink').value.trim())],
    ];
    let firstBad = null;
    for (const [f, ok] of checks) {
      setFieldError(f, ok);
      if (!ok && !firstBad) firstBad = f;
    }
    if (firstBad) $(firstBad).focus();
    return !firstBad;
  }
  async function submitForm(e) {
    e.preventDefault();
    if (!validateForm()) return;
    const existing = state.editingId ? state.customRaw[state.editingId] : null;
    const market = existing ? state.editingId.slice(0, 2) : $('fMarket').value;
    const item = {
      ...(existing || {}),
      id: state.editingId || `${market}-NEW-${randomChars(6)}`,
      market,
      phase: $('fPhase').value,
      section: $('fSection').value,
      owner: $('fOwner').value,
      when: $('fWhen').value.trim(),
      scope: $('fScope').value,
      source: $('fSource').value,
      blocking: $('fBlocking').checked,
      title: $('fTitle').value.trim(),
      detail: $('fDetail').value.trim(),
      link: $('fLink').value.trim(),
      createdAt: (existing && existing.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const isNew = !state.editingId;
    const keepKey = state.panelKey;
    closeForm();
    const ok = await saveDoc('customRaw', 'saveItem', item, isNew ? 'Task added' : 'Task updated');
    if (!ok) return;
    let key = keepKey && parseKey(keepKey) && parseKey(keepKey).item.id === item.id ? keepKey : null;
    if (!key) {
      const pid = state.view[market] !== 'all' ? state.view[market] : (PRODUCTS[market][0] || {}).id;
      key = unitKey(itemById[item.id], pid);
    }
    if (isNew) revealKey(key);
    openPanel(key);
    const row = $('row-' + key);
    if (row) {
      row.scrollIntoView({ block: 'center' });
      row.classList.add('highlight');
      setTimeout(() => row.classList.remove('highlight'), 2100);
    }
  }

  // ---------- Add / edit product form ----------

  function openProductForm(pid) {
    const p = pid ? productById[pid] : null;
    state.editingProductId = p ? p.id : null;
    $('productFormTitle').textContent = p ? 'Edit product' : 'Add a product';
    $('productFormSubmit').textContent = p ? 'Save changes' : 'Add product';
    $('pMarket').value = p ? p.market : state.market;
    $('pMarket').disabled = !!p;
    $('pName').value = p ? p.name : '';
    $('pFlavour').value = p ? p.flavour : '';
    $('pFormat').value = p ? p.format : '';
    $('pSize').value = p ? p.size : '';
    $('pAsin').value = p ? p.asin : '';
    $('pSku').value = p ? p.sku : '';
    $('pNotes').value = p ? p.notes : '';
    $('productRemoveBtn').hidden = !p || PRODUCTS[p.market].length < 2;
    $('productRemoveConfirm').hidden = true;
    setFieldError('pName', true);
    setFieldError('pAsin', true);
    $('productFormModal').hidden = false;
    $('pName').focus();
  }
  function closeProductForm() {
    $('productFormModal').hidden = true;
    state.editingProductId = null;
  }
  async function submitProductForm(e) {
    e.preventDefault();
    const asin = $('pAsin').value.trim().toUpperCase();
    const nameOk = $('pName').value.trim().length > 0;
    const asinOk = !asin || /^[A-Z0-9]{10}$/.test(asin);
    setFieldError('pName', nameOk);
    setFieldError('pAsin', asinOk);
    if (!nameOk) { $('pName').focus(); return; }
    if (!asinOk) { $('pAsin').focus(); return; }
    const existing = state.editingProductId ? state.productRaw[state.editingProductId] : null;
    const market = existing ? existing.market : $('pMarket').value;
    const product = {
      ...(existing || {}),
      id: state.editingProductId || randomChars(6),
      market,
      name: $('pName').value.trim(),
      flavour: $('pFlavour').value.trim(),
      format: $('pFormat').value.trim(),
      size: $('pSize').value.trim(),
      asin,
      sku: $('pSku').value.trim(),
      notes: $('pNotes').value.trim(),
      order: existing ? existing.order : Math.max(0, ...PRODUCTS[market].map(p => p.order)) + 1,
      createdAt: (existing && existing.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const isNew = !existing;
    closeProductForm();
    const ok = await saveDoc('productRaw', 'saveProduct', product, isNew ? 'Product added' : 'Product updated');
    if (ok && isNew) {
      if (state.market !== market) setMarket(market);
      setView(product.id);
    }
  }
  async function removeProduct(pid) {
    const raw = state.productRaw[pid];
    if (!raw) return;
    if (PRODUCTS[raw.market].length < 2) { toast('A marketplace needs at least one product.'); return; }
    closeProductForm();
    await saveDoc('productRaw', 'saveProduct', { ...raw, removed: true, removedAt: new Date().toISOString() }, 'Product removed');
  }

  // Optimistic save for added tasks and products, undone if the store rejects it.
  async function saveDoc(bucket, method, doc, successMsg) {
    const prev = state[bucket][doc.id];
    state[bucket][doc.id] = doc;
    rebuildAll();
    renderAll();
    try {
      await store[method](doc);
      toast(successMsg);
      return true;
    } catch (e) {
      if (prev) state[bucket][doc.id] = prev; else delete state[bucket][doc.id];
      rebuildAll();
      renderAll();
      toast(`Not saved: ${e.message}`);
      return false;
    }
  }
  async function removeItem(id) {
    const raw = state.customRaw[id];
    if (!raw) return;
    closePanel();
    await saveDoc('customRaw', 'saveItem', { ...raw, removed: true, removedAt: new Date().toISOString() }, 'Task removed');
  }
  function rebuildAll() {
    rebuildItems();
    rebuildProducts();
    renderOwnerFilter();
  }

  // ---------- Rendering, saving, menus ----------

  function renderAll() {
    closeMenu();
    const active = document.activeElement;
    const overview = view() === 'all';
    renderProductBar();
    renderGates();
    renderSummary();
    $('overview').hidden = !overview;
    $('productView').hidden = overview;
    document.querySelector('.nav-card').hidden = overview;
    if (state.panelKey && !parseKey(state.panelKey)) closePanel();
    if (state.panelKey && !(active && active.id === 'tpNote')) renderPanel();
    if (active && active.classList && active.classList.contains('note-input')) {
      pendingRender = true;
      return;
    }
    pendingRender = false;
    const y = window.scrollY;
    if (overview) renderOverview(); else renderList();
    markSelectedRow();
    window.scrollTo(0, y);
  }

  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3000);
  }

  function setConnection(stateName, label) {
    $('connBadge').dataset.state = stateName;
    $('connText').textContent = label;
  }

  async function saveRecord(key, patch) {
    const u = parseKey(key);
    if (!u) return;
    const prev = state.records[key];
    const record = {
      item_id: key,
      market: u.item.market,
      status: statusOf(key),
      note: noteOf(key),
      ...patch,
      updated_at: new Date().toISOString(),
    };
    state.records[key] = record;
    renderAll();
    try {
      await store.save(record);
    } catch (e) {
      if (prev) state.records[key] = prev; else delete state.records[key];
      renderAll();
      toast(`Not saved: ${e.message}`);
    }
  }

  function setStatus(key, status, { focusNote = true } = {}) {
    saveRecord(key, { status });
    if (focusNote && (status === 'blocked' || status === 'na')) {
      requestAnimationFrame(() => {
        const input = state.panelKey === key ? $('tpNote') : document.querySelector(`.note-input[data-key="${key}"]`);
        if (input && !input.value) input.focus();
      });
    }
  }

  function openMenu(btn) {
    const key = btn.dataset.menu;
    if (menuFor === key) { closeMenu(); return; }
    const current = statusOf(key);
    const menu = $('statusMenu');
    menu.innerHTML = Object.entries(STATUSES).map(([v, m]) =>
      `<button type="button" role="menuitemradio" aria-checked="${v === current}" data-set-status="${v}"><span class="st-dot st-${v}"></span>${m.label}</button>`).join('');
    menu.hidden = false;
    const r = btn.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let left = r.right - mw + window.scrollX;
    left = Math.max(8 + window.scrollX, Math.min(left, window.scrollX + document.documentElement.clientWidth - mw - 8));
    let top = r.bottom + 6 + window.scrollY;
    if (r.bottom + mh + 12 > window.innerHeight) top = r.top - mh - 6 + window.scrollY;
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menuFor = key;
    btn.setAttribute('aria-expanded', 'true');
    const checked = menu.querySelector('[aria-checked="true"]');
    if (checked) checked.focus();
  }
  function closeMenu() {
    const menu = $('statusMenu');
    if (menu.hidden) return;
    menu.hidden = true;
    const btn = menuFor && document.querySelector(`[data-menu="${menuFor}"]`);
    if (btn) btn.setAttribute('aria-expanded', 'false');
    menuFor = null;
  }

  function outstandingText() {
    const v = view();
    const units = v === 'all' ? unitsFor(state.market, 'all') : visibleUnits();
    const open = units.filter(u => !isComplete(u.key));
    const today = new Date().toISOString().slice(0, 10);
    const scopeLabel = v === 'all' ? `all ${PRODUCTS[state.market].length} products` : productById[v].name;
    const ng = nextGate(state.market, v);
    const lines = [`⏳ OUTSTANDING — ${MARKET_NAMES[state.market]} — ${scopeLabel} — as of ${today}`];
    if (ng) {
      lines.push(`Next gate: Gate ${ng.g.n} ${ng.g.name} (${ng.g.when}) — ${ng.gs.state === 'risk' ? 'blocked' : 'at risk'}, ${ng.gs.done}/${ng.gs.total} ready`);
    } else {
      lines.push('All four gates passed.');
    }
    const line = u => {
      const s = statusOf(u.key);
      const note = noteOf(u.key).trim();
      const who = u.product ? (v === 'all' ? ` [${u.product.name}]` : '') : ' [launch-wide]';
      let out = `${STATUSES[s].icon} ${u.item.id} ${u.item.task}${who} — ${u.item.owner} — ${u.item.when}`;
      if (s === 'blocked' && note) out += ` — blocker: ${note}`;
      if (s === 'na') out += ' — N/A reason missing';
      return out;
    };
    const blocking = open.filter(u => u.item.blocking);
    const other = open.filter(u => !u.item.blocking);
    lines.push('', 'BLOCKING');
    lines.push(...(blocking.length ? blocking.map(line) : ['None']));
    lines.push('', 'NON-BLOCKING');
    lines.push(...(other.length ? other.map(line) : ['None']));
    const verify = [...new Set(open.filter(u => u.item.source === 'VERIFY').map(u => u.item.id))];
    lines.push('', `Decisions needed (VERIFY): ${verify.length ? verify.join(', ') : 'none'}`);
    return lines.join('\n');
  }

  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg);
      return true;
    } catch (e) {
      return false;
    }
  }
  async function copyOutstanding() {
    const text = outstandingText();
    $('copyText').value = text;
    if (!(await copyText(text, 'Outstanding items copied'))) {
      $('copyModal').hidden = false;
      $('copyText').focus();
      $('copyText').select();
    }
  }
  async function copyPanelLink() {
    if (!state.panelKey) return;
    const url = location.origin + location.pathname + '#' + state.panelKey;
    if (!(await copyText(url, 'Link to this task copied'))) toast(url);
  }

  function renderDrawer(tab) {
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const body = $('drawerBody');
    if (tab === 'process') {
      body.innerHTML = `
        <h4>Gates</h4>
        ${GATES.map(g => `<div class="kv"><span class="when">${g.when}</span><span>Gate ${g.n}: ${esc(g.name)}</span></div>`).join('')}
        <h4>Cadence</h4>
        ${CADENCE.map(c => `<div class="kv"><span class="when">${esc(c[0])}</span><span>${esc(c[1])}</span></div>`).join('')}
        <h4>Roles</h4>
        ${ROLES.map(r => `<div class="kv"><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join('')}
        <h4>Tools</h4>
        ${TOOLS.map(t => `<div class="kv"><b>${esc(t[0])}</b><span>${esc(t[1])}</span></div>`).join('')}`;
    } else {
      body.innerHTML = DATA.lessons.map(l => `
        <div class="lesson-card">
          <div class="lc-what">${l.n}. ${esc(l.what)}</div>
          <div class="lc-row"><b>Impact:</b> ${esc(l.impact)}</div>
          <div class="lc-row lc-ctrl"><b>Control:</b> ${esc(l.control)}</div>
          <div class="lesson-chips">${l.ids.map(id => `<button type="button" class="lesson-chip" data-jump="${id}">${id}</button>`).join('')}</div>
        </div>`).join('');
    }
  }
  function openDrawer() {
    closePanel();
    $('playbookDrawer').classList.add('open');
    $('playbookDrawer').setAttribute('aria-hidden', 'false');
    $('drawerBackdrop').classList.add('open');
    renderDrawer('process');
  }
  function closeDrawer() {
    $('playbookDrawer').classList.remove('open');
    $('playbookDrawer').setAttribute('aria-hidden', 'true');
    $('drawerBackdrop').classList.remove('open');
  }

  function setMarket(market) {
    state.market = market;
    document.querySelectorAll('.market-tab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.market === market)));
    const u = state.panelKey && parseKey(state.panelKey);
    if (u && u.item.market !== market) closePanel();
    renderOwnerFilter();
    renderAll();
  }
  function setView(v) {
    state.view[state.market] = v;
    writeLocal('gate-board:view:v1', state.view);
    const u = state.panelKey && parseKey(state.panelKey);
    if (u && u.product && v !== 'all' && u.product.id !== v) closePanel();
    renderAll();
    window.scrollTo(0, 0);
  }

  function setPhase(phase) {
    state.phase = phase;
    document.querySelectorAll('#phaseGroup button').forEach(b => b.classList.toggle('active', b.dataset.phase === phase));
  }

  function resetFilters() {
    setPhase('all');
    state.status = 'all'; state.owner = 'all'; state.blockingOnly = false; state.search = '';
    $('statusFilter').value = 'all';
    $('ownerFilter').value = 'all';
    $('blockingOnly').checked = false;
    $('searchInput').value = '';
  }

  // Makes the row for a unit visible: right market, a product view that contains it, filters cleared.
  function revealKey(key) {
    const u = parseKey(key);
    if (!u) return false;
    resetFilters();
    state.collapsed.delete(`${u.item.market}::${state.groupBy}::${groupKeyOf(u.item)}`);
    if (state.market !== u.item.market) {
      state.market = u.item.market;
      document.querySelectorAll('.market-tab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.market === state.market)));
      renderOwnerFilter();
    }
    const target = u.product ? u.product.id : (view() === 'all' ? (PRODUCTS[state.market][0] || {}).id : view());
    state.view[state.market] = target || 'all';
    writeLocal('gate-board:view:v1', state.view);
    renderAll();
    return true;
  }

  function jumpTo(id) {
    closeDrawer();
    const item = itemById[id];
    if (!item) return;
    const pid = view() !== 'all' && item.market === state.market ? view() : (PRODUCTS[item.market][0] || {}).id;
    const key = unitKey(item, pid);
    if (!revealKey(key)) return;
    const row = $('row-' + key);
    if (row) {
      row.scrollIntoView({ block: 'center' });
      row.classList.add('highlight');
      setTimeout(() => row.classList.remove('highlight'), 2100);
    }
  }

  function openFromHash() {
    let key = decodeURIComponent(location.hash.slice(1));
    if (!key || key === state.panelKey) return;
    const item = itemById[key.split(':')[0]];
    if (item && item.scope === 'P' && !key.includes(':')) key = unitKey(item, (PRODUCTS[item.market][0] || {}).id);
    if (!parseKey(key)) return;
    revealKey(key);
    openPanel(key, { focus: false });
    const row = $('row-' + key);
    if (row) row.scrollIntoView({ block: 'center' });
  }

  function applyStat(key) {
    const wasActive = document.querySelector(`[data-stat="${key}"]`).classList.contains('active');
    state.blockingOnly = false;
    state.status = 'all';
    if (!wasActive) {
      if (key === 'blocking') { state.blockingOnly = true; state.status = 'open'; }
      else state.status = key;
    }
    $('blockingOnly').checked = state.blockingOnly;
    $('statusFilter').value = state.status;
    renderAll();
  }

  function bindEvents() {
    document.addEventListener('change', e => {
      const t = e.target;
      if (t.matches('.note-input')) saveRecord(t.dataset.key, { note: t.value.trim() });
      else if (t.id === 'tpNote' && state.panelKey) saveRecord(state.panelKey, { note: t.value.trim() });
    });
    document.addEventListener('focusout', e => {
      if (e.target.matches && e.target.matches('.note-input') && pendingRender) setTimeout(renderAll, 0);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.matches && e.target.matches('.note-input')) e.target.blur();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.id === 'tpNote') e.target.blur();
      if (e.key === 'Escape') {
        if (!$('statusMenu').hidden) { closeMenu(); return; }
        if (!$('taskFormModal').hidden) { closeForm(); return; }
        if (!$('productFormModal').hidden) { closeProductForm(); return; }
        if (!$('copyModal').hidden) { $('copyModal').hidden = true; return; }
        if (state.panelKey) { closePanel(); return; }
        closeDrawer();
      }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !$('statusMenu').hidden) {
        const opts = [...$('statusMenu').querySelectorAll('button')];
        const i = opts.indexOf(document.activeElement);
        const next = opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length];
        next.focus();
        e.preventDefault();
      }
    });
    document.addEventListener('click', e => {
      const opt = e.target.closest('[data-set-status]');
      if (opt) { const key = menuFor; closeMenu(); setStatus(key, opt.dataset.setStatus); return; }
      const menuBtn = e.target.closest('[data-menu]');
      if (menuBtn) { openMenu(menuBtn); return; }
      if (!e.target.closest('#statusMenu')) closeMenu();

      const panelStatus = e.target.closest('[data-panel-status]');
      if (panelStatus && state.panelKey) { setStatus(state.panelKey, panelStatus.dataset.panelStatus); return; }
      if (e.target.closest('[data-edit-task]')) { openForm(e.target.closest('[data-edit-task]').dataset.editTask); return; }
      if (e.target.closest('[data-remove-task]')) { state.confirmRemove = true; renderPanel(); return; }
      if (e.target.closest('[data-remove-cancel]')) { state.confirmRemove = false; renderPanel(); return; }
      if (e.target.closest('[data-remove-confirm]')) { removeItem(parseKey(state.panelKey).item.id); return; }
      if (e.target.closest('[data-add-product]')) { openProductForm(null); return; }
      const editProduct = e.target.closest('[data-edit-product]');
      if (editProduct) { openProductForm(editProduct.dataset.editProduct); return; }
      const viewBtn = e.target.closest('[data-view]');
      if (viewBtn) { setView(viewBtn.dataset.view); return; }
      const matrixBtn = e.target.closest('[data-matrix]');
      if (matrixBtn) { state.matrixOpenOnly = matrixBtn.dataset.matrix === 'open'; renderAll(); return; }

      const check = e.target.closest('[data-check]');
      if (check) { const key = check.dataset.check; setStatus(key, statusOf(key) === 'done' ? 'not_started' : 'done', { focusNote: false }); return; }
      const opener = e.target.closest('[data-open]');
      if (opener) { openPanel(opener.dataset.open); return; }
      const col = e.target.closest('[data-collapse]');
      if (col) {
        const key = col.dataset.collapse;
        if (state.collapsed.has(key)) state.collapsed.delete(key); else state.collapsed.add(key);
        writeLocal('gate-board:collapsed:v2', [...state.collapsed]);
        renderAll();
        return;
      }
      const lesson = e.target.closest('[data-lesson]');
      if (lesson) {
        const key = lesson.dataset.lesson;
        if (state.openLessons.has(key)) state.openLessons.delete(key); else state.openLessons.add(key);
        renderAll();
        return;
      }
      const stat = e.target.closest('[data-stat]');
      if (stat) { applyStat(stat.dataset.stat); return; }
      const go = e.target.closest('[data-goto]');
      if (go) {
        const target = $('grp-' + go.dataset.goto);
        if (target) target.scrollIntoView({ block: 'start', behavior: 'smooth' });
        return;
      }
      const tab = e.target.closest('.market-tab');
      if (tab) { setMarket(tab.dataset.market); return; }
      const phase = e.target.closest('#phaseGroup button');
      if (phase) { setPhase(phase.dataset.phase); renderAll(); return; }
      const jump = e.target.closest('[data-jump]');
      if (jump) { jumpTo(jump.dataset.jump); return; }
      const dtab = e.target.closest('.drawer-tab');
      if (dtab) { renderDrawer(dtab.dataset.tab); return; }

      // Clicking anywhere else on a task row opens its detail panel.
      const row = e.target.closest('.task');
      if (row && !e.target.closest('button, input, textarea, select, a')) openPanel(row.dataset.key);
    });
    window.addEventListener('resize', closeMenu);
    window.addEventListener('hashchange', openFromHash);
    $('statusFilter').addEventListener('change', e => { state.status = e.target.value; renderAll(); });
    $('ownerFilter').addEventListener('change', e => { state.owner = e.target.value; renderAll(); });
    $('groupBy').addEventListener('change', e => { state.groupBy = e.target.value; renderAll(); });
    $('blockingOnly').addEventListener('change', e => { state.blockingOnly = e.target.checked; renderAll(); });
    $('searchInput').addEventListener('input', e => { state.search = e.target.value.trim().toLowerCase(); renderAll(); });
    $('playbookBtn').addEventListener('click', openDrawer);
    $('drawerClose').addEventListener('click', closeDrawer);
    $('drawerBackdrop').addEventListener('click', closeDrawer);
    $('panelClose').addEventListener('click', closePanel);
    $('panelBackdrop').addEventListener('click', closePanel);
    $('panelPrev').addEventListener('click', () => stepPanel(-1));
    $('panelNext').addEventListener('click', () => stepPanel(1));
    $('panelCopyLink').addEventListener('click', copyPanelLink);
    $('copyBtn').addEventListener('click', copyOutstanding);
    $('copyModalClose').addEventListener('click', () => { $('copyModal').hidden = true; });
    $('addTaskBtn').addEventListener('click', () => openForm(null));
    $('taskFormClose').addEventListener('click', closeForm);
    $('taskFormCancel').addEventListener('click', closeForm);
    $('taskForm').addEventListener('submit', submitForm);
    $('fMarket').addEventListener('change', () => fillSectionOptions(null));
    $('fPhase').addEventListener('change', () => fillSectionOptions(null));
    $('productFormClose').addEventListener('click', closeProductForm);
    $('productFormCancel').addEventListener('click', closeProductForm);
    $('productForm').addEventListener('submit', submitProductForm);
    $('productRemoveBtn').addEventListener('click', () => { $('productRemoveConfirm').hidden = false; });
    $('productRemoveCancel').addEventListener('click', () => { $('productRemoveConfirm').hidden = true; });
    $('productRemoveConfirmBtn').addEventListener('click', () => removeProduct(state.editingProductId));
    $('updateReload').addEventListener('click', () => location.reload());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
    setInterval(checkForUpdate, 5 * 60 * 1000);
  }

  // An open tab keeps running old code after a new version is published; offer a reload instead.
  const BUILD = (document.querySelector('meta[name="build"]') || {}).content || '';
  async function checkForUpdate() {
    if (!BUILD || location.protocol === 'file:') return;
    try {
      const res = await fetch(`${location.pathname}?build-check=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const m = (await res.text()).match(/<meta name="build" content="([a-f0-9]+)">/);
      if (m && m[1] !== BUILD) $('updateBanner').hidden = false;
    } catch (e) { /* offline: try again later */ }
  }

  async function loadWithRetry() {
    try {
      const data = await store.load();
      state.records = data.records;
      for (const [id, raw] of Object.entries(data.items)) state.customRaw[id] = raw;
      for (const [id, raw] of Object.entries(data.products)) state.productRaw[id] = raw;
      rebuildAll();
      loaded = true;
      if (store.mode === 'shared') setConnection('shared', 'Shared · live');
    } catch (e) {
      setConnection('error', 'Not connected');
      toast(`Could not load statuses (${e.message}). Retrying in 15 seconds.`);
      setTimeout(async () => { await loadWithRetry(); renderAll(); }, 15000);
    }
  }

  async function init() {
    rebuildAll();
    bindEvents();
    renderAll();
    try {
      store = window.createStore(window.GATE_BOARD_CONFIG);
    } catch (e) {
      setConnection('error', 'Not connected');
      toast(e.message);
      return;
    }
    $('setupNote').hidden = store.mode !== 'local';
    setConnection(store.mode === 'shared' ? 'loading' : 'local', store.mode === 'shared' ? 'Connecting…' : 'This browser only');
    await loadWithRetry();
    renderAll();
    openFromHash();
    checkForUpdate();
    store.subscribe({
      records: records => {
        for (const r of records) state.records[r.item_id] = r;
        renderAll();
      },
      items: items => {
        for (const raw of items) state.customRaw[raw.id] = raw;
        rebuildAll();
        renderAll();
      },
      products: products => {
        for (const raw of products) state.productRaw[raw.id] = raw;
        rebuildAll();
        renderAll();
      },
      connection: status => {
        if (!loaded) return;
        if (status === 'SUBSCRIBED') setConnection('shared', 'Shared · live');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnection('error', 'Live updates paused');
      },
    });
  }

  init();
})();
