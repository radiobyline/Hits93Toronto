import { useEffect, useRef, useState } from "react";
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
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!volumeOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (volumeRef.current && !volumeRef.current.contains(target)) {
        setVolumeOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setVolumeOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [volumeOpen]);

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

      <div
        className={`volume-control ${volumeOpen ? "volume-control--open" : ""}`}
        ref={volumeRef}
        onMouseEnter={() => {
          setVolumeOpen(true);
        }}
        onMouseLeave={() => {
          setVolumeOpen(false);
        }}
      >
        <button
          type="button"
          className="volume-control__toggle"
          aria-label="Open volume slider"
          onClick={() => {
            setVolumeOpen((previous) => !previous);
          }}
        >
          {isMuted ? <MuteIcon /> : <VolumeIcon />}
        </button>
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
      </div>

      {isBuffering && <span className="buffering-label">Buffering...</span>}
    </div>
  );
}
