import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Traduction from '@/pages/Traduction';
import Layout from '@/components/custom/layout';
import ClearCache from '@/pages/ClearCache';
import LocalCharactersPresets from '@/pages/LocalCharactersPresets';
import CharactersPresetsList from '@/pages/CharactersPresetsList';
import UpdatesPage from '@/pages/UpdatesPage';

const AppRouter = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/traduction" element={<Traduction />} />
        <Route path="/cache" element={<ClearCache />} />
        <Route path="/presets-local" element={<LocalCharactersPresets />} />
        <Route path='/presets-remote' element={<CharactersPresetsList />} />
        <Route path='/updates' element={<UpdatesPage />} />
      </Routes>
    </Layout>
  </Router>
);

export default AppRouter;