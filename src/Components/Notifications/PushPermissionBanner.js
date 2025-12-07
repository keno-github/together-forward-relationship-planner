import React, { useState, useEffect } from 'react';
import { Bell, X, BellRing, Check } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

/**
 * PushPermissionBanner - Prompts users to enable push notifications
 *
 * Shows a dismissible banner at the top of the page when:
 * - Push is supported
 * - Permission hasn't been granted or denied
 * - User hasn't dismissed it in this session
 */
const PushPermissionBanner = ({ onDismiss }) => {
  const [dismissed, setDismissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    supported,
    permission,
    isSubscribed,
    loading,
    requestPermission
  } = usePushNotifications();

  // Check if banner should be shown
  const shouldShow = supported &&
    permission === 'default' &&
    !isSubscribed &&
    !dismissed &&
    !loading;

  // Check localStorage for previous dismissal
  useEffect(() => {
    const dismissedAt = localStorage.getItem('push_banner_dismissed');
    if (dismissedAt) {
      // Re-show after 7 days
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  const handleEnable = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      setShowSuccess(true);
      setTimeout(() => {
        setDismissed(true);
      }, 2000);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_banner_dismissed', Date.now().toString());
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (!shouldShow && !showSuccess) return null;

  if (showSuccess) {
    return (
      <div className="bg-green-500 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">Push notifications enabled! You'll be notified of important updates.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 relative">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">Stay updated with your partner</p>
            <p className="text-sm text-white/80">
              Get notified when your partner completes tasks or needs your attention
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEnable}
            className="px-4 py-2 bg-white text-amber-600 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Enable Notifications
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact version for use in settings or modals
 */
export const PushPermissionCard = ({ className = '' }) => {
  const [enabling, setEnabling] = useState(false);

  const {
    supported,
    permission,
    isSubscribed,
    requestPermission,
    unsubscribe
  } = usePushNotifications();

  if (!supported) {
    return (
      <div className={`p-4 bg-stone-100 rounded-xl ${className}`}>
        <p className="text-sm text-stone-500">
          Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  const handleToggle = async () => {
    setEnabling(true);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await requestPermission();
    }
    setEnabling(false);
  };

  return (
    <div className={`p-4 bg-white rounded-xl border border-stone-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isSubscribed ? 'bg-green-50' : 'bg-amber-50'
          }`}>
            <Bell className={`w-5 h-5 ${isSubscribed ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <p className="font-medium text-stone-800">Push Notifications</p>
            <p className="text-sm text-stone-500">
              {permission === 'denied'
                ? 'Blocked in browser settings'
                : isSubscribed
                  ? 'You\'ll receive browser notifications'
                  : 'Get notified even when the tab is closed'}
            </p>
          </div>
        </div>

        {permission !== 'denied' && (
          <button
            onClick={handleToggle}
            disabled={enabling}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubscribed
                ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            } disabled:opacity-50`}
          >
            {enabling ? 'Please wait...' : isSubscribed ? 'Disable' : 'Enable'}
          </button>
        )}
      </div>

      {permission === 'denied' && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">
            Notifications are blocked. Please enable them in your browser settings to receive updates.
          </p>
        </div>
      )}
    </div>
  );
};

export default PushPermissionBanner;
