import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ErrorListPage from './pages/ErrorListPage';
import { TranslationsPage } from './pages/TranslationsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import CreateErrorCodePage from './pages/CreateErrorCodePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="errors" element={<ErrorListPage />} />
        <Route path="errors/new" element={<CreateErrorCodePage />} />
        <Route path="translations" element={<TranslationsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
      </Route>
    </Routes>
  );
}

export default App; 