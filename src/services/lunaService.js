/**
 * Luna AI Service
 *
 * Luna is an AI planning assistant powered by Claude.
 * This service handles:
 * - Conversation management with Claude API
 * - Tool/function calling
 * - Context management
 * - Roadmap generation coordination
 */

const BACKEND_URL = 'http://localhost:3001'; // Backend server with detailed logging

/**
 * System prompt that defines Luna's role and behavior
 * Keep it concise - Claude is smart enough to understand
 */
const LUNA_SYSTEM_PROMPT = `You are Luna, an AI planning assistant for couples planning their future together.

YOUR MISSION:
Help couples create realistic, actionable roadmaps for ANY goal they have together.
Goals can be ANYTHING: buying apartment, planning wedding, learning new skill, starting business,
getting fit, writing book, learning language, renovating home, adopting pet, saving for vacation, etc.

INTELLIGENCE-FIRST APPROACH:
You are powered by advanced AI. Before asking ANY questions, ASSESS what you already know.
Your goal is to get users to their roadmap as FAST as possible while maintaining quality.

INFORMATION COMPLETENESS ASSESSMENT:
For every message, evaluate what you know:
- Goal clarity: Do I understand WHAT they want to achieve?
- Timeline: Do I know WHEN they want to achieve it?
- Budget: Do I know HOW MUCH they can spend?
- Location: Do I know WHERE they are?
- Partner names: Do I know WHO is involved?

ADAPTIVE ROUTING - Choose the FASTEST path:

🚀 EXPRESS PATH (90%+ complete information):
WHEN: User provides comprehensive details upfront
EXAMPLES:
- "Alex and Sam want to buy apartment in Berlin for €400k in 12 months"
- "We're planning our wedding in Seattle for $50k next June"
- "Maria and I want to start a bakery in Portland with $100k budget, opening in 18 months"

YOUR ACTION:
1. Acknowledge their goal enthusiastically
2. Extract all provided information (names, location, goal, budget, timeline)
3. Call extract_user_data() if names/location provided
4. IMMEDIATELY call generate_intelligent_roadmap() or create_multi_goal_plan()
5. Do NOT ask redundant questions about information they already gave you

TIME TO ROADMAP: ~30 seconds

⚡ HYBRID PATH (50-90% complete information):
WHEN: User provides goal + some details, but missing 1-2 critical pieces
EXAMPLES:
- "We want to buy a house in Austin in 2 years" (missing: budget)
- "Planning our wedding for $40k" (missing: location, timeline)
- "Start a coffee shop in Denver" (missing: budget, timeline)

YOUR ACTION:
1. Acknowledge their goal
2. Extract what you know
3. Ask ONLY for missing critical information (1-2 targeted questions MAX)
4. Then IMMEDIATELY generate roadmap
5. Don't ask for "nice-to-haves" - make smart assumptions

TIME TO ROADMAP: ~2 minutes

💬 CONVERSATIONAL PATH (<50% complete information):
WHEN: User provides vague or exploratory input
EXAMPLES:
- "We're thinking about our future together"
- "We want to plan something big"
- "Help us figure out our next steps"

YOUR ACTION:
1. Warm, supportive response
2. Ask open-ended discovery questions
3. Guide them to clarity about their goals
4. Build understanding through conversation
5. Once goal is clear, assess completeness and switch to EXPRESS or HYBRID

TIME TO ROADMAP: ~5 minutes

MULTI-GOAL DETECTION (CRITICAL):
Watch for these patterns that indicate MULTIPLE goals:

Conjunction words:
- "X AND Y" → "buy apartment AND plan wedding"
- "X plus Y" → "save for car plus vacation"
- "X as well as Y" → "start business as well as buy home"

Sequential indicators:
- "X THEN Y" → "get married THEN buy house"
- "First X, later Y" → "First renovate, later buy car"
- "X before Y" → "Save emergency fund before starting business"

Parallel timelines:
- "X in N months and Y in M months" → "wedding in 6 months and house in 18 months"
- "X next year, Y in 3 years" → "car next year, baby in 3 years"

Lists:
- "X, Y, and Z" → "save for car, vacation, and home down payment"

When MULTIPLE goals detected:
1. Acknowledge ALL goals clearly: "I see you have 3 goals: X, Y, and Z. That's exciting!"
2. For EXPRESS path: If all goals have budgets/timelines, call create_multi_goal_plan() immediately
3. For HYBRID path: Ask "Which goal is most important?" and "What's your budget for each?"
4. Call create_multi_goal_plan() with complete goal array
5. Luna will handle timeline conflicts, dependencies, and resource allocation intelligently

CONVERSATION STYLE:
- Warm, supportive, conversational (like a helpful friend)
- Extract information intelligently from conversation (budget hints, timeline clues)
- Celebrate their goals ("That's exciting!", "I love that!")
- Build on previous answers, don't repeat questions
- NEVER assume their goal - if they say "moving to Augsburg, Germany", use THAT exact location
- LISTEN carefully and use their EXACT words for titles and descriptions

CRITICAL RULES:
- NEVER ask for information the user already provided
- NEVER force unnecessary questions when you have complete information
- ALWAYS choose the FASTEST path that maintains quality
- DEFAULT to EXPRESS path when you have 90%+ info - users appreciate speed
- If you have enough to generate a quality roadmap, DO IT NOW
- Only ask questions when truly necessary for quality

TOOL USAGE:
- Call extract_user_data() ONCE when you learn names/location
- FOR EACH GOAL: Call generate_milestone() to create a milestone card
  → This creates the goal as a clickable card (e.g., "Buy Apartment in Berlin")
  → The milestone title should be the user's goal in their own words
- THEN call generate_deep_dive() for that milestone
  → This adds the roadmap steps/tasks INSIDE the milestone
  → Tasks appear when user clicks the milestone card
- Call finalize_roadmap() ONCE when all milestones are ready
  → This saves everything to database and triggers UI transition
- Call track_expense() when user mentions spending money
- Call analyze_savings_progress() when user asks about financial progress

IMPORTANT: Each user goal = ONE milestone card. The steps to achieve it = tasks inside that milestone.

INTELLIGENT FEATURES:
- Extract budget/timeline hints from casual conversation ("We're saving $500/month", "by next summer")
- Auto-categorize expenses (e.g., "bought wedding dress" → attire category)
- Detect budget anomalies (large expenses, duplicates, over-budget alerts)
- Provide savings recommendations based on progress and timeline
- Generate context-aware roadmaps that adapt to user constraints
- Make smart assumptions for missing "nice-to-have" information (e.g., assume 20% down payment if not specified)

Be conversational between tool calls - explain what you're creating and discovering!`;

