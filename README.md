# Gate Board

A launch-readiness dashboard for Nutratology supplement launches on Amazon.ca and Amazon.com. It tracks every checklist item from the `amazon-product-launch` skill (117 Canada items, 105 USA items), the four launch gates, and the 25 lessons behind the controls.

## What it does

- **Separate Canada and USA tracks.** The two marketplaces are never merged.
- **The four gates**, each shown as Pending, At risk or Passed:
  - Gate 1, Creative & Copy Freeze (T-14)
  - Gate 2, Compliance Sign-off (T-7)
  - Gate 3, Go / No-Go (T-2): every pre-launch BLOCKING item must be done
  - Gate 4, Launch-Day Image Gate (T0): no PPC or BEX until the correct images are live
- **Clear tasks:** each task shows a short title, its details, the owner role, timing, and whether it is blocking. Click the circle to mark a task done, or use the status menu for In progress, Blocked or N/A. Blocked tasks take a blocker note. N/A only counts as complete once a reason is written, because the SOP requires one.
- **Task detail view:** click any task to open its full page, with status, notes, owner, timing, which gates it counts toward, its source, and the lesson behind it. Use the arrows to step through tasks, or **Copy link** to share a link that opens straight into that task.
- **Add your own tasks** with **Add task**: pick the marketplace, phase, workstream, owner role, timing, source tag and whether it is blocking, and optionally link a Slack thread or doc. Added tasks count toward progress and gates, and can be edited or removed from their detail view. The example task "Assign a main image owner…" comes from a request in the June launch channel on Slack; it lives in `data/examples.js`.
- **Summary tiles** for blocking items still open, blocked, in progress and done. Click a tile to show just those tasks.
- **Group by** workstream, timeline (T-120 to T+30) or owner, with a sidebar to jump between groups.
- **Filters** by phase, status, owner role, blocking only, and a text search.
- **Copy outstanding** builds the "Outstanding items" post for the launch channel from what you are currently viewing, with blocking items first.
- **Playbook panel** with roles, cadence, tools and the lessons learned. Click a checklist ID in a lesson to jump to that item.

## Sharing statuses with the team (Supabase)

Without setup, statuses are saved in each person's browser only, and the page says so. To share them live:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
4. Paste both into [`config.js`](config.js), then commit and push.

If you set Supabase up before added tasks existed, run `schema.sql` again; it adds the `launch_items` table without touching existing data.

The badge at the top changes to **Shared · live**. Changes made by anyone appear on everyone's screen without refreshing.

> The anon key is meant to be public. Anyone with the dashboard link can read and change statuses, but not delete rows. Only share the link with the team.

## Run it locally

```bash
node tests/server.mjs        # then open http://localhost:4173
```

## Update the checklist from the skill

The item list in `data/checklist.js` is generated from the skill's reference files. After editing the checklist or lessons in the skill, regenerate it:

```bash
node scripts/build-data.mjs ../amazon-product-launch/amazon-product-launch/references
```

The script stops with an error if a table row is malformed or a lesson points to a checklist ID that does not exist.

## Tests

```bash
npm install
npx playwright install chromium
npm test
```

The browser tests cover rendering both markets, the filters, saving and reloading statuses, gate logic, lessons and the playbook, the copy-outstanding text, phone layout, shared mode against a simulated Supabase (saving, live updates, failed saves), and loading the real Supabase library.
