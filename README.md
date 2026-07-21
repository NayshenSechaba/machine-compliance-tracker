# Ops Gate — Phase 1 MVP

The wedge product from the roadmap: a **pre-start compliance checklist** that
gates dispatch, and **the Vault**, an expiry tracker for PrDPs, licences, and
certificates. Both write to the same four-pillar schema (assets, operators,
compliance_items, events) so Phase 2 and 3 tools can be built on top without
touching this data model again.

Stack: **Next.js 14 (App Router) + Supabase + Tailwind**, deployed on **Vercel**.

## 1. Run it locally, right now (no setup)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. With no `.env.local`, the app runs in **demo
mode** — sample fleet data, no database required — so you (or a design
partner) can click through the whole flow before anything is wired up.

## 2. Connect your own Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql` — this creates the four core
   tables, the multi-tenant `organisations`/`profiles` split, row-level
   security policies, and the `ops-media` storage bucket for photos and
   documents.
3. Optionally run `supabase/seed.sql` for a demo fleet to test against.
4. Copy `.env.local.example` to `.env.local` and fill in your project URL and
   anon key (Project Settings → API).
5. To actually see data: create a user via Supabase Auth, then insert a row
   into `profiles` linking that user's `id` to an `org_id` in
   `organisations`. Until a profile exists, RLS will correctly show nothing.

```bash
cp .env.local.example .env.local
npm run dev
```

## 3. Deploy

```bash
vercel
```

Add the same two env vars in the Vercel project settings (Production and
Preview). No other config needed — this is a standard Next.js app.

## What's built vs. what's stubbed

**Built:**
- Full schema: `assets`, `operators`, `compliance_items`, `events`, RLS
  scoped by organisation, a `compliance_status` view that does the
  expiry-bucket math (expired / critical / warning / upcoming / ok).
- `/dashboard` — fleet overview: asset status, items needing action.
- `/checklist` — the dispatch gate: pick asset + operator, pass/fail every
  component, submit. A single "fail" flips the asset to `blocked` and shows
  **DISPATCH BLOCKED**; all-pass shows **DISPATCH CLEARED**. This state
  change and the underlying event log are the whole value proposition.
- `/vault` — expiry list sorted by urgency, with the alerting logic spelled
  out (see below) rather than hidden behind a "coming soon."

**Deliberately stubbed for you to wire up next** (in priority order):

1. **Auth.** There's no login screen yet — add Supabase Auth (magic link is
   the fastest fit for drivers) and drop it in front of these routes.
2. **Photo upload per component.** The `ops-media` bucket and its policies
   already exist in `schema.sql`; the checklist UI needs a file input per
   failed component uploading via `supabase.storage.from("ops-media")`.
3. **WhatsApp/email alerts.** Point an n8n scheduled workflow at the
   `compliance_status` view — filter `status in ('critical','warning')` and
   a stale `last_alert_sent_at` — then call the WhatsApp Business API or
   Twilio and stamp `last_alert_sent_at`. This is genuinely a config task in
   n8n, not new application code.
4. **Multi-asset dropdowns from live data.** The checklist page currently
   reads the demo list on the client for simplicity; once auth is in, fetch
   `assets`/`operators` scoped to the signed-in user's org.

## Why the schema looks like this

Every table carries `org_id` so this is multi-tenant from day one — you can
onboard a second design-partner fleet without a migration. `compliance_items`
attaches to *either* an operator or an asset (never both), because a PrDP
belongs to a person and a roadworthy certificate belongs to a vehicle, but
the Vault dashboard treats them identically. `events` is intentionally the
widest table — `flagged_components`, `photo_urls`, `notes` — because it's the
raw material for Phase 2's maintenance scheduler ("this truck has failed
hydraulic checks 3 times this month") and Phase 3's predictive flagging.
Nothing about that later work requires changing this schema — only what
reads from it.
