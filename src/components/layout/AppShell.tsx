import { Outlet, useLocation } from "react-router-dom";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { usePlayerViewport } from "../../context/PlayerViewportContext";
import { useTheme } from "../../hooks/useTheme";
import { Header } from "./Header";
import { MiniPlayer } from "../player/MiniPlayer";

export function AppShell(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const { hasInteracted } = useAudioPlayer();
  const { isMainPlayerInView } = usePlayerViewport();
  const location = useLocation();

  const isHomeRoute = location.pathname === "/";
  const showMiniPlayer = hasInteracted && (!isHomeRoute || !isMainPlayerInView);

  return (
    <div className="app-root">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className={`site-main ${showMiniPlayer ? "site-main--with-mini" : ""}`}>
        <Outlet />
      </main>
      {showMiniPlayer && <MiniPlayer />}
    </div>
  );
}
