import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReviews } from '@/hooks/use-reviews';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/error-handler';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

export function ReviewsTable({
  searchQuery = '',
  statusFilter = 'All',
}) {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading, isError } = useReviews();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleApproval = async (review, currentStatus) => {
    try {
      await apiClient.patch(`/api/v1/reviews/${review.id}/status`, { isApproved: !currentStatus });
      toast.success(`Review is now ${!currentStatus ? 'Approved' : 'Unapproved'}.`);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to update review status.'));
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/reviews/${deleteTarget.id}`);
      toast.success(`Review deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to delete review.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const productName = r.productId?.name?.toLowerCase() || '';
    const memberName = r.memberId?.name?.toLowerCase() || '';
    const desc = r.description?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = productName.includes(query) || memberName.includes(query) || desc.includes(query);
    
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Approved' && r.isApproved) ||
      (statusFilter === 'Pending' && !r.isApproved);

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-4 text-red-500">
        Failed to load reviews. Please try again.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No reviews found.
              </TableCell>
            </TableRow>
          ) : (
            filteredReviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">
                  {review.productId?.name || review.productDid || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{review.memberId?.name || 'Unknown User'}</span>
                    <span className="text-xs text-muted-foreground">{review.memberId?.email || review.memberDid}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="font-medium mr-1">{review.rating}</span>
                    <span className="text-yellow-500 text-lg leading-none">★</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px] truncate" title={review.description}>
                    {review.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={review.isApproved ? "success" : "secondary"}>
                    {review.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleApproval(review, review.isApproved)}>
                        {review.isApproved ? (
                          <><XCircle className="mr-2 h-4 w-4" /> Unapprove</>
                        ) : (
                          <><CheckCircle className="mr-2 h-4 w-4" /> Approve</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteTarget(review)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteReview}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
}
