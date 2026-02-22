import type { Track } from "../types";
import { getTrackSearchQuery } from "./track";

export type TrackMusicLinkService = "spotify" | "apple" | "youtube";

export interface TrackMusicLink {
  service: TrackMusicLinkService;
  label: string;
  hint: string;
  href: string;
}

export function buildTrackMusicLinks(track: Pick<Track, "artist" | "title"> | null): TrackMusicLink[] {
  if (!track) {
    return [];
  }

  const query = encodeURIComponent(getTrackSearchQuery(track));

  return [
    {
      service: "spotify",
      label: "Spotify",
      hint: "Add to Spotify",
      href: `https://open.spotify.com/search/${query}`
    },
    {
      service: "apple",
      label: "Apple Music",
      hint: "Open in Apple Music",
      href: `https://music.apple.com/us/search?term=${query}`
    },
    {
      service: "youtube",
      label: "YouTube",
      hint: "Watch on YouTube",
      href: `https://www.youtube.com/results?search_query=${query}`
    }
  ];
}
