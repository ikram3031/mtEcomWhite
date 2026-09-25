import { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  RefreshCw,
  ExternalLink,
  Settings2,
  Radio,
  Eye,
  TrendingUp,
  CreditCard,
  Share2,
  ShoppingCart,
  Smartphone,
  ShieldCheck,
  Search,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { clientConfig } from '@/clientConfig';
import { useReports } from '@/hooks/use-reports';
import { exportToCsv } from '@/utils/exportCsv';
import {
  getAnalyticsDataForRange,
  getGA4Settings,
  getGA4ReportUrls,
} from './analyticsData';
import { GA4ConfigModal } from './components/GA4ConfigModal';
import { RealtimeStreamTab } from './components/RealtimeStreamTab';
import { AcquisitionTab } from './components/AcquisitionTab';
import { EcommerceFunnelTab } from './components/EcommerceFunnelTab';
import { AudienceTechTab } from './components/AudienceTechTab';
import { GA4SetupTab } from './components/GA4SetupTab';

// Main Google Analytics dashboard page component
const AnalyticsPage = () => {
  const { theme, systemTheme } = useTheme();
  const brandName = clientConfig?.brandName || 'Store';

  const [range, setRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [pageSearch, setPageSearch] = useState('');
  const [ga4Config, setGa4Config] = useState(() => getGA4Settings());

  const { summary, timeline: timelineQuery, products: productsQuery, payments: paymentsQuery, refetchAll } = useReports({ range });

  const storeStats = summary?.data || null;
  const timelineData = timelineQuery?.data || [];
  const productsData = productsQuery?.data || [];
  const paymentsData = paymentsQuery?.data || [];

  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  // Real analytics data computed strictly from live store orders and verified GA4 configuration
  const data = useMemo(() => {
    return getAnalyticsDataForRange(range, brandName, storeStats, timelineData, productsData, paymentsData);
  }, [range, brandName, storeStats, timelineData, productsData, paymentsData]);

  const reportUrls = useMemo(() => getGA4ReportUrls(ga4Config.propertyId), [ga4Config.propertyId]);

  // Handles refreshing dashboard data
  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchAll()
      .catch(() => {})
      .finally(() => {
        setIsRefreshing(false);
        toast.success('Analytics data refreshed');
      });
  };

  // Handles exporting real store sales timeline to CSV
  const handleExport = () => {
    const filename = `store_analytics_${range}_${new Date().toISOString().split('T')[0]}.csv`;
    const exportRows = data.timeline.length > 0
      ? data.timeline.map((t) => ({
          Date: t.date,
          'Total Sales (BDT)': t.sales,
          'Orders Placed': t.orders,
          'Avg Order Value': t.aov,
        }))
      : [
          {
            'Total Revenue': data.kpis.totalRevenue,
            'Total Orders': data.kpis.totalOrders,
            'Completed Orders': data.kpis.completedOrders,
            'Avg Order Value': data.kpis.averageOrderValue,
          },
        ];

    exportToCsv(exportRows, filename);
    toast.success('Analytics report downloaded');
  };

  const filteredPages = data.topPages.filter(
    (p) =>
      p.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.path.toLowerCase().includes(pageSearch.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'realtime', label: 'Real-Time Stream', icon: Radio, badge: 'Live Stream' },
    { id: 'acquisition', label: 'Traffic Channels', icon: Share2 },
    { id: 'ecommerce', label: 'Ecommerce & Sales', icon: ShoppingCart },
    { id: 'audience', label: 'Audience & Tech', icon: Smartphone },
    { id: 'setup', label: 'GA4 Tag & Setup', icon: ShieldCheck },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Google Analytics
            </h2>
            {/* Stream Active Badge */}
            <div
              onClick={() => setActiveTab('realtime')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold cursor-pointer hover:bg-emerald-500/20 transition-all shadow-xs"
              title="Click to view Real-time Stream details"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>GA4 Active ({ga4Config.measurementId})</span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Google Analytics 4 tracking stream, verified storefront metrics, and store conversions for {brandName}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today" className="text-xs">Today</SelectItem>
              <SelectItem value="7days" className="text-xs">Last 7 Days</SelectItem>
              <SelectItem value="30days" className="text-xs">Last 30 Days</SelectItem>
              <SelectItem value="90days" className="text-xs">Last 90 Days</SelectItem>
              <SelectItem value="year" className="text-xs">Year to Date</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 px-2.5 text-xs cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </Button>

          {/* Export CSV Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          {/* GA4 Config Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfigModalOpen(true)}
            className="h-9 px-3 text-xs flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>GA4 Config</span>
          </Button>

          {/* External Google Analytics Console Link */}
          <a
            href={reportUrls.console}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 shadow-xs transition-all"
            title="Open official Google Analytics Console"
          >
            <span className="hidden md:inline">GA Console</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Real Revenue */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Net Revenue
            </CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ৳{data.kpis.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>Verified store net sales</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Store Synced</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total Orders */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Placed Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.kpis.totalOrders.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>{data.kpis.completedOrders} completed/delivered</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                <ArrowUpRight className="inline h-3 w-3 mr-0.5" />
                Live Orders
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Average Order Value */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Average Order Value (AOV)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ৳{data.kpis.averageOrderValue.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>Per customer order basket</span>
              <span className="text-blue-500 font-semibold">Database Live</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: GA4 Stream Verification */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              GA4 Stream Status
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono font-bold text-foreground truncate" title={data.kpis.measurementId}>
              {data.kpis.measurementId}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>Property: {data.kpis.propertyId}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="border-b border-border pb-3">
        <div className="inline-flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{t.label}</span>
                {t.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Real Store Sales Timeline Area Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Store Sales & Order Volume Trend
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Daily verified transaction volume and net sales recorded in store database
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Sales (BDT)
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {data.timeline.length > 0 ? (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262626' : '#f0f0f0'} />
                        <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#171717' : '#ffffff',
                            borderColor: isDark ? '#333333' : '#e5e7eb',
                            color: isDark ? '#f9fafb' : '#111827',
                            borderRadius: '6px',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          name="Sales (BDT)"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#salesGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[180px] flex flex-col items-center justify-center text-xs text-muted-foreground">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <span>No sales records found for the selected date range.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Pages Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Tracked Storefront Landing Paths
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Primary verified routes monitored under GA4 Measurement ID: {ga4Config.measurementId}
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Search path..."
                      value={pageSearch}
                      onChange={(e) => setPageSearch(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead>Page Path</TableHead>
                        <TableHead>Page Title</TableHead>
                        <TableHead className="text-right">Tracking Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {filteredPages.map((pg, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/40">
                          <TableCell className="font-mono text-foreground font-semibold">{pg.path}</TableCell>
                          <TableCell className="text-muted-foreground">{pg.title}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {pg.status}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: REAL-TIME STREAM */}
        {activeTab === 'realtime' && (
          <RealtimeStreamTab config={ga4Config} brandName={brandName} />
        )}

        {/* TAB 3: ACQUISITION CHANNELS */}
        {activeTab === 'acquisition' && (
          <AcquisitionTab config={ga4Config} brandName={brandName} />
        )}

        {/* TAB 4: ECOMMERCE & SALES */}
        {activeTab === 'ecommerce' && (
          <EcommerceFunnelTab
            kpis={data.kpis}
            topProducts={data.topProducts}
            paymentMethods={data.paymentMethods}
            config={ga4Config}
          />
        )}

        {/* TAB 5: AUDIENCE & TECH */}
        {activeTab === 'audience' && (
          <AudienceTechTab config={ga4Config} brandName={brandName} />
        )}

        {/* TAB 6: GA4 SETUP & TAGS */}
        {activeTab === 'setup' && (
          <GA4SetupTab
            config={ga4Config}
            brandName={brandName}
            onOpenConfigModal={() => setConfigModalOpen(true)}
          />
        )}
      </div>

      {/* GA4 Configuration Modal Dialog */}
      <GA4ConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        brandName={brandName}
        onSettingsSaved={(newCfg) => {
          setGa4Config(newCfg);
        }}
      />
    </div>
  );
};

export default AnalyticsPage;
