import { supabase } from './supabase'
import type {
  FormatOption,
  Match,
  MatchState,
  Pickem,
  Player,
  PlayerStatus,
  TournamentData,
  TournamentEvent,
} from '../types'

const EVENT_SLUG = 'shit-fighters-2026'

type EventRow = {
  id: string
  slug: string
  name: string
  subtitle: string
  starts_at: string
  host_label: string
  stream_label: string
  current_phase: string
  last_updated_label: string
}

type PlayerRow = {
  id: string
  display_name: string
  handle: string
  short_name: string
  status: PlayerStatus
  source: Player['source'] | 'organizer'
  twitch_url: string | null
  x_url: string | null
  tags: string[]
  note: string
}

type FormatRow = {
  id: string
  label: string
  summary: string
  operator_note: string
}

type MatchRow = {
  id: string
  phase: string
  round: string
  table_label: string
  state: MatchState
  side_a_player_id: string | null
  side_a_label: string
  side_b_player_id: string | null
  side_b_label: string
  score_a: number | null
  score_b: number | null
  winner_id: string | null
}

type PrizeRow = {
  title: string
  description: string
}

type SupabaseLikeError = {
  code?: string
  message?: string
  details?: string | null
}

function toError(error: SupabaseLikeError) {
  return new Error([error.code, error.message, error.details].filter(Boolean).join(': '))
}

function eventStartLabel(startsAt: string) {
  const date = new Date(startsAt)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  }).format(date)
}

function mapEvent(row: EventRow): TournamentEvent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    startUtc: row.starts_at,
    startLabel: eventStartLabel(row.starts_at),
    hostLabel: row.host_label,
    streamLabel: row.stream_label,
    currentPhase: row.current_phase,
    lastUpdatedLabel: row.last_updated_label,
  }
}

function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    displayName: row.display_name,
    handle: row.handle,
    shortName: row.short_name,
    status: row.status,
    source: row.source === 'organizer' ? 'announcement' : row.source,
    twitchUrl: row.twitch_url,
    xUrl: row.x_url,
    tags: row.tags,
    note: row.note,
  }
}

function mapFormat(row: FormatRow): FormatOption {
  return {
    id: row.id,
    label: row.label,
    summary: row.summary,
    operatorNote: row.operator_note,
  }
}

function mapMatch(row: MatchRow): Match {
  return {
    id: row.id,
    phase: row.phase,
    round: row.round,
    table: row.table_label,
    state: row.state,
    sideA: {
      playerId: row.side_a_player_id,
      label: row.side_a_label,
    },
    sideB: {
      playerId: row.side_b_player_id,
      label: row.side_b_label,
    },
    scoreA: row.score_a,
    scoreB: row.score_b,
    winnerId: row.winner_id,
  }
}

export async function fetchTournamentData(): Promise<TournamentData> {
  if (!supabase) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.')
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(
      'id, slug, name, subtitle, starts_at, host_label, stream_label, current_phase, last_updated_label',
    )
    .eq('slug', EVENT_SLUG)
    .single<EventRow>()

  if (eventError) throw toError(eventError)

  const [players, formatOptions, matches, prizes] = await Promise.all([
    supabase
      .from('players')
      .select('id, display_name, handle, short_name, status, source, twitch_url, x_url, tags, note')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true })
      .returns<PlayerRow[]>(),
    supabase
      .from('format_options')
      .select('id, label, summary, operator_note')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true })
      .returns<FormatRow[]>(),
    supabase
      .from('matches')
      .select(
        'id, phase, round, table_label, state, side_a_player_id, side_a_label, side_b_player_id, side_b_label, score_a, score_b, winner_id',
      )
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true })
      .returns<MatchRow[]>(),
    supabase
      .from('prizes')
      .select('title, description')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true })
      .returns<PrizeRow[]>(),
  ])

  const firstError = players.error ?? formatOptions.error ?? matches.error ?? prizes.error
  if (firstError) throw toError(firstError)

  return {
    event: mapEvent(event),
    players: (players.data ?? []).map(mapPlayer),
    formatOptions: (formatOptions.data ?? []).map(mapFormat),
    matches: (matches.data ?? []).map(mapMatch),
    prizes: prizes.data ?? [],
  }
}

export async function savePickem(eventId: string, viewerLabel: string, pickem: Pickem) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { error } = await supabase.from('pickems').insert({
    event_id: eventId,
    viewer_label: viewerLabel,
    champion_id: pickem.championId,
    finalist_id: pickem.finalistId,
    sleeper_id: pickem.sleeperId,
  })

  if (error) throw toError(error)
}

export function subscribeToTournament(eventId: string, onChange: () => void) {
  if (!supabase) return () => undefined

  const client = supabase
  const channel = client
    .channel(`tournament:${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `event_id=eq.${eventId}` },
      onChange,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `event_id=eq.${eventId}` },
      onChange,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
