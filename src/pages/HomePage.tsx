import { useEffect, useRef } from "react";
import { MainPlayerHero } from "../components/player/MainPlayerHero";
import { usePlayerViewport } from "../context/PlayerViewportContext";

export function HomePage(): JSX.Element {
  const heroRef = useRef<HTMLElement>(null);
  const { setMainPlayerInView } = usePlayerViewport();

  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setMainPlayerInView(entry.isIntersecting && entry.intersectionRatio > 0.25);
      },
      {
        threshold: [0.1, 0.25, 0.5]
      }
    );

    observer.observe(heroElement);

    return () => {
      observer.disconnect();
      setMainPlayerInView(true);
    };
  }, [setMainPlayerInView]);

  return (
    <div className="container">
      <MainPlayerHero rootRef={heroRef} />
    </div>
  );
}
