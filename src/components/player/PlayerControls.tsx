import { MuteIcon, PauseIcon, PlayIcon, VolumeIcon } from "../ui/Icons";

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isBuffering: boolean;
  onTogglePlayback: () => Promise<void>;
  onToggleMuted: () => void;
}

export function PlayerControls({
  isPlaying,
  isMuted,
  isBuffering,
  onTogglePlayback,
  onToggleMuted
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
        <span>{isPlaying ? "Pause" : "Listen Live"}</span>
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

      {isBuffering && <span className="buffering-label">Buffering...</span>}
    </div>
  );
}
