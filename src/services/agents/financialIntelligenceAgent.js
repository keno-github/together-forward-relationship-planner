/**
 * Financial Intelligence Agent
 *
 * Tracks expenses, monitors savings progress, and provides intelligent
 * financial insights for roadmap goals. Helps couples stay on budget
 * and achieve their financial targets.
 *
 * Key Capabilities:
 * - Expense categorization and tracking
 * - Savings progress monitoring
 * - Budget deviation detection
 * - Financial projections and forecasting
 * - Savings strategy recommendations
 * - Budget optimization suggestions
 */

/**
 * Analyzes savings progress toward a goal
 * @param {Object} goal - Goal details (target amount, target date)
 * @param {Object} currentStatus - Current savings status
 * @returns {Object} Progress analysis and projections
 */
export const analyzeSavingsProgress = (goal, currentStatus) => {
  const { targetAmount, targetDate, currentAmount = 0, monthlyContribution = 0 } = {
    ...goal,
    ...currentStatus
  };

  const today = new Date();
  const target = new Date(targetDate);
  const monthsRemaining = Math.max(0, (target - today) / (1000 * 60 * 60 * 24 * 30));

  const remainingAmount = targetAmount - currentAmount;
  const progressPercentage = (currentAmount / targetAmount) * 100;

  // Calculate required monthly savings
  const requiredMonthlySavings = monthsRemaining > 0
    ? remainingAmount / monthsRemaining
    : 0;

  // Calculate projected completion date (based on current rate)
  let projectedDate = null;
  let projectedMonths = 0;

  if (monthlyContribution > 0 && remainingAmount > 0) {
    projectedMonths = Math.ceil(remainingAmount / monthlyContribution);
    projectedDate = new Date(today);
    projectedDate.setMonth(projectedDate.getMonth() + projectedMonths);
  }

  // Determine if on track
  const isOnTrack = monthlyContribution >= requiredMonthlySavings;

  // Calculate gap
  const monthlyGap = requiredMonthlySavings - monthlyContribution;

  return {
    progress: {
      currentAmount,
      targetAmount,
      remainingAmount,
      progressPercentage: progressPercentage.toFixed(1),
      isOnTrack
    },
    timeline: {
      targetDate,
      monthsRemaining: monthsRemaining.toFixed(1),
      projectedDate,
      projectedMonths,
      behindSchedule: projectedDate && projectedDate > target
    },
    savings: {
      currentMonthly: monthlyContribution,
      requiredMonthly: requiredMonthlySavings.toFixed(2),
      gap: monthlyGap.toFixed(2),
      needsAdjustment: monthlyGap > 0
    },
    recommendations: generateSavingsRecommendations({
      monthlyGap,
      remainingAmount,
      monthsRemaining,
      progressPercentage
    })
  };
};

/**
 * Generates savings strategy recommendations
 * @param {Object} context - Financial context
 * @returns {Array} Array of recommendations
 */
const generateSavingsRecommendations = (context) => {
  const { monthlyGap, remainingAmount, monthsRemaining, progressPercentage } = context;
  const recommendations = [];

  if (progressPercentage < 25 && monthsRemaining < 6) {
    recommendations.push({
      priority: 'high',
      category: 'urgent',
      title: 'Increase Monthly Savings',
      message: `You're behind schedule. Consider increasing monthly savings by $${Math.abs(monthlyGap).toFixed(2)} to stay on track.`,
      actionable: true
    });
  }

  if (monthlyGap > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'savings',
      title: 'Budget Review Needed',
      message: 'Review your budget to find areas where you can save more. Small cuts in discretionary spending can make a big difference.',
      tips: [
        'Reduce dining out by 1-2 meals per week',
        'Cancel unused subscriptions',
        'Shop with a list to avoid impulse purchases'
      ]
    });
  }

  if (progressPercentage > 75) {
    recommendations.push({
      priority: 'low',
      category: 'success',
      title: 'Great Progress!',
      message: `You're ${progressPercentage.toFixed(1)}% toward your goal. Keep up the great work!`,
      celebration: true
    });
  }

  if (remainingAmount < 1000 && progressPercentage < 100) {
    recommendations.push({
      priority: 'medium',
      category: 'milestone',
      title: 'Almost There!',
      message: `Only $${remainingAmount.toFixed(2)} to go! Consider a one-time push to reach your goal faster.`,
      actionable: true
    });
  }

  return recommendations;
};

