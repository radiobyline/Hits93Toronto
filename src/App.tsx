import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { EmbedPlayerPage } from "./pages/EmbedPlayerPage";
import { FeaturePlaceholderPage } from "./pages/FeaturePlaceholderPage";
import { HomePage } from "./pages/HomePage";
import { JukeboxPage } from "./pages/JukeboxPage";
import { LlmInfoPage } from "./pages/LlmInfoPage";
import { NewsPage } from "./pages/NewsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ProgrammeEpisodePage } from "./pages/ProgrammeEpisodePage";
import { ProgrammePage } from "./pages/ProgrammePage";
import { RecentPage } from "./pages/RecentPage";
import { SchedulePage } from "./pages/SchedulePage";
import { TermsPage } from "./pages/TermsPage";

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/embed/player" element={<EmbedPlayerPage />} />
      <Route path="/" element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="jukebox" element={<JukeboxPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="recent" element={<RecentPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="schedule/programmes/:slug" element={<ProgrammePage />} />
        <Route
          path="schedule/programme/:dateIso/:startMs/:slug"
          element={<ProgrammeEpisodePage />}
        />
        <Route path="schedule/programme/:dateIso/:startMs" element={<ProgrammeEpisodePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="llm-info" element={<LlmInfoPage />} />
        <Route
          path="charts"
          element={
            <FeaturePlaceholderPage
              title="Charts"
              description="Placeholder route for thumbs up/down chart ranking and analytics."
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
