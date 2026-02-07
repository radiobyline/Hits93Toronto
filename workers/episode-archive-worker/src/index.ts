interface Env {
  SC_API_BASE: string;
  SERVER_ID: string;
  EPISODE_ARCHIVE: KVNamespace;
  ARCHIVE_ADMIN_TOKEN?: string;
}

interface GridProgrammeItem {
  id?: number;
  name?: string;
  start_ts?: number;
  end_ts?: number;
  timezone?: string;
  allow_song_requests?: boolean;
}

interface RawHistoryTrack {
  title?: string;
  author?: string;
  album?: string;
  ts?: number;
  length?: number;
  img_url?: string;
  img_medium_url?: string;
  img_large_url?: string;
  all_music_id?: string | number;
}

interface EpisodeArchiveRecord {
  episode: {
    key: string;
    slug: string;
    name: string;
    date: string;
    startMs: number;
    endMs: number;
    timezone?: string;
    requestsEnabled?: boolean;
    updatedAt: string;
  };
  tracks: RawHistoryTrack[];
  source: "worker-cache" | "streaming-center";
}

interface ProgrammeArchiveIndexRecord {
  slug: string;
  updatedAt: string;
  episodes: Array<{
    key: string;
    name: string;
    date: string;
    startMs: number;
    endMs: number;
    timezone?: string;
    requestsEnabled?: boolean;
  }>;
}

const HISTORY_PAGE_SIZE = 200;
const HISTORY_MAX_PAGES = 50;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "public, max-age=120"
    }
  });
}

function toUnixSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

function toProgrammeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDateIso(ms: number): string {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchScJson<T>(env: Env, path: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(path, env.SC_API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "hits93-episode-archive-worker/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`SC API error ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchGridWindow(env: Env, startSec: number, endSec: number): Promise<GridProgrammeItem[]> {
  const payload = await fetchScJson<GridProgrammeItem[] | { results?: GridProgrammeItem[] }>(
    env,
    "/grid/",
    {
      start_ts: startSec,
      end_ts: endSec,
      server: Number(env.SERVER_ID),
      utc: 1
    }
  );

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

async function fetchHistoryPage(env: Env, limit: number, offset: number): Promise<RawHistoryTrack[]> {
  const payload = await fetchScJson<RawHistoryTrack[] | { results?: RawHistoryTrack[] }>(
    env,
    "/history/",
    {
      limit,
      offset,
      server: Number(env.SERVER_ID)
    }
  );

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

function normalizeHistoryTrack(raw: RawHistoryTrack): RawHistoryTrack | null {
  const startMs = Number(raw.ts);
  if (!Number.isFinite(startMs) || startMs <= 0) {
    return null;
  }

  return {
    title: raw.title?.toString(),
    author: raw.author?.toString(),
    album: raw.album?.toString(),
    ts: startMs,
    length: Number(raw.length) || 0,
    img_url: raw.img_url?.toString(),
    img_medium_url: raw.img_medium_url?.toString(),
    img_large_url: raw.img_large_url?.toString(),
    all_music_id: raw.all_music_id
  };
}

function trackOverlapsWindow(track: RawHistoryTrack, startMs: number, endMs: number): boolean {
  const trackStart = Number(track.ts);
  const lengthMs = Number(track.length) || 0;
  const trackEnd = lengthMs > 0 ? trackStart + lengthMs : trackStart + 60 * 1000;

  return trackStart < endMs && trackEnd > startMs;
}

function makeEpisodeKey(slug: string, dateIso: string, startMs: number): string {
  return `episode:${slug}:${dateIso}:${startMs}`;
}

function makeProgrammeIndexKey(slug: string): string {
  return `programme:${slug}:index`;
}

function parseEpisodePath(url: URL): { slug: string; dateIso: string; startMs: number } | null {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 5) {
    return null;
  }

  if (parts[0] !== "v1" || parts[1] !== "episodes") {
    return null;
  }

  const slug = decodeURIComponent(parts[2]);
  const dateIso = decodeURIComponent(parts[3]);
  const startToken = parts[4].replace(/\.json$/i, "");
  const startMs = Number(startToken);

  if (!slug || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso) || !Number.isFinite(startMs)) {
    return null;
  }

  return { slug, dateIso, startMs };
}

async function fetchTracksForWindow(env: Env, startMs: number, endMs: number): Promise<RawHistoryTrack[]> {
  const collected: RawHistoryTrack[] = [];
  let offset = 0;

  for (let page = 0; page < HISTORY_MAX_PAGES; page += 1) {
    const rawPage = await fetchHistoryPage(env, HISTORY_PAGE_SIZE, offset);
    if (!rawPage.length) {
      break;
    }

    const normalized = rawPage
      .map((track) => normalizeHistoryTrack(track))
      .filter((track): track is RawHistoryTrack => Boolean(track))
      .sort((a, b) => Number(b.ts) - Number(a.ts));

    const overlaps = normalized.filter((track) => trackOverlapsWindow(track, startMs, endMs));
    collected.push(...overlaps);

    const oldestInPage = Number(normalized[normalized.length - 1]?.ts || 0);
    if (oldestInPage > 0 && oldestInPage < startMs && overlaps.length === 0) {
      break;
    }

    if (normalized.length < HISTORY_PAGE_SIZE) {
      break;
    }

    offset += HISTORY_PAGE_SIZE;
  }

  const deduped = new Map<string, RawHistoryTrack>();
  for (const track of collected) {
    const key = `${track.ts}-${track.title || ""}-${track.author || ""}`;
    deduped.set(key, track);
  }

  return [...deduped.values()].sort((a, b) => Number(a.ts) - Number(b.ts));
}

async function readProgrammeIndex(env: Env, slug: string): Promise<ProgrammeArchiveIndexRecord> {
  const cached = await env.EPISODE_ARCHIVE.get(makeProgrammeIndexKey(slug), "json");
  if (cached && typeof cached === "object") {
    return cached as ProgrammeArchiveIndexRecord;
  }

  return {
    slug,
    updatedAt: new Date().toISOString(),
    episodes: []
  };
}

async function writeProgrammeIndex(env: Env, slug: string, index: ProgrammeArchiveIndexRecord): Promise<void> {
  await env.EPISODE_ARCHIVE.put(makeProgrammeIndexKey(slug), JSON.stringify(index));
}

async function writeEpisodeArchive(
  env: Env,
  slug: string,
  dateIso: string,
  startMs: number,
  record: EpisodeArchiveRecord
): Promise<void> {
  const key = makeEpisodeKey(slug, dateIso, startMs);
  await env.EPISODE_ARCHIVE.put(key, JSON.stringify(record));

  const index = await readProgrammeIndex(env, slug);
  const nextEpisodes = [
    ...index.episodes.filter((item) => item.key !== record.episode.key),
    {
      key: record.episode.key,
      name: record.episode.name,
      date: record.episode.date,
      startMs: record.episode.startMs,
      endMs: record.episode.endMs,
      timezone: record.episode.timezone,
      requestsEnabled: record.episode.requestsEnabled
    }
  ].sort((a, b) => b.startMs - a.startMs);

  await writeProgrammeIndex(env, slug, {
    slug,
    updatedAt: new Date().toISOString(),
    episodes: nextEpisodes
  });
}

async function buildEpisodeArchiveRecord(
  env: Env,
  slug: string,
  dateIso: string,
  startMs: number
): Promise<EpisodeArchiveRecord | null> {
  const dayStart = new Date(`${dateIso}T00:00:00.000Z`).getTime();
  const startSec = toUnixSeconds(dayStart - 24 * 60 * 60 * 1000);
  const endSec = toUnixSeconds(dayStart + 2 * 24 * 60 * 60 * 1000);

  const grid = await fetchGridWindow(env, startSec, endSec);
  const matched = grid
    .map((item) => {
      const itemStartMs = Number(item.start_ts) * 1000;
      const itemEndMs = Number(item.end_ts) * 1000;
      const itemName = item.name?.toString() || "Programme";
      const itemSlug = toProgrammeSlug(itemName);

      return {
        id: item.id,
        name: itemName,
        slug: itemSlug,
        startMs: itemStartMs,
        endMs: itemEndMs,
        timezone: item.timezone?.toString(),
        requestsEnabled: Boolean(item.allow_song_requests)
      };
    })
    .filter((item) => Number.isFinite(item.startMs) && Number.isFinite(item.endMs))
    .find((item) => item.startMs === startMs && item.slug === slug);

  if (!matched) {
    return null;
  }

  const tracks = await fetchTracksForWindow(env, matched.startMs, matched.endMs);

  return {
    episode: {
      key: `${matched.slug}:${matched.startMs}`,
      slug: matched.slug,
      name: matched.name,
      date: dateIso,
      startMs: matched.startMs,
      endMs: matched.endMs,
      timezone: matched.timezone,
      requestsEnabled: matched.requestsEnabled,
      updatedAt: new Date().toISOString()
    },
    tracks,
    source: "streaming-center"
  };
}

async function handleEpisodeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const parsed = parseEpisodePath(url);
  if (!parsed) {
    return jsonResponse({ error: "Invalid episode path." }, 400);
  }

  const key = makeEpisodeKey(parsed.slug, parsed.dateIso, parsed.startMs);
  const cached = await env.EPISODE_ARCHIVE.get(key, "json");
  if (cached && typeof cached === "object") {
    const record = cached as EpisodeArchiveRecord;
    return jsonResponse({ ...record, source: "worker-cache" });
  }

  const built = await buildEpisodeArchiveRecord(env, parsed.slug, parsed.dateIso, parsed.startMs);
  if (!built) {
    return jsonResponse({ error: "Episode not found for provided slug/date/start timestamp." }, 404);
  }

  await writeEpisodeArchive(env, parsed.slug, parsed.dateIso, parsed.startMs, built);
  return jsonResponse(built);
}

function isAdminAuthorized(request: Request, env: Env): boolean {
  if (!env.ARCHIVE_ADMIN_TOKEN) {
    return true;
  }

  const auth = request.headers.get("Authorization") || "";
  const expected = `Bearer ${env.ARCHIVE_ADMIN_TOKEN}`;
  return auth === expected;
}

async function rebuildRecentEpisodes(env: Env, days: number): Promise<{ stored: number }> {
  const now = Date.now();
  const startSec = toUnixSeconds(now - days * 24 * 60 * 60 * 1000);
  const endSec = toUnixSeconds(now + 24 * 60 * 60 * 1000);

  const grid = await fetchGridWindow(env, startSec, endSec);
  const programmeItems = grid
    .map((item) => {
      const startMs = Number(item.start_ts) * 1000;
      const endMs = Number(item.end_ts) * 1000;
      const name = item.name?.toString() || "Programme";
      const slug = toProgrammeSlug(name);

      return {
        slug,
        name,
        startMs,
        endMs,
        dateIso: toDateIso(startMs),
        timezone: item.timezone?.toString(),
        requestsEnabled: Boolean(item.allow_song_requests)
      };
    })
    .filter((item) => Number.isFinite(item.startMs) && Number.isFinite(item.endMs));

  let stored = 0;
  for (const item of programmeItems) {
    const key = makeEpisodeKey(item.slug, item.dateIso, item.startMs);
    const exists = await env.EPISODE_ARCHIVE.get(key);
    if (exists) {
      continue;
    }

    const tracks = await fetchTracksForWindow(env, item.startMs, item.endMs);
    const record: EpisodeArchiveRecord = {
      episode: {
        key: `${item.slug}:${item.startMs}`,
        slug: item.slug,
        name: item.name,
        date: item.dateIso,
        startMs: item.startMs,
        endMs: item.endMs,
        timezone: item.timezone,
        requestsEnabled: item.requestsEnabled,
        updatedAt: new Date().toISOString()
      },
      tracks,
      source: "streaming-center"
    };

    await writeEpisodeArchive(env, item.slug, item.dateIso, item.startMs, record);
    stored += 1;
  }

  return { stored };
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return jsonResponse({ ok: true });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "hits93-episode-archive" });
    }

    if (request.method === "GET" && /^\/v1\/episodes\//.test(url.pathname)) {
      return handleEpisodeRequest(request, env);
    }

    if (request.method === "GET" && /^\/v1\/programmes\//.test(url.pathname)) {
      const parts = url.pathname.split("/").filter(Boolean);
      const slug = decodeURIComponent(parts[2] || "").replace(/\.json$/i, "");
      if (!slug) {
        return jsonResponse({ error: "Programme slug is required." }, 400);
      }

      const index = await readProgrammeIndex(env, slug);
      return jsonResponse(index);
    }

    if (request.method === "POST" && url.pathname === "/v1/rebuild") {
      if (!isAdminAuthorized(request, env)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const days = Number(url.searchParams.get("days") || 14);
      const safeDays = Number.isFinite(days) ? Math.min(30, Math.max(1, Math.floor(days))) : 14;
      const result = await rebuildRecentEpisodes(env, safeDays);
      return jsonResponse({ ok: true, ...result, days: safeDays });
    }

    return jsonResponse({ error: "Not found" }, 404);
  },

  async scheduled(_event, env): Promise<void> {
    await rebuildRecentEpisodes(env, 2);
  }
} satisfies ExportedHandler<Env>;