/**
 * Tracks and categorizes an expense
 * @param {Object} expense - Expense details
 * @param {Object} budget - Budget allocation
 * @returns {Object} Expense analysis and categorization
 */
export const trackExpense = (expense, budget) => {
  const { amount, title, category, date } = expense;

  // Auto-categorize if not provided
  const detectedCategory = category || detectCategory(title);

  // Check against budget
  const budgetStatus = checkBudgetStatus(detectedCategory, amount, budget);

  // Detect anomalies
  const anomalies = detectAnomalies(expense, budget);

  return {
    expense: {
      ...expense,
      category: detectedCategory,
      recordedAt: new Date().toISOString()
    },
    budgetStatus,
    anomalies,
    alerts: generateExpenseAlerts(budgetStatus, anomalies)
  };
};

/**
 * Auto-detects expense category from title/description
 * @param {string} title - Expense title
 * @returns {string} Detected category
 */
export const detectCategory = (title) => {
  const categoryKeywords = {
    venue: ['venue', 'hall', 'location', 'space', 'church', 'temple'],
    catering: ['catering', 'food', 'meal', 'dinner', 'lunch', 'cake', 'dessert'],
    photography: ['photo', 'video', 'photographer', 'videographer', 'camera'],
    attire: ['dress', 'tux', 'suit', 'attire', 'clothing', 'tailor'],
    flowers: ['flowers', 'florist', 'bouquet', 'centerpiece', 'floral'],
    music: ['dj', 'band', 'music', 'entertainment', 'sound'],
    invitations: ['invitation', 'card', 'print', 'stationery', 'rsvp'],
    decorations: ['decor', 'decoration', 'lighting', 'rental', 'linen'],
    transportation: ['transport', 'car', 'limo', 'shuttle', 'ride'],
    jewelry: ['ring', 'jewelry', 'diamond', 'gold', 'bracelet'],
    other: ['misc', 'other', 'various', 'additional']
  };

  const lowerTitle = title.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category;
    }
  }

  return 'other';
};

/**
 * Checks expense against budget
 * @param {string} category - Expense category
 * @param {number} amount - Expense amount
 * @param {Object} budget - Budget allocation
 * @returns {Object} Budget status
 */
const checkBudgetStatus = (category, amount, budget) => {
  if (!budget || !budget[category]) {
    return {
      status: 'unknown',
      message: 'No budget set for this category'
    };
  }

  const categoryBudget = budget[category];
  const spent = categoryBudget.spent || 0;
  const newTotal = spent + amount;
  const remaining = categoryBudget.allocated - newTotal;
  const percentUsed = (newTotal / categoryBudget.allocated) * 100;

  let status = 'within_budget';
  let severity = 'low';

  if (percentUsed > 100) {
    status = 'over_budget';
    severity = 'high';
  } else if (percentUsed > 90) {
    status = 'near_limit';
    severity = 'medium';
  } else if (percentUsed > 75) {
    status = 'warning';
    severity = 'low';
  }

  return {
    status,
    severity,
    category,
    allocated: categoryBudget.allocated,
    spent: newTotal,
    remaining,
    percentUsed: percentUsed.toFixed(1)
  };
};

/**
 * Detects spending anomalies
 * @param {Object} expense - Current expense
 * @param {Object} budget - Budget and history
 * @returns {Array} Detected anomalies
 */
const detectAnomalies = (expense, budget) => {
  const anomalies = [];

  // Check for unusually large expense
  if (budget.totalBudget && expense.amount > budget.totalBudget * 0.2) {
    anomalies.push({
      type: 'large_expense',
      severity: 'high',
      message: `This expense is more than 20% of your total budget. Double-check if this is correct.`
    });
  }

  // Check for duplicate expenses (same title, similar amount, same day)
  // This would require expense history - placeholder for now

  // Check for round numbers (might indicate estimates rather than actual costs)
  if (expense.amount % 100 === 0 && expense.amount >= 500) {
    anomalies.push({
      type: 'round_number',
      severity: 'low',
      message: 'This looks like an estimate. Remember to update with the actual cost.'
    });
  }

  return anomalies;
};

