import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  DEFAULT_ARTWORK_URL,
  EPISODE_LIVE_REFRESH_MS,
  SCHEDULE_EPISODE_LOOKBACK_DAYS
} from "../config/constants";
import { PlayIcon } from "../components/ui/Icons";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { fetchEpisodeArchiveTracks } from "../services/episodeArchiveService";
import { fetchHistoryForWindow } from "../services/historyService";
import { emitStopPreviews, onStopPreviews } from "../services/previewBus";
import { fetchApplePreviewUrl } from "../services/previewService";
import { exportEpisodePlaylistToAppleMusic, isAppleMusicConfigured } from "../services/appleMusicService";
import type { Programme } from "../services/scheduleProvider";
import { scheduleProvider } from "../services/scheduleService";
import { beginSpotifyLogin, getValidSpotifyAccessToken, isSpotifyConfigured } from "../services/spotifyAuthService";
import { getProgrammeLongDescriptionBySlug } from "../services/programmeCatalog";
import { exportEpisodePlaylistToSpotify, type SpotifyPlaylistExportResult } from "../services/spotifyPlaylistService";
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

function isEpisodeOnAir(episode: Programme): boolean {
  const now = Date.now();
  return episode.startMs <= now && now < episode.endMs;
}

function formatEpisodePlaylistDate(ms: number): string {
  return new Date(ms).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function buildEpisodePlaylistTitle(episode: Programme): string {
  return `Hits 93 Toronto's ${episode.name} Episode on ${formatEpisodePlaylistDate(episode.startMs)}`;
}

function formatMinutesAgo(trackStartMs: number): string {
  const deltaMs = Date.now() - trackStartMs;
  if (deltaMs <= 60 * 1000) {
    return "Just now";
  }

  const minutes = Math.max(1, Math.floor(deltaMs / (60 * 1000)));
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    if (hours <= 1) {
      return "Over an hour ago";
    }
    return `Over ${hours} hours ago`;
  }

  return `${minutes} min ago`;
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

export function ProgrammeEpisodePage(): JSX.Element {
  const { pause } = useAudioPlayer();
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | undefined>();
  const previewRequestIdRef = useRef(0);
  const params = useParams<{ dateIso?: string; startMs?: string; slug?: string }>();
  const location = useLocation();
  const [, forceClockTick] = useState(0);
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
  const [spotifyExporting, setSpotifyExporting] = useState(false);
  const [spotifyExportError, setSpotifyExportError] = useState<string | null>(null);
  const [spotifyExportResult, setSpotifyExportResult] = useState<SpotifyPlaylistExportResult | null>(null);
  const [appleExporting, setAppleExporting] = useState(false);
  const [appleExportError, setAppleExportError] = useState<string | null>(null);
  const [appleExportResult, setAppleExportResult] = useState<{
    playlistId: string;
    matchedTracks: number;
    totalTracks: number;
  } | null>(null);

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

  useEffect(() => {
    const episode = state.episode;
    if (!episode) {
      return;
    }

    const now = Date.now();
    const nextBoundaryMs = now < episode.startMs ? episode.startMs : now < episode.endMs ? episode.endMs : null;

    if (!nextBoundaryMs) {
      return;
    }

    const delay = Math.max(250, nextBoundaryMs - now + 250);
    const timeoutId = window.setTimeout(() => {
      forceClockTick((tick) => tick + 1);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.episode?.startMs, state.episode?.endMs]);

  const now = Date.now();
  const isCurrentEpisode = Boolean(state.episode && state.episode.startMs <= now && now < state.episode.endMs);
  const isFutureEpisode = Boolean(state.episode && now < state.episode.startMs);
  const episodeProgress = state.episode
    ? computeProgress(state.episode.startMs, state.episode.endMs, now)
    : { progressPercent: 0, remainingMs: 0 };

  useEffect(() => {
    return () => {
      previewRequestIdRef.current += 1;
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
    };
  }, []);

  const getPreviewKey = (track: Track): string => `${track.key}-${track.startMs}`;

  const stopPreview = useCallback(() => {
    previewRequestIdRef.current += 1;
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }

    previewAudioRef.current?.pause();
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewingKey(null);
  }, []);

  const startPreview = async (track: Track) => {
    emitStopPreviews();
    const trackKey = getPreviewKey(track);
    stopPreview();
    pause();
    const requestId = ++previewRequestIdRef.current;

    const cached = previewCache[trackKey];
    if (cached === undefined) {
      setPreviewLoadingKey(trackKey);
      const previewUrl = await fetchApplePreviewUrl(track.artist, track.title);
      setPreviewCache((previous) => ({
        ...previous,
        [trackKey]: previewUrl
      }));
      setPreviewLoadingKey(null);

      if (previewRequestIdRef.current !== requestId) {
        return;
      }

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

    if (previewRequestIdRef.current !== requestId) {
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
    return onStopPreviews(() => {
      stopPreview();
    });
  }, [stopPreview]);

  const exportToSpotify = async () => {
    if (!state.episode) {
      return;
    }

    if (isEpisodeOnAir(state.episode)) {
      setSpotifyExportError("Available after the broadcast ends.");
      return;
    }

    setSpotifyExportError(null);
    setSpotifyExportResult(null);
    setSpotifyExporting(true);

    try {
      if (!isSpotifyConfigured()) {
        throw new Error("Spotify export is not configured yet.");
      }

      const accessToken = await getValidSpotifyAccessToken();
      if (!accessToken) {
        const returnTo = `${location.pathname}${location.search}`;
        await beginSpotifyLogin(returnTo || "/");
        return;
      }

      const playlistName = buildEpisodePlaylistTitle(state.episode);
      const description = `Tracks played on Hits 93 Toronto during ${state.episode.name} (${formatEpisodePlaylistDate(
        state.episode.startMs
      )}).`;

      const result = await exportEpisodePlaylistToSpotify(accessToken, playlistName, description, state.tracks);
      setSpotifyExportResult(result);

      if (result.playlistUrl) {
        window.open(result.playlistUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setSpotifyExportError(
        error instanceof Error ? error.message : "Unable to export this episode to Spotify right now."
      );
    } finally {
      setSpotifyExporting(false);
    }
  };

  const exportToAppleMusic = async () => {
    if (!state.episode) {
      return;
    }

    if (isEpisodeOnAir(state.episode)) {
      setAppleExportError("Available after the broadcast ends.");
      return;
    }

    setAppleExportError(null);
    setAppleExportResult(null);
    setAppleExporting(true);

    try {
      if (!isAppleMusicConfigured()) {
        throw new Error("Apple Music export is not configured yet.");
      }

      const playlistName = buildEpisodePlaylistTitle(state.episode);
      const description = `Tracks played on Hits 93 Toronto during ${state.episode.name} (${formatEpisodePlaylistDate(
        state.episode.startMs
      )}).`;

      const result = await exportEpisodePlaylistToAppleMusic(playlistName, description, state.tracks);
      setAppleExportResult(result);
    } catch (error) {
      setAppleExportError(
        error instanceof Error ? error.message : "Unable to export this episode to Apple Music right now."
      );
    } finally {
      setAppleExporting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let refreshIntervalId: number | undefined;

    const clearRefresh = () => {
      if (refreshIntervalId) {
        window.clearInterval(refreshIntervalId);
        refreshIntervalId = undefined;
      }
    };

    const loadTracks = async (episode: Programme): Promise<void> => {
      try {
        let tracks: Track[] = [];
        if (isEpisodeOnAir(episode)) {
          tracks = await fetchHistoryForWindow(episode.startMs, episode.endMs);
        } else {
          const archivedTracks = await fetchEpisodeArchiveTracks(
            formatIsoDateLocal(new Date(episode.startMs)),
            episode.startMs,
            episode.slug
          );
          tracks =
            archivedTracks && archivedTracks.length > 0
              ? archivedTracks
              : await fetchHistoryForWindow(episode.startMs, episode.endMs);
        }

        if (cancelled) {
          return;
        }

        setState((previous) => {
          if (
            !previous.episode ||
            previous.episode.startMs !== episode.startMs ||
            previous.episode.slug !== episode.slug
          ) {
            return previous;
          }

          return {
            ...previous,
            tracks
          };
        });
        setHistoryError(null);
      } catch (historyRequestError) {
        if (cancelled) {
          return;
        }

        setHistoryError(
          historyRequestError instanceof Error
            ? historyRequestError.message
            : "Unable to load track history for this program block right now."
        );
      }
    };

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

        if (cancelled) {
          return;
        }

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
          return;
        }

        const archive = allItems
          .filter((item) => item.slug === matchedEpisode.slug)
          .sort((a, b) => b.startMs - a.startMs);

        setState({
          episode: matchedEpisode,
          archive,
          tracks: []
        });
        setError(null);
        await loadTracks(matchedEpisode);

        if (cancelled) {
          return;
        }

        if (isEpisodeOnAir(matchedEpisode)) {
          refreshIntervalId = window.setInterval(() => {
            if (!isEpisodeOnAir(matchedEpisode)) {
              clearRefresh();
              return;
            }

            void loadTracks(matchedEpisode);
          }, EPISODE_LIVE_REFRESH_MS);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load episode page.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      clearRefresh();
    };
  }, [parsedDate, parsedStartMs, requestedSlug, initialEpisodeFromState]);

  const selectedDateIso = parsedDate ? formatIsoDateLocal(parsedDate) : formatIsoDateLocal(new Date());

  const programmePath = state.episode ? `/schedule/programmes/${state.episode.slug}` : "/schedule";
  const recentEpisodes = state.episode
    ? state.archive.filter((item) => item.startMs !== state.episode?.startMs).slice(0, 8)
    : [];

  const spotifyDisabled =
    spotifyExporting || !state.tracks.length || !isSpotifyConfigured() || Boolean(state.episode && isEpisodeOnAir(state.episode));
  const spotifyDisabledReason = !isSpotifyConfigured()
    ? "Spotify export requires a configured SPOTIFY_CLIENT_ID."
    : !state.tracks.length
      ? "No tracks are available for this episode yet."
      : state.episode && isEpisodeOnAir(state.episode)
        ? "Available after the broadcast ends."
        : undefined;

  const appleDisabled =
    appleExporting || !state.tracks.length || !isAppleMusicConfigured() || Boolean(state.episode && isEpisodeOnAir(state.episode));
  const appleDisabledReason = !isAppleMusicConfigured()
    ? "Apple Music export requires a configured developer-token endpoint."
    : !state.tracks.length
      ? "No tracks are available for this episode yet."
      : state.episode && isEpisodeOnAir(state.episode)
        ? "Available after the broadcast ends."
        : undefined;

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
                {isCurrentEpisode && (
                  <div className="programme-episode__progress">
                    <div
                      className="programme-progress"
                      role="progressbar"
                      aria-label="Current program progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={episodeProgress.progressPercent}
                    >
                      <span style={{ width: `${episodeProgress.progressPercent.toFixed(2)}%` }} />
                    </div>
                    <p className="programme-episode__remaining">{formatEndsIn(episodeProgress.remainingMs)}</p>
                  </div>
                )}
              </div>
            </article>

            <section className="programme-episode__history">
              <div className="section-heading">
                <h3>Tracks Played</h3>
                <div className="section-heading__actions">
                  <span className="section-heading__tooltip" title={spotifyDisabledReason}>
                    <button
                      type="button"
                      className="control-pill control-pill--small"
                      disabled={spotifyDisabled}
                      onClick={() => {
                        void exportToSpotify();
                      }}
                    >
                      {spotifyExporting ? "Exporting..." : "Add to Spotify"}
                    </button>
                  </span>
                  <span className="section-heading__tooltip" title={appleDisabledReason}>
                    <button
                      type="button"
                      className="control-pill control-pill--small"
                      disabled={appleDisabled}
                      onClick={() => {
                        void exportToAppleMusic();
                      }}
                    >
                      {appleExporting ? "Exporting..." : "Add to Apple Music"}
                    </button>
                  </span>
                </div>
              </div>
              {historyError && <p className="status-inline status-inline--error">{historyError}</p>}
              {spotifyExportError && (
                <p className="status-inline status-inline--error">{spotifyExportError}</p>
              )}
              {spotifyExportResult && (
                <p className="status-inline">
                  Spotify playlist created. Added {spotifyExportResult.matchedTracks} of{" "}
                  {spotifyExportResult.totalTracks} tracks.
                </p>
              )}
              {appleExportError && <p className="status-inline status-inline--error">{appleExportError}</p>}
              {appleExportResult && (
                <p className="status-inline">
                  Apple Music playlist created. Added {appleExportResult.matchedTracks} of{" "}
                  {appleExportResult.totalTracks} tracks.
                </p>
              )}

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
