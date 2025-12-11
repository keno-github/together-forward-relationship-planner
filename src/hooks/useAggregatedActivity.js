import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivityFeed } from '../services/supabaseService';

/**
 * useAggregatedActivity - Fetch activity across all user's dreams
 *
 * Features:
 * - Aggregates activity from multiple roadmaps
 * - Sorts by most recent
 * - Limits to specified number of items
 * - Handles empty states gracefully
 */
export const useAggregatedActivity = (dreams = [], options = {}) => {
  const { user } = useAuth();
  const { limit = 5, enabled = true } = options;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get dream IDs
  const dreamIds = useMemo(() => {
    return dreams.map(d => d.id).filter(Boolean);
  }, [dreams]);

  /**
   * Fetch activities from all dreams
   * Note: This does N queries (one per dream) - could be optimized with RPC later
   */
  const fetchActivities = useCallback(async () => {
    if (!user || dreamIds.length === 0 || !enabled) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch activities from all dreams in parallel
      const activityPromises = dreamIds.map(dreamId =>
        getActivityFeed(dreamId, Math.ceil(limit / dreamIds.length) + 2) // Fetch a few extra
      );

      const results = await Promise.all(activityPromises);

      // Combine and sort all activities
      const allActivities = results
        .flatMap(result => result.data || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);

      setActivities(allActivities);
    } catch (err) {
      console.error('Error fetching aggregated activity:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, dreamIds, limit, enabled]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  /**
   * Refresh activities
   */
  const refresh = useCallback(() => {
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
