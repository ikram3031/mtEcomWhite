import { useOrderStatusDistribution } from '@/hooks/use-order-status-distribution';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const STATUS_CONFIG = {
  processing: { label: 'Processing', color: '#f59e0b' },
  shipped: { label: 'Shipped', color: '#3b82f6' },
  completed: { label: 'Completed', color: '#10b981' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

export function OrderStatusPie({ range = '30days' }) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: statusCounts = {}, isLoading } = useOrderStatusDistribution(range);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const total = Object.values(statusCounts).reduce((sum, v) => sum + Number(v || 0), 0);

  const chartData = Object.entries(statusCounts).map(([status, count]) => {
    const key = status.toLowerCase();
    const cfg = STATUS_CONFIG[key] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: '#8b5cf6',
    };
    return {
      name: cfg.label,
      value: Number(count || 0),
      color: cfg.color,
      percent: total ? ((Number(count || 0) / total) * 100).toFixed(1) : '0',
    };
  });

  return (
    <Card className="col-span-1 lg:col-span-3 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Order Status</CardTitle>
        <CardDescription>Distribution of order statuses (last 30 days).</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center pb-4">
        {!mounted || isLoading ? (
          <div className="h-[220px] w-full flex items-center justify-center text-muted-foreground text-sm">
            Loading chart...
          </div>
        ) : total === 0 ? (
          <div className="h-[220px] w-full flex items-center justify-center text-muted-foreground text-sm">
            No order status data available.
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      color: isDark ? '#f9fafb' : '#111827',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => [
                      `${value} (${total ? ((value / total) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{total}</span>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Orders</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 w-full px-4">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OrderStatusPie;
