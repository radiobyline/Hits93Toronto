import { useEffect, useMemo, useState } from "react";
import { HISTORY_PAGE_SIZE } from "../config/constants";
import { fetchHistory } from "../services/historyService";
import type { Track } from "../types";
import { formatClock } from "../utils/time";

function dedupeTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();

  return tracks.filter((track) => {
    const key = `${track.key}-${track.startMs}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function RecentPage(): JSX.Element {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (nextOffset: number, append: boolean) => {
    setLoading(true);
    try {
      const page = await fetchHistory(HISTORY_PAGE_SIZE, nextOffset);
      setTracks((previous) => {
        const merged = append ? [...previous, ...page] : page;
        return dedupeTracks(merged);
      });
      setOffset(nextOffset + HISTORY_PAGE_SIZE);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage(0, false);
  }, []);

  const hasResults = tracks.length > 0;
  const sortedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => b.startMs - a.startMs);
  }, [tracks]);

  return (
    <div className="container">
      <section className="page-section">
        <h2>Full recently played history</h2>
        <p className="page-section__lede">
          Pulling Streaming Center history with incremental loading to keep rendering lightweight.
        </p>

        {error && <p className="status-inline status-inline--error">{error}</p>}
        {loading && !hasResults && <p className="status-inline">Loading recent tracks...</p>}

        <div className="recent-list">
          {sortedTracks.map((track) => (
            <article className="recent-list__item" key={`${track.key}-${track.startMs}`}>
              <img src={track.artworkUrl} alt={`${track.title} artwork`} loading="lazy" />
              <div>
                <h3>{track.title}</h3>
                <p>{track.artist}</p>
                <p className="recent-list__time">{formatClock(track.startMs)}</p>
              </div>
            </article>
          ))}

          {!loading && !hasResults && <p className="status-inline">No history returned yet.</p>}
        </div>

        <div className="page-section__actions">
          <button
            type="button"
            className="control-button"
            disabled={loading}
            onClick={() => {
              void loadPage(offset, true);
            }}
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      </section>
    </div>
  );
}
