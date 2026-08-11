import { useMemo } from 'react';
import { useOrderStatusDistribution } from '@/hooks/core/use-order-status-distribution';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/ui/card';

// Distinct colors per status — theme vars where possible, explicit hex where theme lacks contrast
const STATUS_CONFIG = {
  processing: { label: 'Processing', color: 'var(--chart-1)' },  // Gold/amber from theme
  shipped: { label: 'Shipped', color: '#3b82f6' },               // Blue-500 — no blue theme var available
  completed: { label: 'Completed', color: '#10b981' },           // Emerald-500 green
  cancelled: { label: 'Cancelled', color: 'var(--destructive)' }, // Destructive red from theme
};

// Custom tooltip matching the dashboard design language
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-foreground mb-0.5">{name}</p>
      <p className="text-muted-foreground">
        {value} orders · <span className="font-medium text-foreground">{percent}%</span>
      </p>
    </div>
  );
};

export const OrderStatusPie = ({ range = '30days' }) => {
  const { data: statusCounts = {}, isLoading } = useOrderStatusDistribution(range);

  const { chartData, total } = useMemo(() => {
    const t = Object.values(statusCounts).reduce((sum, v) => sum + v, 0);
    const data = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
      name: cfg.label,
      value: statusCounts[key] || 0,
      color: cfg.color,
      percent: t ? ((( statusCounts[key] || 0) / t) * 100).toFixed(1) : '0.0',
    }));
    return { chartData: data, total: t };
  }, [statusCounts]);

  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-3 h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Order Pipeline</CardTitle>
        <CardDescription>Status distribution overview</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {total === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
            No orders in this period
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="w-full h-[200px]">
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
                    cornerRadius={4}
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend table — clean inline list */}
            <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2 px-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground tabular-nums">
                    {item.value} <span className="text-muted-foreground font-normal">({item.percent}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderStatusPie;
