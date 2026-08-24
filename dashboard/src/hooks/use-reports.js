import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Fetches the summary report KPI metrics
const fetchSummaryReport = async (params) => {
  const { data } = await apiClient.get('/api/v1/reports/summary', { params });
  return data?.data || {};
};

// Fetches sales timeline data
const fetchSalesTimeline = async (params) => {
  const { data } = await apiClient.get('/api/v1/reports/sales-timeline', { params });
  return data?.data || [];
};

// Fetches top products report
const fetchTopProducts = async (params) => {
  const { data } = await apiClient.get('/api/v1/reports/top-products', { params });
  return data?.data || [];
};

// Fetches payment method analytics
const fetchPaymentReport = async (params) => {
  const { data } = await apiClient.get('/api/v1/reports/payment-methods', { params });
  return data?.data || [];
};

// Fetches inventory health report
const fetchInventoryReport = async (params) => {
  const { data } = await apiClient.get('/api/v1/reports/inventory', { params });
  return data?.data || {};
};

// Hook for fetching all report data with given filters
export const useReports = (filters) => {
  const queryParams = {};
  if (filters.range !== 'custom') {
    queryParams.range = filters.range;
  } else {
    if (filters.startDate) queryParams.startDate = filters.startDate;
    if (filters.endDate) queryParams.endDate = filters.endDate;
  }
  if (filters.channel && filters.channel !== 'all') {
    queryParams.channel = filters.channel;
  }

  const summary = useQuery({
    queryKey: ['reports', 'summary', queryParams],
    queryFn: () => fetchSummaryReport(queryParams),
    staleTime: 5 * 60 * 1000,
  });

  const timeline = useQuery({
    queryKey: ['reports', 'timeline', queryParams],
    queryFn: () => fetchSalesTimeline(queryParams),
    staleTime: 5 * 60 * 1000,
  });

  const products = useQuery({
    queryKey: ['reports', 'products', queryParams],
    queryFn: () => fetchTopProducts(queryParams),
    staleTime: 5 * 60 * 1000,
  });

  const payments = useQuery({
    queryKey: ['reports', 'payments', queryParams],
    queryFn: () => fetchPaymentReport(queryParams),
    staleTime: 5 * 60 * 1000,
  });

  const inventory = useQuery({
    queryKey: ['reports', 'inventory', queryParams],
    queryFn: () => fetchInventoryReport(queryParams),
    staleTime: 5 * 60 * 1000,
  });

  return {
    summary,
    timeline,
    products,
    payments,
    inventory,
    isLoading: summary.isLoading || timeline.isLoading || products.isLoading || payments.isLoading || inventory.isLoading,
    isRefetching: summary.isRefetching || timeline.isRefetching || products.isRefetching || payments.isRefetching || inventory.isRefetching,
    refetchAll: () => {
      summary.refetch();
      timeline.refetch();
      products.refetch();
      payments.refetch();
      inventory.refetch();
    }
  };
};
