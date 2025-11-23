/**
 * Goal Optimization Agent
 *
 * Specialized agent for Luna to optimize multi-goal roadmaps
 *
 * Features:
 * - Rich context about all goals, conflicts, synergies, dependencies
 * - Smart questioning to understand priorities
 * - Budget allocation optimization
 * - Timeline sequencing
 * - Interconnected milestone generation
 * - Deep-dive insights for each goal
 */

/**
 * Build rich context for Luna about the goal basket
 */
export const buildOptimizationContext = (orchestrator, userData = {}) => {
  const goals = orchestrator.getGoals();
  const stats = orchestrator.getStats();

  // Build comprehensive context
  const context = {
    // User information
    user: {
      partner1: userData.partner1 || 'Partner 1',
      partner2: userData.partner2 || 'Partner 2',
      location: userData.location || 'Unknown',
      locationData: userData.locationData
    },

    // Goals overview
    goals: goals.map((goal, index) => ({
      id: goal.id,
      number: index + 1,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      estimatedCost: goal.estimatedCost,
      duration: goal.duration,
      source: goal.source,
      customDetails: goal.customDetails,
      aiAnalysis: goal.aiAnalysis
    })),

    // Intelligence analysis
    analysis: {
      totalBudget: stats.totalBudget,
      totalGoals: stats.totalGoals,
      totalDuration: stats.totalDuration,

      // Conflicts detected
      conflicts: stats.conflicts,
      conflictCount: stats.conflicts.length,

      // Synergies found
      synergies: stats.synergies,
      synergyCount: stats.synergies.length,

      // Budget analysis
      budgetAnalysis: stats.budgetAnalysis,
      budgetIssues: stats.budgetAnalysis?.issues || [],
      budgetRecommendations: stats.budgetAnalysis?.recommendations || [],

      // Timeline
      timeline: stats.timeline,
      maxEndMonth: stats.metrics?.maxEndMonth || 0,

      // Dependencies
      dependencyGraph: stats.dependencyGraph,
      totalDependencies: stats.metrics?.totalDependencies || 0,

      // Risks
      risks: stats.risks,
      riskLevel: stats.metrics?.riskLevel || 'low',

      // Optimal order
      optimalOrder: stats.optimalOrder
    },

    // Agent task
    task: 'optimize_multi_goal_roadmap',

    // Conversation stage
    stage: 'initial' // Will track: initial, clarifying, optimizing, finalizing
  };

  return context;
};

/**
 * Generate system prompt for Luna based on context
 */
