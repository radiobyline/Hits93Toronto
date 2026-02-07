import { useEffect, useRef } from "react";

interface VisualizerProps {
  audioElement: HTMLAudioElement | null;
  isActive: boolean;
}

export function Visualizer({ audioElement, isActive }: VisualizerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) {
      return;
    }

    if (!audioContextRef.current) {
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;

      const source = context.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(context.destination);

      audioContextRef.current = context;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    }

    const canvas = canvasRef.current;
    const context2d = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const audioContext = audioContextRef.current;

    if (!context2d || !analyser || !audioContext) {
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(data);

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      context2d.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      context2d.clearRect(0, 0, width, height);
      context2d.fillStyle = "rgba(255, 255, 255, 0.06)";
      context2d.fillRect(0, 0, width, height);

      const barCount = 32;
      const barGap = 4;
      const barWidth = (width - barGap * (barCount - 1)) / barCount;

      for (let index = 0; index < barCount; index += 1) {
        const sample = data[Math.floor((index / barCount) * data.length)] / 255;
        const barHeight = Math.max(4, sample * (height - 8));
        const x = index * (barWidth + barGap);
        const y = height - barHeight;

        const gradient = context2d.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, "rgba(255, 124, 67, 0.95)");
        gradient.addColorStop(1, "rgba(55, 203, 176, 0.8)");

        context2d.fillStyle = gradient;
        context2d.fillRect(x, y, barWidth, barHeight);
      }

      animationRef.current = window.requestAnimationFrame(draw);
    };

    if (isActive) {
      void audioContext.resume();
      draw();
    } else {
      context2d.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isActive]);

  return <canvas ref={canvasRef} className="audio-visualizer" aria-hidden="true" />;
}
