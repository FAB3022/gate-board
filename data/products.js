// Products in the current launch per marketplace. Edits made in the dashboard (rename, add, remove)
// are saved like statuses and override these defaults.
(function () {
  const kickoff = {
    type: 'slack',
    channel: '#electrolytes-launch-checklist',
    date: '2026-09-22',
    summary: 'Electrolytes kickoff: 4 SKUs (4 flavours, same electrolyte formula), 20 stick packs per box at 4 g each. Amazon launch 19 Oct 2026 (Shopify 1 Oct). Vine: per flavour, same 20-stick count as the main listing with a separate barcode and ASIN.',
  };
  const electrolytes = {
    market: 'CA',
    format: 'Stick pack',
    size: '20 sticks × 4 g',
    notes: 'Vine listing per flavour: same 20-stick count as the main listing, separate barcode and ASIN.',
    origin: kickoff,
    link: 'https://nutratology-atlantis.slack.com/archives/C0C3P3S1JJD',
    createdAt: '2026-09-22T00:00:00.000Z',
  };
  window.DEFAULT_PRODUCTS = [
    { ...electrolytes, id: 'lemlim', order: 1, name: 'Electrolytes · Lemon Lime', flavour: 'Lemon Lime' },
    { ...electrolytes, id: 'blulem', order: 2, name: 'Electrolytes · Blueberry Lemonade', flavour: 'Blueberry Lemonade' },
    { ...electrolytes, id: 'pchpom', order: 3, name: 'Electrolytes · Peach Pomelo', flavour: 'Peach Pomelo' },
    { ...electrolytes, id: 'strkiw', order: 4, name: 'Electrolytes · Strawberry Kiwi', flavour: 'Strawberry Kiwi' },
    { id: 'proda1', market: 'US', order: 1, name: 'Product A', notes: 'Placeholder. Rename it or add the real products for the next USA launch.', createdAt: '2026-09-26T00:00:00.000Z' },
  ];
})();
