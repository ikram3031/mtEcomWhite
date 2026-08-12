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
  Code2,
  FileCode,
  Terminal,
  ChevronRight,
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
} from "@/components/core/ui/sidebar"
import { DecantreLogo } from "@/components/core/DecantreLogo"
import { useAuth } from "@/lib/core/auth-context"
import { cn } from "@/lib/core/utils"
import { clientConfig } from "@/clientConfig"

// Main Sidebar component rendering client-restricted menu systems
export const AppSidebar = ({ ...props }) => {
  const location = useLocation()
  const pathname = location.pathname
  const { user } = useAuth()
  const { state, setOpen } = useSidebar()
  const allowedMenus = clientConfig.allowedMenus || []
  const hasAccess = (key) => allowedMenus.includes(key)

  // Track expanded/collapsed state for parent menus
  const [openMenus, setOpenMenus] = React.useState(() => {
    return {
      orders: pathname.startsWith("/dashboard/orders"),
      products: pathname.startsWith("/dashboard/products"),
      billing: pathname.startsWith("/dashboard/billing"),
      developer: pathname.startsWith("/dashboard/developer"),
    }
  })

  // Auto-expand menu if route changes to a path under that parent
  React.useEffect(() => {
    if (pathname.startsWith("/dashboard/orders")) {
      setOpenMenus((prev) => ({ ...prev, orders: true }))
    } else if (pathname.startsWith("/dashboard/products")) {
      setOpenMenus((prev) => ({ ...prev, products: true }))
    } else if (pathname.startsWith("/dashboard/billing")) {
      setOpenMenus((prev) => ({ ...prev, billing: true }))
    } else if (pathname.startsWith("/dashboard/developer")) {
      setOpenMenus((prev) => ({ ...prev, developer: true }))
    }
  }, [pathname])

  // Toggles expansion of nested sidebar parent items
  const toggleParentMenu = (menuKey) => {
    if (state !== "expanded") {
      setOpen(true)
    }
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }))
  }

  // Auto-expands sidebar when clicking a submenu link
  const handleSubMenuClick = () => {
    if (state !== "expanded") {
      setOpen(true)
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 flex flex-col justify-center border-b border-zinc-800 bg-zinc-950 px-4 py-0 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          {state === "expanded" ? (
            <>
              {/* Logo constrained so it never overflows into the close button */}
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden mr-2">
                <DecantreLogo className="h-6 w-auto text-primary shrink-0 max-w-[140px]" />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full bg-primary hover:bg-primary/90 text-black border-0 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Close Sidebar"
              >
                <X className="h-4 w-4 text-black" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="p-1.5 rounded-full bg-primary hover:bg-primary/90 text-black border-0 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              title="Open Sidebar"
            >
              <Menu className="h-4 w-4 text-black" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-6 group-data-[collapsible=icon]:[&_svg]:text-foreground">
        <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:gap-4">
          {/* Overview */}
          {hasAccess("overview") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard"}
                tooltip="Overview"
                onClick={handleSubMenuClick}
                render={<Link to="/dashboard" />}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Orders (Parent with Submenus) */}
          {hasAccess("orders") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/orders")}
                tooltip="Orders"
                onClick={() => toggleParentMenu("orders")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span>Orders</span>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                    openMenus.orders && "rotate-90"
                  )}
                />
              </SidebarMenuButton>
              {openMenus.orders && (
                <SidebarMenuSub>
                  {hasAccess("orders.new") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders/new"}
                        onClick={handleSubMenuClick}
                        render={<Link to="/dashboard/orders/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>New In-Store Order</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {hasAccess("orders.list") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders"}
                        onClick={handleSubMenuClick}
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

          {/* Products Management (Parent with Submenus) */}
          {hasAccess("products") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/products") && pathname !== "/dashboard/products/stock"}
                tooltip="Products"
                onClick={() => toggleParentMenu("products")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="h-4 w-4 shrink-0" />
                  <span>Products</span>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                    openMenus.products && "rotate-90"
                  )}
                />
              </SidebarMenuButton>
              {openMenus.products && (
                <SidebarMenuSub>
                  {hasAccess("products.new") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/new"}
                        onClick={handleSubMenuClick}
                        render={<Link to="/dashboard/products/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Add Product</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {hasAccess("products.list") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products"}
                        onClick={handleSubMenuClick}
                        render={<Link to="/dashboard/products" />}
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        <span>Product List</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {hasAccess("products.categories") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/categories"}
                        onClick={handleSubMenuClick}
                        render={<Link to="/dashboard/products/categories" />}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Categories</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {hasAccess("products.brands") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/brands"}
                        onClick={handleSubMenuClick}
                        render={<Link to="/dashboard/products/brands" />}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Brands</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {hasAccess("products.attributes") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/attributes"}
                        onClick={handleSubMenuClick}
                        render={<Link to="/dashboard/products/attributes" />}
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Attributes</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {hasAccess("products.coupons") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/coupons"}
                        onClick={handleSubMenuClick}
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

          {/* Members */}
          {hasAccess("members") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard/members"}
                tooltip="Members"
                onClick={handleSubMenuClick}
                render={<Link to="/dashboard/members" />}
              >
                <Users className="h-4 w-4" />
                <span>Members</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Billing & Payment (Parent with Submenus) */}
          {hasAccess("billing") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/billing")}
                tooltip="Billing & Payment"
                onClick={() => toggleParentMenu("billing")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>Billing & Payment</span>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                    openMenus.billing && "rotate-90"
                  )}
                />
              </SidebarMenuButton>
              {openMenus.billing && (
                <SidebarMenuSub>
                  {hasAccess("billing.billings") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/billing/billings"}
                        onClick={handleSubMenuClick}
                        render={<Link to="/dashboard/billing/billings" />}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Bills & Invoices</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {hasAccess("billing.payments") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/billing/payments"}
                        onClick={handleSubMenuClick}
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

          {/* Reports */}
          {hasAccess("reports") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard/reports"}
                tooltip="Reports"
                onClick={handleSubMenuClick}
                render={<Link to="/dashboard/reports" />}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* System Users */}
          {hasAccess("users") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard/users"}
                tooltip="System Users"
                onClick={handleSubMenuClick}
                render={<Link to="/dashboard/users" />}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>System Users</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Developer Options (Parent with Submenus) */}
          {hasAccess("developer") && user?.email?.toLowerCase().trim() === "ikramul.web@gmail.com" && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/developer")}
                tooltip="Developer Tools"
                onClick={() => toggleParentMenu("developer")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Code2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span className="font-semibold text-purple-400">Developer Options</span>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                    openMenus.developer && "rotate-90"
                  )}
                />
              </SidebarMenuButton>
              {openMenus.developer && (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/dashboard/developer/v1/doc.html"}
                      onClick={handleSubMenuClick}
                      render={<Link to="/dashboard/developer/v1/doc.html" />}
                    >
                      <FileCode className="h-3.5 w-3.5" />
                      <span>Scalar API Docs</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/dashboard/developer/logs"}
                      onClick={handleSubMenuClick}
                      render={<Link to="/dashboard/developer/logs" />}
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Realtime System Logs</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

        </SidebarMenu>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
