import { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Download,
  RefreshCw,
  ExternalLink,
  Settings2,
  Radio,
  Users,
  Eye,
  Clock,
  TrendingUp,
  CreditCard,
  Share2,
  ShoppingCart,
  Smartphone,
  ShieldCheck,
  Search,
  ArrowUpRight,
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
import { exportToCsv } from '@/utils/exportCsv';
import {
  getAnalyticsDataForRange,
  getGA4Settings,
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
  const brandName = clientConfig?.brandName || 'Decantre';

  const [range, setRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [pageSearch, setPageSearch] = useState('');
  const [ga4Config, setGa4Config] = useState(() => getGA4Settings(brandName));
  const [realtimeCount, setRealtimeCount] = useState(34);

  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  // Fetches analytics data computed for current selected range
  const data = useMemo(() => {
    return getAnalyticsDataForRange(range, brandName);
  }, [range, brandName]);

  // Periodic heartbeat updating the live active visitors badge
  useEffect(() => {
    const timer = setInterval(() => {
      const delta = Math.floor(Math.random() * 5) - 2;
      setRealtimeCount((prev) => Math.max(15, prev + delta));
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  // Handles refreshing dashboard data with quick visual feedback
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRealtimeCount((prev) => Math.max(18, prev + Math.floor(Math.random() * 3)));
      toast.success('Analytics data refreshed');
    }, 600);
  };

  // Handles exporting analytics traffic summary to CSV
  const handleExport = () => {
    let exportRows = [];
    let filename = `google_analytics_${range}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'acquisition') {
      exportRows = data.channels.map((c) => ({
        Channel: c.channel,
        Users: c.users,
        Sessions: c.sessions,
        'Engagement Rate': c.engagementRate,
        'Bounce Rate': c.bounceRate,
        'Avg Duration': c.avgDuration,
        'Revenue (BDT)': c.revenue,
        Transactions: c.transactions,
      }));
    } else {
      exportRows = data.timeline.map((t) => ({
        Date: t.date,
        Sessions: t.sessions,
        'Active Users': t.users,
        Pageviews: t.pageviews,
        Purchases: t.purchases,
      }));
    }

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
    { id: 'realtime', label: 'Real-Time Stream', icon: Radio, badge: `${realtimeCount} Live` },
    { id: 'acquisition', label: 'Traffic Channels', icon: Share2 },
    { id: 'ecommerce', label: 'Ecommerce Funnel', icon: ShoppingCart },
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
            {/* Pulsing Live Visitors Badge */}
            <div
              onClick={() => setActiveTab('realtime')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold cursor-pointer hover:bg-emerald-500/20 transition-all shadow-xs"
              title="Click to view Real-time Stream"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{realtimeCount} Live Visitors</span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Real-time traffic, GA4 user sessions, pageviews, ecommerce funnel, and conversion insights for {brandName}.
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
            href="https://analytics.google.com/"
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
        {/* KPI 1: Active Users & Sessions */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Sessions & Users
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.kpis.totalSessions.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>{data.kpis.totalUsers.toLocaleString()} unique users</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                {data.kpis.trends.sessions}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Pageviews & Views/Session */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pageviews & Engagement
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.kpis.totalPageviews.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>{data.kpis.viewsPerSession} views / session</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                {data.kpis.trends.pageviews}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Engagement Duration & Rate */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Duration & Bounce
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.kpis.avgEngagementTime}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>{data.kpis.engagementRate} engaged rate</span>
              <span className="text-muted-foreground font-medium">
                {data.kpis.bounceRate} bounce
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Ecommerce Revenue & Conversion Rate */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ecommerce Revenue & Orders
            </CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ৳{data.kpis.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>{data.kpis.totalTransactions} orders ({data.kpis.conversionRate})</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                {data.kpis.trends.revenue}
              </span>
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
            {/* Timeline Sessions vs Users Area Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Sessions & Active Users Trend
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Daily visitor traffic volume and engagement over selected timeline
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Sessions
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Users
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C5A059" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#C5A059" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
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
                        dataKey="sessions"
                        name="Sessions"
                        stroke="#C5A059"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#sessionsGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        name="Active Users"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#usersGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Acquisition Summary & Top Pages Grid */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
              {/* Traffic Sources Pill Summary (3 Cols) */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      Traffic Acquisition Breakdown
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('acquisition')}
                      className="text-xs text-primary hover:underline h-7 p-0 cursor-pointer"
                    >
                      View All
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    Top marketing acquisition channels driving storefront traffic
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {data.channels.slice(0, 5).map((ch, idx) => {
                    const pct = ((ch.sessions / data.kpis.totalSessions) * 100).toFixed(1);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                            <span>{ch.channel}</span>
                          </span>
                          <span className="text-muted-foreground">{ch.sessions.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ch.color }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Top Visited Pages & Products Table (4 Cols) */}
              <Card className="lg:col-span-4">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Top Landing Pages & Products
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Most visited page paths and product catalogs
                      </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-[180px]">
                      <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Search page..."
                        value={pageSearch}
                        onChange={(e) => setPageSearch(e.target.value)}
                        className="pl-7 h-7 text-xs"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead>Page Path / Title</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                          <TableHead className="text-right">Unique</TableHead>
                          <TableHead className="text-right">Avg Time</TableHead>
                          <TableHead className="text-right">Bounce</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {filteredPages.map((pg, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/40">
                            <TableCell className="font-semibold max-w-[180px]">
                              <p className="text-foreground truncate">{pg.title}</p>
                              <p className="text-[11px] font-mono text-muted-foreground truncate">{pg.path}</p>
                            </TableCell>
                            <TableCell className="text-right font-medium">{pg.pageviews.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{pg.uniqueViews.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{pg.avgTime}</TableCell>
                            <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                              {pg.bounceRate}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: REAL-TIME STREAM */}
        {activeTab === 'realtime' && (
          <RealtimeStreamTab realtimeCount={realtimeCount} />
        )}

        {/* TAB 3: ACQUISITION CHANNELS */}
        {activeTab === 'acquisition' && (
          <AcquisitionTab channels={data.channels} />
        )}

        {/* TAB 4: ECOMMERCE FUNNEL */}
        {activeTab === 'ecommerce' && (
          <EcommerceFunnelTab
            funnelStages={data.funnelStages}
            conversionRate={data.kpis.conversionRate}
          />
        )}

        {/* TAB 5: AUDIENCE & TECH */}
        {activeTab === 'audience' && (
          <AudienceTechTab
            devices={data.devices}
            browsers={data.browsers}
            operatingSystems={data.operatingSystems}
            geoLocations={data.geoLocations}
          />
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