/**
 * Tool definitions for Claude function calling
 * Claude will decide when to call these based on the conversation
 */
const LUNA_TOOLS = [
  {
    name: "extract_user_data",
    description: "Extract and store partner names and location. Call this as soon as you learn these details.",
    input_schema: {
      type: "object",
      properties: {
        partner1: {
          type: "string",
          description: "First partner's name"
        },
        partner2: {
          type: "string",
          description: "Second partner's name (optional if not mentioned yet)"
        },
        location: {
          type: "string",
          description: "City or country where they live (for cost calculations)"
        }
      },
      required: ["partner1"]
    }
  },
  {
    name: "generate_milestone",
    description: "Create a milestone card for a user's goal (e.g., 'Buy Apartment in Berlin'). This creates the clickable card that users see. After calling this, call generate_deep_dive() to add the roadmap steps/tasks inside it. IMPORTANT: After calling this, you MUST call generate_deep_dive() and then finalize_roadmap().",
    input_schema: {
      type: "object",
      properties: {
        goal_type: {
          type: "string",
          description: "A short category label for the goal type"
        },
        title: {
          type: "string",
          description: "User-facing, descriptive title that clearly describes WHAT the goal is (e.g., 'Plan Iceland Wedding', 'Buy Berlin Apartment', 'Start Coffee Shop in Portland'). NEVER use generic titles like 'Goal Definition And Research'. The title should immediately tell the user what they're planning."
        },
        description: {
          type: "string",
          description: "Brief description"
        },
        timeline_months: {
          type: "number",
          description: "Timeline in months"
        },
        budget: {
          type: "number",
          description: "Budget"
        },
        location: {
          type: "string",
          description: "Location"
        },
        preferences: {
          type: "object",
          description: "User preferences"
        }
      },
      required: ["goal_type", "title", "timeline_months", "budget"]
    }
  },
  {
    name: "generate_deep_dive",
    description: "Generate detailed deep dive data for a milestone: cost breakdown, challenges, action steps, tips. Call right after creating a milestone.",
    input_schema: {
      type: "object",
      properties: {
        milestone_id: {
          type: "string",
          description: "ID of the milestone this deep dive is for"
        },
        goal_type: {
          type: "string",
          description: "Type of goal (wedding, home, etc.)"
        },
        budget: {
          type: "number",
          description: "Total budget"
        },
        timeline_months: {
          type: "number",
          description: "Timeline in months"
        },
        location: {
          type: "string",
          description: "Location for context"
        },
        preferences: {
          type: "object",
          description: "User preferences"
        }
      },
      required: ["milestone_id", "goal_type", "budget", "timeline_months"]
    }
  },
  {
    name: "finalize_roadmap",
    description: "Signal that the complete roadmap is ready. Call when all milestones and deep dives are generated.",
    input_schema: {
      type: "object",
      properties: {
        roadmap_title: {
          type: "string",
          description: "Title for the entire roadmap using the user's EXACT words for their goal (e.g., 'Moving to Augsburg, Germany' NOT 'Destination Research')"
        },
        summary: {
          type: "string",
          description: "Brief summary of the complete roadmap"
        },
        total_cost: {
          type: "number",
          description: "Total estimated cost of all milestones"
        },
        total_timeline_months: {
          type: "number",
          description: "Total timeline in months"
        }
      },
      required: ["roadmap_title", "summary"]
    }
  },
  {
    name: "track_expense",
    description: "Track an expense and get budget status, anomaly detection, and financial insights. Use when user mentions spending money on something.",
    input_schema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Expense amount"
        },
        title: {
          type: "string",
          description: "What the expense is for (e.g., 'Venue deposit', 'Wedding dress')"
        },
        category: {
          type: "string",
          description: "Optional category (will be auto-detected if not provided)"
        },
        roadmap_id: {
          type: "string",
          description: "ID of the roadmap this expense belongs to"
        },
        milestone_id: {
          type: "string",
          description: "Optional milestone ID this expense is for"
        }
      },
      required: ["amount", "title"]
    }
  },
  {
    name: "analyze_savings_progress",
    description: "Analyze savings progress toward a goal and provide recommendations. Use when user asks about savings or financial progress.",
    input_schema: {
      type: "object",
      properties: {
        target_amount: {
          type: "number",
          description: "Target savings amount"
        },
        target_date: {
          type: "string",
          description: "Target date (ISO format)"
        },
        current_amount: {
          type: "number",
          description: "Current saved amount"
        },
        monthly_contribution: {
          type: "number",
          description: "Monthly savings contribution"
        }
      },
      required: ["target_amount", "target_date"]
    }
  }
];

/**
 * Main conversation function
 * Manages the back-and-forth with Claude, handling function calls
 *
 * @param {Array} messages - Conversation history in Claude format
 * @param {Object} context - User context (accumulated data)
 * @returns {Promise<Object>} Response with message and updated context
 */
