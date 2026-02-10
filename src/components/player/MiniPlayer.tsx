import { Link } from "react-router-dom";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { useScheduleSnapshot } from "../../hooks/useScheduleSnapshot";
import { useTrackVote } from "../../hooks/useTrackVote";
import { LiveIndicator } from "./LiveIndicator";
import { MuteIcon, PauseIcon, PlayIcon, ThumbDownIcon, ThumbUpIcon, VolumeIcon } from "../ui/Icons";

function formatShowTitle(programmeName: string): string {
  const trimmed = programmeName.trim();
  if (!trimmed) {
    return "The Show";
  }

  if (/^the\\b/i.test(trimmed)) {
    return `${trimmed} Show`;
  }

  return `The ${trimmed} Show`;
}

export function MiniPlayer(): JSX.Element {
  const {
    currentTrack,
    isPlaying,
    togglePlayback,
    isMuted,
    setMuted,
    isBuffering
  } = useAudioPlayer();
  const { current: onAirProgramme } = useScheduleSnapshot(60000);
  const { canVote, voteNote, castVote } = useTrackVote(currentTrack);

  const canRate = Boolean(currentTrack?.allMusicId);
  const voteLocked = canRate && !canVote;
  const noteParts = [voteNote, isBuffering ? "Buffering..." : ""].filter(Boolean);
  const onAirShowTitle = onAirProgramme ? formatShowTitle(onAirProgramme.name) : "";

  return (
    <aside className="mini-player" aria-label="Sticky mini player">
      <div className="mini-player__meta">
        <div className="mini-player__meta-top">
          <LiveIndicator isActive={isPlaying}>
            {onAirProgramme && (
              <>
                <Link
                  to={`/schedule/programmes/${onAirProgramme.slug}`}
                  className="live-indicator__link"
                  title={onAirProgramme.description}
                  aria-label={`Open ${onAirProgramme.name} program page`}
                >
                  {onAirShowTitle}
                </Link>
              </>
            )}
          </LiveIndicator>
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

        {canRate && (
          <>
            <button
              type="button"
              className={`control-pill control-pill--small mini-player__vote-button ${voteLocked ? "control-pill--disabled" : ""}`}
              onClick={() => {
                castVote("up");
              }}
              aria-label="Like current track"
              aria-disabled={voteLocked}
            >
              <ThumbUpIcon />
              <span>Like</span>
            </button>
            <button
              type="button"
              className={`control-pill control-pill--small mini-player__vote-button ${voteLocked ? "control-pill--disabled" : ""}`}
              onClick={() => {
                castVote("down");
              }}
              aria-label="Dislike current track"
              aria-disabled={voteLocked}
            >
              <ThumbDownIcon />
              <span>Dislike</span>
            </button>
          </>
        )}

      </div>

      {Boolean(noteParts.length) && <p className="mini-player__note">{noteParts.join(" • ")}</p>}
    </aside>
  );
}
