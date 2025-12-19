/**
 * Activity Service - Centralized Activity Logging
 *
 * Staff Engineer Design Principles:
 * 1. Non-blocking - Activity logging never blocks main operations
 * 2. Fire-and-forget - Callers don't wait for logging to complete
 * 3. Graceful degradation - Failures are logged, not thrown
 * 4. Batching ready - Architecture supports future batch optimization
 * 5. Offline resilient - Queue support for retry (future enhancement)
 *
 * Usage:
 *   import { activityService } from './activityService';
 *   activityService.logTaskCompleted(roadmapId, task, userId);
 *
 * @module activityService
 */

import { supabase } from '../config/supabaseClient';
import { ACTIVITY_TYPES, TARGET_TYPES } from '../constants/activityTypes';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Enable/disable activity logging globally (useful for testing)
  enabled: true,
  // Log errors to console in development
  debugMode: process.env.NODE_ENV === 'development',
  // Maximum retry attempts for failed logs
  maxRetries: 2,
  // Batch window in ms (for future batching optimization)
  batchWindowMs: 100,
};

// =============================================================================
// INTERNAL STATE
// =============================================================================

// Activity queue for batching (future optimization)
let activityQueue = [];
let batchTimeout = null;

// Cache for user profiles (avoid repeated lookups)
const profileCache = new Map();
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// CORE LOGGING FUNCTION
// =============================================================================

/**
 * Log an activity to the database (non-blocking)
 * This is the core function - all other methods delegate to this
 *
 * @param {object} params - Activity parameters
 * @param {string} params.roadmapId - Dream/roadmap ID
 * @param {string} params.actorId - User who performed the action
 * @param {string} params.actionType - Type from ACTIVITY_TYPES
 * @param {string} params.targetType - Type from TARGET_TYPES
 * @param {string} [params.targetId] - ID of the target entity
 * @param {string} [params.targetTitle] - Display title for the target
 * @param {object} [params.metadata] - Additional context data
 * @returns {void} - Fire and forget, no return value
 */
const logActivity = (params) => {
  if (!CONFIG.enabled) return;

  const {
    roadmapId,
    actorId,
    actionType,
    targetType,
    targetId = null,
    targetTitle = null,
    metadata = {},
  } = params;

  // Validate required fields
  if (!roadmapId || !actorId || !actionType) {
    if (CONFIG.debugMode) {
      console.warn('[ActivityService] Missing required fields:', { roadmapId, actorId, actionType });
    }
    return;
  }

  // Fire and forget - don't await
  executeLog({
    roadmap_id: roadmapId,
    actor_id: actorId,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId,
    target_title: targetTitle,
    metadata,
  }).catch((error) => {
    // Silently handle errors - activity logging should never break the app
    if (CONFIG.debugMode) {
      console.error('[ActivityService] Failed to log activity:', error.message);
    }
  });
};

/**
 * Execute the actual database insert
 * @private
 */
