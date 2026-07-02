create extension if not exists pgcrypto with schema extensions;

create type public.player_status as enum ('confirmed', 'tbd');
create type public.match_state as enum ('queued', 'live', 'complete');
create type public.player_source as enum ('announcement', 'placeholder', 'organizer');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text not null default '',
  starts_at timestamptz not null,
  host_label text not null default '',
  stream_label text not null default 'Official stream TBD',
  current_phase text not null default 'Pre-event build',
  last_updated_label text not null default 'Waiting for organizer format',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id text primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text not null,
  handle text not null,
  short_name text not null,
  status public.player_status not null default 'tbd',
  source public.player_source not null default 'placeholder',
  twitch_url text,
  x_url text,
  tags text[] not null default '{}',
  note text not null default '',
  seed integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_seed_positive check (seed is null or seed > 0),
  constraint players_tbd_source check (status = 'confirmed' or source = 'placeholder')
);

create table public.format_options (
  id text primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null,
  summary text not null,
  operator_note text not null,
  sort_order integer not null default 0
);

create table public.matches (
  id text primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  phase text not null,
  round text not null,
  table_label text not null,
  state public.match_state not null default 'queued',
  side_a_player_id text references public.players(id) on delete set null,
  side_a_label text not null,
  side_b_player_id text references public.players(id) on delete set null,
  side_b_label text not null,
  score_a integer,
  score_b integer,
  winner_id text references public.players(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_scores_non_negative check (
    (score_a is null or score_a >= 0) and (score_b is null or score_b >= 0)
  ),
  constraint matches_complete_has_winner check (
    state <> 'complete' or winner_id is not null
  )
);

create table public.prizes (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text not null,
  sort_order integer not null default 0
);

create table public.outreach_steps (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  channel text not null,
  goal text not null,
  asset text not null,
  sort_order integer not null default 0
);

create table public.pickems (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  viewer_label text not null,
  champion_id text not null references public.players(id) on delete restrict,
  finalist_id text not null references public.players(id) on delete restrict,
  sleeper_id text not null references public.players(id) on delete restrict,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  constraint pickems_viewer_label_length check (char_length(viewer_label) between 2 and 64),
  constraint pickems_distinct_choices check (
    champion_id <> finalist_id
    and champion_id <> sleeper_id
    and finalist_id <> sleeper_id
  )
);

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_touch_updated_at
before update on public.events
for each row execute function public.touch_updated_at();

create trigger players_touch_updated_at
before update on public.players
for each row execute function public.touch_updated_at();

create trigger matches_touch_updated_at
before update on public.matches
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where email = auth.jwt() ->> 'email'
  );
$$;

create or replace view public.standings
with (security_invoker = true)
as
with match_sides as (
  select
    event_id,
    side_a_player_id as player_id,
    winner_id,
    score_a as games_for,
    score_b as games_against,
    state
  from public.matches
  where side_a_player_id is not null
  union all
  select
    event_id,
    side_b_player_id as player_id,
    winner_id,
    score_b as games_for,
    score_a as games_against,
    state
  from public.matches
  where side_b_player_id is not null
)
select
  players.event_id,
  players.id as player_id,
  players.display_name,
  coalesce(count(*) filter (where match_sides.state = 'complete' and match_sides.winner_id = players.id), 0) as wins,
  coalesce(count(*) filter (where match_sides.state = 'complete' and match_sides.winner_id <> players.id), 0) as losses,
  coalesce(sum(match_sides.games_for) filter (where match_sides.state = 'complete'), 0) as games_for,
  coalesce(sum(match_sides.games_against) filter (where match_sides.state = 'complete'), 0) as games_against,
  coalesce(sum(match_sides.games_for - match_sides.games_against) filter (where match_sides.state = 'complete'), 0) as game_diff
from public.players
left join match_sides on match_sides.player_id = players.id
where players.status = 'confirmed'
group by players.event_id, players.id, players.display_name;

alter table public.events enable row level security;
alter table public.players enable row level security;
alter table public.format_options enable row level security;
alter table public.matches enable row level security;
alter table public.prizes enable row level security;
alter table public.outreach_steps enable row level security;
alter table public.pickems enable row level security;
alter table public.admin_users enable row level security;

create policy "Public can read public events"
on public.events for select
to anon, authenticated
using (is_public);

create policy "Public can read players"
on public.players for select
to anon, authenticated
using (exists (
  select 1 from public.events
  where events.id = players.event_id and events.is_public
));

create policy "Public can read format options"
on public.format_options for select
to anon, authenticated
using (exists (
  select 1 from public.events
  where events.id = format_options.event_id and events.is_public
));

create policy "Public can read matches"
on public.matches for select
to anon, authenticated
using (exists (
  select 1 from public.events
  where events.id = matches.event_id and events.is_public
));

create policy "Public can read prizes"
on public.prizes for select
to anon, authenticated
using (exists (
  select 1 from public.events
  where events.id = prizes.event_id and events.is_public
));

create policy "Public can read outreach steps"
on public.outreach_steps for select
to anon, authenticated
using (exists (
  select 1 from public.events
  where events.id = outreach_steps.event_id and events.is_public
));

create policy "Anyone can create pickems"
on public.pickems for insert
to anon, authenticated
with check (exists (
  select 1 from public.events
  where events.id = pickems.event_id and events.is_public
));

create policy "Admins can read pickems"
on public.pickems for select
to authenticated
using (public.is_admin());

create policy "Admins can read admin users"
on public.admin_users for select
to authenticated
using (public.is_admin());

create policy "Admins can manage events"
on public.events for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage players"
on public.players for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage format options"
on public.format_options for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage matches"
on public.matches for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage prizes"
on public.prizes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage outreach steps"
on public.outreach_steps for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.players;
