import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clientConfig } from '@/clientConfig';

// Maps request path to corresponding menu permission key
const getRequiredPermission = (pathname) => {
  const cleanPath = pathname.replace(/\/$/, '');

  if (cleanPath === '/dashboard') return 'overview';
  if (cleanPath === '/dashboard/orders/new') return 'orders.new';
  if (cleanPath.startsWith('/dashboard/orders')) return 'orders.list';
  
  if (cleanPath === '/dashboard/products/new') return 'products.new';
  if (cleanPath === '/dashboard/products/categories') return 'products.categories';
  if (cleanPath === '/dashboard/products/brands') return 'products.brands';
  if (cleanPath === '/dashboard/products/attributes') return 'products.attributes';
  if (cleanPath === '/dashboard/products/coupons') return 'products.coupons';
  if (cleanPath === '/dashboard/products/size-charts') return 'products.size-charts';
  if (cleanPath.startsWith('/dashboard/products')) return 'products.list';

  if (cleanPath.startsWith('/dashboard/members')) return 'members';

  if (cleanPath === '/dashboard/billing/billings') return 'billing.billings';
  if (cleanPath === '/dashboard/billing/payments') return 'billing.payments';
  if (cleanPath.startsWith('/dashboard/billing')) return 'billing';

  if (cleanPath.startsWith('/dashboard/reports')) return 'reports';
  if (cleanPath.startsWith('/dashboard/users')) return 'users';
  if (cleanPath.startsWith('/dashboard/developer')) return 'developer';

  return null;
};

// Protects dashboard routes matching tenant allowedMenus and capability flags
export const ClientRouteGuard = ({ children }) => {
  const location = useLocation();
  const requiredPermission = getRequiredPermission(location.pathname);
  const allowedMenus = clientConfig.allowedMenus || [];
  const features = clientConfig.features || {};

  if (requiredPermission === 'products.size-charts' && !features?.sizeChart) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPermission && !allowedMenus.includes(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ClientRouteGuard;
