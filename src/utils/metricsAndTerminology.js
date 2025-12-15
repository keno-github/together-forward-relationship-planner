/**
 * Metrics and Terminology - Single Source of Truth
 *
 * This file defines all terminology and metric calculations used throughout
 * the Together Forward application. Any changes to naming or calculation
 * logic should be made HERE to ensure consistency across the app.
 *
 * DATA MODEL HIERARCHY:
 * ---------------------
 * Dream (roadmaps table)
 *   └── Goal/Milestone (milestones table) - internal structure
 *         └── Roadmap (deep_dive_data.roadmapPhases[]) - what users see
 *               └── Task (tasks table)
 *
 * TERMINOLOGY MAPPING:
 * --------------------
 * Database Location              | UI Term     | Description
 * -------------------------------|-------------|----------------------------------
 * roadmaps table                 | Dream       | Top-level goal (e.g., "Create dream garden")
 * milestones table               | (internal)  | Goal structure within a dream
 * deep_dive_data.roadmapPhases[] | Roadmap     | Phases/steps shown to users
 * tasks table                    | Task        | Actionable items within a roadmap
 *
 * KEY METRICS:
 * ------------
 * - Dream Progress = completedRoadmaps / totalRoadmaps (from roadmapPhases)
 * - Velocity = progress vs time + budget alignment
 * - Open Roadmaps = total uncompleted phases across all dreams
 *
 * SUBSCRIPTION MODEL:
 * -------------------
 * Model: Freemium with generous free tier (early phase strategy)
 *
 * Tier: Twogether Starter (Free)
 * - 2 Active Dreams (paywall trigger)
 * - Full Partner Collaboration
 * - Unlimited Luna AI (core experience)
 * - Unlimited Milestones & Tasks
 * - Unlimited Compatibility Assessments
 * - Basic Activity Tracking
 *
 * Tier: Twogether Pro ($12/month or $10/month annual)
 * - Everything in Free, plus:
 * - Unlimited Dreams
 * - AI-Powered PDF Reports
 * - Portfolio Intelligence
 * - Advanced Budget & Timeline Tools
 * - Priority Support (24hr response)
 * - Early Access to New Features
 *
 * Key Business Rules:
 * - Partner collaboration is FREE (core product value)
 * - Paywall triggers: 3rd dream, PDF reports, advanced tools
 * - 14-day money-back guarantee
 * - Annual plan saves $24/year ($120/year vs $144/year)
 */

// =====================================================
// TERMINOLOGY CONSTANTS
// =====================================================

export const TERMINOLOGY = {
  // Database -> UI display name
  DREAM: 'Dream',           // roadmaps table
  DREAMS: 'Dreams',
  ROADMAP: 'Roadmap',       // deep_dive_data.roadmapPhases[] (what users see as phases)
  ROADMAPS: 'Roadmaps',
  TASK: 'Task',             // tasks table
  TASKS: 'Tasks',

  // Status labels
  STATUS_EXCELLENT: 'Excellent',
  STATUS_ON_TRACK: 'On Track',
  STATUS_NEEDS_ATTENTION: 'Needs Attention',
  STATUS_AT_RISK: 'At Risk',

  // Progress labels
  PROGRESS_COMPLETE: 'Complete',
  PROGRESS_IN_PROGRESS: 'In Progress',
  PROGRESS_PENDING: 'Pending',
  PROGRESS_WAITING: 'Waiting',

  // Subscription tiers
  TIER_FREE: 'Twogether Starter',
  TIER_PRO: 'Twogether Pro',
};

// =====================================================
// SUBSCRIPTION CONSTANTS
// =====================================================

