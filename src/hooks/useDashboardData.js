import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDashboardSummary } from '../services/supabaseService';

/**
 * Custom hook for fetching dashboard data - Netflix-grade instant rendering
 *
 * PHILOSOPHY: Show cached data INSTANTLY, never block UI
 * - User sees content immediately from cache
 * - Fresh data fetched in background
 * - No loading spinners on navigation
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
      if (error) {
        // Convert Supabase error object to proper Error to avoid [object Object] display
        throw new Error(error.message || 'Failed to load dashboard data');
      }
      return data;
    },
    // INSTANT RENDER: Always show cached data immediately
    // staleTime is inherited from global config (24 hours)
    // This means cached data shows instantly without any loading state

    // Background refresh happens silently
    refetchOnMount: true,           // Refresh in background when component mounts
    refetchOnWindowFocus: false,    // Don't refetch on tab focus (annoying)

    // Keep previous data while fetching new data (smooth transitions)
    placeholderData: (previousData) => previousData,

    // Custom options passed in
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
        if (error) {
          throw new Error(error.message || 'Failed to prefetch dashboard data');
        }
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
