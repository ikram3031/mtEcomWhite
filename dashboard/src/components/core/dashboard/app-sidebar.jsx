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

export function AppSidebar({ ...props }) {
  const location = useLocation()
  const pathname = location.pathname
  const { user } = useAuth()
  const { state, setOpen } = useSidebar()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          {state === "expanded" ? (
            <>
              <div className="flex items-center gap-3">
                <DecantreLogo className="h-8 w-8 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight text-sidebar-foreground">
                    Decantre
                  </span>
                </div>
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

          {/* Orders */}
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
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/orders/new"}
                  render={<Link to="/dashboard/orders/new" />}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>New In-Store Order</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/orders"}
                  render={<Link to="/dashboard/orders" />}
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                  <span>Orders List</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>

          {/* Products Management */}
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
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/products/new"}
                  render={<Link to="/dashboard/products/new" />}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Add Product</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/products"}
                  render={<Link to="/dashboard/products" />}
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                  <span>Product List</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/products/categories"}
                  render={<Link to="/dashboard/products/categories" />}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Categories</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/products/brands"}
                  render={<Link to="/dashboard/products/brands" />}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Brands</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/products/attributes"}
                  render={<Link to="/dashboard/products/attributes" />}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Attributes</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/products/coupons"}
                  render={<Link to="/dashboard/products/coupons" />}
                >
                  <Ticket className="h-3.5 w-3.5" />
                  <span>Coupons</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>

          {/* Stock Management */}
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

          {/* Members */}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/dashboard/members"}
              tooltip="Members"
              render={<Link to="/dashboard/members" />}
            >
              <Users className="h-4 w-4" />
              <span>Members</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Billing & Payment */}
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
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/billing/billings"}
                  render={<Link to="/dashboard/billing/billings" />}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Bills & Invoices</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={pathname === "/dashboard/billing/payments"}
                  render={<Link to="/dashboard/billing/payments" />}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Payments</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>

          {/* Reports */}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/dashboard/reports"}
              tooltip="Reports"
              render={<Link to="/dashboard/reports" />}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Reports</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* System Users */}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/dashboard/users"}
              tooltip="System Users"
              render={<Link to="/dashboard/users" />}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>System Users</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
