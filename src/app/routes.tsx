import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { RouteVisitTracker } from "@/app/RouteVisitTracker";
import { AppShell } from "@/components/navigation/AppShell";
import HomePage from "@/features/home/HomePage";
import TranslationPage from "@/features/translation/TranslationPage";
import CachePage from "@/features/cache/CachePage";
import LocalCharactersPage from "@/features/characters-local/LocalCharactersPage";
import CharactersRemotePage from "@/features/characters-remote/CharactersRemotePage";
import UpdatePage from "@/features/update/UpdatePage";
import PatchNotesPage from "@/features/patchnotes/PatchNotesPage";
import NewsPage from "@/features/news/NewsPage";
import Ships3DPage from "@/features/ships3d/Ships3DPage";
import BlueprintsPage from "@/features/blueprints/BlueprintsPage";
import PaintsPage from "@/features/paints/PaintsPage";
import HangarExecPage from "@/features/hangar-exec/HangarExecPage";
import FeaturesHubPage from "@/features/features-hub/FeaturesHubPage";
import SettingsPage from "@/features/settings/SettingsPage";
import StatisticsPage from "@/features/game-stats/StatisticsPage";
import { OnboardingGate } from "@/features/onboarding/OnboardingGate";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const el = document.querySelector(".app-scroll-root");
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
};

const AppRouter = () => (
  <Router>
    <OnboardingGate>
      <AppShell>
        <ScrollToTop />
        <RouteVisitTracker />
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/traduction" element={<TranslationPage />} />
            <Route path="/cache" element={<CachePage />} />
            <Route path="/presets-local" element={<LocalCharactersPage />} />
            <Route path="/presets-remote" element={<CharactersRemotePage />} />
            <Route path="/updates" element={<UpdatePage />} />
            <Route path="/patchnotes" element={<PatchNotesPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/ships3d" element={<Ships3DPage />} />
            <Route path="/blueprints" element={<BlueprintsPage />} />
            <Route path="/statistiques" element={<StatisticsPage />} />
            <Route path="/peintures" element={<PaintsPage />} />
            <Route path="/hangar-exec" element={<HangarExecPage />} />
            <Route path="/fonctionnalites" element={<FeaturesHubPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </AppShell>
    </OnboardingGate>
  </Router>
);

export default AppRouter;
