/**
 * Activity Types - Single Source of Truth
 *
 * Staff Engineer Design Principles:
 * 1. Immutable constants prevent typos and enable IDE autocomplete
 * 2. Grouped by domain for easy discovery
 * 3. Metadata enables UI rendering without switch statements
 * 4. Extensible - add new types without modifying consumers
 *
 * @module activityTypes
 */

// =============================================================================
// ACTIVITY TYPE IDENTIFIERS
// =============================================================================

export const ACTIVITY_TYPES = Object.freeze({
  // Task activities
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  TASK_UNCOMPLETED: 'task_uncompleted',
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',

  // Milestone activities
  MILESTONE_CREATED: 'milestone_created',
  MILESTONE_COMPLETED: 'milestone_completed',
  MILESTONE_UPDATED: 'milestone_updated',

  // Expense/Budget activities
  EXPENSE_ADDED: 'expense_added',
  EXPENSE_UPDATED: 'expense_updated',
  EXPENSE_DELETED: 'expense_deleted',
  BUDGET_SET: 'budget_set',

  // Dream activities
  DREAM_CREATED: 'dream_created',
  DREAM_UPDATED: 'dream_updated',
  DREAM_SHARED: 'dream_shared',

  // Partnership activities
  PARTNER_JOINED: 'partner_joined',
  PARTNER_LEFT: 'partner_left',
  PARTNER_INVITED: 'partner_invited',

  // Interaction activities
  COMMENT_ADDED: 'comment_added',
  NUDGE_SENT: 'nudge_sent',
});

// =============================================================================
// TARGET TYPES (what the activity relates to)
// =============================================================================

export const TARGET_TYPES = Object.freeze({
  TASK: 'task',
  MILESTONE: 'milestone',
  EXPENSE: 'expense',
  DREAM: 'dream',
  PARTNER: 'partner',
  COMMENT: 'comment',
});

// =============================================================================
// ACTIVITY METADATA
// Enables UI rendering without switch statements
// =============================================================================

