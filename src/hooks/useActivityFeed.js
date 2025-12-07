import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getActivityFeed,
  subscribeToActivityFeed
} from '../services/supabaseService';

/**
 * useActivityFeed - Hook for fetching and subscribing to activity feed
 *
 * Features:
 * - Fetches activity for a specific roadmap
 * - Subscribes to Realtime updates
 * - Groups activities by date
 */
export const useActivityFeed = (roadmapId, options = {}) => {
  const { user } = useAuth();
  const { limit = 50, autoRefresh = true } = options;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const subscriptionRef = useRef(null);

  /**
   * Fetch activities from database
   */
  const fetchActivities = useCallback(async () => {
    if (!user || !roadmapId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getActivityFeed(roadmapId, limit);

      if (fetchError) throw fetchError;

      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, roadmapId, limit]);

  /**
   * Handle new activity from Realtime
   * Note: subscribeToActivityFeed passes the activity object directly (payload.new)
   */
  const handleNewActivity = useCallback((newActivity) => {
    if (!newActivity) return;

    // Add to top of list
    setActivities(prev => [newActivity, ...prev].slice(0, limit));
  }, [limit]);

  /**
   * Refresh activities
   */
  const refresh = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    if (!user || !roadmapId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    fetchActivities();

    // Subscribe to Realtime updates
    if (autoRefresh) {
      const subscription = subscribeToActivityFeed(roadmapId, handleNewActivity);
      subscriptionRef.current = subscription;
    }

    return () => {
      if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user, roadmapId, fetchActivities, autoRefresh, handleNewActivity]);

  return {
    activities,
    loading,
    error,
    refresh
  };
};

/**
 * Group activities by date
 */
export const groupActivitiesByDate = (activities) => {
  const groups = {};

  activities.forEach(activity => {
    const date = new Date(activity.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey;
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });

  return Object.entries(groups).map(([date, items]) => ({
    date,
    items
  }));
};

/**
 * Format activity time for display
 */
export const formatActivityTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get action verb and description for activity type
 */
export const getActivityDescription = (activity) => {
  const descriptions = {
    task_created: {
      verb: 'created',
      targetLabel: 'task'
    },
    task_completed: {
      verb: 'completed',
      targetLabel: 'task'
    },
    task_assigned: {
      verb: 'assigned',
      targetLabel: 'task'
    },
    expense_added: {
      verb: 'added',
      targetLabel: 'expense'
    },
    expense_paid: {
      verb: 'paid',
      targetLabel: 'expense'
    },
    milestone_completed: {
      verb: 'completed',
      targetLabel: 'milestone'
    },
    milestone_created: {
      verb: 'created',
      targetLabel: 'milestone'
    },
    partner_joined: {
      verb: 'joined',
      targetLabel: 'dream'
    },
    comment_added: {
      verb: 'commented on',
      targetLabel: ''
    },
    nudge_sent: {
      verb: 'nudged',
      targetLabel: ''
    }
  };

  const desc = descriptions[activity.action_type] || {
    verb: 'updated',
    targetLabel: activity.target_type || 'item'
  };

  return {
    ...desc,
    actorName: activity.actor_name || 'Someone',
    targetTitle: activity.target_title || ''
  };
};

export default useActivityFeed;
