/**
 * Assessment Intelligence Agent
 *
 * Analyzes couple's complete journey state and provides intelligent,
 * actionable insights without overwhelming the user.
 *
 * Key Capabilities:
 * - Comprehensive progress analysis across all roadmaps
 * - Task completion patterns and partner balance
 * - Financial health assessment for monetary milestones
 * - Timeline analysis with delay detection
 * - Milestone health scoring with risk identification
 * - Personalized suggestions and actionable recommendations
 * - Intelligent summarization (detailed but not cumbersome)
 */

import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Generate comprehensive assessment for a couple's journey
 * @param {Object} assessmentData - Complete data package for analysis
 * @returns {Object} Structured assessment with insights and recommendations
 */
export const generateCoupleAssessment = async (assessmentData) => {
  const {
    couple,           // { partner1, partner2, compatibilityScore }
    roadmaps,         // Array of active roadmaps
    milestones,       // Array of all milestones with health metrics
    tasks,            // Array of all tasks (open, completed, overdue)
    expenses,         // Array of expenses for monetary milestones
    budgetSummary,    // Budget tracking data
  } = assessmentData;

  try {
    // Build comprehensive context for Claude
    const systemPrompt = buildAssessmentSystemPrompt();
    const analysisPrompt = buildAnalysisPrompt(assessmentData);

    const response = await axios.post(`${BACKEND_URL}/api/claude-generate`, {
      prompt: analysisPrompt,
      systemPrompt: systemPrompt,
      maxTokens: 4096, // Allow for detailed but focused response
      temperature: 0.7, // Balance creativity with consistency
    });

    const rawAssessment = response.data.content;

    // Parse the structured response
    const structuredAssessment = parseAssessmentResponse(rawAssessment);

    // Enrich with calculated metrics
    const enrichedAssessment = enrichWithMetrics(structuredAssessment, assessmentData);

    return enrichedAssessment;

  } catch (error) {
    console.error('Assessment generation failed:', error);

    // Fallback to basic statistical analysis
    return generateFallbackAssessment(assessmentData);
  }
};

/**
 * Build system prompt for assessment agent
 */
function buildAssessmentSystemPrompt() {
  return `You are an intelligent relationship and goal planning assessment expert. Your role is to analyze a couple's journey progress and provide insightful, actionable guidance.

**Assessment Philosophy:**
- Be thorough but concise - provide depth without overwhelming
- Focus on actionable insights over generic observations
- Identify patterns, risks, and opportunities the couple might miss
- Balance encouragement with honest assessment
- Prioritize what matters most right now

**Analysis Framework:**
1. **Overall Journey Health** (0-100 score)
   - Progress momentum
   - Partner collaboration balance
   - Timeline adherence
   - Financial alignment

2. **Key Insights** (3-5 most important observations)
   - What's working well
   - What needs attention
   - Hidden blockers or risks
   - Untapped opportunities

3. **Actionable Recommendations** (3-5 specific next steps)
   - Prioritized by impact
   - Concrete and achievable
   - Partner-specific when relevant
   - Timeline-aware

4. **Financial Assessment** (for monetary milestones)
   - Budget health
   - Spending patterns
   - Financial risks
   - Optimization opportunities

5. **Timeline & Momentum**
   - On-track vs delayed milestones
   - Critical path items
   - Upcoming deadlines
   - Momentum indicators

**Output Format:**
Return your assessment as a JSON structure:
\`\`\`json
{
  "overallHealth": {
    "score": 0-100,
    "status": "thriving|on-track|needs-attention|at-risk",
    "summary": "2-3 sentence overview"
  },
  "keyInsights": [
    {
      "type": "strength|concern|opportunity|risk",
      "title": "Brief headline",
      "description": "1-2 sentences explaining the insight",
      "impact": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "Specific actionable step",
      "reason": "Why this matters",
      "assignedTo": "partner1|partner2|both|null",
      "timeframe": "this-week|this-month|next-month|future"
    }
  ],
  "financialHealth": {
    "score": 0-100,
    "budgetStatus": "under-budget|on-budget|over-budget|no-budget",
    "insights": ["Key financial observations"],
    "alerts": ["Important warnings or opportunities"]
  },
  "timelineAnalysis": {
    "onTrackCount": number,
    "delayedCount": number,
    "upcomingDeadlines": ["Deadline descriptions"],
    "criticalPathItems": ["Critical items needing focus"]
  },
  "partnerBalance": {
    "score": 0-100,
    "description": "Assessment of task/responsibility distribution",
    "suggestions": ["Ways to improve balance if needed"]
  },
  "celebrationMoments": [
    "Recent wins worth celebrating"
  ]
}
\`\`\`

**Tone:**
- Supportive and encouraging
- Professional but warm
- Honest without being discouraging
- Focus on empowerment and partnership`;
}

