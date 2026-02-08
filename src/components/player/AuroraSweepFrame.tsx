import { useEffect, useRef } from "react";

interface AuroraSweepFrameProps {
  analyserNode: AnalyserNode | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function AuroraSweepFrame({ analyserNode }: AuroraSweepFrameProps): JSX.Element {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const applyPreference = () => {
      reduceMotionRef.current = media.matches;
      frameRef.current?.classList.toggle("aurora-frame--reduced", media.matches);
    };

    applyPreference();
    media.addEventListener("change", applyPreference);

    return () => {
      media.removeEventListener("change", applyPreference);
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const data = new Uint8Array(analyserNode?.frequencyBinCount ?? 0);
    let smoothedEnergy = 0.34;
    let fallbackPhase = 0;
    let rafId = 0;

    const tick = () => {
      let nextEnergy = 0;
      fallbackPhase += 0.018;
      const fallbackEnergy =
        0.32 +
        Math.sin(fallbackPhase) * 0.08 +
        Math.sin(fallbackPhase * 0.37) * 0.06 +
        Math.sin(fallbackPhase * 0.21) * 0.04;

      if (analyserNode && data.length > 0) {
        analyserNode.getByteFrequencyData(data);

        let sum = 0;
        for (let index = 2; index < data.length; index += 2) {
          sum += data[index];
        }

        const average = sum / Math.max(1, data.length / 2);
        nextEnergy = clamp((average / 255) * 1.75, 0.1, 1);
        nextEnergy = Math.max(nextEnergy, fallbackEnergy * 0.85);
      } else {
        nextEnergy = fallbackEnergy;
      }

      smoothedEnergy = smoothedEnergy * 0.82 + nextEnergy * 0.18;
      const energy = clamp(smoothedEnergy, 0.12, 1);

      const glowPx = 6 + energy * 18;
      const durationSec = reduceMotionRef.current ? 14 : 10 - energy * 4.2;
      const segmentPercent = 10 + energy * 26;
      const cornerGlow = 0.28 + energy * 0.58;

      frame.style.setProperty("--aurora-energy", energy.toFixed(3));
      frame.style.setProperty("--aurora-glow", `${glowPx.toFixed(2)}px`);
      frame.style.setProperty("--aurora-duration", `${durationSec.toFixed(2)}s`);
      frame.style.setProperty("--aurora-segment", `${segmentPercent.toFixed(2)}%`);
      frame.style.setProperty("--aurora-corner", cornerGlow.toFixed(3));

      rafId = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [analyserNode]);

  return <div className="aurora-frame" ref={frameRef} aria-hidden="true" />;
}