export const SUBSCRIPTION = {
  // Pricing - 3 tier structure
  PRICE_MONTHLY: 12,           // $12/month
  PRICE_QUARTERLY: 10,         // $10/month (billed quarterly at $30)
  PRICE_ANNUAL: 8,             // $8/month (billed annually at $96)

  // Billing totals
  QUARTERLY_TOTAL: 30,         // $30/quarter
  ANNUAL_TOTAL: 96,            // $96/year

  // Savings
  QUARTERLY_SAVINGS: 17,       // 17% savings vs monthly
  ANNUAL_SAVINGS: 33,          // 33% savings vs monthly (4 months free)
  ANNUAL_MONTHS_FREE: 4,       // Marketing: "4 months free"

  // Free tier limits
  FREE_MAX_DREAMS: 2,
  // No Luna limits - core experience is free
  // No compatibility limits - core experience is free

  // Pro tier (unlimited = -1)
  PRO_MAX_DREAMS: -1,

  // Features by tier
  FEATURES: {
    FREE: [
      '2 Active Dreams',
      'Full Partner Collaboration',
      'Unlimited Luna AI',
      'Unlimited Milestones & Tasks',
      'Unlimited Compatibility Assessments',
      'Basic Activity Tracking',
    ],
    PRO: [
      'Unlimited Dreams',
      'AI-Powered PDF Reports',
      'Portfolio Intelligence',
      'Advanced Budget & Timeline Tools',
      'Priority Support (24hr response)',
      'Early Access to New Features',
    ],
  },
};

// =====================================================
// VELOCITY THRESHOLDS
// =====================================================

export const VELOCITY_THRESHOLDS = {
  EXCELLENT: 10,      // velocityScore >= 10
  ON_TRACK: -10,      // velocityScore >= -10
  NEEDS_ATTENTION: -25, // velocityScore >= -25
  // Below -25 = AT_RISK
};

// =====================================================
// ROADMAP (PHASE) CALCULATION FUNCTIONS
// =====================================================

/**
 * Calculate roadmap (phase) completion for a single milestone
 *
 * A roadmap (phase) is considered complete if:
 * 1. phase.completed === true (manually marked), OR
 * 2. All tasks in that phase are completed
 *
 * @param {Object} milestone - The milestone object with deep_dive_data
 * @param {Array} tasks - Tasks associated with this milestone
 * @returns {Object} { completedRoadmaps, totalRoadmaps, percentage }
 */
export const calculateRoadmapProgress = (milestone, tasks = []) => {
  const deepDive = milestone?.deepDiveData || milestone?.deep_dive_data;
  const phases = deepDive?.roadmapPhases || [];

  if (phases.length === 0) {
    return { completedRoadmaps: 0, totalRoadmaps: 0, percentage: 0 };
  }

  let completedRoadmaps = 0;

  phases.forEach((phase, phaseIndex) => {
    if (phase.completed) {
      // Manually marked complete
      completedRoadmaps++;
    } else {
      // Check if all tasks for this phase are completed
      const phaseTasks = tasks.filter(t => t.roadmap_phase_index === phaseIndex);
      if (phaseTasks.length > 0 && phaseTasks.every(t => t.completed)) {
        completedRoadmaps++;
      }
    }
  });

  const percentage = Math.round((completedRoadmaps / phases.length) * 100);

  return {
    completedRoadmaps,
    totalRoadmaps: phases.length,
    percentage
  };
};

/**
 * Calculate roadmap progress for a dream with multiple milestones
 * Aggregates all roadmapPhases across all milestones
 *
 * @param {Array} milestones - Array of milestones for the dream
 * @param {Array} allTasks - All tasks across all milestones
 * @returns {Object} { completedRoadmaps, totalRoadmaps, percentage }
 */
export const calculateDreamRoadmapProgress = (milestones = [], allTasks = []) => {
  let totalRoadmaps = 0;
  let completedRoadmaps = 0;

  milestones.forEach(milestone => {
    const milestoneTasks = allTasks.filter(t => t.milestone_id === milestone.id);
    const progress = calculateRoadmapProgress(milestone, milestoneTasks);
    totalRoadmaps += progress.totalRoadmaps;
    completedRoadmaps += progress.completedRoadmaps;
  });

  const percentage = totalRoadmaps > 0
    ? Math.round((completedRoadmaps / totalRoadmaps) * 100)
    : 0;

  return {
    completedRoadmaps,
    totalRoadmaps,
    percentage
  };
};

/**
 * Calculate time progress toward target date
 *
 * @param {string|Date} createdAt - When the dream was created
 * @param {string|Date} targetDate - Target completion date
 * @returns {Object} { daysElapsed, totalDays, percentage, daysRemaining }
 */
