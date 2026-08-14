import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const mockUsers = [
  {
    id: 'U001',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2026-07-30T10:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
  },
  {
    id: 'U002',
    name: 'Sarah Smith',
    email: 'sarah.manager@example.com',
    role: 'Manager',
    status: 'Active',
    lastLogin: '2026-07-29T14:15:00Z',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80',
  },
  {
    id: 'U003',
    name: 'Tom Editor',
    email: 'tom.editor@example.com',
    role: 'Editor',
    status: 'Inactive',
    lastLogin: '2026-07-15T09:00:00Z',
  },
];

const fetchSystemUsers = async (params) => {
  try {
    const queryParams = {
      limit: params?.limit ?? 15,
      page: params?.page ?? 1,
    };
    if (params?.search) queryParams.q = params.search;
    if (params?.role && params.role !== 'All') queryParams.role = params.role;

    const response = await apiClient.get('/api/v1/users', { params: queryParams });
    const userList = response.data?.data || (Array.isArray(response.data) ? response.data : []);
    const meta = response.data?.meta;

    if (userList.length > 0) {
      return {
        data: userList.map((u) => ({
          id: u.id || u._id,
          name: u.name || u.email?.split('@')[0] || 'User',
          email: u.email || '',
          role: u.role || 'Admin',
          status: u.isActive !== false ? 'Active' : 'Inactive',
          lastLogin: u.updatedAt || u.createdAt || new Date().toISOString(),
          avatar: u.avatar || undefined,
        })),
        meta,
      };
    }
  } catch (err) {
    console.warn('Backend API system users request failed, using fallback mock data:', err);
  }

  // Fallback to mockUsers
  let result = [...mockUsers];
  if (params?.search) {
    const q = params.search.toLowerCase();
    result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (params?.role && params.role !== 'All') {
    result = result.filter(u => u.role === params.role);
  }

  return {
    data: result,
    meta: {
      total: result.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? 15,
      totalPages: Math.ceil(result.length / (params?.limit ?? 15)),
    },
  };
};

export function useSystemUsers(params) {
  return useQuery({
    queryKey: ['system-users', params],
    queryFn: () => fetchSystemUsers(params),
  });
}
