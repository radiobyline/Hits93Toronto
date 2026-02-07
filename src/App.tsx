import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { EmbedPlayerPage } from "./pages/EmbedPlayerPage";
import { FeaturePlaceholderPage } from "./pages/FeaturePlaceholderPage";
import { HomePage } from "./pages/HomePage";
import { RecentPage } from "./pages/RecentPage";
import { SchedulePage } from "./pages/SchedulePage";

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/embed/player" element={<EmbedPlayerPage />} />
      <Route path="/" element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="recent" element={<RecentPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route
          path="jukebox"
          element={
            <FeaturePlaceholderPage
              title="Jukebox"
              description="Placeholder route for full requests + shoutouts programme tools."
            />
          }
        />
        <Route
          path="charts"
          element={
            <FeaturePlaceholderPage
              title="Charts"
              description="Placeholder route for thumbs up/down chart ranking and analytics."
            />
          }
        />
        <Route
          path="news"
          element={
            <FeaturePlaceholderPage
              title="News"
              description="Placeholder route for station news and editorial updates."
            />
          }
        />
        <Route
          path="privacy"
          element={
            <FeaturePlaceholderPage
              title="Privacy"
              description="Placeholder route for privacy policy content."
            />
          }
        />
        <Route
          path="terms"
          element={
            <FeaturePlaceholderPage
              title="Terms"
              description="Placeholder route for terms and conditions."
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
