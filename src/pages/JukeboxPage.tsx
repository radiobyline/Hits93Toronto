import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_ARTWORK_URL } from "../config/constants";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { fetchApplePreviewUrl } from "../services/previewService";
import { requestService } from "../services/requestService";
import type { RequestLibraryTrack } from "../types";

const PREVIEW_DURATION_MS = 15000;

export function JukeboxPage(): JSX.Element {
  const { isPlaying, pause } = useAudioPlayer();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RequestLibraryTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [requesterName, setRequesterName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [previewingTrackId, setPreviewingTrackId] = useState<number | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);
  const [previewCache, setPreviewCache] = useState<Record<number, string | null>>({});

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | undefined>();

  useEffect(() => {
    let active = true;

    const runSearch = async () => {
      setSearching(true);
      try {
        const tracks = await requestService.searchLibrary(query);
        if (active) {
          setResults(tracks);
        }
      } catch (error) {
        if (active) {
          setStatus(error instanceof Error ? error.message : "Search failed.");
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    };

    void runSearch();

    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
    };
  }, []);

  const selectedTrack = useMemo(() => {
    return results.find((track) => track.id === selectedTrackId) ?? null;
  }, [results, selectedTrackId]);

  const stopPreview = () => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }

    previewAudioRef.current?.pause();
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewingTrackId(null);
  };

  const startPreview = async (track: RequestLibraryTrack) => {
    stopPreview();
    if (isPlaying) {
      pause();
    }

    const cached = previewCache[track.id];
    if (cached === undefined) {
      setPreviewLoadingId(track.id);
      const previewUrl = await fetchApplePreviewUrl(track.artist, track.title);
      setPreviewCache((previous) => ({
        ...previous,
        [track.id]: previewUrl
      }));
      setPreviewLoadingId(null);

      if (!previewUrl) {
        setStatus("No preview available for this track right now.");
        return;
      }

      const audio = new Audio(previewUrl);
      previewAudioRef.current = audio;
      setPreviewingTrackId(track.id);
      void audio.play();
      previewTimeoutRef.current = window.setTimeout(() => {
        stopPreview();
      }, PREVIEW_DURATION_MS);
      return;
    }

    if (!cached) {
      setStatus("No preview available for this track right now.");
      return;
    }

    const audio = new Audio(cached);
    previewAudioRef.current = audio;
    setPreviewingTrackId(track.id);
    void audio.play();
    previewTimeoutRef.current = window.setTimeout(() => {
      stopPreview();
    }, PREVIEW_DURATION_MS);
  };

  const submitRequest = async () => {
    if (!selectedTrack) {
      setStatus("Select a track first.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestService.submitRequest({
        trackId: selectedTrack.id,
        requesterName: requesterName.trim() || undefined,
        message: message.trim() || undefined
      });

      setStatus(result.note);
      if (result.accepted) {
        setMessage("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <section className="page-section jukebox-page">
        <h2>Jukebox</h2>
        <p className="page-section__lede">
          Search and request songs.
        </p>

        <div className="jukebox-page__layout">
          <section className="jukebox-page__search">
            <label className="field" htmlFor="jukebox-search">
              <span>Search</span>
              <input
                id="jukebox-search"
                type="search"
                placeholder="Artist, song, or album"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
              />
            </label>

            <p className="status-inline">Preview clips provided where available.</p>

            <div className="jukebox-results" role="list">
              {searching && <p className="status-inline">Searching...</p>}
              {!searching && !results.length && <p className="status-inline">No matching tracks found.</p>}

              {results.map((track) => (
                <article key={track.id} className="jukebox-result" role="listitem">
                  <button
                    type="button"
                    className={`jukebox-result__select ${selectedTrackId === track.id ? "jukebox-result__select--active" : ""}`}
                    onClick={() => {
                      setSelectedTrackId(track.id);
                    }}
                  >
                    <img
                      src={track.artworkUrl || DEFAULT_ARTWORK_URL}
                      alt={`${track.title} artwork`}
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        event.currentTarget.src = DEFAULT_ARTWORK_URL;
                      }}
                    />
                    <div>
                      <strong>{track.title}</strong>
                      <span>{track.artist}</span>
                      {track.album && <span>Album: {track.album}</span>}
                    </div>
                  </button>

                  <button
                    type="button"
                    className="control-pill control-pill--small"
                    disabled={previewLoadingId === track.id}
                    onClick={() => {
                      if (previewingTrackId === track.id) {
                        stopPreview();
                        return;
                      }

                      void startPreview(track);
                    }}
                  >
                    {previewingTrackId === track.id
                      ? "Stop preview"
                      : previewLoadingId === track.id
                        ? "Loading preview..."
                        : "Preview"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="jukebox-page__request">
            <h3>Request a Song</h3>
            <p className="status-inline">
              Requests are automatic. Shoutouts are accepted now and will expand in future updates.
            </p>
            <p className="status-inline">Choose a song from Search before sending your request.</p>

            <label className="field" htmlFor="jukebox-track">
              <span>Selected Song</span>
              <input
                id="jukebox-track"
                type="text"
                value={selectedTrack ? `${selectedTrack.artist} - ${selectedTrack.title}` : ""}
                readOnly
                placeholder="Choose a song"
              />
            </label>

            <label className="field" htmlFor="jukebox-name">
              <span>Your name (optional)</span>
              <input
                id="jukebox-name"
                type="text"
                value={requesterName}
                onChange={(event) => {
                  setRequesterName(event.target.value);
                }}
              />
            </label>

            <label className="field" htmlFor="jukebox-message">
              <span>Shoutout (optional)</span>
              <textarea
                id="jukebox-message"
                rows={4}
                placeholder="Add a message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                }}
              />
            </label>

            <button
              type="button"
              className="control-pill control-pill--request-primary"
              onClick={() => {
                void submitRequest();
              }}
              disabled={submitting || !selectedTrack}
            >
              {submitting ? "Sending request..." : "Send Request"}
            </button>

            <p className="status-inline">Requests may play later in the day.</p>
            {status && <p className="status-inline">{status}</p>}
          </section>
        </div>
      </section>
    </div>
  );
}
