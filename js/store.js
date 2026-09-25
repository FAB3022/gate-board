// Storage for task statuses, added tasks and products: Supabase when configured (shared, live),
// otherwise this browser's localStorage.
(function () {
  const TABLES = { records: 'launch_status', items: 'launch_items', products: 'launch_products' };
  const KEYS = { records: 'gate-board:status:v1', items: 'gate-board:items:v1', products: 'gate-board:products:v1' };

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { return {}; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { throw new Error('This browser blocked local storage'); }
  }

  function createLocalStore() {
    const data = { records: readJson(KEYS.records), items: readJson(KEYS.items), products: readJson(KEYS.products) };
    const put = (kind, id, value) => { data[kind][id] = value; writeJson(KEYS[kind], data[kind]); };
    return {
      mode: 'local',
      async load() { return { records: { ...data.records }, items: { ...data.items }, products: { ...data.products } }; },
      async save(record) { put('records', record.item_id, record); },
      async saveItem(item) { put('items', item.id, item); },
      async saveProduct(product) { put('products', product.id, product); },
      subscribe(handlers) {
        window.addEventListener('storage', e => {
          for (const kind of Object.keys(KEYS)) {
            if (e.key !== KEYS[kind]) continue;
            data[kind] = readJson(KEYS[kind]);
            handlers[kind](Object.values(data[kind]));
          }
        });
      },
    };
  }

  function createSupabaseStore(url, anonKey) {
    const client = window.supabase.createClient(url, anonKey);
    const upsert = async (table, row, key) => {
      const { error } = await client.from(table).upsert(row, { onConflict: key });
      if (error) throw new Error(error.message);
    };
    const docRow = obj => ({ id: obj.id, market: obj.market, data: obj, updated_at: new Date().toISOString() });
    return {
      mode: 'shared',
      async load() {
        const [s, i, p] = await Promise.all([
          client.from(TABLES.records).select('item_id,market,status,note,updated_at'),
          client.from(TABLES.items).select('id,data'),
          client.from(TABLES.products).select('id,data'),
        ]);
        for (const res of [s, i, p]) if (res.error) throw new Error(res.error.message);
        const records = {};
        for (const row of s.data) records[row.item_id] = row;
        const items = {};
        for (const row of i.data) items[row.id] = { ...row.data, id: row.id };
        const products = {};
        for (const row of p.data) products[row.id] = { ...row.data, id: row.id };
        return { records, items, products };
      },
      save: record => upsert(TABLES.records, record, 'item_id'),
      saveItem: item => upsert(TABLES.items, docRow(item), 'id'),
      saveProduct: product => upsert(TABLES.products, docRow(product), 'id'),
      subscribe(handlers) {
        const doc = row => ({ ...row.data, id: row.id });
        client
          .channel('gate_board_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.records }, payload => {
            if (payload.new && payload.new.item_id) handlers.records([payload.new]);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.items }, payload => {
            if (payload.new && payload.new.id) handlers.items([doc(payload.new)]);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.products }, payload => {
            if (payload.new && payload.new.id) handlers.products([doc(payload.new)]);
          })
          .subscribe(status => handlers.connection && handlers.connection(status));
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
