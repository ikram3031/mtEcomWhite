import coreConfig from '@/config/core.json';

/**
 * Validates whether a specific user role has access to a given menu or submenu key.
 * 
 * Rules:
 * 1. Owner and Admin roles have full wildcard ('*') access.
 * 2. Parent-Submenu Hierarchy: If checking a submenu (e.g. 'products.list'), 
 *    the parent menu ('products') MUST also be allowed for that role.
 * 
 * @param {string} role - The user's role (e.g. 'Owner', 'Admin', 'Manager', 'Marketing Expert')
 * @param {string} menuKey - The menu/permission key (e.g. 'products', 'products.list', 'tools', 'tools.meta-catalog')
 * @returns {boolean} True if the role is allowed access
 */
export function hasMenuAccess(role, menuKey) {
  if (!role || !menuKey) return false;

  const normalizedRole = String(role).trim();
  const roleConfig =
    coreConfig?.userRoles?.[normalizedRole] ||
    coreConfig?.userRoles?.[normalizedRole.replace(/\s+/g, '-')] ||
    coreConfig?.userRoles?.[normalizedRole.replace(/-/g, ' ')];

  if (!roleConfig || !Array.isArray(roleConfig.allowedMenus)) {
    return false;
  }

  const { allowedMenus } = roleConfig;

  // Wildcard access for Owner / Admin
  if (allowedMenus.includes('*')) {
    return true;
  }

  // Parent & Submenu Hierarchy Check
  // E.g., for 'products.list' or 'tools.meta-catalog'
  if (menuKey.includes('.')) {
    const parentKey = menuKey.split('.')[0];
    // If parent menu is not allowed, child cannot be accessed
    if (!allowedMenus.includes(parentKey)) {
      return false;
    }
  }

  return allowedMenus.includes(menuKey);
}

/**
 * Gets the default landing route URL for a given role upon login.
 * 
 * @param {string} role - The user's role
 * @returns {string} The path to redirect to
 */
export function getDefaultRedirect(role) {
  if (!role) return '/login';

  if (hasMenuAccess(role, 'overview')) {
    return '/dashboard';
  }

  if (hasMenuAccess(role, 'products.list')) {
    return '/dashboard/products/list';
  }

  if (hasMenuAccess(role, 'orders.list')) {
    return '/dashboard/orders/list';
  }

  if (hasMenuAccess(role, 'tools.bulk-image-resize')) {
    return '/dashboard/tools/bulk-image-resize';
  }

  return '/dashboard';
}
