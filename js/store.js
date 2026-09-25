// Storage for task statuses and added tasks: Supabase when configured (shared, live),
// otherwise this browser's localStorage.
(function () {
  const STATUS_TABLE = 'launch_status';
  const ITEMS_TABLE = 'launch_items';
  const STATUS_KEY = 'gate-board:status:v1';
  const ITEMS_KEY = 'gate-board:items:v1';

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { return {}; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { throw new Error('This browser blocked local storage'); }
  }

  function createLocalStore() {
    let records = readJson(STATUS_KEY);
    let items = readJson(ITEMS_KEY);
    return {
      mode: 'local',
      async load() { return { records: { ...records }, items: { ...items } }; },
      async save(record) {
        records[record.item_id] = record;
        writeJson(STATUS_KEY, records);
      },
      async saveItem(item) {
        items[item.id] = item;
        writeJson(ITEMS_KEY, items);
      },
      subscribe(onRecords, onItems) {
        window.addEventListener('storage', e => {
          if (e.key === STATUS_KEY) { records = readJson(STATUS_KEY); onRecords(Object.values(records)); }
          if (e.key === ITEMS_KEY) { items = readJson(ITEMS_KEY); onItems(Object.values(items)); }
        });
      },
    };
  }

  function createSupabaseStore(url, anonKey) {
    const client = window.supabase.createClient(url, anonKey);
    return {
      mode: 'shared',
      async load() {
        const [s, i] = await Promise.all([
          client.from(STATUS_TABLE).select('item_id,market,status,note,updated_at'),
          client.from(ITEMS_TABLE).select('id,data'),
        ]);
        if (s.error) throw new Error(s.error.message);
        if (i.error) throw new Error(i.error.message);
        const records = {};
        for (const row of s.data) records[row.item_id] = row;
        const items = {};
        for (const row of i.data) items[row.id] = { ...row.data, id: row.id };
        return { records, items };
      },
      async save(record) {
        const { error } = await client.from(STATUS_TABLE).upsert(record, { onConflict: 'item_id' });
        if (error) throw new Error(error.message);
      },
      async saveItem(item) {
        const row = { id: item.id, market: item.market, data: item, updated_at: new Date().toISOString() };
        const { error } = await client.from(ITEMS_TABLE).upsert(row, { onConflict: 'id' });
        if (error) throw new Error(error.message);
      },
      subscribe(onRecords, onItems, onConnection) {
        client
          .channel('gate_board_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: STATUS_TABLE }, payload => {
            if (payload.new && payload.new.item_id) onRecords([payload.new]);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: ITEMS_TABLE }, payload => {
            if (payload.new && payload.new.id) onItems([{ ...payload.new.data, id: payload.new.id }]);
          })
          .subscribe(status => onConnection && onConnection(status));
      },
    };
  }

  window.createStore = function (config) {
    const url = config && config.supabaseUrl && config.supabaseUrl.trim();
    const key = config && config.supabaseAnonKey && config.supabaseAnonKey.trim();
    if (url && key) {
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error('The Supabase library did not load. Check your internet connection.');
      }
      return createSupabaseStore(url, key);
    }
    return createLocalStore();
  };
})();
