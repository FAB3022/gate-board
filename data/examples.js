// Example tasks added outside the skill checklist. They behave like tasks added in the dashboard:
// anyone can edit or remove them, and those changes are saved like any other added task.
(function () {
  const origin = {
    type: 'slack',
    channel: '#june-launch-2026',
    date: '2026-07-28',
    summary: 'A request in the launch channel to add a main image owner to the launch checklist. Earlier in the launch, the team found nobody was reviewing the main image, benchmarking it against the market, checking size and ratio, or checking brightness and saturation. Later messages asked to test the main keyword, an origin badge and a box callout at a 4:5 ratio to lift click-through, and to hold go-live until the main image was approved.',
  };
  const link = 'https://nutratology-atlantis.slack.com/archives/C0B2H7PE09Z/p1785190377813019';
  const base = {
    phase: 'pre',
    when: 'T-21',
    owner: 'Design',
    scope: 'P',
    blocking: true,
    source: 'OBS',
    title: 'Assign a main image owner and get the main image signed off before go-live',
    detail: 'One role reviews the main image against competitors for the main keyword; checks size and ratio (e.g. 4:5), brightness and saturation; and tests callouts such as an origin badge or box callout for click-through. No go-live until this role approves the main image.',
    origin,
    link,
    createdAt: '2026-09-26T00:00:00.000Z',
  };
  window.EXAMPLE_ITEMS = [
    { ...base, id: 'US-NEW-slk001', market: 'US', section: 'C6. Listing build' },
    { ...base, id: 'CA-NEW-slk001', market: 'CA', section: 'A7. Creatives' },
  ];
})();
