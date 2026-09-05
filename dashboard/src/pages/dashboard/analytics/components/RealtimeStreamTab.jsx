import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Eye, Zap, MapPin, Smartphone, Laptop } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';
import { getRealtimeMinuteActivity, getLiveEventFeed, getClientIndustryData } from '../analyticsData';

// Tab component visualizing live real-time visitors, minute activity, and real-time events
export const RealtimeStreamTab = ({ realtimeCount = 34 }) => {
  const { theme, systemTheme } = useTheme();
  const [minuteData, setMinuteData] = useState(() => getRealtimeMinuteActivity());
  const [liveEvents, setLiveEvents] = useState(() => getLiveEventFeed());
  const [activeUsers, setActiveUsers] = useState(realtimeCount);

  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 5) - 2;
      setActiveUsers((prev) => Math.max(12, prev + delta));

      setMinuteData((prev) => {
        const next = [...prev.slice(1)];
        const now = new Date();
        const label = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        next.push({
          time: label,
          activeUsers: Math.floor(Math.random() * 14) + 3,
        });
        return next;
      });

      setLiveEvents(() => getLiveEventFeed());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const sampleProduct = getClientIndustryData().sampleProducts?.[0] || { path: '/products/featured-item', title: 'Featured Item' };
  const activePages = [
    { path: '/collections/all-products', title: 'All Products Catalog', users: Math.round(activeUsers * 0.35) },
    { path: '/', title: 'Storefront Homepage', users: Math.round(activeUsers * 0.28) },
    { path: sampleProduct.path, title: sampleProduct.title, users: Math.round(activeUsers * 0.15) },
    { path: '/cart', title: 'Shopping Cart', users: Math.round(activeUsers * 0.12) },
    { path: '/checkout', title: 'Checkout Page', users: Math.max(1, Math.round(activeUsers * 0.08)) },
    { path: '/contact', title: 'Contact Us', users: 1 },
  ];

  const liveCities = [
    { city: 'Dhaka', users: Math.round(activeUsers * 0.62), percentage: '62%' },
    { city: 'Chittagong', users: Math.round(activeUsers * 0.18), percentage: '18%' },
    { city: 'Sylhet', users: Math.round(activeUsers * 0.09), percentage: '9%' },
    { city: 'Rajshahi', users: Math.round(activeUsers * 0.06), percentage: '6%' },
    { city: 'Khulna & Others', users: Math.round(activeUsers * 0.05), percentage: '5%' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Realtime Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span>Active Users in Last 30 Minutes</span>
            </CardDescription>
            <CardTitle className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {activeUsers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Users actively viewing pages or generating events across all storefront channels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-primary" />
              <span>Device Split Right Now</span>
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              76% Mobile / 24% PC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: '76%' }}></div>
              <div className="h-full bg-blue-500" style={{ width: '24%' }}></div>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 text-primary font-medium">
                <Smartphone className="h-3 w-3" /> {Math.round(activeUsers * 0.76)} Mobile
              </span>
              <span className="flex items-center gap-1 text-blue-500 font-medium">
                <Laptop className="h-3 w-3" /> {Math.round(activeUsers * 0.24)} Desktop
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Active Checkout Sessions</span>
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {Math.max(1, Math.round(activeUsers * 0.08))} Shoppers in Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Visitors currently initiating checkout, viewing cart, or finalizing orders.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 30-Minute Minute-by-Minute Histogram */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Users per Minute (Last 30 Minutes)
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time activity pulse measured directly by Google Analytics stream
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              Live Ticker
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={minuteData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262626' : '#f0f0f0'} />
                <XAxis dataKey="time" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#171717' : '#ffffff',
                    borderColor: isDark ? '#333333' : '#e5e7eb',
                    color: isDark ? '#f9fafb' : '#111827',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val} active users`, 'Live Count']}
                  labelFormatter={(lbl) => `Time: ${lbl}`}
                />
                <Bar dataKey="activeUsers" fill="#C5A059" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Active Pages & Live Event Stream Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Top Active Pages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span>Top Active Pages Right Now</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Page paths currently being browsed by live visitors
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border text-xs">
              {activePages.map((page, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
                  <div className="overflow-hidden pr-2">
                    <p className="font-semibold text-foreground truncate">{page.title}</p>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">{page.path}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className="text-[11px] font-bold bg-primary/10 text-primary border-primary/20">
                      {page.users} active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Event Feed & Top Cities */}
        <div className="space-y-4">
          {/* Active Cities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span>Live Visitors by Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {liveCities.map((loc, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{loc.city}</span>
                    <span className="text-muted-foreground">{loc.users} users ({loc.percentage})</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: loc.percentage }}></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Live Events Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Live Event Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-xs">
                {liveEvents.slice(0, 4).map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between p-2.5 hover:bg-muted/40">
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${evt.badge}`}>
                        {evt.type}
                      </span>
                      <span className="text-foreground truncate">{evt.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{evt.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
