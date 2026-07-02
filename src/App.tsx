import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AtSign,
  CheckCircle2,
  CircleDollarSign,
  Crown,
  Database,
  ExternalLink,
  Flame,
  Gamepad2,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Swords,
  Timer,
  Trophy,
  Users,
  Vote,
} from 'lucide-react'
import './App.css'
import {
  fetchTournamentData,
  saveMatchWinner,
  savePickem,
  subscribeToTournament,
} from './lib/tournamentData'
import type { FormEvent } from 'react'
import type { FormatOption, Match, Pickem, Player, TournamentData, TournamentEvent } from './types'

const DATA_NOTICE =
  'Supabase-backed data. Unknown facts stay marked TBD until an organizer or public announcement confirms them.'

const EMPTY_PLAYERS: TournamentData['players'] = []
const EMPTY_FORMAT_OPTIONS: TournamentData['formatOptions'] = []
const EMPTY_PRIZES: TournamentData['prizes'] = []
const EMPTY_OUTREACH: TournamentData['outreach'] = []

const EVENT_SHELL: TournamentEvent = {
  id: '',
  slug: 'shit-fighters-2026',
  name: 'Shit Fighters',
  subtitle: 'Unofficial live bracket and pickems HQ',
  startUtc: '2026-07-08T20:00:00Z',
  startLabel: 'July 8, 1 PM PT',
  hostLabel: 'Ludwig event',
  streamLabel: 'Official stream TBD',
  currentPhase: 'Connecting Supabase',
  lastUpdatedLabel: 'Waiting for database migration',
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

function isSchemaMissing(message: string) {
  return message.includes('PGRST205') || message.includes("Could not find the table")
}

function emptyFormat(): FormatOption {
  return {
    id: 'pending',
    label: 'Format pending',
    summary: 'Apply the Supabase migration and seed data to load tournament format options.',
    operatorNote: 'No frontend mock data is used here.',
  }
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
  const [adminMessage, setAdminMessage] = useState('')
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
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load Supabase data.')
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
  const outreach = data?.outreach ?? EMPTY_OUTREACH
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
  const standings = useMemo(() => buildStandings(matches, players), [matches, players])
  const selectedFormat =
    formatOptions.find((format) => format.id === selectedFormatId) ??
    formatOptions[0] ??
    emptyFormat()
  const completedMatches = matches.filter((match) => match.state === 'complete').length
  const pickemUniqueCount = new Set([pickem.championId, pickem.finalistId, pickem.sleeperId]).size
  const pickemReady = Boolean(data?.event.id && pickem.championId && pickemUniqueCount === 3)
  const pickemScore = pickemUniqueCount * 100 + completedMatches * 25
  const schemaMissing = loadError && isSchemaMissing(loadError)

  const completeMatch = async (matchId: string, winnerId: string) => {
    const match = matches.find((candidate) => candidate.id === matchId)
    if (!match) return

    const winnerIsA = match.sideA.playerId === winnerId
    setMatches((current) =>
      current.map((candidate) =>
        candidate.id === matchId
          ? {
              ...candidate,
              state: 'complete',
              winnerId,
              scoreA: winnerIsA ? 2 : 1,
              scoreB: winnerIsA ? 1 : 2,
            }
          : candidate,
      ),
    )

    setAdminMessage('Saving result to Supabase...')
    try {
      await saveMatchWinner(match, winnerId)
      setAdminMessage('Saved to Supabase. Viewers will receive it through realtime.')
    } catch (error) {
      setAdminMessage(
        error instanceof Error
          ? `Local preview updated, but database write failed: ${error.message}`
          : 'Local preview updated, but database write failed.',
      )
    }
  }

  const submitPickem = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault()
    if (!data?.event.id || !pickemReady) {
      setPickemMessage('Pick three different confirmed players first.')
      return
    }

    setPickemMessage('Saving pickem...')
    try {
      await savePickem(data.event.id, viewerLabel.trim() || 'anonymous viewer', pickem)
      setPickemMessage('Pickem saved. No wallet, no odds, no cash prizes.')
    } catch (error) {
      setPickemMessage(
        error instanceof Error ? `Could not save pickem: ${error.message}` : 'Could not save pickem.',
      )
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
          <a href="#bracket">Bracket</a>
          <a href="#pickems">Pickems</a>
          <a href="#admin">Admin</a>
          <a href="#launch">Launch</a>
        </nav>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">
            <Radio size={16} />
            {event.hostLabel} - unofficial MVP
          </p>
          <h1>{event.name}</h1>
          <p className="hero-copy">
            Live bracket, standings, pickems, and a tiny production console for Ludwig's July 8
            Street Fighter content tournament.
          </p>
          <div className="hero-actions" aria-label="Primary actions">
            <a className="button primary" href="#bracket">
              <Trophy size={18} />
              Track bracket
            </a>
            <a className="button secondary" href="#pickems">
              <Vote size={18} />
              Make picks
            </a>
          </div>
        </div>
        <aside className="event-panel" aria-label="Event status">
          <div>
            <span className="panel-label">Start</span>
            <strong>{event.startLabel}</strong>
          </div>
          <div>
            <span className="panel-label">Countdown</span>
            <strong>
              {countdown.isLive
                ? 'Live window'
                : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`}
            </strong>
          </div>
          <div>
            <span className="panel-label">Status</span>
            <strong>{loading ? 'Loading Supabase' : event.currentPhase}</strong>
          </div>
        </aside>
      </section>

      <section className={loadError ? 'notice-band warning' : 'notice-band'} aria-label="Data notice">
        <ShieldAlert size={18} />
        <p>
          {schemaMissing
            ? 'Supabase is connected, but the database schema has not been migrated yet.'
            : loadError || DATA_NOTICE}
        </p>
      </section>

      {schemaMissing ? (
        <section className="setup-panel" aria-label="Supabase setup">
          <h2>Apply the Supabase migration before public launch.</h2>
          <p>
            The frontend is now wired to Supabase and intentionally has no runtime mock tournament
            data. Run the migration and seed in `supabase/` to populate events, players, matches,
            format options, prizes, and outreach copy.
          </p>
        </section>
      ) : null}

      <section className="section-grid live-grid" aria-labelledby="live-title">
        <div className="section-heading">
          <p className="eyebrow">
            <Timer size={16} />
            July 8 operations
          </p>
          <h2 id="live-title">A useful unofficial hub before the official format exists.</h2>
        </div>
        <div className="metric-strip">
          <div>
            <span>Confirmed</span>
            <strong>{confirmedPlayers.length}</strong>
          </div>
          <div>
            <span>Open slots</span>
            <strong>{players.filter((player) => player.status === 'tbd').length}</strong>
          </div>
          <div>
            <span>Matches</span>
            <strong>{matches.length}</strong>
          </div>
          <div>
            <span>Stream</span>
            <strong>{event.streamLabel.includes('TBD') ? 'TBD' : 'Ready'}</strong>
          </div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="players-title">
        <div className="section-heading inline-heading">
          <div>
            <p className="eyebrow">
              <Users size={16} />
              Competitors
            </p>
            <h2 id="players-title">Known handles stay separate from placeholder slots.</h2>
          </div>
          <span className="data-pill">Announcement-backed: {confirmedPlayers.length}</span>
        </div>
        {players.length ? (
          <div className="player-grid">
            {players.map((player) => (
              <article className={`player-card ${player.status}`} key={player.id}>
                <div className="player-topline">
                  <span className="avatar">{player.shortName}</span>
                  <span className="status-dot">{player.status}</span>
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
                    <span>Twitch TBD</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="state-panel">No players loaded from Supabase yet.</div>
        )}
      </section>

      <section className="section-grid format-grid" aria-labelledby="format-title">
        <div className="section-heading">
          <p className="eyebrow">
            <Gamepad2 size={16} />
            Format assumptions
          </p>
          <h2 id="format-title">The MVP supports the likely tournament shapes.</h2>
          <p>
            Format copy now comes from Supabase so late organizer changes can be edited without a
            frontend redeploy.
          </p>
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

      <section className="section-grid bracket-grid" id="bracket" aria-labelledby="bracket-title">
        <div className="section-heading">
          <p className="eyebrow">
            <Flame size={16} />
            Live board
          </p>
          <h2 id="bracket-title">Bracket and standings update from Supabase match rows.</h2>
          <p>
            Viewers subscribe to match updates in realtime. Admin writes stay protected by RLS and
            require an authenticated email in `admin_users`.
          </p>
        </div>
        <div className="board-shell">
          <div className="bracket-list">
            {matches.length ? (
              matches.map((match) => {
                const playerA = getPlayer(playersById, match.sideA.playerId)
                const playerB = getPlayer(playersById, match.sideB.playerId)
                return (
                  <article className={`match-card ${match.state}`} key={match.id}>
                    <div className="match-meta">
                      <span>{match.round}</span>
                      <span>Table {match.table}</span>
                    </div>
                    <div
                      className={match.winnerId === playerA?.id ? 'match-side winner' : 'match-side'}
                    >
                      <span>{getSideName(playersById, match.sideA)}</span>
                      <strong>{match.scoreA ?? '-'}</strong>
                    </div>
                    <div
                      className={match.winnerId === playerB?.id ? 'match-side winner' : 'match-side'}
                    >
                      <span>{getSideName(playersById, match.sideB)}</span>
                      <strong>{match.scoreB ?? '-'}</strong>
                    </div>
                    <div className="match-state">{match.state}</div>
                  </article>
                )
              })
            ) : (
              <div className="state-panel">No matches loaded from Supabase yet.</div>
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

      <section className="section-grid pickems-grid" id="pickems" aria-labelledby="pickems-title">
        <div className="section-heading">
          <p className="eyebrow">
            <CircleDollarSign size={16} />
            Pickems, not gambling
          </p>
          <h2 id="pickems-title">Discord-friendly predictions without real money.</h2>
          <p>
            Pickems now insert into Supabase with RLS. Public reads are blocked until a proper
            leaderboard path exists.
          </p>
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
            <span>Preview score</span>
            <strong>{pickemScore}</strong>
            <small>No wallet, no odds, no cash prizes.</small>
          </div>
          <button className="pickem-submit" disabled={!pickemReady} type="submit">
            <Vote size={16} />
            Save pickem
          </button>
          {pickemMessage ? <p className="status-message">{pickemMessage}</p> : null}
        </form>
      </section>

      <section className="section-grid admin-grid" id="admin" aria-labelledby="admin-title">
        <div className="section-heading">
          <p className="eyebrow">
            <Database size={16} />
            Admin sandbox
          </p>
          <h2 id="admin-title">One screen for manual live updates.</h2>
          <p>
            Buttons optimistically update the preview, then try to write to Supabase. Without an
            authenticated admin session, RLS rejects the database write.
          </p>
        </div>
        <div className="admin-console">
          <div className="console-topline">
            <span>{completedMatches} completed</span>
            <button type="button" onClick={() => void loadData()}>
              <RefreshCw size={16} />
              Sync
            </button>
          </div>
          {matches.slice(0, 4).map((match) => {
            const playerA = getPlayer(playersById, match.sideA.playerId)
            const playerB = getPlayer(playersById, match.sideB.playerId)
            return (
              <div className="admin-match" key={match.id}>
                <span>{match.table}</span>
                <button
                  disabled={!playerA || playerA.status === 'tbd'}
                  onClick={() => playerA && void completeMatch(match.id, playerA.id)}
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  {getSideName(playersById, match.sideA)}
                </button>
                <button
                  disabled={!playerB || playerB.status === 'tbd'}
                  onClick={() => playerB && void completeMatch(match.id, playerB.id)}
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  {getSideName(playersById, match.sideB)}
                </button>
              </div>
            )
          })}
          {adminMessage ? <p className="status-message">{adminMessage}</p> : null}
        </div>
      </section>

      <section className="section-block prizes-section" aria-labelledby="prizes-title">
        <div className="section-heading inline-heading">
          <div>
            <p className="eyebrow">
              <Trophy size={16} />
              Meme awards
            </p>
            <h2 id="prizes-title">Prizes that feel like stream content, not esports theater.</h2>
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
          <div className="state-panel">No prize copy loaded from Supabase yet.</div>
        )}
      </section>

      <section className="section-grid launch-grid" id="launch" aria-labelledby="launch-title">
        <div className="section-heading">
          <p className="eyebrow">
            <Send size={16} />
            Outreach path
          </p>
          <h2 id="launch-title">Two launch paths: organizer adoption or community utility.</h2>
          <p>
            The page should be useful even if nobody official replies. If production does reply,
            the admin flow and data model are already visible.
          </p>
        </div>
        <div className="outreach-list">
          {outreach.length ? (
            outreach.map((step) => (
              <article key={step.channel}>
                <MessageSquare size={18} />
                <div>
                  <h3>{step.channel}</h3>
                  <p>{step.goal}</p>
                  <span>{step.asset}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="state-panel">No outreach copy loaded from Supabase yet.</div>
          )}
        </div>
      </section>

      <footer>
        <span>Built as an unofficial fan MVP.</span>
        <a href="https://github.com/velrabe/shit-fighters" target="_blank" rel="noreferrer">
          Source
        </a>
        <a href="#top">Back to top</a>
      </footer>
    </main>
  )
}

export default App
