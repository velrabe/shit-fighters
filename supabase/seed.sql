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
  'Unofficial live bracket and pickems HQ',
  '2026-07-08 20:00:00+00',
  'Ludwig event',
  'Official stream TBD',
  'Pre-event build',
  'Waiting for organizer format'
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
  ('supertf', event_row.id, 'super', '@supertf', 'SUP', 'confirmed'::public.player_status, 'announcement'::public.player_source, 'https://www.twitch.tv/supertf', 'https://x.com/supertf', array['FPS hands','loud reads'], 'Known from the event announcement. Seed is placeholder until organizer confirms bracket order.', 1, 10),
  ('slime-machine', event_row.id, 'Slime', '@slime_machine', 'SLM', 'confirmed'::public.player_status, 'announcement'::public.player_source, null, 'https://x.com/slime_machine', array['chaos desk','mind games'], 'Known from the event announcement. Twitch link needs confirmation.', 4, 20),
  ('emilyywng', event_row.id, 'Emily', '@emilyywng', 'EMI', 'confirmed'::public.player_status, 'announcement'::public.player_source, null, 'https://x.com/emilyywng', array['wildcard','clutch factor'], 'Known from the event announcement. Twitch link needs confirmation.', 3, 30),
  ('eskayow', event_row.id, 'Eskay', '@EskayOW', 'ESK', 'confirmed'::public.player_status, 'announcement'::public.player_source, null, 'https://x.com/EskayOW', array['movement brain','adaptation'], 'Known from the event announcement. Twitch link needs confirmation.', 6, 40),
  ('nathanstanz', event_row.id, 'Nathan Stanz', '@NathanStanz', 'NAT', 'confirmed'::public.player_status, 'announcement'::public.player_source, 'https://www.twitch.tv/nathanstanz', 'https://x.com/NathanStanz', array['content veteran','pressure tested'], 'Known from the event announcement. Seed is placeholder until organizer confirms bracket order.', 5, 50),
  ('tbd-1', event_row.id, 'Competitor TBD', 'TBD', 'TBD', 'tbd'::public.player_status, 'placeholder'::public.player_source, null, null, array['slot open'], 'Placeholder. Replace once Ludwig or production confirms the player.', null, 60),
  ('tbd-2', event_row.id, 'Competitor TBD', 'TBD', 'TBD', 'tbd'::public.player_status, 'placeholder'::public.player_source, null, null, array['slot open'], 'Placeholder. Replace once Ludwig or production confirms the player.', null, 70),
  ('tbd-3', event_row.id, 'Competitor TBD', 'TBD', 'TBD', 'tbd'::public.player_status, 'placeholder'::public.player_source, null, null, array['slot open'], 'Placeholder. Replace once Ludwig or production confirms the player.', null, 80)
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
  ('round-robin-top-four', event_row.id, 'Round robin into top 4', 'Best MVP default: everyone gets screen time, standings are easy to update, top 4 becomes a clean bracket.', 'Use if the event has enough time and wants more content before elimination stakes.', 10),
  ('single-elim-eight', event_row.id, 'Single elimination, 8 players', 'Fastest to run on stream. The site can show a classic arcade bracket with very little admin overhead.', 'Use if production wants a tight segment and competitors are mostly content guests.', 20),
  ('double-elim-lite', event_row.id, 'Double elimination lite', 'More fair for Street Fighter, but it needs cleaner admin work and more match slots.', 'Use only if organizer format confirms winners and losers sides.', 30)
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
  ('qf-1', event_row.id, 'Demo bracket', 'Quarterfinal', 'A', 'queued'::public.match_state, 'supertf', 'Seed 1', 'tbd-1', 'TBD slot', null::integer, null::integer, null::text, 10),
  ('qf-2', event_row.id, 'Demo bracket', 'Quarterfinal', 'B', 'queued'::public.match_state, 'slime-machine', 'Seed 4', 'nathanstanz', 'Seed 5', null::integer, null::integer, null::text, 20),
  ('qf-3', event_row.id, 'Demo bracket', 'Quarterfinal', 'C', 'queued'::public.match_state, 'emilyywng', 'Seed 3', 'eskayow', 'Seed 6', null::integer, null::integer, null::text, 30),
  ('qf-4', event_row.id, 'Demo bracket', 'Quarterfinal', 'D', 'queued'::public.match_state, 'tbd-2', 'TBD slot', 'tbd-3', 'TBD slot', null::integer, null::integer, null::text, 40),
  ('sf-1', event_row.id, 'Demo bracket', 'Semifinal', 'E', 'queued'::public.match_state, null::text, 'Winner A', null::text, 'Winner B', null::integer, null::integer, null::text, 50),
  ('sf-2', event_row.id, 'Demo bracket', 'Semifinal', 'F', 'queued'::public.match_state, null::text, 'Winner C', null::text, 'Winner D', null::integer, null::integer, null::text, 60),
  ('grand-final', event_row.id, 'Demo bracket', 'Grand final', 'G', 'queued'::public.match_state, null::text, 'Winner E', null::text, 'Winner F', null::integer, null::integer, null::text, 70)
) as rows(
  id, event_id, phase, round, table_label, state, side_a_player_id, side_a_label,
  side_b_player_id, side_b_label, score_a, score_b, winner_id, sort_order
)
on conflict (id) do update set
  phase = excluded.phase,
  round = excluded.round,
  table_label = excluded.table_label,
  state = excluded.state,
  side_a_player_id = excluded.side_a_player_id,
  side_a_label = excluded.side_a_label,
  side_b_player_id = excluded.side_b_player_id,
  side_b_label = excluded.side_b_label,
  score_a = excluded.score_a,
  score_b = excluded.score_b,
  winner_id = excluded.winner_id,
  sort_order = excluded.sort_order;

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
insert into public.prizes (event_id, title, description, sort_order)
select event_row.id, rows.title, rows.description, rows.sort_order
from event_row,
(values
  ('Golden Plunger', 'Champion trophy placeholder. Dumb enough for the name, readable enough for stream graphics.', 10),
  ('Frame Data Apology Form', 'For the player who loses while explaining why they were technically winning.', 20),
  ('Mash Certified', 'Audience award for the most spiritually correct panic buttons.', 30)
) as rows(title, description, sort_order)
where not exists (select 1 from public.prizes where prizes.event_id = event_row.id);

with event_row as (
  select id from public.events where slug = 'shit-fighters-2026'
)
insert into public.outreach_steps (event_id, channel, goal, asset, sort_order)
select event_row.id, rows.channel, rows.goal, rows.asset, rows.sort_order
from event_row,
(values
  ('Organizer DM', 'Offer the MVP as a free production helper before July 8.', 'Live URL, short demo clip, admin sandbox screenshot.', 10),
  ('Reddit', 'Give the community one useful link without pretending it is official.', 'Prototype disclaimer, bracket URL, update cadence.', 20),
  ('Twitch chat', 'Drop a concise link when bracket confusion starts.', 'Mobile-friendly page, clear unofficial label, no spam cadence.', 30),
  ('Personal X / site', 'Convert accidental traffic into followers and small dev credibility.', 'Pinned build thread, one-line offer, portfolio link.', 40)
) as rows(channel, goal, asset, sort_order)
where not exists (select 1 from public.outreach_steps where outreach_steps.event_id = event_row.id);
