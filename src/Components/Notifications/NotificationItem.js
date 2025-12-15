import React from 'react';
import {
  Bell, CheckCircle, Heart, Users, Trophy, DollarSign,
  MessageCircle, UserPlus, X, ChevronRight
} from 'lucide-react';
import { formatNotificationTime, getNotificationStyle } from '../../hooks/useNotifications';

/**
 * NotificationItem - Single notification display
 */
const NotificationItem = ({
  notification,
  onMarkRead,
  onDismiss,
  onClick,
  compact = false
}) => {
  const { icon, color, bgColor } = getNotificationStyle(notification.type);

  // Map icon names to components
  const iconMap = {
    Bell,
    CheckCircle,
    Heart,
    Users,
    Trophy,
    DollarSign,
    MessageCircle,
    UserPlus
  };
  const IconComponent = iconMap[icon] || Bell;

  const handleClick = (e) => {
    // Stop propagation to prevent dropdown from closing
    e.stopPropagation();

    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(notification.id);
    }
  };

  // Prevent mousedown from triggering "click outside" handler
  const handleMouseDown = (e) => {
    e.stopPropagation();
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-stone-50 ${
          !notification.read ? 'bg-amber-50/50' : ''
        }`}
      >
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
          <IconComponent className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${!notification.read ? 'font-medium text-stone-900' : 'text-stone-700'}`}>
            {notification.title}
          </p>
          <p className="text-xs text-stone-500">
            {formatNotificationTime(notification.created_at)}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={`group relative p-4 rounded-xl cursor-pointer transition-all hover:bg-stone-50 ${
        !notification.read ? 'bg-amber-50/30 border border-amber-100' : 'border border-transparent'
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
          <IconComponent className={`w-5 h-5 ${color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm ${!notification.read ? 'font-semibold text-stone-900' : 'font-medium text-stone-800'}`}>
                {notification.title}
              </p>
              {notification.body && (
                <p className="text-sm text-stone-600 mt-0.5 line-clamp-2">
                  {notification.body}
                </p>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-stone-200 transition-all"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {notification.actor_name && (
                <span className="text-xs text-stone-500">
                  {notification.actor_name}
                </span>
              )}
              <span className="text-xs text-stone-400">
                {formatNotificationTime(notification.created_at)}
              </span>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </div>
        </div>
      </div>

      {/* Hover action hint */}
      {notification.data?.action_url && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
