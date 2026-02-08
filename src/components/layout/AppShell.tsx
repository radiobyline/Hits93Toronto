import { Outlet, useLocation } from "react-router-dom";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { usePlayerViewport } from "../../context/PlayerViewportContext";
import { useTheme } from "../../hooks/useTheme";
import { MiniPlayer } from "../player/MiniPlayer";
import { SeoManager } from "../seo/SeoManager";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function AppShell(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const { hasInteracted } = useAudioPlayer();
  const { isMainPlayerInView } = usePlayerViewport();
  const location = useLocation();

  const isHomeRoute = location.pathname === "/";
  const showMiniPlayer = hasInteracted && (!isHomeRoute || !isMainPlayerInView);

  return (
    <div className={`app-root ${showMiniPlayer ? "app-root--with-mini" : ""}`}>
      <SeoManager />
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main
        className={`site-main ${isHomeRoute ? "site-main--home" : ""} ${
          showMiniPlayer ? "site-main--with-mini" : ""
        }`}
      >
        <Outlet />
      </main>
      <Footer withMiniPlayer={showMiniPlayer} />
      {showMiniPlayer && <MiniPlayer />}
    </div>
  );
}
