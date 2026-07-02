import type { FormatOption, Match, OutreachStep, Player, Prize } from '../types'

/**
 * SHIT_FIGHTERS_MOCK_DATA
 *
 * This file is the only place where prototype tournament data should live.
 * Delete it when the project moves to Supabase.
 *
 * Known facts from the announcement:
 * - Event: Shit Fighters
 * - Date/time: July 8, 1 PM PT
 * - Confirmed handles: @supertf, @slime_machine, @emilyywng, @EskayOW, @NathanStanz
 * - Remaining competitors: TBD
 *
 * Everything else below is placeholder content for the first frontend pass.
 */

export const MOCK_DATA_NOTICE =
  'Prototype data only. Scores, seeds, bracket order, Twitch links, format, and prizes are not official.'

export const MOCK_EVENT = {
  name: 'Shit Fighters',
  subtitle: 'Unofficial live bracket and pickems HQ',
  startUtc: '2026-07-08T20:00:00Z',
  startLabel: 'July 8, 1 PM PT',
  hostLabel: 'Ludwig event',
  streamLabel: 'Official stream TBD',
  currentPhase: 'Pre-event build',
  lastUpdatedLabel: 'Waiting for organizer format',
}

export const MOCK_PLAYERS: Player[] = [
  {
    id: 'supertf',
    displayName: 'super',
    handle: '@supertf',
    shortName: 'SUP',
    status: 'confirmed',
    source: 'announcement',
    twitchUrl: 'https://www.twitch.tv/supertf',
    xUrl: 'https://x.com/supertf',
    tags: ['FPS hands', 'loud reads'],
    note: 'Known from the event announcement. Seed is placeholder.',
  },
  {
    id: 'slime-machine',
    displayName: 'Slime',
    handle: '@slime_machine',
    shortName: 'SLM',
    status: 'confirmed',
    source: 'announcement',
    twitchUrl: null,
    xUrl: 'https://x.com/slime_machine',
    tags: ['chaos desk', 'mind games'],
    note: 'Known from the event announcement. Twitch link needs confirmation.',
  },
  {
    id: 'emilyywng',
    displayName: 'Emily',
    handle: '@emilyywng',
    shortName: 'EMI',
    status: 'confirmed',
    source: 'announcement',
    twitchUrl: null,
    xUrl: 'https://x.com/emilyywng',
    tags: ['wildcard', 'clutch factor'],
    note: 'Known from the event announcement. Twitch link needs confirmation.',
  },
  {
    id: 'eskayow',
    displayName: 'Eskay',
    handle: '@EskayOW',
    shortName: 'ESK',
    status: 'confirmed',
    source: 'announcement',
    twitchUrl: null,
    xUrl: 'https://x.com/EskayOW',
    tags: ['movement brain', 'adaptation'],
    note: 'Known from the event announcement. Twitch link needs confirmation.',
  },
  {
    id: 'nathanstanz',
    displayName: 'Nathan Stanz',
    handle: '@NathanStanz',
    shortName: 'NAT',
    status: 'confirmed',
    source: 'announcement',
    twitchUrl: 'https://www.twitch.tv/nathanstanz',
    xUrl: 'https://x.com/NathanStanz',
    tags: ['content veteran', 'pressure tested'],
    note: 'Known from the event announcement. Seed is placeholder.',
  },
  {
    id: 'tbd-1',
    displayName: 'Competitor TBD',
    handle: 'TBD',
    shortName: 'TBD',
    status: 'tbd',
    source: 'placeholder',
    twitchUrl: null,
    xUrl: null,
    tags: ['slot open'],
    note: 'Placeholder. Replace once Ludwig or production confirms the player.',
  },
  {
    id: 'tbd-2',
    displayName: 'Competitor TBD',
    handle: 'TBD',
    shortName: 'TBD',
    status: 'tbd',
    source: 'placeholder',
    twitchUrl: null,
    xUrl: null,
    tags: ['slot open'],
    note: 'Placeholder. Replace once Ludwig or production confirms the player.',
  },
  {
    id: 'tbd-3',
    displayName: 'Competitor TBD',
    handle: 'TBD',
    shortName: 'TBD',
    status: 'tbd',
    source: 'placeholder',
    twitchUrl: null,
    xUrl: null,
    tags: ['slot open'],
    note: 'Placeholder. Replace once Ludwig or production confirms the player.',
  },
]