export async function converseWithLuna(messages, context = {}) {
  try {
    console.log('💬 Luna conversation', {
      messageCount: messages.length,
      hasContext: Object.keys(context).length > 0
    });

    // Call our backend which proxies to Claude
    const response = await fetch(`${BACKEND_URL}/api/claude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt: LUNA_SYSTEM_PROMPT,
        tools: LUNA_TOOLS,
        maxTokens: 2048,
        temperature: 1.0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API call failed');
    }

    const data = await response.json();

    // Handle function calling
    if (data.stop_reason === 'tool_use') {
      return await handleToolUse(data, messages, context);
    }

    // Normal text response
    const textContent = data.content.find(c => c.type === 'text');
    if (!textContent) {
      // Edge case: Claude returned end_turn but no text content
      // This can happen if Claude only wanted to call tools
      console.warn('⚠️ No text content in response, checking for tool_use blocks');

      // Check if there are tool_use blocks we missed
      const hasToolUse = data.content.some(c => c.type === 'tool_use');
      if (hasToolUse) {
        console.log('🔧 Found tool_use blocks despite end_turn, processing them');
        return await handleToolUse(data, messages, context);
      }

      // Truly no content - ask Claude to continue
      console.error('❌ Response has no content at all:', data);
      throw new Error('No text content in response');
    }

    return {
      message: textContent.text,
      context,
      isComplete: false
    };

  } catch (error) {
    console.error('❌ Luna conversation error:', error);

    // Graceful fallback
    return {
      message: "I'm having a moment of trouble connecting. Could you tell me again what you're hoping to accomplish?",
      context,
      error: error.message,
      isComplete: false
    };
  }
}

/**
 * Handle tool/function calling from Claude
 * Executes the requested function and continues conversation
 */
async function handleToolUse(data, messages, context) {
  console.log('🔧 Claude wants to use tools');

  // Store conversation messages in context for deep dive generation
  context.conversationMessages = messages;

  // Find ALL tool use requests in Claude's response (Claude can call multiple tools at once!)
  const toolUses = data.content.filter(c => c.type === 'tool_use');
  if (toolUses.length === 0) {
    throw new Error('Tool use indicated but no tools found in response');
  }

  console.log(`📞 Claude called ${toolUses.length} tool(s):`, toolUses.map(t => t.name).join(', '));

  try {
    // Execute ALL tools and collect their results
    const toolResults = [];

    for (const toolUse of toolUses) {
      console.log(`🔨 Executing tool: ${toolUse.name}`);

      // Execute the tool
      const toolResult = await executeToolCall(toolUse.name, toolUse.input, context);

      // Update context with any extracted/generated data
      updateContextFromToolResult(context, toolResult);

      // Add tool result
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
      });

      console.log(`✅ Tool ${toolUse.name} completed`);
    }

    // Continue conversation with ALL tool results
    const continueMessages = [
      ...messages,
      { role: 'assistant', content: data.content },
      {
        role: 'user',
        content: toolResults  // Send ALL tool results at once
      }
    ];

    console.log(`🔄 Continuing with ${toolResults.length} tool result(s)`);

    // Recursive call to get Claude's response after tool execution
    return await converseWithLuna(continueMessages, context);

  } catch (toolError) {
    console.error(`❌ Tool execution error:`, toolError);

    // Send error back to Claude for ALL tools
    const errorResults = toolUses.map(toolUse => ({
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: JSON.stringify({ success: false, error: toolError.message }),
      is_error: true
    }));

    const continueMessages = [
      ...messages,
      { role: 'assistant', content: data.content },
      {
        role: 'user',
        content: errorResults
      }
    ];

    // Let Claude handle the error gracefully
    return await converseWithLuna(continueMessages, context);
  }
}

/**
 * Execute tool calls from Claude
 * Routes to appropriate handler
 */
async function executeToolCall(toolName, input, context) {
  switch(toolName) {
    case 'extract_user_data':
      return await handleExtractUserData(input, context);

    case 'generate_milestone':
      return await handleGenerateMilestone(input, context);

    case 'generate_deep_dive':
      return await handleGenerateDeepDive(input, context);

    case 'finalize_roadmap':
      return await handleFinalizeRoadmap(input, context);

    case 'track_expense':
      return await handleTrackExpense(input, context);

    case 'analyze_savings_progress':
      return await handleAnalyzeSavingsProgress(input, context);

    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`
      };
  }
}

/**
 * Tool Handlers
 */

async function handleExtractUserData(input, context) {
  // Import Goal Discovery Agent
  const { analyzeMessage, determineNextQuestions } = await import('./agents/goalDiscoveryAgent');

  // Analyze the current conversation to extract additional context
  const conversationHistory = context.conversationHistory || [];
  const lastMessage = conversationHistory[conversationHistory.length - 1] || '';

  // Extract context from the message using Goal Discovery Agent
  const extractedContext = analyzeMessage(lastMessage);

  // Check readiness for roadmap generation
  const readiness = determineNextQuestions(extractedContext, context.goalType || 'wedding');

  return {
    success: true,
    extracted: {
      partner1: input.partner1,
      partner2: input.partner2 || null,
      location: input.location || null
    },
    // Add intelligent context from Goal Discovery Agent
    discoveredContext: {
      budgetHints: extractedContext.budgetHints,
      timelineHints: extractedContext.timelineHints,
      preferences: extractedContext.preferences,
      constraints: extractedContext.constraints,
      readiness: readiness.readiness,
      isReady: readiness.isReady,
      nextQuestion: readiness.nextQuestion,
      missingInfo: readiness.missingInfo
    }
  };
}

async function handleCreateMultiGoalPlan(input, context) {
  console.log(`🎯🎯🎯 Creating multi-goal plan for ${input.goals.length} goals`);

  const { generateIntelligentRoadmap } = await import('./agents/intelligentRoadmapAgent');

  // Generate roadmap for each goal
  const roadmaps = [];
  for (const [index, goal] of input.goals.entries()) {
    console.log(`  📍 Generating roadmap ${index + 1}/${input.goals.length}: ${goal.goal_description}`);

    const userContext = {
      budget: goal.budget ? { amount: goal.budget } : null,
      timeline: { text: `${goal.timeline_months} months` },
      location: { text: input.location },
      preferences: [],
      constraints: []
    };

    try {
      const roadmap = await generateIntelligentRoadmap(goal.goal_description, userContext);
      roadmaps.push({
        ...roadmap,
        goal_index: index,
        priority: goal.priority || 'medium',
        original_goal: goal
      });
    } catch (error) {
      console.error(`❌ Failed to generate roadmap for goal ${index + 1}:`, error);
      // Continue with other goals even if one fails
    }
  }

  // Use AI to analyze conflicts and generate recommendations
  let orchestration;
  try {
    // TODO: Implement analyzeMultiGoalWithAI function
    // eslint-disable-next-line no-undef
    // orchestration = await analyzeMultiGoalWithAI(roadmaps, input.total_budget, input.location);
    throw new Error('analyzeMultiGoalWithAI not yet implemented');
  } catch (error) {
    console.error('AI orchestration failed, using basic analysis:', error);
    orchestration = {
      conflicts: [],
      recommendations: [{
        type: 'basic',
        message: `Created ${roadmaps.length} goal roadmaps. Review timelines and budgets for potential conflicts.`
      }],
      timeline_strategy: 'Review each goal individually and adjust as needed.',
      financial_strategy: 'Monitor spending across all goals.'
    };
  }

  // Store all roadmaps in context
  context.multiGoalPlan = {
    roadmaps,
    ...orchestration,
    total_goals: input.goals.length,
    successfully_generated: roadmaps.length
  };

  console.log(`✅ Multi-goal plan created: ${roadmaps.length}/${input.goals.length} roadmaps generated`);

  return {
    success: true,
    roadmaps_generated: roadmaps.length,
    total_goals: input.goals.length,
    roadmaps: roadmaps.map(r => ({
      goal: r.original_goal.goal_description,
      timeline: r.original_goal.timeline_months,
      milestones_count: r.milestones.length,
      estimated_cost: r.total_estimated_cost
    })),
    ...orchestration,
    message: `Successfully created coordinated plan for ${roadmaps.length} goals. ${orchestration.conflicts.length > 0 ? `AI identified ${orchestration.conflicts.length} considerations.` : 'Plan looks well-balanced!'}`
  };
}

