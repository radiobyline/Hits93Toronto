import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_ARTWORK_URL } from "../../config/constants";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { useTrackVote } from "../../hooks/useTrackVote";
import type { Programme } from "../../services/scheduleProvider";
import { RecentCarousel } from "../history/RecentCarousel";
import { RequestModal } from "../requests/RequestModal";
import { ProgrammeBlock } from "../schedule/ProgrammeBlock";
import { StationCtaBlock } from "../schedule/StationCtaBlock";
import { LiveIndicator } from "./LiveIndicator";
import { MusicLinks } from "./MusicLinks";
import { PlayerControls } from "./PlayerControls";
import { RequestIcon, ThumbDownIcon, ThumbUpIcon } from "../ui/Icons";
import { formatProgrammeShowTitle } from "../../utils/programme";

interface MainPlayerHeroProps {
  rootRef: React.RefObject<HTMLElement>;
  miniPlayerSentinelRef: React.RefObject<HTMLDivElement>;
}

export function MainPlayerHero({ rootRef, miniPlayerSentinelRef }: MainPlayerHeroProps): JSX.Element {
  const {
    currentTrack,
    isPlaying,
    isMuted,
    isBuffering,
    isLoadingMetadata,
    metadataError,
    playbackError,
    recentTracks,
    togglePlayback,
    setMuted,
  } = useAudioPlayer();

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const { currentVote, voteNote, castVote, isSubmitting: voteSubmitting } = useTrackVote(currentTrack);
  const [programmeSnapshot, setProgrammeSnapshot] = useState<{ current: Programme | null; next: Programme | null }>({
    current: null,
    next: null
  });
  const artworkSrc = currentTrack?.artworkUrl ?? DEFAULT_ARTWORK_URL;

  const onProgrammeChange = useCallback((current: Programme | null, next: Programme | null) => {
    setProgrammeSnapshot((previous) => {
      if (
        previous.current?.id === current?.id &&
        previous.current?.startMs === current?.startMs &&
        previous.next?.id === next?.id &&
        previous.next?.startMs === next?.startMs
      ) {
        return previous;
      }
      return { current, next };
    });
  }, []);

  const onAirProgramme = programmeSnapshot.current;
  const onAirShowTitle = onAirProgramme ? formatProgrammeShowTitle(onAirProgramme.name) : "";

  return (
    <>
      <section className="hero-player" ref={rootRef}>
        <div className="hero-player__main">
          <div className="hero-player__artwork-panel">
            <div className="hero-player__artwork-wrap">
              <img
                src={artworkSrc}
                alt={currentTrack ? `${currentTrack.title} artwork` : "Station artwork"}
                className="hero-player__artwork"
                width={640}
                height={640}
                loading="eager"
                decoding="async"
                fetchPriority={currentTrack ? "high" : "auto"}
                onError={(event) => {
                  const img = event.currentTarget;
                  img.src = DEFAULT_ARTWORK_URL;
                }}
              />
            </div>
          </div>

          <div className="hero-player__meta">
            <p className="hero-player__overline">HITS 93 TORONTO WORLDWIDE LIVE STREAM</p>
            <div className="hero-player__status-row">
              <LiveIndicator isActive={isPlaying}>
                {onAirProgramme && (
                  <Link
                    to={`/schedule/programmes/${onAirProgramme.slug}`}
                    className="live-indicator__link"
                    title={onAirProgramme.description}
                    aria-label={`Open ${onAirProgramme.name} program page`}
                  >
                    {onAirShowTitle}
                  </Link>
                )}
              </LiveIndicator>
            </div>
            <h2>{currentTrack?.title ?? "Live from Hits 93 Toronto"}</h2>
            <p className="hero-player__artist">{currentTrack?.artist ?? "Press play and stay with the live stream."}</p>
            {currentTrack?.album && <p className="hero-player__album">Album: {currentTrack.album}</p>}

            <div className="hero-player__vote-inline">
              <PlayerControls
                isPlaying={isPlaying}
                isMuted={isMuted}
                isBuffering={isBuffering}
                onTogglePlayback={togglePlayback}
                onToggleMuted={() => {
                  setMuted(!isMuted);
                }}
              />
              <div className="hero-player__vote-divider" />
              {currentTrack?.allMusicId ? (
                <>
                  <div className="hero-player__vote-inline-buttons">
                    <button
                      type="button"
                      className={`control-pill control-pill--small ${
                        voteSubmitting ? "control-pill--disabled" : ""
                      } ${currentVote === "up" ? "control-pill--vote-active control-pill--vote-up-active" : ""}`}
                      onClick={() => {
                        castVote("up");
                      }}
                      aria-label="Like current track"
                      aria-disabled={voteSubmitting}
                      aria-pressed={currentVote === "up"}
                      disabled={voteSubmitting}
                    >
                      <ThumbUpIcon />
                      <span>Like</span>
                    </button>
                    <button
                      type="button"
                      className={`control-pill control-pill--small ${
                        voteSubmitting ? "control-pill--disabled" : ""
                      } ${currentVote === "down" ? "control-pill--vote-active control-pill--vote-down-active" : ""}`}
                      onClick={() => {
                        castVote("down");
                      }}
                      aria-label="Dislike current track"
                      aria-disabled={voteSubmitting}
                      aria-pressed={currentVote === "down"}
                      disabled={voteSubmitting}
                    >
                      <ThumbDownIcon />
                      <span>Dislike</span>
                    </button>
                  </div>
                  {voteNote && <p className="status-inline">{voteNote}</p>}
                </>
              ) : (
                <p className="status-inline">Rating is unavailable for this track right now.</p>
              )}

              <div className="hero-player__vote-divider" />
              <MusicLinks track={currentTrack} />
            </div>

            <div className="hero-player__utility-row">
              <button
                type="button"
                className="control-pill control-pill--request control-pill--request-primary"
                onClick={() => {
                  setRequestModalOpen(true);
                }}
              >
                <RequestIcon />
                <span>Request a Song</span>
              </button>
              <Link to="/jukebox" className="control-pill control-pill--small">
                Open Jukebox
              </Link>
              <Link
                to="/recent"
                className="control-pill control-pill--small hero-player__utility-desktop-only"
              >
                Recently Played
              </Link>
              <Link
                to="/schedule"
                className="control-pill control-pill--small hero-player__utility-desktop-only"
              >
                Full Schedule
              </Link>
            </div>

            {(metadataError || playbackError) && (
              <p className="status-inline status-inline--error">{metadataError ?? playbackError}</p>
            )}
            {isLoadingMetadata && <p className="status-inline">Loading metadata...</p>}
          </div>
        </div>

        <RecentCarousel tracks={recentTracks.slice(0, 5)} />
        <div ref={miniPlayerSentinelRef} className="mini-player-sentinel" aria-hidden="true" />
        <ProgrammeBlock onProgrammeChange={onProgrammeChange} />
        <div className="mini-player-sentinel" aria-hidden="true" />
        <StationCtaBlock />
      </section>

      <RequestModal
        isOpen={requestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
        }}
      />
    </>
  );
}
