import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import MainLayout from '../layouts/MainLayout';
import FSAManagementLayout from '../layouts/FSAManagementLayout';
import TruckManagementLayout from '../layouts/TruckManagementLayout';
import TruckDeliveryLayout from '../layouts/TruckDeliveryLayout';
import PrivateRoute from '../components/PrivateRoute';

// Hub Pages
import DashboardHub from '../pages/DashboardHub';
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
const FSADataManager = lazy(() => import('../components/FSADataManager'));

// Lazy load Provider Management pages
const ProviderManagement = lazy(() => import('../pages/Providers'));

// Import Truck Delivery pages
import RegionsPage from '../pages/TruckDelivery/RegionsPage';
import PricingConfigPageV3 from '../pages/TruckDelivery/PricingConfigPageV3';

// Import Auth pages
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';

// Import Account Management
import AccountManagement from '../pages/Settings/AccountManagement';
import AccountSettings from '../pages/Settings/AccountSettings';

// Import Permission Management
import PermissionManager from '../components/permissions/PermissionManager';



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
        path: 'dashboard',
        element: <FSADashboard />,
      },
      {
        path: 'truck-delivery/dashboard',
        element: <TruckDeliveryDashboard />,
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
            path: 'pricing-config',
            element: <PricingConfigPageV3 />,
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

      // Settings Routes
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'settings/account',
        element: (
          <PrivateRoute>
            <AccountSettings />
          </PrivateRoute>
        ),
      },
      // Account Management Route (只有 SUPER_ADMIN 可访问)
      {
        path: 'settings/account-management',
        element: (
          <PrivateRoute requiredRoles={['SUPER_ADMIN']}>
            <AccountManagement />
          </PrivateRoute>
        ),
      },
      // Permission Management Route (只有 ADMIN 和 SUPER_ADMIN 可访问)
      {
        path: 'settings/permissions',
        element: (
          <PrivateRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
            <PermissionManager />
          </PrivateRoute>
        ),
      },
    ],
  },
  // Auth Routes (不需要认证)
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;