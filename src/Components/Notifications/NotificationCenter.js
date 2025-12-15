import React, { useState, useEffect } from 'react';
import { Bell, Check, Settings, Loader2, Inbox } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

/**
 * NotificationCenter - Bell icon with dropdown notification list
 */
const NotificationCenter = ({ onOpenSettings, onNotificationClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismiss,
    hasUnread
  } = useNotifications({
    limit: 20
  });

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification) => {
    // Just call the callback if provided - don't close
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  // Close dropdown when clicking backdrop
  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Invisible backdrop to catch outside clicks */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleBackdropClick}
        />
      )}

      <div className="relative z-50">
        {/* Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-xl transition-all ${
            isOpen
              ? 'bg-amber-100 text-amber-700'
              : 'hover:bg-stone-100 text-stone-600'
          }`}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="w-5 h-5" />

          {/* Unread Badge */}
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Pulse animation for new notifications */}
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-500 rounded-full animate-ping opacity-75" />
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-800">Notifications</h3>
                {hasUnread && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {hasUnread && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors text-amber-700"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenSettings();
                    }}
                    className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-500"
                    title="Notification settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-stone-500">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-8 h-8 text-stone-400" />
                  </div>
                  <p className="text-stone-600 font-medium">All caught up!</p>
                  <p className="text-sm text-stone-500 mt-1">
                    No new notifications
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onDismiss={dismiss}
                      onClick={handleNotificationClick}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-stone-100 bg-stone-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-amber-600 font-medium hover:text-amber-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationCenter;