export const MOCK_FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'round-robin-top-four',
    label: 'Round robin into top 4',
    summary:
      'Best MVP default: everyone gets screen time, standings are easy to update, top 4 becomes a clean bracket.',
    operatorNote:
      'Use if the event has enough time and wants more content before elimination stakes.',
  },
  {
    id: 'single-elim-eight',
    label: 'Single elimination, 8 players',
    summary:
      'Fastest to run on stream. The site can show a classic arcade bracket with very little admin overhead.',
    operatorNote:
      'Use if production wants a tight segment and competitors are mostly content guests.',
  },
  {
    id: 'double-elim-lite',
    label: 'Double elimination lite',
    summary:
      'More fair for Street Fighter, but it needs cleaner admin work and more match slots.',
    operatorNote:
      'Use only if organizer format confirms winners and losers sides.',
  },
]

export const MOCK_MATCHES: Match[] = [
  {
    id: 'qf-1',
    phase: 'Demo bracket',
    round: 'Quarterfinal',
    table: 'A',
    state: 'queued',
    sideA: { playerId: 'supertf', label: 'Seed 1' },
    sideB: { playerId: 'tbd-1', label: 'TBD slot' },
    scoreA: null,
    scoreB: null,
    winnerId: null,
  },
  {
    id: 'qf-2',
    phase: 'Demo bracket',
    round: 'Quarterfinal',
    table: 'B',
    state: 'queued',
    sideA: { playerId: 'slime-machine', label: 'Seed 4' },
    sideB: { playerId: 'nathanstanz', label: 'Seed 5' },
    scoreA: null,
    scoreB: null,
    winnerId: null,
  },
  {
    id: 'qf-3',
    phase: 'Demo bracket',
    round: 'Quarterfinal',
    table: 'C',
    state: 'queued',
    sideA: { playerId: 'emilyywng', label: 'Seed 3' },
    sideB: { playerId: 'eskayow', label: 'Seed 6' },
    scoreA: null,
    scoreB: null,
    winnerId: null,
  },
  {
    id: 'qf-4',
    phase: 'Demo bracket',
    round: 'Quarterfinal',
    table: 'D',
    state: 'queued',
    sideA: { playerId: 'tbd-2', label: 'TBD slot' },
    sideB: { playerId: 'tbd-3', label: 'TBD slot' },
    scoreA: null,
    scoreB: null,
    winnerId: null,
  },
  {
    id: 'sf-1',
    phase: 'Demo bracket',
    round: 'Semifinal',
    table: 'E',
    state: 'queued',
    sideA: { playerId: null, label: 'Winner A' },
    sideB: { playerId: null, label: 'Winner B' },
    scoreA: null,
    scoreB: null,
    winnerId: null,
  },
  {
    id: 'sf-2',
    phase: 'Demo bracket',
    round: 'Semifinal',
    table: 'F',
    state: 'queued',
    sideA: { playerId: null, label: 'Winner C' },
    sideB: { playerId: null, label: 'Winner D' },
    scoreA: null,
    scoreB: null,
    winnerId: null,
  },
  {
    id: 'grand-final',
    phase: 'Demo bracket',
    round: 'Grand final',
    table: 'G',
    state: 'queued',
    sideA: { playerId: null, label: 'Winner E' },
    sideB: { playerId: null, label: 'Winner F' },
    scoreA: null,
    scoreB: null,
    winnerId: null,
  },
]

export const MOCK_PRIZES: Prize[] = [
  {
    title: 'Golden Plunger',
    description: 'Champion trophy placeholder. Dumb enough for the name, readable enough for stream graphics.',
  },
  {
    title: 'Frame Data Apology Form',
    description: 'For the player who loses while explaining why they were technically winning.',
  },
  {
    title: 'Mash Certified',
    description: 'Audience award for the most spiritually correct panic buttons.',
  },
]

export const MOCK_OUTREACH: OutreachStep[] = [
  {
    channel: 'Organizer DM',
    goal: 'Offer the MVP as a free production helper before July 8.',
    asset: 'Live URL, short demo clip, admin sandbox screenshot.',
  },
  {
    channel: 'Reddit',
    goal: 'Give the community one useful link without pretending it is official.',
    asset: 'Prototype disclaimer, bracket URL, update cadence.',
  },
  {
    channel: 'Twitch chat',
    goal: 'Drop a concise link when bracket confusion starts.',
    asset: 'Mobile-friendly page, clear unofficial label, no spam cadence.',
  },
  {
    channel: 'Personal X / site',
    goal: 'Convert accidental traffic into followers and small dev credibility.',
    asset: 'Pinned build thread, one-line offer, portfolio link.',
  },
]
