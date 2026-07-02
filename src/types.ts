export type PlayerStatus = 'confirmed' | 'tbd'
export type MatchState = 'queued' | 'live' | 'complete'

export type Player = {
  id: string
  displayName: string
  handle: string
  shortName: string
  status: PlayerStatus
  source: 'announcement' | 'placeholder'
  twitchUrl: string | null
  xUrl: string | null
  tags: string[]
  note: string
}

export type MatchSide = {
  playerId: string | null
  label: string
}

export type Match = {
  id: string
  phase: string
  round: string
  table: string
  state: MatchState
  sideA: MatchSide
  sideB: MatchSide
  scoreA: number | null
  scoreB: number | null
  winnerId: string | null
}

export type FormatOption = {
  id: string
  label: string
  summary: string
  operatorNote: string
}

export type Prize = {
  title: string
  description: string
}

export type Pickem = {
  championId: string
  finalistId: string
  sleeperId: string
}

export type TournamentEvent = {
  id: string
  slug: string
  name: string
  subtitle: string
  startUtc: string
  startLabel: string
  hostLabel: string
  streamLabel: string
  currentPhase: string
  lastUpdatedLabel: string
}

export type TournamentData = {
  event: TournamentEvent
  players: Player[]
  formatOptions: FormatOption[]
  matches: Match[]
  prizes: Prize[]
}
