# Supabase migration notes

## Non-negotiable mock-data cleanup

Before database integration, search the repo for:

```text
SHIT_FIGHTERS_MOCK_DATA
MOCK_
Prototype data only
placeholder
TBD
```

`src/data/mockTournament.ts` is intentionally the central delete target. The app should stop importing `MOCK_*` constants once Supabase is connected.

## Suggested tables

`events`

- `id`
- `name`
- `slug`
- `starts_at`
- `stream_url`
- `status`

`players`

- `id`
- `event_id`
- `display_name`
- `handle`
- `twitch_url`
- `x_url`
- `seed`
- `status`

`matches`

- `id`
- `event_id`
- `round`
- `table_label`
- `state`
- `side_a_player_id`
- `side_b_player_id`
- `score_a`
- `score_b`
- `winner_id`
- `updated_at`

`pickems`

- `id`
- `event_id`
- `viewer_id`
- `champion_id`
- `finalist_id`
- `sleeper_id`
- `created_at`
- `locked_at`

`admin_users`

- `id`
- `email`
- `role`

## Realtime plan

Subscribe to `matches` for the active event. Recompute standings client-side for MVP, then move to a database view only if the calculation gets shared across multiple clients or admin screens.

## Hosting plan

Static frontend can go to GitHub Pages, Cloudflare Pages, or Vercel. If GitHub Pages is used from a free account, plan for the repository to be public before launch.