export const ACTIVITY_METADATA = Object.freeze({
  [ACTIVITY_TYPES.TASK_CREATED]: {
    verb: 'created',
    pastTense: 'created',
    icon: 'plus',
    color: '#7d8c75',
    targetType: TARGET_TYPES.TASK,
    priority: 2, // For sorting (lower = more important)
  },
  [ACTIVITY_TYPES.TASK_COMPLETED]: {
    verb: 'completed',
    pastTense: 'completed',
    icon: 'check-circle',
    color: '#2E7D32',
    targetType: TARGET_TYPES.TASK,
    priority: 1,
  },
  [ACTIVITY_TYPES.TASK_UNCOMPLETED]: {
    verb: 'reopened',
    pastTense: 'reopened',
    icon: 'rotate-ccw',
    color: '#E65100',
    targetType: TARGET_TYPES.TASK,
    priority: 2,
  },
  [ACTIVITY_TYPES.TASK_ASSIGNED]: {
    verb: 'assigned',
    pastTense: 'assigned',
    icon: 'user-plus',
    color: '#1565C0',
    targetType: TARGET_TYPES.TASK,
    priority: 2,
  },
  [ACTIVITY_TYPES.TASK_UPDATED]: {
    verb: 'updated',
    pastTense: 'updated',
    icon: 'edit',
    color: '#6b635b',
    targetType: TARGET_TYPES.TASK,
    priority: 3,
  },
  [ACTIVITY_TYPES.TASK_DELETED]: {
    verb: 'deleted',
    pastTense: 'deleted',
    icon: 'trash',
    color: '#C62828',
    targetType: TARGET_TYPES.TASK,
    priority: 3,
  },
  [ACTIVITY_TYPES.MILESTONE_CREATED]: {
    verb: 'created milestone',
    pastTense: 'created milestone',
    icon: 'target',
    color: '#7d8c75',
    targetType: TARGET_TYPES.MILESTONE,
    priority: 1,
  },
  [ACTIVITY_TYPES.MILESTONE_COMPLETED]: {
    verb: 'completed milestone',
    pastTense: 'completed milestone',
    icon: 'trophy',
    color: '#c49a6c',
    targetType: TARGET_TYPES.MILESTONE,
    priority: 1,
  },
  [ACTIVITY_TYPES.MILESTONE_UPDATED]: {
    verb: 'updated milestone',
    pastTense: 'updated milestone',
    icon: 'edit',
    color: '#6b635b',
    targetType: TARGET_TYPES.MILESTONE,
    priority: 3,
  },
  [ACTIVITY_TYPES.EXPENSE_ADDED]: {
    verb: 'added expense',
    pastTense: 'added expense',
    icon: 'dollar-sign',
    color: '#2E7D32',
    targetType: TARGET_TYPES.EXPENSE,
    priority: 2,
  },
  [ACTIVITY_TYPES.EXPENSE_UPDATED]: {
    verb: 'updated expense',
    pastTense: 'updated expense',
    icon: 'dollar-sign',
    color: '#6b635b',
    targetType: TARGET_TYPES.EXPENSE,
    priority: 3,
  },
  [ACTIVITY_TYPES.EXPENSE_DELETED]: {
    verb: 'removed expense',
    pastTense: 'removed expense',
    icon: 'dollar-sign',
    color: '#C62828',
    targetType: TARGET_TYPES.EXPENSE,
    priority: 3,
  },
  [ACTIVITY_TYPES.BUDGET_SET]: {
    verb: 'set budget for',
    pastTense: 'set budget for',
    icon: 'wallet',
    color: '#c49a6c',
    targetType: TARGET_TYPES.DREAM,
    priority: 2,
  },
  [ACTIVITY_TYPES.DREAM_CREATED]: {
    verb: 'created dream',
    pastTense: 'created dream',
    icon: 'sparkles',
    color: '#c49a6c',
    targetType: TARGET_TYPES.DREAM,
    priority: 1,
  },
  [ACTIVITY_TYPES.DREAM_UPDATED]: {
    verb: 'updated dream',
    pastTense: 'updated dream',
    icon: 'edit',
    color: '#6b635b',
    targetType: TARGET_TYPES.DREAM,
    priority: 3,
  },
  [ACTIVITY_TYPES.DREAM_SHARED]: {
    verb: 'shared',
    pastTense: 'shared',
    icon: 'share',
    color: '#1565C0',
    targetType: TARGET_TYPES.DREAM,
    priority: 1,
  },
  [ACTIVITY_TYPES.PARTNER_JOINED]: {
    verb: 'joined',
    pastTense: 'joined',
    icon: 'heart',
    color: '#E91E63',
    targetType: TARGET_TYPES.DREAM,
    priority: 1,
  },
  [ACTIVITY_TYPES.PARTNER_LEFT]: {
    verb: 'left',
    pastTense: 'left',
    icon: 'user-minus',
    color: '#6b635b',
    targetType: TARGET_TYPES.DREAM,
    priority: 2,
  },
  [ACTIVITY_TYPES.PARTNER_INVITED]: {
    verb: 'invited partner to',
    pastTense: 'invited partner to',
    icon: 'mail',
    color: '#1565C0',
    targetType: TARGET_TYPES.DREAM,
    priority: 2,
  },
  [ACTIVITY_TYPES.COMMENT_ADDED]: {
    verb: 'commented on',
    pastTense: 'commented on',
    icon: 'message-circle',
    color: '#1565C0',
    targetType: TARGET_TYPES.COMMENT,
    priority: 2,
  },
  [ACTIVITY_TYPES.NUDGE_SENT]: {
    verb: 'nudged',
    pastTense: 'nudged',
    icon: 'bell',
    color: '#c49a6c',
    targetType: TARGET_TYPES.PARTNER,
    priority: 2,
  },
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get metadata for an activity type
 * @param {string} activityType - The activity type identifier
 * @returns {object} Activity metadata or default
 */
export const getActivityMetadata = (activityType) => {
  return ACTIVITY_METADATA[activityType] || {
    verb: 'updated',
    pastTense: 'updated',
    icon: 'activity',
    color: '#6b635b',
    targetType: 'item',
    priority: 5,
  };
};

/**
 * Format activity for display
 * @param {object} activity - Activity record from database
 * @returns {object} Formatted activity for UI
 */
export const formatActivityForDisplay = (activity) => {
  const metadata = getActivityMetadata(activity.action_type);

  return {
    id: activity.id,
    actorName: activity.actor_name || 'Someone',
    actorId: activity.actor_id,
    verb: metadata.verb,
    targetTitle: activity.target_title || '',
    targetType: metadata.targetType,
    icon: metadata.icon,
    color: metadata.color,
    timestamp: activity.created_at,
    metadata: activity.metadata || {},
    dreamId: activity.roadmap_id,
  };
};

/**
 * Build human-readable activity message
 * @param {object} activity - Activity record
 * @returns {string} Human-readable message
 */
export const buildActivityMessage = (activity) => {
  const metadata = getActivityMetadata(activity.action_type);
  const actor = activity.actor_name || 'Someone';
  const target = activity.target_title;

  if (target) {
    return `${actor} ${metadata.pastTense} "${target}"`;
  }
  return `${actor} ${metadata.pastTense}`;
};

export default {
  ACTIVITY_TYPES,
  TARGET_TYPES,
  ACTIVITY_METADATA,
  getActivityMetadata,
  formatActivityForDisplay,
  buildActivityMessage,
};
