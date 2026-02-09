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
    return `Today — ${absoluteLabel}`;
  }

  if (isSameLocalDay(parsed, yesterday)) {
    return `Yesterday — ${absoluteLabel}`;
  }

  return absoluteLabel;
}

function formatDuration(startMs: number, endMs: number): string {
  const durationMs = Math.max(0, endMs - startMs);
  const totalMinutes = Math.round(durationMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

function formatEndsIn(remainingMs: number): string {
  if (remainingMs <= 0) {
    return "Ends now";
  }

  const totalMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "min" : "mins"}`);
  }

  if (!parts.length) {
    parts.push("1 min");
  }

  return `Ends in ${parts.join(" ")}`;
}

function computeProgress(startMs: number, endMs: number, nowMs: number): { progressPercent: number; remainingMs: number } {
  const duration = endMs - startMs;
  if (duration <= 0) {
    return { progressPercent: 0, remainingMs: 0 };
  }

  const elapsed = Math.max(0, Math.min(duration, nowMs - startMs));
  const remainingMs = Math.max(0, endMs - nowMs);
  const progressPercent = (elapsed / duration) * 100;

  return { progressPercent, remainingMs };
}

export function SchedulePage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, forceTick] = useState(0);

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

  const isTodaySelected = selectedDateIso === todayIso;

  useEffect(() => {
    if (!isTodaySelected) {
      return;
    }

    const timer = window.setInterval(() => {
      forceTick((tick) => tick + 1);
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isTodaySelected]);

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

  const currentProgrammeId = useMemo(() => {
    if (!isTodaySelected) {
      return null;
    }

    const nowMs = Date.now();
    const current = items.find((item) => nowMs >= item.startMs && nowMs < item.endMs);
    return current?.id ?? null;
  }, [items, isTodaySelected]);

  const orderedItems = useMemo(() => {
    if (!currentProgrammeId) {
      return items;
    }

    const current = items.find((item) => item.id === currentProgrammeId);
    if (!current) {
      return items;
    }

    return [current, ...items.filter((item) => item.id !== currentProgrammeId)];
  }, [items, currentProgrammeId]);

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
        <h2>Program Schedule</h2>
        <p className="page-section__lede">
          Browse each day, open full episode pages, and jump into dedicated program pages.
        </p>

        <div className="schedule-controls">
          <button
            type="button"
            className="control-pill control-pill--small"
            onClick={() => {
              selectRelativeDay(-1);
            }}
            disabled={selectedDateIso <= minDateIso}
          >
            Previous Day
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
            className="control-pill control-pill--small"
            onClick={() => {
              selectRelativeDay(1);
            }}
            disabled={selectedDateIso >= maxDateIso}
          >
            Next Day
          </button>

          <button
            type="button"
            className="control-pill control-pill--small"
            onClick={() => {
              updateSelectedDate(todayIso);
            }}
            disabled={selectedDateIso === todayIso}
          >
            Today
          </button>
        </div>

        <p className="status-inline">Showing {formatDateLabel(selectedDateIso, todayStart)}</p>
        {currentProgrammeId && (
          <p className="status-inline">The current program is pinned to the top.</p>
        )}
        {loading && <p className="status-inline">Loading schedule...</p>}
        {error && <p className="status-inline status-inline--error">{error}</p>}

        <div className="schedule-list">
          {orderedItems.map((item) => {
            const episodePath = `/schedule/programme/${selectedDateIso}/${item.startMs}/${item.slug}`;
            const programmePath = `/schedule/programmes/${item.slug}`;
            const isCurrent = item.id === currentProgrammeId;
            const { progressPercent, remainingMs } = isCurrent
              ? computeProgress(item.startMs, item.endMs, Date.now())
              : { progressPercent: 0, remainingMs: 0 };

            return (
              <article
                className={`schedule-list__item ${isCurrent ? "schedule-list__item--current" : ""}`}
                key={item.id}
              >
                <div className="schedule-list__times">
                  {isCurrent && <p className="schedule-list__live-tag">On air now</p>}
                  <p className="schedule-list__time-range">
                    {formatClock(item.startMs)} to {formatClock(item.endMs)}
                  </p>
                  <p className="schedule-list__duration">{formatDuration(item.startMs, item.endMs)}</p>
                  {isCurrent && (
                    <>
                      <div
                        className="programme-progress schedule-list__progress"
                        role="progressbar"
                        aria-label="Current program progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progressPercent}
                      >
                        <span style={{ width: `${progressPercent.toFixed(2)}%` }} />
                      </div>
                      <p className="schedule-list__remaining">{formatEndsIn(remainingMs)}</p>
                    </>
                  )}
                </div>

                <Link
                  to={episodePath}
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
                    <Link to={programmePath}>{item.name}</Link>
                  </h3>
                  <p>{item.description}</p>
                  <div className="schedule-list__actions">
                    <Link to={episodePath} state={{ episode: item }} className="control-pill control-pill--small">
                      View Episode
                    </Link>
                    <Link to={programmePath} className="schedule-list__programme-link">
                      Program Page
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

          {!loading && !orderedItems.length && (
            <p className="status-inline">No program blocks returned for this day.</p>
          )}
        </div>
      </section>
    </div>
  );
}
