# Shit Fighters project brief

## Core thought stream


We have one week before Ludwig's small Street Fighter content tournament on July 8 at 1 PM PT. The event looks lightweight and streamer-first: likely organized quickly, probably lobby-based, made for stream and YouTube content more than serious esports production.

The opportunity is to build a useful unofficial tournament hub before the event:

- promo page with clear visual identity
- bracket and standings viewers can refresh during the stream
- pickems for Discord/community engagement, without real gambling
- small admin interface for fast manual score updates
- data structure that can later move cleanly to Supabase

The main constraint is uncertainty. We only know the announcement and five confirmed handles. Tournament format, seeds, stream links, prize pool, final competitors, and rules are all unknown. The product must label uncertainty honestly and avoid mixing real facts with placeholder guesses.

The website should become the second screen during the event.

If viewers are confused about:

• who is playing
• what match is next
• who is still alive
• current standings
• player background

they should immediately find the answer here.

The stream provides entertainment.

The website provides clarity.


## Go-to-market paths

Path A: organizer adoption.

Send Ludwig or production a working MVP with a live URL, screenshots, and a short note: the work is free to use for the event, can be handed over, and can be adapted to their rules if they respond.

Path B: community utility.

If nobody official replies, post the link on Reddit and in Twitch chat as an unofficial bracket/pickems helper. It must be useful without pretending to be official.

Path C: personal credibility.

Add a subtle creator credit. If people click through, they should see a pinned build thread, a short developer offer, and enough proof that this was made quickly and thoughtfully.

## Technical direction

First version:

- Vite + React + TypeScript
- static frontend
- one mock-data file
- local-only admin interactions
- local-only pickems
- generated original hero image, no official game assets


Later Supabase version:

- `events`
- `players`
- `matches`
- `standings` view or computed query
- `pickems`
- `profiles` from Discord OAuth or simple magic links
- `admin_users`
- realtime subscriptions for `matches`
- row-level security before public launch

## Known facts

- Event name: Shit Fighters
- Date/time: July 8, 1 PM PT
- Confirmed from announcement: `@supertf`, `@slime_machine`, `@emilyywng`, `@EskayOW`, `@NathanStanz`
- Remaining competitors: TBD

## Assumptions to confirm

- official stream platform and URL
- final player list
- tournament format
- match format, likely FT2 or BO3 for Street Fighter
- whether prizes exist and whether meme awards are acceptable
- whether production wants an admin link or just public bracket

##  Product Principles

Every unknown fact must stay visibly unknown.

Never fabricate tournament data.

Never imitate official production.

Every placeholder should clearly look like placeholder.

Public pages are for viewers, not for operators. Do not expose outreach strategy, implementation notes, admin mechanics, database details, or internal product rationale in the user-facing UI.

The first screen should answer what is happening now: current match, score, who is playing, what is next, and where to make picks.