/**
 * Analyze timeline conflicts between multiple goals
 */
function analyzeTimelineConflicts(roadmaps) {
  const conflicts = [];

  // Sort roadmaps by timeline
  const sorted = [...roadmaps].sort((a, b) =>
    a.original_goal.timeline_months - b.original_goal.timeline_months
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const goal1 = sorted[i].original_goal;
      const goal2 = sorted[j].original_goal;

      // Check if goals overlap significantly
      const overlap = goal1.timeline_months >= goal2.timeline_months * 0.5;

      if (overlap) {
        conflicts.push({
          type: 'timeline_overlap',
          goal1: goal1.goal_description,
          goal2: goal2.goal_description,
          severity: goal1.timeline_months < goal2.timeline_months * 0.75 ? 'high' : 'medium',
          recommendation: `${goal1.goal_description} (${goal1.timeline_months}mo) may overlap with ${goal2.goal_description} (${goal2.timeline_months}mo). Consider staggering start dates or adjusting timelines.`
        });
      }
    }
  }

  // Check for financial strain
  const totalCost = roadmaps.reduce((sum, r) => sum + (r.total_estimated_cost || 0), 0);
  const avgMonthlyBurn = totalCost / Math.max(...roadmaps.map(r => r.original_goal.timeline_months));

  if (avgMonthlyBurn > 5000) {
    conflicts.push({
      type: 'financial_strain',
      severity: 'high',
      total_cost: totalCost,
      monthly_burn: avgMonthlyBurn,
      recommendation: `High monthly spending required (€${Math.round(avgMonthlyBurn)}/month). Consider extending timelines or prioritizing goals.`
    });
  }

  return conflicts;
}

/**
 * Generate recommendations for multi-goal planning
 */
function generateMultiGoalRecommendations(roadmaps, conflicts, totalBudget) {
  const recommendations = [];

  // Priority-based sequencing
  const byPriority = {
    critical: roadmaps.filter(r => r.priority === 'critical'),
    high: roadmaps.filter(r => r.priority === 'high'),
    medium: roadmaps.filter(r => r.priority === 'medium'),
    low: roadmaps.filter(r => r.priority === 'low')
  };

  if (byPriority.critical.length > 1) {
    recommendations.push({
      type: 'priority_conflict',
      message: `You have ${byPriority.critical.length} critical-priority goals. Consider which is truly most urgent.`,
      action: 'Review and adjust priorities'
    });
  }

  // Budget allocation
  const totalCost = roadmaps.reduce((sum, r) => sum + (r.total_estimated_cost || 0), 0);
  if (totalBudget && totalCost > totalBudget) {
    recommendations.push({
      type: 'budget_exceeded',
      message: `Total estimated cost (€${totalCost}) exceeds budget (€${totalBudget}) by €${totalCost - totalBudget}`,
      action: 'Adjust goal scopes or extend timelines to reduce monthly costs'
    });
  }

  // Timeline sequencing
  const shortestTimeline = Math.min(...roadmaps.map(r => r.original_goal.timeline_months));
  const longestTimeline = Math.max(...roadmaps.map(r => r.original_goal.timeline_months));

  if (longestTimeline > shortestTimeline * 3) {
    recommendations.push({
      type: 'timeline_spread',
      message: `Goals span from ${shortestTimeline} to ${longestTimeline} months. This is manageable with good planning.`,
      action: 'Focus on near-term goals first, plan long-term goals in parallel'
    });
  }

  return recommendations;
}

async function handleGenerateIntelligentRoadmap(input, context) {
  console.log('🎯 Generating intelligent roadmap for:', input.goal_description);

  // Import the intelligent roadmap agent
  const { generateIntelligentRoadmap } = await import('./agents/intelligentRoadmapAgent');

  // Build user context
  const userContext = {
    budget: input.budget ? { amount: input.budget } : null,
    timeline: input.timeline_months ? { text: `${input.timeline_months} months` } : null,
    location: input.location ? { text: input.location } : null,
    preferences: input.preferences || [],
    constraints: input.constraints || []
  };

  try {
    // Generate the intelligent roadmap using Claude
    const roadmap = await generateIntelligentRoadmap(input.goal_description, userContext);

    // Store in context for finalization
    context.generatedRoadmap = roadmap;
    context.roadmapMilestones = roadmap.milestones;

    console.log(`✅ Generated ${roadmap.milestones.length} milestone stages`);

    return {
      success: true,
      roadmap,
      milestones_count: roadmap.milestones.length,
      total_cost: roadmap.total_estimated_cost,
      total_duration: roadmap.total_estimated_duration,
      message: `Successfully generated a ${roadmap.milestones.length}-stage journey roadmap for: ${input.goal_description}`
    };
  } catch (error) {
    console.error('❌ Intelligent roadmap generation failed:', error);

    // Fallback to template-based generation
    console.log('⚠️ Falling back to template-based generation');
    const { generateTemplateBasedRoadmap } = await import('./agents/intelligentRoadmapAgent');
    const roadmap = generateTemplateBasedRoadmap(input.goal_description, userContext);

    context.generatedRoadmap = roadmap;
    context.roadmapMilestones = roadmap.milestones;

    return {
      success: true,
      roadmap,
      milestones_count: roadmap.milestones.length,
      fallback: true,
      message: `Generated a ${roadmap.milestones.length}-stage roadmap using template matching (AI generation unavailable)`
    };
  }
}

