import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/core/ui/table';
import { Badge } from '@/components/core/ui/badge';
import { Button } from '@/components/core/ui/button';
import { Skeleton } from '@/components/core/ui/skeleton';
import { useOrders } from '@/hooks/core/use-orders';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/core/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/core/ui/alert';
import { AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/core/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/core/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/core/ui/select';
import { ConfirmDeleteDialog } from '@/components/core/ui/confirm-delete-dialog';
import { getApiErrorMessage } from '@/lib/core/error-handler';

export function OrdersTable({
  searchQuery,
  statusFilter,
  paymentFilter,
  page = 1,
  onTotalPagesChange,
  selectedIds,
  onSelectedIdsChange,
}) {
  const queryClient = useQueryClient();

  const { data: responseData, isLoading, isError, error } = useOrders({
    search: searchQuery,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    paymentStatus: paymentFilter !== 'All' ? paymentFilter : undefined,
    page,
    limit: 15,
  });

  const orders = responseData?.data ?? [];
  const totalPages = responseData?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (onTotalPagesChange && responseData?.meta) {
      onTotalPagesChange(totalPages);
    }
  }, [totalPages, onTotalPagesChange, responseData]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [targetOrderStatus, setTargetOrderStatus] = useState('Not Found');
  const [targetPaymentStatus, setTargetPaymentStatus] = useState('Not Found');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleOpenStatusModal = (order) => {
    setStatusTarget(order);
    setTargetOrderStatus(order.orderStatus || 'Not found');
    setTargetPaymentStatus(order.paymentStatus || 'Not found');
  };

  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    try {
      await apiClient.put(`/api/v1/orders/${statusTarget.id}`, {
        orderStatus: targetOrderStatus,
        paymentStatus: targetPaymentStatus,
      });
      toast.success(`Status for order #${statusTarget.orderNumber} updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setStatusTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to update order status.'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/orders/${deleteTarget.id}`);
      toast.success(`Order ${deleteTarget.orderNumber} deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to delete order.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditOrderClick = (order) => {
    window.location.href = `/dashboard/orders/${order.id}?edit=true`;
  };

  const handleViewDetails = (order) => {
    window.location.href = `/dashboard/orders/${order.id}`;
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>;
      case 'Pending':
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 dark:text-amber-400">Pending</Badge>;
      case 'Failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFulfillmentBadge = (status) => {
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to fetch orders. {error instanceof Error ? error.message : 'Unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  const isAllPageSelected = orders.length > 0 && orders.every(order => selectedIds.includes(order.id));

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] px-4">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                checked={isAllPageSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    const pageIds = orders.map(order => order.id);
                    const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                    onSelectedIdsChange(newSelected);
                  } else {
                    const pageIds = orders.map(order => order.id);
                    onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[150px]">Order ID</TableHead>
            <TableHead className="w-[180px]">Customer Name</TableHead>
            <TableHead className="w-[110px]">Date</TableHead>
            <TableHead className="w-[120px]">Total Amount</TableHead>
            <TableHead className="w-[100px]">Payment</TableHead>
            <TableHead className="w-[120px]">Fulfillment</TableHead>
            <TableHead className="w-[60px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-[50px] px-4">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="w-[50px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={selectedIds.includes(order.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectedIdsChange([...selectedIds, order.id]);
                      } else {
                        onSelectedIdsChange(selectedIds.filter(id => id !== order.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="max-w-[150px]">
                  <span className="font-semibold truncate block" title={order.orderNumber}>{order.orderNumber}</span>
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <span className="truncate block" title={order.customerName}>{order.customerName}</span>
                </TableCell>
                <TableCell className="w-[110px] text-muted-foreground whitespace-nowrap">
                  {new Date(order.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="w-[120px] font-medium whitespace-nowrap">৳{order.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="w-[100px]">{getPaymentBadge(order.paymentStatus)}</TableCell>
                <TableCell className="w-[120px]">{getFulfillmentBadge(order.orderStatus)}</TableCell>
                <TableCell className="text-right w-[60px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditOrderClick(order)}>
                        Edit Order
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenStatusModal(order)}>
                        Change Status
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => setDeleteTarget({ id: order.id, orderNumber: order.orderNumber })}
                      >
                        Delete Order
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Update order and payment status for <span className="font-semibold text-foreground">{statusTarget?.orderNumber}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Order Status</label>
              <Select value={targetOrderStatus} onValueChange={(val) => setTargetOrderStatus(val || "Not found")}>
                <SelectTrigger className="w-full h-9 cursor-pointer">
                  <SelectValue placeholder="Order status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Payment Status</label>
              <Select value={targetPaymentStatus} onValueChange={(val) => setTargetPaymentStatus(val || "Pending")}>
                <SelectTrigger className="w-full h-9 cursor-pointer">
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="n-a">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusTarget(null)} disabled={isUpdatingStatus}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteOrder}
        isDeleting={isDeleting}
        title="Delete Order"
        description={`Are you sure you want to delete order ${deleteTarget?.orderNumber ?? ''}?`}
      />
    </div>
  );
}