export const calculateTimeProgress = (createdAt, targetDate) => {
  if (!targetDate || !createdAt) {
    return { daysElapsed: 0, totalDays: 0, percentage: 0, daysRemaining: null };
  }

  const created = new Date(createdAt);
  const target = new Date(targetDate);
  const now = new Date();

  const totalDays = Math.max(1, Math.ceil((target - created) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  const percentage = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

  return {
    daysElapsed,
    totalDays,
    percentage,
    daysRemaining
  };
};

/**
 * Calculate budget progress
 *
 * @param {number} budgetAmount - Total budget allocated
 * @param {number} budgetSpent - Amount spent so far
 * @returns {Object} { spent, total, percentage, remaining }
 */
export const calculateBudgetProgress = (budgetAmount, budgetSpent = 0) => {
  if (!budgetAmount || budgetAmount <= 0) {
    return { spent: 0, total: 0, percentage: 0, remaining: 0 };
  }

  const percentage = Math.min(100, Math.round((budgetSpent / budgetAmount) * 100));
  const remaining = Math.max(0, budgetAmount - budgetSpent);

  return {
    spent: budgetSpent,
    total: budgetAmount,
    percentage,
    remaining
  };
};

/**
 * Calculate velocity score for a dream
 *
 * Velocity measures: "Are we progressing at the right pace to achieve
 * our dream by the target date?"
 *
 * Formula:
 * - progressDelta = roadmapProgress - timeProgress
 * - budgetAlignment = how well budget tracks with progress
 * - velocityScore = (progressDelta * 0.7) + (budgetAlignment * 0.3)
 *
 * @param {number} roadmapProgress - Percentage of roadmaps (phases) completed (0-100)
 * @param {number} timeProgress - Percentage of time elapsed (0-100)
 * @param {number} budgetProgress - Percentage of budget used (0-100)
 * @param {boolean} hasTargetDate - Whether a target date is set
 * @returns {Object} { score, label, progressDelta, budgetAlignment }
 */
export const calculateVelocity = (roadmapProgress, timeProgress, budgetProgress, hasTargetDate = true) => {
  // How far ahead/behind schedule are we?
  const progressDelta = roadmapProgress - timeProgress;

  // Is budget tracking with progress?
  const budgetAlignment = roadmapProgress > 0
    ? Math.min(100, (budgetProgress / roadmapProgress) * 100)
    : (budgetProgress > 0 ? 100 : 50); // Neutral if no progress yet

  // Calculate weighted velocity score
  let score;
  if (hasTargetDate) {
    score = (progressDelta * 0.7) + ((budgetAlignment - 50) * 0.3);
  } else {
    // No target date: just use progress relative to neutral (50%)
    score = roadmapProgress - 50;
  }

  // Determine label based on score
  let label;
  if (score >= VELOCITY_THRESHOLDS.EXCELLENT) {
    label = TERMINOLOGY.STATUS_EXCELLENT;
  } else if (score >= VELOCITY_THRESHOLDS.ON_TRACK) {
    label = TERMINOLOGY.STATUS_ON_TRACK;
  } else if (score >= VELOCITY_THRESHOLDS.NEEDS_ATTENTION) {
    label = TERMINOLOGY.STATUS_NEEDS_ATTENTION;
  } else {
    label = TERMINOLOGY.STATUS_AT_RISK;
  }

  return {
    score: Math.round(score * 10) / 10,
    label,
    progressDelta: Math.round(progressDelta),
    budgetAlignment: Math.round(budgetAlignment)
  };
};

/**
 * Calculate complete metrics for a dream
 *
 * @param {Object} dream - The dream object (from roadmaps table)
 * @param {Array} milestones - Milestones for this dream
 * @param {Array} tasks - All tasks for this dream
 * @returns {Object} Complete metrics for the dream
 */
export const calculateDreamMetrics = (dream, milestones = [], tasks = []) => {
  // Roadmap progress (from phases in deep_dive_data)
  const roadmapMetrics = calculateDreamRoadmapProgress(milestones, tasks);

  // Time progress
  const timeMetrics = calculateTimeProgress(dream.created_at, dream.target_date);

  // Budget progress
  const budgetMetrics = calculateBudgetProgress(dream.budget_amount, dream.budget_spent);

  // Task progress
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Velocity
  const velocity = calculateVelocity(
    roadmapMetrics.percentage,
    timeMetrics.percentage,
    budgetMetrics.percentage,
    !!dream.target_date
  );

  return {
    // Primary progress (based on roadmaps/phases)
    progress: roadmapMetrics.percentage,

    // Roadmap metrics (phases)
    totalRoadmaps: roadmapMetrics.totalRoadmaps,
    completedRoadmaps: roadmapMetrics.completedRoadmaps,
    roadmapProgress: roadmapMetrics.percentage,

    // Task metrics
    totalTasks,
    completedTasks,
    taskProgress: taskPercentage,

    // Time metrics
    timeProgress: timeMetrics.percentage,
    daysRemaining: timeMetrics.daysRemaining,

    // Budget metrics
    budgetProgress: budgetMetrics.percentage,
    budgetRemaining: budgetMetrics.remaining,

    // Velocity
    velocityScore: velocity.score,
    velocityLabel: velocity.label
  };
};

/**
 * Calculate aggregate stats across all dreams
 *
 * @param {Array} dreamsWithMetrics - Array of dreams with calculated metrics
 * @returns {Object} Aggregate statistics
 */
export const calculateAggregateStats = (dreamsWithMetrics = []) => {
  if (dreamsWithMetrics.length === 0) {
    return {
      totalRoadmaps: 0,
      completedRoadmaps: 0,
      openRoadmaps: 0,
      activeDreams: 0,
      overallVelocity: TERMINOLOGY.STATUS_ON_TRACK,
      budgetHealth: 0
    };
  }

  // Sum up all roadmaps (phases) across all dreams
  const totalRoadmaps = dreamsWithMetrics.reduce((sum, d) => sum + (d.totalRoadmaps || 0), 0);
  const completedRoadmaps = dreamsWithMetrics.reduce((sum, d) => sum + (d.completedRoadmaps || 0), 0);
  const openRoadmaps = totalRoadmaps - completedRoadmaps;

  // Average velocity score
  const avgVelocityScore = dreamsWithMetrics.reduce((sum, d) => sum + (d.velocityScore || 0), 0) / dreamsWithMetrics.length;

  // Determine overall velocity label
  let overallVelocity;
  if (avgVelocityScore >= VELOCITY_THRESHOLDS.EXCELLENT) {
    overallVelocity = TERMINOLOGY.STATUS_EXCELLENT;
  } else if (avgVelocityScore >= VELOCITY_THRESHOLDS.ON_TRACK) {
    overallVelocity = TERMINOLOGY.STATUS_ON_TRACK;
  } else if (avgVelocityScore >= VELOCITY_THRESHOLDS.NEEDS_ATTENTION) {
    overallVelocity = TERMINOLOGY.STATUS_NEEDS_ATTENTION;
  } else {
    overallVelocity = TERMINOLOGY.STATUS_AT_RISK;
  }

  // Average budget health
  const budgetHealth = Math.round(
    dreamsWithMetrics.reduce((sum, d) => sum + (d.budgetProgress || 0), 0) / dreamsWithMetrics.length
  );

  return {
    totalRoadmaps,
    completedRoadmaps,
    openRoadmaps,
    activeDreams: dreamsWithMetrics.length,
    overallVelocity,
    budgetHealth
  };
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get status color based on velocity label
 */
export const getVelocityColor = (label) => {
  switch (label) {
    case TERMINOLOGY.STATUS_EXCELLENT:
      return { bg: '#E8F5E9', text: '#2E7D32' };
    case TERMINOLOGY.STATUS_ON_TRACK:
      return { bg: '#E3F2FD', text: '#1565C0' };
    case TERMINOLOGY.STATUS_NEEDS_ATTENTION:
      return { bg: '#FFF3E0', text: '#E65100' };
    case TERMINOLOGY.STATUS_AT_RISK:
      return { bg: '#FFEBEE', text: '#C62828' };
    default:
      return { bg: '#F5F5F5', text: '#616161' };
  }
};

/**
 * Format progress for display
 */
export const formatProgress = (completed, total, noun = TERMINOLOGY.ROADMAPS) => {
  return `${completed}/${total} ${noun.toLowerCase()}`;
};

export default {
  TERMINOLOGY,
  SUBSCRIPTION,
  VELOCITY_THRESHOLDS,
  calculateRoadmapProgress,
  calculateDreamRoadmapProgress,
  calculateTimeProgress,
  calculateBudgetProgress,
  calculateVelocity,
  calculateDreamMetrics,
  calculateAggregateStats,
  getVelocityColor,
  formatProgress
};
