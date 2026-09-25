// Status storage: Supabase when configured (shared, live), otherwise this browser's localStorage.
(function () {
  const TABLE = 'launch_status';
  const LOCAL_KEY = 'gate-board:status:v1';

  function createLocalStore() {
    let map = {};
    try { map = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); } catch (e) { map = {}; }
    return {
      mode: 'local',
      async load() { return { ...map }; },
      async save(record) {
        map[record.item_id] = record;
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(map)); }
        catch (e) { throw new Error('This browser blocked local storage'); }
      },
      subscribe(onRecords) {
        window.addEventListener('storage', e => {
          if (e.key !== LOCAL_KEY) return;
          try { map = JSON.parse(e.newValue || '{}'); } catch (err) { return; }
          onRecords(Object.values(map));
        });
      },
    };
  }

  function createSupabaseStore(url, anonKey) {
    const client = window.supabase.createClient(url, anonKey);
    return {
      mode: 'shared',
      async load() {
        const { data, error } = await client.from(TABLE).select('item_id,market,status,note,updated_at');
        if (error) throw new Error(error.message);
        const map = {};
        for (const row of data) map[row.item_id] = row;
        return map;
      },
      async save(record) {
        const { error } = await client.from(TABLE).upsert(record, { onConflict: 'item_id' });
        if (error) throw new Error(error.message);
      },
      subscribe(onRecords, onConnection) {
        client
          .channel('launch_status_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, payload => {
            if (payload.new && payload.new.item_id) onRecords([payload.new]);
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