const executeLog = async (activityData, retryCount = 0) => {
  try {
    // Get actor name from cache or fetch
    const actorName = await getActorName(activityData.actor_id);

    const { error } = await supabase.from('activity_feed').insert({
      ...activityData,
      actor_name: actorName,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    if (CONFIG.debugMode) {
      console.log('[ActivityService] Logged:', activityData.action_type, activityData.target_title);
    }
  } catch (error) {
    // Retry logic
    if (retryCount < CONFIG.maxRetries) {
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 100;
      setTimeout(() => {
        executeLog(activityData, retryCount + 1).catch(() => {
          // Silently swallow - activity logging should never break the app
        });
      }, delay);
    } else {
      // Don't throw - just log and fail silently
      // Activity logging should never break the main app flow
      if (CONFIG.debugMode) {
        console.warn('[ActivityService] Failed after retries:', error?.message || error);
      }
    }
  }
};

/**
 * Get actor name from cache or database
 *
 * IMPORTANT: This function resolves a user ID to a display name for activities.
 * Uses a robust fallback chain to NEVER return "Someone" if we have any info:
 *   1. display_name (preferred, user-set)
 *   2. full_name (from OAuth or signup)
 *   3. email prefix (extracted from email)
 *   4. "Someone" (absolute last resort)
 *
 * @private
 */
const getActorName = async (userId) => {
  if (!userId) return 'Someone';

  // Check cache first
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
    return cached.name;
  }

  try {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, full_name, email')
      .eq('id', userId)
      .single();

    // Robust fallback chain - email prefix is last resort before "Someone"
    let name = 'Someone';
    if (data?.display_name) {
      name = data.display_name;
    } else if (data?.full_name) {
      name = data.full_name;
    } else if (data?.email) {
      // Extract username from email (e.g., "john.doe@gmail.com" → "john.doe")
      name = data.email.split('@')[0];
      // Capitalize first letter for better display
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Cache the result
    profileCache.set(userId, { name, timestamp: Date.now() });

    return name;
  } catch (error) {
    if (CONFIG.debugMode) {
      console.warn('[ActivityService] Failed to get actor name:', error?.message);
    }
    return 'Someone';
  }
};

// =============================================================================
// TASK ACTIVITIES
// =============================================================================

/**
 * Log task creation
 */
const logTaskCreated = (roadmapId, task, actorId) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.TASK_CREATED,
    targetType: TARGET_TYPES.TASK,
    targetId: task.id,
    targetTitle: task.title || task.description,
    metadata: {
      milestoneId: task.milestone_id,
      dueDate: task.due_date,
      assignedTo: task.assigned_to,
    },
  });
};

/**
 * Log task completion
 */
const logTaskCompleted = (roadmapId, task, actorId) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.TASK_COMPLETED,
    targetType: TARGET_TYPES.TASK,
    targetId: task.id,
    targetTitle: task.title || task.description,
    metadata: {
      milestoneId: task.milestone_id,
    },
  });
};

/**
 * Log task reopened (uncompleted)
 */
const logTaskUncompleted = (roadmapId, task, actorId) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.TASK_UNCOMPLETED,
    targetType: TARGET_TYPES.TASK,
    targetId: task.id,
    targetTitle: task.title || task.description,
    metadata: {
      milestoneId: task.milestone_id,
    },
  });
};

/**
 * Log task assignment
 */
const logTaskAssigned = (roadmapId, task, actorId, assigneeName) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.TASK_ASSIGNED,
    targetType: TARGET_TYPES.TASK,
    targetId: task.id,
    targetTitle: task.title || task.description,
    metadata: {
      milestoneId: task.milestone_id,
      assignedTo: task.assigned_to,
      assigneeName,
    },
  });
};

/**
 * Log task deletion
 */
const logTaskDeleted = (roadmapId, task, actorId) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.TASK_DELETED,
    targetType: TARGET_TYPES.TASK,
    targetId: task.id,
    targetTitle: task.title || task.description,
    metadata: {
      milestoneId: task.milestone_id,
    },
  });
};

// =============================================================================
// EXPENSE ACTIVITIES
// =============================================================================

/**
 * Log expense added
 */
const logExpenseAdded = (roadmapId, expense, actorId) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.EXPENSE_ADDED,
    targetType: TARGET_TYPES.EXPENSE,
    targetId: expense.id,
    targetTitle: expense.description || expense.title,
    metadata: {
      amount: expense.amount,
      category: expense.category,
      paidBy: expense.paid_by,
    },
  });
};

/**
 * Log expense updated
 */
const logExpenseUpdated = (roadmapId, expense, actorId) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.EXPENSE_UPDATED,
    targetType: TARGET_TYPES.EXPENSE,
    targetId: expense.id,
    targetTitle: expense.description || expense.title,
    metadata: {
      amount: expense.amount,
    },
  });
};

/**
 * Log expense deleted
 */
