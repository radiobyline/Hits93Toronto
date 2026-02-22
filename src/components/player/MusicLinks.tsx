import { buildTrackMusicLinks } from "../../utils/musicLinks";
import type { Track } from "../../types";

interface MusicLinksProps {
  track: Track | null;
}

export function MusicLinks({ track }: MusicLinksProps): JSX.Element {
  if (!track) {
    return (
      <div className="music-links">
        <span className="music-links__empty">Song links unlock once metadata arrives.</span>
      </div>
    );
  }

  const links = buildTrackMusicLinks(track);

  return (
    <div className="music-links">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className={`music-link music-link--${link.service}`}
        >
          <span className="music-link__service">{link.label}</span>
          <span className="music-link__hint">{link.hint}</span>
        </a>
      ))}
    </div>
  );
}
