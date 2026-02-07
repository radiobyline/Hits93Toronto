import { MuteIcon, PauseIcon, PlayIcon, VolumeIcon } from "../ui/Icons";

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isBuffering: boolean;
  onTogglePlayback: () => Promise<void>;
  onToggleMuted: () => void;
  onVolumeChange: (value: number) => void;
}

export function PlayerControls({
  isPlaying,
  isMuted,
  volume,
  isBuffering,
  onTogglePlayback,
  onToggleMuted,
  onVolumeChange
}: PlayerControlsProps): JSX.Element {
  return (
    <div className="player-controls" role="group" aria-label="Live player controls">
      <button
        type="button"
        className="control-pill control-pill--play"
        onClick={() => {
          void onTogglePlayback();
        }}
        aria-label={isPlaying ? "Pause live stream" : "Play live stream"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
        <span>{isPlaying ? "Pause" : "Play live"}</span>
      </button>

      <button
        type="button"
        className="control-pill"
        onClick={onToggleMuted}
        aria-label={isMuted ? "Unmute stream" : "Mute stream"}
      >
        {isMuted ? <MuteIcon /> : <VolumeIcon />}
        <span>{isMuted ? "Unmute" : "Mute"}</span>
      </button>

      <label className="volume-control" htmlFor="volume-slider">
        <span className="sr-only">Volume</span>
        {isMuted ? <MuteIcon /> : <VolumeIcon />}
        <input
          id="volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => {
            onVolumeChange(Number(event.target.value));
          }}
          aria-label="Volume"
        />
      </label>

      {isBuffering && <span className="buffering-label">Buffering...</span>}
    </div>
  );
}