async function handleGenerateMilestone(input, context) {
  // CRITICAL: Check if we already created a milestone for this goal
  const existingMilestones = context.milestones || [];
  const alreadyCreated = existingMilestones.some(m =>
    m.goal_type === input.goal_type ||
    (m.title && input.title && m.title.toLowerCase().includes(input.title.toLowerCase().substring(0, 10)))
  );

  if (alreadyCreated) {
    console.log('⚠️ DUPLICATE PREVENTION: Milestone already exists for this goal, skipping creation');
    console.log('   Existing milestones:', existingMilestones.map(m => m.title));
    console.log('   Attempted goal_type:', input.goal_type);
    return {
      success: false,
      error: 'A milestone for this goal has already been created. Please call generate_deep_dive() for the existing milestone, then finalize_roadmap().',
      duplicate: true,
      existing_milestone_id: existingMilestones[0]?.id
    };
  }

  // Import Roadmap Architect Agent
  const { generateRoadmap } = await import('./agents/roadmapArchitectAgent');

  // Build user context from accumulated data
  const userContext = {
    budget: input.budget ? { amount: input.budget, confidence: 0.9 } : null,
    timeline: input.timeline_months ? { text: `${input.timeline_months} months`, confidence: 0.9 } : null,
    location: input.location ? { text: input.location, confidence: 0.9 } : null,
    preferences: input.preferences ? Object.entries(input.preferences).map(([category, value]) => ({
      category,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      confidence: 0.8
    })) : [],
    constraints: context.constraints || []
  };

  // Extract goal description for hybrid approach
  const goalDescription = input.description || input.title || null;

  // Generate comprehensive roadmap using Roadmap Architect (HYBRID APPROACH WITH VALIDATION)
  // - Layer 1: Template matching (rich, comprehensive templates)
  // - Layer 2: Claude validation & customization (quality gate for user's specific dream)
  // - Layer 3: Pure Claude generation (fallback for unknown goals)
  // - Layer 4: Generic fallback (safety net)
  const { roadmap, budgetAllocation } = await generateRoadmap(
    userContext,
    input.goal_type,
    goalDescription,
    { useClaudeValidation: true } // Enable Claude validation (default)
  );

  // Return the first milestone (Luna will call this multiple times for full roadmap)
  const milestone = roadmap.milestones[0];

  // CRITICAL FIX: Use Luna's provided title if it exists (more intuitive than template phase names)
  // Example: Luna says "Plan Dream Wedding" → use that instead of "Engagement Celebration"
  if (input.title && input.title.trim()) {
    milestone.title = input.title.trim();
    console.log(`✅ Using Luna's title: "${milestone.title}" instead of template: "${roadmap.milestones[0].title}"`);
  }

  // CRITICAL FIX: Use Luna's provided description if it exists
  if (input.description && input.description.trim()) {
    milestone.description = input.description.trim();
  }

  return {
    success: true,
    milestone,
    milestone_id: milestone.id,
    // Include full roadmap metadata for context
    roadmapMetadata: {
      totalMilestones: roadmap.metadata.totalMilestones,
      totalDuration: roadmap.metadata.totalDuration,
      estimatedCost: roadmap.metadata.estimatedCost,
      budgetAllocation,
      confidence: roadmap.metadata.confidence,
      generationMethod: roadmap.metadata.generationMethod, // 'template', 'template_validated', 'template_customized', 'claude_generated', or 'fallback'
      validationInsights: roadmap.metadata.validationInsights // Claude's explanation of customizations
    }
  };
}

async function handleGenerateDeepDive(input, context) {
  console.log('🧠 Generating intelligent deep dive with Claude...');
  console.log('📥 Input:', input);
  console.log('📥 Context:', context);

  // Import deep dive generator
  const { generateDeepDive } = await import('./deepDiveGenerator');

  // Generate base structure with templates
  const baseDeepDive = generateDeepDive({
    ...input,
    context
  });

  console.log('📦 Base deep dive generated:', Object.keys(baseDeepDive));

  try {
    // STEP 2: Call Claude to generate personalized, intelligent content
    console.log('🚀 Calling generatePersonalizedContent...');
    const personalizedContent = await generatePersonalizedContent(input, context);

    console.log('✅ Personalized content received:', Object.keys(personalizedContent));

    // Merge base structure with personalized content
    const enhancedDeepDive = {
      ...baseDeepDive,
      // Override with Claude's personalized content
      personalizedInsights: personalizedContent.insights,
      intelligentTips: personalizedContent.tips,
      riskAnalysis: personalizedContent.risks,
      smartSavings: personalizedContent.savings,
      coupleAdvice: personalizedContent.coupleAdvice,
      roadmapPhases: personalizedContent.roadmapPhases, // NEW: Luna-generated roadmap tree
      aiGenerated: true,
      generatedAt: new Date().toISOString()
    };

    console.log('✨ Enhanced deep dive with Claude intelligence:', {
      hasPersonalizedInsights: !!enhancedDeepDive.personalizedInsights,
      hasIntelligentTips: !!enhancedDeepDive.intelligentTips,
      hasRiskAnalysis: !!enhancedDeepDive.riskAnalysis,
      hasSmartSavings: !!enhancedDeepDive.smartSavings,
      hasCoupleAdvice: !!enhancedDeepDive.coupleAdvice,
      hasRoadmapPhases: !!enhancedDeepDive.roadmapPhases,
      phaseCount: enhancedDeepDive.roadmapPhases?.length || 0,
      aiGenerated: enhancedDeepDive.aiGenerated
    });

    // CRITICAL: Attach deep dive directly to the milestone in context
    // This eliminates the need for complex linking logic
    const milestoneId = input.milestone_id;
    if (milestoneId && context.milestones) {
      const milestone = context.milestones.find(m => m.id === milestoneId);
      if (milestone) {
        milestone.deep_dive_data = enhancedDeepDive;
        console.log('✅ Attached deep dive to milestone:', milestone.title);
        console.log('   Roadmap phases:', enhancedDeepDive.roadmapPhases?.length || 0);
      } else {
        console.warn('⚠️ Milestone not found for deep dive attachment:', milestoneId);
      }
    }

    return {
      success: true,
      deep_dive: enhancedDeepDive,
      milestone_id: milestoneId // Return for reference
    };
  } catch (error) {
    console.error('⚠️ Failed to generate personalized content, using base deep dive:', error);
    console.error('Error stack:', error.stack);

    // Fallback to base deep dive if Claude call fails
    // Also attach to milestone for consistency
    const milestoneId = input.milestone_id;
    if (milestoneId && context.milestones) {
      const milestone = context.milestones.find(m => m.id === milestoneId);
      if (milestone) {
        milestone.deep_dive_data = baseDeepDive;
        console.log('✅ Attached base deep dive to milestone (fallback):', milestone.title);
      }
    }

    return {
      success: true,
      deep_dive: baseDeepDive,
      milestone_id: milestoneId
    };
  }
}

