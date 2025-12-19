import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * useWelcomeBrief - Hook for Home Hub smart suggestions and state management
 *
 * Features:
 * - Session-based visibility (once per login)
 * - Smart suggestion generation based on time of day
 * - Partner activity tracking (last activity, not just yesterday)
 * - Upcoming milestone detection
 * - User preferences from localStorage
 */

// Default preferences
const DEFAULT_PREFERENCES = {
  showHomeHub: true,
  showDailyBrief: true,
  showPartnerActivity: true,
  showMomentumTracker: true,
  showContinueCard: true,
  showActivityFeed: true,
};

export const useWelcomeBrief = (dashboardData, activities = []) => {
  const { user } = useAuth();
  const userId = user?.id;

  // Session-based visibility state
  const [hasSeenThisSession, setHasSeenThisSession] = useState(() => {
    if (!userId) return false;
    return sessionStorage.getItem(`homeHub_seen_${userId}`) === 'true';
  });

  // Manual visibility toggle (for navbar home button)
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);

  // Load user preferences
  const [preferences, setPreferences] = useState(() => {
    if (!userId) return DEFAULT_PREFERENCES;
    try {
      const saved = localStorage.getItem(`homeHub_prefs_${userId}`);
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // Save preferences when they change
  const updatePreferences = useCallback((newPrefs) => {
    if (!userId) return;
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem(`homeHub_prefs_${userId}`, JSON.stringify(updated));
  }, [userId, preferences]);

  // Mark as seen for this session
  const markAsSeen = useCallback(() => {
    if (!userId) return;
    sessionStorage.setItem(`homeHub_seen_${userId}`, 'true');
    setHasSeenThisSession(true);
    setIsManuallyOpen(false);
  }, [userId]);

  // Open Home Hub manually (from navbar)
  const openHomeHub = useCallback(() => {
    setIsManuallyOpen(true);
  }, []);

  // Close Home Hub (after viewing)
  const closeHomeHub = useCallback(() => {
    markAsSeen();
  }, [markAsSeen]);

  // Should show Home Hub?
  const shouldShowHomeHub = useMemo(() => {
    if (!preferences.showHomeHub) return false;
    if (isManuallyOpen) return true;
    return !hasSeenThisSession;
  }, [preferences.showHomeHub, isManuallyOpen, hasSeenThisSession]);

  // Extract data from dashboardData
  const dreams = dashboardData?.dreams || [];
  const stats = dashboardData?.stats || {};

  // Partner names
  const partnerNames = useMemo(() => {
    if (dreams.length === 0) return { partner1: null, partner2: null, display: null };

    const firstDream = dreams[0];
    const partner1 = firstDream?.partner1_name;
    const partner2 = firstDream?.partner2_name;

    if (partner1 && partner2) {
      return { partner1, partner2, display: `${partner1} & ${partner2}` };
    }
    return { partner1, partner2: null, display: partner1 || user?.email?.split('@')[0] || 'there' };
  }, [dreams, user]);

  // Has partner?
  const hasPartner = useMemo(() => {
    return dreams.some(d => d.partner2_name || d.partner_id);
  }, [dreams]);

  // Focus task - prioritize overdue, then due soon
  const focusTask = useMemo(() => {
    if (dreams.length === 0) {
      return { type: 'no_dreams', message: 'Create your first dream to get started', task: null };
    }

    // Find first dream with overdue tasks
    const dreamWithOverdue = dreams.find(d => d.overdue_tasks > 0);
    if (dreamWithOverdue && dreamWithOverdue.next_task) {
      const daysOverdue = dreamWithOverdue.next_task.due_date
        ? Math.ceil((Date.now() - new Date(dreamWithOverdue.next_task.due_date)) / 86400000)
        : 0;
      return {
        type: 'overdue',
        message: `${dreamWithOverdue.next_task.title} - ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
        task: dreamWithOverdue.next_task,
        dreamId: dreamWithOverdue.id,
        dreamTitle: dreamWithOverdue.title,
      };
    }

    // Find first dream with upcoming tasks
    const dreamWithUpcoming = dreams.find(d => d.next_task?.due_date);
    if (dreamWithUpcoming && dreamWithUpcoming.next_task) {
      const daysUntil = Math.ceil(
        (new Date(dreamWithUpcoming.next_task.due_date) - Date.now()) / 86400000
      );
      if (daysUntil <= 7 && daysUntil >= 0) {
        return {
          type: 'upcoming',
          message: `${dreamWithUpcoming.next_task.title} - due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
          task: dreamWithUpcoming.next_task,
          dreamId: dreamWithUpcoming.id,
          dreamTitle: dreamWithUpcoming.title,
        };
      }
    }

    // All caught up
    const totalTasks = dreams.reduce((sum, d) => sum + (d.total_tasks || 0), 0);
    if (totalTasks === 0) {
      return { type: 'no_tasks', message: 'Add tasks to start tracking your progress', task: null };
    }

    return { type: 'caught_up', message: 'All caught up! Review your roadmap for next steps', task: null };
  }, [dreams]);

  // Upcoming milestone/dream - nearest target_date
  // Note: Uses dream-level target_date since milestone-level dates aren't in dashboard RPC
  // For more granular milestone dates, would need separate milestones fetch
  const upcomingMilestone = useMemo(() => {
    if (dreams.length === 0) return null;

    // First, check for milestones with target_date if available from separate fetch
    // (This would be populated if we add a milestones prop later)

    // For now, use dream-level target dates
    const dreamsWithDates = dreams
      .filter(d => d.target_date && !d.completed)
      .map(d => {
        const targetDate = new Date(d.target_date);
        const daysUntil = Math.ceil((targetDate - Date.now()) / 86400000);
        return {
          title: d.title,
          targetDate,
          daysUntil,
          dreamId: d.id,
          dreamTitle: d.title,
          isOverdue: daysUntil < 0,
        };
      })
      .filter(d => d.daysUntil >= 0) // Only future dates
      .sort((a, b) => a.daysUntil - b.daysUntil);

    if (dreamsWithDates.length === 0) {
      // Check for overdue dreams
      const overdueDreams = dreams
        .filter(d => d.target_date && !d.completed)
        .map(d => {
          const targetDate = new Date(d.target_date);
          const daysOverdue = Math.ceil((Date.now() - targetDate) / 86400000);
          return {
            title: d.title,
            targetDate,
            daysUntil: -daysOverdue,
            dreamId: d.id,
            dreamTitle: d.title,
            isOverdue: true,
          };
        })
        .filter(d => d.daysUntil < 0);

      if (overdueDreams.length > 0) {
        return overdueDreams[0];
      }
      return null;
    }

    return dreamsWithDates[0];
  }, [dreams]);

  // Last partner activity (not just yesterday - any last activity by partner)
  const lastPartnerActivity = useMemo(() => {
    if (!hasPartner || activities.length === 0) return null;

    // Find first activity by someone other than current user
    const partnerActivity = activities.find(a => a.actor_id !== userId);
    if (!partnerActivity) return null;

    // Calculate relative time
    const activityDate = new Date(partnerActivity.created_at);
    const now = new Date();
    const diffMs = now - activityDate;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor(diffMs / 60000);

    let timeAgo;
    if (diffMins < 60) {
      timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      timeAgo = 'yesterday';
    } else if (diffDays < 7) {
      timeAgo = `${diffDays} days ago`;
    } else {
      timeAgo = activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return {
      ...partnerActivity,
      timeAgo,
      formattedMessage: formatActivityMessage(partnerActivity, {
        partnerName: partnerNames.partner2,
        currentUserId: userId,
      }),
    };
  }, [activities, userId, hasPartner, partnerNames.partner2]);

  // Calculate streak from activities (MUST BE BEFORE lunaSuggestion)
  const streak = useMemo(() => {
    if (!userId || activities.length === 0) {
      return { current: 0, type: 'new', message: 'Make your first move to start your streak' };
    }

    // Filter to user's own activities
    const userActivities = activities.filter(a => a.actor_id === userId);
    if (userActivities.length === 0) {
      return { current: 0, type: 'new', message: 'Log an activity to start your streak' };
    }

    // Get unique activity dates
    const activityDates = [...new Set(
      userActivities.map(a => new Date(a.created_at).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a)); // newest first

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if streak is active (activity today or yesterday)
    if (activityDates[0] !== today && activityDates[0] !== yesterday) {
      return { current: 0, type: 'broken', message: 'Your streak ended - start a new one today!' };
    }

    // Count consecutive days
    let streakCount = 0;
    let checkDate = new Date();

    for (const dateStr of activityDates) {
      const expectedDate = checkDate.toDateString();

      if (dateStr === expectedDate) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Check if it's the previous day (accounts for gaps)
        const prevDay = new Date(checkDate);
        prevDay.setDate(prevDay.getDate() - 1);
        if (dateStr === prevDay.toDateString()) {
          streakCount++;
          checkDate = new Date(dateStr);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Milestone messages
    if (streakCount >= 30) {
      return { current: streakCount, type: 'legendary', message: `${streakCount}-day streak! You're unstoppable!` };
    }
    if (streakCount >= 14) {
      return { current: streakCount, type: 'amazing', message: `${streakCount}-day streak! Amazing dedication!` };
    }
    if (streakCount >= 7) {
      return { current: streakCount, type: 'week', message: `${streakCount}-day streak! A whole week!` };
    }
    if (streakCount >= 3) {
      return { current: streakCount, type: 'building', message: `${streakCount}-day streak! Keep it going!` };
    }
    return { current: streakCount, type: 'starting', message: `${streakCount}-day streak!` };
  }, [activities, userId]);

  // Luna's smart suggestion - highly contextual and intelligent
  const lunaSuggestion = useMemo(() => {
    const hour = new Date().getHours();
    const budgetHealth = stats.budgetHealth || 100;
    const totalDreams = dreams.length;
    const activeDreams = dreams.filter(d => !d.completed).length;
    const completedDreams = dreams.filter(d => d.completed).length;

    // Count activities
    const todayActivities = activities.filter(a => {
      const actDate = new Date(a.created_at);
      const today = new Date();
      return actDate.toDateString() === today.toDateString() && a.actor_id === userId;
    });

    const weekActivities = activities.filter(a => {
      const actDate = new Date(a.created_at);
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      return actDate >= weekAgo && a.actor_id === userId;
    });

    const partnerTodayActivities = activities.filter(a => {
      const actDate = new Date(a.created_at);
      const today = new Date();
      return actDate.toDateString() === today.toDateString() && a.actor_id !== userId;
    });

    // Calculate overall progress percentage
    const totalMilestones = dreams.reduce((sum, d) => sum + (d.total_milestones || 0), 0);
    const completedMilestones = dreams.reduce((sum, d) => sum + (d.completed_milestones || 0), 0);
    const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    // Priority 1: Celebrate wins and milestones (any time of day)
    if (completedDreams > 0 && progressPercentage >= 90) {
      return {
        icon: '🎉',
        message: `You've completed ${completedDreams} dream${completedDreams !== 1 ? 's' : ''} - you're building an amazing life together!`,
        type: 'celebration_major',
      };
    }

    if (todayActivities.length >= 5) {
      return {
        icon: '⚡',
        message: `Wow! ${todayActivities.length} updates today - you're on fire!`,
        type: 'celebration_productive_day',
      };
    }

    if (streak.current >= 7 && streak.current < 10) {
      return {
        icon: '🔥',
        message: `${streak.current}-day streak! You're building incredible momentum`,
        type: 'celebration_streak',
      };
    }

    // Priority 2: Critical alerts (any time of day)
    if (focusTask.type === 'overdue' && hour < 17) {
      const overdueCount = dreams.reduce((sum, d) => sum + (d.overdue_tasks || 0), 0);
      if (overdueCount > 3) {
        return {
          icon: '⏰',
          message: `You have ${overdueCount} overdue tasks - let's tackle them one at a time`,
          type: 'alert_overdue_many',
        };
      }
      return {
        icon: '🎯',
        message: 'Start with your overdue task - you\'ll feel great crossing it off!',
        type: 'alert_overdue',
      };
    }

    if (budgetHealth < 30) {
      return {
        icon: '💰',
        message: 'Your budget needs urgent attention - review your expenses soon',
        type: 'alert_budget_critical',
      };
    }

    // Priority 3: Upcoming urgency (any time of day)
    if (upcomingMilestone && upcomingMilestone.daysUntil === 0) {
      return {
        icon: '🎯',
        message: `${upcomingMilestone.title} is due today - you've got this!`,
        type: 'urgent_milestone_today',
      };
    }

    if (upcomingMilestone && upcomingMilestone.daysUntil === 1) {
      return {
        icon: '📅',
        message: `${upcomingMilestone.title} is due tomorrow - final push!`,
        type: 'urgent_milestone_tomorrow',
      };
    }

    if (upcomingMilestone && upcomingMilestone.daysUntil <= 3) {
      return {
        icon: '⏳',
        message: `${upcomingMilestone.title} is ${upcomingMilestone.daysUntil} days away - stay on track`,
        type: 'urgent_milestone_soon',
      };
    }

    // MORNING SUGGESTIONS (before noon)
    if (hour < 12) {
      // Partner was active but you weren't
      if (partnerTodayActivities.length > 0 && todayActivities.length === 0) {
        return {
          icon: '💫',
          message: `${partnerNames.partner2 || 'Your partner'} is already making moves today - join in!`,
          type: 'morning_partner_active',
        };
      }

      // Strong streak, keep it going
      if (streak.current >= 3 && todayActivities.length === 0) {
        return {
          icon: '🔥',
          message: `Don't break your ${streak.current}-day streak - make today count!`,
          type: 'morning_maintain_streak',
        };
      }

      // Broken streak, restart
      if (streak.type === 'broken') {
        return {
          icon: '🌅',
          message: 'New day, fresh start - rebuild your momentum with one small action',
          type: 'morning_restart',
        };
      }

      // Good progress, maintain momentum
      if (progressPercentage >= 50 && progressPercentage < 75) {
        return {
          icon: '🌟',
          message: `${Math.round(progressPercentage)}% complete - keep the momentum flowing`,
          type: 'morning_progress',
        };
      }

      // Multiple active dreams
      if (activeDreams > 2) {
        return {
          icon: '🗺️',
          message: `${activeDreams} dreams in progress - which one needs your focus today?`,
          type: 'morning_multiple_dreams',
        };
      }

      return {
        icon: '☀️',
        message: 'Good morning! What will you accomplish together today?',
        type: 'morning_default',
      };
    }

    // AFTERNOON SUGGESTIONS (noon - 5pm)
    if (hour < 17) {
      // Very productive already
      if (todayActivities.length >= 3) {
        return {
          icon: '✨',
          message: `${todayActivities.length} updates so far - you're crushing it today!`,
          type: 'afternoon_productive',
        };
      }

      // Partner hasn't been active recently
      if (hasPartner && lastPartnerActivity) {
        const daysSincePartner = Math.floor(
          (Date.now() - new Date(lastPartnerActivity.created_at)) / 86400000
        );
        if (daysSincePartner >= 3) {
          return {
            icon: '💬',
            message: `Haven't seen ${partnerNames.partner2} in ${daysSincePartner} days - send them a nudge?`,
            type: 'afternoon_partner_inactive',
          };
        }
      }

      // Budget warning
      if (budgetHealth < 60 && budgetHealth >= 30) {
        return {
          icon: '💰',
          message: 'Your budget health is dropping - time for a financial check-in',
          type: 'afternoon_budget_warning',
        };
      }

      // Good week momentum
      if (weekActivities.length >= 10) {
        return {
          icon: '📈',
          message: `${weekActivities.length} updates this week - you're building real momentum!`,
          type: 'afternoon_week_momentum',
        };
      }

      // Upcoming task focus
      if (focusTask.type === 'upcoming' && focusTask.task) {
        return {
          icon: '🎯',
          message: `"${focusTask.task.title}" - perfect time to make progress on this`,
          type: 'afternoon_focus_task',
        };
      }

      // Haven't done much today
      if (todayActivities.length === 0) {
        return {
          icon: '⏰',
          message: 'Afternoon is perfect for progress - what can you tackle right now?',
          type: 'afternoon_low_activity',
        };
      }

      return {
        icon: '🌤️',
        message: 'Keep the momentum going - small actions add up to big results',
        type: 'afternoon_default',
      };
    }

    // EVENING SUGGESTIONS (after 5pm)
    // Highly productive day
    if (todayActivities.length >= 5) {
      return {
        icon: '🌟',
        message: `What a day! ${todayActivities.length} updates - you earned your rest`,
        type: 'evening_highly_productive',
      };
    }

    // Moderate productivity
    if (todayActivities.length >= 2) {
      return {
        icon: '🌙',
        message: `Nice work today! ${todayActivities.length} steps forward on your journey`,
        type: 'evening_productive',
      };
    }

    // Low activity but good week
    if (todayActivities.length === 0 && weekActivities.length >= 7) {
      return {
        icon: '💫',
        message: 'Taking a breather is good - you\'ve been consistent all week',
        type: 'evening_rest_deserved',
      };
    }

    // Streak at risk
    if (streak.current >= 3 && todayActivities.length === 0) {
      return {
        icon: '⚡',
        message: `Quick! ${streak.current}-day streak at risk - one small update keeps it alive`,
        type: 'evening_streak_at_risk',
      };
    }

    // No activity, but has partner who was active
    if (todayActivities.length === 0 && partnerTodayActivities.length > 0) {
      return {
        icon: '👥',
        message: `${partnerNames.partner2} made progress today - what can you add?`,
        type: 'evening_partner_active',
      };
    }

    // Very low weekly activity
    if (weekActivities.length < 3) {
      return {
        icon: '🌱',
        message: 'Progress happens in small steps - even planning for 5 minutes counts',
        type: 'evening_low_engagement',
      };
    }

    // Caught up, celebrate it
    if (focusTask.type === 'caught_up') {
      return {
        icon: '✨',
        message: 'All caught up! Time to dream bigger or plan your next milestone',
        type: 'evening_caught_up',
      };
    }

    // Default evening - gentle encouragement
    return {
      icon: '🌙',
      message: 'Every journey starts with intention - reflecting on your dreams counts too',
      type: 'evening_default',
    };
  }, [focusTask, upcomingMilestone, hasPartner, lastPartnerActivity, partnerNames, stats, activities, userId, dreams, streak]);

  // Overall progress across all dreams
  const overallProgress = useMemo(() => {
    if (dreams.length === 0) return { percentage: 0, message: 'Create a dream to start' };

    const totalMilestones = dreams.reduce((sum, d) => sum + (d.total_milestones || 0), 0);
    const completedMilestones = dreams.reduce((sum, d) => sum + (d.completed_milestones || 0), 0);

    if (totalMilestones === 0) {
      return { percentage: 0, message: 'Add milestones to track your journey' };
    }

    const percentage = Math.round((completedMilestones / totalMilestones) * 100);

    if (percentage === 100) {
      return { percentage, message: 'All milestones complete! Time to celebrate!' };
    }
    if (percentage >= 75) {
      return { percentage, message: `${percentage}% complete - almost there!` };
    }
    if (percentage >= 50) {
      return { percentage, message: `${percentage}% complete - halfway there!` };
    }
    return { percentage, message: `${percentage}% complete` };
  }, [dreams]);

  // Last viewed dream (for Continue card)
  const lastViewed = useMemo(() => {
    if (!userId) return null;

    try {
      const saved = localStorage.getItem(`lastViewed_${userId}`);
      if (!saved) return null;

      const data = JSON.parse(saved);
      const timestamp = data.timestamp || 0;
      const daysSince = Math.floor((Date.now() - timestamp) / 86400000);

      // Check if the dream still exists
      const dreamExists = dreams.some(d => d.id === data.dreamId);
      if (!dreamExists) return null;

      return {
        ...data,
        daysSince,
        isRecent: daysSince <= 7,
      };
    } catch {
      return null;
    }
  }, [userId, dreams]);

  // Get most recently updated dream as fallback
  const mostRecentDream = useMemo(() => {
    if (dreams.length === 0) return null;

    const sorted = [...dreams].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB - dateA;
    });

    return sorted[0];
  }, [dreams]);

  // Continue card data
  const continueData = useMemo(() => {
    if (lastViewed && lastViewed.isRecent) {
      return {
        type: 'last_viewed',
        dreamId: lastViewed.dreamId,
        dreamTitle: lastViewed.dreamTitle,
        milestoneName: lastViewed.milestoneName,
        message: 'You last worked on:',
      };
    }

    if (mostRecentDream) {
      return {
        type: 'recent',
        dreamId: mostRecentDream.id,
        dreamTitle: mostRecentDream.title,
        milestoneName: null,
        message: 'Pick up where you left off:',
      };
    }

    return null;
  }, [lastViewed, mostRecentDream]);

  return {
    // Visibility
    shouldShowHomeHub,
    hasSeenThisSession,
    openHomeHub,
    closeHomeHub,
    markAsSeen,

    // Preferences
    preferences,
    updatePreferences,

    // Data
    partnerNames,
    hasPartner,
    focusTask,
    upcomingMilestone,
    lastPartnerActivity,
    lunaSuggestion,
    streak,
    overallProgress,
    continueData,

    // Raw data access
    dreams,
    stats,
    activities,
  };
};

/**
 * Helper function to format activity messages
 *
 * @param {object} activity - Activity object with actor_name, action_type, etc.
 * @param {object} options - Optional configuration
 * @param {string} options.partnerName - Partner's name to use if actor_name is "Someone"
 * @param {string} options.currentUserId - Current user ID to show "You" for own activities
 */
function formatActivityMessage(activity, options = {}) {
  const { partnerName, currentUserId } = options;

  // Determine actor name with smart fallbacks
  let actor = activity.actor_name || 'Someone';

  // If we know this is the current user's activity, show "You"
  if (currentUserId && activity.actor_id === currentUserId) {
    actor = 'You';
  }
  // If actor is still "Someone" but we have a partner name and this isn't the current user
  else if (actor === 'Someone' && partnerName && activity.actor_id && activity.actor_id !== currentUserId) {
    actor = partnerName;
  }

  const target = activity.target_title || '';

  switch (activity.action_type) {
    case 'task_completed':
      return `${actor} completed "${target}"`;
    case 'task_created':
      return `${actor} added a new task: "${target}"`;
    case 'task_uncompleted':
      return `${actor} reopened "${target}"`;
    case 'task_assigned':
      return `${actor} assigned "${target}"`;
    case 'task_deleted':
      return `${actor} deleted task "${target}"`;
    case 'expense_added':
      const amount = activity.metadata?.amount;
      return amount ? `${actor} added expense: ${target} (+$${amount})` : `${actor} added expense: ${target}`;
    case 'expense_updated':
      return `${actor} updated expense: ${target}`;
    case 'expense_deleted':
      return `${actor} deleted expense: ${target}`;
    case 'expense_paid':
      return `${actor} paid "${target}"`;
    case 'milestone_completed':
      return `${actor} completed milestone: ${target}`;
    case 'milestone_created':
      return `${actor} created milestone: ${target}`;
    case 'dream_created':
      return `${actor} created a new dream: ${target}`;
    case 'dream_shared':
      return `${actor} shared the dream: ${target}`;
    case 'partner_joined':
      return `${actor} joined the dream`;
    case 'nudge_sent':
      return `${actor} sent a nudge`;
    case 'comment_added':
      return `${actor} added a comment`;
    default:
      return `${actor} updated ${target}`;
  }
}

// Helper hook to track last viewed dream
export const useLastViewedTracking = () => {
  const { user } = useAuth();

  const trackLastViewed = useCallback((dream, milestone = null) => {
    if (!user?.id || !dream) return;

    const data = {
      dreamId: dream.id,
      dreamTitle: dream.title,
      milestoneName: milestone?.title || null,
      timestamp: Date.now(),
    };

    localStorage.setItem(`lastViewed_${user.id}`, JSON.stringify(data));
  }, [user?.id]);

  return { trackLastViewed };
};

export default useWelcomeBrief;
