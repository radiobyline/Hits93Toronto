import { useEffect, useMemo, useState } from "react";
import { requestService } from "../../services/requestService";
import type { RequestLibraryTrack } from "../../types";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestModal({ isOpen, onClose }: RequestModalProps): JSX.Element | null {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RequestLibraryTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [requesterName, setRequesterName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string>("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const selectedTrack = useMemo(() => {
    return results.find((track) => track.id === selectedTrackId) ?? null;
  }, [results, selectedTrackId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-modal-title"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="modal__header">
          <h2 id="request-modal-title">Request a track</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close request form">
            Close
          </button>
        </header>

        <label className="field" htmlFor="request-search">
          <span>Search library</span>
          <input
            id="request-search"
            type="search"
            placeholder="Search by artist, title, album"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>

        <div className="request-results" role="listbox" aria-label="Track results">
          {searching && <p className="status-inline">Searching...</p>}
          {!searching && !results.length && <p className="status-inline">No matches in mock data.</p>}

          {results.map((track) => (
            <button
              key={track.id}
              type="button"
              className={`request-result ${track.id === selectedTrackId ? "request-result--selected" : ""}`}
              onClick={() => {
                setSelectedTrackId(track.id);
              }}
            >
              <strong>{track.title}</strong>
              <span>{track.artist}</span>
            </button>
          ))}
        </div>

        <label className="field" htmlFor="requester-name">
          <span>Name (optional)</span>
          <input
            id="requester-name"
            type="text"
            placeholder="Your name"
            value={requesterName}
            onChange={(event) => {
              setRequesterName(event.target.value);
            }}
          />
        </label>

        <label className="field" htmlFor="request-message">
          <span>Shoutout message (optional)</span>
          <textarea
            id="request-message"
            rows={3}
            placeholder="Message for on-air shoutout"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
            }}
          />
        </label>

        <footer className="modal__footer">
          <button
            type="button"
            className="control-pill"
            disabled={!selectedTrack || submitting}
            onClick={() => {
              if (!selectedTrack) {
                setStatus("Select a track first.");
                return;
              }

              setSubmitting(true);
              void requestService
                .submitRequest({
                  trackId: selectedTrack.id,
                  requesterName: requesterName.trim() || undefined,
                  message: message.trim() || undefined
                })
                .then((result) => {
                  setStatus(result.note);
                  if (result.accepted) {
                    setSelectedTrackId(null);
                    setMessage("");
                  }
                })
                .finally(() => {
                  setSubmitting(false);
                });
            }}
          >
            {submitting ? "Submitting..." : "Send request"}
          </button>
          <p className="status-inline">{status}</p>
        </footer>
      </div>
    </div>
  );
}