/**
 * Build analysis prompt with couple's data
 */
function buildAnalysisPrompt(data) {
  const {
    couple,
    roadmaps,
    milestones,
    tasks,
    expenses,
    budgetSummary,
  } = data;

  // Calculate summary statistics
  const stats = calculateSummaryStats(data);

  return `Please provide a comprehensive assessment for this couple's journey progress.

## COUPLE PROFILE
- Partner 1: ${couple.partner1 || 'Partner A'}
- Partner 2: ${couple.partner2 || 'Partner B'}
- Compatibility Score: ${couple.compatibilityScore || 'Not assessed'}
- Relationship Context: ${couple.relationshipContext || 'Building their future together'}

## ACTIVE ROADMAPS (${roadmaps.length} total)
${roadmaps.map((rm, idx) => `
${idx + 1}. **${rm.title}**
   - Location: ${rm.location || 'Not specified'}
   - XP Points: ${rm.xp_points || 0}
   - Active Milestones: ${milestones.filter(m => m.roadmap_id === rm.id && !m.completed).length}
   - Completed Milestones: ${milestones.filter(m => m.roadmap_id === rm.id && m.completed).length}
`).join('\n')}

## MILESTONE STATUS (${milestones.length} total)
${generateMilestoneBreakdown(milestones)}

## TASK ANALYSIS (${tasks.length} total)
- Open Tasks: ${stats.openTasks}
- Completed Tasks: ${stats.completedTasks}
- Overdue Tasks: ${stats.overdueTasks}
- Tasks Assigned to ${couple.partner1}: ${stats.partner1Tasks}
- Tasks Assigned to ${couple.partner2}: ${stats.partner2Tasks}
- Shared Tasks: ${stats.sharedTasks}

### Recent Task Activity
${generateTaskActivity(tasks)}

## FINANCIAL OVERVIEW
${generateFinancialBreakdown(budgetSummary, expenses, milestones)}

## TARGET DATES & TIMELINE
${generateTimelineBreakdown(milestones)}

## MILESTONE HEALTH METRICS
${generateHealthMetrics(milestones)}

---

Based on this comprehensive data, provide your assessment following the JSON structure defined in your system prompt. Focus on:
1. What's the couple's current momentum and trajectory?
2. What are the most important things they should focus on right now?
3. Are there any hidden risks or blockers they should address?
4. What opportunities exist to optimize their journey?
5. How well are they collaborating and balancing responsibilities?
6. What should they celebrate, and what needs course correction?

Be specific, actionable, and insightful. Avoid generic advice.`;
}

/**
 * Calculate summary statistics
 */
function calculateSummaryStats(data) {
  const { tasks, couple } = data;

  const now = new Date();
  const openTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < now);

  const partner1Tasks = tasks.filter(t =>
    t.assigned_to === couple.partner1 ||
    t.assigned_to === 'Partner A' ||
    t.assigned_to === 'partner1'
  ).length;

  const partner2Tasks = tasks.filter(t =>
    t.assigned_to === couple.partner2 ||
    t.assigned_to === 'Partner B' ||
    t.assigned_to === 'partner2'
  ).length;

  const sharedTasks = tasks.filter(t =>
    !t.assigned_to ||
    t.assigned_to === 'both' ||
    t.assigned_to === 'Both'
  ).length;

  return {
    openTasks: openTasks.length,
    completedTasks: completedTasks.length,
    overdueTasks: overdueTasks.length,
    partner1Tasks,
    partner2Tasks,
    sharedTasks,
  };
}

/**
 * Generate milestone breakdown text
 */
