import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Share2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';

// Tab component detailing customer traffic acquisition channels and source performance
export const AcquisitionTab = ({ channels = [] }) => {
  const { theme, systemTheme } = useTheme();
  const [search, setSearch] = useState('');
  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  const filteredChannels = channels.filter((c) =>
    c.channel.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = channels.map((c) => ({
    name: c.channel.replace(/\s*\(.*?\)\s*/g, ''),
    users: c.users,
    sessions: c.sessions,
    revenue: c.revenue,
  }));

  return (
    <div className="space-y-4">
      {/* Channel Comparison Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            <span>Traffic & Sessions by Channel</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Comparison of total user acquisition volume and overall sessions generated per marketing source
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262626' : '#f0f0f0'} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="users" name="Active Users" fill="#C5A059" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sessions" name="Sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Channel Breakdown Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Acquisition Channel Performance Table
              </CardTitle>
              <CardDescription className="text-xs">
                Deep dive into user engagement, bounce rate, and tracked ecommerce revenue per channel
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search channel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Channel Source</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Engagement Rate</TableHead>
                  <TableHead className="text-right">Bounce Rate</TableHead>
                  <TableHead className="text-right">Avg Session</TableHead>
                  <TableHead className="text-right">Revenue (৳)</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {filteredChannels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      No channels found matching "{search}"
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChannels.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/40">
                      <TableCell className="font-semibold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span>{item.channel}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.users.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{item.sessions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border-emerald-500/20">
                          {item.engagementRate}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.bounceRate}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.avgDuration}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        ৳{item.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">{item.transactions}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
