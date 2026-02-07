import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SCHEDULE_EPISODE_LOOKBACK_DAYS } from "../config/constants";
import type { Programme } from "../services/scheduleProvider";
import { scheduleProvider } from "../services/scheduleService";
import {
  formatIsoDateLocal,
  parseIsoDateLocal,
  resolveProgrammeSlug,
  shiftLocalDays
} from "../utils/programme";
import { formatClock } from "../utils/time";

interface EpisodeViewState {
  episode: Programme | null;
  archive: Programme[];
}

function formatProgrammeDate(ms: number): string {
  return new Date(ms).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function dedupeProgrammes(items: Programme[]): Programme[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.slug}:${item.startMs}:${item.endMs}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function ProgrammeEpisodePage(): JSX.Element {
  const params = useParams<{ dateIso?: string; startMs?: string; slug?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<EpisodeViewState>({
    episode: null,
    archive: []
  });

  const parsedDate = useMemo(() => parseIsoDateLocal(params.dateIso ?? ""), [params.dateIso]);
  const parsedStartMs = useMemo(() => Number(params.startMs), [params.startMs]);
  const requestedSlug = useMemo(() => resolveProgrammeSlug(params.slug ?? ""), [params.slug]);

  useEffect(() => {
    const load = async () => {
      if (!parsedDate) {
        setError("Invalid episode date in route.");
        setLoading(false);
        return;
      }

      if (!Number.isFinite(parsedStartMs)) {
        setError("Invalid episode timestamp in route.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const days = Array.from({ length: SCHEDULE_EPISODE_LOOKBACK_DAYS + 1 }, (_, index) =>
          shiftLocalDays(parsedDate, -index)
        );

        const results = await Promise.all(
          days.map(async (day) => {
            try {
              return await scheduleProvider.getDaySchedule(day);
            } catch {
              return [] as Programme[];
            }
          })
        );

        const selectedDayItems = results[0] ?? [];
        const allItems = dedupeProgrammes(results.flat()).sort((a, b) => b.startMs - a.startMs);

        const matchedEpisode =
          selectedDayItems.find((item) => item.startMs === parsedStartMs && item.slug === requestedSlug) ??
          selectedDayItems.find((item) => item.startMs === parsedStartMs) ??
          allItems.find((item) => item.startMs === parsedStartMs && item.slug === requestedSlug) ??
          null;

        if (!matchedEpisode) {
          setState({ episode: null, archive: [] });
          setError("Episode not found for that date/timeslot.");
          setLoading(false);
          return;
        }

        const archive = allItems.filter((item) => item.slug === matchedEpisode.slug);

        setState({
          episode: matchedEpisode,
          archive
        });
        setError(null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load episode page.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [parsedDate, parsedStartMs, requestedSlug]);

  const selectedDateIso = parsedDate ? formatIsoDateLocal(parsedDate) : formatIsoDateLocal(new Date());

  return (
    <div className="container">
      <section className="page-section programme-episode">
        <div className="programme-episode__top">
          <Link to={`/schedule?date=${selectedDateIso}`} className="programme-episode__back">
            Back to schedule
          </Link>
        </div>

        {loading && <p className="status-inline">Loading programme episode...</p>}
        {error && <p className="status-inline status-inline--error">{error}</p>}

        {!loading && state.episode && (
          <>
            <article className="programme-episode__hero">
              <img
                src={state.episode.artworkUrl}
                alt={`${state.episode.name} artwork`}
                className="programme-episode__artwork"
                onError={(event) => {
                  event.currentTarget.src = "/default-artwork.svg";
                }}
              />

              <div className="programme-episode__meta">
                <p className="programme-episode__kicker">Programme episode</p>
                <h2>{state.episode.name}</h2>
                <p>{state.episode.description}</p>
                <div className="programme-episode__facts">
                  <p>
                    <strong>Date:</strong> {formatProgrammeDate(state.episode.startMs)}
                  </p>
                  <p>
                    <strong>Time:</strong> {formatClock(state.episode.startMs)} to{" "}
                    {formatClock(state.episode.endMs)}
                  </p>
                  {state.episode.timezone && (
                    <p>
                      <strong>Timezone:</strong> {state.episode.timezone}
                    </p>
                  )}
                  <p>
                    <strong>Requests:</strong> {state.episode.requestsEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </article>

            <section className="programme-episode__archive">
              <div className="section-heading">
                <h3>Recent episodes</h3>
              </div>
              <p className="page-section__lede">
                Unique blocks for {state.episode.name} across the last{" "}
                {SCHEDULE_EPISODE_LOOKBACK_DAYS} days.
              </p>

              <div className="programme-episode-list">
                {state.archive.map((item) => {
                  const itemDateIso = formatIsoDateLocal(new Date(item.startMs));
                  return (
                    <article
                      className="programme-episode-list__item"
                      key={`${item.slug}-${item.startMs}-${item.endMs}`}
                    >
                      <div>
                        <h4>{formatProgrammeDate(item.startMs)}</h4>
                        <p>
                          {formatClock(item.startMs)} to {formatClock(item.endMs)}
                        </p>
                      </div>
                      <Link to={`/schedule/programme/${itemDateIso}/${item.startMs}/${item.slug}`}>
                        Open episode
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </section>
    </div>
  );
}
