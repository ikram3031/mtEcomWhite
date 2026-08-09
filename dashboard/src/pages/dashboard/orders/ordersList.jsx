import { useState } from 'react';
import { OrdersTable } from '@/components/core/dashboard/orders-table';
import { Input } from '@/components/core/ui/input';
import { Button } from '@/components/core/ui/button';
import { Search, Download, PlusCircle } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/core/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/core/ui/pagination';

import { Trash2 } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/core/ui/confirm-delete-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/core/ui/dialog';
import { apiClient } from '@/lib/core/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState(null);
  const [bulkPaymentTarget, setBulkPaymentTarget] = useState(null);
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const queryClient = useQueryClient();

  const handleSearch = (q) => {
    setSearchQuery(q);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleStatus = (v) => {
    setStatusFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handlePayment = (v) => {
    setPaymentFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await apiClient.post('/api/v1/orders/bulk-delete', { ids: selectedIds });
      toast.success('Selected orders deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error('Failed to delete some orders.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (!status || status === 'placeholder') return;
    try {
      await apiClient.post('/api/v1/orders/bulk-update', { ids: selectedIds, status });
      toast.success(`Selected orders updated to status "${status}".`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedIds([]);
    } catch {
      toast.error('Failed to update orders.');
    }
  };

  const handleBulkPaymentChange = async (paymentStatus) => {
    if (!paymentStatus || paymentStatus === 'placeholder') return;
    try {
      await apiClient.post('/api/v1/orders/bulk-update', { ids: selectedIds, paymentStatus });
      toast.success(`Selected orders updated to payment status "${paymentStatus}".`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedIds([]);
    } catch {
      toast.error('Failed to update orders.');
    }
  };
 
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" nativeButton={false} render={<a href="/dashboard/orders/new" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New In-Store Order
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Orders
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by order ID or customer..."
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
          {selectedIds.length === 0 && (
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={handleStatus}>
                <SelectTrigger className="w-[180px] h-9 cursor-pointer text-xs">
                  <span>{statusFilter === 'All' ? 'Order Status: All' : `Order Status: ${statusFilter}`}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="All">Order Status: All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={handlePayment}>
                <SelectTrigger className="w-[160px] h-9 cursor-pointer text-xs">
                  <span>{paymentFilter === 'All' ? 'Payment: All' : `Payment: ${paymentFilter}`}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="All">Payment: All</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="flex gap-1.5 items-center ml-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:inline">{selectedIds.length} selected:</span>

              <Select value="" onValueChange={(val) => val && setBulkPaymentTarget(val)}>
                <SelectTrigger className="w-[145px] h-9 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium cursor-pointer text-xs">
                  <span>Payment Status</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="Paid" className="cursor-pointer text-xs">Paid</SelectItem>
                  <SelectItem value="Pending" className="cursor-pointer text-xs">Pending</SelectItem>
                  <SelectItem value="Failed" className="cursor-pointer text-xs">Failed</SelectItem>
                  <SelectItem value="Refunded" className="cursor-pointer text-xs">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value="" onValueChange={(val) => val && setBulkStatusTarget(val)}>
                <SelectTrigger className="w-[135px] h-9 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer text-xs">
                  <span>Order Status</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="Pending" className="cursor-pointer text-xs">Pending</SelectItem>
                  <SelectItem value="Processing" className="cursor-pointer text-xs">Processing</SelectItem>
                  <SelectItem value="Shipped" className="cursor-pointer text-xs">Shipped</SelectItem>
                  <SelectItem value="Delivered" className="cursor-pointer text-xs">Delivered</SelectItem>
                  <SelectItem value="Cancelled" className="cursor-pointer text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                size="icon"
                onClick={() => setBulkDeleteOpen(true)}
                className="h-9 w-9 flex items-center justify-center shrink-0 cursor-pointer"
                title={`Delete Selected (${selectedIds.length})`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-card text-card-foreground shadow-sm border rounded-lg">
        <div className="p-6">
          <OrdersTable
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            paymentFilter={paymentFilter}
            page={currentPage}
            onTotalPagesChange={setTotalPages}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
          />

          <div className="border-t mt-4 pt-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage((p) => p - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;

                  if (!showPage) {
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      <Dialog open={!!bulkStatusTarget} onOpenChange={(open) => !open && setBulkStatusTarget(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Confirm Order Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the Order Status of <span className="font-semibold text-foreground">{selectedIds.length}</span> selected orders to <span className="font-semibold text-foreground">"{bulkStatusTarget}"</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusTarget(null)} disabled={isUpdatingBulk}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={async () => {
                if (bulkStatusTarget) {
                  setIsUpdatingBulk(true);
                  await handleBulkStatusChange(bulkStatusTarget);
                  setIsUpdatingBulk(false);
                  setBulkStatusTarget(null);
                }
              }}
              disabled={isUpdatingBulk}
            >
              {isUpdatingBulk ? 'Updating...' : 'Yes, Change Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bulkPaymentTarget} onOpenChange={(open) => !open && setBulkPaymentTarget(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Confirm Payment Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the Payment Status of <span className="font-semibold text-foreground">{selectedIds.length}</span> selected orders to <span className="font-semibold text-foreground">"{bulkPaymentTarget}"</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPaymentTarget(null)} disabled={isUpdatingBulk}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={async () => {
                if (bulkPaymentTarget) {
                  setIsUpdatingBulk(true);
                  await handleBulkPaymentChange(bulkPaymentTarget);
                  setIsUpdatingBulk(false);
                  setBulkPaymentTarget(null);
                }
              }}
              disabled={isUpdatingBulk}
            >
              {isUpdatingBulk ? 'Updating...' : 'Yes, Change Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title="Delete Selected Orders"
        description={`Are you sure you want to permanently delete the ${selectedIds.length} selected orders? This action cannot be undone.`}
      />
    </div>
  );
}

export default OrdersPage;
