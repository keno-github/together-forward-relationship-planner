/**
 * Subscription Manager
 *
 * Centralized utility for managing Supabase Realtime subscriptions.
 * Prevents duplicate subscriptions and ensures proper cleanup.
 */

// Track active subscriptions by channel name
const activeSubscriptions = new Map();

/**
 * Subscribe to a channel with deduplication
 * @param {string} channelName - Unique channel identifier
 * @param {Function} setupFn - Function that creates and returns the subscription
 * @returns {Object} - The subscription object
 */
export const subscribe = (channelName, setupFn) => {
  // Check if subscription already exists
  if (activeSubscriptions.has(channelName)) {
    console.debug(`[SubscriptionManager] Reusing existing subscription: ${channelName}`);
    const existing = activeSubscriptions.get(channelName);
    existing.refCount++;
    return existing.subscription;
  }

  // Create new subscription
  const subscription = setupFn();

  activeSubscriptions.set(channelName, {
    subscription,
    refCount: 1,
    createdAt: Date.now()
  });

  console.debug(`[SubscriptionManager] Created subscription: ${channelName}`);
  return subscription;
};

/**
 * Unsubscribe from a channel
 * @param {string} channelName - The channel name to unsubscribe from
 * @param {boolean} force - Force unsubscribe even if other refs exist
 */
export const unsubscribe = (channelName, force = false) => {
  if (!activeSubscriptions.has(channelName)) {
    console.debug(`[SubscriptionManager] No subscription found: ${channelName}`);
    return;
  }

  const entry = activeSubscriptions.get(channelName);
  entry.refCount--;

  if (entry.refCount <= 0 || force) {
    // Actually unsubscribe
    if (entry.subscription && typeof entry.subscription.unsubscribe === 'function') {
      entry.subscription.unsubscribe();
    }
    activeSubscriptions.delete(channelName);
    console.debug(`[SubscriptionManager] Removed subscription: ${channelName}`);
  } else {
    console.debug(`[SubscriptionManager] Decremented ref count for: ${channelName} (${entry.refCount} remaining)`);
  }
};

/**
 * Unsubscribe from all active subscriptions
 * Useful for cleanup on app unmount or user logout
 */
export const unsubscribeAll = () => {
  console.debug(`[SubscriptionManager] Cleaning up ${activeSubscriptions.size} subscriptions`);

  activeSubscriptions.forEach((entry, channelName) => {
    if (entry.subscription && typeof entry.subscription.unsubscribe === 'function') {
      entry.subscription.unsubscribe();
    }
    console.debug(`[SubscriptionManager] Removed: ${channelName}`);
  });

  activeSubscriptions.clear();
};

/**
 * Get current subscription stats (for debugging)
 */
export const getStats = () => {
  const stats = {
    total: activeSubscriptions.size,
    subscriptions: []
  };

  activeSubscriptions.forEach((entry, channelName) => {
    stats.subscriptions.push({
      name: channelName,
      refCount: entry.refCount,
      age: Date.now() - entry.createdAt
    });
  });

  return stats;
};

/**
 * Check if a subscription exists
 * @param {string} channelName - The channel name to check
 */
export const hasSubscription = (channelName) => {
  return activeSubscriptions.has(channelName);
};

export default {
  subscribe,
  unsubscribe,
  unsubscribeAll,
  getStats,
  hasSubscription
};
