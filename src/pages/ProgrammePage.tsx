import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_ARTWORK_URL, SCHEDULE_EPISODE_LOOKBACK_DAYS } from "../config/constants";
import { scheduleProvider } from "../services/scheduleService";
import type { Programme } from "../services/scheduleProvider";
import {
  getProgrammeCatalogEntry,
  getProgrammeLongDescriptionBySlug,
  getProgrammeNameBySlug
} from "../services/programmeCatalog";
import { formatIsoDateLocal, shiftLocalDays, resolveProgrammeSlug } from "../utils/programme";
import { formatClock } from "../utils/time";
import { getProgrammeArtworkUrl } from "../utils/programme";

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

function formatProgrammeDate(ms: number): string {
  return new Date(ms).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
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

export function ProgrammePage(): JSX.Element {
  const params = useParams<{ slug?: string }>();
  const slug = useMemo(() => resolveProgrammeSlug(params.slug ?? ""), [params.slug]);
  const catalogEntry = useMemo(() => getProgrammeCatalogEntry(slug), [slug]);
  const [episodes, setEpisodes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!slug) {
      setError("Invalid program slug.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = Array.from({ length: SCHEDULE_EPISODE_LOOKBACK_DAYS + 1 }, (_, index) =>
          shiftLocalDays(today, -index)
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

        const matching = dedupeProgrammes(results.flat())
          .filter((item) => item.slug === slug)
          .sort((a, b) => b.startMs - a.startMs);

        setEpisodes(matching);
        setError(null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load program page.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug]);

  const programmeName =
    catalogEntry?.name ?? episodes[0]?.name ?? getProgrammeNameBySlug(slug, "Program");
  const artworkUrl = getProgrammeArtworkUrl(programmeName);
  const longDescription = getProgrammeLongDescriptionBySlug(
    slug,
    "Program details are currently unavailable."
  );
  const nowMs = Date.now();
  const hasOnAirEpisode = useMemo(
    () => episodes.some((episode) => nowMs >= episode.startMs && nowMs < episode.endMs),
    [episodes, nowMs]
  );

  useEffect(() => {
    if (!hasOnAirEpisode) {
      return;
    }

    const timer = window.setInterval(() => {
      forceTick((tick) => tick + 1);
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasOnAirEpisode]);

  return (
    <div className="container">
      <section className="page-section programme-page">
        <div className="programme-page__top">
          <Link to="/schedule" className="programme-episode__back control-pill">
            Back to Schedule
          </Link>
        </div>

        <article className="programme-page__hero">
          <img
            src={artworkUrl}
            alt={`${programmeName} artwork`}
            className="programme-page__artwork"
            onError={(event) => {
              event.currentTarget.src = DEFAULT_ARTWORK_URL;
            }}
          />

          <div className="programme-page__meta">
            <p className="programme-episode__kicker">Program</p>
            <h2>{programmeName}</h2>
            <p>{longDescription}</p>
            <p className="status-inline">
              Episodes from the past {SCHEDULE_EPISODE_LOOKBACK_DAYS} days are shown below.
            </p>
          </div>
        </article>

        {loading && <p className="status-inline">Loading program episodes...</p>}
        {error && <p className="status-inline status-inline--error">{error}</p>}

        {!loading && !error && (
          <section className="programme-page__episodes">
            <div className="section-heading">
              <h3>Recent Episodes</h3>
            </div>

            <div className="programme-episode-list">
              {episodes.map((episode) => {
                const dateIso = formatIsoDateLocal(new Date(episode.startMs));
                const isCurrent = nowMs >= episode.startMs && nowMs < episode.endMs;
                const progress = isCurrent
                  ? computeProgress(episode.startMs, episode.endMs, nowMs)
                  : { progressPercent: 0, remainingMs: 0 };
                return (
                  <article
                    className={`programme-episode-list__item ${
                      isCurrent ? "programme-episode-list__item--current" : ""
                    }`}
                    key={`${episode.slug}-${episode.startMs}-${episode.endMs}`}
                  >
                    <div>
                      {isCurrent && <p className="schedule-list__live-tag">On air now</p>}
                      <h4>{formatProgrammeDate(episode.startMs)}</h4>
                      <p>
                        {formatClock(episode.startMs)} to {formatClock(episode.endMs)}
                      </p>
                      {isCurrent && (
                        <>
                          <div
                            className="programme-progress schedule-list__progress"
                            role="progressbar"
                            aria-label="Current program progress"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress.progressPercent}
                          >
                            <span style={{ width: `${progress.progressPercent.toFixed(2)}%` }} />
                          </div>
                          <p className="schedule-list__remaining">{formatEndsIn(progress.remainingMs)}</p>
                        </>
                      )}
                    </div>
                    <Link
                      to={`/schedule/programme/${dateIso}/${episode.startMs}/${episode.slug}`}
                      state={{ episode }}
                      className="control-pill control-pill--small"
                    >
                      Open Episode
                    </Link>
                  </article>
                );
              })}

              {!episodes.length && (
                <p className="status-inline">No recent program blocks were returned for this show.</p>
              )}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
