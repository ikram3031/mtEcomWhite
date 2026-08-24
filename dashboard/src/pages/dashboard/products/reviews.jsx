import { useState } from 'react';
import { ReviewsTable } from '@/components/dashboard/reviews-table';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

const ReviewsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setSelectedIds([]);
  };

  const handleStatusFilter = (v) => {
    setStatusFilter(v ?? 'All');
    setSelectedIds([]);
  };

  const handleBulkApprove = async (isApproved) => {
    try {
      await apiClient.post('/api/v1/reviews/bulk-update', {
        ids: selectedIds,
        isApproved
      });
      toast.success(`Successfully updated ${selectedIds.length} reviews.`);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setSelectedIds([]);
    } catch (err) {
      toast.error('Failed to update reviews.');
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await apiClient.post('/api/v1/reviews/bulk-delete', { ids: selectedIds });
      toast.success(`Successfully deleted ${selectedIds.length} reviews.`);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      toast.error('Failed to delete reviews.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Product Reviews</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer reviews, approve, or delete them.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center space-x-2 w-full sm:max-w-sm relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product, customer or content..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-8 w-full"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shadow-sm">
                    Bulk Action ({selectedIds.length})
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkApprove(true)}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Approve Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkApprove(false)}>
                    <XCircle className="mr-2 h-4 w-4 text-orange-600" />
                    Unapprove Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                className="shadow-sm"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}

          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReviewsTable
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Reviews"
        description={`Are you sure you want to delete ${selectedIds.length} selected reviews?`}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
};

export default ReviewsPage;
