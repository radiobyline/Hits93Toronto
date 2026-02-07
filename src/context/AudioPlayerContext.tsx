import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { POLL_INTERVAL_MS, STREAM_URL_HTTPS } from "../config/constants";
import { fetchHistory, shapeHistoryForPlayer } from "../services/historyService";
import type { Track } from "../types";

interface AudioPlayerContextValue {
  audioElement: HTMLAudioElement | null;
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isBuffering: boolean;
  hasInteracted: boolean;
  isLoadingMetadata: boolean;
  metadataError: string | null;
  playbackError: string | null;
  currentTrack: Track | null;
  recentTracks: Track[];
  play: () => Promise<void>;
  pause: () => void;
  togglePlayback: () => Promise<void>;
  setMuted: (value: boolean) => void;
  setVolume: (value: number) => void;
  refreshMetadata: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

function computeNextRefreshDelay(currentTrack: Track | null): number {
  if (!currentTrack?.endMs) {
    return POLL_INTERVAL_MS;
  }

  const untilBoundaryMs = currentTrack.endMs - Date.now();

  if (!Number.isFinite(untilBoundaryMs)) {
    return POLL_INTERVAL_MS;
  }

  if (untilBoundaryMs < 2000) {
    return 5000;
  }

  if (untilBoundaryMs < 90000) {
    return Math.max(5000, Math.min(30000, untilBoundaryMs + 1200));
  }

  return POLL_INTERVAL_MS;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }): JSX.Element {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.82);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const currentTrackRef = useRef<Track | null>(null);

  const loadMetadataOnce = useCallback(async () => {
    try {
      if (!currentTrackRef.current) {
        setIsLoadingMetadata(true);
      }

      const tracks = await fetchHistory(8, 0);
      const shaped = shapeHistoryForPlayer(tracks);

      setCurrentTrack(shaped.current);
      currentTrackRef.current = shaped.current;
      setRecentTracks(shaped.recent);
      setMetadataError(null);
    } catch (error) {
      setMetadataError(
        error instanceof Error ? error.message : "Could not fetch track metadata right now."
      );
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const loop = async () => {
      await loadMetadataOnce();

      if (cancelled) {
        return;
      }

      const nextDelay = computeNextRefreshDelay(currentTrackRef.current);
      timeoutId = window.setTimeout(() => {
        void loop();
      }, nextDelay);
    };

    void loop();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [loadMetadataOnce]);

  useEffect(() => {
    const audio = new Audio(STREAM_URL_HTTPS);
    audio.preload = "none";
    audio.crossOrigin = "anonymous";
    audio.volume = 0.82;

    const handlePlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      setPlaybackError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleError = () => {
      setPlaybackError("Stream unavailable or blocked. Check HTTPS stream/CORS.");
      setIsPlaying(false);
      setIsBuffering(false);
    };

    const handleVolumeChange = () => {
      setVolumeState(audio.volume);
      setIsMuted(audio.muted);
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("stalled", handleWaiting);
    audio.addEventListener("error", handleError);
    audio.addEventListener("volumechange", handleVolumeChange);

    audioElementRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("stalled", handleWaiting);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("volumechange", handleVolumeChange);
      audio.src = "";
      audioElementRef.current = null;
      void audioContextRef.current?.close();
      mediaSourceRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      setAnalyserNode(null);
    };
  }, []);

  const ensureAudioGraph = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) {
      return;
    }

    if (analyserRef.current && audioContextRef.current) {
      return;
    }

    if (!(window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)) {
      return;
    }

    try {
      const NativeAudioContext =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!NativeAudioContext) {
        return;
      }

      const context = new NativeAudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;

      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);

      audioContextRef.current = context;
      mediaSourceRef.current = source;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);
    } catch (error) {
      setPlaybackError(
        error instanceof Error ? error.message : "Unable to initialize visualizer audio graph."
      );
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioElementRef.current;
    if (!audio) {
      return;
    }

    ensureAudioGraph();

    setHasInteracted(true);
    setPlaybackError(null);

    try {
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      setPlaybackError(
        error instanceof Error
          ? error.message
          : "Autoplay blocked. Press play again after interaction."
      );
      setIsPlaying(false);
    }
  }, [ensureAudioGraph]);

  const pause = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
  }, []);

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      pause();
      return;
    }

    await play();
  }, [isPlaying, pause, play]);

  const setMuted = useCallback((value: boolean) => {
    const audio = audioElementRef.current;
    if (!audio) {
      return;
    }

    audio.muted = value;
    setIsMuted(value);
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    const audio = audioElementRef.current;
    if (!audio) {
      return;
    }

    const clampedVolume = Math.max(0, Math.min(1, nextVolume));
    audio.volume = clampedVolume;
    if (clampedVolume > 0) {
      audio.muted = false;
    }

    setVolumeState(clampedVolume);
    setIsMuted(audio.muted);
  }, []);

  const refreshMetadata = useCallback(async () => {
    await loadMetadataOnce();
  }, [loadMetadataOnce]);

  const value = useMemo(
    () => ({
      audioElement: audioElementRef.current,
      analyserNode,
      isPlaying,
      isMuted,
      volume,
      isBuffering,
      hasInteracted,
      isLoadingMetadata,
      metadataError,
      playbackError,
      currentTrack,
      recentTracks,
      play,
      pause,
      togglePlayback,
      setMuted,
      setVolume,
      refreshMetadata
    }),
    [
      analyserNode,
      isPlaying,
      isMuted,
      volume,
      isBuffering,
      hasInteracted,
      isLoadingMetadata,
      metadataError,
      playbackError,
      currentTrack,
      recentTracks,
      play,
      pause,
      togglePlayback,
      setMuted,
      setVolume,
      refreshMetadata
    ]
  );

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayer(): AudioPlayerContextValue {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }

  return context;
}
