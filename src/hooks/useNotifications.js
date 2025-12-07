import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  subscribeToNotifications
} from '../services/supabaseService';

/**
 * useNotifications - Hook for managing user notifications with Realtime updates
 *
 * Features:
 * - Fetches notifications on mount
 * - Subscribes to Realtime updates for new notifications
 * - Provides unread count for badge display
 * - Handles mark as read, mark all read, dismiss
 */
export const useNotifications = (options = {}) => {
  const { user } = useAuth();
  const {
    limit = 20,
    autoRefresh = true,
    onNewNotification = null
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track subscription cleanup
  const subscriptionRef = useRef(null);

  /**
   * Fetch notifications from database
   */
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch notifications and unread count in parallel
      const [notifResult, countResult] = await Promise.all([
        getNotifications(limit),
        getUnreadNotificationCount()
      ]);

      if (notifResult.error) throw notifResult.error;
      if (countResult.error) throw countResult.error;

      // getNotifications returns { notifications: [], unreadCount } in data
      const notificationsData = notifResult.data?.notifications || notifResult.data || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setUnreadCount(countResult.data || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  /**
   * Handle new notification from Realtime
   * Note: subscribeToNotifications passes the notification object directly (payload.new)
   */
  const handleNewNotification = useCallback((newNotification) => {
    if (!newNotification) return;

    // Add to top of list
    setNotifications(prev => [newNotification, ...prev].slice(0, limit));

    // Increment unread count
    if (!newNotification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // Call external handler if provided
    if (onNewNotification) {
      onNewNotification(newNotification);
    }

    // Play notification sound (optional)
    playNotificationSound();
  }, [limit, onNewNotification]);

  /**
   * Play a subtle notification sound
   */
  const playNotificationSound = () => {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Silently fail if audio not supported
    }
  };

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { error } = await markNotificationRead(notificationId);
      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await markAllNotificationsRead();
      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  /**
   * Dismiss (delete) a notification
   */
  const dismiss = useCallback(async (notificationId) => {
    try {
      // Optimistically remove from UI
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      const { error } = await dismissNotification(notificationId);
      if (error) throw error;
    } catch (err) {
      console.error('Error dismissing notification:', err);
      // Revert on error
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  /**
   * Refresh notifications
   */
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchNotifications();

    // Subscribe to Realtime updates (async)
    if (autoRefresh) {
      const setupSubscription = async () => {
        const channel = await subscribeToNotifications(handleNewNotification);
        subscriptionRef.current = channel;
      };
      setupSubscription();
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user, fetchNotifications, autoRefresh, handleNewNotification]);

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
