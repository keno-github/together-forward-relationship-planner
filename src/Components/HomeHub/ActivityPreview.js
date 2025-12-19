import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity, CheckCircle, Plus,
  UserPlus, DollarSign, Trophy, MessageCircle, Bell, Target, Loader2, ClipboardList
} from 'lucide-react';
import { formatActivityTime, getActivityDescription } from '../../hooks/useActivityFeed';

/**
 * ActivityPreview - Timeline-style activity feed for Home Hub
 *
 * Design: Clean timeline with connecting lines and avatars
 *
 * Props:
 * - activities: Array of activity objects
 * - loading: Boolean loading state
 * - error: Error message if fetch failed
 * - maxItems: Max number of items to display
 * - currentUserId: Current user's ID (to show "You" for own activities)
 */
const ActivityPreview = ({
  activities = [],
  loading = false,
  error = null,
  maxItems = 3,
  currentUserId = null,
}) => {
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
    nudge_sent: Bell,
  };

  const displayActivities = activities.slice(0, maxItems);

  // Don't render if no activities and not loading
  if (!loading && activities.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: '#FFFFFF',
        border: '1px solid #e8e4de',
        boxShadow: '0 4px 12px rgba(45, 41, 38, 0.08)',
        fontFamily: "'DM Sans', sans-serif",
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: '#e8e4de' }}>
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5" style={{ color: '#7d8c75' }} />
          <h2
            className="text-lg font-semibold"
            style={{
              color: '#2d2926',
            }}
          >
            Latest Activity
          </h2>
        </div>
      </div>

      {/* Content - Timeline Style */}
      <div className="px-6 py-5">
        {loading ? (
          <div className="py-6 text-center">
            <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" style={{ color: '#c49a6c' }} />
            <p className="text-xs" style={{ color: '#6b635b' }}>
              Loading activity...
            </p>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-xs" style={{ color: '#c76b6b' }}>
              Failed to load activity
            </p>
          </div>
        ) : displayActivities.length === 0 ? (
          <div className="py-6 text-center">
            <ClipboardList className="w-6 h-6 mx-auto mb-2" style={{ color: '#a09890' }} />
            <p className="text-xs" style={{ color: '#6b635b' }}>
              No recent activity yet
            </p>
          </div>
        ) : (
          <div>
            {displayActivities.map((activity, index) => {
              const IconComponent = iconMap[activity.action_type] || Activity;
              const desc = getActivityDescription(activity, { currentUserId });
              const isLast = index === displayActivities.length - 1;

              return (
                <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline line */}
                  {!isLast && (
                    <div
                      className="absolute left-4 top-8 bottom-0 w-0.5"
                      style={{ backgroundColor: '#e8e4de' }}
                    />
                  )}

                  {/* Avatar - different style for current user vs partner */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                    style={{
                      backgroundColor: desc.isCurrentUser ? '#e8f5e9' : '#f5f2ed',
                      border: `3px solid ${desc.isCurrentUser ? '#c8e6c9' : '#FFFFFF'}`,
                    }}
                  >
                    <IconComponent
                      className="w-3.5 h-3.5"
                      style={{ color: desc.isCurrentUser ? '#4caf50' : '#6b635b' }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4
                      className="text-sm font-semibold mb-0.5"
                      style={{
                        color: desc.isCurrentUser ? '#2e7d32' : '#2d2926'
                      }}
                    >
                      {desc.actorName}
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: '#6b635b' }}>
                      {desc.verb} {desc.targetTitle && `"${desc.targetTitle}"`}
                    </p>
                    <span className="text-xs mt-1 inline-block" style={{ color: '#6b635b', opacity: 0.6 }}>
                      {formatActivityTime(activity.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ActivityPreview;
