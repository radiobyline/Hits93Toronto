import { SERVER_ID } from "../config/constants";
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
  const payload = await fetchJson<HistoryResponse | RawHistoryTrack[]>("/history/", {
    limit,
    offset,
    server: SERVER_ID
  });

  const tracks = extractRawTracks(payload)
    .map((rawTrack) => normalizeTrack(rawTrack))
    .filter((track) => track.startMs > 0);

  return sortTracksByStartDesc(tracks);
}

function trackStartsInWindow(track: Track, windowStartMs: number, windowEndMs: number): boolean {
  return track.startMs >= windowStartMs && track.startMs < windowEndMs;
}

export async function fetchHistoryForWindow(windowStartMs: number, windowEndMs: number): Promise<Track[]> {
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
