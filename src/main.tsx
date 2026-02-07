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
