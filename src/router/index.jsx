import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SettingsLayout from '../layouts/SettingsLayout';

// Pages
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import RegionSettings from '../pages/Settings/RegionSettings';
import PriceSettings from '../pages/Settings/PriceSettings';
import PostalSettings from '../pages/Settings/PostalSettings';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'settings/regions',
        element: <RegionSettings />,
      },
      {
        path: 'settings/prices',
        element: <PriceSettings />,
      },
      {
        path: 'settings/postal-codes',
        element: <PostalSettings />,
      },
      {
        path: 'settings-old',
        element: <SettingsLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/settings-old/regions" replace />,
          },
          {
            path: 'regions',
            element: <RegionSettings />,
          },
          {
            path: 'prices',
            element: <PriceSettings />,
          },
          {
            path: 'postal-codes',
            element: <PostalSettings />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;