import { useEffect, useMemo, useState } from 'react'
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
  MOCK_DATA_NOTICE,
  MOCK_EVENT,
  MOCK_FORMAT_OPTIONS,
  MOCK_MATCHES,
  MOCK_OUTREACH,
  MOCK_PLAYERS,
  MOCK_PRIZES,
} from './data/mockTournament'
import type { Match, Pickem, Player } from './types'

const confirmedPlayers = MOCK_PLAYERS.filter((player) => player.status === 'confirmed')

const initialPickem: Pickem = {
  championId: 'supertf',
  finalistId: 'nathanstanz',
  sleeperId: 'emilyywng',
}

function getPlayer(playersById: Map<string, Player>, playerId: string | null) {
  return playerId ? playersById.get(playerId) ?? null : null
}

function getSideName(playersById: Map<string, Player>, side: Match['sideA']) {
  const player = getPlayer(playersById, side.playerId)
  return player?.displayName ?? side.label
}

function getCountdownParts() {
  const diff = new Date(MOCK_EVENT.startUtc).getTime() - Date.now()
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

function App() {
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES)
  const [selectedFormatId, setSelectedFormatId] = useState(MOCK_FORMAT_OPTIONS[0].id)
  const [pickem, setPickem] = useState<Pickem>(initialPickem)
  const [countdown, setCountdown] = useState(getCountdownParts)

  const playersById = useMemo(
    () => new Map(MOCK_PLAYERS.map((player) => [player.id, player])),
    [],
  )
  const standings = useMemo(() => buildStandings(matches, MOCK_PLAYERS), [matches])
  const selectedFormat = MOCK_FORMAT_OPTIONS.find((format) => format.id === selectedFormatId)!
  const completedMatches = matches.filter((match) => match.state === 'complete').length
  const pickemScore =
    new Set([pickem.championId, pickem.finalistId, pickem.sleeperId]).size * 100 +
    completedMatches * 25

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdownParts()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const completeMatch = (matchId: string, winnerId: string) => {
    setMatches((current) =>
      current.map((match) => {
        if (match.id !== matchId) return match
        const winnerIsA = match.sideA.playerId === winnerId
        return {
          ...match,
          state: 'complete',
          winnerId,
          scoreA: winnerIsA ? 2 : 1,
          scoreB: winnerIsA ? 1 : 2,
        }
      }),
    )
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
            {MOCK_EVENT.hostLabel} - unofficial MVP
          </p>
          <h1>{MOCK_EVENT.name}</h1>
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
            <strong>{MOCK_EVENT.startLabel}</strong>
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
            <strong>{MOCK_EVENT.currentPhase}</strong>
          </div>
        </aside>
      </section>

      <section className="notice-band" aria-label="Prototype data notice">
        <ShieldAlert size={18} />
        <p>{MOCK_DATA_NOTICE}</p>
      </section>

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
            <strong>{MOCK_PLAYERS.length - confirmedPlayers.length}</strong>
          </div>
          <div>
            <span>Matches</span>
            <strong>{matches.length}</strong>
          </div>
          <div>
            <span>Stream</span>
            <strong>TBD</strong>
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
          <span className="data-pill">Announcement-backed: 5</span>
        </div>
        <div className="player-grid">
          {MOCK_PLAYERS.map((player) => (
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
      </section>

      <section className="section-grid format-grid" aria-labelledby="format-title">
        <div className="section-heading">
          <p className="eyebrow">
            <Gamepad2 size={16} />
            Format assumptions
          </p>
          <h2 id="format-title">The MVP supports the three likely tournament shapes.</h2>
          <p>
            The default UI favors round robin into top 4 because it creates more streamer content
            and keeps standings meaningful if the bracket changes late.
          </p>
        </div>
        <div className="format-panel">
          <div className="segmented-control" aria-label="Tournament format">
            {MOCK_FORMAT_OPTIONS.map((format) => (
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
          <h2 id="bracket-title">Bracket and standings update from one match state.</h2>
          <p>
            Today this is a local sandbox. Later it becomes Supabase rows plus realtime
            subscriptions for viewers and a locked admin route for production.
          </p>
        </div>
        <div className="board-shell">
          <div className="bracket-list">
            {matches.map((match) => {
              const playerA = getPlayer(playersById, match.sideA.playerId)
              const playerB = getPlayer(playersById, match.sideB.playerId)
              return (
                <article className={`match-card ${match.state}`} key={match.id}>
                  <div className="match-meta">
                    <span>{match.round}</span>
                    <span>Table {match.table}</span>
                  </div>
                  <div className={match.winnerId === playerA?.id ? 'match-side winner' : 'match-side'}>
                    <span>{getSideName(playersById, match.sideA)}</span>
                    <strong>{match.scoreA ?? '-'}</strong>
                  </div>
                  <div className={match.winnerId === playerB?.id ? 'match-side winner' : 'match-side'}>
                    <span>{getSideName(playersById, match.sideB)}</span>
                    <strong>{match.scoreB ?? '-'}</strong>
                  </div>
                  <div className="match-state">{match.state}</div>
                </article>
              )
            })}
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
            The first version stores picks locally. Supabase can later add Discord identity,
            lock-time, leaderboards, and scoring.
          </p>
        </div>
        <form className="pickem-form">
          <label>
            Champion
            <select
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
            This models the eventual production dashboard: pick a match winner and the public
            bracket/standings react immediately.
          </p>
        </div>
        <div className="admin-console">
          <div className="console-topline">
            <span>{completedMatches} completed</span>
            <button type="button" onClick={() => setMatches(MOCK_MATCHES)}>
              <RefreshCw size={16} />
              Reset
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
                  onClick={() => playerA && completeMatch(match.id, playerA.id)}
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  {getSideName(playersById, match.sideA)}
                </button>
                <button
                  disabled={!playerB || playerB.status === 'tbd'}
                  onClick={() => playerB && completeMatch(match.id, playerB.id)}
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  {getSideName(playersById, match.sideB)}
                </button>
              </div>
            )
          })}
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
        <div className="prize-grid">
          {MOCK_PRIZES.map((prize) => (
            <article className="prize-card" key={prize.title}>
              <Trophy size={24} />
              <h3>{prize.title}</h3>
              <p>{prize.description}</p>
            </article>
          ))}
        </div>
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
          {MOCK_OUTREACH.map((step) => (
            <article key={step.channel}>
              <MessageSquare size={18} />
              <div>
                <h3>{step.channel}</h3>
                <p>{step.goal}</p>
                <span>{step.asset}</span>
              </div>
            </article>
          ))}
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
