import { useAudioPlayer } from "../context/AudioPlayerContext";
import { LiveIndicator } from "../components/player/LiveIndicator";
import { PlayerControls } from "../components/player/PlayerControls";
import { Visualizer } from "../components/player/Visualizer";

export function EmbedPlayerPage(): JSX.Element {
  const {
    analyserNode,
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    isBuffering,
    togglePlayback,
    setMuted,
    setVolume,
    playbackError
  } = useAudioPlayer();

  return (
    <div className="embed-shell">
      <article className="embed-player">
        <LiveIndicator isActive={isPlaying} />
        <h2>{currentTrack?.title ?? "Hits 93 Toronto"}</h2>
        <p>{currentTrack?.artist ?? "Live Stream"}</p>

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

        <Visualizer analyserNode={analyserNode} isPlaying={isPlaying} />

        {playbackError && <p className="status-inline status-inline--error">{playbackError}</p>}
      </article>
    </div>
  );
}
