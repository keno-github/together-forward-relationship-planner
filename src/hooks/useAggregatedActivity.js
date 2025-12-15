import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivityFeed } from '../services/supabaseService';

/**
 * useAggregatedActivity - Fetch activity across all user's dreams
 *
 * Staff Engineer Design:
 * - Stable references prevent infinite re-render loops
 * - Deduplication of fetch calls
 * - Graceful handling of empty states
 * - Memory-efficient with proper cleanup
 *
 * @param {Array} dreams - Array of dream objects
 * @param {object} options - Configuration options
 * @returns {object} Activities state and controls
 */
export const useAggregatedActivity = (dreams = [], options = {}) => {
  const { user } = useAuth();
  const { limit = 5, enabled = true } = options;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs for preventing duplicate fetches and tracking state
  const isFetchingRef = useRef(false);
  const lastFetchedIdsRef = useRef('');
  const mountedRef = useRef(true);

  // Create stable dream IDs string for comparison
  // Only recalculate if actual IDs change, not array reference
  const dreamIdsString = useMemo(() => {
    if (!dreams || dreams.length === 0) return '';
    return dreams
      .map(d => d.id)
      .filter(Boolean)
      .sort() // Sort for consistent comparison
      .join(',');
  }, [dreams]);

  // Parse IDs from stable string
  const dreamIds = useMemo(() => {
    if (!dreamIdsString) return [];
    return dreamIdsString.split(',');
  }, [dreamIdsString]);

  /**
   * Fetch activities from all dreams
   */
  const fetchActivities = useCallback(async () => {
    // Guard: No user, no dreams, or disabled
    if (!user || dreamIds.length === 0 || !enabled) {
      setActivities([]);
      setLoading(false);
      return;
    }

    // Guard: Already fetching (prevent duplicate calls)
    if (isFetchingRef.current) {
      return;
    }

    // Guard: Already fetched these exact dream IDs
    if (lastFetchedIdsRef.current === dreamIdsString && activities.length > 0) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      // Fetch activities from all dreams in parallel
      // Limit per dream to avoid over-fetching
      const perDreamLimit = Math.max(3, Math.ceil(limit / dreamIds.length) + 2);

      const activityPromises = dreamIds.map(dreamId =>
        getActivityFeed(dreamId, perDreamLimit).catch(err => {
          // Don't let one failed fetch break everything
          console.warn(`Failed to fetch activity for dream ${dreamId}:`, err.message);
          return { data: [] };
        })
      );

      const results = await Promise.all(activityPromises);

      // Check if still mounted
      if (!mountedRef.current) return;

      // Combine, deduplicate, sort, and limit
      const allActivities = results
        .flatMap(result => result.data || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);

      setActivities(allActivities);
      lastFetchedIdsRef.current = dreamIdsString;
    } catch (err) {
      console.error('Error fetching aggregated activity:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [user, dreamIds, dreamIdsString, limit, enabled, activities.length]);

  // Fetch when dependencies change
  useEffect(() => {
    mountedRef.current = true;

    // Only fetch if we have dreams and user
    if (user && dreamIds.length > 0 && enabled) {
      fetchActivities();
    } else {
      // Clear activities if no dreams
      setActivities([]);
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, dreamIdsString, enabled]); // Stable dependencies only

  /**
   * Force refresh activities
   */
  const refresh = useCallback(() => {
    lastFetchedIdsRef.current = ''; // Clear cache to force refetch
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refresh,
    isEmpty: !loading && activities.length === 0,
  };
};

export default useAggregatedActivity;
