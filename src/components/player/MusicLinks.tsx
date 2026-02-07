import { getTrackSearchQuery } from "../../utils/track";
import type { Track } from "../../types";

interface MusicLinksProps {
  track: Track | null;
}

export function MusicLinks({ track }: MusicLinksProps): JSX.Element {
  if (!track) {
    return (
      <div className="music-links">
        <span className="music-links__empty">Links unlock when track metadata is available.</span>
      </div>
    );
  }

  const query = encodeURIComponent(getTrackSearchQuery(track));

  return (
    <div className="music-links">
      <a href={`https://open.spotify.com/search/${query}`} target="_blank" rel="noreferrer">
        Spotify
      </a>
      <a href={`https://music.apple.com/us/search?term=${query}`} target="_blank" rel="noreferrer">
        Apple Music
      </a>
      <a href={`https://www.youtube.com/results?search_query=${query}`} target="_blank" rel="noreferrer">
        YouTube
      </a>
    </div>
  );
}
