# Supabase migration notes

## Data cleanup

The runtime frontend has been moved to Supabase. Before public launch, search the repo for:

```text
MOCK_
placeholder
TBD
```

`placeholder` and `TBD` are allowed only where the product is deliberately showing unknown facts.
They should not be used for fake scores, fake winners, fake confirmed competitors, or fake official links.

## Tables

Implemented in `supabase/migrations/20260702123000_init_tournament.sql`:

- `events`
- `players`
- `format_options`
- `matches`
- `prizes`
- `outreach_steps`
- `pickems`
- `admin_users`
- `standings` view

## Realtime plan

The frontend subscribes to `matches` and `players` for the active event. Standings are still computed client-side from match rows for fast UI iteration; the database also exposes a `standings` view for future admin/overlay use.

## RLS plan

Public users can read public event data and insert pickems. Pickem reads are admin-only.

Match writes are admin-only through `admin_users`, keyed by Supabase Auth email. Until an admin session exists, the admin panel updates the local preview and reports the RLS write failure.

## Hosting plan

Static frontend can go to GitHub Pages, Cloudflare Pages, or Vercel. If GitHub Pages is used from a free account, plan for the repository to be public before launch.
