import { Input } from '@/components/ui/input';
import { Search, LogOut, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationBell } from './NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { useAuth } from '@/lib/auth-context';

export const Header = () => {
  const { searchQuery, setSearchQuery } = useDashboardStore();
  const { user, logout } = useAuth();

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <form className="ml-auto flex-1 sm:flex-initial" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9">
                    {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || 'User'} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-60 p-3">
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
        </div>
      </div>
    </header>
  );
};
