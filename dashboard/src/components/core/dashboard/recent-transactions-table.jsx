import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/core/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/core/ui/card';
import { Badge } from '@/components/core/ui/badge';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { useOrders } from '@/hooks/core/use-orders';
import { Skeleton } from '@/components/core/ui/skeleton';
import { Link } from 'react-router-dom';

export function RecentTransactionsTable() {
  const { searchQuery } = useDashboardStore();
  const { data: orders, isLoading } = useOrders({
    search: searchQuery,
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
            Delivered
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:text-blue-400">
            Processing
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:text-indigo-400">
            Shipped
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:text-rose-400">
            Cancelled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400">
            Pending
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status) => {
    if (status === 'Paid') {
      return <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Paid</span>;
    }
    return <span className="text-[10px] text-muted-foreground font-medium">{status || 'Unpaid'}</span>;
  };

  const recentOrdersCount = orders?.data?.length || 0;

  return (
    <Card className="col-span-1 lg:col-span-3 flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold">Recent Orders</CardTitle>
          <CardDescription>
            You have {recentOrdersCount} recent orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="overflow-x-auto w-full">
            <Table className="w-full min-w-[320px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-[90px]">
                    Order ID
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Customer
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-[80px]">
                    Status
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right w-[90px]">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-3 px-3"><Skeleton className="h-4 w-14" /></TableCell>
                      <TableCell className="py-3 px-3">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-3"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="py-3 px-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : orders?.data && orders.data.length > 0 ? (
                  orders.data.slice(0, 5).map((tx) => (
                    <TableRow key={tx.id || tx.orderNumber} className="hover:bg-muted/30">
                      <TableCell className="py-2.5 px-3 font-semibold text-xs text-foreground">
                        <Link 
                          to={`/dashboard/orders`}
                          className="hover:underline text-primary"
                        >
                          {tx.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <div className="flex flex-col max-w-[120px] sm:max-w-none">
                          <span className="font-medium text-xs text-foreground truncate" title={tx.customerName}>
                            {tx.customerName || 'Walk-in Customer'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {getPaymentStatusBadge(tx.paymentStatus)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        {getStatusBadge(tx.orderStatus)}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-medium text-xs text-foreground">
                        ৳{tx.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                      No recent orders.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </div>
      
      {orders?.data && orders.data.length > 5 && (
        <div className="p-4 pt-0 border-t border-border/40 mt-auto">
          <Link
            to="/dashboard/orders"
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center justify-center py-2"
          >
            View All Orders
          </Link>
        </div>
      )}
    </Card>
  );
}
