import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/core/dashboard/appSidebar';
import { Header } from '@/components/core/dashboard/header';
import { ClientSidebarProvider } from '@/components/core/dashboard/clientSidebarProvider';
import { AuthGuard } from '@/components/core/auth-guard';
import { ClientThemeProvider } from '@/components/core/clientThemeProvider';
import { ClientRouteGuard } from '@/components/core/clientRouteGuard';

const DashboardLayout = ({ children }) => {
  return (
    <AuthGuard>
      <ClientThemeProvider>
        <ClientSidebarProvider>
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-muted/20">
              <ClientRouteGuard>
                {children || <Outlet />}
              </ClientRouteGuard>
            </main>
          </div>
        </ClientSidebarProvider>
      </ClientThemeProvider>
    </AuthGuard>
  );
}

export default DashboardLayout;
