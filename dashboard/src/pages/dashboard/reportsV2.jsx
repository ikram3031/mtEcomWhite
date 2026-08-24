import { useState } from 'react';
import { Download, RefreshCw, Calendar, TrendingUp, Package, CreditCard, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useReports } from '@/hooks/use-reports';
import { exportToCsv } from '@/utils/exportCsv';
import clientConfig from '@/clientConfig';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const reportsConfig = clientConfig?.reports || {
  enableInStoreFilter: true,
  enableExport: true,
  enabledTabs: ['sales', 'products', 'payments', 'inventory']
};

const formatCurrency = (value) => `৳${(value || 0).toLocaleString()}`;

const ReportsV2Page = () => {
  const [range, setRange] = useState('30days');
  const [channel, setChannel] = useState('all');
  const [activeTab, setActiveTab] = useState(reportsConfig.enabledTabs[0] || 'sales');

  const { summary, timeline, products, payments, inventory, isLoading, isRefetching, refetchAll } = useReports({
    range,
    channel,
  });

  const handleExport = () => {
    let dataToExport = [];
    let filename = `report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    switch (activeTab) {
      case 'sales':
        dataToExport = timeline.data?.map(t => ({
          Date: t._id,
          'Gross Sales': t.grossSales,
          'Net Sales': t.netSales,
          Discounts: t.discount,
          'Orders Count': t.ordersCount
        })) || [];
        break;
      case 'products':
        dataToExport = products.data?.map(p => ({
          'Product Name': p._id,
          SKU: p.sku || 'N/A',
          'Units Sold': p.unitsSold,
          Revenue: p.revenue
        })) || [];
        break;
      case 'payments':
        dataToExport = payments.data?.map(p => ({
          'Payment Method': p._id || 'Unknown',
          Transactions: p.transactionCount,
          'Total Amount': p.totalAmount,
          'Paid Amount': p.paidAmount
        })) || [];
        break;
      case 'inventory':
        dataToExport = inventory.data?.alerts?.map(a => ({
          'Product Name': a.name,
          SKU: a.sku || 'N/A',
          Type: a.type,
          Stock: a.stock,
          Status: a.status
        })) || [];
        break;
    }

    exportToCsv(dataToExport, filename);
  };

  const showInStoreFilter = reportsConfig.enableInStoreFilter;
  const showExport = reportsConfig.enableExport;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time performance metrics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>

          {showInStoreFilter && (
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="online">Online Store</SelectItem>
                <SelectItem value="pos">In-Store POS</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" onClick={refetchAll} disabled={isLoading || isRefetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {showExport && (
            <Button onClick={handleExport} disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.data?.netSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gross: {formatCurrency(summary.data?.grossSales)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.data?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed {channel !== 'all' ? channel : 'all channels'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.data?.aov)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">-{formatCurrency(summary.data?.totalDiscount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Discounts given in this period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          {reportsConfig.enabledTabs.includes('sales') && <TabsTrigger value="sales">Sales & Revenue</TabsTrigger>}
          {reportsConfig.enabledTabs.includes('products') && <TabsTrigger value="products">Top Products</TabsTrigger>}
          {reportsConfig.enabledTabs.includes('payments') && <TabsTrigger value="payments">Payment Analytics</TabsTrigger>}
          {reportsConfig.enabledTabs.includes('inventory') && <TabsTrigger value="inventory">Inventory Health</TabsTrigger>}
        </TabsList>

        {reportsConfig.enabledTabs.includes('sales') && (
          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Timeline</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                {timeline.isLoading ? (
                  <div className="h-full flex items-center justify-center">Loading chart...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline.data || []}>
                      <defs>
                        <linearGradient id="colorNetSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="_id" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="netSales" name="Net Sales" stroke="#10b981" fillOpacity={1} fill="url(#colorNetSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Orders Count</TableHead>
                      <TableHead>Gross Sales</TableHead>
                      <TableHead>Discounts</TableHead>
                      <TableHead className="text-right">Net Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeline.data?.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell className="font-medium">{row._id}</TableCell>
                        <TableCell>{row.ordersCount}</TableCell>
                        <TableCell>{formatCurrency(row.grossSales)}</TableCell>
                        <TableCell className="text-red-500">-{formatCurrency(row.discount)}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(row.netSales)}</TableCell>
                      </TableRow>
                    ))}
                    {!timeline.data?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No sales data found for this period.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {reportsConfig.enabledTabs.includes('products') && (
          <TabsContent value="products">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.data?.map((product, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{product._id}</TableCell>
                        <TableCell className="text-muted-foreground">{product.sku || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold">{product.unitsSold}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-bold">{formatCurrency(product.revenue)}</TableCell>
                      </TableRow>
                    ))}
                    {!products.data?.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No product data found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {reportsConfig.enabledTabs.includes('payments') && (
          <TabsContent value="payments">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Paid Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.data?.map((method, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium uppercase">{method._id || 'Unknown'}</TableCell>
                        <TableCell>{method.transactionCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(method.totalAmount)}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(method.paidAmount)}</TableCell>
                      </TableRow>
                    ))}
                    {!payments.data?.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No payment data found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {reportsConfig.enabledTabs.includes('inventory') && (
          <TabsContent value="inventory" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Inventory Valuation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(inventory.data?.totalValuation)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Out of Stock Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{inventory.data?.outOfStockCount || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">{inventory.data?.lowStockCount || 0}</div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.data?.alerts?.map((alert, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{alert.name}</TableCell>
                        <TableCell className="text-muted-foreground">{alert.sku}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{alert.type}</Badge></TableCell>
                        <TableCell className="text-right font-bold">{alert.stock}</TableCell>
                        <TableCell>
                          <Badge variant={alert.stock === 0 ? "destructive" : "secondary"} className={alert.stock > 0 ? "bg-amber-500/10 text-amber-600" : ""}>
                            {alert.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!inventory.data?.alerts?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">All inventory is well stocked.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ReportsV2Page;
