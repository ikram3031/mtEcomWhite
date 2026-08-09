import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout
import DashboardLayout from './layouts/dashboardLayout';

// Auth
import Login from './pages/auth/login';

// Dashboard
import Overview from './pages/dashboard/overview';
import Users from './pages/dashboard/users';
import Reports from './pages/dashboard/reports';
import Members from './pages/dashboard/members';

// Products
import ProductsList from './pages/dashboard/products/productsList';
import ProductDetails from './pages/dashboard/products/productDetails';
import NewProduct from './pages/dashboard/products/newProduct';
import Stock from './pages/dashboard/products/stock';
import Coupons from './pages/dashboard/products/coupons';
import Categories from './pages/dashboard/products/categories';
import Brands from './pages/dashboard/products/brands';
import Attributes from './pages/dashboard/products/attributes';

// Orders
import OrdersList from './pages/dashboard/orders/ordersList';
import OrderDetails from './pages/dashboard/orders/orderDetails';
import NewOrder from './pages/dashboard/orders/newOrder';

// Billing
import BillingOverview from './pages/dashboard/billing/billingOverview';
import Payments from './pages/dashboard/billing/payments';
import Billings from './pages/dashboard/billing/billings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { path: '', element: <Overview /> },
      { path: 'users', element: <Users /> },
      { path: 'reports', element: <Reports /> },
      { path: 'members', element: <Members /> },
      {
        path: 'products',
        children: [
          { path: '', element: <ProductsList /> },
          { path: 'new', element: <NewProduct /> },
          { path: 'stock', element: <Stock /> },
          { path: 'coupons', element: <Coupons /> },
          { path: 'categories', element: <Categories /> },
          { path: 'brands', element: <Brands /> },
          { path: 'attributes', element: <Attributes /> },
          { path: ':id', element: <ProductDetails /> },
        ],
      },
      {
        path: 'orders',
        children: [
          { path: '', element: <OrdersList /> },
          { path: 'new', element: <NewOrder /> },
          { path: ':id', element: <OrderDetails /> },
        ],
      },
      {
        path: 'billing',
        children: [
          { path: '', element: <BillingOverview /> },
          { path: 'payments', element: <Payments /> },
          { path: 'billings', element: <Billings /> },
        ],
      },
    ],
  },
]);