export const generateSystemPrompt = (context) => {
  const { user, goals, analysis } = context;

  return `You are Luna, an expert AI planning advisor helping ${user.partner1} & ${user.partner2} optimize their multi-goal roadmap.

═══════════════════════════════════════════════════════════════
GOAL BASKET OVERVIEW
═══════════════════════════════════════════════════════════════
${user.partner1} & ${user.partner2} want to achieve ${analysis.totalGoals} goals together:

${goals.map(g => `
${g.number}. ${g.title} (${g.category})
   💰 Budget: €${g.estimatedCost.toLocaleString()}
   ⏱️ Duration: ${g.duration}
   📝 ${g.description}
   ${g.customDetails ? `📋 Details: ${g.customDetails}` : ''}
   ${g.source === 'custom' ? '✨ Custom goal' : '📋 Template goal'}
`).join('\n')}

═══════════════════════════════════════════════════════════════
INTELLIGENT ANALYSIS
═══════════════════════════════════════════════════════════════

📊 SUMMARY METRICS:
• Total Budget: €${analysis.totalBudget.toLocaleString()}
• Estimated Timeline: ${Math.round(analysis.maxEndMonth / 12)} years (${analysis.maxEndMonth} months)
• Risk Level: ${analysis.riskLevel.toUpperCase()}
• Dependencies: ${analysis.totalDependencies}

${analysis.conflictCount > 0 ? `
⚠️ CONFLICTS DETECTED (${analysis.conflictCount}):
${analysis.conflicts.map(c => `  • ${c.message}\n    → ${c.suggestion}`).join('\n')}
` : ''}

${analysis.synergyCount > 0 ? `
✨ SYNERGIES FOUND (${analysis.synergyCount}):
${analysis.synergies.map(s => `  • ${s.message}\n    → ${s.suggestion}`).join('\n')}
` : ''}

${analysis.budgetIssues.length > 0 ? `
💰 BUDGET ISSUES (${analysis.budgetIssues.length}):
${analysis.budgetIssues.map(i => `  • ${i.message}\n    → ${i.recommendation}`).join('\n')}
` : ''}

${analysis.risks.length > 0 ? `
🛡️ RISKS IDENTIFIED (${analysis.risks.length}):
${analysis.risks.map(r => `  • [${r.severity.toUpperCase()}] ${r.title}: ${r.message}`).join('\n')}
` : ''}

${analysis.totalDependencies > 0 ? `
🔗 DEPENDENCIES:
${analysis.dependencyGraph.edges.map(e => {
  const from = analysis.dependencyGraph.nodes.find(n => n.id === e.from);
  const to = analysis.dependencyGraph.nodes.find(n => n.id === e.to);
  return `  • ${from?.title} → ${to?.title} (${e.reason})`;
}).join('\n')}
` : ''}

${analysis.optimalOrder.length > 1 ? `
📋 RECOMMENDED SEQUENCE:
${analysis.optimalOrder.map((g, i) => `  ${i + 1}. ${g.title} (${g.category})`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════

Help ${user.partner1} & ${user.partner2} create an optimized, interconnected roadmap that:

1. **Resolves Conflicts**: Address timeline and budget conflicts intelligently
2. **Leverages Synergies**: Create shared milestones where goals overlap
3. **Manages Dependencies**: Ensure prerequisites are completed first
4. **Optimizes Budget**: Suggest smart budget allocations and phasing
5. **Mitigates Risks**: Provide strategies to handle identified risks
6. **Sequences Intelligently**: Recommend optimal goal ordering

═══════════════════════════════════════════════════════════════
CONVERSATION APPROACH
═══════════════════════════════════════════════════════════════

PHASE 1 - ACKNOWLEDGE & CLARIFY (2-3 questions):
  • Acknowledge their exciting vision
  • Point out 1-2 most important insights from analysis
  • Ask smart questions to understand priorities:
    - "Which goal is most important to complete first?"
    - "Are you open to adjusting timelines to reduce conflicts?"
    - "Do you have existing savings or need to build financial foundation?"
    - "Would you prefer sequential goals or some overlap?"

PHASE 2 - PRESENT OPTIMIZATION (after they answer):
  • Share your recommended approach
  • Explain WHY this sequence makes sense
  • Show how shared milestones leverage synergies
  • Present budget allocation strategy
  • Address each major conflict/risk

PHASE 3 - GENERATE ROADMAP:
  • Create detailed milestones for each goal
  • Include interconnected dependencies
  • Add timeline-specific insights (location data, costs, tips)
  • Generate deep-dive recommendations
  • Include progress metrics and success indicators

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

When ready to generate the optimized roadmap, structure your response as:

**OPTIMIZED ROADMAP READY**

[Then provide the optimized plan with clear sections]

═══════════════════════════════════════════════════════════════

Begin your conversation now. Be warm, insightful, and focus on their unique situation.`;
};

/**
 * Parse Luna's response to extract optimization decisions
 */
export const parseOptimizationDecisions = (lunaResponse) => {
  // Extract key decisions from Luna's conversation
  const decisions = {
    preferredSequence: null,
    budgetAdjustments: [],
    timelineAdjustments: [],
    sharedMilestones: [],
    priorities: {}
  };

  // Look for sequence indicators
  if (lunaResponse.includes('recommend') || lunaResponse.includes('sequence')) {
    // Extract recommended sequence
  }

  // Look for budget recommendations
  if (lunaResponse.includes('budget') || lunaResponse.includes('allocate')) {
    // Extract budget adjustments
  }

  return decisions;
};

/**
 * Generate optimized milestones from Luna's recommendations
 */
export const generateOptimizedMilestones = (context, lunaRecommendations, decisions = {}) => {
  const { goals, analysis } = context;

  // Use optimal order from analysis
  const orderedGoals = analysis.optimalOrder.length > 0
    ? analysis.optimalOrder
    : goals;

  // Generate milestones with dependencies
  const milestones = orderedGoals.map((goal, index) => {
    // Find dependencies for this goal
    const dependencies = analysis.dependencyGraph.edges
      .filter(e => e.to === goal.id)
      .map(e => {
        const prereq = orderedGoals.find(g => g.id === e.from);
        return prereq ? prereq.id : null;
      })
      .filter(Boolean);

    // Calculate timeline position
    const timelineItem = analysis.timeline.find(t => t.goal.id === goal.id);
    const startMonth = timelineItem?.startMonth || index * 6;
    const endMonth = timelineItem?.endMonth || startMonth + 12;

    // Generate enhanced milestone
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      icon: goal.icon,
      color: goal.color,
      category: goal.category,
      estimatedCost: goal.estimatedCost,
      budget_amount: 0, // Initialize with 0 (user will set this later)
      target_date: null, // No target date set yet
      duration: goal.duration,

      // Enhanced fields
      aiGenerated: true,
      lunaOptimized: true,
      completed: false,

      // Timeline
      startMonth,
      endMonth,

      // Dependencies
      dependencies,

      // Tasks (will be generated by Luna or use defaults)
      tasks: goal.tasks || generateDefaultTasks(goal),

      // Deep dive data with optimization context
      deepDiveData: {
        personalizedInsights: generatePersonalizedInsights(goal, context),
        intelligentTips: generateIntelligentTips(goal, context),
        budgetBreakdown: generateBudgetBreakdown(goal, context),
        timelineRecommendations: generateTimelineRecommendations(goal, context, timelineItem),
        riskMitigation: generateRiskMitigation(goal, analysis.risks),
        synergies: findGoalSynergies(goal, goals, analysis.synergies)
      }
    };
  });

  return milestones;
};

/**
 * Generate personalized insights based on full context
 */
const generatePersonalizedInsights = (goal, context) => {
  const insights = [];

  // Location-specific insights
  if (context.user.location && context.user.location !== 'Unknown') {
    insights.push(`Planning in ${context.user.location} - consider local regulations and costs`);
  }

  // Multi-goal context insights
  if (context.analysis.totalGoals > 1) {
    insights.push(`This is part of a ${context.analysis.totalGoals}-goal roadmap - coordination is key`);
  }

  // Budget context
  const budgetPercent = (goal.estimatedCost / context.analysis.totalBudget) * 100;
  if (budgetPercent > 50) {
    insights.push(`This goal represents ${Math.round(budgetPercent)}% of your total budget - prioritize carefully`);
  }

  return insights;
};

/**
 * Generate intelligent tips considering dependencies
 */
const generateIntelligentTips = (goal, context) => {
  const tips = [];

  // Check if this goal has prerequisites
  const dependencies = context.analysis.dependencyGraph.edges.filter(e => e.to === goal.id);
  if (dependencies.length > 0) {
    const prereqs = dependencies.map(d => {
      const prereqGoal = context.goals.find(g => g.id === d.from);
      return prereqGoal?.title;
    }).filter(Boolean);

    tips.push(`💡 Complete ${prereqs.join(' and ')} first to build a strong foundation`);
  }

  // Check for synergies
  const synergies = context.analysis.synergies.filter(s =>
    s.message.toLowerCase().includes(goal.title.toLowerCase())
  );
  if (synergies.length > 0) {
    tips.push(`✨ ${synergies[0].message}`);
  }

  return tips;
};

/**
 * Generate budget breakdown with context
 */
const generateBudgetBreakdown = (goal, context) => {
  // Placeholder - could be enhanced with real budget categories
  return {
    total: goal.estimatedCost,
    categories: [
      { name: 'Planning & Research', amount: goal.estimatedCost * 0.1, percentage: 10 },
      { name: 'Execution', amount: goal.estimatedCost * 0.7, percentage: 70 },
      { name: 'Contingency', amount: goal.estimatedCost * 0.2, percentage: 20 }
    ]
  };
};

/**
 * Generate timeline recommendations
 */
const generateTimelineRecommendations = (goal, context, timelineItem) => {
  if (!timelineItem) return [];

  const recommendations = [];

  // Check if goal can start sooner
  if (timelineItem.startMonth > 0) {
    const dependencies = context.analysis.dependencyGraph.edges.filter(e => e.to === goal.id);
    if (dependencies.length === 0) {
      recommendations.push('This goal has no prerequisites - you could start sooner if ready');
    }
  }

  // Check for timeline flexibility
  if (timelineItem.duration > 12) {
    recommendations.push('Consider breaking this into phases for easier management');
  }

  return recommendations;
};

/**
 * Generate risk mitigation specific to this goal
 */
const generateRiskMitigation = (goal, allRisks) => {
  // Filter risks relevant to this goal
  const relevantRisks = allRisks.filter(risk => {
    if (risk.type === 'financial' && goal.estimatedCost > 30000) return true;
    if (risk.type === 'timeline' && goal.duration.includes('12')) return true;
    return false;
  });

  return relevantRisks.map(risk => ({
    risk: risk.title,
    mitigation: risk.mitigation?.[0] || 'Monitor progress regularly'
  }));
};

/**
 * Find synergies related to this goal
 */
const findGoalSynergies = (goal, allGoals, allSynergies) => {
  return allSynergies.filter(synergy =>
    synergy.message.toLowerCase().includes(goal.title.toLowerCase()) ||
    synergy.message.toLowerCase().includes(goal.category)
  );
};

/**
 * Generate default tasks if none provided
 */
const generateDefaultTasks = (goal) => {
  return [
    { id: 1, title: `Research and plan ${goal.title.toLowerCase()}`, completed: false, aiGenerated: true },
    { id: 2, title: 'Set detailed timeline and milestones', completed: false, aiGenerated: true },
    { id: 3, title: 'Begin execution phase', completed: false, aiGenerated: true },
    { id: 4, title: 'Monitor progress and adjust as needed', completed: false, aiGenerated: true }
  ];
};

export default {
  buildOptimizationContext,
  generateSystemPrompt,
  parseOptimizationDecisions,
  generateOptimizedMilestones
};
