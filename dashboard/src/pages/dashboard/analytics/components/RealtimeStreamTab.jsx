import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Eye, Zap, MapPin, Smartphone, Laptop, ExternalLink } from 'lucide-react';
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
import { getRealtimeMinuteActivity, getLiveEventFeed, getClientIndustryData, getGA4ReportUrls } from '../analyticsData';

// Tab component visualizing live real-time visitors, minute activity, and real-time events
export const RealtimeStreamTab = ({ realtimeCount = 7, config = {} }) => {
  const { theme, systemTheme } = useTheme();
  const industry = getClientIndustryData();
  const accentColor = industry.accentColor || 'hsl(var(--primary))';
  const [minuteData, setMinuteData] = useState(() => getRealtimeMinuteActivity());
  const [liveEvents, setLiveEvents] = useState(() => getLiveEventFeed());
  const [activeUsers, setActiveUsers] = useState(realtimeCount);
  const urls = getGA4ReportUrls(config?.propertyId);

  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  const sampleProduct = industry.sampleProducts?.[0] || { path: '/products/featured-item', title: 'Featured Item' };
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
              74% Mobile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: '74%' }} />
              <div className="h-full bg-blue-500" style={{ width: '22%' }} />
              <div className="h-full bg-indigo-500" style={{ width: '4%' }} />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
              <span>Mobile: 74%</span>
              <span>Desktop: 22%</span>
              <span>Tablet: 4%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span>Top Location Now</span>
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              Dhaka, Bangladesh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              62% of real-time visitors are browsing from Dhaka metropolitan area.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 30-Minute Minute by Minute Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                <span>Users per Minute (Last 30 Minutes)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Minute-by-minute active visitor stream on storefront
              </CardDescription>
            </div>
            <a
              href={urls.realtime}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
            >
              <span>Open official GA4 Realtime Console</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={minuteData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262626' : '#f0f0f0'} />
                <XAxis dataKey="time" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#171717' : '#ffffff',
                    borderColor: isDark ? '#333333' : '#e5e7eb',
                    color: isDark ? '#f9fafb' : '#111827',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="activeUsers" name="Active Users" fill={accentColor} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Active Pages & Live Event Stream */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Active Pages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span>Top Active Pages Right Now</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border text-xs">
              {activePages.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-muted/40">
                  <div className="space-y-0.5 max-w-[240px]">
                    <p className="font-semibold text-foreground truncate">{p.title}</p>
                    <p className="font-mono text-[11px] text-muted-foreground truncate">{p.path}</p>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {p.users} user(s)
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Visitor Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span>Real-time Event Stream</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border text-xs">
              {liveEvents.map((evt) => (
                <div key={evt.id} className="flex items-center justify-between p-3 hover:bg-muted/40">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${evt.badge}`}>
                        {evt.type}
                      </span>
                      <span className="font-medium text-foreground">{evt.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{evt.location}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{evt.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
