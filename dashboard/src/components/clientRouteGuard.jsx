import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clientConfig } from '@/clientConfig';

// Map pathnames to required menu permission keys
const getRequiredPermission = (pathname) => {
  const cleanPath = pathname.replace(/\/$/, ''); // Strip trailing slash

  if (cleanPath === '/dashboard') return 'overview';
  if (cleanPath === '/dashboard/orders/new') return 'orders.new';
  if (cleanPath.startsWith('/dashboard/orders')) return 'orders.list';
  
  if (cleanPath === '/dashboard/products/new') return 'products.new';
  if (cleanPath === '/dashboard/products/categories') return 'products.categories';
  if (cleanPath === '/dashboard/products/brands') return 'products.brands';
  if (cleanPath === '/dashboard/products/attributes') return 'products.attributes';
  if (cleanPath === '/dashboard/products/coupons') return 'products.coupons';
  if (cleanPath.startsWith('/dashboard/products')) return 'products.list';

  if (cleanPath.startsWith('/dashboard/members')) return 'members';

  if (cleanPath === '/dashboard/billing/billings') return 'billing.billings';
  if (cleanPath === '/dashboard/billing/payments') return 'billing.payments';
  if (cleanPath.startsWith('/dashboard/billing')) return 'billing';

  if (cleanPath.startsWith('/dashboard/reports')) return 'reports';
  if (cleanPath.startsWith('/dashboard/users')) return 'users';
  if (cleanPath.startsWith('/dashboard/developer')) return 'developer';

  return null; // Public or root dashboard path
};

export const ClientRouteGuard = ({ children }) => {
  const location = useLocation();
  const requiredPermission = getRequiredPermission(location.pathname);
  
  const allowedMenus = clientConfig.allowedMenus || [];
  
  if (requiredPermission && !allowedMenus.includes(requiredPermission)) {
    // Redirect to dashboard root if client lacks permission
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ClientRouteGuard;
