import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from '@/pages/Home';
import Traduction from '@/pages/Traduction';
import Layout from '@/components/custom/layout';
import ClearCache from '@/pages/ClearCache';
import LocalCharactersPresets from '@/pages/LocalCharactersPresets';
import CharactersPresetsList from '@/pages/CharactersPresetsList';
import UpdatePage from '@/pages/Update';
import PatchNotes from '@/pages/PatchNotes';
import News from '@/pages/News';
import Ships3D from '@/pages/Ships3D';
import Blueprints from '@/pages/Blueprints';

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
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/traduction" element={<Traduction />} />
        <Route path="/cache" element={<ClearCache />} />
        <Route path="/presets-local" element={<LocalCharactersPresets />} />
        <Route path='/presets-remote' element={<CharactersPresetsList />} />
        <Route path='/updates' element={<UpdatePage />} />
        <Route path='/patchnotes' element={<PatchNotes />} />
        <Route path='/news' element={<News />} />
        <Route path='/ships3d' element={<Ships3D />} />
        <Route path='/blueprints' element={<Blueprints />} />
      </Routes>
      </div>
    </Layout>
  </Router>
);

export default AppRouter;