import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from '@/pages/Home';
import Traduction from '@/pages/Traduction';
import Layout from '@/components/custom/layout';
import ClearCache from '@/pages/ClearCache';
import LocalCharactersPresets from '@/pages/LocalCharactersPresets';
import CharactersPresetsList from '@/pages/CharactersPresetsList';
import UpdatesPage from '@/pages/UpdatesPage';
import PatchNotes from '@/pages/PatchNotes';
import News from '@/pages/News';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const el = document.querySelector('.app-scroll-root');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

const AppRouter = () => (
  <Router>
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/traduction" element={<Traduction />} />
        <Route path="/cache" element={<ClearCache />} />
        <Route path="/presets-local" element={<LocalCharactersPresets />} />
        <Route path='/presets-remote' element={<CharactersPresetsList />} />
        <Route path='/updates' element={<UpdatesPage />} />
        <Route path='/patchnotes' element={<PatchNotes />} />
        <Route path='/news' element={<News />} />
      </Routes>
    </Layout>
  </Router>
);

export default AppRouter;