import type { Track } from "../types";

export type TrackAddToActionSource = "recent-carousel" | "recent-page" | "programme-episode";

interface TrackAddToActionDetail {
  source: TrackAddToActionSource;
  track: Pick<Track, "key" | "title" | "artist" | "album" | "startMs" | "allMusicId">;
}

export function handleTrackAddToAction(track: Track, source: TrackAddToActionSource): void {
  const detail: TrackAddToActionDetail = {
    source,
    track: {
      key: track.key,
      title: track.title,
      artist: track.artist,
      album: track.album,
      startMs: track.startMs,
      allMusicId: track.allMusicId
    }
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<TrackAddToActionDetail>("hits93:add-to-track", { detail }));
  }

  console.info("[Hits93] Add To action stub invoked", detail);
}
