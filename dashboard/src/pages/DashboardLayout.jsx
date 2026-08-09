<<<<<<<< HEAD:dashboard/src/pages/DashboardLayout.jsx
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { Header } from '@/components/dashboard/header';
import { ClientSidebarProvider } from '@/components/dashboard/client-sidebar-provider';
import { AuthGuard } from '@/components/auth-guard';
========
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/core/dashboard/app-sidebar';
import { Header } from '@/components/core/dashboard/header';
import { ClientSidebarProvider } from '@/components/core/dashboard/client-sidebar-provider';
import { AuthGuard } from '@/components/core/auth-guard';
>>>>>>>> Decantre:dashboard/src/layouts/dashboardLayout.jsx

const DashboardLayout = ({ children }) => {
  return (
    <AuthGuard>
      <ClientSidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/20">
            {children || <Outlet />}
          </main>
        </div>
      </ClientSidebarProvider>
    </AuthGuard>
  );
}

export default DashboardLayout;
