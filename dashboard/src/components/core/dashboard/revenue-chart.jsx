import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/core/ui/card';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useOrderCounts } from '@/hooks/core/use-order-counts';

export function RevenueChart() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: counts = [] } = useOrderCounts(30);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const data = (counts || []).map((c) => ({
    name: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: c.count,
  }));

  if (!mounted) {
    return (
      <Card className="col-span-1 lg:col-span-4 h-[400px]">
        <CardHeader>
          <CardTitle>Orders (last 30 days)</CardTitle>
          <CardDescription>Daily order counts for the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle>Orders (last 30 days)</CardTitle>
        <CardDescription>Daily order counts for the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 sm:pt-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  color: isDark ? '#f9fafb' : '#111827',
                  borderRadius: '6px',
                }}
                formatter={(value) => [value, 'Orders']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
