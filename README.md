# Shit Fighters

Unofficial live companion for Ludwig's July 8 Street Fighter content tournament.

The current version is a Vite/React frontend backed by Supabase with:

- event landing page
- competitor cards
- public format notes
- bracket and standings
- Supabase pickems insert path
- realtime match subscriptions
- live match state from Supabase

## Data rule

Runtime tournament data comes from Supabase. There is no frontend mock-data file.

Bootstrap content lives in:

`supabase/seed.sql`

Unknown tournament facts must be stored as explicit `TBD` / `placeholder` rows, never as hidden fake data.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Supabase

The schema lives in `supabase/migrations/20260702123000_init_tournament.sql`.

Apply it with a logged-in Supabase CLI or a database URL:

```bash
supabase link --project-ref <project-ref>
supabase db push
supabase db query --file supabase/seed.sql --linked
```

The frontend needs:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Ponytail

The Ponytail marketplace was added with:

```bash
codex plugin marketplace add DietrichGebert/ponytail
```

Install it from `/plugins`, trust its hooks in `/hooks`, then restart Codex for future threads.
