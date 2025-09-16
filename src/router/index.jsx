import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '../layouts/MainLayout';
import FSAManagementLayout from '../layouts/FSAManagementLayout';
import TruckManagementLayout from '../layouts/TruckManagementLayout';
import TruckDeliveryLayout from '../layouts/TruckDeliveryLayout';

// Hub Pages
import DashboardHub from '../pages/Dashboards/DashboardHub';
import ManagementHub from '../pages/Management/ManagementHub';

// Dashboard Pages
import FSADashboard from '../pages/Dashboard'; // Using existing Dashboard as FSADashboard
import TruckDeliveryDashboard from '../pages/TruckDelivery/Dashboard';

// Settings Pages
import Settings from '../pages/Settings';
import RegionSettings from '../pages/Settings/RegionSettings';
import PriceSettings from '../pages/Settings/PriceSettings';
import PostalSettings from '../pages/Settings/PostalSettings';

// Other Pages
import NotFound from '../pages/NotFound';

// Lazy load Truck Delivery pages
const TruckDelivery = lazy(() => import('../pages/TruckDelivery'));
const CityView = lazy(() => import('../pages/TruckDelivery/CityView'));
const MapTest = lazy(() => import('../pages/MapTest'));
const FSADataManager = lazy(() => import('../components/FSADataManager'));

// Lazy load Provider Management pages
const ProviderManagement = lazy(() => import('../pages/Providers'));

// Import Truck Delivery pages
import RegionsPage from '../pages/TruckDelivery/RegionsPage';
import PricingPage from '../pages/TruckDelivery/PricingPage';
import SkidPricingPage from '../pages/TruckDelivery/SkidPricingPage';
import PricingDashboard from '../pages/TruckDelivery/PricingDashboard';
import DataMigrationTool from '../pages/TruckDelivery/DataMigrationTool';

// Test Pages
import TestSkidPricing from '../pages/TestSkidPricing';
import TestFSAGroups from '../pages/TestFSAGroups';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboards" replace />,
      },
      // Dashboard Routes
      {
        path: 'dashboards',
        element: <DashboardHub />,
      },
      {
        path: 'dashboards/fsa',
        element: <FSADashboard />,
      },
      {
        path: 'dashboards/truck-delivery',
        element: <TruckDeliveryDashboard />,  // 使用正确的TruckDeliveryDashboard组件
      },
      // Management Routes
      {
        path: 'management',
        element: <ManagementHub />,
      },
      {
        path: 'management/fsa',
        element: <FSAManagementLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/management/fsa/regions" replace />,
          },
          {
            path: 'data',
            element: (
              <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
                <FSADataManager />
              </Suspense>
            ),
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
      {
        path: 'management/truck-delivery',
        element: <TruckManagementLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/management/truck-delivery/cities" replace />,
          },
          {
            path: 'cities',
            element: (
              <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
                <TruckDelivery />
              </Suspense>
            ),
          },
          {
            path: 'regions',
            element: <RegionsPage />,
          },
          {
            path: 'pricing',
            element: <PricingPage />,
          },
          {
            path: 'dynamic-pricing',
            element: <PricingDashboard />,
          },
          {
            path: 'skid-pricing',
            element: <SkidPricingPage />,
          },
          {
            path: 'migration',
            element: <DataMigrationTool />,
          },
          {
            path: 'map-test',
            element: (
              <Suspense fallback={<div className="flex items-center justify-center h-screen">加载地图组件...</div>}>
                <MapTest />
              </Suspense>
            ),
          },
          {
            path: 'providers',
            element: (
              <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
                <ProviderManagement />
              </Suspense>
            ),
          },
        ],
      },
      // Legacy truck delivery routes (for backward compatibility)
      {
        path: 'truck-delivery/city/:cityId',
        element: (
          <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
            <CityView />
          </Suspense>
        ),
      },
      // Provider Management Routes (redirect to new location)
      {
        path: 'management/providers',
        element: <Navigate to="/management/truck-delivery/providers" replace />,
      },
      // Keep legacy route for backward compatibility
      {
        path: 'providers',
        element: <Navigate to="/management/truck-delivery/providers" replace />,
      },
      // Test Routes
      {
        path: 'test-skid-pricing',
        element: <TestSkidPricing />,
      },
      {
        path: 'test-fsa-groups',
        element: <TestFSAGroups />,
      },
      // Settings Route
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;