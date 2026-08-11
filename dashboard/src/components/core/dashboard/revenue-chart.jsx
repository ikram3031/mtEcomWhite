import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/core/ui/card';
import { useEffect, useState } from 'react';
import { useOrderCounts } from '@/hooks/core/use-order-counts';

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
        <p className="font-semibold text-foreground mb-0.5">{label}</p>
        <p className="text-primary font-bold">{payload[0].value} Orders</p>
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  const [mounted, setMounted] = useState(false);
  const { data: counts = [], isLoading } = useOrderCounts(30);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = (counts || []).map((c) => ({
    name: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: c.count,
  }));

  // Show only every ~4th label to avoid crowding
  const tickInterval = Math.floor(data.length / 8);

  if (!mounted || isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-4 h-[400px]">
        <CardHeader>
          <CardTitle>Orders (last 30 days)</CardTitle>
          <CardDescription>Daily order counts for the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some((d) => d.count > 0);

  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle>Orders (last 30 days)</CardTitle>
        <CardDescription>Daily order counts for the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 sm:pt-0">
        {!hasData ? (
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
            No order data in the last 30 days.
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  width={28}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#orderGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--background)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
