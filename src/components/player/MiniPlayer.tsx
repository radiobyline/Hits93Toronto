import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { useTrackVote } from "../../hooks/useTrackVote";
import { LiveIndicator } from "./LiveIndicator";
import { MuteIcon, PauseIcon, PlayIcon, ThumbDownIcon, ThumbUpIcon, VolumeIcon } from "../ui/Icons";

export function MiniPlayer(): JSX.Element {
  const {
    currentTrack,
    isPlaying,
    togglePlayback,
    isMuted,
    setMuted,
    isBuffering
  } = useAudioPlayer();
  const { currentVote, canVote, voteNote, castVote } = useTrackVote(currentTrack);

  return (
    <aside className="mini-player" aria-label="Sticky mini player">
      <div className="mini-player__meta">
        <div className="mini-player__meta-top">
          <LiveIndicator isActive={isPlaying} />
          <span className="mini-player__station">Hits 93 Toronto</span>
        </div>
        <strong>{currentTrack?.title ?? "Hits 93 Toronto"}</strong>
        <span>{currentTrack ? currentTrack.artist : "Live stream"}</span>
      </div>

      <div className="mini-player__controls">
        <button
          type="button"
          className="control-pill control-pill--small control-pill--play"
          onClick={() => {
            void togglePlayback();
          }}
          aria-label={isPlaying ? "Pause live stream" : "Play live stream"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          type="button"
          className="control-pill control-pill--small"
          onClick={() => {
            setMuted(!isMuted);
          }}
          aria-label={isMuted ? "Unmute stream" : "Mute stream"}
        >
          {isMuted ? <MuteIcon /> : <VolumeIcon />}
        </button>

        {canVote && (
          <>
            <button
              type="button"
              className="control-pill control-pill--small"
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
              onClick={() => {
                castVote("down");
              }}
              aria-label="Dislike current track"
            >
              <ThumbDownIcon />
              <span>Dislike</span>
            </button>
          </>
        )}

      </div>

      {(currentVote || voteNote || isBuffering) && (
        <p className="mini-player__note">
          {currentVote ? `Voted: ${currentVote}` : voteNote}
          {isBuffering ? " • Buffering..." : ""}
        </p>
      )}
    </aside>
  );
}
