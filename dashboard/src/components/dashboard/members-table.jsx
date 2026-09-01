import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembers } from '@/hooks/use-members';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  CreditCard,
  MapPin,
  Camera,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { getApiErrorMessage } from '@/lib/error-handler';

// Renders the members and customer management table with batch actions and profile modal
export const MembersTable = ({
  searchQuery,
  segmentFilter,
  page = 1,
  onTotalPagesChange,
  selectedIds,
  onSelectedIdsChange,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: responseData, isLoading, isError, error } = useMembers({
    search: searchQuery,
    segment: segmentFilter !== 'All' ? segmentFilter : undefined,
    page,
    limit: 15,
  });

  const members = responseData?.data ?? [];
  const totalPages = responseData?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (onTotalPagesChange && responseData?.meta) {
      onTotalPagesChange(totalPages);
    }
  }, [totalPages, onTotalPagesChange, responseData]);

  const [viewProfileTarget, setViewProfileTarget] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const handleViewProfile = async (member) => {
    setViewProfileTarget(member);
    setIsLoadingProfile(true);
    try {
      const res = await apiClient.get(`/api/v1/members/${member.id}`);
      setProfileDetails(res.data?.data || member);
    } catch {
      setProfileDetails(member);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSendMessage = (member) => {
    toast.info(`Preparing message for ${member.email}`);
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const canChangePassword = ['owner', 'admin', 'manager', 'administrator', 'super_admin'].includes((user?.role || '').toLowerCase());

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/members/${deleteTarget.id}`);
      toast.success(`Member ${deleteTarget.name} deleted.`);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onSelectedIdsChange(selectedIds.filter(id => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete member.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordTarget) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post(`/api/v1/members/${passwordTarget.id}/change-password`, {
        newPassword,
      });
      toast.success(`Password updated for ${passwordTarget.name}.`);
      setPasswordTarget(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to change password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to fetch members. {error instanceof Error ? error.message : 'Unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  const isAllPageSelected = members.length > 0 && members.every(m => selectedIds.includes(m.id));

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
                    const pageIds = members.map(m => m.id);
                    const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                    onSelectedIdsChange(newSelected);
                  } else {
                    const pageIds = members.map(m => m.id);
                    onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[200px] min-w-[160px]">Customer</TableHead>
            <TableHead className="w-[200px]">Email</TableHead>
            <TableHead className="w-[130px]">Phone</TableHead>
            <TableHead className="w-[100px] text-right">Total Orders</TableHead>
            <TableHead className="w-[130px] text-right">Lifetime Spent</TableHead>
            <TableHead className="w-[110px]">Joined Date</TableHead>
            <TableHead className="w-[60px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 15 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-[50px] px-4">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : members && members.length > 0 ? (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="w-[50px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={selectedIds.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectedIdsChange([...selectedIds, member.id]);
                      } else {
                        onSelectedIdsChange(selectedIds.filter(id => id !== member.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate" title={member.name}>{member.name}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <span className="truncate block text-muted-foreground" title={member.email}>{member.email}</span>
                </TableCell>
                <TableCell className="w-[130px] text-muted-foreground whitespace-nowrap">{member.phone}</TableCell>
                <TableCell className="text-right w-[100px]">{member.totalOrders}</TableCell>
                <TableCell className="text-right w-[130px] font-medium whitespace-nowrap">৳{member.lifetimeSpent.toFixed(2)}</TableCell>
                <TableCell className="w-[110px] whitespace-nowrap">{new Date(member.joinedDate).toLocaleDateString()}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendMessage(member)}>
                        Send Message
                      </DropdownMenuItem>
                      {canChangePassword && (
                        <DropdownMenuItem
                          onClick={() => {
                            setPasswordTarget({ id: member.id, name: member.name });
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                        >
                          Change Password
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                      >
                        Delete Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteMember}
        isDeleting={isDeleting}
        title="Delete Member"
        description={`Are you sure you want to delete member ${deleteTarget?.name ?? ''}?`}
      />

      <Dialog open={!!passwordTarget} onOpenChange={(open) => { if (!open) setPasswordTarget(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordTarget?.name ?? 'this member'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label htmlFor="new-password" className="text-sm font-medium text-muted-foreground">
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-muted-foreground">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordTarget(null)} disabled={isChangingPassword}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Profile Modal (Spacious & Clean Layout) */}
      <Dialog
        open={!!viewProfileTarget}
        onOpenChange={(open) => {
          if (!open) {
            setViewProfileTarget(null);
            setProfileDetails(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative group">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage
                      src={profileDetails?.avatar || viewProfileTarget?.avatar}
                      alt={profileDetails?.name || viewProfileTarget?.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {(profileDetails?.name || viewProfileTarget?.name || 'M')
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border shadow-xs flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                    title="Profile Photo (Coming Soon)"
                    onClick={() => toast.info('Photo upload option will be enabled in next update')}
                  >
                    <Camera className="h-3 w-3" />
                  </div>
                </div>

                <div>
                  <DialogTitle className="text-xl font-bold text-foreground">
                    {profileDetails?.name || viewProfileTarget?.name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs font-mono bg-muted/60">
                      DID: {profileDetails?.did || viewProfileTarget?.did || 'N/A'}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-xs font-semibold bg-primary/10 text-primary"
                    >
                      {profileDetails?.role || viewProfileTarget?.role || 'Customer'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          {isLoadingProfile ? (
            <div className="space-y-4 py-6">
              <div className="h-20 bg-muted/40 animate-pulse rounded-xl" />
              <div className="h-32 bg-muted/40 animate-pulse rounded-xl" />
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Financial & Order Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border bg-muted/30 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Total Orders
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {profileDetails?.totalOrders ?? viewProfileTarget?.totalOrders ?? 0}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-muted/30 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Lifetime Spent
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      ৳{(profileDetails?.lifetimeSpent ?? viewProfileTarget?.lifetimeSpent ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-muted/30 flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Member Since
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {new Date(
                        profileDetails?.createdAt || viewProfileTarget?.joinedDate || Date.now()
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-background text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground font-medium">
                      {profileDetails?.email || viewProfileTarget?.email || 'No email registered'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-background text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground font-medium">
                      {profileDetails?.phone || viewProfileTarget?.phone || 'No phone registered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Saved Addresses
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Billing Address */}
                  <div className="p-3.5 rounded-xl border bg-background space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-foreground pb-1 border-b">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Billing Address
                    </div>
                    {profileDetails?.billingAddress?.address1 || profileDetails?.billingAddress?.city ? (
                      <div className="text-muted-foreground space-y-0.5 pt-1">
                        <p className="font-semibold text-foreground">
                          {profileDetails.billingAddress.firstName} {profileDetails.billingAddress.lastName}
                        </p>
                        <p>{profileDetails.billingAddress.address1}</p>
                        <p>
                          {[profileDetails.billingAddress.city, profileDetails.billingAddress.state, profileDetails.billingAddress.postcode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        <p>{profileDetails.billingAddress.country}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic pt-1">No billing address saved</p>
                    )}
                  </div>

                  {/* Shipping Address */}
                  <div className="p-3.5 rounded-xl border bg-background space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-foreground pb-1 border-b">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Shipping Address
                    </div>
                    {profileDetails?.shippingAddress?.address1 || profileDetails?.shippingAddress?.city ? (
                      <div className="text-muted-foreground space-y-0.5 pt-1">
                        <p className="font-semibold text-foreground">
                          {profileDetails.shippingAddress.firstName} {profileDetails.shippingAddress.lastName}
                        </p>
                        <p>{profileDetails.shippingAddress.address1}</p>
                        <p>
                          {[profileDetails.shippingAddress.city, profileDetails.shippingAddress.state, profileDetails.shippingAddress.postcode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        <p>{profileDetails.shippingAddress.country}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic pt-1">No shipping address saved</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Orders List if available */}
              {profileDetails?.orderList && profileDetails.orderList.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Recent Orders ({profileDetails.orderList.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {profileDetails.orderList.slice(0, 5).map((ord) => (
                      <div
                        key={ord._id}
                        className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <Link
                            to={`/dashboard/orders/${ord._id || ord.id || ord.orderNumber}`}
                            className="font-mono font-semibold text-primary hover:underline"
                          >
                            #{ord.orderNumber}
                          </Link>
                          <span className="text-muted-foreground">
                            ({new Date(ord.createdAt).toLocaleDateString()})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            ৳{Number(ord.totals?.total || 0).toLocaleString()}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {ord.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setViewProfileTarget(null);
                setProfileDetails(null);
              }}
              className="cursor-pointer text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
