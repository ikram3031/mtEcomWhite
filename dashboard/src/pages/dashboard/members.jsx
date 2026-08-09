import { useState } from 'react';
import { MembersTable } from '@/components/core/dashboard/members-table';
import { Input } from '@/components/core/ui/input';
import { Search, Trash2, UserMinus } from 'lucide-react';
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

const MembersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkInactiveOpen, setBulkInactiveOpen] = useState(false);
  const [isBulkInactiveUpdating, setIsBulkInactiveUpdating] = useState(false);

  const queryClient = useQueryClient();

  const handleSearch = (q) => {
    setSearchQuery(q);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleSegment = (v) => {
    setSegmentFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) => apiClient.delete(`/api/v1/members/${id}`))
      );
      toast.success('Selected members deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error('Failed to delete some members.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkInactive = async () => {
    setIsBulkInactiveUpdating(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          apiClient.put(`/api/v1/members/${id}`, { active: false })
        )
      );
      toast.success('Selected members marked as Inactive.');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setSelectedIds([]);
      setBulkInactiveOpen(false);
    } catch {
      toast.error('Failed to update status for some members.');
    } finally {
      setIsBulkInactiveUpdating(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members & Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing 15 members per page
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <div className="flex gap-1.5 items-center mr-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkInactiveOpen(true)}
                className="flex items-center gap-1 text-xs"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Deactivate Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                className="flex items-center gap-1 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          )}
          <Select value={segmentFilter} onValueChange={handleSegment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Segments</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Returning">Returning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card text-card-foreground shadow-sm border rounded-xl overflow-hidden">
        <div className="p-6">
          <MembersTable
            searchQuery={searchQuery}
            segmentFilter={segmentFilter}
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

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title="Delete Selected Members"
        description={`Are you sure you want to delete the ${selectedIds.length} selected members? This action cannot be undone.`}
      />

      <Dialog open={bulkInactiveOpen} onOpenChange={setBulkInactiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-destructive" />
              Deactivate Selected Members
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to mark the {selectedIds.length} selected members as <span className="font-semibold text-destructive">Inactive</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkInactiveOpen(false)}
              disabled={isBulkInactiveUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkInactive}
              disabled={isBulkInactiveUpdating}
            >
              {isBulkInactiveUpdating ? 'Updating...' : 'Yes, Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MembersPage;
