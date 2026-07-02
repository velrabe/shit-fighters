import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AtSign,
  CircleDollarSign,
  Crown,
  ExternalLink,
  Flame,
  Gamepad2,
  Radio,
  ShieldAlert,
  Swords,
  Timer,
  Trophy,
  Users,
  Vote,
} from 'lucide-react'
import './App.css'
import { fetchTournamentData, savePickem, subscribeToTournament } from './lib/tournamentData'
import type { FormEvent } from 'react'
import type { FormatOption, Match, Pickem, Player, TournamentData, TournamentEvent } from './types'

const DATA_NOTICE = 'Unofficial live companion. Scores update as the bracket moves.'

const EMPTY_PLAYERS: TournamentData['players'] = []
const EMPTY_FORMAT_OPTIONS: TournamentData['formatOptions'] = []
const EMPTY_PRIZES: TournamentData['prizes'] = []

const EVENT_SHELL: TournamentEvent = {
  id: '',
  slug: 'shit-fighters-2026',
  name: 'Shit Fighters',
  subtitle: 'Live bracket and pickems',
  startUtc: '2026-07-08T20:00:00Z',
  startLabel: 'July 8, 1 PM PT',
  hostLabel: 'Ludwig event',
  streamLabel: 'Stream TBD',
  currentPhase: 'Loading live board',
  lastUpdatedLabel: 'Live data loading',
}

const EMPTY_PICKEM: Pickem = {
  championId: '',
  finalistId: '',
  sleeperId: '',
}

function getPlayer(playersById: Map<string, Player>, playerId: string | null) {
  return playerId ? playersById.get(playerId) ?? null : null
}

function getSideName(playersById: Map<string, Player>, side: Match['sideA']) {
  const player = getPlayer(playersById, side.playerId)
  return player?.displayName ?? side.label
}

