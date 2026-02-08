import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { DEFAULT_ARTWORK_URL, SCHEDULE_EPISODE_LOOKBACK_DAYS } from "../config/constants";
import { PlayIcon } from "../components/ui/Icons";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { fetchEpisodeArchiveTracks } from "../services/episodeArchiveService";
import { fetchHistoryForWindow } from "../services/historyService";
import { fetchApplePreviewUrl } from "../services/previewService";
import type { Programme } from "../services/scheduleProvider";
import { scheduleProvider } from "../services/scheduleService";
import { getProgrammeLongDescriptionBySlug } from "../services/programmeCatalog";
import type { Track } from "../types";
import { formatIsoDateLocal, parseIsoDateLocal, resolveProgrammeSlug, shiftLocalDays } from "../utils/programme";
import { formatClock } from "../utils/time";

interface EpisodeViewState {
  episode: Programme | null;
  archive: Programme[];
  tracks: Track[];
}

interface EpisodeRouteState {
  episode?: Programme;
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

function formatMinutesAgo(trackStartMs: number): string {
  const deltaMs = Date.now() - trackStartMs;
  if (deltaMs <= 60 * 1000) {
    return "Just now";
  }

  const minutes = Math.max(1, Math.floor(deltaMs / (60 * 1000)));
  return `${minutes} min ago`;
}

export function ProgrammeEpisodePage(): JSX.Element {
  const { isPlaying, pause } = useAudioPlayer();
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | undefined>();
  const params = useParams<{ dateIso?: string; startMs?: string; slug?: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [state, setState] = useState<EpisodeViewState>({
    episode: null,
    archive: [],
    tracks: []
  });
  const [previewCache, setPreviewCache] = useState<Record<string, string | null>>({});
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);
  const [previewLoadingKey, setPreviewLoadingKey] = useState<string | null>(null);

  const parsedDate = useMemo(() => parseIsoDateLocal(params.dateIso ?? ""), [params.dateIso]);
  const parsedStartMs = useMemo(() => Number(params.startMs), [params.startMs]);
  const requestedSlug = useMemo(() => resolveProgrammeSlug(params.slug ?? ""), [params.slug]);
  const routeState = (location.state as EpisodeRouteState | null) ?? null;

  const initialEpisodeFromState = useMemo(() => {
    if (!routeState?.episode) {
      return null;
    }

    const stateEpisode = routeState.episode;
    if (!Number.isFinite(parsedStartMs)) {
      return stateEpisode;
    }

    return stateEpisode.startMs === parsedStartMs ? stateEpisode : null;
  }, [routeState, parsedStartMs]);

  const isCurrentEpisode = useMemo(() => {
    if (!state.episode) {
      return false;
    }

    const now = Date.now();
    return state.episode.startMs <= now && now < state.episode.endMs;
  }, [state.episode]);

  const isFutureEpisode = useMemo(() => {
    if (!state.episode) {
      return false;
    }
    return Date.now() < state.episode.startMs;
  }, [state.episode]);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
    };
  }, []);

  const getPreviewKey = (track: Track): string => `${track.key}-${track.startMs}`;

  const stopPreview = () => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }

    previewAudioRef.current?.pause();
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewingKey(null);
  };

  const startPreview = async (track: Track) => {
    const trackKey = getPreviewKey(track);
    stopPreview();
    if (isPlaying) {
      pause();
    }

    const cached = previewCache[trackKey];
    if (cached === undefined) {
      setPreviewLoadingKey(trackKey);
      const previewUrl = await fetchApplePreviewUrl(track.artist, track.title);
      setPreviewCache((previous) => ({
        ...previous,
        [trackKey]: previewUrl
      }));
      setPreviewLoadingKey(null);

      if (!previewUrl) {
        return;
      }

      const audio = new Audio(previewUrl);
      previewAudioRef.current = audio;
      setPreviewingKey(trackKey);
      void audio.play();
      previewTimeoutRef.current = window.setTimeout(() => {
        stopPreview();
      }, 15000);
      return;
    }

    if (!cached) {
      return;
    }

    const audio = new Audio(cached);
    previewAudioRef.current = audio;
    setPreviewingKey(trackKey);
    void audio.play();
    previewTimeoutRef.current = window.setTimeout(() => {
      stopPreview();
    }, 15000);
  };

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
      setHistoryError(null);
      try {
        let matchedEpisode = initialEpisodeFromState;
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

        if (!matchedEpisode) {
          matchedEpisode =
            selectedDayItems.find((item) => item.startMs === parsedStartMs && item.slug === requestedSlug) ??
            selectedDayItems.find((item) => item.startMs === parsedStartMs) ??
            allItems.find((item) => item.startMs === parsedStartMs && item.slug === requestedSlug) ??
            allItems.find((item) => item.startMs === parsedStartMs) ??
            null;
        }

        if (!matchedEpisode) {
          setState({ episode: null, archive: [], tracks: [] });
          setError("Episode not found for that date/timeslot.");
          setLoading(false);
          return;
        }

        const archive = allItems
          .filter((item) => item.slug === matchedEpisode.slug)
          .sort((a, b) => b.startMs - a.startMs);

        let tracks: Track[] = [];

        try {
          const archivedTracks = await fetchEpisodeArchiveTracks(
            formatIsoDateLocal(new Date(matchedEpisode.startMs)),
            matchedEpisode.startMs,
            matchedEpisode.slug
          );
          tracks =
            archivedTracks !== null
              ? archivedTracks
              : await fetchHistoryForWindow(matchedEpisode.startMs, matchedEpisode.endMs);
        } catch (historyRequestError) {
          setHistoryError(
            historyRequestError instanceof Error
              ? historyRequestError.message
              : "Unable to load track history for this program block right now."
          );
        }

        setState({
          episode: matchedEpisode,
          archive,
          tracks
        });
        setError(null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load episode page.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [parsedDate, parsedStartMs, requestedSlug, initialEpisodeFromState]);

  const selectedDateIso = parsedDate ? formatIsoDateLocal(parsedDate) : formatIsoDateLocal(new Date());

  const programmePath = state.episode ? `/schedule/programmes/${state.episode.slug}` : "/schedule";
  const recentEpisodes = state.episode
    ? state.archive.filter((item) => item.startMs !== state.episode?.startMs).slice(0, 8)
    : [];

  return (
    <div className="container">
      <section className="page-section programme-episode">
        <div className="programme-episode__top">
          <Link to={`/schedule?date=${selectedDateIso}`} className="programme-episode__back control-pill">
            Back to Schedule
          </Link>
          <Link to={programmePath} className="programme-episode__back control-pill">
            Program Page
          </Link>
        </div>

        {loading && <p className="status-inline">Loading program episode...</p>}
        {error && <p className="status-inline status-inline--error">{error}</p>}

        {!loading && state.episode && (
          <>
            <article className="programme-episode__hero">
              <img
                src={state.episode.artworkUrl}
                alt={`${state.episode.name} artwork`}
                className="programme-episode__artwork"
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_ARTWORK_URL;
                }}
              />

              <div className="programme-episode__meta">
                <p className="programme-episode__kicker">Program Episode</p>
                <h2>{state.episode.name}</h2>
                <p>{getProgrammeLongDescriptionBySlug(state.episode.slug, state.episode.description)}</p>
                <div className="programme-episode__facts">
                  <p>
                    <strong>Date:</strong> {formatProgrammeDate(state.episode.startMs)}
                  </p>
                  <p>
                    <strong>Time:</strong> {formatClock(state.episode.startMs)} to {formatClock(state.episode.endMs)}
                  </p>
                </div>
              </div>
            </article>

            <section className="programme-episode__history">
              <div className="section-heading">
                <h3>Tracks Played</h3>
              </div>
              {historyError && <p className="status-inline status-inline--error">{historyError}</p>}

              <div className="recent-list">
                {state.tracks.map((track) => {
                  const timeLabel = isCurrentEpisode ? formatMinutesAgo(track.startMs) : null;
                  const trackKey = getPreviewKey(track);
                  return (
                    <article className="recent-list__item" key={`${track.key}-${track.startMs}`}>
                      <button
                        type="button"
                        className="control-pill control-pill--small recent-list__preview"
                        disabled={previewLoadingKey === trackKey}
                        onClick={() => {
                          if (previewingKey === trackKey) {
                            stopPreview();
                            return;
                          }
                          void startPreview(track);
                        }}
                      >
                        <PlayIcon />
                        <span>
                          {previewingKey === trackKey
                            ? "Stop"
                            : previewLoadingKey === trackKey
                              ? "Loading..."
                              : "Preview"}
                        </span>
                      </button>
                      <img
                        src={track.artworkUrl}
                        alt={`${track.title} artwork`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = DEFAULT_ARTWORK_URL;
                        }}
                      />
                      <div>
                        <h4>{track.title}</h4>
                        <p>{track.artist}</p>
                        {timeLabel && <p className="recent-list__time">{timeLabel}</p>}
                      </div>
                    </article>
                  );
                })}

                {!state.tracks.length && (
                  <p className="status-inline">
                    {isFutureEpisode
                      ? "Track information will be available once this episode starts to air."
                      : "No track history is available for this episode yet."}
                  </p>
                )}
              </div>
            </section>

            <section className="programme-episode__archive">
              <div className="section-heading">
                <h3>Recent Episodes</h3>
                <Link to={programmePath} className="control-pill control-pill--small">
                  View All
                </Link>
              </div>

              <div className="programme-episode-list">
                {recentEpisodes.map((item) => {
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
                      <Link
                        to={`/schedule/programme/${itemDateIso}/${item.startMs}/${item.slug}`}
                        state={{ episode: item }}
                        className="control-pill control-pill--small"
                      >
                        Open Episode
                      </Link>
                    </article>
                  );
                })}

                {!recentEpisodes.length && (
                  <p className="status-inline">No other recent episodes were found for this program.</p>
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </div>
  );
}
