import { useEffect, useRef } from "react";

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
}

export function Visualizer({ analyserNode, isActive }: VisualizerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context2d = canvas.getContext("2d");

    if (!context2d) {
      return;
    }

    const data = new Uint8Array(analyserNode.frequencyBinCount);

    const draw = () => {
      analyserNode.getByteFrequencyData(data);

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
      draw();
    } else {
      context2d.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isActive]);

  return <canvas ref={canvasRef} className="audio-visualizer" aria-hidden="true" />;
}
