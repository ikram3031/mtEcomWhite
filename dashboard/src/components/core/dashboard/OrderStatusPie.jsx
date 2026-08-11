import { useOrderStatusDistribution } from '@/hooks/core/use-order-status-distribution';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = {
  processing: '#fbbf24', // amber
  shipped: '#60a5fa', // blue
  completed: '#10b981', // emerald
  cancelled: '#ef4444', // red
};

export const OrderStatusPie = ({ range }) => {
  const { data: statusCounts, isLoading } = useOrderStatusDistribution(range);

  const total = Object.values(statusCounts).reduce((sum, v) => sum + v, 0);
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    percent: total ? ((count / total) * 100).toFixed(1) : 0,
  }));

  if (isLoading) return <div className="flex h-48 items-center justify-center">Loading chart...</div>;

  return (
    <div className="rounded-lg bg-card p-4 shadow-md">
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Order Status Distribution</h3>
      <PieChart width={300} height={300}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()] || '#8884d8'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
        />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </div>
  );
};

export default OrderStatusPie;
