import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Layout from '@/components/custom/layout';

const AppRouter = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Layout>
  </Router>
);

export default AppRouter;