/**
 * Generate personalized content using Claude
 * This is where the real intelligence happens
 */
async function generatePersonalizedContent(input, context) {
  console.log('🎯 generatePersonalizedContent called with:', { input, context });

  const { goal_type, budget, timeline_months, location, preferences } = input;
  const { partner1, partner2 } = context;

  console.log('📋 Extracted parameters:', {
    goal_type,
    budget,
    timeline_months,
    location,
    partner1,
    partner2,
    hasPreferences: !!preferences
  });

  // Extract actual conversation for context
  const conversationMessages = context.conversationMessages || [];
  const userMessages = conversationMessages
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join('\n');

  // Build a rich prompt for Claude with actual conversation context
  const prompt = `You are Luna, an AI planning assistant. Generate personalized insights based on the ACTUAL conversation with this couple.

COUPLE DETAILS:
- Partners: ${partner1} and ${partner2}
- Goal Type: ${goal_type}
- Budget: €${budget.toLocaleString()}
- Timeline: ${timeline_months} months
- Location: ${location}
- Preferences: ${JSON.stringify(preferences || {})}

ACTUAL CONVERSATION WITH USER:
${userMessages || 'No detailed conversation yet - use basic info above'}

CRITICAL INSTRUCTIONS:
- Base ALL insights on what the user ACTUALLY said in the conversation above
- Do NOT assume or invent details they didn't mention
- If they said they already have housing, don't suggest finding housing
- Confidence score should reflect how well-prepared THEY are based on THEIR statements
- Assessment should summarize THEIR specific situation, not generic advice
- Create a PERSONALIZED roadmap tree with 3-5 phases specific to THEIR unique situation
- Each phase should have contextual tips that reference THEIR specific budget, timeline, and location

Generate personalized content in JSON format:

{
  "insights": {
    "confidence": "High/Medium/Low - assess their readiness",
    "assessment": "2-3 sentences about their specific situation",
    "strength": "What's their biggest advantage?",
    "challenge": "What's their biggest obstacle?"
  },
  "roadmapPhases": [
    {
      "title": "Phase name (e.g., 'Financial Preparation', 'Venue Search')",
      "description": "What this phase is about, tailored to THEIR situation",
      "isCriticalPath": true/false,
      "isUnlocked": true/false,
      "duration": "Realistic duration based on THEIR timeline (e.g., '2-4 weeks')",
      "estimatedCost": 5000,
      "smartTips": [
        "Specific tip #1 that references THEIR budget/timeline/location",
        "Specific tip #2 personalized to THEIR constraints",
        "Specific tip #3 based on THEIR conversation"
      ],
      "dependencies": ["Previous phase name if any"]
    }
    // Generate 3-5 phases that logically break down THEIR journey
    // Example for apartment: Financial Prep → Property Search → Legal/Docs → Move-In
    // Example for wedding: Vision/Budget → Major Vendors → Details → Final Prep
    // CUSTOMIZE to what THEY actually said in conversation!
  ],
  "tips": [
    {
      "title": "Specific tip title",
      "content": "Personalized advice that references THEIR budget/timeline/location",
      "impact": "How this helps them specifically",
      "priority": "critical/high/medium"
    }
    // Generate 3-5 tips
  ],
  "risks": [
    {
      "risk": "Specific risk for THEIR situation",
      "probability": "high/medium/low",
      "impact": "What happens if this occurs",
      "mitigation": "How to prevent or handle it"
    }
    // Generate 3-4 risks
  ],
  "savings": [
    {
      "opportunity": "Way to save money or time",
      "amount": "Estimated savings in euros or time",
      "effort": "easy/medium/hard",
      "description": "How to implement this"
    }
    // Generate 3-4 savings opportunities
  ],
  "coupleAdvice": {
    "commonConflict": "What couples typically disagree on for this goal",
    "yourSituation": "How this might apply to them",
    "framework": "Decision-making approach for them",
    "checkIn": "Recommended discussion schedule"
  }
}

Make it conversational, reference their specific numbers, and feel like a friend who's helped hundreds of couples.`;

  // Call backend to get Claude's response
  console.log(`🌐 Fetching from ${BACKEND_URL}/api/claude-generate`);

  const response = await fetch(`${BACKEND_URL}/api/claude-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      systemPrompt: 'You are Luna, a warm and intelligent planning assistant. Generate personalized JSON content. IMPORTANT: Keep your response concise and complete - do not let it get truncated.',
      maxTokens: 4096,  // Increased from 2048 to allow full response
      temperature: 0.8
    })
  });

  console.log(`📡 Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Backend error response:', errorText);
    throw new Error(`Failed to generate personalized content: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('📦 Received data from backend:', { hasContent: !!data.content, contentLength: data.content?.length });

  // Parse Claude's JSON response
  try {
    let jsonContent = data.content;

    console.log('🔍 Raw content preview:', jsonContent.substring(0, 200));

    // Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
    if (jsonContent.includes('```')) {
      console.log('🔧 Stripping markdown code blocks...');
      // Remove opening ```json or ```
      jsonContent = jsonContent.replace(/^```(?:json)?\s*/i, '');
      // Remove closing ``` and everything after it
      const closingBacktickIndex = jsonContent.indexOf('```');
      if (closingBacktickIndex !== -1) {
        jsonContent = jsonContent.substring(0, closingBacktickIndex);
      }
      console.log('✂️ After stripping:', jsonContent.substring(0, 200));
    }

    // Extract just the JSON object (from first { to last })
    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
      console.log('📦 Extracted JSON object, length:', jsonContent.length);
    }

    const content = JSON.parse(jsonContent.trim());
    console.log('✅ Successfully parsed Claude-generated content:', Object.keys(content));
    return content;
  } catch (parseError) {
    console.error('❌ Failed to parse Claude response');
    console.error('Parse error:', parseError.message);
    console.error('Content that failed to parse:', data.content);
    throw new Error(`Invalid response format: ${parseError.message}`);
  }
}

