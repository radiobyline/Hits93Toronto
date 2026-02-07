# Hits 93 Episode Archive Worker

Cloudflare Worker that creates/stores programme episode JSON pages so episode history remains available even if Streaming Center API retention/rate limits change.

## What it stores

- Episode JSON by programme+date+timeslot:
  - `episode:{slug}:{dateIso}:{startMs}`
- Programme index JSON:
  - `programme:{slug}:index`

## Endpoints

- `GET /health`
- `GET /v1/episodes/{slug}/{dateIso}/{startMs}.json`
  - Returns one programme episode and track list.
  - Reads KV first, then builds from Streaming Center `/grid/` + `/history/` if missing.
- `GET /v1/programmes/{slug}.json`
  - Returns index of archived episodes for a programme.
- `POST /v1/rebuild?days=14`
  - Rebuilds recent archives (optional bearer auth via `ARCHIVE_ADMIN_TOKEN`).

## Deploy

1. Create KV namespace and copy ID into `wrangler.toml`.
2. Copy `wrangler.toml.example` to `wrangler.toml`.
3. Set optional token:
   - `wrangler secret put ARCHIVE_ADMIN_TOKEN`
4. Deploy:
   - `wrangler deploy`

## Frontend integration

In `/src/config/constants.ts` set:

- `OPTIONAL_EPISODE_ARCHIVE_URL = "https://your-worker-domain.example"`

The episode page will then query:

- `/v1/episodes/{slug}/{dateIso}/{startMs}.json`

If unset, frontend falls back to direct Streaming Center history queries.
