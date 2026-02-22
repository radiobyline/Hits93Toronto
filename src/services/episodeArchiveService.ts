import { OPTIONAL_EPISODE_ARCHIVE_URL } from "../config/constants";
import type { RawHistoryTrack, Track } from "../types";
import { normalizeTrack, sortTracksByStartDesc } from "../utils/track";

interface WorkerEpisodeTrack {
  title?: string;
  author?: string;
  album?: string;
  ts?: number;
  length?: number;
  img_url?: string;
  img_medium_url?: string;
  img_large_url?: string;
  all_music_id?: string | number;
  [key: string]: unknown;
}

interface WorkerEpisodePayload {
  episode?: {
    slug?: string;
    date?: string;
    startMs?: number;
    endMs?: number;
  };
  tracks?: WorkerEpisodeTrack[];
}

function toRawTrack(track: WorkerEpisodeTrack): RawHistoryTrack {
  return {
    title: track.title?.toString(),
    author: track.author?.toString(),
    album: track.album?.toString(),
    ts: typeof track.ts === "number" ? track.ts : Number(track.ts),
    length: typeof track.length === "number" ? track.length : Number(track.length),
    img_url: track.img_url?.toString(),
    img_medium_url: track.img_medium_url?.toString(),
    img_large_url: track.img_large_url?.toString(),
    all_music_id: track.all_music_id
  };
}

function buildEpisodeArchiveUrl(dateIso: string, startMs: number, slug: string): string | null {
  if (!OPTIONAL_EPISODE_ARCHIVE_URL) {
    return null;
  }

  const base = OPTIONAL_EPISODE_ARCHIVE_URL.endsWith("/")
    ? OPTIONAL_EPISODE_ARCHIVE_URL.slice(0, -1)
    : OPTIONAL_EPISODE_ARCHIVE_URL;

  return `${base}/v1/episodes/${encodeURIComponent(slug)}/${encodeURIComponent(dateIso)}/${startMs}.json`;
}

export async function fetchEpisodeArchiveTracks(
  dateIso: string,
  startMs: number,
  slug: string
): Promise<Track[] | null> {
  const url = buildEpisodeArchiveUrl(dateIso, startMs, slug);
  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Episode archive API error ${response.status}: ${response.statusText}`);
  }

  const payload = (await response.json()) as WorkerEpisodePayload;
  const rawTracks = Array.isArray(payload.tracks) ? payload.tracks.map((track) => toRawTrack(track)) : [];

  return sortTracksByStartDesc(
    rawTracks.map((rawTrack) => normalizeTrack(rawTrack)).filter((track) => track.startMs > 0)
  ).sort((a, b) => a.startMs - b.startMs);
}
