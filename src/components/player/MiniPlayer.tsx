import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { LiveIndicator } from "./LiveIndicator";

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

  return (
    <aside className="mini-player" aria-label="Sticky mini player">
      <div className="mini-player__meta">
        <LiveIndicator isActive={isPlaying} />
        <strong>{currentTrack?.title ?? "Hits 93 Toronto"}</strong>
        <span>{currentTrack?.artist ?? "Live stream"}</span>
      </div>

      <div className="mini-player__controls">
        <button
          type="button"
          className="control-button control-button--small"
          onClick={() => {
            void togglePlayback();
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="control-button control-button--small"
          onClick={() => {
            setMuted(!isMuted);
          }}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <input
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
        {isBuffering && <span className="buffering-label">Buffering...</span>}
      </div>
    </aside>
  );
}
