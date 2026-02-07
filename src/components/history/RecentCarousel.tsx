import { Link } from "react-router-dom";
import type { Track } from "../../types";

interface RecentCarouselProps {
  tracks: Track[];
}

export function RecentCarousel({ tracks }: RecentCarouselProps): JSX.Element {
  return (
    <section className="recent-carousel">
      <div className="section-heading">
        <h2>Recently played</h2>
        <Link to="/recent">See all</Link>
      </div>

      <div className="recent-carousel__track-row" role="list">
        {tracks.map((track) => (
          <article className="recent-card" key={`${track.key}-${track.startMs}`} role="listitem">
            <img
              src={track.artworkUrl}
              alt={`${track.title} artwork`}
              loading="lazy"
              className="recent-card__image"
            />
            <div className="recent-card__meta">
              <h3>{track.title}</h3>
              <p>{track.artist}</p>
            </div>
          </article>
        ))}

        {!tracks.length && (
          <article className="recent-card recent-card--empty">
            <div className="recent-card__meta">
              <h3>No recent tracks yet</h3>
              <p>Track history appears here once metadata is available.</p>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
