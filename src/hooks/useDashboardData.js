import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDashboardSummary } from '../services/supabaseService';

/**
 * Custom hook for fetching dashboard data with caching
 *
 * Uses React Query for:
 * - Automatic caching (5 min stale time)
 * - Background refetching
 * - Loading/error states
 * - Cache invalidation
 *
 * @param {number} page - Page number for pagination (default: 1)
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result with data, isLoading, error, refetch
 */
export const useDashboardData = (page = 1, options = {}) => {
  return useQuery({
    queryKey: ['dashboard', page],
    queryFn: async () => {
      const { data, error } = await getDashboardSummary(page);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,      // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000,        // Keep in cache for 30 minutes
    refetchOnMount: true,           // Refetch when component mounts if stale
    refetchOnWindowFocus: false,    // Don't refetch on tab focus
    ...options,
  });
};

/**
 * Hook to get the query client for cache invalidation
 *
 * Usage:
 * const { invalidateDashboard } = useDashboardCache();
 * // After creating/updating/deleting a dream:
 * invalidateDashboard();
 */
export const useDashboardCache = () => {
  const queryClient = useQueryClient();

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const prefetchDashboard = async (page = 1) => {
    await queryClient.prefetchQuery({
      queryKey: ['dashboard', page],
      queryFn: async () => {
        const { data, error } = await getDashboardSummary(page);
        if (error) throw error;
        return data;
      },
    });
  };

  return {
    invalidateDashboard,
    prefetchDashboard,
    queryClient,
  };
};

/**
 * Helper to invalidate dashboard cache from non-component code
 * Import queryClient from index.js and use this function
 *
 * Usage:
 * import { queryClient } from '../index';
 * import { invalidateDashboardCache } from '../hooks/useDashboardData';
 * invalidateDashboardCache(queryClient);
 */
export const invalidateDashboardCache = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

export default useDashboardData;
