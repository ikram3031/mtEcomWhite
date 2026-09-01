import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  Tag,
  FileText,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Edit3,
  Layers,
} from 'lucide-react';
import { apiClient, baseURL } from '@/lib/api-client';
import clientConfig from '@/clientConfig';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/lib/auth-context';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatBDT } from '@/utils/orderHelper';

// Renders an expanded accordion panel containing full order details and inline status management
export const OrderAccordionDetail = ({ order }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [orderStatus, setOrderStatus] = useState(order.orderStatus || 'Processing');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'Pending');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setOrderStatus(order.orderStatus || 'Processing');
    setPaymentStatus(order.paymentStatus || 'Pending');
  }, [order.orderStatus, order.paymentStatus]);

  const customer = order.customer || order.billingInfo || order.shippingInfo || {};
  const shipping = order.shippingInfo || order.billingInfo || customer;
  const items = Array.isArray(order.items) ? order.items : [];
  const totals = order.totals || {};
  const subtotal = totals.subtotal ?? order.subtotal ?? 0;
  const shippingFee = totals.shippingFee ?? order.shippingFee ?? order.shippingTotalAmount ?? 0;
  const discount = order.discountTotalAmount ?? totals.discount ?? 0;
  const grandTotal = totals.total ?? order.totalAmount ?? 0;

  const rawPaid = order.paymentDetails?.paidAmount ?? order.paidAmount;
  const paidAmount = rawPaid !== undefined && rawPaid !== null
    ? Number(rawPaid)
    : (String(order.paymentStatus).toLowerCase() === 'paid' ? grandTotal : 0);
  const pendingAmount = Math.max(0, grandTotal - paidAmount);

  const phoneNum = customer.phone || order.phone || '';
  const cleanPhone = phoneNum.replace(/^\+880?/, '');
  const emailAddr = customer.email || order.email || '';
  const fullAddress = [
    shipping.address || customer.address,
    shipping.thana || customer.thana,
    shipping.city || customer.city,
    shipping.district || customer.district,
    shipping.zip || customer.zip,
  ].filter(Boolean).join(', ');

  const hasStatusChanged =
    orderStatus.toLowerCase() !== (order.orderStatus || 'Processing').toLowerCase() ||
    paymentStatus.toLowerCase() !== (order.paymentStatus || 'Pending').toLowerCase();

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      await apiClient.put(`/api/v1/orders/${order.id}`, {
        status: orderStatus.toLowerCase(),
        paymentStatus: paymentStatus.toLowerCase(),
      });

      logActivity({
        type: 'updated',
        description: `Order #${order.orderNumber} status changed to "${orderStatus}" and payment to "${paymentStatus}" by "${user?.name || 'Admin'}"`,
      });

      toast.success(`Order #${order.orderNumber} updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to update order status.'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Opens the printable invoice endpoint in a new browser tab
  const handleOpenInvoice = () => {
    const apiBase = (baseURL || import.meta.env.VITE_API_BASE_URL || clientConfig?.apiBaseUrl || 'https://server.decantrebd.com').replace(/\/$/, '');
    const orderIdentifier = order._id || order.id || order.did || order.orderNumber;
    window.open(`${apiBase}/api/v1/orders/${orderIdentifier}/invoice`, '_blank', 'noopener,noreferrer');
  };

  // Navigates to the full standalone order details page
  const handleViewFullPage = () => {
    navigate(`/dashboard/orders/${order.id}`);
  };

  // Navigates to the order edit mode
  const handleEditOrder = () => {
    navigate(`/dashboard/orders/${order.id}?edit=true`);
  };

  return (
    <div className="p-4 md:p-6 bg-muted/20 border-t border-b border-border/80 space-y-5 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to={`/dashboard/orders/${order.id}`}
            className="text-sm font-bold text-foreground hover:text-primary hover:underline transition-colors"
          >
            Order #{order.orderNumber}
          </Link>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(order.createdAt || order.date).toLocaleString()}
          </span>
          {order.couponCode && (
            <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono font-bold text-[11px] py-0.5 px-2">
              <Tag className="h-3 w-3 text-emerald-500" />
              Coupon: {order.couponCode}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer bg-background"
            onClick={handleOpenInvoice}
          >
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            Print Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer bg-background"
            onClick={handleEditOrder}
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
            Edit Order
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer"
            onClick={handleViewFullPage}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Full Details
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-card rounded-xl border border-border/70 p-4 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-4 w-4 text-primary" />
                Ordered Items ({items.length})
              </h4>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 text-xs py-1.5 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-muted/60 border border-border/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[170px]" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {item.size && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">
                              <Layers className="h-2.5 w-2.5 mr-0.5" />
                              {item.size}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatBDT(item.unitPrice ?? item.price ?? 0)} × {item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-bold text-foreground shrink-0 pt-0.5">
                      {formatBDT((item.unitPrice ?? item.price ?? 0) * (item.quantity || 1))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No item breakdown recorded for this order.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Total Quantity</span>
            <span className="font-bold text-foreground">
              {items.reduce((acc, curr) => acc + (curr.quantity || 1), 0)} items
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/70 p-4 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                Customer & Delivery
              </h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Customer Name</span>
                  <span className="font-semibold text-foreground">{customer.fullName || order.customerName || 'N/A'}</span>
                </div>
              </div>

              {phoneNum && (
                <div className="flex items-start gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Phone</span>
                    <a
                      href={`tel:+880${cleanPhone}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      +880{cleanPhone}
                    </a>
                  </div>
                </div>
              )}

              {emailAddr && (
                <div className="flex items-start gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Email</span>
                    <a
                      href={`mailto:${emailAddr}`}
                      className="font-medium text-foreground hover:underline truncate block max-w-[200px]"
                    >
                      {emailAddr}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Delivery Address</span>
                  <span className="text-foreground leading-tight font-medium">
                    {fullAddress || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Truck className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Delivery Type</span>
                  <span className="text-foreground font-medium">
                    {shippingFee === 0 ? 'Free Delivery / In-Store' : 'Standard Delivery'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" /> Payment Method:
            </span>
            <span className="font-bold text-foreground capitalize">
              {order.paymentMethod || 'Cash on Delivery'}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/70 p-4 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Status & Billing
              </h4>
            </div>

            <div className="space-y-1.5 text-xs bg-muted/40 p-2.5 rounded-lg border border-border/40">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-medium text-foreground">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping:</span>
                <span className="font-medium text-foreground">{formatBDT(shippingFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatBDT(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border/40">
                <span>Total Amount:</span>
                <span className="text-primary font-bold">{formatBDT(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-muted-foreground">Paid: {formatBDT(paidAmount)}</span>
                <span className={`font-semibold ${pendingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  Pending: {formatBDT(pendingAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Order Status
                  </label>
                  <Select value={orderStatus} onValueChange={(val) => val && setOrderStatus(val)}>
                    <SelectTrigger className="h-8 text-xs cursor-pointer w-full bg-background">
                      <SelectValue placeholder="Order Status" />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="bg-popover border shadow-md">
                      <SelectItem value="Processing" className="cursor-pointer text-xs">Processing</SelectItem>
                      <SelectItem value="Shipped" className="cursor-pointer text-xs">Shipped</SelectItem>
                      <SelectItem value="Completed" className="cursor-pointer text-xs">Completed</SelectItem>
                      <SelectItem value="Cancelled" className="cursor-pointer text-xs text-destructive">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Payment Status
                  </label>
                  <Select value={paymentStatus} onValueChange={(val) => val && setPaymentStatus(val)}>
                    <SelectTrigger className="h-8 text-xs cursor-pointer w-full bg-background">
                      <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="bg-popover border shadow-md">
                      <SelectItem value="Paid" className="cursor-pointer text-xs">Paid</SelectItem>
                      <SelectItem value="Pending" className="cursor-pointer text-xs">Pending</SelectItem>
                      <SelectItem value="Failed" className="cursor-pointer text-xs text-destructive">Failed</SelectItem>
                      <SelectItem value="Partial" className="cursor-pointer text-xs">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50">
            <Button
              className={`w-full h-8 text-xs font-semibold cursor-pointer transition-all ${
                hasStatusChanged
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
              onClick={handleUpdateStatus}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Updating Status...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  {hasStatusChanged ? 'Save New Status' : 'Update Status'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
