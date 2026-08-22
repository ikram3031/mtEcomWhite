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
} from "lucide-react"

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
  const { user } = useAuth()
  const { state, setOpen } = useSidebar()
  const { brandName, features } = clientConfig

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
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          {state === "expanded" ? (
            <>
              <div className="flex items-center gap-3">
                <DecantreLogo className="h-8 w-auto max-w-[130px] text-primary shrink-0" iconOnly={false} />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center justify-center shrink-0"
                title="Close Sidebar"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center justify-center shrink-0"
              title="Open Sidebar"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-6">
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
                render={<Link to="/dashboard/orders" />}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Orders</span>
              </SidebarMenuButton>
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
            </SidebarMenuItem>
          )}

          {/* Products Management */}
          {isAllowed("products") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/products")}
                tooltip="Products"
                render={<Link to="/dashboard/products" />}
              >
                <Package className="h-4 w-4" />
                <span>Products</span>
              </SidebarMenuButton>
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
                      isActive={pathname === "/dashboard/products"}
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
                      isActive={pathname === "/dashboard/products/attributes"}
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
            </SidebarMenuItem>
          )}

          {/* Stock Management */}
          {isAllowed("products.stock") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard/products/stock"}
                tooltip="Stock Management"
                render={<Link to="/dashboard/products/stock" />}
              >
                <ListOrdered className="h-4 w-4" />
                <span>Stock Management</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* AI Photo Studio - Commented out as requested
          {isAllowed("studio") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/studio")}
                tooltip="Studio"
                render={<Link to="/dashboard/studio/batch-images" />}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Studio</span>
              </SidebarMenuButton>
              <SidebarMenuSub>
                {isAllowed("studio.batch-images") && (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/dashboard/studio/batch-images"}
                      render={<Link to="/dashboard/studio/batch-images" />}
                    >
                      <Package className="h-3.5 w-3.5" />
                      <span>Batch Images</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )}
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
          */}

          {/* Billing & Payment */}
          {isAllowed("billing") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/billing")}
                tooltip="Billing & Payment"
                render={<Link to="/dashboard/billing" />}
              >
                <CreditCard className="h-4 w-4" />
                <span>Billing & Payment</span>
              </SidebarMenuButton>
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
            </SidebarMenuItem>
          )}

          {/* Admin Menu */}
          {(isAllowed("admin") || isAllowed("members") || isAllowed("reports") || isAllowed("users") || isAllowed("activity-logs") || isAllowed("reviews") || isAllowed("trash")) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  pathname.startsWith("/dashboard/members") ||
                  pathname.startsWith("/dashboard/reports") ||
                  pathname.startsWith("/dashboard/activity-logs") ||
                  pathname.startsWith("/dashboard/users") ||
                  pathname.startsWith("/dashboard/reviews") ||
                  pathname.startsWith("/dashboard/trash")
                }
                tooltip="Admin"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin</span>
              </SidebarMenuButton>
              <SidebarMenuSub>
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
            </SidebarMenuItem>
          )}

          {/* Tools */}
          {isAllowed("tools") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/tools")}
                tooltip="Tools"
                render={<Link to="/dashboard/tools/bulk-image-resize" />}
              >
                <Wrench className="h-4 w-4" />
                <span>Tools</span>
              </SidebarMenuButton>
              <SidebarMenuSub>
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
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}

          {/* System Logs (Standalone Main Menu Item below Tools) */}
          {isAllowed("logs") && (
            <SidebarMenuItem>
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

      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium truncate text-sidebar-foreground">
              {user?.email || "Admin User"}
            </span>
            <span className="text-xs text-sidebar-foreground/60 truncate">
              Store Manager
            </span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
