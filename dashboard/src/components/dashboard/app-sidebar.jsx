import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CreditCard,
  BarChart3,
  ShieldAlert,
  ListOrdered,
  PlusCircle,
  Package,
  Receipt,
  Ticket,
  X,
  Menu,
  Sliders,
  Terminal,
  Database,
  Sparkles,
  ShieldCheck,
  Activity,
  Trash2,
  Star,
  Wrench,
  ImageDown,
  Share2,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Mail,
  Image as ImageIcon,
  LineChart,
  LifeBuoy,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import pkg from "../../../package.json"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { DecantreLogo } from "@/components/DecantreLogo"
import { useAuth } from "@/lib/auth-context"
import { clientConfig } from "@/clientConfig"
import { hasMenuAccess } from "@/lib/rbac"

export function AppSidebar({ ...props }) {
  const location = useLocation()
  const pathname = location.pathname
  const { user, logout } = useAuth()
  const { state, setOpen } = useSidebar()
  const { brandName, features } = clientConfig

  // Single-open accordion state: only one parent submenu open at a time
  const [openMenu, setOpenMenu] = React.useState(null)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = React.useState(false)

  const toggleMenu = (menuKey) => {
    setOpenMenu((prev) => (prev === menuKey ? null : menuKey))
  }

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false)
    logout()
  }

  const userRole = user?.role || "Marketing Expert"

  const isAllowed = (menuKey) => {
    // 1. Check feature flags first
    if (menuKey === "products.brands" && features?.brand === false) return false
    if (menuKey === "season" && features?.season === false) return false

    // 2. Check RBAC role permissions
    return hasMenuAccess(userRole, menuKey)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          {state === "expanded" ? (
            <>
              <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                <DecantreLogo className="h-5 w-auto max-w-[115px] text-primary shrink-0" iconOnly={false} />
                <span className="text-[10px] font-mono font-medium text-muted-foreground/75 tracking-wider pl-0.5">
                  v{pkg.version || "3.2.2"}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center justify-center shrink-0"
                title="Close Sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center justify-center shrink-0"
              title="Open Sidebar"
            >
              <Menu className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-4">
        <SidebarMenu className="group-data-[collapsible=icon]:gap-4">
          {/* Overview */}
          {isAllowed("overview") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard"}
                tooltip="Overview"
                render={<Link to="/dashboard" />}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Orders */}
          {isAllowed("orders") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/orders")}
                tooltip="Orders"
                onClick={() => toggleMenu("orders")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Orders</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "orders" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "orders" && (
                <SidebarMenuSub>
                  {isAllowed("orders.new") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders/new"}
                        render={<Link to="/dashboard/orders/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>New In-Store Order</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("orders.list") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders"}
                        render={<Link to="/dashboard/orders" />}
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        <span>Orders List</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {/* Products Management */}
          {isAllowed("products") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/products")}
                tooltip="Products"
                onClick={() => toggleMenu("products")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Products</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "products" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "products" && (
                <SidebarMenuSub>
                  {isAllowed("products.new") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/new"}
                        render={<Link to="/dashboard/products/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Add Product</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.list") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products" || pathname === "/dashboard/products/list"}
                        render={<Link to="/dashboard/products" />}
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        <span>Product List</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.categories") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/categories"}
                        render={<Link to="/dashboard/products/categories" />}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Categories</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.brands") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/brands"}
                        render={<Link to="/dashboard/products/brands" />}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Brands</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.attributes") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/products/attributes")}
                        render={<Link to="/dashboard/products/attributes" />}
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Attributes</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.coupons") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/coupons"}
                        render={<Link to="/dashboard/products/coupons" />}
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        <span>Coupons</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {/* Accounting */}
          {isAllowed("billing") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/billing")}
                tooltip="Accounting"
                onClick={() => toggleMenu("billing")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Accounting</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "billing" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "billing" && (
                <SidebarMenuSub>
                  {isAllowed("billing.billings") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/billing/billings"}
                        render={<Link to="/dashboard/billing/billings" />}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Bills & Invoices</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("billing.payments") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/billing/payments"}
                        render={<Link to="/dashboard/billing/payments" />}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Payments</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {/* Admin Menu */}
          {(isAllowed("admin") || isAllowed("members") || isAllowed("reports") || isAllowed("analytics") || isAllowed("users") || isAllowed("activity-logs") || isAllowed("reviews") || isAllowed("trash")) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  pathname.startsWith("/dashboard/analytics") ||
                  pathname.startsWith("/dashboard/reports") ||
                  pathname.startsWith("/dashboard/members") ||
                  pathname.startsWith("/dashboard/activity-logs") ||
                  pathname.startsWith("/dashboard/users") ||
                  pathname.startsWith("/dashboard/reviews") ||
                  pathname.startsWith("/dashboard/trash")
                }
                tooltip="Admin"
                onClick={() => toggleMenu("admin")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "admin" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "admin" && (
                <SidebarMenuSub>
                  {isAllowed("analytics") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/analytics")}
                        render={<Link to="/dashboard/analytics" />}
                      >
                        <LineChart className="h-3.5 w-3.5" />
                        <span>Analytics</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("reports") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/reports")}
                        render={<Link to="/dashboard/reports" />}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span>Reports</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("members") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/members")}
                        render={<Link to="/dashboard/members" />}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Members</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/dashboard/activity-logs")}
                      render={<Link to="/dashboard/activity-logs" />}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      <span>Activity Logs</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {isAllowed("users") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/users")}
                        render={<Link to="/dashboard/users" />}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>System Users</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("reviews") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/reviews")}
                        render={<Link to="/dashboard/reviews" />}
                      >
                        <Star className="h-3.5 w-3.5" />
                        <span>Reviews</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/dashboard/trash")}
                      render={<Link to="/dashboard/trash" />}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-destructive font-medium">Trash</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {/* Tools */}
          {isAllowed("tools") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/tools")}
                tooltip="Tools"
                onClick={() => toggleMenu("tools")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span>Tools</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "tools" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "tools" && (
                <SidebarMenuSub>
                  {isAllowed("tools.messages") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/tools/messages" || pathname.startsWith("/dashboard/tools/messages")}
                        render={<Link to="/dashboard/tools/messages" />}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Messages</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("tools.assets") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/tools/assets"}
                        render={<Link to="/dashboard/tools/assets" />}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Assets Manager</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("tools.bulk-image-resize") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/tools/bulk-image-resize"}
                        render={<Link to="/dashboard/tools/bulk-image-resize" />}
                      >
                        <ImageDown className="h-3.5 w-3.5" />
                        <span>Bulk Image Resize</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("tools.meta-catalog") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/tools/meta-catalog"}
                        render={<Link to="/dashboard/tools/meta-catalog" />}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Meta Catalog</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("tools.support") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/tools/support" || pathname.startsWith("/dashboard/tools/support")}
                        render={<Link to="/dashboard/tools/support" />}
                      >
                        <LifeBuoy className="h-3.5 w-3.5" />
                        <span>Support</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {/* System Logs (Fixed Standalone Main Menu Item directly at bottom of content) */}
          {isAllowed("logs") && (
            <SidebarMenuItem className="mt-auto pt-2">
              <SidebarMenuButton
                isActive={pathname === "/dashboard/logs" || pathname.startsWith("/dashboard/tools/logs")}
                tooltip="System Logs"
                render={<Link to="/dashboard/logs" />}
              >
                <Terminal className="h-4 w-4" />
                <span>System Logs</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2.5 group-data-[collapsible=icon]:p-2 mt-auto">
        {/* Action Icon Buttons */}
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          {/* 1. Profile Icon Button (Light green border - Shows User Card Popover Upward) */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-foreground border border-emerald-500/40 shadow-xs transition-all cursor-pointer"
                  title="My Profile"
                  aria-label="My Profile"
                >
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </button>
              }
            />
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56 p-3 shadow-lg">
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5" title={user?.email || ''}>
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
                <div className="pt-1.5 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">Role:</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 capitalize">
                    {user?.role || 'Admin'}
                  </span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2. All Media Icon Button (Hidden when collapsed) */}
          <Link
            to="/dashboard/media"
            className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 border border-blue-500/40 shadow-xs transition-all cursor-pointer group-data-[collapsible=icon]:hidden"
            title="All Media Assets"
            aria-label="All Media Assets"
          >
            <ImageIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </Link>

          {/* 3. Settings Icon Button (Hidden when collapsed - Only visible to Owner, Admin, Manager) */}
          {isAllowed("settings") && (
            <Link
              to="/dashboard/settings"
              className="h-8 w-8 flex items-center justify-center rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 shadow-xs transition-all cursor-pointer group-data-[collapsible=icon]:hidden"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </Link>
          )}

          {/* 4. Logout Icon Button (Red icon, red border, red background accent, rounded-full) */}
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/40 shadow-xs transition-all cursor-pointer"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 text-destructive" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />

      {/* Logout Confirmation Alert Dialog */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 text-center">
          <DialogHeader className="space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-1">
              <LogOut className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground text-center">
              Do you want to log out?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center">
              Are you sure you want to end your current session? You will need to sign in again to access the dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3 pt-4 border-t mt-2">
            {/* No Button (Red Color) */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogoutConfirmOpen(false)}
              className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/40 hover:border-destructive/60 font-semibold cursor-pointer text-xs"
            >
              No
            </Button>

            {/* Yes Button (Golden Color) */}
            <Button
              type="button"
              onClick={handleConfirmLogout}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black dark:text-neutral-950 font-bold shadow-sm cursor-pointer text-xs"
            >
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
