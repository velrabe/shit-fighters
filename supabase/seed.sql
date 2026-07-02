insert into public.events (
  slug,
  name,
  subtitle,
  starts_at,
  host_label,
  stream_label,
  current_phase,
  last_updated_label
)
values (
  'shit-fighters-2026',
  'Shit Fighters',
  'Live bracket and pickems',
  '2026-07-08 20:00:00+00',
  'Ludwig event',
  'Main stream',
  'Ludwig vs John Doe live',
  'Ludwig took Game 1. Game 2 is underway.'
)
on conflict (slug) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  starts_at = excluded.starts_at,
  host_label = excluded.host_label,
  stream_label = excluded.stream_label,
  current_phase = excluded.current_phase,
  last_updated_label = excluded.last_updated_label;

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
delete from public.pickems
where event_id in (select id from event_row);

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
delete from public.matches
where event_id in (select id from event_row);

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
delete from public.prizes
where event_id in (select id from event_row);

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
delete from public.outreach_steps
where event_id in (select id from event_row);

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
delete from public.players
where event_id in (select id from event_row)
  and id in ('tbd-1', 'tbd-2', 'tbd-3');

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
insert into public.players (
  id,
  event_id,
  display_name,
  handle,
  short_name,
  status,
  source,
  twitch_url,
  x_url,
  tags,
  note,
  seed,
  sort_order
)
select rows.*
from event_row
cross join lateral (values
  ('ludwig', event_row.id, 'Ludwig', '@LudwigAhgren', 'LUD', 'confirmed'::public.player_status, 'organizer'::public.player_source, 'https://www.youtube.com/@Ludwig', 'https://x.com/LudwigAhgren', array['host pick','game 1 lead'], 'Demo live state: Ludwig won Game 1 and leads the opening set 1-0.', 1, 10),
  ('john-doe-1', event_row.id, 'John Doe', '@JohnDoe', 'JON', 'confirmed'::public.player_status, 'placeholder'::public.player_source, null, null, array['mystery slot','in lobby'], 'Demo player used for layout until the real competitor list is confirmed.', 8, 20),
  ('supertf', event_row.id, 'super', '@supertf', 'SUP', 'confirmed'::public.player_status, 'announcement'::public.player_source, 'https://www.twitch.tv/supertf', 'https://x.com/supertf', array['FPS hands','loud reads'], 'Known from the event announcement.', 2, 30),
  ('slime-machine', event_row.id, 'Slime', '@slime_machine', 'SLM', 'confirmed'::public.player_status, 'announcement'::public.player_source, null, 'https://x.com/slime_machine', array['chaos desk','mind games'], 'Known from the event announcement. Stream link needs confirmation.', 7, 40),
  ('emilyywng', event_row.id, 'Emily', '@emilyywng', 'EMI', 'confirmed'::public.player_status, 'announcement'::public.player_source, null, 'https://x.com/emilyywng', array['wildcard','clutch factor'], 'Known from the event announcement. Stream link needs confirmation.', 4, 50),
  ('eskayow', event_row.id, 'Eskay', '@EskayOW', 'ESK', 'confirmed'::public.player_status, 'announcement'::public.player_source, null, 'https://x.com/EskayOW', array['movement brain','adaptation'], 'Known from the event announcement. Stream link needs confirmation.', 5, 60),
  ('nathanstanz', event_row.id, 'Nathan Stanz', '@NathanStanz', 'NAT', 'confirmed'::public.player_status, 'announcement'::public.player_source, 'https://www.twitch.tv/nathanstanz', 'https://x.com/NathanStanz', array['content veteran','pressure tested'], 'Known from the event announcement.', 3, 70),
  ('john-doe-2', event_row.id, 'John Doe 2', '@JohnDoe2', 'JD2', 'confirmed'::public.player_status, 'placeholder'::public.player_source, null, null, array['mystery slot','checked in'], 'Demo player used for layout until the real competitor list is confirmed.', 6, 80)
) as rows(
  id, event_id, display_name, handle, short_name, status, source, twitch_url, x_url, tags, note, seed, sort_order
)
on conflict (id) do update set
  event_id = excluded.event_id,
  display_name = excluded.display_name,
  handle = excluded.handle,
  short_name = excluded.short_name,
  status = excluded.status,
  source = excluded.source,
  twitch_url = excluded.twitch_url,
  x_url = excluded.x_url,
  tags = excluded.tags,
  note = excluded.note,
  seed = excluded.seed,
  sort_order = excluded.sort_order;

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
insert into public.format_options (id, event_id, label, summary, operator_note, sort_order)
select rows.*
from event_row
cross join lateral (values
  ('single-elim-eight', event_row.id, '8-player bracket', 'Eight players start in a single-elimination bracket. Win your set to stay alive.', 'Current set: Ludwig leads John Doe 1-0.', 10),
  ('best-of-three', event_row.id, 'Best of 3', 'Most sets are first to 2 games. The live score shows games inside the current set.', 'Game 2 is live now.', 20),
  ('pickems', event_row.id, 'Pickems', 'Choose a champion, finalist, and sleeper pick for bragging rights during the stream.', 'No odds, no wallet, no cash prizes.', 30)
) as rows(id, event_id, label, summary, operator_note, sort_order)
on conflict (id) do update set
  label = excluded.label,
  summary = excluded.summary,
  operator_note = excluded.operator_note,
  sort_order = excluded.sort_order;

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
insert into public.matches (
  id,
  event_id,
  phase,
  round,
  table_label,
  state,
  side_a_player_id,
  side_a_label,
  side_b_player_id,
  side_b_label,
  score_a,
  score_b,
  winner_id,
  sort_order
)
select rows.*
from event_row
cross join lateral (values
  ('qf-1', event_row.id, 'Opening bracket', 'Quarterfinal', 'A', 'live'::public.match_state, 'ludwig', 'Seed 1', 'john-doe-1', 'Seed 8', 1, 0, null::text, 10),
  ('qf-2', event_row.id, 'Opening bracket', 'Quarterfinal', 'B', 'queued'::public.match_state, 'supertf', 'Seed 2', 'slime-machine', 'Seed 7', null::integer, null::integer, null::text, 20),
  ('qf-3', event_row.id, 'Opening bracket', 'Quarterfinal', 'C', 'queued'::public.match_state, 'nathanstanz', 'Seed 3', 'john-doe-2', 'Seed 6', null::integer, null::integer, null::text, 30),
  ('qf-4', event_row.id, 'Opening bracket', 'Quarterfinal', 'D', 'queued'::public.match_state, 'emilyywng', 'Seed 4', 'eskayow', 'Seed 5', null::integer, null::integer, null::text, 40),
  ('sf-1', event_row.id, 'Final bracket', 'Semifinal', 'E', 'queued'::public.match_state, null::text, 'Winner A', null::text, 'Winner B', null::integer, null::integer, null::text, 50),
  ('sf-2', event_row.id, 'Final bracket', 'Semifinal', 'F', 'queued'::public.match_state, null::text, 'Winner C', null::text, 'Winner D', null::integer, null::integer, null::text, 60),
  ('grand-final', event_row.id, 'Final bracket', 'Grand final', 'G', 'queued'::public.match_state, null::text, 'Winner E', null::text, 'Winner F', null::integer, null::integer, null::text, 70)
) as rows(
  id, event_id, phase, round, table_label, state, side_a_player_id, side_a_label,
  side_b_player_id, side_b_label, score_a, score_b, winner_id, sort_order
);

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
insert into public.prizes (event_id, title, description, sort_order)
select event_row.id, rows.title, rows.description, rows.sort_order
from event_row,
(values
  ('Champion', 'Top of the bracket, full bragging rights, and the cleanest screenshot in chat.', 10),
  ('Clutch Clip', 'Best comeback, robbery, or last-round miracle of the night.', 20),
  ('Crowd Favorite', 'The player chat refuses to stop talking about.', 30)
) as rows(title, description, sort_order);