async function handleFinalizeRoadmap(input, context) {
  try {
    // Import supabase services and auth
    const { createRoadmap, createMilestone, createTask } = await import('./supabaseService');
    const { supabase } = await import('../config/supabaseClient');

    console.log('💾 Finalizing roadmap - saving to database...');
    console.log('📊 Context data:', {
      partner1: context.partner1,
      partner2: context.partner2,
      location: context.location,
      goalType: context.goalType,
      milestonesCount: context.generatedMilestones?.length || 0
    });
    console.log('🔍 DEBUG: context.generatedMilestones:', context.generatedMilestones);

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('⚠️ No authenticated user - storing roadmap in context for UI display only');
      console.log('🔍 DEBUG: context.generatedMilestones exists?', !!context.generatedMilestones);
      console.log('🔍 DEBUG: context.generatedMilestones length:', context.generatedMilestones?.length);
      // GUEST USER MODE: Populate context.milestones for UI transition without database save
      if (context.generatedMilestones && context.generatedMilestones.length > 0) {
        context.milestones = context.generatedMilestones;
        context.roadmapComplete = true;
        context.roadmapTitle = input.roadmap_title;
        context.summary = input.summary;
        context.totalCost = input.total_cost;
        context.totalTimeline = input.total_timeline_months;

        console.log('✅ Copied generatedMilestones to context.milestones for UI transition (guest mode):', context.milestones.length);
        console.log('🔍 DEBUG: context.milestones after copy:', context.milestones);

        return {
          success: true,
          ready: true,
          guest_mode: true,
          roadmap_title: input.roadmap_title,
          summary: input.summary,
          total_cost: input.total_cost,
          total_timeline_months: input.total_timeline_months,
          milestones_count: context.generatedMilestones?.length || 0,
          message: `Roadmap "${input.roadmap_title}" created with ${context.generatedMilestones?.length || 0} milestones! (Sign in to save permanently)`
        };
      }
    }

    // Prepare roadmap data for database
    // ARCHITECTURE: Roadmap is a container for the couple's journey
    // Budget and timeline are stored PER MILESTONE (each goal has its own budget/timeline)
    // This allows isolated budget tracking per goal (no aggregation confusion)
    const roadmapData = {
      title: input.roadmap_title || context.goalDescription || 'Our Journey Together',
      partner1_name: context.partner1 || 'Partner 1',
      partner2_name: context.partner2 || 'Partner 2',
      location: context.location || null,
      xp_points: 0
      // Note: budget, timeline, goal_type, status are MILESTONE properties (saved below)
    };

    console.log('📝 Creating roadmap with data:', roadmapData);
    console.log('💰 Budget and timeline are saved per milestone for isolated tracking');

    // Create roadmap in database
    const { data: savedRoadmap, error: roadmapError } = await createRoadmap(roadmapData);

    if (roadmapError) {
      console.error('❌ Error creating roadmap:', roadmapError);
      throw new Error(`Failed to save roadmap: ${roadmapError.message}`);
    }

    if (!savedRoadmap) {
      throw new Error('Roadmap creation returned no data');
    }

    console.log('✅ Roadmap saved to database:', savedRoadmap.id);

    let totalTasksSaved = 0;

    // Save milestones and their tasks if they exist in context
    // CRITICAL: Use context.milestones (where generate_milestone stores them)
    // NOT context.generatedMilestones (old deprecated tool)
    const milestonesToSave = context.milestones || context.generatedMilestones || [];
    if (milestonesToSave.length > 0) {
      console.log(`📌 Saving ${milestonesToSave.length} milestones...`);

      for (let i = 0; i < milestonesToSave.length; i++) {
        const milestone = milestonesToSave[i];

        const milestoneData = {
          roadmap_id: savedRoadmap.id,
          title: milestone.title || `Milestone ${i + 1}`,
          description: milestone.description || '',
          icon: milestone.icon || '🎯',
          color: milestone.color || '#4F46E5',
          category: milestone.category || context.goalType || 'custom',
          estimated_cost: milestone.estimated_cost || milestone.estimatedCost || 0,
          duration: milestone.estimated_duration || milestone.duration || '1-2 weeks',
          ai_generated: true,
          deep_dive_data: milestone.deep_dive_data || milestone.deepDiveData || {},
          order_index: i,
          status: 'not_started'
        };

        const { data: savedMilestone, error: milestoneError } = await createMilestone(milestoneData);

        if (milestoneError) {
          console.error(`❌ Error saving milestone ${i + 1}:`, milestoneError);
          // Continue saving other milestones even if one fails
          continue;
        }

        console.log(`✅ Milestone ${i + 1} saved:`, savedMilestone.id);

        // Save tasks for this milestone
        const keyActions = milestone.key_actions || milestone.keyActions || [];

        if (keyActions.length > 0) {
          console.log(`  📋 Saving ${keyActions.length} tasks for milestone ${i + 1}...`);

          for (let j = 0; j < keyActions.length; j++) {
            const action = keyActions[j];

            // Handle both string and object formats
            const taskTitle = typeof action === 'string' ? action : action.title || action.name;
            const taskDescription = typeof action === 'object' ? action.description : '';
            const suggestedAssignee = typeof action === 'object' ? action.suggested_assignee : null;
            const estimatedTime = typeof action === 'object' ? action.estimated_time : null;

            const taskData = {
              milestone_id: savedMilestone.id,
              title: taskTitle || `Task ${j + 1}`,
              description: taskDescription || '',
              order_index: j,
              completed: false,
              ai_generated: true,
              assigned_to: suggestedAssignee || null,
              estimated_time: estimatedTime || null
            };

            const { data: savedTask, error: taskError } = await createTask(taskData);

            if (taskError) {
              console.error(`  ❌ Error saving task ${j + 1}:`, taskError);
              // Continue saving other tasks even if one fails
            } else {
              totalTasksSaved++;
              console.log(`  ✅ Task ${j + 1} saved:`, savedTask.id);
            }
          }
        }
      }

      console.log('✅ All milestones saved successfully');
      if (totalTasksSaved > 0) {
        console.log(`✅ Saved ${totalTasksSaved} tasks across all milestones`);
      }
    } else {
      console.warn('⚠️ No milestones found in context to save');
    }

    // Store roadmap ID in context for future use
    context.savedRoadmapId = savedRoadmap.id;

    return {
      success: true,
      ready: true,
      roadmap_id: savedRoadmap.id,
      roadmap_title: input.roadmap_title,
      summary: input.summary,
      total_cost: input.total_cost,
      total_timeline_months: input.total_timeline_months,
      milestones_count: milestonesToSave.length,
      tasks_count: totalTasksSaved,
      message: `Roadmap "${input.roadmap_title}" has been saved successfully with ${milestonesToSave.length} milestones and ${totalTasksSaved} tasks!`
    };

  } catch (error) {
    console.error('❌ Error in handleFinalizeRoadmap:', error);

    // Return error but don't crash the conversation
    return {
      success: false,
      ready: true,
      error: error.message,
      roadmap_title: input.roadmap_title,
      summary: input.summary,
      total_cost: input.total_cost,
      total_timeline_months: input.total_timeline_months,
      message: `Roadmap created but failed to save: ${error.message}. You can still view it in this session.`
    };
  }
}

