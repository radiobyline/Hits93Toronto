import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AudioPlayerProvider } from "./context/AudioPlayerContext";
import { PlayerViewportProvider } from "./context/PlayerViewportContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <AudioPlayerProvider>
        <PlayerViewportProvider>
          <App />
        </PlayerViewportProvider>
      </AudioPlayerProvider>
    </HashRouter>
  </React.StrictMode>
);

// Allow transitions after the first paint to avoid theme/FOUC jitter on initial load.
window.requestAnimationFrame(() => {
  document.documentElement.classList.remove("preload");
  window.requestAnimationFrame(() => {
    document.getElementById("boot-overlay")?.remove();
  });
});

if (import.meta.env.PROD) {
  const params = new URLSearchParams(window.location.search);
  const wantsVitals =
    params.has("vitals") ||
    window.location.hash.includes("vitals=1") ||
    window.location.hash.includes("vitals=true");

  if (wantsVitals) {
    void import("./utils/vitals").then((module) => {
      module.initVitalsLogger();
    });
  }
}
