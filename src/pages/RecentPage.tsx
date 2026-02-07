import { useEffect, useMemo, useState } from "react";
import { DEFAULT_ARTWORK_URL, HISTORY_PAGE_SIZE } from "../config/constants";
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

  const startOfToday = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  const groupedByDate = useMemo(() => {
    const rows: Array<{ type: "heading"; label: string } | { type: "track"; track: Track }> = [];
    let lastDayKey = "";

    for (const track of sortedTracks) {
      const date = new Date(track.startMs);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      if (dayKey !== lastDayKey) {
        if (track.startMs < startOfToday) {
          const label = date.toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          });
          rows.push({ type: "heading", label });
        }
        lastDayKey = dayKey;
      }

      rows.push({ type: "track", track });
    }

    return rows;
  }, [sortedTracks, startOfToday]);

  return (
    <div className="container">
      <section className="page-section recent-page">
        <h2>Full recently played history</h2>
        <p className="page-section__lede">
          Pulling Streaming Center history with incremental loading to keep rendering lightweight.
        </p>

        {error && <p className="status-inline status-inline--error">{error}</p>}
        {loading && !hasResults && <p className="status-inline">Loading recent tracks...</p>}

        <div className="recent-list">
          {groupedByDate.map((row, index) => {
            if (row.type === "heading") {
              return (
                <div className="recent-list__day" key={`day-${row.label}-${index}`}>
                  {row.label}
                </div>
              );
            }

            return (
              <article className="recent-list__item" key={`${row.track.key}-${row.track.startMs}`}>
                <img
                  src={row.track.artworkUrl}
                  alt={`${row.track.title} artwork`}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_ARTWORK_URL;
                  }}
                />
                <div>
                  <h3>{row.track.title}</h3>
                  <p>{row.track.artist}</p>
                  <p className="recent-list__time">{formatClock(row.track.startMs)}</p>
                </div>
              </article>
            );
          })}

          {!loading && !hasResults && <p className="status-inline">No history returned yet.</p>}
        </div>

        <div className="page-section__actions recent-page__actions">
          <button
            type="button"
            className="control-pill"
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
