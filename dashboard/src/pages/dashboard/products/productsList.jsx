import { useState } from 'react';
import { ProductsTable } from '@/components/core/dashboard/products-table';
import { Input } from '@/components/core/ui/input';
import { Search, Plus, Trash2, PackageX } from 'lucide-react';
import { useCategories, useBrands } from '@/lib/core/category-cache';
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
import { Button } from '@/components/core/ui/button';
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

const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkStockUpdating, setIsBulkStockUpdating] = useState(false);
  const [bulkStockConfirmStatus, setBulkStockConfirmStatus] = useState(null);

  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const handleSearch = (q) => {
    setSearchQuery(q);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleCategory = (v) => {
    setCategoryFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleBrand = (v) => {
    setBrandFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleStockStatus = (v) => {
    setStockStatusFilter(v);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) => apiClient.delete(`/api/v1/products/${id}`))
      );
      toast.success('Selected products deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error('Failed to delete some products.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStockStatus = async (status) => {
    setIsBulkStockUpdating(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          apiClient.put(`/api/v1/products/${id}`, { stockStatus: status })
        )
      );
      toast.success(
        `Selected products marked as ${status === 'instock' ? 'In Stock' : 'Out of Stock'}.`
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedIds([]);
    } catch {
      toast.error('Failed to update stock status for some products.');
    } finally {
      setIsBulkStockUpdating(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Products & Inventory</h2>
        <a
          href="/dashboard/products/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Product
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto ml-auto justify-end flex-wrap">
          {selectedIds.length === 0 && (
            <>
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border text-xs font-medium shrink-0">
                <span className="text-[11px] text-muted-foreground px-1.5 font-semibold">Stock:</span>
                {[
                  { value: 'all', label: 'All', width: 'w-[52px]' },
                  { value: 'instock', label: 'In Stock', width: 'w-[84px]' },
                  { value: 'outofstock', label: 'Out of Stock', width: 'w-[106px]' },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-all select-none whitespace-nowrap ${item.width} ${
                      stockStatusFilter === item.value
                        ? 'bg-background text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground font-normal'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dashboardStockStatus"
                      value={item.value}
                      checked={stockStatusFilter === item.value}
                      onChange={() => handleStockStatus(item.value)}
                      className="h-3 w-3 accent-primary cursor-pointer shrink-0"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <Select value={categoryFilter} onValueChange={handleCategory}>
                <SelectTrigger className="w-[160px] h-9 cursor-pointer text-xs">
                  <span>{categoryFilter === 'All' ? 'Category: All' : `Category: ${categoryFilter}`}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="All">Category: All</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.did} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={brandFilter} onValueChange={handleBrand}>
                <SelectTrigger className="w-[160px] h-9 cursor-pointer text-xs">
                  <span>{brandFilter === 'All' ? 'Brand: All' : `Brand: ${brandFilter}`}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="All">Brand: All</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.did} value={brand.name}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {selectedIds.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{selectedIds.length} selected:</span>
              <Select
                value=""
                onValueChange={(val) => {
                  if (val === 'instock' || val === 'outofstock') {
                    setBulkStockConfirmStatus(val);
                  }
                }}
                disabled={isBulkStockUpdating}
              >
                <SelectTrigger className="w-[145px] h-9 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium cursor-pointer text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <PackageX className="h-4 w-4 flex-shrink-0" />
                    <span>Change Stock</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="instock" className="cursor-pointer text-xs">
                    Mark In Stock
                  </SelectItem>
                  <SelectItem value="outofstock" className="cursor-pointer text-xs">
                    Mark Out of Stock
                  </SelectItem>
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
          <ProductsTable
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            brandFilter={brandFilter}
            stockStatusFilter={stockStatusFilter}
            page={currentPage}
            onTotalPagesChange={setTotalPages}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
          />

          {totalPages > 1 && (
            <div className="border-t mt-4 pt-3">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage((p) => p - 1);
                          setSelectedIds([]);
                        }
                      }}
                      aria-disabled={currentPage === 1}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                            setSelectedIds([]);
                          }}
                          className="cursor-pointer"
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
                        if (currentPage < totalPages) {
                          setCurrentPage((p) => p + 1);
                          setSelectedIds([]);
                        }
                      }}
                      aria-disabled={currentPage === totalPages}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!bulkStockConfirmStatus} onOpenChange={(open) => !open && setBulkStockConfirmStatus(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Confirm Stock Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark the <span className="font-semibold text-foreground">{selectedIds.length}</span> selected products as{' '}
              <span className="font-semibold text-foreground">
                {bulkStockConfirmStatus === 'instock' ? 'In Stock' : 'Out of Stock'}
              </span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkStockConfirmStatus(null)}
              disabled={isBulkStockUpdating}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={async () => {
                if (bulkStockConfirmStatus) {
                  await handleBulkStockStatus(bulkStockConfirmStatus);
                  setBulkStockConfirmStatus(null);
                }
              }}
              disabled={isBulkStockUpdating}
            >
              {isBulkStockUpdating ? 'Updating...' : 'Yes, Change Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title="Delete Selected Products"
        description={`Are you sure you want to delete the ${selectedIds.length} selected products? This action cannot be undone.`}
      />
    </div>
  );
}

export default ProductsPage;
