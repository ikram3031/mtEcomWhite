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
import { useProducts } from '@/hooks/core/use-products';
import { getCategoryName, getBrandName } from '@/lib/core/category-cache';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/core/ui/dropdown-menu';
import { MoreHorizontal, ImageIcon, PackageX, Trash2, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/core/ui/alert';
import { AlertCircle } from 'lucide-react';
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

import { apiClient } from '@/lib/core/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/core/ui/confirm-delete-dialog';

export function ProductsTable({
  searchQuery,
  categoryFilter,
  brandFilter,
  stockStatusFilter = 'all',
  page = 1,
  onTotalPagesChange,
  selectedIds,
  onSelectedIdsChange,
}) {
  const queryClient = useQueryClient();

  const { data: responseData, isLoading, isError, error } = useProducts({
    search: searchQuery,
    category: categoryFilter !== 'All' && categoryFilter !== 'LowStock' ? categoryFilter : undefined,
    brand: brandFilter !== 'All' ? brandFilter : undefined,
    stockStatus: stockStatusFilter !== 'all' ? stockStatusFilter : undefined,
    page,
    limit: 15,
  });

  const products = responseData?.data ?? [];
  const totalPages = responseData?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (onTotalPagesChange && responseData?.meta) {
      onTotalPagesChange(totalPages);
    }
  }, [totalPages, onTotalPagesChange, responseData]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/products/${deleteTarget.id}`);
      toast.success(`Product "${deleteTarget.name}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSelectedIdsChange(selectedIds.filter(id => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  const [stockTarget, setStockTarget] = useState(null);
  const [targetStockStatus, setTargetStockStatus] = useState('instock');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  useEffect(() => {
    if (stockTarget) {
      setTargetStockStatus(stockTarget.status === 'In Stock' ? 'instock' : 'outofstock');
    }
  }, [stockTarget]);

  const handleUpdateStockStatus = async () => {
    if (!stockTarget) return;
    setIsUpdatingStock(true);
    try {
      await apiClient.put(`/api/v1/products/${stockTarget.id}`, {
        stockStatus: targetStockStatus,
      });
      toast.success(`Stock status of "${stockTarget.name}" updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setStockTarget(null);
    } catch {
      toast.error('Failed to update stock status.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to fetch products. {error instanceof Error ? error.message : 'Unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  const isAllPageSelected = products.length > 0 && products.every(p => selectedIds.includes(p.id));

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
                    const pageIds = products.map(p => p.id);
                    const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                    onSelectedIdsChange(newSelected);
                  } else {
                    const pageIds = products.map(p => p.id);
                    onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[280px] min-w-[180px]">Product</TableHead>
            <TableHead className="w-[120px]">SKU</TableHead>
            <TableHead className="w-[140px]">Category</TableHead>
            <TableHead className="w-[120px]">Brand</TableHead>
            <TableHead className="w-[100px]">Price</TableHead>
            <TableHead className="w-[120px] min-w-[120px]">Status</TableHead>
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
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-md flex-shrink-0" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : products && products.length > 0 ? (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="w-[50px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={selectedIds.includes(product.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectedIdsChange([...selectedIds, product.id]);
                      } else {
                        onSelectedIdsChange(selectedIds.filter(id => id !== product.id));
                      }
                    }}
                  />
                </TableCell>
                {/* Product name + image */}
                <TableCell className="max-w-[200px]">
                  <a href={`/dashboard/products/${product.id}`} className="flex items-center gap-3 min-w-0 hover:underline">
                    {product.image ? (
                      <div className="relative h-9 w-9 overflow-hidden rounded-md border flex-shrink-0">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted flex-shrink-0">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium truncate" title={product.name}>{product.name}</span>
                  </a>
                </TableCell>

                {/* SKU */}
                <TableCell className="max-w-[120px]">
                  <span className="text-muted-foreground truncate block" title={product.sku}>{product.sku}</span>
                </TableCell>

                {/* Category */}
                <TableCell className="max-w-[140px]">
                  <span className="truncate block" title={getCategoryName(product.category) || product.category}>
                    {getCategoryName(product.category) || product.category}
                  </span>
                </TableCell>

                {/* Brand */}
                <TableCell className="max-w-[120px]">
                  <span className="truncate block text-muted-foreground" title={product.brand ? (getBrandName(product.brand) || product.brand) : '—'}>
                    {product.brand ? (getBrandName(product.brand) || product.brand) : '—'}
                  </span>
                </TableCell>

                {/* Price */}
                <TableCell className="w-[100px] font-medium">৳{product.price.toFixed(2)}</TableCell>

                {/* Stock status */}
                <TableCell className="w-[120px] min-w-[120px]">
                  {product.status === 'In Stock' ? (
                    <Badge className="w-[100px] inline-flex items-center justify-center text-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 whitespace-nowrap shrink-0" variant="outline">
                      In Stock
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="w-[100px] inline-flex items-center justify-center text-center bg-destructive/10 text-destructive border-destructive/20 whitespace-nowrap shrink-0">
                      Out of Stock
                    </Badge>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right w-[60px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="min-w-[150px]">
                      <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                      <DropdownMenuItem render={
                        <a href={`/dashboard/products/${product.id}`} className="cursor-pointer text-xs flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          View / Edit Product
                        </a>
                      } />
                      <DropdownMenuItem
                        className="cursor-pointer text-xs flex items-center gap-2"
                        onClick={() => setStockTarget(product)}
                      >
                        <PackageX className="h-3.5 w-3.5 text-muted-foreground" />
                        Change Stock
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer text-xs flex items-center gap-2"
                        onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Product
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No products found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!stockTarget} onOpenChange={(open) => !open && setStockTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change Stock Status</DialogTitle>
            <DialogDescription>
              Update the availability status for <span className="font-semibold text-foreground">{stockTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Current Status:</span>
              <span className="text-sm font-semibold">
                {stockTarget?.status === 'In Stock' ? (
                  <span className="text-emerald-600">In Stock</span>
                ) : (
                  <span className="text-red-600">Out of Stock</span>
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">New Availability:</span>
              <Select value={targetStockStatus} onValueChange={(val) => setTargetStockStatus(val || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instock">In Stock</SelectItem>
                  <SelectItem value="outofstock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStockTarget(null)}
              disabled={isUpdatingStock}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={handleUpdateStockStatus}
              disabled={isUpdatingStock}
            >
              {isUpdatingStock ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteProduct}
        isDeleting={isDeleting}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
      />
    </div>
  );
}
