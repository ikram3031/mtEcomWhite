import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { hasMenuAccess } from '@/lib/rbac';
import NotFound from '@/components/NotFound';

/**
 * RoleGuard Component
 * 
 * Guards dashboard routes by validating if the logged-in user's role
 * has permission for the specified menuKey.
 * 
 * If unauthorized, renders the 404 <NotFound /> page as per requirement.
 */
export default function RoleGuard({ menuKey, children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 p-8 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-64 w-full bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  // Check role permission
  const userRole = user?.role || 'Marketing Expert';
  const isAllowed = hasMenuAccess(userRole, menuKey);

  if (!isAllowed) {
    return <NotFound />;
  }

  return children;
}
