import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification
} from '../services/supabaseService';

/**
 * useNotifications - Hook for managing user notifications
 *
 * Features:
 * - Fetches notifications on mount
 * - Provides unread count for badge display
 * - Handles mark as read, mark all read, dismiss
 */
export const useNotifications = (options = {}) => {
  const { user } = useAuth();
  const { limit = 20 } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent duplicate fetches
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  /**
   * Fetch notifications from database
   */
  const fetchNotifications = useCallback(async (force = false) => {
    // Prevent duplicate simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }

    // Don't re-fetch if we already have data (unless forced)
    if (!force && hasFetchedRef.current && notifications.length > 0) {
      return;
    }

    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Fetch notifications
      const notifResult = await getNotifications(limit);

      if (notifResult.error) {
        throw notifResult.error;
      }

      const notificationsData = notifResult.data?.notifications || notifResult.data || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);

      // Fetch unread count
      const countResult = await getUnreadNotificationCount();
      setUnreadCount(countResult.data || 0);

      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, limit, notifications.length]);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Optimistically update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Update in database
      const { error } = await markNotificationRead(notificationId);
      if (error) {
        console.error('Error marking notification as read:', error);
        // Revert on error - refetch
        fetchNotifications(true);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [fetchNotifications]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistically update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      // Update in database
      const { error } = await markAllNotificationsRead();
      if (error) {
        console.error('Error marking all as read:', error);
        // Revert on error - refetch
        fetchNotifications(true);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [fetchNotifications]);

  /**
   * Dismiss (delete) a notification
   */
  const dismiss = useCallback(async (notificationId) => {
    try {
      // Get the notification before removing
      const notification = notifications.find(n => n.id === notificationId);

      // Optimistically remove from UI
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Delete from database
      const { error } = await dismissNotification(notificationId);
      if (error) {
        console.error('Error dismissing notification:', error);
        // Revert on error - refetch
        fetchNotifications(true);
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  }, [notifications, fetchNotifications]);

  /**
   * Refresh notifications (force fetch)
   */
  const refresh = useCallback(() => {
    hasFetchedRef.current = false;
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Initial fetch when user is available
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      hasFetchedRef.current = false;
      return;
    }

    // Only fetch once on mount
    if (!hasFetchedRef.current) {
      fetchNotifications();
    }
  }, [user]); // Only depend on user, not fetchNotifications

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh,
    hasUnread: unreadCount > 0
  };
};

/**
 * Format notification time for display
 */
export const formatNotificationTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get icon and color for notification type
 */
export const getNotificationStyle = (type) => {
  const styles = {
    task_assigned: {
      icon: 'UserPlus',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    task_completed: {
      icon: 'CheckCircle',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    dream_shared: {
      icon: 'Heart',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    partner_joined: {
      icon: 'Users',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    nudge: {
      icon: 'Bell',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    milestone_completed: {
      icon: 'Trophy',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    expense_added: {
      icon: 'DollarSign',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    comment: {
      icon: 'MessageCircle',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    default: {
      icon: 'Bell',
      color: 'text-stone-600',
      bgColor: 'bg-stone-50'
    }
  };

  return styles[type] || styles.default;
};

export default useNotifications;
