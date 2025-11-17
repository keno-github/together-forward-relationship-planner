/**
 * Navigation Helpers for Milestone Detail Pages
 *
 * Provides intelligent navigation logic:
 * - Determines which tabs to show based on goal type
 * - Generates smart alerts for dashboard
 * - Calculates milestone health metrics
 */

import {
  Target, Map, DollarSign, Brain, CheckSquare, Activity,
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
    description: 'High-level dashboard with key metrics'
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
  },
  {
    id: 'status',
    label: 'Status',
    icon: Activity,
    required: true,
    description: 'Overall progress and completion tracking'
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

  // Default: hide if no monetary indicators
  return false;
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
  if (!milestone) return {};

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const budgetUsedPercentage = milestone.budget_amount > 0
    ? Math.round((totalExpenses / milestone.budget_amount) * 100)
    : 0;

  let daysRemaining = null;
  if (milestone.target_date) {
    daysRemaining = Math.ceil(
      (new Date(milestone.target_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
  }

  // Calculate health score
  let healthScore = 100;

  // Penalize for low progress with approaching deadline
  if (progressPercentage < 50 && daysRemaining !== null && daysRemaining < 30) {
    healthScore -= 20;
  }

  // Penalize for budget issues
  if (budgetUsedPercentage > 100) {
    healthScore -= 30;
  } else if (budgetUsedPercentage > 90) {
    healthScore -= 10;
  }

  // Penalize for overdue
  if (daysRemaining !== null && daysRemaining < 0) {
    healthScore -= 40;
  }

  const onTrack = healthScore >= 70;

  return {
    progress_percentage: progressPercentage,
    completion_percentage: progressPercentage,
    health_score: Math.max(0, healthScore),
    budget_used_percentage: budgetUsedPercentage,
    tasks_completed: completedTasks,
    tasks_total: totalTasks,
    days_remaining: daysRemaining,
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
