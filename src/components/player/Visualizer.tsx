import { useEffect, useRef } from "react";

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

const BAR_COUNT = 36;

export function Visualizer({ analyserNode, isPlaying }: VisualizerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context2d = canvas.getContext("2d");
    if (!context2d) {
      return;
    }

    const data = new Uint8Array(analyserNode?.frequencyBinCount ?? 0);
    const phaseOffset = Math.random() * Math.PI * 2;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      context2d.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      context2d.clearRect(0, 0, width, height);
      context2d.fillStyle = "rgba(3, 16, 33, 0.55)";
      context2d.fillRect(0, 0, width, height);

      if (analyserNode && data.length > 0) {
        analyserNode.getByteFrequencyData(data);
      }

      const now = performance.now();
      const barGap = 4;
      const barWidth = (width - barGap * (BAR_COUNT - 1)) / BAR_COUNT;

      for (let index = 0; index < BAR_COUNT; index += 1) {
        const sampleIndex = data.length > 0 ? Math.floor((index / BAR_COUNT) * data.length) : 0;
        const sampled = data[sampleIndex] ? data[sampleIndex] / 255 : 0;
        const synthetic =
          (Math.sin(now * 0.003 + index * 0.5 + phaseOffset) +
            Math.sin(now * 0.002 + index * 0.23 + phaseOffset * 0.7) +
            2) /
          4;

        const intensity = isPlaying ? Math.max(sampled, synthetic * 0.35) : synthetic * 0.32;
        const barHeight = Math.max(6, intensity * (height - 10));
        const x = index * (barWidth + barGap);
        const y = height - barHeight;

        const gradient = context2d.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, "rgba(255, 124, 67, 0.96)");
        gradient.addColorStop(1, "rgba(55, 203, 176, 0.78)");

        context2d.fillStyle = gradient;
        context2d.fillRect(x, y, barWidth, barHeight);
      }

      animationRef.current = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isPlaying]);

  return <canvas ref={canvasRef} className="audio-visualizer" aria-hidden="true" />;
}
