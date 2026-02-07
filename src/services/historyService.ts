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
