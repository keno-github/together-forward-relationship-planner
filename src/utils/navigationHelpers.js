/**
 * Navigation Helpers for Milestone Detail Pages
 *
 * Provides intelligent navigation logic:
 * - Determines which tabs to show based on goal type
 * - Generates smart alerts for dashboard
 * - Calculates milestone health metrics
 */

import {
  Target, Map, DollarSign, Brain, CheckSquare,
  AlertTriangle, Clock, TrendingUp, AlertCircle
} from 'lucide-react';

/**
 * All available navigation tabs
 */
const ALL_NAVIGATION_TABS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Target,
    required: true,
    description: 'Dream summary, budget, and key metrics'
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    icon: Map,
    required: true,
    description: 'Detailed action steps and timeline'
  },
  {
    id: 'budget',
    label: 'Budget',
    icon: DollarSign,
    required: false,
    description: 'Financial tracking and expense management'
  },
  {
    id: 'assessment',
    label: 'Assessment',
    icon: Brain,
    required: true,
    description: 'Luna\'s confidence score and insights'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    required: true,
    description: 'Assign and track tasks between partners'
  }
];

/**
 * Goal types that typically involve monetary components
 */
const MONETARY_GOAL_TYPES = [
  'wedding',
  'engagement',
  'home',
  'renovation',
  'travel',
  'vacation',
  'education',
  'baby',
  'business',
  'investment',
  'car',
  'debt_payoff',
  'relocation',
  'moving'
];

/**
 * Goal types that typically do NOT involve monetary components
 */
const NON_MONETARY_GOAL_TYPES = [
  'health',
  'fitness',
  'habit',
  'relationship',
  'personal_development',
  'hobby',
  'skill_learning',
  'social'
];

/**
 * Determines which navigation tabs should be visible for a milestone
 *
 * @param {Object} milestone - The milestone object
 * @returns {Array} Array of visible tab objects
 */
export const getVisibleNavigationTabs = (milestone) => {
  if (!milestone) return ALL_NAVIGATION_TABS.filter(tab => tab.required);

  return ALL_NAVIGATION_TABS.filter(tab => {
    // Always show required tabs
    if (tab.required) return true;

    // Handle optional tabs
    if (tab.id === 'budget') {
      return shouldShowBudgetTab(milestone);
    }

    return true;
  });
};

/**
 * Determines if Budget tab should be shown for a milestone
 *
 * Logic:
 * 1. Show if explicit budget is set (budget_amount > 0)
 * 2. Show if goal_type is in monetary categories
 * 3. Hide if goal_type is explicitly non-monetary
 * 4. Default: show if category is 'financial'
 *
 * @param {Object} milestone - The milestone object
 * @returns {Boolean} Whether to show budget tab
 */
export const shouldShowBudgetTab = (milestone) => {
  if (!milestone) return false;

  // Priority 1: Explicit budget amount
  if (milestone.budget_amount && milestone.budget_amount > 0) {
    return true;
  }

  // Priority 2: Check goal_type
  if (milestone.goal_type) {
    // Show for monetary goal types
    if (MONETARY_GOAL_TYPES.includes(milestone.goal_type.toLowerCase())) {
      return true;
    }

    // Hide for non-monetary goal types
    if (NON_MONETARY_GOAL_TYPES.includes(milestone.goal_type.toLowerCase())) {
      return false;
    }
  }

  // Priority 3: Check estimated_cost
  if (milestone.estimated_cost && milestone.estimated_cost > 0) {
    return true;
  }

  // Priority 4: Check category
  if (milestone.category === 'financial') {
    return true;
  }

  // Default: Always show budget tab - user can set budget anytime
  return true;
};

/**
 * Generates smart alerts for dashboard based on milestone state
 *
 * @param {Object} milestone - The milestone object
 * @param {Array} expenses - Array of expense objects (optional)
 * @param {Array} tasks - Array of task objects (optional)
 * @returns {Array} Array of alert objects
 */