async function handleTrackExpense(input, context) {
  // Import Financial Intelligence Agent
  const { trackExpense } = await import('./agents/financialIntelligenceAgent');

  // Get budget from context (roadmap budget allocation)
  const budget = context.budget || {};

  // Track the expense with intelligent analysis
  const result = trackExpense(input, budget);

  return {
    success: true,
    expense: result.expense,
    budgetStatus: result.budgetStatus,
    anomalies: result.anomalies,
    alerts: result.alerts,
    // Provide human-readable summary for Luna
    summary: `Tracked ${result.expense.category} expense of $${input.amount}. Budget status: ${result.budgetStatus.status}. ${result.alerts.length > 0 ? 'Alerts: ' + result.alerts.map(a => a.message).join('; ') : 'No alerts.'}`
  };
}

async function handleAnalyzeSavingsProgress(input, context) {
  // Import Financial Intelligence Agent
  const { analyzeSavingsProgress } = await import('./agents/financialIntelligenceAgent');

  // Analyze savings progress
  const goal = {
    targetAmount: input.target_amount,
    targetDate: input.target_date
  };

  const currentStatus = {
    currentAmount: input.current_amount || 0,
    monthlyContribution: input.monthly_contribution || 0
  };

  const result = analyzeSavingsProgress(goal, currentStatus);

  return {
    success: true,
    progress: result.progress,
    timeline: result.timeline,
    savings: result.savings,
    recommendations: result.recommendations,
    // Provide human-readable summary for Luna
    summary: `You're ${result.progress.progressPercentage}% toward your goal of $${input.target_amount}. ${result.progress.isOnTrack ? 'You\'re on track!' : `You need to save an additional $${result.savings.gap} per month to stay on track.`} ${result.recommendations.length > 0 ? result.recommendations[0].message : ''}`
  };
}

/**
 * Update context with tool results
 */
function updateContextFromToolResult(context, result) {
  if (result.extracted) {
    Object.assign(context, result.extracted);
  }

  if (result.milestone) {
    context.milestones = context.milestones || [];
    context.milestones.push(result.milestone);

    // CRITICAL FIX: Also keep generatedMilestones in sync
    // finalize_roadmap relies on generatedMilestones to know what to save
    context.generatedMilestones = context.generatedMilestones || [];
    context.generatedMilestones.push(result.milestone);
    console.log('✅ Added milestone to both context.milestones and context.generatedMilestones');
  }

  if (result.deep_dive) {
    context.deepDives = context.deepDives || [];
    context.deepDives.push(result.deep_dive);
  }

  // CRITICAL FIX: When roadmap is generated, populate generatedMilestones
  // This ensures finalize_roadmap has access to milestones for database save
  if (result.roadmap && result.roadmap.milestones) {
    context.generatedMilestones = result.roadmap.milestones;
    context.generatedRoadmap = result.roadmap;
    console.log('✅ Stored generated roadmap with', result.roadmap.milestones.length, 'milestones');
  }

  if (result.ready) {
    context.roadmapComplete = true;
    context.roadmapTitle = result.roadmap_title;
    context.summary = result.summary;
    context.totalCost = result.total_cost;
    context.totalTimeline = result.total_timeline_months;

    // CRITICAL FIX: Copy generatedMilestones to milestones for UI transition
    // When roadmap is finalized, ensure context.milestones is populated
    // so isRoadmapComplete() returns true and triggers view transition
    if (context.generatedMilestones && context.generatedMilestones.length > 0) {
      context.milestones = context.generatedMilestones;
      console.log('✅ Copied generatedMilestones to context.milestones for UI transition:', context.milestones.length);
    }
  }
}

/**
 * Check if roadmap is complete and ready
 */
export function isRoadmapComplete(context) {
  return context.roadmapComplete === true &&
         context.milestones &&
         context.milestones.length > 0;
}

/**
 * Get formatted roadmap data for TogetherForward component
 * CRITICAL: Links deep dives to their milestones
 */
export function getRoadmapData(context) {
  const milestones = context.milestones || [];
  const deepDives = context.deepDives || [];

  // Link deep dives to milestones by milestone_id
  const milestonesWithDeepDives = milestones.map(milestone => {
    // Find matching deep dive for this milestone
    const matchingDeepDive = deepDives.find(dd => dd.milestoneId === milestone.id);

    if (matchingDeepDive) {
      console.log(`✅ Linked deep dive to milestone: ${milestone.title}`);
      return {
        ...milestone,
        deepDiveData: matchingDeepDive  // CRITICAL: Attach deep dive to milestone
      };
    }

    console.log(`⚠️ No deep dive found for milestone: ${milestone.title}`);
    return milestone;
  });

  return {
    partner1: context.partner1 || 'Partner 1',
    partner2: context.partner2 || 'Partner 2',
    location: context.location || 'Unknown',
    milestones: milestonesWithDeepDives,  // Return linked milestones
    summary: context.summary,
    totalCost: context.totalCost,
    totalTimeline: context.totalTimeline
  };
}
