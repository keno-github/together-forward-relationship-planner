import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  isServiceWorkerSupported,
  isPushSupported,
  getNotificationPermission,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  addServiceWorkerMessageListener
} from '../utils/serviceWorker';
import {
  savePushSubscription,
  removePushSubscription,
  getNotificationPreferences
} from '../services/supabaseService';

// VAPID public key - should come from environment variable in production
// This is a placeholder - you'll need to generate your own VAPID keys
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';

/**
 * usePushNotifications - Hook for managing push notification subscriptions
 *
 * Features:
 * - Check if push notifications are supported
 * - Request notification permission
 * - Subscribe/unsubscribe to push
 * - Sync subscription with server
 */
export const usePushNotifications = (options = {}) => {
  const { user } = useAuth();
  const { autoSubscribe = false, onNotificationClick = null } = options;

  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize - check support and current state
   */
  useEffect(() => {
    const init = async () => {
      // Check browser support
      const swSupported = isServiceWorkerSupported();
      const pushSupported = isPushSupported();
      setSupported(swSupported && pushSupported);

      if (!swSupported || !pushSupported) {
        setLoading(false);
        return;
      }

      // Register service worker
      await registerServiceWorker();

      // Check current permission
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);

      // Check current subscription
      const currentSubscription = await getPushSubscription();
      setSubscription(currentSubscription);

      setLoading(false);

      // Auto-subscribe if enabled and user is logged in
      if (autoSubscribe && user && currentPermission === 'granted' && !currentSubscription) {
        await subscribe();
      }
    };

    init();
  }, [user, autoSubscribe]);

  /**
   * Listen for service worker messages
   */
  useEffect(() => {
    if (!supported) return;

    const cleanup = addServiceWorkerMessageListener((data) => {
      if (data.type === 'NOTIFICATION_CLICK' && onNotificationClick) {
        onNotificationClick(data);
      }
    });

    return cleanup;
  }, [supported, onNotificationClick]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    setError(null);

    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        // Permission granted - subscribe
        await subscribe();
      }

      return result;
    } catch (err) {
      setError(err.message);
      return 'error';
    }
  }, []);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    if (!supported || !user) {
      setError('Push notifications not supported or user not logged in');
      return null;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('[Push] VAPID public key not configured');
      setError('Push notifications not configured');
      return null;
    }

    setError(null);
    setLoading(true);

    try {
      // Subscribe to push
      const newSubscription = await subscribeToPush(VAPID_PUBLIC_KEY);
      setSubscription(newSubscription);

      // Save subscription to server
      const subscriptionData = newSubscription.toJSON();
      await savePushSubscription({
        endpoint: subscriptionData.endpoint,
        p256dh_key: subscriptionData.keys.p256dh,
        auth_key: subscriptionData.keys.auth,
        device_type: 'web'
      });

      console.log('[Push] Subscription saved to server');
      return newSubscription;
    } catch (err) {
      console.error('[Push] Subscribe error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supported, user]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!subscription) return true;

    setError(null);
    setLoading(true);

    try {
      // Remove from server first
      const subscriptionData = subscription.toJSON();
      await removePushSubscription(subscriptionData.endpoint);

      // Unsubscribe locally
      await unsubscribeFromPush();
      setSubscription(null);

      console.log('[Push] Unsubscribed successfully');
      return true;
    } catch (err) {
      console.error('[Push] Unsubscribe error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  /**
   * Check if user should be prompted for push permission
   * Based on user preferences and current state
   */
  const shouldPrompt = useCallback(async () => {
    if (!supported) return false;
    if (permission !== 'default') return false;
    if (subscription) return false;
    if (!user) return false;

    // Check user preferences
    try {
      const { data: prefs } = await getNotificationPreferences();
      return prefs?.push_enabled !== false; // Prompt unless explicitly disabled
    } catch {
      return true; // Default to prompting
    }
  }, [supported, permission, subscription, user]);

  return {
    // State
    supported,
    permission,
    subscription,
    isSubscribed: !!subscription,
    loading,
    error,

    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    shouldPrompt,

    // Helpers
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    canSubscribe: supported && permission === 'granted' && !subscription
  };
};

export default usePushNotifications;