function getCountdownParts(startUtc: string) {
  const diff = new Date(startUtc).getTime() - Date.now()
  const safeDiff = Math.max(0, diff)
  const days = Math.floor(safeDiff / 86_400_000)
  const hours = Math.floor((safeDiff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((safeDiff % 3_600_000) / 60_000)

  return { days, hours, minutes, isLive: diff <= 0 }
}

function buildStandings(matches: Match[], players: Player[]) {
  const rows = new Map(
    players
      .filter((player) => player.status === 'confirmed')
      .map((player) => [
        player.id,
        {
          player,
          wins: 0,
          losses: 0,
          gamesFor: 0,
          gamesAgainst: 0,
        },
      ]),
  )

  matches.forEach((match) => {
    if (match.state !== 'complete' || !match.winnerId) return

    const ids = [match.sideA.playerId, match.sideB.playerId].filter(Boolean) as string[]
    ids.forEach((id) => {
      const row = rows.get(id)
      if (!row) return
      const isA = id === match.sideA.playerId
      row.gamesFor += isA ? match.scoreA ?? 0 : match.scoreB ?? 0
      row.gamesAgainst += isA ? match.scoreB ?? 0 : match.scoreA ?? 0
      if (id === match.winnerId) row.wins += 1
      else row.losses += 1
    })
  })

  return [...rows.values()].sort((a, b) => {
    const winDiff = b.wins - a.wins
    if (winDiff) return winDiff
    const pointDiff = b.gamesFor - b.gamesAgainst - (a.gamesFor - a.gamesAgainst)
    if (pointDiff) return pointDiff
    return a.player.displayName.localeCompare(b.player.displayName)
  })
}

function emptyFormat(): FormatOption {
  return {
    id: 'pending',
    label: 'Format pending',
    summary: 'Tournament rules will appear here once the format is locked.',
    operatorNote: 'Check back before the next match starts.',
  }
}

function matchLeader(playersById: Map<string, Player>, match: Match | undefined) {
  if (!match || match.scoreA == null || match.scoreB == null || match.scoreA === match.scoreB) {
    return 'Even'
  }
  return match.scoreA > match.scoreB
    ? `${getSideName(playersById, match.sideA)} leads`
    : `${getSideName(playersById, match.sideB)} leads`
}

function matchLabel(match: Match | undefined) {
  if (!match) return 'Match pending'
  if (match.state === 'live') return `${match.round} live`
  if (match.state === 'complete') return `${match.round} complete`
  return `${match.round} queued`
}

function App() {
  const [data, setData] = useState<TournamentData | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedFormatId, setSelectedFormatId] = useState('')
  const [pickem, setPickem] = useState<Pickem>(EMPTY_PICKEM)
  const [viewerLabel, setViewerLabel] = useState('')
  const [countdown, setCountdown] = useState(() => getCountdownParts(EVENT_SHELL.startUtc))
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [pickemMessage, setPickemMessage] = useState('')

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const nextData = await fetchTournamentData()
      setData(nextData)
      setMatches(nextData.matches)
      setLoadError('')
      setSelectedFormatId((current) =>
        nextData.formatOptions.some((format) => format.id === current)
          ? current
          : nextData.formatOptions[0]?.id ?? '',
      )
    } catch {
      setLoadError('Live data is temporarily unavailable. Try refreshing in a moment.')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!data?.event.id) return
    return subscribeToTournament(data.event.id, () => {
      void loadData(true)
    })
  }, [data?.event.id, loadData])

  const event = data?.event ?? EVENT_SHELL
  const players = data?.players ?? EMPTY_PLAYERS
  const formatOptions = data?.formatOptions ?? EMPTY_FORMAT_OPTIONS
  const prizes = data?.prizes ?? EMPTY_PRIZES
  const confirmedPlayers = useMemo(
    () => players.filter((player) => player.status === 'confirmed'),
    [players],
  )
  const confirmedPlayerIds = confirmedPlayers.map((player) => player.id).join('|')

  useEffect(() => {
    if (confirmedPlayers.length < 3) return

    setPickem((current) => {
      const currentIds = [current.championId, current.finalistId, current.sleeperId]
      const stillValid = currentIds.every((id) => confirmedPlayers.some((player) => player.id === id))
      if (stillValid) return current

      return {
        championId: confirmedPlayers[0].id,
        finalistId: confirmedPlayers[1].id,
        sleeperId: confirmedPlayers[2].id,
      }
    })
  }, [confirmedPlayerIds, confirmedPlayers])

  useEffect(() => {
    setCountdown(getCountdownParts(event.startUtc))
    const timer = window.setInterval(() => setCountdown(getCountdownParts(event.startUtc)), 60_000)
    return () => window.clearInterval(timer)
  }, [event.startUtc])

  const playersById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players])
  const liveMatch = matches.find((match) => match.state === 'live') ?? matches[0]
  const standings = useMemo(() => buildStandings(matches, players), [matches, players])
  const selectedFormat =
    formatOptions.find((format) => format.id === selectedFormatId) ??
    formatOptions[0] ??
    emptyFormat()
  const completedMatches = matches.filter((match) => match.state === 'complete').length
  const pickemUniqueCount = new Set([pickem.championId, pickem.finalistId, pickem.sleeperId]).size
  const pickemReady = Boolean(data?.event.id && pickem.championId && pickemUniqueCount === 3)
  const pickemScore = pickemUniqueCount * 100 + completedMatches * 25

  const submitPickem = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault()
    if (!data?.event.id || !pickemReady) {
      setPickemMessage('Pick three different players first.')
      return
    }

    setPickemMessage('Saving pickem...')
    try {
      await savePickem(data.event.id, viewerLabel.trim() || 'anonymous viewer', pickem)
      setPickemMessage('Pickem locked. No wallet, no odds, no cash prizes.')
    } catch {
      setPickemMessage('Could not save pickem. Please try again.')
    }
  }

  return (
    <main>
      <header className="site-header" aria-label="Primary">
        <a className="brand-mark" href="#top" aria-label="Shit Fighters home">
          <Swords size={19} />
          <span>Shit Fighters</span>
        </a>
        <nav>
          <a href="#live">Live</a>
          <a href="#bracket">Bracket</a>
          <a href="#roster">Roster</a>
          <a href="#pickems">Pickems</a>
        </nav>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">
            <Radio size={16} />
            {event.hostLabel} - live companion
          </p>
          <h1>{event.name}</h1>
          <p className="hero-copy">
            Live scores, bracket, roster, and pickems for the July 8 Street Fighter showdown.
          </p>
          <div className="hero-actions" aria-label="Primary actions">
            <a className="button primary" href="#live">
              <Flame size={18} />
              Watch live board
            </a>
            <a className="button secondary" href="#pickems">
              <Vote size={18} />
              Make picks
            </a>
          </div>
        </div>
        <aside className="event-panel" aria-label="Event status">
          <div>
            <span className="panel-label">Now</span>
            <strong>{loading ? 'Loading board' : event.currentPhase}</strong>
          </div>
          <div>
            <span className="panel-label">Current match</span>
            <strong>{matchLabel(liveMatch)}</strong>
          </div>
          <div>
            <span className="panel-label">Start</span>
            <strong>{event.startLabel}</strong>
          </div>
        </aside>
      </section>

      <section className={loadError ? 'notice-band warning' : 'notice-band'} aria-label="Data notice">
        <ShieldAlert size={18} />
        <p>{loadError || DATA_NOTICE}</p>
      </section>

      <section className="section-grid live-grid" id="live" aria-labelledby="live-title">
        <div className="section-heading">
          <p className="eyebrow">
            <Timer size={16} />
            Live now
          </p>
          <h2 id="live-title">{matchLeader(playersById, liveMatch)} in Game 2.</h2>
          <p>
            Follow the active set, next matches, and tournament status without digging through chat.
          </p>
        </div>
        <div className="live-card">
          <div className="live-card-topline">
            <span className="live-pill">
              <span aria-hidden="true" />
              {liveMatch?.state === 'live' ? 'Live' : 'Queued'}
            </span>
            <span>{liveMatch?.round ?? 'Opening match'}</span>
          </div>
          <div className="scoreline">
            <div>
              <span>{liveMatch ? getSideName(playersById, liveMatch.sideA) : 'Player A'}</span>
              <strong>{liveMatch?.scoreA ?? 0}</strong>
            </div>
            <div>
              <span>{liveMatch ? getSideName(playersById, liveMatch.sideB) : 'Player B'}</span>
              <strong>{liveMatch?.scoreB ?? 0}</strong>
            </div>
          </div>
          <p>
            {liveMatch?.scoreA === 1 && liveMatch.scoreB === 0
              ? `${getSideName(playersById, liveMatch.sideA)} took Game 1. Game 2 is underway.`
              : event.lastUpdatedLabel}
          </p>
        </div>
      </section>

      <section className="section-block stats-section" aria-label="Tournament snapshot">
        <div className="metric-strip">
          <div>
            <span>Players</span>
            <strong>{confirmedPlayers.length}</strong>
          </div>
          <div>
            <span>Live match</span>
            <strong>{liveMatch?.table ?? '-'}</strong>
          </div>
          <div>
            <span>Matches</span>
            <strong>{matches.length}</strong>
          </div>
          <div>
            <span>Countdown</span>
            <strong>
              {countdown.isLive ? 'Live' : `${countdown.days}d ${countdown.hours}h`}
            </strong>
          </div>
        </div>
      </section>

      <section className="section-grid bracket-grid" id="bracket" aria-labelledby="bracket-title">
        <div className="section-heading">
          <p className="eyebrow">
            <Flame size={16} />
            Bracket
          </p>
          <h2 id="bracket-title">Match board</h2>
          <p>Live sets appear first, completed sets lock in, and queued matches stay visible.</p>
        </div>
        <div className="board-shell">
          <div className="bracket-list">
            {matches.length ? (
              matches.map((match) => {
                const playerA = getPlayer(playersById, match.sideA.playerId)
                const playerB = getPlayer(playersById, match.sideB.playerId)
                const sideALeading =
                  match.state === 'live' &&
                  match.scoreA != null &&
                  match.scoreB != null &&
                  match.scoreA > match.scoreB
                const sideBLeading =
                  match.state === 'live' &&
                  match.scoreA != null &&
                  match.scoreB != null &&
                  match.scoreB > match.scoreA
                return (
                  <article className={`match-card ${match.state}`} key={match.id}>
                    <div className="match-meta">
                      <span>{match.round}</span>
                      <span>Match {match.table}</span>
                    </div>
                    <div
                      className={
                        match.winnerId === playerA?.id || sideALeading
                          ? 'match-side winner'
                          : 'match-side'
                      }
                    >
                      <span>{getSideName(playersById, match.sideA)}</span>
                      <strong>{match.scoreA ?? '-'}</strong>
                    </div>
                    <div
                      className={
                        match.winnerId === playerB?.id || sideBLeading
                          ? 'match-side winner'
                          : 'match-side'
                      }
                    >
                      <span>{getSideName(playersById, match.sideB)}</span>
                      <strong>{match.scoreB ?? '-'}</strong>
                    </div>
                    <div className="match-state">{match.state}</div>
                  </article>
                )
              })
            ) : (
              <div className="state-panel">Live board is loading.</div>
            )}
          </div>
          <div className="standings-panel">
            <div className="panel-title">
              <Crown size={18} />
              <h3>Standings</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>W</th>
                  <th>L</th>
                  <th>Diff</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr key={row.player.id}>
                    <td>{row.player.displayName}</td>
                    <td>{row.wins}</td>
                    <td>{row.losses}</td>
                    <td>{row.gamesFor - row.gamesAgainst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-block" id="roster" aria-labelledby="players-title">
        <div className="section-heading inline-heading">
          <div>
            <p className="eyebrow">
              <Users size={16} />
              Roster
            </p>
            <h2 id="players-title">Players in the lobby</h2>
          </div>
          <span className="data-pill">{confirmedPlayers.length} checked in</span>
        </div>
        {players.length ? (
          <div className="player-grid">
            {players.map((player) => (
              <article className={`player-card ${player.status}`} key={player.id}>
                <div className="player-topline">
                  <span className="avatar">{player.shortName}</span>
                  <span className="status-dot">{player.status === 'confirmed' ? 'ready' : 'pending'}</span>
                </div>
                <h3>{player.displayName}</h3>
                <p className="handle">{player.handle}</p>
                <div className="tag-row">
                  {player.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="link-row" aria-label={`${player.displayName} links`}>
                  {player.xUrl ? (
                    <a href={player.xUrl} target="_blank" rel="noreferrer">
                      <AtSign size={15} />
                      X
                    </a>
                  ) : (
                    <span>Social TBD</span>
                  )}
                  {player.twitchUrl ? (
                    <a href={player.twitchUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={15} />
                      Twitch
                    </a>
                  ) : (
                    <span>Stream TBD</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="state-panel">Roster is loading.</div>
        )}
      </section>

      <section className="section-grid format-grid" aria-labelledby="format-title">
        <div className="section-heading">
          <p className="eyebrow">
            <Gamepad2 size={16} />
            Format
          </p>
          <h2 id="format-title">How the bracket works</h2>
          <p>Quick rules for viewers who joined mid-stream.</p>
        </div>
        <div className="format-panel">
          {formatOptions.length ? (
            <div className="segmented-control" aria-label="Tournament format">
              {formatOptions.map((format) => (
                <button
                  className={format.id === selectedFormatId ? 'active' : ''}
                  key={format.id}
                  onClick={() => setSelectedFormatId(format.id)}
                  type="button"
                >
                  {format.label}
                </button>
              ))}
            </div>
          ) : null}
          <article className="format-copy">
            <h3>{selectedFormat.label}</h3>
            <p>{selectedFormat.summary}</p>
            <span>{selectedFormat.operatorNote}</span>
          </article>
        </div>
      </section>

      <section className="section-grid pickems-grid" id="pickems" aria-labelledby="pickems-title">
        <div className="section-heading">
          <p className="eyebrow">
            <CircleDollarSign size={16} />
            Pickems
          </p>
          <h2 id="pickems-title">Pick a champion, finalist, and sleeper.</h2>
          <p>Bragging rights only. No odds, no wallet, no cash prizes.</p>
        </div>
        <form className="pickem-form" onSubmit={submitPickem}>
          <label>
            Viewer name
            <input
              maxLength={64}
              minLength={2}
              onChange={(event) => setViewerLabel(event.target.value)}
              placeholder="chat name"
              value={viewerLabel}
            />
          </label>
          <label>
            Champion
            <select
              disabled={confirmedPlayers.length < 3}
              value={pickem.championId}
              onChange={(event) => setPickem({ ...pickem, championId: event.target.value })}
            >
              {confirmedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Finalist
            <select
              disabled={confirmedPlayers.length < 3}
              value={pickem.finalistId}
              onChange={(event) => setPickem({ ...pickem, finalistId: event.target.value })}
            >
              {confirmedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sleeper pick
            <select
              disabled={confirmedPlayers.length < 3}
              value={pickem.sleeperId}
              onChange={(event) => setPickem({ ...pickem, sleeperId: event.target.value })}
            >
              {confirmedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.displayName}
                </option>
              ))}
            </select>
          </label>
          <div className="pickem-ticket">
            <span>Preview points</span>
            <strong>{pickemScore}</strong>
            <small>Lock picks before finals.</small>
          </div>
          <button className="pickem-submit" disabled={!pickemReady} type="submit">
            <Vote size={16} />
            Save picks
          </button>
          {pickemMessage ? <p className="status-message">{pickemMessage}</p> : null}
        </form>
      </section>

      <section className="section-block prizes-section" aria-labelledby="prizes-title">
        <div className="section-heading inline-heading">
          <div>
            <p className="eyebrow">
              <Trophy size={16} />
              Awards
            </p>
            <h2 id="prizes-title">What is on the line</h2>
          </div>
        </div>
        {prizes.length ? (
          <div className="prize-grid">
            {prizes.map((prize) => (
              <article className="prize-card" key={prize.title}>
                <Trophy size={24} />
                <h3>{prize.title}</h3>
                <p>{prize.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="state-panel">Awards are loading.</div>
        )}
      </section>

      <footer>
        <span>Unofficial fan-made live board.</span>
        <a href="https://github.com/velrabe/shit-fighters" target="_blank" rel="noreferrer">
          Source
        </a>
        <a href="#top">Back to top</a>
      </footer>
    </main>
  )
}

export default App
