import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SCHEDULE_EPISODE_LOOKBACK_DAYS } from "../config/constants";
import type { Programme } from "../services/scheduleProvider";
import { scheduleProvider } from "../services/scheduleService";
import { formatClock } from "../utils/time";
import { formatIsoDateLocal, parseIsoDateLocal, shiftLocalDays } from "../utils/programme";

function formatDateLabel(dateIso: string): string {
  const parsed = parseIsoDateLocal(dateIso);
  if (!parsed) {
    return dateIso;
  }

  return parsed.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

export function SchedulePage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateIso, setSelectedDateIso] = useState(() => {
    const fromQuery = searchParams.get("date");
    if (parseIsoDateLocal(fromQuery ?? "")) {
      return fromQuery ?? formatIsoDateLocal(new Date());
    }
    return formatIsoDateLocal(new Date());
  });

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const minDateIso = useMemo(() => {
    return formatIsoDateLocal(shiftLocalDays(today, -SCHEDULE_EPISODE_LOOKBACK_DAYS));
  }, [today]);

  const maxDateIso = useMemo(() => formatIsoDateLocal(today), [today]);

  useEffect(() => {
    const parsedDate = parseIsoDateLocal(selectedDateIso);
    if (!parsedDate) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const daySchedule = await scheduleProvider.getDaySchedule(parsedDate);
        setItems([...daySchedule].sort((a, b) => a.startMs - b.startMs));
        setError(null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedDateIso]);

  useEffect(() => {
    setSearchParams({ date: selectedDateIso }, { replace: true });
  }, [selectedDateIso, setSearchParams]);

  useEffect(() => {
    const fromQuery = searchParams.get("date");
    if (!fromQuery || fromQuery === selectedDateIso) {
      return;
    }

    if (parseIsoDateLocal(fromQuery)) {
      setSelectedDateIso(fromQuery);
    }
  }, [searchParams, selectedDateIso]);

  const selectRelativeDay = (offsetDays: number) => {
    const parsed = parseIsoDateLocal(selectedDateIso);
    if (!parsed) {
      return;
    }

    const nextIso = formatIsoDateLocal(shiftLocalDays(parsed, offsetDays));
    if (nextIso < minDateIso || nextIso > maxDateIso) {
      return;
    }

    setSelectedDateIso(nextIso);
  };

  return (
    <div className="container">
      <section className="page-section">
        <h2>Programme schedule</h2>
        <p className="page-section__lede">
          Uses the Streaming Center grid endpoint with automatic local fallback. Open any block for
          a dedicated programme episode page and 14-day archive.
        </p>

        <div className="schedule-controls">
          <button
            type="button"
            className="control-button control-button--small"
            onClick={() => {
              selectRelativeDay(-1);
            }}
            disabled={selectedDateIso <= minDateIso}
          >
            Previous day
          </button>

          <label className="schedule-controls__date">
            <span>Date</span>
            <input
              type="date"
              value={selectedDateIso}
              min={minDateIso}
              max={maxDateIso}
              onChange={(event) => {
                setSelectedDateIso(event.currentTarget.value);
              }}
            />
          </label>

          <button
            type="button"
            className="control-button control-button--small"
            onClick={() => {
              selectRelativeDay(1);
            }}
            disabled={selectedDateIso >= maxDateIso}
          >
            Next day
          </button>

          <button
            type="button"
            className="control-button control-button--small"
            onClick={() => {
              setSelectedDateIso(formatIsoDateLocal(new Date()));
            }}
            disabled={selectedDateIso === formatIsoDateLocal(new Date())}
          >
            Today
          </button>
        </div>

        <p className="status-inline">Showing {formatDateLabel(selectedDateIso)}</p>
        {loading && <p className="status-inline">Loading schedule...</p>}
        {error && <p className="status-inline status-inline--error">{error}</p>}

        <div className="schedule-list">
          {items.map((item) => (
            <article className="schedule-list__item" key={item.id}>
              <div className="schedule-list__times">
                <strong>{formatClock(item.startMs)}</strong>
                <span>to</span>
                <strong>{formatClock(item.endMs)}</strong>
              </div>

              <Link
                to={`/schedule/programme/${selectedDateIso}/${item.startMs}/${item.slug}`}
                className="schedule-list__art-link"
                aria-label={`Open ${item.name} episode page`}
              >
                <img
                  src={item.artworkUrl}
                  alt={`${item.name} artwork`}
                  loading="lazy"
                  className="schedule-list__artwork"
                  onError={(event) => {
                    event.currentTarget.src = "/default-artwork.svg";
                  }}
                />
              </Link>

              <div className="schedule-list__meta">
                <h3>
                  <Link to={`/schedule/programme/${selectedDateIso}/${item.startMs}/${item.slug}`}>
                    {item.name}
                  </Link>
                </h3>
                <p>{item.description}</p>
                <Link
                  to={`/schedule/programme/${selectedDateIso}/${item.startMs}/${item.slug}`}
                  className="schedule-list__episode-link"
                >
                  Open episode page
                </Link>
              </div>
            </article>
          ))}

          {!loading && !items.length && (
            <p className="status-inline">No programme blocks returned for this day.</p>
          )}
        </div>
      </section>
    </div>
  );
}