/**
 * Generates alerts based on budget status and anomalies
 * @param {Object} budgetStatus - Budget status
 * @param {Array} anomalies - Detected anomalies
 * @returns {Array} Alerts
 */
const generateExpenseAlerts = (budgetStatus, anomalies) => {
  const alerts = [];

  if (budgetStatus.status === 'over_budget') {
    alerts.push({
      type: 'budget_exceeded',
      severity: 'high',
      message: `You've exceeded your ${budgetStatus.category} budget by $${Math.abs(budgetStatus.remaining).toFixed(2)}. Consider reallocating funds or adjusting other categories.`
    });
  } else if (budgetStatus.status === 'near_limit') {
    alerts.push({
      type: 'budget_warning',
      severity: 'medium',
      message: `You're at ${budgetStatus.percentUsed}% of your ${budgetStatus.category} budget. Only $${budgetStatus.remaining.toFixed(2)} remaining.`
    });
  }

  // Add anomaly alerts
  anomalies.forEach(anomaly => {
    alerts.push({
      type: anomaly.type,
      severity: anomaly.severity,
      message: anomaly.message
    });
  });

  return alerts;
};

/**
 * Optimizes budget allocation based on spending patterns
 * @param {Object} currentBudget - Current budget allocation
 * @param {Object} spendingHistory - Historical spending data
 * @returns {Object} Optimized budget suggestions
 */
export const optimizeBudget = (currentBudget, spendingHistory) => {
  const suggestions = [];
  const reallocationPlan = {};

  Object.entries(currentBudget).forEach(([category, allocation]) => {
    const spent = allocation.spent || 0;
    const allocated = allocation.allocated;
    const percentUsed = (spent / allocated) * 100;

    // Under-allocated categories
    if (percentUsed > 95) {
      suggestions.push({
        category,
        type: 'increase',
        current: allocated,
        suggested: allocated * 1.15,
        reason: `${category} is consistently at capacity. Consider increasing allocation by 15%.`
      });
    }

    // Over-allocated categories
    if (percentUsed < 50 && spent > 0) {
      suggestions.push({
        category,
        type: 'decrease',
        current: allocated,
        suggested: spent * 1.2,
        reason: `${category} is under-utilized. You could reallocate ${(allocated - spent).toFixed(2)} to other categories.`
      });

      reallocationPlan[category] = allocated - (spent * 1.2);
    }
  });

  return {
    suggestions,
    reallocationPlan,
    potentialSavings: Object.values(reallocationPlan).reduce((a, b) => a + b, 0)
  };
};

/**
 * Projects final cost based on current spending
 * @param {Object} roadmap - Roadmap with milestones
 * @param {Object} currentSpending - Current spending by milestone
 * @returns {Object} Cost projection
 */
export const projectFinalCost = (roadmap, currentSpending) => {
  let projectedTotal = 0;
  const projectionsByMilestone = {};

  roadmap.milestones.forEach(milestone => {
    const spent = currentSpending[milestone.id] || 0;
    const estimated = milestone.estimated_cost || 0;
    const progress = milestone.progress || 0;

    let projected = estimated;

    if (progress > 0 && progress < 100) {
      // Project based on current spending rate
      projected = (spent / progress) * 100;
    } else if (progress === 100) {
      projected = spent;
    }

    projectionsByMilestone[milestone.id] = {
      estimated,
      spent,
      projected,
      variance: projected - estimated,
      variancePercent: ((projected - estimated) / estimated * 100).toFixed(1)
    };

    projectedTotal += projected;
  });

  const totalEstimated = roadmap.milestones.reduce((sum, m) => sum + (m.estimated_cost || 0), 0);

  return {
    totalEstimated,
    totalSpent: Object.values(currentSpending).reduce((a, b) => a + b, 0),
    projectedTotal,
    projectionsByMilestone,
    overUnder: projectedTotal - totalEstimated,
    onBudget: Math.abs(projectedTotal - totalEstimated) < totalEstimated * 0.1
  };
};

export default {
  analyzeSavingsProgress,
  trackExpense,
  optimizeBudget,
  projectFinalCost,
  detectCategory
};
