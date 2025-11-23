/**
 * Advanced Goal Analysis Utilities
 *
 * Provides sophisticated analysis for goal orchestration:
 * - Timeline parsing and conflict detection
 * - Budget optimization algorithms
 * - Dependency graph generation
 * - Smart reordering suggestions
 */

// ═══════════════════════════════════════════════════════════════════════
// TIMELINE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Parse duration string to months
 * Examples: "12-18 months" -> 15, "1-3 months" -> 2, "6-9 months" -> 7.5
 */
export const parseDurationToMonths = (duration) => {
  if (!duration) return 12; // Default 12 months

  // Extract numbers from duration string
  const matches = duration.match(/(\d+)(?:\s*-\s*(\d+))?/);

  if (!matches) return 12;

  const min = parseInt(matches[1]);
  const max = matches[2] ? parseInt(matches[2]) : min;

  // Return average
  return (min + max) / 2;
};

/**
 * Detect timeline conflicts between goals
 */
export const detectTimelineConflicts = (goal1, goal2) => {
  const duration1 = parseDurationToMonths(goal1.duration);
  const duration2 = parseDurationToMonths(goal2.duration);

  // High-intensity goals that shouldn't overlap
  const highIntensityCategories = ['wedding', 'home', 'business', 'family'];

  const isHighIntensity1 = highIntensityCategories.includes(goal1.category);
  const isHighIntensity2 = highIntensityCategories.includes(goal2.category);

  if (isHighIntensity1 && isHighIntensity2) {
    // Both are high-intensity, recommend sequential
    return {
      hasConflict: true,
      severity: 'high',
      type: 'intensity',
      message: `${goal1.title} and ${goal2.title} are both high-intensity goals`,
      recommendation: `Consider scheduling ${goal2.title} after completing ${goal1.title} (add ${Math.round(duration1)} months)`,
      suggestedDelay: duration1
    };
  }

  // Check if timelines are too aggressive when combined
  const totalDuration = duration1 + duration2;
  const averageDuration = (duration1 + duration2) / 2;

  if (totalDuration > 36 && averageDuration > 18) {
    return {
      hasConflict: true,
      severity: 'medium',
      type: 'duration',
      message: 'Combined timeline is very long (3+ years)',
      recommendation: 'Consider breaking into phases or extending timelines',
      totalMonths: totalDuration
    };
  }

  return null;
};

/**
 * Generate optimal timeline sequence for goals
 */
export const generateOptimalTimeline = (goals) => {
  // Priority order (lower = earlier)
  const priorityMap = {
    'financial': 1,      // Foundation first
    'wedding': 2,        // Relationship milestone
    'relationship': 2,
    'home': 3,           // After financial stability
    'family': 4,         // After home
    'business': 5,       // After stability
    'creative': 6,
    'travel': 7,         // Flexible
    'health': 7,
    'learning': 7
  };

  // Sort goals by priority and dependencies
  const sequenced = goals.map((goal, index) => {
    const duration = parseDurationToMonths(goal.duration);
    const priority = priorityMap[goal.category] || 10;

    return {
      goal,
      priority,
      duration,
      originalIndex: index,
      startMonth: 0, // To be calculated
      endMonth: 0
    };
  }).sort((a, b) => a.priority - b.priority);

  // Calculate start/end months with spacing
  let currentMonth = 0;
  sequenced.forEach((item, index) => {
    if (index === 0) {
      item.startMonth = 0;
    } else {
      const prev = sequenced[index - 1];
      const prevCategory = prev.goal.category;
      const currentCategory = item.goal.category;

      // High-intensity goals should not overlap
      const highIntensity = ['wedding', 'home', 'business', 'family'];
      const prevIsHighIntensity = highIntensity.includes(prevCategory);
      const currentIsHighIntensity = highIntensity.includes(currentCategory);

      if (prevIsHighIntensity && currentIsHighIntensity) {
        // Wait for previous to complete
        item.startMonth = prev.endMonth + 1;
      } else if (prevIsHighIntensity || currentIsHighIntensity) {
        // Overlap by 50%
        item.startMonth = prev.startMonth + Math.round(prev.duration / 2);
      } else {
        // Low-intensity can run parallel
        item.startMonth = prev.startMonth;
      }
    }

    item.endMonth = item.startMonth + item.duration;
  });

  return sequenced;
};

// ═══════════════════════════════════════════════════════════════════════
// BUDGET OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Analyze budget distribution and suggest optimizations
 */