function generateMilestoneBreakdown(milestones) {
  if (!milestones || milestones.length === 0) {
    return '- No milestones created yet';
  }

  const completed = milestones.filter(m => m.completed);
  const inProgress = milestones.filter(m => !m.completed && m.milestone_metrics?.progress > 0);
  const notStarted = milestones.filter(m => !m.completed && (!m.milestone_metrics?.progress || m.milestone_metrics.progress === 0));

  return `
- Completed: ${completed.length} (${((completed.length / milestones.length) * 100).toFixed(0)}%)
- In Progress: ${inProgress.length}
- Not Started: ${notStarted.length}

### Milestone Details:
${milestones.slice(0, 10).map((m, idx) => {
  const progress = m.milestone_metrics?.progress || 0;
  const health = m.milestone_metrics?.health_score || 'N/A';
  const status = m.completed ? '✅' : progress > 0 ? '🔄' : '⏸️';

  return `${idx + 1}. ${status} **${m.title}** (${m.goal_type || m.category || 'general'})
   - Progress: ${progress}%
   - Health Score: ${health}
   - Target Date: ${m.target_date ? new Date(m.target_date).toLocaleDateString() : 'Not set'}
   - Budget: ${m.estimated_cost ? `$${m.estimated_cost.toLocaleString()}` : 'N/A'}`;
}).join('\n')}
${milestones.length > 10 ? `\n... and ${milestones.length - 10} more milestones` : ''}
`;
}

/**
 * Generate task activity summary
 */
function generateTaskActivity(tasks) {
  if (!tasks || tasks.length === 0) {
    return '- No tasks created yet';
  }

  // Sort by most recently updated
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5);

  return recentTasks.map((t, idx) => {
    const status = t.completed ? '✅ Completed' : t.due_date && new Date(t.due_date) < new Date() ? '⚠️ Overdue' : '📋 Open';
    const assignee = t.assigned_to || 'Both';
    return `${idx + 1}. ${status} - ${t.title} (${assignee})`;
  }).join('\n');
}

/**
 * Generate financial breakdown
 */
function generateFinancialBreakdown(budgetSummary, expenses, milestones) {
  if (!budgetSummary && (!expenses || expenses.length === 0)) {
    return '- No financial data available yet';
  }

  const monetaryMilestones = milestones.filter(m =>
    m.estimated_cost && m.estimated_cost > 0
  );

  const totalBudget = monetaryMilestones.reduce((sum, m) => sum + (m.estimated_cost || 0), 0);
  const totalSpent = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const remaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

  return `
**Budget Overview:**
- Total Budget: $${totalBudget.toLocaleString()}
- Total Spent: $${totalSpent.toLocaleString()} (${spentPercentage}%)
- Remaining: $${remaining.toLocaleString()}
- Monetary Milestones: ${monetaryMilestones.length}
- Tracked Expenses: ${expenses?.length || 0}

${budgetSummary ? `
**Budget Summary:**
${JSON.stringify(budgetSummary, null, 2)}
` : ''}

${expenses && expenses.length > 0 ? `
**Recent Expenses:**
${expenses.slice(0, 5).map((e, idx) => `
${idx + 1}. ${e.category || 'Uncategorized'}: $${e.amount?.toLocaleString() || 0}
   - Vendor: ${e.vendor || 'Not specified'}
   - Date: ${e.paid_date ? new Date(e.paid_date).toLocaleDateString() : 'Pending'}
`).join('\n')}
` : ''}
`;
}

/**
 * Generate timeline breakdown
 */
function generateTimelineBreakdown(milestones) {
  const now = new Date();
  const milestonesWithDates = milestones.filter(m => m.target_date);

  if (milestonesWithDates.length === 0) {
    return '- No target dates set yet';
  }

  const upcoming = milestonesWithDates
    .filter(m => !m.completed && new Date(m.target_date) >= now)
    .sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
    .slice(0, 5);

  const overdue = milestonesWithDates
    .filter(m => !m.completed && new Date(m.target_date) < now);

  return `
**Timeline Status:**
- Milestones with Target Dates: ${milestonesWithDates.length}
- Upcoming Deadlines: ${upcoming.length}
- Overdue Milestones: ${overdue.length}

${upcoming.length > 0 ? `
**Upcoming Milestones:**
${upcoming.map((m, idx) => {
  const daysUntil = Math.ceil((new Date(m.target_date) - now) / (1000 * 60 * 60 * 24));
  return `${idx + 1}. ${m.title} - ${new Date(m.target_date).toLocaleDateString()} (${daysUntil} days)`;
}).join('\n')}
` : ''}

${overdue.length > 0 ? `
**⚠️ Overdue Milestones:**
${overdue.slice(0, 3).map((m, idx) => {
  const daysOverdue = Math.ceil((now - new Date(m.target_date)) / (1000 * 60 * 60 * 24));
  return `${idx + 1}. ${m.title} - Was due ${new Date(m.target_date).toLocaleDateString()} (${daysOverdue} days overdue)`;
}).join('\n')}
` : ''}
`;
}

