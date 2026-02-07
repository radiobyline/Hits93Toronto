import { getTrackSearchQuery } from "../../utils/track";
import type { Track } from "../../types";

interface MusicLinksProps {
  track: Track | null;
}

interface ServiceLink {
  href: string;
  label: string;
  hint: string;
  className: string;
}

export function MusicLinks({ track }: MusicLinksProps): JSX.Element {
  if (!track) {
    return (
      <div className="music-links">
        <span className="music-links__empty">Song links unlock once metadata arrives.</span>
      </div>
    );
  }

  const query = encodeURIComponent(getTrackSearchQuery(track));
  const links: ServiceLink[] = [
    {
      href: `https://open.spotify.com/search/${query}`,
      label: "Spotify",
      hint: "Add to your Spotify Library",
      className: "music-link music-link--spotify"
    },
    {
      href: `https://music.apple.com/us/search?term=${query}`,
      label: "Apple Music",
      hint: "Open in Apple Music",
      className: "music-link music-link--apple"
    },
    {
      href: `https://www.youtube.com/results?search_query=${query}`,
      label: "YouTube",
      hint: "Open in YouTube",
      className: "music-link music-link--youtube"
    }
  ];

  return (
    <div className="music-links">
      {links.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className={link.className}>
          <span className="music-link__service">{link.label}</span>
          <span className="music-link__hint">{link.hint}</span>
        </a>
      ))}
    </div>
  );
}
