import { useState } from "react";
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
    volume,
    setVolume,
    isBuffering
  } = useAudioPlayer();
  const { currentVote, canVote, voteNote, castVote } = useTrackVote(currentTrack);
  const [volumeOpen, setVolumeOpen] = useState(false);

  return (
    <aside className="mini-player" aria-label="Sticky mini player">
      <div className="mini-player__meta">
        <div className="mini-player__meta-top">
          <LiveIndicator isActive={isPlaying} />
          <span className="mini-player__station">Hits 93 Toronto</span>
        </div>
        <strong>{currentTrack?.title ?? "Hits 93 Toronto"}</strong>
        <span>{currentTrack ? `${currentTrack.artist}${currentTrack.album ? ` - ${currentTrack.album}` : ""}` : "Live stream"}</span>
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

        <div className={`mini-player__volume-wrap ${volumeOpen ? "mini-player__volume-wrap--open" : ""}`}>
          <button
            type="button"
            className="control-pill control-pill--small"
            aria-label="Open volume slider"
            onClick={() => {
              setVolumeOpen((previous) => !previous);
            }}
          >
            <VolumeIcon />
          </button>
          <input
            id="mini-player-volume"
            className="mini-player__volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => {
              setVolume(Number(event.target.value));
            }}
            aria-label="Mini player volume"
          />
        </div>

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

        {!canVote && currentVote && <span className="mini-player__vote-status">Voted: {currentVote}</span>}

        {isBuffering && <span className="buffering-label">Buffering...</span>}
      </div>

      {voteNote && <p className="mini-player__note">{voteNote}</p>}
    </aside>
  );
}
