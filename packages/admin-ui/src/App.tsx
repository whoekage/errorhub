import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ErrorListPage from './pages/ErrorListPage';
// import { TranslationsPage } from './pages/TranslationsPage'; // Commented out as the page is deleted
import CategoriesPage from './pages/CategoriesPage';
import CreateErrorCodePage from './pages/CreateErrorCodePage';
import UpdateErrorCodePage from './pages/UpdateErrorCodePage';
import LanguagesPage from './pages/LanguagesPage';
import UpdateCategoryPage from './pages/UpdateCategoryPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="errors" element={<ErrorListPage />} />
        <Route path="errors/new" element={<CreateErrorCodePage />} />
        <Route path="errors/edit/:errorCodeParam" element={<UpdateErrorCodePage />} />
        {/* <Route path="translations" element={<TranslationsPage />} /> */}{/* Commented out as the page is deleted */}
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/edit/:id" element={<UpdateCategoryPage />} />
        <Route path="settings/languages" element={<LanguagesPage />} />
      </Route>
    </Routes>
  );
}

export default App; 