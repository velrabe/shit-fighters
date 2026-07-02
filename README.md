# Shit Fighters

Unofficial MVP site for Ludwig's July 8 Street Fighter content tournament.

The first version is a static Vite/React frontend with:

- event landing page
- competitor cards
- format assumptions
- bracket and standings
- local pickems prototype
- local admin sandbox for match results
- launch/outreach notes

## Data rule

All prototype tournament data lives in one file:

`src/data/mockTournament.ts`

Search for `SHIT_FIGHTERS_MOCK_DATA` before moving to Supabase. Delete that file and replace the imports with database reads/subscriptions so placeholder data does not survive migration.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Ponytail

The Ponytail marketplace was added with:

```bash
codex plugin marketplace add DietrichGebert/ponytail
```

Install it from `/plugins`, trust its hooks in `/hooks`, then restart Codex for future threads.