export const analyzeBudgetDistribution = (goals, totalAvailableBudget = null) => {
  const totalRequested = goals.reduce((sum, g) => sum + (g.estimatedCost || 0), 0);

  // Calculate per-goal metrics
  const goalsWithMetrics = goals.map(goal => {
    const cost = goal.estimatedCost || 0;
    const duration = parseDurationToMonths(goal.duration);
    const monthlyBurn = cost / duration;
    const percentage = (cost / totalRequested) * 100;

    return {
      goal,
      cost,
      duration,
      monthlyBurn,
      percentage,
      priority: getCategoryPriority(goal.category)
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Identify budget issues
  const issues = [];

  // Single goal taking too much budget
  goalsWithMetrics.forEach(item => {
    if (item.percentage > 60) {
      issues.push({
        type: 'concentration',
        severity: 'high',
        goalId: item.goal.id,
        message: `${item.goal.title} takes ${Math.round(item.percentage)}% of total budget`,
        recommendation: 'Consider reducing scope or phasing this goal over time'
      });
    }
  });

  // Budget exceeds available funds
  if (totalAvailableBudget && totalRequested > totalAvailableBudget) {
    const excess = totalRequested - totalAvailableBudget;
    const percentOver = ((excess / totalAvailableBudget) * 100).toFixed(0);

    issues.push({
      type: 'overspend',
      severity: 'critical',
      message: `Total budget exceeds available funds by €${excess.toLocaleString()} (${percentOver}% over)`,
      recommendation: generateBudgetCutRecommendations(goalsWithMetrics, excess)
    });
  }

  // High monthly burn rate
  const totalMonthlyBurn = goalsWithMetrics.reduce((sum, item) => sum + item.monthlyBurn, 0);
  if (totalMonthlyBurn > 5000) {
    issues.push({
      type: 'burnRate',
      severity: 'medium',
      message: `High monthly spending: €${Math.round(totalMonthlyBurn).toLocaleString()}/month`,
      recommendation: 'Consider extending timelines to reduce monthly financial pressure'
    });
  }

  return {
    totalRequested,
    totalAvailableBudget,
    goalsWithMetrics,
    issues,
    recommendations: generateBudgetOptimizations(goalsWithMetrics, totalRequested)
  };
};

/**
 * Generate budget cut recommendations
 */
const generateBudgetCutRecommendations = (goalsWithMetrics, excessAmount) => {
  const recommendations = [];

  // Start with lowest priority goals
  const sorted = [...goalsWithMetrics].sort((a, b) => b.priority - a.priority);

  let remaining = excessAmount;
  for (const item of sorted) {
    if (remaining <= 0) break;

    const cutAmount = Math.min(item.cost * 0.2, remaining); // Cut up to 20%
    recommendations.push({
      goalId: item.goal.id,
      goalTitle: item.goal.title,
      currentBudget: item.cost,
      suggestedBudget: item.cost - cutAmount,
      cutAmount,
      reason: `Lower priority (${item.goal.category})`
    });

    remaining -= cutAmount;
  }

  return recommendations;
};

/**
 * Generate budget optimization suggestions
 */
const generateBudgetOptimizations = (goalsWithMetrics, totalBudget) => {
  const optimizations = [];

  // Suggest reallocations
  const highCostGoals = goalsWithMetrics.filter(item => item.percentage > 40);
  const lowCostGoals = goalsWithMetrics.filter(item => item.percentage < 10 && item.cost > 0);

  if (highCostGoals.length > 0 && lowCostGoals.length > 0) {
    optimizations.push({
      type: 'reallocation',
      message: 'Balance budget across goals',
      actions: [
        `Reduce ${highCostGoals[0].goal.title} by 10-15%`,
        `Increase ${lowCostGoals[0].goal.title} budget for better execution`
      ]
    });
  }

  // Suggest phasing
  const expensiveGoals = goalsWithMetrics.filter(item => item.cost > 30000);
  if (expensiveGoals.length > 1) {
    optimizations.push({
      type: 'phasing',
      message: 'Phase expensive goals to reduce financial pressure',
      actions: expensiveGoals.map(item =>
        `Phase ${item.goal.title} over ${Math.round(item.duration * 1.5)} months instead of ${Math.round(item.duration)}`
      )
    });
  }

  return optimizations;
};

const getCategoryPriority = (category) => {
  const priorities = {
    'financial': 1,
    'family': 2,
    'home': 3,
    'wedding': 4,
    'relationship': 4,
    'business': 5,
    'health': 6,
    'learning': 7,
    'creative': 8,
    'travel': 9
  };
  return priorities[category] || 10;
};

// ═══════════════════════════════════════════════════════════════════════
// DEPENDENCY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build dependency graph for goals
 */
export const buildDependencyGraph = (goals) => {
  const graph = {
    nodes: [],
    edges: []
  };

  // Create nodes
  goals.forEach(goal => {
    graph.nodes.push({
      id: goal.id,
      title: goal.title,
      category: goal.category,
      cost: goal.estimatedCost,
      duration: parseDurationToMonths(goal.duration)
    });
  });

  // Detect dependencies based on common patterns
  goals.forEach((goal, i) => {
    goals.forEach((otherGoal, j) => {
      if (i === j) return;

      const dependency = detectDependency(goal, otherGoal);
      if (dependency) {
        graph.edges.push({
          from: otherGoal.id,  // Dependency (must come first)
          to: goal.id,          // Dependent (comes after)
          type: dependency.type,
          reason: dependency.reason,
          strength: dependency.strength
        });
      }
    });
  });

  return graph;
};

/**
 * Detect if goal depends on another goal
 */
const detectDependency = (dependentGoal, prerequisiteGoal) => {
  // Financial goals are prerequisites for expensive goals
  if (prerequisiteGoal.category === 'financial' && dependentGoal.estimatedCost > 30000) {
    return {
      type: 'financial',
      reason: 'Strong financial foundation needed',
      strength: 'high'
    };
  }

  // Wedding before family
  if (prerequisiteGoal.category === 'wedding' && dependentGoal.category === 'family') {
    return {
      type: 'logical',
      reason: 'Many couples marry before starting family',
      strength: 'medium'
    };
  }

  // Home before family
  if (prerequisiteGoal.category === 'home' && dependentGoal.category === 'family') {
    return {
      type: 'practical',
      reason: 'Home provides stability for family',
      strength: 'medium'
    };
  }

  // Financial before home
  if (prerequisiteGoal.category === 'financial' && dependentGoal.category === 'home') {
    return {
      type: 'financial',
      reason: 'Savings needed for down payment',
      strength: 'high'
    };
  }

  // Financial before business
  if (prerequisiteGoal.category === 'financial' && dependentGoal.category === 'business') {
    return {
      type: 'financial',
      reason: 'Capital required for business launch',
      strength: 'high'
    };
  }

  return null;
};

/**
 * Get topological sort of goals based on dependencies
 */
export const getOptimalGoalOrder = (goals, dependencyGraph) => {
  const inDegree = {};
  const adjList = {};

  // Initialize
  goals.forEach(goal => {
    inDegree[goal.id] = 0;
    adjList[goal.id] = [];
  });

  // Build adjacency list and in-degree
  dependencyGraph.edges.forEach(edge => {
    adjList[edge.from].push(edge.to);
    inDegree[edge.to]++;
  });

  // Topological sort (Kahn's algorithm)
  const queue = goals.filter(goal => inDegree[goal.id] === 0);
  const sorted = [];

  while (queue.length > 0) {
    // Sort queue by priority
    queue.sort((a, b) => getCategoryPriority(a.category) - getCategoryPriority(b.category));

    const current = queue.shift();
    sorted.push(current);

    adjList[current.id].forEach(neighborId => {
      inDegree[neighborId]--;
      if (inDegree[neighborId] === 0) {
        const neighbor = goals.find(g => g.id === neighborId);
        queue.push(neighbor);
      }
    });
  }

  return sorted;
};

// ═══════════════════════════════════════════════════════════════════════
// RISK ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Identify risks in goal combination
 */
export const analyzeRisks = (goals) => {
  const risks = [];

  const totalBudget = goals.reduce((sum, g) => sum + (g.estimatedCost || 0), 0);
  const timeline = generateOptimalTimeline(goals);
  const maxEndMonth = Math.max(...timeline.map(t => t.endMonth));

  // Budget risk
  if (totalBudget > 100000) {
    risks.push({
      type: 'financial',
      severity: 'high',
      title: 'High Financial Commitment',
      message: `Total budget of €${totalBudget.toLocaleString()} requires strong financial planning`,
      mitigation: [
        'Create detailed savings plan',
        'Consider loan options if needed',
        'Build emergency fund (6 months expenses)',
        'Phase goals to reduce concurrent spending'
      ]
    });
  }

  // Timeline risk
  if (maxEndMonth > 36) {
    risks.push({
      type: 'timeline',
      severity: 'medium',
      title: 'Extended Timeline',
      message: `Goals span ${Math.round(maxEndMonth)} months (${(maxEndMonth / 12).toFixed(1)} years)`,
      mitigation: [
        'Set quarterly milestones to maintain momentum',
        'Regular progress reviews',
        'Be prepared for life changes during journey'
      ]
    });
  }

  // Complexity risk
  if (goals.length > 3) {
    risks.push({
      type: 'complexity',
      severity: 'medium',
      title: 'Managing Multiple Goals',
      message: `Coordinating ${goals.length} goals requires strong organization`,
      mitigation: [
        'Use project management tools',
        'Assign clear owners for each goal',
        'Regular sync meetings',
        'Prioritize ruthlessly'
      ]
    });
  }

  return risks;
};

export default {
  parseDurationToMonths,
  detectTimelineConflicts,
  generateOptimalTimeline,
  analyzeBudgetDistribution,
  buildDependencyGraph,
  getOptimalGoalOrder,
  analyzeRisks
};
