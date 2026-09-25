(function () {
  const DATA = window.CHECKLIST;
  const MARKET_NAMES = { CA: 'CANADA (Amazon.ca)', US: 'USA (Amazon.com)' };
  const MARKET_TITLES = { CA: 'Canada launch', US: 'USA launch' };

  // Gate 3 covers every pre-launch BLOCKING item, per the skill's shared foundation.
  const GATES = [
    { n: 1, name: 'Creative & Copy Freeze', when: 'T-14', ids: { CA: ['CA-PRE-059', 'CA-PRE-067'], US: ['US-PRE-065', 'US-PRE-066'] } },
    { n: 2, name: 'Compliance Sign-off', when: 'T-7', ids: { CA: ['CA-PRE-110'], US: ['US-PRE-100'] } },
    { n: 3, name: 'Go / No-Go', when: 'T-2', allPreBlocking: true },
    { n: 4, name: 'Launch-Day Image Gate', when: 'T0', ids: { CA: ['CA-POST-202'], US: ['US-POST-203'] } },
  ];

  const STATUSES = {
    not_started: { label: 'Not started', icon: '⚪' },
    in_progress: { label: 'In progress', icon: '⏳' },
    blocked: { label: 'Blocked', icon: '❌' },
    done: { label: 'Done', icon: '✅' },
    na: { label: 'N/A', icon: '➖' },
  };

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
  const itemById = {};
  for (const mk of ['CA', 'US']) for (const it of DATA[mk]) itemById[it.id] = it;

  const state = {
    market: 'CA',
    phase: 'all',
    status: 'all',
    owner: 'all',
    groupBy: 'section',
    blockingOnly: false,
    search: '',
    records: {},
    openLessons: new Set(),
    collapsed: new Set(readLocal('gate-board:collapsed:v2', [])),
  };
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

  function statusOf(id) {
    const r = state.records[id];
    return r && STATUSES[r.status] ? r.status : 'not_started';
  }
  function noteOf(id) {
    const r = state.records[id];
    return (r && r.note) || '';
  }
  // N/A only counts once a reason is recorded (skill rule: "N/A items carry a reason").
  function isComplete(id) {
    const s = statusOf(id);
    return s === 'done' || (s === 'na' && noteOf(id).trim() !== '');
  }

  function gateIds(gate, market) {
    if (gate.allPreBlocking) return DATA[market].filter(it => it.phase === 'pre' && it.blocking).map(it => it.id);
    return gate.ids[market];
  }
  function gateState(gate, market) {
    const ids = gateIds(gate, market);
    const done = ids.filter(isComplete).length;
    let s = 'pending';
    if (ids.some(id => statusOf(id) === 'blocked')) s = 'risk';
    else if (done === ids.length) s = 'pass';
    return { state: s, done, total: ids.length };
  }

  function renderGates() {
    $('gateStrip').innerHTML = GATES.map(g => {
      const gs = gateState(g, state.market);
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
    const items = DATA[state.market];
    const done = items.filter(it => isComplete(it.id)).length;
    const blocking = items.filter(it => it.blocking);
    const bdone = blocking.filter(it => isComplete(it.id)).length;
    const pct = Math.round((done / items.length) * 100);
    const circumference = 2 * Math.PI * 50;
    const ring = $('ringFg');
    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference * (1 - done / items.length));
    $('ringPct').textContent = pct + '%';
    $('readinessTitle').textContent = MARKET_TITLES[state.market];
    $('progressOverallText').textContent = `${done} / ${items.length}`;
    $('progressBlockText').textContent = `${bdone} / ${blocking.length}`;
    $('progressBlockFill').style.width = Math.round((bdone / blocking.length) * 100) + '%';

    const count = s => items.filter(it => statusOf(it.id) === s).length;
    const openBlocking = blocking.length - bdone;
    const tiles = [
      { key: 'blocking', label: 'Blocking open', value: openBlocking, hint: `of ${blocking.length} blocking items`, color: 'var(--blocked)', soft: 'var(--blocked-soft)', icon: ICON.lock },
      { key: 'blocked', label: 'Blocked', value: count('blocked'), hint: 'need a decision or input', color: 'var(--blocked)', soft: 'var(--blocked-soft)', icon: ICON.ban },
      { key: 'in_progress', label: 'In progress', value: count('in_progress'), hint: 'being worked on', color: 'var(--progress)', soft: 'var(--progress-soft)', icon: ICON.clock },
      { key: 'done', label: 'Done', value: count('done'), hint: `of ${items.length} items`, color: 'var(--done)', soft: 'var(--done-soft)', icon: ICON.done },
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
    const owners = [...new Set(DATA[state.market].map(it => it.owner))].sort();
    if (!owners.includes(state.owner)) state.owner = 'all';
    $('ownerFilter').innerHTML = `<option value="all">All</option>` +
      owners.map(o => `<option value="${esc(o)}"${o === state.owner ? ' selected' : ''}>${esc(o)}</option>`).join('');
  }

  function matches(it) {
    if (state.phase !== 'all' && it.phase !== state.phase) return false;
    if (state.blockingOnly && !it.blocking) return false;
    if (state.owner !== 'all' && it.owner !== state.owner) return false;
    if (state.status === 'open' && isComplete(it.id)) return false;
    if (state.status !== 'all' && state.status !== 'open' && statusOf(it.id) !== state.status) return false;
    if (state.search) {
      const hay = `${it.id} ${it.task} ${it.owner} ${it.section}`.toLowerCase();
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
  function orderedGroups(items) {
    const keys = [...new Set(items.map(groupKeyOf))];
    if (state.groupBy === 'timeline') keys.sort((a, b) => offset(a) - offset(b));
    if (state.groupBy === 'owner') keys.sort();
    return keys;
  }

  function taskHtml(it) {
    const status = statusOf(it.id);
    const note = noteOf(it.id);
    const lessons = lessonsById[it.id];
    const [title, detail] = splitTask(it.task);
    const showNote = status === 'blocked' || status === 'na';
    const placeholder = status === 'na' ? 'Why this does not apply (required)' : 'What is blocking this, and which role needs to act?';
    const lessonOpen = lessons && state.openLessons.has(it.id);
    return `<article class="task" id="row-${it.id}" data-id="${it.id}" data-status="${status}">
      <button type="button" class="check" data-check="${it.id}" aria-label="${status === 'done' ? 'Mark not started' : 'Mark done'}: ${it.id}" aria-pressed="${status === 'done'}">${ICON.check}</button>
      <div class="task-body">
        <div class="task-title">${esc(title)}</div>
        ${detail ? `<div class="task-detail">${esc(detail)}</div>` : ''}
        <div class="task-meta">
          <span class="owner"><span class="avatar" style="--h:${hue(it.owner)}">${initials(it.owner)}</span>${esc(it.owner)}</span>
          <span class="pill mono">${esc(it.when)}</span>
          ${it.blocking ? `<span class="pill blocking">${ICON.lock}Blocking</span>` : ''}
          ${it.source === 'VERIFY' ? '<span class="pill src-pill-VERIFY">Verify first</span>' : ''}
          ${it.source === 'ADD' ? '<span class="pill src-pill-ADD">Required addition</span>' : ''}
          <span class="pill">${it.scope === 'L' ? 'Once per launch' : 'Per product'}</span>
          ${status === 'na' && !note.trim() ? `<span class="pill warn">${ICON.alert}Reason missing</span>` : ''}
          <span class="task-id mono" title="Checklist ID"><span class="src-dot src-${it.source}"></span> ${it.id}</span>
          ${lessons ? `<button type="button" class="link-btn" data-lesson="${it.id}" aria-expanded="${lessonOpen}">${ICON.bulb}Why this step exists</button>` : ''}
        </div>
        ${showNote ? `<input type="text" class="note-input" data-id="${it.id}" maxlength="500" placeholder="${placeholder}" value="${esc(note)}" aria-label="Note for ${it.id}">` : ''}
        ${lessonOpen ? lessons.map(l => `<div class="lesson">
          <div class="l-head">Lesson ${l.n}: ${esc(l.what)}</div>
          <div class="l-row"><b>Impact:</b> ${esc(l.impact)}</div>
          <div class="l-row l-ctrl"><b>Control:</b> ${esc(l.control)}</div>
        </div>`).join('') : ''}
      </div>
      <div class="status-cell">
        <button type="button" class="status-btn st-${status}" data-menu="${it.id}" aria-haspopup="menu" aria-label="Status for ${it.id}: ${STATUSES[status].label}">
          <span class="st-dot"></span><span class="st-label">${STATUSES[status].label}</span>${ICON.caretSm}
        </button>
      </div>
    </article>`;
  }

  function renderList() {
    const all = DATA[state.market];
    const items = all.filter(matches);
    $('resultCount').textContent = `Showing ${items.length} of ${all.length} tasks`;
    $('navTitle').textContent = { section: 'Workstreams', timeline: 'Timeline', owner: 'Owners' }[state.groupBy];
    if (!items.length) {
      $('sections').innerHTML = '<div class="empty-state">No tasks match these filters.</div>';
      $('groupNav').innerHTML = '';
      return;
    }
    const keys = orderedGroups(items);
    const allKeys = orderedGroups(all);
    $('groupNav').innerHTML = allKeys.map(key => {
      const members = all.filter(it => groupKeyOf(it) === key);
      const done = members.filter(it => isComplete(it.id)).length;
      const blocked = members.filter(it => statusOf(it.id) === 'blocked').length;
      const lbl = groupLabel(key);
      const idx = keys.indexOf(key);
      return `<button type="button" class="group-link${blocked ? ' has-blocked' : ''}" data-goto="${idx}" ${idx < 0 ? 'disabled' : ''}>
        <span class="gl-name">${lbl.code ? `<span class="mono">${esc(lbl.code)}</span> ` : ''}${esc(lbl.title)}</span>
        <span class="gl-count mono">${blocked ? `${blocked} blocked` : `${done}/${members.length}`}</span>
        <span class="gl-bar"><span style="width:${Math.round((done / members.length) * 100)}%"></span></span>
      </button>`;
    }).join('');

    $('sections').innerHTML = keys.map((key, idx) => {
      const members = all.filter(it => groupKeyOf(it) === key);
      const shown = items.filter(it => groupKeyOf(it) === key);
      const done = members.filter(it => isComplete(it.id)).length;
      const blocked = members.filter(it => statusOf(it.id) === 'blocked').length;
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

  function renderAll() {
    closeMenu();
    const active = document.activeElement;
    renderGates();
    renderSummary();
    if (active && active.classList && active.classList.contains('note-input')) {
      pendingRender = true;
      return;
    }
    pendingRender = false;
    const y = window.scrollY;
    renderList();
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

  async function saveRecord(id, patch) {
    const prev = state.records[id];
    const record = {
      item_id: id,
      market: itemById[id].market,
      status: statusOf(id),
      note: noteOf(id),
      ...patch,
      updated_at: new Date().toISOString(),
    };
    state.records[id] = record;
    renderAll();
    try {
      await store.save(record);
    } catch (e) {
      if (prev) state.records[id] = prev; else delete state.records[id];
      renderAll();
      toast(`Not saved: ${e.message}`);
    }
  }

  function setStatus(id, status) {
    saveRecord(id, { status });
    if (status === 'blocked' || status === 'na') {
      requestAnimationFrame(() => {
        const input = document.querySelector(`#row-${id} .note-input`);
        if (input && !input.value) input.focus();
      });
    }
  }

  function openMenu(btn) {
    const id = btn.dataset.menu;
    if (menuFor === id) { closeMenu(); return; }
    const current = statusOf(id);
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
    menuFor = id;
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
    const open = DATA[state.market].filter(it => matches(it) && !isComplete(it.id));
    const today = new Date().toISOString().slice(0, 10);
    const next = GATES.map(g => ({ g, s: gateState(g, state.market) })).find(x => x.s.state !== 'pass');
    const lines = [`⏳ OUTSTANDING — ${MARKET_NAMES[state.market]} — Product A — as of ${today}`];
    if (next) {
      const verdict = next.s.state === 'risk' ? 'blocked' : 'at risk';
      lines.push(`Next gate: Gate ${next.g.n} ${next.g.name} (${next.g.when}) — ${verdict}, ${next.s.done}/${next.s.total} ready`);
    } else {
      lines.push('All four gates passed.');
    }
    const line = it => {
      const s = statusOf(it.id);
      const note = noteOf(it.id).trim();
      let out = `${STATUSES[s].icon} ${it.id} ${it.task} — ${it.owner} — ${it.when}`;
      if (s === 'blocked' && note) out += ` — blocker: ${note}`;
      if (s === 'na') out += ' — N/A reason missing';
      return out;
    };
    const blocking = open.filter(it => it.blocking);
    const other = open.filter(it => !it.blocking);
    lines.push('', 'BLOCKING');
    lines.push(...(blocking.length ? blocking.map(line) : ['None']));
    lines.push('', 'NON-BLOCKING');
    lines.push(...(other.length ? other.map(line) : ['None']));
    const verify = open.filter(it => it.source === 'VERIFY').map(it => it.id);
    lines.push('', `Decisions needed (VERIFY): ${verify.length ? verify.join(', ') : 'none'}`);
    return lines.join('\n');
  }

  async function copyOutstanding() {
    const text = outstandingText();
    $('copyText').value = text;
    try {
      await navigator.clipboard.writeText(text);
      toast('Outstanding items copied');
    } catch (e) {
      $('copyModal').hidden = false;
      $('copyText').focus();
      $('copyText').select();
    }
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
    renderOwnerFilter();
    renderAll();
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

  function jumpTo(id) {
    const it = itemById[id];
    if (!it) return;
    resetFilters();
    state.collapsed.delete(`${it.market}::${state.groupBy}::${groupKeyOf(it)}`);
    closeDrawer();
    setMarket(it.market);
    const row = $('row-' + id);
    if (row) {
      row.scrollIntoView({ block: 'center' });
      row.classList.add('highlight');
      setTimeout(() => row.classList.remove('highlight'), 2100);
    }
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
      if (t.matches('.note-input')) saveRecord(t.dataset.id, { note: t.value.trim() });
    });
    document.addEventListener('focusout', e => {
      if (e.target.matches && e.target.matches('.note-input') && pendingRender) setTimeout(renderAll, 0);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.matches && e.target.matches('.note-input')) e.target.blur();
      if (e.key === 'Escape') { closeMenu(); closeDrawer(); $('copyModal').hidden = true; }
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
      if (opt) { const id = menuFor; closeMenu(); setStatus(id, opt.dataset.setStatus); return; }
      const menuBtn = e.target.closest('[data-menu]');
      if (menuBtn) { openMenu(menuBtn); return; }
      if (!e.target.closest('#statusMenu')) closeMenu();

      const check = e.target.closest('[data-check]');
      if (check) { const id = check.dataset.check; setStatus(id, statusOf(id) === 'done' ? 'not_started' : 'done'); return; }
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
        const id = lesson.dataset.lesson;
        if (state.openLessons.has(id)) state.openLessons.delete(id); else state.openLessons.add(id);
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
      if (dtab) renderDrawer(dtab.dataset.tab);
    });
    window.addEventListener('resize', closeMenu);
    $('statusFilter').addEventListener('change', e => { state.status = e.target.value; renderAll(); });
    $('ownerFilter').addEventListener('change', e => { state.owner = e.target.value; renderAll(); });
    $('groupBy').addEventListener('change', e => { state.groupBy = e.target.value; renderAll(); });
    $('blockingOnly').addEventListener('change', e => { state.blockingOnly = e.target.checked; renderAll(); });
    $('searchInput').addEventListener('input', e => { state.search = e.target.value.trim().toLowerCase(); renderAll(); });
    $('playbookBtn').addEventListener('click', openDrawer);
    $('drawerClose').addEventListener('click', closeDrawer);
    $('drawerBackdrop').addEventListener('click', closeDrawer);
    $('copyBtn').addEventListener('click', copyOutstanding);
    $('copyModalClose').addEventListener('click', () => { $('copyModal').hidden = true; });
  }

  async function loadWithRetry() {
    try {
      state.records = await store.load();
      loaded = true;
      if (store.mode === 'shared') setConnection('shared', 'Shared · live');
    } catch (e) {
      setConnection('error', 'Not connected');
      toast(`Could not load statuses (${e.message}). Retrying in 15 seconds.`);
      setTimeout(async () => { await loadWithRetry(); renderAll(); }, 15000);
    }
  }

  async function init() {
    bindEvents();
    renderOwnerFilter();
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
    store.subscribe(
      records => {
        for (const r of records) state.records[r.item_id] = r;
        renderAll();
      },
      status => {
        if (!loaded) return;
        if (status === 'SUBSCRIBED') setConnection('shared', 'Shared · live');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnection('error', 'Live updates paused');
      },
    );
  }

  init();
})();