export const generateSmartAlerts = (milestone, expenses = [], tasks = []) => {
  const alerts = [];

  if (!milestone) return alerts;

  // BUDGET ALERTS
  if (shouldShowBudgetTab(milestone) && milestone.budget_amount > 0) {
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const budgetUsed = (totalExpenses / milestone.budget_amount) * 100;
    const budgetRemaining = milestone.budget_amount - totalExpenses;

    if (budgetUsed > 100) {
      alerts.push({
        type: 'budget',
        severity: 'critical',
        message: `Over budget by €${Math.abs(budgetRemaining).toLocaleString()}`,
        icon: 'AlertTriangle',
        action: 'Review budget allocation'
      });
    } else if (budgetUsed > 90) {
      alerts.push({
        type: 'budget',
        severity: 'warning',
        message: `${budgetUsed.toFixed(0)}% of budget used (€${budgetRemaining.toLocaleString()} left)`,
        icon: 'AlertCircle',
        action: 'Monitor remaining expenses closely'
      });
    } else if (budgetUsed < 50 && expenses.length > 5) {
      // Positive alert - under budget
      alerts.push({
        type: 'budget',
        severity: 'info',
        message: `Great! You're €${budgetRemaining.toLocaleString()} under budget`,
        icon: 'TrendingUp',
        action: 'Consider allocating surplus wisely'
      });
    }
  }

  // DEADLINE ALERTS
  if (milestone.target_date) {
    const targetDate = new Date(milestone.target_date);
    const today = new Date();
    const daysUntil = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      alerts.push({
        type: 'deadline',
        severity: 'critical',
        message: `${Math.abs(daysUntil)} days overdue`,
        icon: 'Clock',
        action: 'Update target date or accelerate progress'
      });
    } else if (daysUntil === 0) {
      alerts.push({
        type: 'deadline',
        severity: 'critical',
        message: 'Due today!',
        icon: 'Clock',
        action: 'Final push to complete remaining tasks'
      });
    } else if (daysUntil <= 7) {
      alerts.push({
        type: 'deadline',
        severity: 'warning',
        message: `Only ${daysUntil} day${daysUntil === 1 ? '' : 's'} remaining`,
        icon: 'Clock',
        action: 'Prioritize critical tasks'
      });
    } else if (daysUntil <= 30) {
      alerts.push({
        type: 'deadline',
        severity: 'info',
        message: `${daysUntil} days until target date`,
        icon: 'Clock',
        action: 'Stay on track'
      });
    }
  }

  // TASK ALERTS
  if (tasks && tasks.length > 0) {
    const overdueTasks = tasks.filter(t =>
      !t.completed && t.due_date && new Date(t.due_date) < new Date()
    );

    const upcomingTasks = tasks.filter(t => {
      if (t.completed || !t.due_date) return false;
      const daysUntilDue = Math.ceil((new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue >= 0;
    });

    if (overdueTasks.length > 0) {
      alerts.push({
        type: 'task',
        severity: 'warning',
        message: `${overdueTasks.length} task${overdueTasks.length === 1 ? '' : 's'} overdue`,
        icon: 'CheckSquare',
        action: 'Complete or reschedule overdue tasks'
      });
    }

    if (upcomingTasks.length > 0) {
      alerts.push({
        type: 'task',
        severity: 'info',
        message: `${upcomingTasks.length} task${upcomingTasks.length === 1 ? '' : 's'} due in next 3 days`,
        icon: 'CheckSquare',
        action: 'Complete upcoming tasks'
      });
    }

    // Check for unassigned tasks
    const unassignedTasks = tasks.filter(t => !t.completed && !t.assigned_to);
    if (unassignedTasks.length > 0) {
      alerts.push({
        type: 'task',
        severity: 'info',
        message: `${unassignedTasks.length} task${unassignedTasks.length === 1 ? '' : 's'} not assigned`,
        icon: 'CheckSquare',
        action: 'Assign tasks to partners'
      });
    }
  }

  // PROGRESS ALERTS
  const metrics = milestone.milestone_metrics || {};
  if (metrics.health_score !== undefined) {
    if (metrics.health_score < 50) {
      alerts.push({
        type: 'progress',
        severity: 'critical',
        message: 'Milestone health is poor - review and adjust plan',
        icon: 'AlertTriangle',
        action: 'Review roadmap and adjust timeline or budget'
      });
    } else if (metrics.health_score < 70) {
      alerts.push({
        type: 'progress',
        severity: 'warning',
        message: 'Milestone progress needs attention',
        icon: 'AlertCircle',
        action: 'Focus on high-priority tasks'
      });
    }
  }

  return alerts;
};

/**
 * Calculates client-side milestone metrics
 * (Supplements database-calculated metrics)
 *
 * @param {Object} milestone - The milestone object
 * @param {Array} tasks - Array of task objects
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} Calculated metrics object
 */
export const calculateClientMetrics = (milestone, tasks = [], expenses = []) => {
  // CRITICAL: Return default metrics instead of empty object to prevent blank page
  if (!milestone) {
    return {
      tasks_completed: 0,
      tasks_total: 0,
      progress_percentage: 0,
      completion_percentage: 0,
      health_score: 50,
      budget_used_percentage: 0,
      days_remaining: null,
      time_elapsed_percentage: 0,
      on_track: true,
      budget_amount: 0
    };
  }

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  // Progress calculation:
  // 1. If milestone is manually marked complete, progress is 100%
  // 2. If there are roadmap phases, calculate from phase completion
  // 3. If there are tasks (without phases), calculate from task completion
  // 4. If no tasks and no phases, progress is 0%
  let progressPercentage;
  if (milestone.completed) {
    // Milestone manually marked as complete - show 100%
    progressPercentage = 100;
  } else {
    // Check for phases in deep_dive_data
    const deepDive = milestone.deepDiveData || milestone.deep_dive_data;
    const roadmapPhases = deepDive?.roadmapPhases;

    if (roadmapPhases && roadmapPhases.length > 0) {
      // Calculate progress based on phases (each phase has equal weight)
      let completedPhases = 0;
      roadmapPhases.forEach((phase, phaseIndex) => {
        if (phase.completed) {
          // Phase manually marked complete
          completedPhases++;
        } else {
          // Check if all tasks for this phase are completed
          const phaseTasks = tasks.filter(t => t.roadmap_phase_index === phaseIndex);
          if (phaseTasks.length > 0 && phaseTasks.every(t => t.completed)) {
            completedPhases++;
          }
        }
      });
      progressPercentage = Math.round((completedPhases / roadmapPhases.length) * 100);
    } else if (totalTasks > 0) {
      // Fall back to task-based calculation when no phases
      progressPercentage = Math.round((completedTasks / totalTasks) * 100);
    } else {
      // No tasks and no phases - show 0%
      progressPercentage = 0;
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const budgetUsedPercentage = milestone.budget_amount > 0
    ? Math.round((totalExpenses / milestone.budget_amount) * 100)
    : 0;

  let daysRemaining = null;
  let totalDuration = null;
  let timeElapsedPercentage = 0;

  if (milestone.target_date) {
    const targetDate = new Date(milestone.target_date);
    const createdDate = new Date(milestone.created_at || Date.now());
    const now = new Date();

    daysRemaining = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
    totalDuration = Math.ceil((targetDate - createdDate) / (1000 * 60 * 60 * 24));
    const timeElapsed = Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24));

    if (totalDuration > 0) {
      timeElapsedPercentage = Math.min(100, Math.round((timeElapsed / totalDuration) * 100));
    }
  }

  /**
   * IMPROVED HEALTH SCORE CALCULATION
   * Weighted components (0-100 scale):
   * - Progress Score: 50% weight (task completion + roadmap phases)
   * - Timeline Score: 30% weight (progress vs. time)
   * - Budget Score: 15% weight (spending efficiency)
   * - Activity Score: 5% weight (recent engagement)
   */

  let healthScore = 0;

  // 1. PROGRESS SCORE (50 points max)
  // Directly from task completion
  const progressScore = progressPercentage * 0.5;

  // 2. TIMELINE SCORE (30 points max)
  let timelineScore = 0;

  if (!milestone.target_date) {
    // No target date set: neutral score
    timelineScore = 15;
  } else if (daysRemaining < 0) {
    // Overdue: 0 points
    timelineScore = 0;
  } else {
    // Compare progress vs. time elapsed
    const progressGap = progressPercentage - timeElapsedPercentage;

    if (progressGap >= 10) {
      // Ahead of schedule
      timelineScore = 30;
    } else if (progressGap >= 0) {
      // On schedule
      timelineScore = 25;
    } else if (progressGap >= -15) {
      // Slightly behind
      timelineScore = 15;
    } else if (progressGap >= -30) {
      // Behind
      timelineScore = 8;
    } else {
      // Significantly behind
      timelineScore = 3;
    }
  }

  // 3. BUDGET SCORE (15 points max)
  let budgetScore = 0;

  if (!milestone.budget_amount || milestone.budget_amount === 0) {
    // No budget set: neutral score
    budgetScore = 8;
  } else if (budgetUsedPercentage > 100) {
    // Over budget: 0 points
    budgetScore = 0;
  } else {
    // Compare budget used vs. progress
    const budgetEfficiency = progressPercentage - budgetUsedPercentage;

    if (budgetEfficiency >= 10) {
      // Spending less than progress (excellent!)
      budgetScore = 15;
    } else if (budgetEfficiency >= 0) {
      // Balanced spending
      budgetScore = 12;
    } else if (budgetEfficiency >= -15) {
      // Spending slightly more than progress
      budgetScore = 8;
    } else if (budgetEfficiency >= -30) {
      // Overspending
      budgetScore = 4;
    } else {
      // Significant overspending
      budgetScore = 1;
    }
  }

  // 4. ACTIVITY SCORE (5 points max)
  let activityScore = 0;

  if (totalTasks === 0) {
    // New milestone, no tasks yet: neutral
    activityScore = 3;
  } else {
    // Check for recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTasks = tasks.filter(t => {
      const completedAt = t.completed_at ? new Date(t.completed_at) : null;
      const createdAt = t.created_at ? new Date(t.created_at) : null;

      return (completedAt && completedAt > sevenDaysAgo) ||
             (createdAt && createdAt > sevenDaysAgo);
    });

    if (recentTasks.length > 0) {
      activityScore = 5;
    } else {
      // Stalled (no activity in 7 days)
      activityScore = 0;
    }
  }

  // TOTAL HEALTH SCORE
  healthScore = Math.round(progressScore + timelineScore + budgetScore + activityScore);
  healthScore = Math.max(0, Math.min(100, healthScore)); // Clamp to 0-100

  const onTrack = healthScore >= 70;

  return {
    progress_percentage: progressPercentage,
    completion_percentage: progressPercentage,
    health_score: healthScore,
    health_breakdown: {
      progress: Math.round(progressScore),
      timeline: timelineScore,
      budget: budgetScore,
      activity: activityScore
    },
    budget_used_percentage: budgetUsedPercentage,
    tasks_completed: completedTasks,
    tasks_total: totalTasks,
    days_remaining: daysRemaining,
    time_elapsed_percentage: timeElapsedPercentage,
    on_track: onTrack,
    last_calculated: new Date().toISOString()
  };
};

