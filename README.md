# Tidey

A web app for checking tide times at nautical stations around the UK, using the
[ADMIRALTY UK Tidal API](https://developer.admiralty.co.uk/) (UK Hydrographic Office).

- Search any of the ~608 UK tidal stations, or use **"nearest to me"** (browser geolocation)
- High/low water times and heights for **today plus the next 6 days**, with day tabs
- An **estimated tide curve** for the selected day, with a live "now" marker
- **Sunrise/sunset markers** and a soft day/night/twilight gradient behind the curve
- A fixed **"today's highs & lows"** summary panel
- **Light / dark** theme toggle (seeded from the OS preference, then user-controlled)
- Responsive layout for mobile, tablet and desktop

> ⚠️ Tidal predictions here are for general reference only. For navigation, always use
> official ADMIRALTY products.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Getting an API key](#getting-an-api-key)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Transferring to another machine](#transferring-to-another-machine-no-git-history)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [The ADMIRALTY API (what you need to know)](#the-admiralty-api-what-you-need-to-know)
- [Important implementation notes & gotchas](#important-implementation-notes--gotchas)
- [Building for production / deployment](#building-for-production--deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Tech stack

| Part | Stack |
|------|-------|
| **Client** (`client/`) | React 18 + TypeScript, [Vite](https://vitejs.dev/) 5, [Tailwind CSS v4](https://tailwindcss.com/) |
| **Server** (`server/`) | Node + [Express](https://expressjs.com/) 4 + TypeScript, run with [tsx](https://github.com/privatenumber/tsx) |
| **Repo** | npm **workspaces** monorepo (one `npm install` at the root installs both) |

No chart or icon libraries are used — the tide curve and all icons are hand-rolled
inline SVG. The only runtime dependency beyond React is
[`suncalc`](https://github.com/mourner/suncalc) (~2 KB), used to compute sunrise/sunset
locally from each station's coordinates (see gotcha #8).

## Prerequisites

- **Node.js 18 or newer** (the server uses the built-in global `fetch`, which requires
  Node 18+). Developed against Node 24 / npm 11.
- A free **ADMIRALTY "Discovery" API key** — see [Getting an API key](#getting-an-api-key).

## Quick start

```bash
# 1. Install dependencies for both workspaces (run from the repo root)
npm install

# 2. Create the server env file and add your API key
cp server/.env.example server/.env
#   then edit server/.env and paste your key into ADMIRALTY_API_KEY

# 3. Run the client + proxy server together
npm run dev
```

- Client dev server: <http://localhost:5173>
- Proxy API server: <http://localhost:8787> (the Vite dev server proxies `/api/*` to it)

Open <http://localhost:5173> in a browser. The app loads with **Brighton Marina** selected
by default (or your last-viewed station, remembered in `localStorage`).

## Getting an API key

1. Register on the [ADMIRALTY developer portal](https://developer.admiralty.co.uk/).
2. Subscribe to the **UK Tidal API – Discovery** product. Discovery is **free for one year**
   and covers the current day plus the next 6 days of tidal events for all ~608 UK stations.
3. Copy your subscription key (an Azure API Management key) into `server/.env` as
   `ADMIRALTY_API_KEY`.

The key is only ever used **server-side** and is never sent to the browser (see
[Architecture](#architecture)).

## Environment variables

All server config lives in `server/.env` (copy from `server/.env.example`). The client
needs no env file.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ADMIRALTY_API_KEY` | **Yes** | — | Your Discovery subscription key, sent as the `Ocp-Apim-Subscription-Key` header |
| `PORT` | No | `8787` | Port the proxy server listens on |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin (only relevant if the client isn't going through the Vite proxy) |

> `server/.env` is git-ignored and must **never** be committed. Recreate it on each machine.

## Available scripts

Run from the **repo root**:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Runs server + client together via `concurrently` |
| `npm run build` | Builds server (`tsc`) then client (`tsc -b && vite build`) |
| `npm run lint` | Lints the client with ESLint |

Per-workspace (e.g. `npm run dev -w server` or `-w client`):

| Command | Workspace | What it does |
|---------|-----------|--------------|
| `dev` | server | `tsx watch src/index.ts` (auto-reload) |
| `build` | server | Compile TypeScript to `server/dist/` |
| `start` | server | Run the compiled server (`node dist/index.js`) — for production |
| `dev` | client | Vite dev server |
| `build` | client | Type-check + build static site to `client/dist/` |
| `preview` | client | Serve the built client locally |

## Transferring to another machine (no git history)

This project can be moved by copying the folder — you do **not** need git history.

1. Copy the whole `Tidey/` folder **except** the regenerable/secret bits:
   - `node_modules/` (all of them — reinstalled by `npm install`)
   - `client/dist/`, `server/dist/` (build output)
   - `*.tsbuildinfo` (TypeScript incremental caches)
   - `server/.env` (contains your secret key — recreate it, don't copy it around casually)

   Everything else, including `package-lock.json`, **should** be copied so dependency
   versions stay identical.

2. On the new machine:
   ```bash
   npm install
   cp server/.env.example server/.env    # then add your ADMIRALTY_API_KEY
   npm run dev
   ```

That's it — there's no database, no global tooling, and no build step required before
`npm run dev`.

## Architecture

```
Browser (React app, :5173)
   │  fetch("/api/stations…")        ← relative URLs only
   ▼
Vite dev server proxy  ──►  Express proxy (:8787)
                                │  adds Ocp-Apim-Subscription-Key header
                                │  caches responses (in-memory TTL)
                                ▼
                       ADMIRALTY UK Tidal API (Azure)
```

**Why a proxy?** The ADMIRALTY API authenticates with a subscription key sent in a request
header. If the browser called the API directly, that key would be visible in the page
source / network tab to anyone. So the browser only ever talks to our own Express server
(using relative `/api/*` URLs), and the server attaches the key and forwards the request.
The server also caches responses to stay well within the free Discovery tier's limits:

- **Station list:** cached 24 h (it essentially never changes)
- **Tidal events:** cached 30 min per station (predictions don't change within a day)

## Project structure

```
Tidey/
├── package.json              # root: npm workspaces + dev/build scripts
├── package-lock.json
├── vercel.json               # Vercel build + routing (SPA fallback + /api function)
├── api/
│   └── index.ts              # Vercel serverless entry — delegates to the Express app
├── server/
│   ├── .env                  # your API key (git-ignored — create this)
│   ├── .env.example
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express app, CORS, routes, listen
│       ├── admiraltyClient.ts# calls ADMIRALTY API, holds the key, caching + types
│       ├── cache.ts          # tiny in-memory TTL cache
│       └── routes/
│           └── stations.ts   # /api/stations and /api/stations/:id/events + error handler
└── client/
    ├── index.html            # favicon, apple-touch-icon, manifest + theme-color links
    ├── vite.config.ts        # Vite + React + Tailwind, /api → :8787 dev proxy
    ├── eslint.config.js
    ├── tsconfig*.json
    ├── public/               # served verbatim at site root (stable, unhashed URLs)
    │   ├── icon*.png         # favicon / apple-touch / PWA icons
    │   └── manifest.webmanifest  # PWA manifest (name, icons, theme_color)
    └── src/
        ├── main.tsx          # React entry
        ├── App.tsx           # top-level state, data fetching, layout
        ├── api.ts            # client-side fetch wrappers + event sanitising
        ├── types.ts          # shared TS types (Station, TidalEvent, …)
        ├── format.ts         # date/time helpers (UTC↔Europe/London, day keys)
        ├── tide.ts           # tide-curve interpolation maths
        ├── sun.ts            # sunrise/sunset/twilight via suncalc
        ├── geo.ts            # haversine distance + nearest-station
        ├── index.css         # Tailwind import, dark-mode variant, chart CSS vars
        ├── hooks/
        │   ├── useStations.ts# fetches the full station list once
        │   └── useTheme.ts   # light/dark theme state + persistence
        └── components/
            ├── StationPicker.tsx  # search box + dropdown + "use my location"
            ├── DaySelector.tsx    # day tabs (today + 6)
            ├── TideChart.tsx      # the SVG tide curve for the selected day
            ├── TideEventsList.tsx # high/low cards for the selected day
            ├── TodaySummary.tsx   # compact "today's highs & lows" panel
            ├── TideIcon.tsx       # the "porthole" high/low glyph
            └── ThemeToggle.tsx    # light/dark button
```

## The ADMIRALTY API (what you need to know)

- **Base URL:** `https://admiraltyapi.azure-api.net/uktidalapi/api/V1`
- **Auth header:** `Ocp-Apim-Subscription-Key: <your key>`
- **Endpoints used** (via our proxy, so the client calls the left column):

  | Client → proxy | Proxy → ADMIRALTY | Returns |
  |----------------|-------------------|---------|
  | `GET /api/stations` | `GET /Stations` | GeoJSON `FeatureCollection` of all stations (`Id`, `Name`, `Country`, coordinates) |
  | `GET /api/stations/:id/events?duration=7` | `GET /Stations/{id}/TidalEvents?duration=7` | Array of tidal events |

- **Discovery tier limit:** `duration` is 1–7 (default 7 = today + next 6 days). There is
  **no way to fetch past days** on this tier — this matters for the tide curve (see below).
- **Tidal event shape:** `{ EventType: "HighWater" | "LowWater", DateTime, Height,
  IsApproximateTime, IsApproximateHeight, Filtered }`.

## Important implementation notes & gotchas

These are the non-obvious things that took investigation — read before changing the
relevant code.

### 1. `DateTime` is GMT, never BST, and has no timezone suffix
The API returns times like `"2026-08-06T03:26:00"` — always **GMT**, never adjusted for
British Summer Time, and with **no `Z`/offset**. If you parse that string directly, JS
treats it as *browser-local* time and it can be an hour off during BST. The fix lives in
[`client/src/format.ts`](client/src/format.ts): `toUtcDate()` appends `Z` (treat as UTC),
and everything is then reformatted to `Europe/London` via `Intl.DateTimeFormat`, which
correctly applies BST/GMT. `londonMidnightMs()` / `londonOffsetMinutes()` compute the UK
day boundary the same way.

### 2. ~8% of stations return malformed events
Small river/estuary "secondary" stations (Truro, Topsham, Bosham, …) sometimes return
events with the `DateTime` **field omitted entirely** (and sometimes `Height` too). Parsing
those threw `RangeError: Invalid time value` and blanked the whole app. They're now filtered
out in [`client/src/api.ts`](client/src/api.ts) (`isUsableEvent`) before any component sees
them. **Keep that filter** if you touch the fetch layer.

### 3. The tide curve is an *estimate*, not API data
The API only gives discrete high/low water times. The smooth curve in
[`client/src/tide.ts`](client/src/tide.ts) is a **half-cosine interpolation** between
consecutive extremes (the standard semi-diurnal approximation). Because the Discovery tier
can't return the *previous* day's events, the early-morning part of "today" (before the
first event) has nothing to interpolate from — rather than draw a flat line, we **mirror the
adjacent segment** (`mirrorBefore`/`mirrorAfter`) to synthesise a plausible neighbour. Days
1–5 use real data on both sides; only day 0's start and day 6's end use the mirror.

### 4. The chart follows the selected day; the summary panel is fixed to today
`TideChart` takes both `dayKey` (the selected day) and `todayKey`. The "now" marker only
renders when they're equal. `TodaySummary` deliberately always shows *today*, regardless of
the day tab.

### 5. SVG text sizing
`TideChart` uses a `ResizeObserver` so the SVG `viewBox` width matches the container's real
pixel width (1 unit = 1 px). Without this, viewBox scaling shrinks label text to
illegibility on narrow screens.

### 6. Theme
Light/dark only (no "system" mode). **Defaults to dark** on first visit, then respects the
user's choice, stored in `localStorage` (`tidey:theme`). Dark mode is class-based: Tailwind
v4's `@custom-variant dark` in `index.css` keys off a `.dark` class on `<html>`, toggled in
[`useTheme.ts`](client/src/hooks/useTheme.ts). A small inline script in `index.html` applies
the class before first paint so there's no light-mode flash on load.

### 7. Persisted state (localStorage keys)
- `tidey:theme` — `"light"` | `"dark"`
- `tidey:lastStationId` — restores your last station on load (falls back to Brighton Marina)

### 8. Sunrise/sunset is computed locally, not fetched
The day/night gradient and sunrise/sunset markers on the chart come from
[`client/src/sun.ts`](client/src/sun.ts), which uses `suncalc` to compute sun times from
the **station's latitude/longitude** (already in the station data) and the selected date —
no API, no key, works offline. `suncalc` returns civil twilight (`dawn`/`dusk`) too, which
drives the soft dawn/dusk colour band; those can be `null` at high latitudes near midsummer
(twilight all night), so the code falls back gracefully. Colours are CSS variables
(`--tide-day` / `--tide-twilight` / `--tide-night` / `--tide-sun`) themed for light & dark
in `index.css`.

> **Dropbox/OneDrive note:** this project lives under a synced folder, and sync clients lock
> `node_modules/.vite`, which makes Vite's dependency-optimization rename fail with
> `EBUSY … deps_temp → deps`. To avoid it, `vite.config.ts` sets `cacheDir` to a temp-dir
> location (`%TEMP%/tidey-vite-cache`) so the cache lives **outside** the synced tree. If you
> move this project out of a synced folder you can delete that `cacheDir` line to go back to
> the default `node_modules/.vite`. (The ideal setup is still to keep `node_modules` out of
> cloud sync entirely — it's large and fully regenerable.)

## Building for production / deployment

To build both workspaces locally:

```bash
npm run build          # builds server → server/dist, client → client/dist
```

### Deployed on Vercel (current setup)

The app deploys to **Vercel** as a single project: the static client and the API run on the
**same origin**, so the client's relative `/api/*` calls work with no CORS config. Two files
wire this up:

- [`vercel.json`](vercel.json) — sets `buildCommand` to `npm run build` and `outputDirectory`
  to `client/dist`, then routes requests with two rewrites:

  | Rewrite | Effect |
  |---------|--------|
  | `/api/(.*)` → `/api` | every API request is handled by the serverless function |
  | `/(.*)` → `/index.html` | everything else falls back to the SPA (static assets in `client/dist` are served directly first; only unmatched paths hit this) |

- [`api/index.ts`](api/index.ts) — the Vercel serverless entry (Vercel auto-detects the `api/`
  directory). It lazily imports the **compiled** Express app from `server/dist/index.js` and
  delegates every request to it, caching the import across warm invocations. So the exact same
  Express app that runs locally also serves the API in production — no separate handler to keep
  in sync.

The Express app ([`server/src/index.ts`](server/src/index.ts)) guards its `app.listen()` behind
`if (!process.env.VERCEL)`: locally it listens on `PORT`; on Vercel it's invoked directly by the
function and never binds a port. `export default app` is what the function imports.

> Because the API function imports `server/dist/index.js`, the server **must** be compiled before
> the function is bundled. `npm run build` (the configured `buildCommand`) builds the server first,
> then the client, so this happens automatically.

**Deploy steps:**

1. Connect the repo to a Vercel project (or use the `vercel` CLI).
2. In **Project Settings → Environment Variables**, add `ADMIRALTY_API_KEY` (for Production and
   Preview). This is the only required variable — `PORT` is ignored on Vercel, and `CLIENT_ORIGIN`
   isn't needed since client and API share an origin.
3. Push to the connected branch. Vercel runs `npm run build`, serves `client/dist` from its CDN,
   and routes `/api/*` to the function.

### Self-hosting alternative

You don't have to use Vercel. To run it anywhere else you need two things:

1. **The proxy server** (`server/`) with `ADMIRALTY_API_KEY` set in its environment, started
   with `npm run start -w server` (serves the API on `PORT`).
2. **The static client** (`client/dist/`) served by any static host / CDN.

Point the client's `/api/*` calls at the proxy — either host both behind the same origin
(simplest), or set `CLIENT_ORIGIN` on the server to the client's origin so CORS allows it. The
serverless logic in `admiraltyClient.ts` is host-agnostic; only the listen/serve wiring is
Express-specific.

## Testing

There is **no committed automated test suite**. During development, changes were verified by
driving the running app in a headless browser with Playwright (ad-hoc scripts, not part of
the repo) and by type-checking via `npm run build`. If you add tests, Playwright against the
dev server is the path that matched how this was built.

Minimum sanity check after any change: `npm run build` (type-checks both workspaces) and a
manual click-through in the browser.

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| `ADMIRALTY_API_KEY is not set` error | `server/.env` missing or empty — create it and add your key |
| Station data loads but events fail with a 502 | Key is wrong/expired, or Discovery subscription lapsed |
| Tide times look an hour off | Almost certainly a timezone regression — see gotcha #1 |
| App goes blank after picking a station | A malformed-event regression — see gotcha #2 |
| `npm audit` flags esbuild/vite (moderate) | Known dev-server-only advisory; doesn't affect production builds. Left as-is to avoid a breaking Vite major bump |
| Port already in use | Change `PORT` in `server/.env` (and the proxy target in `client/vite.config.ts`) |
