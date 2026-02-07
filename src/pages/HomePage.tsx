import { useEffect, useRef } from "react";
import { MainPlayerHero } from "../components/player/MainPlayerHero";
import { usePlayerViewport } from "../context/PlayerViewportContext";

export function HomePage(): JSX.Element {
  const heroRef = useRef<HTMLElement>(null);
  const miniPlayerSentinelRef = useRef<HTMLDivElement>(null);
  const { setMainPlayerInView } = usePlayerViewport();

  useEffect(() => {
    const marker = miniPlayerSentinelRef.current;
    if (!marker) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const sentinelIsBelowViewport = entry.boundingClientRect.top > 0;
        setMainPlayerInView(entry.isIntersecting || sentinelIsBelowViewport);
      },
      {
        threshold: [0, 0.01]
      }
    );

    observer.observe(marker);

    return () => {
      observer.disconnect();
      setMainPlayerInView(true);
    };
  }, [setMainPlayerInView]);

  return (
    <div className="home-page">
      <div className="container container--hero">
        <MainPlayerHero rootRef={heroRef} miniPlayerSentinelRef={miniPlayerSentinelRef} />
      </div>
    </div>
  );
}
