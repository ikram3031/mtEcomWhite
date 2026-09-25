import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ExternalLink, CheckCircle2, TrendingUp, Package, CreditCard, DollarSign } from 'lucide-react';
import { getGA4ReportUrls } from '../analyticsData';

// Tab component visualizing real ecommerce store performance and GA4 monetization deep link
export const EcommerceFunnelTab = ({ kpis = {}, topProducts = [], paymentMethods = [], config = {} }) => {
  const urls = getGA4ReportUrls(config?.propertyId);

  return (
    <div className="space-y-6">
      {/* Real Store Ecommerce Summary Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span>Storefront Ecommerce & Conversion Tracking</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time verified orders, item purchases, and revenue tracked in store database and GA4.
              </CardDescription>
            </div>
            <a
              href={urls.monetization}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shrink-0"
            >
              <span>View GA4 Monetization Report</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-primary/20 text-xs">
            <div>
              <p className="text-[11px] text-muted-foreground">Total Revenue (BDT)</p>
              <p className="text-base font-bold text-foreground">৳{(kpis.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total Placed Orders</p>
              <p className="text-base font-bold text-foreground">{(kpis.totalOrders || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Completed / Delivered</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{(kpis.completedOrders || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Average Order Value (AOV)</p>
              <p className="text-base font-bold text-foreground">৳{(kpis.averageOrderValue || 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real Top Products & Payment Gateways Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Real Top Products Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span>Top Sold Products</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Direct store sales and items purchased by customers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length > 0 ? (
              <div className="divide-y divide-border text-xs">
                {topProducts.slice(0, 6).map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{prod.name}</p>
                      <p className="text-[11px] text-muted-foreground">Quantity Sold: {prod.quantitySold}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">৳{prod.revenue?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No product purchase records found for this period.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real Payment Methods Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>Payment Methods Breakdown</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Payment channels used to finalize checkout purchases
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {paymentMethods.length > 0 ? (
              <div className="divide-y divide-border text-xs">
                {paymentMethods.map((pm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground capitalize">{pm.method}</p>
                      <p className="text-[11px] text-muted-foreground">{pm.orders} order(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">৳{pm.total?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No payment transactions recorded for this period.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