/**
 * Generate health metrics summary
 */
function generateHealthMetrics(milestones) {
  const milestonesWithMetrics = milestones.filter(m => m.milestone_metrics);

  if (milestonesWithMetrics.length === 0) {
    return '- No health metrics available yet';
  }

  const avgHealth = milestonesWithMetrics.reduce((sum, m) =>
    sum + (m.milestone_metrics.health_score || 0), 0
  ) / milestonesWithMetrics.length;

  const withAlerts = milestonesWithMetrics.filter(m =>
    m.milestone_metrics.alerts && m.milestone_metrics.alerts.length > 0
  );

  return `
**Health Metrics:**
- Average Health Score: ${avgHealth.toFixed(1)}/100
- Milestones with Alerts: ${withAlerts.length}

${withAlerts.length > 0 ? `
**Active Alerts:**
${withAlerts.slice(0, 5).map((m, idx) => `
${idx + 1}. ${m.title}:
${m.milestone_metrics.alerts.map(alert => `   - ${alert}`).join('\n')}
`).join('\n')}
` : ''}
`;
}

/**
 * Parse Claude's JSON response
 */
function parseAssessmentResponse(rawResponse) {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) ||
                     rawResponse.match(/```\n([\s\S]*?)\n```/);

    const jsonString = jsonMatch ? jsonMatch[1] : rawResponse;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse assessment response:', error);
    // Return basic structure
    return {
      overallHealth: {
        score: 50,
        status: 'needs-attention',
        summary: 'Unable to generate detailed assessment. Please try again.'
      },
      keyInsights: [],
      recommendations: [],
      error: true
    };
  }
}

/**
 * Enrich assessment with calculated metrics
 */
function enrichWithMetrics(assessment, data) {
  const { milestones, tasks } = data;

  // Add completion percentages
  const completionRate = {
    milestones: milestones.length > 0
      ? (milestones.filter(m => m.completed).length / milestones.length) * 100
      : 0,
    tasks: tasks.length > 0
      ? (tasks.filter(t => t.completed).length / tasks.length) * 100
      : 0,
  };

  // Add momentum score (based on recent activity)
  const recentTasks = tasks.filter(t => {
    const updatedAt = new Date(t.updated_at || t.created_at);
    const daysSince = (new Date() - updatedAt) / (1000 * 60 * 60 * 24);
    return daysSince <= 7; // Activity in last 7 days
  });

  const momentumScore = Math.min(100, (recentTasks.length / Math.max(1, tasks.length)) * 100 * 7);

  return {
    ...assessment,
    metrics: {
      completionRate,
      momentumScore: Math.round(momentumScore),
      totalMilestones: milestones.length,
      totalTasks: tasks.length,
      activeRoadmaps: data.roadmaps.length,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate fallback assessment if Claude fails
 */
function generateFallbackAssessment(data) {
  const { milestones, tasks } = data;
  const stats = calculateSummaryStats(data);

  const completionRate = milestones.length > 0
    ? (milestones.filter(m => m.completed).length / milestones.length) * 100
    : 0;

  return {
    overallHealth: {
      score: Math.round(completionRate),
      status: completionRate > 75 ? 'on-track' : completionRate > 50 ? 'needs-attention' : 'at-risk',
      summary: `You have completed ${milestones.filter(m => m.completed).length} of ${milestones.length} milestones (${completionRate.toFixed(0)}%). ${stats.overdueTasks > 0 ? `You have ${stats.overdueTasks} overdue tasks that need attention.` : 'Keep up the great work!'}`
    },
    keyInsights: [
      {
        type: stats.completedTasks > stats.openTasks ? 'strength' : 'concern',
        title: 'Task Completion',
        description: `${stats.completedTasks} tasks completed, ${stats.openTasks} still open.`,
        impact: 'medium'
      }
    ],
    recommendations: stats.overdueTasks > 0 ? [
      {
        priority: 'high',
        action: `Address ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''}`,
        reason: 'Overdue tasks can block progress on dependent milestones',
        timeframe: 'this-week'
      }
    ] : [],
    metrics: {
      completionRate: { milestones: completionRate, tasks: (stats.completedTasks / (stats.completedTasks + stats.openTasks)) * 100 },
      totalMilestones: milestones.length,
      totalTasks: tasks.length,
    },
    fallback: true,
    generatedAt: new Date().toISOString(),
  };
}
