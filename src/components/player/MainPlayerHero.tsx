import { useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_ARTWORK_URL } from "../../config/constants";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { useTrackVote } from "../../hooks/useTrackVote";
import { RecentCarousel } from "../history/RecentCarousel";
import { RequestModal } from "../requests/RequestModal";
import { ProgrammeBlock } from "../schedule/ProgrammeBlock";
import { LiveIndicator } from "./LiveIndicator";
import { MusicLinks } from "./MusicLinks";
import { PlayerControls } from "./PlayerControls";
import { Visualizer } from "./Visualizer";
import { RequestIcon, ThumbDownIcon, ThumbUpIcon } from "../ui/Icons";

interface MainPlayerHeroProps {
  rootRef: React.RefObject<HTMLElement>;
  miniPlayerSentinelRef: React.RefObject<HTMLDivElement>;
}

export function MainPlayerHero({ rootRef, miniPlayerSentinelRef }: MainPlayerHeroProps): JSX.Element {
  const {
    analyserNode,
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    isBuffering,
    isLoadingMetadata,
    metadataError,
    playbackError,
    recentTracks,
    togglePlayback,
    setMuted,
    setVolume
  } = useAudioPlayer();

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const { currentVote, canVote, voteNote, castVote } = useTrackVote(currentTrack);

  return (
    <>
      <section className="hero-player" ref={rootRef}>
        <div className="hero-player__main">
          <div className="hero-player__artwork-panel">
            <div className="hero-player__artwork-wrap">
              <img
                src={currentTrack?.artworkUrl ?? DEFAULT_ARTWORK_URL}
                alt={currentTrack ? `${currentTrack.title} artwork` : "Station artwork"}
                className="hero-player__artwork"
                onError={(event) => {
                  const img = event.currentTarget;
                  img.src = DEFAULT_ARTWORK_URL;
                }}
              />
              <Visualizer analyserNode={analyserNode} isPlaying={isPlaying} mode="ring" />
            </div>
          </div>

          <div className="hero-player__meta">
            <p className="hero-player__overline">Hits 93 Toronto Live Stream</p>
            <LiveIndicator isActive={isPlaying} />
            <h2>{currentTrack?.title ?? "Live from Hits 93 Toronto"}</h2>
            <p className="hero-player__artist">{currentTrack?.artist ?? "Press play and stay with the live stream."}</p>
            {currentTrack?.album && <p className="hero-player__album">Album: {currentTrack.album}</p>}

            {currentTrack?.allMusicId && (
              <div className="hero-player__vote-inline">
                <p>Rate this song</p>
                <div className="hero-player__vote-inline-buttons">
                  <button
                    type="button"
                    className="control-pill control-pill--small"
                    disabled={!canVote}
                    onClick={() => {
                      castVote("up");
                    }}
                    aria-label="Like current track"
                  >
                    <ThumbUpIcon />
                    <span>Like</span>
                  </button>
                  <button
                    type="button"
                    className="control-pill control-pill--small"
                    disabled={!canVote}
                    onClick={() => {
                      castVote("down");
                    }}
                    aria-label="Dislike current track"
                  >
                    <ThumbDownIcon />
                    <span>Dislike</span>
                  </button>
                </div>
                <p className="status-inline">{currentVote ? `Vote saved: ${currentVote}` : voteNote}</p>
              </div>
            )}

            <PlayerControls
              isPlaying={isPlaying}
              isMuted={isMuted}
              volume={volume}
              isBuffering={isBuffering}
              onTogglePlayback={togglePlayback}
              onToggleMuted={() => {
                setMuted(!isMuted);
              }}
              onVolumeChange={setVolume}
            />

            <div className="hero-player__utility-row">
              <button
                type="button"
                className="control-pill control-pill--request control-pill--request-primary"
                onClick={() => {
                  setRequestModalOpen(true);
                }}
              >
                <RequestIcon />
                <span>Open Jukebox: Request tracks and add shoutouts</span>
              </button>
              <Link to="/jukebox" className="control-pill control-pill--small">
                Open full Jukebox page
              </Link>
            </div>

            <MusicLinks track={currentTrack} />

            {(metadataError || playbackError) && (
              <p className="status-inline status-inline--error">{metadataError ?? playbackError}</p>
            )}
            {isLoadingMetadata && <p className="status-inline">Loading metadata...</p>}
          </div>
        </div>

        <RecentCarousel tracks={recentTracks.slice(0, 5)} />
        <div ref={miniPlayerSentinelRef} className="mini-player-sentinel" aria-hidden="true" />
        <ProgrammeBlock />
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
