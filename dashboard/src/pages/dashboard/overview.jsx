import { KpiCard } from '@/components/core/dashboard/kpi-card';
import { RevenueChart } from '@/components/core/dashboard/revenue-chart';
import { RecentTransactionsTable } from '@/components/core/dashboard/recent-transactions-table';
import { DollarSign, Users, CreditCard, Activity } from 'lucide-react';

const DashboardPage = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value="৳45,231.89"
          icon={DollarSign}
          trend="20.1%"
          trendDirection="up"
        />
        <KpiCard
          title="Subscriptions"
          value="+2350"
          icon={Users}
          trend="180.1%"
          trendDirection="up"
        />
        <KpiCard
          title="Sales"
          value="+12,234"
          icon={CreditCard}
          trend="19%"
          trendDirection="up"
        />
        <KpiCard
          title="Active Now"
          value="+573"
          icon={Activity}
          trend="201 since last hour"
          trendDirection="neutral"
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
