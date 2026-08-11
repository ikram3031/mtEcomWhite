import { useState } from 'react';
import { KpiCard } from '@/components/core/dashboard/kpiCard';
import { RevenueChart } from '@/components/core/dashboard/revenue-chart';
import { RecentTransactionsTable } from '@/components/core/dashboard/recent-transactions-table';
import { DollarSign, Users, CreditCard, Activity } from 'lucide-react';
import { useDashboardKpi } from '@/hooks/core/use-dashboard-kpi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/core/ui/select';
import { Skeleton } from '@/components/core/ui/skeleton';

const DashboardPage = () => {
  const [range, setRange] = useState('30days');
  const { data: stats, isLoading } = useDashboardKpi(range);

  // Helper to determine subtext based on range
  const getSubtext = (range) => {
    switch (range) {
      case 'today':
        return 'from yesterday';
      case '7days':
        return 'from previous 7 days';
      case '3months':
        return 'from previous 3 months';
      case '30days':
      default:
        return 'from last month';
    }
  };

  const trendText = getSubtext(range);

  // Format trend direction
  const getTrendDirection = (val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return 'neutral';
    return num > 0 ? 'up' : 'down';
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Select value={range} onValueChange={(val) => setRange(val ?? '30days')}>
          <SelectTrigger className="w-[180px] h-9 cursor-pointer text-xs">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="bg-popover border shadow-md" side="bottom">
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Sales"
          value={isLoading ? <Skeleton className="h-8 w-24" /> : `৳${(stats?.sales ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend={stats?.trends?.sales ?? '0.0'}
          trendDirection={getTrendDirection(stats?.trends?.sales)}
          subtext={trendText}
        />
        <KpiCard
          title="Total Completed Orders"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.completedOrders ?? 0}`}
          icon={CreditCard}
          trend={stats?.trends?.orders ?? '0.0'}
          trendDirection={getTrendDirection(stats?.trends?.orders)}
          subtext={trendText}
        />
        <KpiCard
          title="Average Order Value"
          value={isLoading ? <Skeleton className="h-8 w-24" /> : `৳${(stats?.aov ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Activity}
          trend={stats?.trends?.aov ?? '0.0'}
          trendDirection={getTrendDirection(stats?.trends?.aov)}
          subtext={trendText}
        />
        <KpiCard
          title="Total Members"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.members ?? 0}`}
          icon={Users}
          trend={stats?.trends?.members ?? '0.0'}
          trendDirection={getTrendDirection(stats?.trends?.members)}
          subtext={trendText}
        />
      </div>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <RevenueChart />
        <RecentTransactionsTable />
      </div>
    </div>
  );
}

export default DashboardPage;
