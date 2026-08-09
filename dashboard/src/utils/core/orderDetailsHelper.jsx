import { Badge } from "@/components/core/ui/badge";

// Check if an order is an In-Store order based on order number prefix, type, or customer email.
export const checkIsInStoreOrder = (order) => {
  if (!order) return false;
  const orderNum = String(order.orderNumber || "").toUpperCase();
  const type = String(order.orderType || "").toLowerCase();
  const email = String(order.customer?.email || "").toLowerCase();
  return orderNum.startsWith("IS") || type === "instore" || email.includes("instore@decantre.com");
};

// Resolve the initial payment method dropdown value based on store type and raw method.
export const getInitialPaymentMethod = (order, isInStore) => {
  const rawMethod = String(order?.paymentMethod || "").toLowerCase();
  if (isInStore) {
    if (rawMethod.includes("bkash")) return "bkash";
    if (rawMethod.includes("nagad")) return "nagad";
    if (rawMethod.includes("rocket")) return "rocket";
    return "cash";
  }
  if (rawMethod.includes("bkash")) return "bkash";
  if (rawMethod.includes("nagad")) return "nagad";
  if (rawMethod.includes("bank")) return "bank";
  return "cod";
};

// Resolve the initial paid amount for an order snapshot.
export const getInitialPaidAmount = (order, initMethod) => {
  const totalVal = order?.totals?.total ?? order?.totalAmount ?? 0;
  const rawPaid = order?.paymentDetails?.paidAmount ?? order?.paidAmount;
  if (rawPaid !== undefined && rawPaid !== null) {
    return Number(rawPaid);
  }
  if (initMethod === "cash") {
    return totalVal;
  }
  return 0;
};

// Extract phone number from payment details or embedded string.
export const extractPaymentPhone = (order) => {
  const phoneVal = order?.paymentDetails?.paymentPhone || order?.paymentPhone || "";
  if (phoneVal) {
    return phoneVal.replace(/^\+880?/, "");
  }
  const match = String(order?.paymentMethod || "").match(/\+880?(\d+)/);
  return match ? match[1] : "";
};

// Format a clean phone number with +880 prefix after stripping leading zeros.
export const formatPhoneNumber = (rawPhone) => {
  const cleanPhone = String(rawPhone || "").replace(/\D/g, "");
  if (!cleanPhone) return "";
  if (cleanPhone.startsWith("880")) return `+${cleanPhone}`;
  if (cleanPhone.startsWith("0")) return `+88${cleanPhone}`;
  return `+880${cleanPhone}`;
};

// Sanitize order fulfillment status string to match backend schema enums strictly.
export const getBackendStatus = (fullStatus) => {
  const s = String(fullStatus || "").toLowerCase();
  if (s === "shipped") return "shipped";
  if (s === "cancelled") return "cancelled";
  if (s === "completed") return "completed";
  return "processing";
};

// Calculate remaining pending balance from net total and paid amount.
export const calculatePendingAmount = (total, paidAmount) =>
  Math.max(0, Number(total || 0) - Number(paidAmount || 0));

// Determine payment status preview string based on total and paid amounts.
export const calculatePaymentStatus = (total, paidAmount) => {
  const paid = Number(paidAmount || 0);
  const netTotal = Number(total || 0);
  if (paid >= netTotal && netTotal > 0) return "Paid";
  if (paid > 0) return "Partial";
  return "Pending";
};

// Render payment status badge based on payment status string.
export const getPaymentBadge = (status) => {
  switch (String(status).toLowerCase()) {
    case "paid":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-xs">Paid</Badge>;
    case "partial":
      return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 dark:text-amber-400 px-3 py-1 text-xs font-semibold">Partial</Badge>;
    case "pending":
    default:
      return <Badge variant="secondary" className="bg-rose-500/20 text-rose-600 hover:bg-rose-500/30 dark:text-rose-400 px-3 py-1 text-xs">Pending</Badge>;
  }
};

// Render order fulfillment status badge based on status string.
export const getFulfillmentBadge = (status) => {
  switch (String(status).toLowerCase()) {
    case "shipped":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-xs">Shipped</Badge>;
    case "processing":
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 dark:text-blue-400 px-3 py-1 text-xs">Processing</Badge>;
    case "cancelled":
      return <Badge variant="destructive" className="px-3 py-1 text-xs">Cancelled</Badge>;
    case "completed":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs">Completed</Badge>;
    default:
      return <Badge variant="outline" className="px-3 py-1 text-xs">{status}</Badge>;
  }
};

// Return available payment method options based on whether order is In-Store or Website.
export const resolvePaymentOptions = (isInStore) =>
  isInStore
    ? [
        { value: "cash", label: "Cash (In-Store)" },
        { value: "bkash", label: "bKash" },
        { value: "nagad", label: "Nagad" },
        { value: "rocket", label: "Rocket" },
      ]
    : [
        { value: "cod", label: "Cash on Delivery (COD)" },
        { value: "bkash", label: "bKash" },
        { value: "nagad", label: "Nagad" },
        { value: "bank", label: "Bank Transfer" },
      ];

// Map raw order items into editable cart items while retaining productDid and concentration.
export const mapOrderItemsToCart = (items = []) =>
  (items || []).map((item, idx) => {
    const idKey = item.size ? `${idx}__${item.size}` : `${idx}`;
    return {
      id: idKey,
      name: item.name,
      price: item.unitPrice ?? item.price ?? 0,
      quantity: item.quantity,
      image: item.image || "",
      sku: item.sku || "",
      size: item.size || "",
      concentration: item.concentration || "",
      productDid: item.productDid || "",
    };
  });

// Build the sanitized request payload for updating an order.
export const buildUpdatePayload = ({
  orderStatus,
  paymentMethod,
  paidAmount,
  paymentPhone,
  isDigitalPayment,
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  customerCity,
  customerThana,
  customerDistrict,
  customerZip,
  isInStoreOrder,
  cart,
  subtotal,
  shippingFee,
  discountAmount,
  total,
  user,
}) => {
  const formattedPhone = formatPhoneNumber(customerPhone);
  const formattedPaymentPhone = isDigitalPayment && paymentPhone ? formatPhoneNumber(paymentPhone) : "";

  let fullPaymentMethod = paymentMethod;
  if (isDigitalPayment && formattedPaymentPhone) {
    fullPaymentMethod = `${paymentMethod} (${formattedPaymentPhone})`;
  }

  return {
    status: getBackendStatus(orderStatus),
    paymentMethod: fullPaymentMethod,
    paidAmount: Number(paidAmount || 0),
    paymentPhone: formattedPaymentPhone,
    customer: {
      fullName: customerName.trim(),
      phone: formattedPhone,
      email: customerEmail.trim() || (isInStoreOrder ? "instore@decantre.com" : "customer@decantre.com"),
      address: customerAddress.trim() || (isInStoreOrder ? "In-Store" : "Delivery Address"),
      city: customerCity,
      thana: customerThana,
      district: customerDistrict,
      zip: customerZip,
      giftWrap: false,
    },
    items: cart.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      size: item.size,
      concentration: item.concentration || "",
      productDid: item.productDid || "",
    })),
    totals: {
      subtotal,
      shippingFee,
      tax: 0,
      total,
    },
    discountTotalAmount: discountAmount,
    shippingTotalAmount: shippingFee,
    updatedBy: user?.did || user?.id || user?._id || undefined,
  };
};
