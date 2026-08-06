# Tidey

A small web app for checking tide times at nautical stations around the UK, using the
[ADMIRALTY UK Tidal API](https://developer.admiralty.co.uk/) (UK Hydrographic Office).

- Search any of the ~600 UK tidal stations, or use "nearest to me"
- Shows high/low water times and heights for today plus the next 6 days, with day tabs
- Light / dark / system theme toggle
- Responsive layout for mobile, tablet and desktop

## How it's built

- `client/` — React + TypeScript + Vite, styled with Tailwind CSS v4
- `server/` — a small Express + TypeScript proxy

The Admiralty API requires a subscription key sent as a header. That key must never be
visible to the browser, so the client never calls Admiralty directly — it calls the local
`server`, which attaches the key and forwards the request. The server also caches responses
briefly (station list for 24h, tidal events for 30 min) to stay well within the free
Discovery tier's request limits.

## Setup

1. Get a free "Discovery" subscription key from the
   [ADMIRALTY developer portal](https://developer.admiralty.co.uk/) (Discovery tier gives
   current + 6 days of tidal events for 607 stations, free for a year).
2. Install dependencies from the repo root (this installs both workspaces):
   ```
   npm install
   ```
3. Configure the server:
   ```
   cp server/.env.example server/.env
   ```
   then edit `server/.env` and paste your key into `ADMIRALTY_API_KEY`.
4. Run both the proxy server and the client dev server together:
   ```
   npm run dev
   ```
   - Client: http://localhost:5173
   - Server: http://localhost:8787 (the client's dev server proxies `/api/*` to it)

## Notes

- `npm audit` will flag a moderate advisory in `esbuild`/`vite` — it only affects the local
  dev server accepting arbitrary requests from other sites while `vite dev` is running, and
  doesn't affect production builds. Left as-is to avoid an unrelated breaking Vite major
  bump; upgrade later if you want it gone.
- Tidal predictions are for general reference only — for navigation, always use official
  ADMIRALTY products.
