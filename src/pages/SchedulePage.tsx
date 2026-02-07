import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DEFAULT_ARTWORK_URL, SCHEDULE_EPISODE_LOOKBACK_DAYS } from "../config/constants";
import type { Programme } from "../services/scheduleProvider";
import { scheduleProvider } from "../services/scheduleService";
import { formatClock } from "../utils/time";
import { formatIsoDateLocal, parseIsoDateLocal, shiftLocalDays } from "../utils/programme";

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatAbsoluteDateLabel(date: Date): string {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateLabel(dateIso: string, todayStart: Date): string {
  const parsed = parseIsoDateLocal(dateIso);
  if (!parsed) {
    return dateIso;
  }

  const yesterday = shiftLocalDays(todayStart, -1);
  const absoluteLabel = formatAbsoluteDateLabel(parsed);

  if (isSameLocalDay(parsed, todayStart)) {
    return `Today (${absoluteLabel})`;
  }

  if (isSameLocalDay(parsed, yesterday)) {
    return `Yesterday (${absoluteLabel})`;
  }

  return absoluteLabel;
}

export function SchedulePage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStart = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);
  const todayIso = useMemo(() => formatIsoDateLocal(todayStart), [todayStart]);

  const minDateIso = useMemo(() => {
    return formatIsoDateLocal(shiftLocalDays(todayStart, -SCHEDULE_EPISODE_LOOKBACK_DAYS));
  }, [todayStart]);

  const maxDateIso = useMemo(() => todayIso, [todayIso]);

  const selectedDateIso = useMemo(() => {
    const fromQuery = searchParams.get("date") ?? todayIso;
    if (!parseIsoDateLocal(fromQuery)) {
      return todayIso;
    }

    if (fromQuery < minDateIso) {
      return minDateIso;
    }

    if (fromQuery > maxDateIso) {
      return maxDateIso;
    }

    return fromQuery;
  }, [searchParams, todayIso, minDateIso, maxDateIso]);

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

  const updateSelectedDate = (nextDateIso: string) => {
    if (!parseIsoDateLocal(nextDateIso)) {
      return;
    }

    if (nextDateIso < minDateIso || nextDateIso > maxDateIso) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    if (nextDateIso === todayIso) {
      nextParams.delete("date");
    } else {
      nextParams.set("date", nextDateIso);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const selectRelativeDay = (offsetDays: number) => {
    const parsed = parseIsoDateLocal(selectedDateIso);
    if (!parsed) {
      return;
    }

    const nextIso = formatIsoDateLocal(shiftLocalDays(parsed, offsetDays));
    if (nextIso < minDateIso || nextIso > maxDateIso) {
      return;
    }

    updateSelectedDate(nextIso);
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
                updateSelectedDate(event.currentTarget.value);
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
              updateSelectedDate(todayIso);
            }}
            disabled={selectedDateIso === todayIso}
          >
            Today
          </button>
        </div>

        <p className="status-inline">Showing {formatDateLabel(selectedDateIso, todayStart)}</p>
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
                state={{ episode: item }}
                className="schedule-list__art-link"
                aria-label={`Open ${item.name} episode page`}
              >
                <img
                  src={item.artworkUrl}
                  alt={`${item.name} artwork`}
                  loading="lazy"
                  className="schedule-list__artwork"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_ARTWORK_URL;
                  }}
                />
              </Link>

              <div className="schedule-list__meta">
                <h3>
                  <Link
                    to={`/schedule/programme/${selectedDateIso}/${item.startMs}/${item.slug}`}
                    state={{ episode: item }}
                  >
                    {item.name}
                  </Link>
                </h3>
                <p>{item.description}</p>
                <Link
                  to={`/schedule/programme/${selectedDateIso}/${item.startMs}/${item.slug}`}
                  state={{ episode: item }}
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
