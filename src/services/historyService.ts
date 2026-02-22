import {
  HISTORY_CACHE_TTL_LIVE_MS,
  HISTORY_CACHE_TTL_PAST_MS,
  HISTORY_WINDOW_CACHE_TTL_LIVE_MS,
  HISTORY_WINDOW_CACHE_TTL_PAST_MS,
  SERVER_ID
} from "../config/constants";
import type { HistoryResult, RawHistoryTrack, Track } from "../types";
import { detectCurrentTrack, normalizeTrack, sortTracksByStartDesc } from "../utils/track";
import { fetchJson } from "./apiClient";

interface HistoryResponse {
  results?: RawHistoryTrack[];
  history?: RawHistoryTrack[];
  items?: RawHistoryTrack[];
  data?: RawHistoryTrack[];
}

const HISTORY_WINDOW_PAGE_SIZE = 200;
const HISTORY_WINDOW_MAX_PAGES = 40;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const historyPageCache = new Map<string, CacheEntry<Track[]>>();
const historyWindowCache = new Map<string, CacheEntry<Track[]>>();
const historyPageInflight = new Map<string, Promise<Track[]>>();
const historyWindowInflight = new Map<string, Promise<Track[]>>();

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return cached.value;
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function getHistoryPageTtl(offset: number): number {
  return offset === 0 ? HISTORY_CACHE_TTL_LIVE_MS : HISTORY_CACHE_TTL_PAST_MS;
}

function getWindowTtl(windowEndMs: number): number {
  return windowEndMs >= Date.now()
    ? HISTORY_WINDOW_CACHE_TTL_LIVE_MS
    : HISTORY_WINDOW_CACHE_TTL_PAST_MS;
}

function extractRawTracks(payload: HistoryResponse | RawHistoryTrack[]): RawHistoryTrack[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.history)) {
    return payload.history;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

export async function fetchHistory(limit: number, offset: number): Promise<Track[]> {
  const key = `${limit}:${offset}`;
  const cached = readCache(historyPageCache, key);
  if (cached) {
    return cached;
  }

  const inFlight = historyPageInflight.get(key);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const payload = await fetchJson<HistoryResponse | RawHistoryTrack[]>("/history/", {
      limit,
      offset,
      server: SERVER_ID
    });

    const tracks = extractRawTracks(payload)
      .map((rawTrack) => normalizeTrack(rawTrack))
      .filter((track) => track.startMs > 0);
    const sorted = sortTracksByStartDesc(tracks);
    writeCache(historyPageCache, key, sorted, getHistoryPageTtl(offset));
    return sorted;
  })();

  historyPageInflight.set(key, request);
  try {
    return await request;
  } finally {
    historyPageInflight.delete(key);
  }
}

function trackStartsInWindow(track: Track, windowStartMs: number, windowEndMs: number): boolean {
  return track.startMs >= windowStartMs && track.startMs < windowEndMs;
}

async function fetchHistoryForWindowUncached(windowStartMs: number, windowEndMs: number): Promise<Track[]> {
  const collected: Track[] = [];
  let offset = 0;

  for (let pageIndex = 0; pageIndex < HISTORY_WINDOW_MAX_PAGES; pageIndex += 1) {
    const page = await fetchHistory(HISTORY_WINDOW_PAGE_SIZE, offset);
    if (!page.length) {
      break;
    }

    const inWindow = page.filter((track) => trackStartsInWindow(track, windowStartMs, windowEndMs));
    collected.push(...inWindow);

    const newestStartMs = page[0]?.startMs ?? 0;
    if (newestStartMs < windowStartMs && inWindow.length === 0) {
      break;
    }

    if (page.length < HISTORY_WINDOW_PAGE_SIZE) {
      break;
    }

    offset += HISTORY_WINDOW_PAGE_SIZE;
  }

  const deduped = new Map<string, Track>();
  for (const track of collected) {
    deduped.set(`${track.key}-${track.startMs}`, track);
  }

  return [...deduped.values()].sort((a, b) => a.startMs - b.startMs);
}

export async function fetchHistoryForWindow(windowStartMs: number, windowEndMs: number): Promise<Track[]> {
  const key = `${windowStartMs}:${windowEndMs}`;
  const cached = readCache(historyWindowCache, key);
  if (cached) {
    return cached;
  }

  const inFlight = historyWindowInflight.get(key);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const tracks = await fetchHistoryForWindowUncached(windowStartMs, windowEndMs);
    writeCache(historyWindowCache, key, tracks, getWindowTtl(windowEndMs));
    return tracks;
  })();

  historyWindowInflight.set(key, request);
  try {
    return await request;
  } finally {
    historyWindowInflight.delete(key);
  }
}

export function shapeHistoryForPlayer(tracks: Track[]): HistoryResult {
  const current = detectCurrentTrack(tracks);
  const recent = current
    ? tracks.filter((track) => track.key !== current.key || track.startMs !== current.startMs)
    : tracks;

  return {
    tracks,
    current,
    recent
  };
}
