import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout
import DashboardLayout from './layouts/dashboardLayout';

// Auth & Onboarding
import Login from './pages/auth/login';
import InvitePage from './pages/invite';

// Dashboard
import Overview from './pages/dashboard/overview';
import Users from './pages/dashboard/users';
import Reports from './pages/dashboard/reportsV2';
import Members from './pages/dashboard/members';
import Trash from './pages/dashboard/trash';
import ActivityLogs from './pages/dashboard/activityLogs';
import Reviews from './pages/dashboard/reviews';
import SettingsPage from './pages/dashboard/settings';
import AllMedia from './pages/dashboard/allMedia';

// Products
import ProductsList from './pages/dashboard/products/productsList';
import ProductDetails from './pages/dashboard/products/productDetails';
import AddNewProduct from './pages/dashboard/products/addNewProduct';
// import Stock from './pages/dashboard/products/stock';
import Coupons from './pages/dashboard/products/coupons';
import Categories from './pages/dashboard/products/categories';
import Brands from './pages/dashboard/products/brands';
import Attributes from './pages/dashboard/products/attributes';
import EditAttribute from './pages/dashboard/products/editAttribute';

// Orders
import OrdersList from './pages/dashboard/orders/ordersList';
import OrderDetails from './pages/dashboard/orders/orderDetails';
import NewOrder from './pages/dashboard/orders/newOrder';

// Billing
import BillingOverview from './pages/dashboard/billing/billingOverview';
import Payments from './pages/dashboard/billing/payments';
import Billings from './pages/dashboard/billing/billings';

// Tools
import BulkImageResize from './pages/dashboard/tools/bulkImageResize';
import MetaCatalog from './pages/dashboard/tools/metaCatalog';
import SystemLogs from './pages/dashboard/tools/systemLogs';

// AI Studio
import Studio from './pages/dashboard/studio/index';
import BatchImagesStudio from './pages/dashboard/studio/batchImages';

// RBAC & Guard
import RoleGuard from './components/RoleGuard';
import NotFound from './components/NotFound';
import { RouteErrorElement } from './components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
    errorElement: <RouteErrorElement />,
  },
  {
    path: '/invite',
    element: <InvitePage />,
    errorElement: <RouteErrorElement />,
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        path: '',
        element: (
          <RoleGuard menuKey="overview">
            <Overview />
          </RoleGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleGuard menuKey="users">
            <Users />
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard menuKey="reports">
            <Reports />
          </RoleGuard>
        ),
      },
      {
        path: 'members',
        element: (
          <RoleGuard menuKey="members">
            <Members />
          </RoleGuard>
        ),
      },
      {
        path: 'reviews',
        element: (
          <RoleGuard menuKey="reviews">
            <Reviews />
          </RoleGuard>
        ),
      },
      {
        path: 'trash',
        element: (
          <RoleGuard menuKey="trash">
            <Trash />
          </RoleGuard>
        ),
      },
      {
        path: 'activity-logs',
        element: (
          <RoleGuard menuKey="activity-logs">
            <ActivityLogs />
          </RoleGuard>
        ),
      },
      {
        path: 'logs',
        element: (
          <RoleGuard menuKey="logs">
            <SystemLogs />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoleGuard menuKey="settings">
            <SettingsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'media',
        element: <AllMedia />,
      },
      {
        path: 'tools',
        children: [
          { path: '', element: <Navigate to="bulk-image-resize" replace /> },
          {
            path: 'bulk-image-resize',
            element: (
              <RoleGuard menuKey="tools.bulk-image-resize">
                <BulkImageResize />
              </RoleGuard>
            ),
          },
          {
            path: 'meta-catalog',
            element: (
              <RoleGuard menuKey="tools.meta-catalog">
                <MetaCatalog />
              </RoleGuard>
            ),
          },
          { path: 'logs', element: <Navigate to="/dashboard/logs" replace /> },
        ],
      },
      {
        path: 'developer',
        children: [
          { path: 'bulk-image-resize', element: <Navigate to="/dashboard/tools/bulk-image-resize" replace /> },
          { path: 'meta-catalog', element: <Navigate to="/dashboard/tools/meta-catalog" replace /> },
          { path: 'logs', element: <Navigate to="/dashboard/logs" replace /> },
        ],
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            element: (
              <RoleGuard menuKey="products.list">
                <ProductsList />
              </RoleGuard>
            ),
          },
          {
            path: 'list',
            element: (
              <RoleGuard menuKey="products.list">
                <ProductsList />
              </RoleGuard>
            ),
          },
          {
            path: 'new',
            element: (
              <RoleGuard menuKey="products.new">
                <AddNewProduct />
              </RoleGuard>
            ),
          },
          /* {
            path: 'stock',
            element: (
              <RoleGuard menuKey="products.list">
                <Stock />
              </RoleGuard>
            ),
          }, */
          {
            path: 'coupons',
            element: (
              <RoleGuard menuKey="products.coupons">
                <Coupons />
              </RoleGuard>
            ),
          },
          { path: 'reviews', element: <Navigate to="/dashboard/reviews" replace /> },
          {
            path: 'categories',
            element: (
              <RoleGuard menuKey="products.categories">
                <Categories />
              </RoleGuard>
            ),
          },
          {
            path: 'brands',
            element: (
              <RoleGuard menuKey="products.brands">
                <Brands />
              </RoleGuard>
            ),
          },
          {
            path: 'attributes',
            element: (
              <RoleGuard menuKey="products.attributes">
                <Attributes />
              </RoleGuard>
            ),
          },
          {
            path: 'attributes/:id',
            element: (
              <RoleGuard menuKey="products.attributes">
                <EditAttribute />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard menuKey="products.list">
                <ProductDetails />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'orders',
        children: [
          {
            path: '',
            element: (
              <RoleGuard menuKey="orders.list">
                <OrdersList />
              </RoleGuard>
            ),
          },
          {
            path: 'list',
            element: (
              <RoleGuard menuKey="orders.list">
                <OrdersList />
              </RoleGuard>
            ),
          },
          {
            path: 'new',
            element: (
              <RoleGuard menuKey="orders.new">
                <NewOrder />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard menuKey="orders.list">
                <OrderDetails />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'billing',
        children: [
          {
            path: '',
            element: (
              <RoleGuard menuKey="billing">
                <BillingOverview />
              </RoleGuard>
            ),
          },
          {
            path: 'payments',
            element: (
              <RoleGuard menuKey="billing.payments">
                <Payments />
              </RoleGuard>
            ),
          },
          {
            path: 'billings',
            element: (
              <RoleGuard menuKey="billing.billings">
                <Billings />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'studio',
        element: (
          <RoleGuard menuKey="studio">
            <Studio />
          </RoleGuard>
        ),
        children: [
          { path: '', element: <Navigate to="batch-images" replace /> },
          {
            path: 'batch-images',
            element: (
              <RoleGuard menuKey="studio.batch-images">
                <BatchImagesStudio />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
