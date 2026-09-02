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
  Ruler,
  Store,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const [profileModalOpen, setProfileModalOpen] = React.useState(false)

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
    if (menuKey === "tools.messages" && features?.webmail === false) return false
    if (menuKey === "products.size-charts" && features?.sizeChart === false) return false

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
                  {isAllowed("orders.instore") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders/in-store" || pathname === "/dashboard/orders/instore"}
                        render={<Link to="/dashboard/orders/in-store" />}
                      >
                        <Store className="h-3.5 w-3.5" />
                        <span>In-Store Orders</span>
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
                  {isAllowed("products.size-charts") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/size-charts"}
                        render={<Link to="/dashboard/products/size-charts" />}
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        <span>Size Charts</span>
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
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent/80 border border-sidebar-border/60 transition-all w-full group-data-[collapsible=icon]:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer outline-none group/user"
                  title={user?.name || "User Account"}
                >
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || "B"}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-sidebar-foreground truncate leading-tight group-hover/user:text-primary transition-colors">
                      {user?.name || "Bithy Akther"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5 capitalize">
                      {user?.role || "Frontdesk"}
                    </p>
                  </div>
                </button>
              }
            />
            <DropdownMenuContent side="top" align="start" sideOffset={12} className="w-48 p-1.5 shadow-xl rounded-xl border border-border/80 bg-popover">
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-accent focus:bg-accent text-foreground"
                onClick={() => setProfileModalOpen(true)}
              >
                <User className="h-4 w-4 text-primary" />
                <span>Profile</span>
              </DropdownMenuItem>
              {isAllowed("settings") && (
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-accent focus:bg-accent text-foreground"
                  render={<Link to="/dashboard/settings" />}
                >
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Setting</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="h-8 w-8 shrink-0 rounded-xl bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 w-full">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="relative h-8 w-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-primary/30 transition-all"
                  title={user?.name || "User Account"}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "B"}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-sidebar" />
                </button>
              }
            />
            <DropdownMenuContent side="right" align="end" sideOffset={12} className="w-48 p-1.5 shadow-xl rounded-xl border border-border/80 bg-popover">
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-accent focus:bg-accent text-foreground"
                onClick={() => setProfileModalOpen(true)}
              >
                <User className="h-4 w-4 text-primary" />
                <span>Profile</span>
              </DropdownMenuItem>
              {isAllowed("settings") && (
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-accent focus:bg-accent text-foreground"
                  render={<Link to="/dashboard/settings" />}
                >
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Setting</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="h-8 w-8 rounded-xl bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 text-white" />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogoutConfirmOpen(false)}
              className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/40 hover:border-destructive/60 font-semibold cursor-pointer text-xs"
            >
              No
            </Button>

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

      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6">
          <DialogHeader className="space-y-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || "B"}
              </div>
              <div className="text-left">
                <DialogTitle className="text-base font-bold text-foreground">
                  {user?.name || "Bithy Akther"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {user?.email || "user@example.com"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2.5 py-3 border-y border-border text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 capitalize">
                {user?.role || "Frontdesk"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Store Brand</span>
              <span className="font-semibold text-foreground">{brandName || "Store"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                Active
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProfileModalOpen(false)}
              className="w-full text-xs font-semibold cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
