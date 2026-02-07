import { useState } from "react";
import { DEFAULT_ARTWORK_URL } from "../../config/constants";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { voteService } from "../../services/voteService";
import { RecentCarousel } from "../history/RecentCarousel";
import { RequestModal } from "../requests/RequestModal";
import { ProgrammeBlock } from "../schedule/ProgrammeBlock";
import { LiveIndicator } from "./LiveIndicator";
import { MusicLinks } from "./MusicLinks";
import { PlayerControls } from "./PlayerControls";
import { Visualizer } from "./Visualizer";
import { RequestIcon, ThumbDownIcon, ThumbUpIcon } from "../ui/Icons";

export function MainPlayerHero({ rootRef }: { rootRef: React.RefObject<HTMLElement> }): JSX.Element {
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
  const [voteNote, setVoteNote] = useState("");

  const voteKey = currentTrack
    ? `${currentTrack.allMusicId ?? currentTrack.key}:${currentTrack.startMs}`
    : "";
  const currentVote = voteKey ? voteService.getVote(voteKey) : null;

  const castVote = (direction: "up" | "down") => {
    if (!voteKey || !currentTrack?.allMusicId) {
      setVoteNote("Track id unavailable for voting.");
      return;
    }

    const submit =
      direction === "up"
        ? voteService.voteUp(voteKey, currentTrack.allMusicId)
        : voteService.voteDown(voteKey, currentTrack.allMusicId);

    void submit.then((result) => {
      setVoteNote(result.note);
    });
  };

  return (
    <>
      <section className="hero-player" ref={rootRef}>
        <div className="hero-player__main">
          <div className="hero-player__artwork-panel">
            <img
              src={currentTrack?.artworkUrl ?? DEFAULT_ARTWORK_URL}
              alt={currentTrack ? `${currentTrack.title} artwork` : "Station artwork"}
              className="hero-player__artwork"
              onError={(event) => {
                const img = event.currentTarget;
                img.src = DEFAULT_ARTWORK_URL;
              }}
            />
            <Visualizer analyserNode={analyserNode} isPlaying={isPlaying} />
          </div>

          <div className="hero-player__meta">
            <p className="hero-player__overline">Toronto Live Broadcast</p>
            <LiveIndicator isActive={isPlaying} />
            <h2>{currentTrack?.title ?? "Live from Hits 93 Toronto"}</h2>
            <p>{currentTrack?.artist ?? "Press play and stay with the live stream."}</p>
            {currentTrack?.album && <p className="hero-player__album">{currentTrack.album}</p>}

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
                className="control-pill control-pill--request"
                onClick={() => {
                  setRequestModalOpen(true);
                }}
              >
                <RequestIcon />
                <span>Request a track</span>
              </button>
            </div>

            <MusicLinks track={currentTrack} />

            <div className="vote-block">
              <p>Rate this track</p>
              <div className="vote-block__buttons">
                <button
                  type="button"
                  className="control-pill"
                  disabled={!currentTrack?.allMusicId || Boolean(currentVote)}
                  onClick={() => {
                    castVote("up");
                  }}
                  aria-label="Upvote current track"
                >
                  <ThumbUpIcon />
                  <span>Upvote</span>
                </button>
                <button
                  type="button"
                  className="control-pill"
                  disabled={!currentTrack?.allMusicId || Boolean(currentVote)}
                  onClick={() => {
                    castVote("down");
                  }}
                  aria-label="Downvote current track"
                >
                  <ThumbDownIcon />
                  <span>Downvote</span>
                </button>
              </div>
              <p className="status-inline">{currentVote ? `Vote saved: ${currentVote}` : voteNote}</p>
            </div>

            {(metadataError || playbackError) && (
              <p className="status-inline status-inline--error">{metadataError ?? playbackError}</p>
            )}
            {isLoadingMetadata && <p className="status-inline">Loading metadata...</p>}
          </div>
        </div>

        <RecentCarousel tracks={recentTracks.slice(0, 5)} />
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
