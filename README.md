# Hits 93 Toronto Live Player (React + Vite)

Broadcaster-style SPA for live Icecast playback with persistent audio, now playing metadata, visualizer, programme block, recently played views, live vote integration, and request/shoutout integration.

## Stack

- React 18 + TypeScript + Vite
- `HashRouter` for GitHub Pages compatibility
- Persistent audio engine mounted once at app shell level

## Config

Edit `/src/config/constants.ts`:

- `API_BASE`
- `STREAM_URL_HTTPS`
- `STREAM_URL_HTTP`
- `SERVER_ID`
- `DEFAULT_ARTWORK_URL`
- `POLL_INTERVAL_MS`
- `OPTIONAL_WORKER_PROXY_URL`

## Routes

- `/#/` Home live player
- `/#/recent` Full recently played (load more)
- `/#/schedule` Schedule page (grid endpoint + local fallback provider)
- `/#/about` Placeholder
- `/#/contact` Placeholder
- `/#/jukebox` Placeholder
- `/#/charts` Placeholder
- `/#/news` Placeholder
- `/#/privacy` Placeholder
- `/#/terms` Placeholder
- `/#/embed/player` Minimal iframe-friendly player

## Local Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## GitHub Pages Deploy

1. Push this repo to GitHub.
2. In repository settings, enable Pages from `GitHub Actions` (recommended) or `gh-pages` branch.
3. Build command: `npm run build`
4. Publish folder: `dist`

If using Actions, standard Vite static deploy workflow works because router is hash-based.

## Embed Snippet

```html
<iframe
  src="https://YOUR_GH_PAGES_DOMAIN/YOUR_REPO/#/embed/player"
  title="Hits 93 Toronto Live Player"
  width="100%"
  height="340"
  style="border:0;max-width:760px;"
  allow="autoplay"
  loading="lazy"
></iframe>
```

## Worker Proxy (optional, for CORS)

Set `OPTIONAL_WORKER_PROXY_URL` in `/src/config/constants.ts` (example: `https://worker.example.com/proxy`).

Example Cloudflare Worker:

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.searchParams.get("path") || "/history/";

    const target = new URL(`https://hits93toronto.com:2490/api/v2${path}`);
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "path") target.searchParams.set(key, value);
    }

    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent": "hits93toronto-worker-proxy/1.0"
      }
    });

    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=8"
      }
    });
  }
};
```

Worker route usage example:

- `/proxy?path=/history/&limit=8&offset=0&server=1`

## Connected API Endpoints

- Schedule grid: `/grid/?start_ts={unix_sec}&end_ts={unix_sec}&server=1&utc=1`
- Vote up: `/music/{all_music_id}/like/` (`POST`)
- Vote down: `/music/{all_music_id}/dislike/` (`POST`)
- Request search: `/music/?limit=12&offset=0&search_q=&server=1&with_tags_only=true&requestable=true&order=1`
- Request submit: `/track_requests/` (`POST`) with body:
  - `server_id`
  - `person`
  - `message`
  - `music_id`
  - `ip_timeout`
  - `track_timeout`

### Schedule window notes

- `start_ts` and `end_ts` are Unix seconds (UTC).
- Provider uses a rolling window of `now - 1 day` to `now + 7 days` to find current and next programmes.
- Example shape:
  - `/grid/?start_ts=1770345600&end_ts=1770950400&server=1&utc=1`

### Key implementation notes

- Metadata refresh uses smart timing around track boundaries (`ts + length`) with fallback interval polling.
- History ordering is normalized by timestamp sorting to guard against ambiguous API ordering claims.
- Vote dedupe is stored in `localStorage` (`hits93toronto:votes`) to prevent repeated local spam.
- Schedule provider reads `/grid/` using dynamic Unix windows and falls back to local schedule if unavailable.
- Audio starts only via user action to satisfy autoplay restrictions.
- Visualizer uses Web Audio API analyser connected after user-triggered playback.
