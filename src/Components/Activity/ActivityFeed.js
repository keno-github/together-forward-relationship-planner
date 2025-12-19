import React from 'react';
import {
  CheckCircle, Plus, UserPlus, DollarSign, Trophy,
  MessageCircle, Bell, Target, Loader2, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useActivityFeed, groupActivitiesByDate, formatActivityTime, getActivityDescription } from '../../hooks/useActivityFeed';

/**
 * ActivityFeed - Timeline of partner actions on a dream
 *
 * Shows real-time updates of what partners are doing.
 * Displays "You" for the current user's activities and partner names for others.
 */
const ActivityFeed = ({ roadmapId, compact = false, maxItems = null }) => {
  const { user } = useAuth();
  const { activities, loading, error } = useActivityFeed(roadmapId, {
    limit: maxItems || 50
  });

  // Group activities by date
  const groupedActivities = groupActivitiesByDate(activities);

  // Current user ID for "You" display
  const currentUserId = user?.id;

  // Icon mapping for activity types
  const iconMap = {
    task_created: Plus,
    task_completed: CheckCircle,
    task_uncompleted: CheckCircle,
    task_assigned: UserPlus,
    task_deleted: Plus,
    expense_added: DollarSign,
    expense_updated: DollarSign,
    expense_deleted: DollarSign,
    expense_paid: DollarSign,
    milestone_completed: Trophy,
    milestone_created: Target,
    dream_created: Target,
    dream_shared: UserPlus,
    partner_joined: UserPlus,
    comment_added: MessageCircle,
    nudge_sent: Bell
  };

  // Color mapping for activity types
  const colorMap = {
    task_created: 'text-blue-500 bg-blue-50',
    task_completed: 'text-green-500 bg-green-50',
    task_assigned: 'text-purple-500 bg-purple-50',
    expense_added: 'text-emerald-500 bg-emerald-50',
    expense_paid: 'text-emerald-500 bg-emerald-50',
    milestone_completed: 'text-yellow-500 bg-yellow-50',
    milestone_created: 'text-amber-500 bg-amber-50',
    partner_joined: 'text-pink-500 bg-pink-50',
    comment_added: 'text-indigo-500 bg-indigo-50',
    nudge_sent: 'text-orange-500 bg-orange-50'
  };

  if (loading) {
    return (
      <div className={`${compact ? 'py-8' : 'py-12'} text-center`}>
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-2" />
        <p className="text-sm text-stone-500">Loading activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-500">Failed to load activity</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`${compact ? 'py-8' : 'py-12'} text-center`}>
        <div className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3`}>
          <Activity className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-stone-400`} />
        </div>
        <p className="text-stone-600 font-medium">No activity yet</p>
        <p className="text-sm text-stone-500 mt-1">
          Actions will appear here as you and your partner make progress
        </p>
      </div>
    );
  }

  if (compact) {
    // Compact view - simple list without date grouping
    const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

    return (
      <div className="space-y-2">
        {displayActivities.map((activity) => {
          const IconComponent = iconMap[activity.action_type] || Activity;
          const colors = colorMap[activity.action_type] || 'text-stone-500 bg-stone-50';
          const desc = getActivityDescription(activity, { currentUserId });

          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg ${desc.isCurrentUser ? 'bg-green-50' : colors.split(' ')[1]} flex items-center justify-center flex-shrink-0`}>
                <IconComponent className={`w-4 h-4 ${desc.isCurrentUser ? 'text-green-500' : colors.split(' ')[0]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-700 truncate">
                  <span className={`font-medium ${desc.isCurrentUser ? 'text-green-700' : ''}`}>{desc.actorName}</span>
                  {' '}{desc.verb}{' '}
                  {desc.targetTitle && (
                    <span className="font-medium">{desc.targetTitle}</span>
                  )}
                </p>
              </div>
              <span className="text-xs text-stone-400 flex-shrink-0">
                {formatActivityTime(activity.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full view with date grouping
  return (
    <div className="space-y-6">
      {groupedActivities.map((group) => (
        <div key={group.date}>
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-stone-500">{group.date}</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Activities */}
          <div className="space-y-1 pl-4 border-l-2 border-stone-200">
            {group.items.map((activity) => {
              const IconComponent = iconMap[activity.action_type] || Activity;
              const colors = colorMap[activity.action_type] || 'text-stone-500 bg-stone-50';
              const desc = getActivityDescription(activity, { currentUserId });

              return (
                <div
                  key={activity.id}
                  className="relative flex items-start gap-3 py-3 pl-4 -ml-[9px]"
                >
                  {/* Timeline dot */}
                  <div className={`w-4 h-4 rounded-full ${desc.isCurrentUser ? 'bg-green-50' : colors.split(' ')[1]} border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0`}>
                    <div className={`w-2 h-2 rounded-full ${desc.isCurrentUser ? 'bg-green-500' : colors.split(' ')[0].replace('text-', 'bg-')}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${desc.isCurrentUser ? 'bg-green-50' : colors.split(' ')[1]} flex items-center justify-center`}>
                          <IconComponent className={`w-4 h-4 ${desc.isCurrentUser ? 'text-green-500' : colors.split(' ')[0]}`} />
                        </div>
                        <div>
                          <p className="text-sm text-stone-800">
                            <span className={`font-semibold ${desc.isCurrentUser ? 'text-green-700' : ''}`}>{desc.actorName}</span>
                            {' '}{desc.verb}{' '}
                            {desc.targetLabel && (
                              <span className="text-stone-500">{desc.targetLabel}</span>
                            )}
                          </p>
                          {desc.targetTitle && (
                            <p className="text-sm font-medium text-stone-700 mt-0.5">
                              "{desc.targetTitle}"
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-stone-400 flex-shrink-0">
                        {formatActivityTime(activity.created_at)}
                      </span>
                    </div>

                    {/* Additional metadata */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 pl-10">
                        {activity.metadata.amount && (
                          <span className="text-sm text-emerald-600 font-medium">
                            ${activity.metadata.amount.toLocaleString()}
                          </span>
                        )}
                        {activity.metadata.assignee_name && (
                          <span className="text-sm text-stone-500">
                            to {activity.metadata.assignee_name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