const logExpenseDeleted = (roadmapId, expense, actorId) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.EXPENSE_DELETED,
    targetType: TARGET_TYPES.EXPENSE,
    targetId: expense.id,
    targetTitle: expense.description || expense.title,
    metadata: {
      amount: expense.amount,
    },
  });
};

// =============================================================================
// MILESTONE ACTIVITIES
// =============================================================================

/**
 * Log milestone created
 */
const logMilestoneCreated = (roadmapId, milestone, actorId) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.MILESTONE_CREATED,
    targetType: TARGET_TYPES.MILESTONE,
    targetId: milestone.id,
    targetTitle: milestone.title,
    metadata: {
      targetDate: milestone.target_date,
      budget: milestone.budget_amount,
    },
  });
};

/**
 * Log milestone completed
 */
const logMilestoneCompleted = (roadmapId, milestone, actorId) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.MILESTONE_COMPLETED,
    targetType: TARGET_TYPES.MILESTONE,
    targetId: milestone.id,
    targetTitle: milestone.title,
    metadata: {},
  });
};

// =============================================================================
// DREAM ACTIVITIES
// =============================================================================

/**
 * Log dream created
 */
const logDreamCreated = (dream, actorId) => {
  logActivity({
    roadmapId: dream.id,
    actorId,
    actionType: ACTIVITY_TYPES.DREAM_CREATED,
    targetType: TARGET_TYPES.DREAM,
    targetId: dream.id,
    targetTitle: dream.title,
    metadata: {
      targetDate: dream.target_date,
      budget: dream.budget_amount,
    },
  });
};

/**
 * Log dream shared (partner invited)
 */
const logDreamShared = (roadmapId, dreamTitle, actorId, inviteeEmail) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.DREAM_SHARED,
    targetType: TARGET_TYPES.DREAM,
    targetId: roadmapId,
    targetTitle: dreamTitle,
    metadata: {
      inviteeEmail,
    },
  });
};

// =============================================================================
// PARTNERSHIP ACTIVITIES
// =============================================================================

/**
 * Log partner joined a dream
 */
const logPartnerJoined = (roadmapId, dreamTitle, actorId, partnerName) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.PARTNER_JOINED,
    targetType: TARGET_TYPES.DREAM,
    targetId: roadmapId,
    targetTitle: dreamTitle,
    metadata: {
      partnerName,
    },
  });
};

// =============================================================================
// INTERACTION ACTIVITIES
// =============================================================================

/**
 * Log nudge sent
 */
const logNudgeSent = (roadmapId, actorId, recipientName, taskTitle) => {
  logActivity({
    roadmapId,
    actorId,
    actionType: ACTIVITY_TYPES.NUDGE_SENT,
    targetType: TARGET_TYPES.PARTNER,
    targetId: null,
    targetTitle: taskTitle,
    metadata: {
      recipientName,
    },
  });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Clear the profile cache (useful for testing or after profile updates)
 */
const clearProfileCache = () => {
  profileCache.clear();
};

/**
 * Enable/disable activity logging globally
 */
const setEnabled = (enabled) => {
  CONFIG.enabled = enabled;
};

/**
 * Check if activity logging is enabled
 */
const isEnabled = () => CONFIG.enabled;

// =============================================================================
// EXPORT
// =============================================================================

export const activityService = {
  // Core
  logActivity,

  // Task activities
  logTaskCreated,
  logTaskCompleted,
  logTaskUncompleted,
  logTaskAssigned,
  logTaskDeleted,

  // Expense activities
  logExpenseAdded,
  logExpenseUpdated,
  logExpenseDeleted,

  // Milestone activities
  logMilestoneCreated,
  logMilestoneCompleted,

  // Dream activities
  logDreamCreated,
  logDreamShared,

  // Partnership activities
  logPartnerJoined,

  // Interaction activities
  logNudgeSent,

  // Utilities
  clearProfileCache,
  setEnabled,
  isEnabled,
};

export default activityService;
