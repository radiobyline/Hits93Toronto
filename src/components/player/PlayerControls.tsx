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
        className="control-button control-button--play"
        onClick={() => {
          void onTogglePlayback();
        }}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      <button type="button" className="control-button" onClick={onToggleMuted}>
        {isMuted ? "Unmute" : "Mute"}
      </button>

      <label className="volume-control" htmlFor="volume-slider">
        <span>Volume</span>
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
