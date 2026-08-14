import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
};

const normalizeStatus = (status) => {
  if (!status) return 'Pending';
  const normalized = status.toString().trim().toLowerCase();
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'failed') return 'Failed';
  return 'Pending';
};

const mapBilling = (billing) => {
  const order = billing.orderId || {};
  const invoiceId =
    billing.did ||
    order.orderNumber ||
    order.did ||
    billing.id ||
    billing._id ||
    'Unknown';
  const customerName =
    order.customer?.fullName ||
    billing.billingEmail ||
    billing.billingPhone ||
    'Guest Customer';

  return {
    id: billing.id || billing._id || invoiceId,
    invoiceId,
    customerName,
    date: formatDate(billing.billingDate || billing.createdAt || billing.updatedAt),
    dueDate: formatDate(billing.dueDate || billing.billingDate || billing.createdAt),
    amount:
      typeof billing.amount === 'number'
        ? billing.amount
        : Number(billing.amount ?? billing.paidAmount ?? billing.totalAmount ?? 0),
    status: normalizeStatus(billing.status),
  };
};

const fetchBillings = async (params) => {
  const queryParams = {
    limit: params?.limit ?? 15,
    page: params?.page ?? 1,
  };
  if (params?.status) {
    queryParams.status = params.status.toString().trim().toLowerCase();
  }
  if (params?.search) {
    queryParams.search = params.search;
  }

  const response = await apiClient.get('/api/v1/billing', { params: queryParams });
  const billingList = Array.isArray(response.data?.data)
    ? response.data.data
    : Array.isArray(response.data)
    ? response.data
    : [];

  const items = billingList.map((billing) => mapBilling(billing));
  const meta = response.data && typeof response.data === 'object' && 'meta' in response.data ? response.data.meta : undefined;

  return { items, meta };
};

export function useBillings(params) {
  return useQuery({
    queryKey: ['billings', params],
    queryFn: () => fetchBillings(params),
    staleTime: 60 * 1000,
    retry: 1,
  });
}
