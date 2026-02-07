import { DEFAULT_ARTWORK_URL } from "../config/constants";
import type { RawHistoryTrack, Track } from "../types";

const ACTIVE_GRACE_MS = 15000;

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function makeTrackKey(raw: RawHistoryTrack, startMs: number, title: string, artist: string): string {
  const rawId = raw.all_music_id ?? raw.metadata?.["all_music_id"] ?? raw.metadata?.["id"];
  if (rawId) {
    return String(rawId);
  }

  return `${startMs}-${title}-${artist}`.toLowerCase().replace(/\s+/g, "-");
}

export function normalizeTrack(raw: RawHistoryTrack): Track {
  const title = (raw.title || "Unknown title").toString();
  const artist = (raw.author || "Unknown artist").toString();
  const startMs = toNumber(raw.ts);
  const lengthMs = toNumber(raw.length);
  const endMs = lengthMs > 0 ? startMs + lengthMs : null;

  const artworkUrl =
    raw.img_large_url || raw.img_medium_url || raw.img_url || DEFAULT_ARTWORK_URL;

  const rawMusicId = raw.all_music_id ?? raw.metadata?.["all_music_id"] ?? raw.metadata?.["id"];
  const allMusicId = toNumber(rawMusicId) || null;

  return {
    key: makeTrackKey(raw, startMs, title, artist),
    title,
    artist,
    album: raw.album?.toString(),
    artworkUrl: artworkUrl.toString(),
    startMs,
    lengthMs,
    endMs,
    allMusicId,
    playlistTitle: raw.playlist_title?.toString(),
    raw
  };
}

export function sortTracksByStartDesc(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => b.startMs - a.startMs);
}

export function detectCurrentTrack(tracks: Track[], now = Date.now()): Track | null {
  if (!tracks.length) {
    return null;
  }

  const sorted = sortTracksByStartDesc(tracks);

  const active = sorted.find((track) => {
    if (!track.startMs) {
      return false;
    }

    if (track.endMs === null) {
      return track.startMs <= now + ACTIVE_GRACE_MS;
    }

    return track.startMs <= now + ACTIVE_GRACE_MS && now <= track.endMs + ACTIVE_GRACE_MS;
  });

  if (active) {
    return active;
  }

  const pastOrNow = sorted.filter((track) => track.startMs <= now);
  if (pastOrNow.length > 0) {
    return pastOrNow[0];
  }

  return sorted[sorted.length - 1];
}

export function getTrackSearchQuery(track: Pick<Track, "artist" | "title">): string {
  return `${track.artist} ${track.title}`.trim();
}