/**
 * Get health status label and color based on health score
 *
 * @param {Number} healthScore - Health score (0-100)
 * @returns {Object} {label, color, icon}
 */
export const getHealthStatus = (healthScore) => {
  // Handle null/undefined - return neutral status
  if (healthScore === null || healthScore === undefined) {
    return {
      label: 'Getting Started',
      color: 'gray',
      colorClass: 'text-gray-600 bg-gray-100',
      icon: 'Activity',
      message: 'Begin your journey!'
    };
  }

  if (healthScore >= 80) {
    return {
      label: 'Excellent',
      color: 'green',
      colorClass: 'text-green-600 bg-green-100',
      icon: 'TrendingUp',
      message: 'Everything is on track!'
    };
  } else if (healthScore >= 70) {
    return {
      label: 'Good',
      color: 'blue',
      colorClass: 'text-blue-600 bg-blue-100',
      icon: 'CheckCircle',
      message: 'Progressing well'
    };
  } else if (healthScore >= 50) {
    return {
      label: 'Fair',
      color: 'yellow',
      colorClass: 'text-yellow-600 bg-yellow-100',
      icon: 'AlertCircle',
      message: 'Needs attention'
    };
  } else {
    return {
      label: 'At Risk',
      color: 'red',
      colorClass: 'text-red-600 bg-red-100',
      icon: 'AlertTriangle',
      message: 'Requires immediate action'
    };
  }
};

