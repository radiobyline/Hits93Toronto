import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_ARTWORK_URL } from "../../config/constants";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { emitStopPreviews, onStopPreviews } from "../../services/previewBus";
import { fetchApplePreviewUrl } from "../../services/previewService";
import { requestService } from "../../services/requestService";
import type { RequestLibraryTrack } from "../../types";

const PREVIEW_DURATION_MS = 15000;

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestModal({ isOpen, onClose }: RequestModalProps): JSX.Element | null {
  const { pause } = useAudioPlayer();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RequestLibraryTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [requesterName, setRequesterName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewCache, setPreviewCache] = useState<Record<number, string | null>>({});
  const [previewingTrackId, setPreviewingTrackId] = useState<number | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | undefined>();
  const previewRequestIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let active = true;

    const runSearch = async () => {
      setSearching(true);
      try {
        const tracks = await requestService.searchLibrary(query);
        if (active) {
          setResults(tracks);
          setStatus("");
        }
      } catch (error) {
        if (active) {
          setResults([]);
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
  }, [isOpen, query]);

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

  const selectedTrack = useMemo(() => {
    return results.find((track) => track.id === selectedTrackId) ?? null;
  }, [results, selectedTrackId]);

  const stopPreview = useCallback(() => {
    previewRequestIdRef.current += 1;
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }
    previewAudioRef.current?.pause();
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewingTrackId(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    stopPreview();
  }, [isOpen, stopPreview]);

  const startPreview = useCallback(async (track: RequestLibraryTrack) => {
    emitStopPreviews();
    stopPreview();
    pause();
    const requestId = ++previewRequestIdRef.current;

    const cached = previewCache[track.id];
    if (cached === undefined) {
      setPreviewLoadingId(track.id);
      const previewUrl = await fetchApplePreviewUrl(track.artist, track.title);
      setPreviewCache((previous) => ({
        ...previous,
        [track.id]: previewUrl
      }));
      setPreviewLoadingId(null);

      if (previewRequestIdRef.current !== requestId) {
        return;
      }

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

    if (previewRequestIdRef.current !== requestId) {
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
  }, [pause, previewCache, stopPreview]);

  useEffect(() => {
    return onStopPreviews(() => {
      stopPreview();
    });
  }, [stopPreview]);

  const submitRequest = async () => {
    if (!selectedTrack) {
      setStatus("Choose a song first.");
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal--jukebox"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-modal-title"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="modal__header">
          <h2 id="request-modal-title">Request a Song</h2>
          <button
            type="button"
            className="icon-button icon-button--modal-close"
            onClick={onClose}
            aria-label="Close request form"
          >
            Close
          </button>
        </header>

        <p className="status-inline">Search and request songs.</p>

        <div className="jukebox-page__layout jukebox-page__layout--modal">
          <section className="jukebox-page__search">
            <label className="field" htmlFor="request-search">
              <span>Search</span>
              <input
                id="request-search"
                type="search"
                placeholder="Artist, song, or album"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
              />
            </label>

            <p className="status-inline">Preview clips provided where available.</p>

            <div className="jukebox-results" role="listbox" aria-label="Track results">
              {searching && <p className="status-inline">Searching...</p>}
              {!searching && !results.length && <p className="status-inline">No matching tracks found.</p>}

              {results.map((track) => (
                <article key={track.id} className="jukebox-result">
                  <button
                    type="button"
                    className={`jukebox-result__select ${
                      selectedTrackId === track.id ? "jukebox-result__select--active" : ""
                    }`}
                    onClick={() => {
                      setSelectedTrackId(track.id);
                    }}
                  >
                    <img
                      src={track.artworkUrl || DEFAULT_ARTWORK_URL}
                      alt={`${track.title} artwork`}
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

            <label className="field" htmlFor="request-track">
              <span>Selected Song</span>
              <input
                id="request-track"
                type="text"
                value={selectedTrack ? `${selectedTrack.artist} - ${selectedTrack.title}` : ""}
                readOnly
                placeholder="Choose a song"
              />
            </label>

            <label className="field" htmlFor="requester-name">
              <span>Your name (optional)</span>
              <input
                id="requester-name"
                type="text"
                value={requesterName}
                onChange={(event) => {
                  setRequesterName(event.target.value);
                }}
              />
            </label>

            <label className="field" htmlFor="request-message">
              <span>Shoutout (optional)</span>
              <textarea
                id="request-message"
                rows={3}
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
              disabled={!selectedTrack || submitting}
            >
              {submitting ? "Sending request..." : "Send Request"}
            </button>

            <p className="status-inline">Requests may play later in the day.</p>
          </section>
        </div>

        <footer className="modal__footer">
          <p className="status-inline">{status}</p>
        </footer>
      </div>
    </div>
  );
}
