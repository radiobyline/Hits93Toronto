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
import { DEFAULT_ARTWORK_URL, POLL_INTERVAL_MS, STREAM_URL_HTTPS } from "../config/constants";
import { fetchHistory, shapeHistoryForPlayer } from "../services/historyService";
import { emitStopPreviews } from "../services/previewBus";
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

function safeSetActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null): void {
  try {
    navigator.mediaSession?.setActionHandler?.(action, handler);
  } catch {
    // Safari may throw for unsupported handlers; ignore.
  }
}

function safeSetMediaMetadata(track: Track | null): void {
  if (!("mediaSession" in navigator)) {
    return;
  }

  const MediaMetadataCtor = (window as Window & { MediaMetadata?: typeof MediaMetadata }).MediaMetadata;
  if (!MediaMetadataCtor) {
    return;
  }

  const artworkUrl = track?.artworkUrl || DEFAULT_ARTWORK_URL;
  let resolvedArtworkUrl = artworkUrl;
  try {
    resolvedArtworkUrl = new URL(artworkUrl, window.location.href).toString();
  } catch {
    // no-op
  }

  const normalizedArtworkUrl = resolvedArtworkUrl.toLowerCase();
  const artworkType = normalizedArtworkUrl.endsWith(".png")
    ? "image/png"
    : normalizedArtworkUrl.endsWith(".svg")
      ? "image/svg+xml"
      : normalizedArtworkUrl.endsWith(".webp")
        ? "image/webp"
        : normalizedArtworkUrl.endsWith(".avif")
          ? "image/avif"
          : "image/jpeg";

  try {
    navigator.mediaSession.metadata = new MediaMetadataCtor({
      title: track?.title || "Hits 93 Toronto",
      artist: track?.artist || "Live stream",
      album: track?.album || "",
      artwork: [
        { src: resolvedArtworkUrl, sizes: "512x512", type: artworkType },
        { src: resolvedArtworkUrl, sizes: "256x256", type: artworkType },
        { src: resolvedArtworkUrl, sizes: "96x96", type: artworkType }
      ]
    });
  } catch {
    // no-op
  }
}

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
  const masterGainRef = useRef<GainNode | null>(null);
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
    let stopTimeoutId: number | undefined;

    const stopNow = () => {
      if (stopTimeoutId) {
        window.clearTimeout(stopTimeoutId);
      }
      try {
        audio.muted = true;
        audio.volume = 0;
      } catch {
        // no-op
      }

      try {
        audio.pause();
        audio.src = "";
      } catch {
        // no-op
      }
    };

    const silenceAndStop = () => {
      if (stopTimeoutId) {
        window.clearTimeout(stopTimeoutId);
      }

      const context = audioContextRef.current;
      const gain = masterGainRef.current;

      if (context && gain && context.state !== "closed") {
        try {
          const now = context.currentTime;
          const currentGain = gain.gain.value > 0 ? gain.gain.value : 1;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(currentGain, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        } catch {
          // no-op
        }

        stopTimeoutId = window.setTimeout(() => {
          stopNow();
        }, 95);
        return;
      }

      stopNow();
    };

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
    window.addEventListener("pagehide", silenceAndStop);
    window.addEventListener("beforeunload", silenceAndStop);

    audioElementRef.current = audio;

    return () => {
      if (stopTimeoutId) {
        window.clearTimeout(stopTimeoutId);
      }
      window.removeEventListener("pagehide", silenceAndStop);
      window.removeEventListener("beforeunload", silenceAndStop);
      stopNow();
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("stalled", handleWaiting);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("volumechange", handleVolumeChange);
      audioElementRef.current = null;
      try {
        mediaSourceRef.current?.disconnect();
      } catch {
        // no-op
      }
      try {
        analyserRef.current?.disconnect();
      } catch {
        // no-op
      }
      try {
        masterGainRef.current?.disconnect();
      } catch {
        // no-op
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close().catch(() => undefined);
      }
      mediaSourceRef.current = null;
      analyserRef.current = null;
      masterGainRef.current = null;
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
      const masterGain = context.createGain();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      masterGain.gain.value = 1;

      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(masterGain);
      masterGain.connect(context.destination);

      audioContextRef.current = context;
      mediaSourceRef.current = source;
      analyserRef.current = analyser;
      masterGainRef.current = masterGain;
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

    emitStopPreviews();
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

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    safeSetMediaMetadata(currentTrack);

    try {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch {
      // no-op
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    safeSetActionHandler("play", () => {
      void play();
    });
    safeSetActionHandler("pause", () => {
      pause();
    });
    safeSetActionHandler("stop", () => {
      pause();
    });

    // Disable unused transport controls for a live stream.
    safeSetActionHandler("seekbackward", null);
    safeSetActionHandler("seekforward", null);
    safeSetActionHandler("previoustrack", null);
    safeSetActionHandler("nexttrack", null);
  }, [pause, play]);

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
