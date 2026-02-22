import { Link } from "react-router-dom";
import { DEFAULT_ARTWORK_URL } from "../../config/constants";
import { handleTrackAddToAction } from "../../services/trackListActions";
import type { Track } from "../../types";
import { formatClock } from "../../utils/time";

interface RecentCarouselProps {
  tracks: Track[];
}

export function RecentCarousel({ tracks }: RecentCarouselProps): JSX.Element {
  return (
    <section className="recent-carousel">
      <div className="section-heading">
        <h2>Recently Played</h2>
        <Link to="/recent" className="control-pill control-pill--small recent-carousel__see-all">
          Full History
        </Link>
      </div>

      <div className="recent-carousel__track-row" role="list">
        {tracks.map((track) => (
          <article className="recent-card" key={`${track.key}-${track.startMs}`} role="listitem">
            <div className="recent-card__artwork">
              <img
                src={track.artworkUrl}
                alt={`${track.title} artwork`}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width={560}
                height={560}
                className="recent-card__image"
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_ARTWORK_URL;
                }}
              />
            </div>
            <div className="recent-card__meta">
              <h3>{track.title}</h3>
              <p>{track.artist}</p>
              <p className="recent-card__time">{formatClock(track.startMs)}</p>
              <div className="recent-card__actions">
                <button
                  type="button"
                  className="control-pill control-pill--small recent-card__add-to"
                  onClick={() => {
                    handleTrackAddToAction(track, "recent-carousel");
                  }}
                  title="Add to playlist/library options coming soon."
                >
                  Add To...
                </button>
              </div>
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
