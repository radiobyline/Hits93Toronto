import { useEffect, useRef } from "react";

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  mode?: "bars" | "ring";
}

const BAR_COUNT = 36;

export function Visualizer({ analyserNode, isPlaying, mode = "bars" }: VisualizerProps): JSX.Element {
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

    const drawBars = (width: number, height: number, now: number) => {
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
    };

    const drawRing = (width: number, height: number, now: number) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.48;
      const ringBars = 80;

      context2d.strokeStyle = "rgba(255, 255, 255, 0.14)";
      context2d.lineWidth = 2;
      context2d.beginPath();
      context2d.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context2d.stroke();

      for (let index = 0; index < ringBars; index += 1) {
        const angle = (index / ringBars) * Math.PI * 2;
        const sampleIndex = data.length > 0 ? Math.floor((index / ringBars) * data.length) : 0;
        const sampled = data[sampleIndex] ? data[sampleIndex] / 255 : 0;
        const synthetic =
          (Math.sin(now * 0.004 + index * 0.35 + phaseOffset) +
            Math.sin(now * 0.0027 + index * 0.18 + phaseOffset * 0.6) +
            2) /
          4;
        const intensity = isPlaying ? Math.max(sampled, synthetic * 0.3) : synthetic * 0.28;
        const length = 4 + intensity * 20;

        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;
        const endX = centerX + Math.cos(angle) * (radius + length);
        const endY = centerY + Math.sin(angle) * (radius + length);

        const gradient = context2d.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, "rgba(255, 124, 67, 0.78)");
        gradient.addColorStop(1, "rgba(55, 203, 176, 0.92)");

        context2d.strokeStyle = gradient;
        context2d.lineWidth = 2;
        context2d.beginPath();
        context2d.moveTo(startX, startY);
        context2d.lineTo(endX, endY);
        context2d.stroke();
      }
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      context2d.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      context2d.clearRect(0, 0, width, height);
      if (mode === "bars") {
        context2d.fillStyle = "rgba(3, 16, 33, 0.55)";
        context2d.fillRect(0, 0, width, height);
      }

      if (analyserNode && data.length > 0) {
        analyserNode.getByteFrequencyData(data);
      }

      const now = performance.now();
      if (mode === "ring") {
        drawRing(width, height, now);
      } else {
        drawBars(width, height, now);
      }

      animationRef.current = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isPlaying, mode]);

  return (
    <canvas
      ref={canvasRef}
      className={`audio-visualizer ${mode === "ring" ? "audio-visualizer--ring" : ""}`}
      aria-hidden="true"
    />
  );
}
