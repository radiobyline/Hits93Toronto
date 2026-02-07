import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { LiveIndicator } from "./LiveIndicator";
import { MuteIcon, PauseIcon, PlayIcon, VolumeIcon } from "../ui/Icons";

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
          className="control-pill control-pill--small control-pill--play"
          onClick={() => {
            void togglePlayback();
          }}
          aria-label={isPlaying ? "Pause live stream" : "Play live stream"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
          <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
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
          <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        <label className="mini-player__volume-wrap" htmlFor="mini-player-volume">
          <span className="sr-only">Mini player volume</span>
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
        </label>

        {isBuffering && <span className="buffering-label">Buffering...</span>}
      </div>
    </aside>
  );
}