/**
 * Format currency for display
 *
 * @param {Number} amount - Amount to format
 * @param {String} currency - Currency symbol (default: '€')
 * @returns {String} Formatted currency string
 */
export const formatCurrency = (amount, currency = '€') => {
  if (amount === null || amount === undefined) return '—';
  return `${currency}${amount.toLocaleString()}`;
};

/**
 * Format days remaining into human-readable string
 *
 * @param {Number} days - Number of days
 * @returns {String} Formatted string
 */
export const formatDaysRemaining = (days) => {
  if (days === null || days === undefined) return '—';

  if (days < 0) {
    return `${Math.abs(days)} days overdue`;
  } else if (days === 0) {
    return 'Due today';
  } else if (days === 1) {
    return '1 day';
  } else if (days <= 7) {
    return `${days} days`;
  } else if (days <= 30) {
    return `${Math.round(days / 7)} weeks`;
  } else {
    return `${Math.round(days / 30)} months`;
  }
};

/**
 * Get priority color class based on priority level
 *
 * @param {String} priority - Priority level (critical, high, medium, low)
 * @returns {String} Tailwind color classes
 */
export const getPriorityColor = (priority) => {
  const priorityMap = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return priorityMap[priority?.toLowerCase()] || priorityMap.medium;
};

export default {
  getVisibleNavigationTabs,
  shouldShowBudgetTab,
  generateSmartAlerts,
  calculateClientMetrics,
  getHealthStatus,
  formatCurrency,
  formatDaysRemaining,
  getPriorityColor,
  MONETARY_GOAL_TYPES,
  NON_MONETARY_GOAL_TYPES
};
