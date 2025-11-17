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

APPROACH:
- Listen to their EXACT goal description
- Use their actual words to categorize the goal (don't force it into predefined boxes)
- Think about what journey stages make sense for THEIR specific goal
- Generate a roadmap that takes them from where they are NOW to achieving THAT goal
Track expenses, monitor budgets, and provide intelligent financial insights throughout their journey.

CONVERSATION STYLE:
- Warm, supportive, conversational (like a helpful friend)
- Ask only 2-3 essential questions MAX per milestone
- Extract information intelligently from conversation (budget hints, timeline clues)
- Celebrate their goals ("That's exciting!", "I love that!")
- Build on previous answers, don't repeat questions
- NEVER assume their goal - if they say "moving to Augsburg, Germany", use THAT exact location
- LISTEN carefully and use their EXACT words for titles and descriptions
- Be concise - users want quick roadmaps, not long interviews

WORKFLOW (Keep it SHORT):
1. Get partner names + location in first exchange
2. Ask about their goal(s) in THEIR OWN WORDS
   - If they mention MULTIPLE goals → acknowledge ALL of them
   - Example: "get married in 6 months, have baby in 24 months, buy car in 18 months"
3. If multiple goals detected:
   - Acknowledge all goals and timelines
   - Ask for budget for EACH goal separately OR total combined budget
   - Call create_multi_goal_plan() to orchestrate all goals together
4. If single goal:
   - Ask ONLY: timeline + budget
   - Call generate_intelligent_roadmap() once
5. Finalize when complete

MULTI-GOAL INTELLIGENCE:
- DETECT when users mention multiple goals in one message
- Common patterns: "and", "also", "then", multiple timelines mentioned
- Example: "I want to X in N months and Y in M months" = 2 GOALS
- Create coordinated plan that handles timeline conflicts and dependencies

TOOL USAGE:
- Call extract_user_data() ONCE when you learn names/location
- FOR MULTIPLE GOALS: Call create_multi_goal_plan() with array of all goals
  → Automatically handles timeline conflicts, dependencies, resource allocation
  → Returns orchestrated plan for all goals
- FOR SINGLE GOAL: Call generate_intelligent_roadmap() with goal details
  → Generates complete multi-stage roadmap
- Call finalize_roadmap() ONCE when all roadmaps are ready
- Call track_expense() when user mentions spending money
- Call analyze_savings_progress() when user asks about financial progress

LEGACY TOOLS (avoid if possible):
- generate_milestone() - OLD single milestone tool
- generate_deep_dive() - Built into intelligent roadmap now

INTELLIGENT FEATURES:
- Extract budget/timeline hints from casual conversation ("We're saving $500/month", "by next summer")
- Auto-categorize expenses (e.g., "bought wedding dress" → attire category)
- Detect budget anomalies (large expenses, duplicates, over-budget alerts)
- Provide savings recommendations based on progress and timeline
- Generate context-aware roadmaps that adapt to user constraints

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
    name: "create_multi_goal_plan",
    description: "Create a coordinated plan for MULTIPLE goals simultaneously. Use this when user mentions 2+ goals with different timelines. This intelligently orchestrates timeline conflicts, dependencies, and resource allocation across all goals.",
    input_schema: {
      type: "object",
      properties: {
        goals: {
          type: "array",
          description: "Array of goals with their details",
          items: {
            type: "object",
            properties: {
              goal_description: { type: "string", description: "Goal in user's words" },
              timeline_months: { type: "number", description: "Timeline in months" },
              budget: { type: "number", description: "Budget for this goal" },
              priority: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Goal priority" }
            },
            required: ["goal_description", "timeline_months"]
          },
          minItems: 2
        },
        location: {
          type: "string",
          description: "Location for all goals"
        },
        total_budget: {
          type: "number",
          description: "Total combined budget (optional if individual budgets provided)"
        }
      },
      required: ["goals", "location"]
    }
  },
  {
    name: "generate_intelligent_roadmap",
    description: "Generate a complete journey roadmap for a SINGLE goal using AI. For multiple goals, use create_multi_goal_plan instead.",
    input_schema: {
      type: "object",
      properties: {
        goal_description: {
          type: "string",
          description: "The user's goal in their own words (e.g., 'Buy a 2-bedroom apartment in Berlin', 'Learn to play guitar', 'Start a bakery business')"
        },
        budget: {
          type: "number",
          description: "Total budget available"
        },
        timeline_months: {
          type: "number",
          description: "Timeline in months"
        },
        location: {
          type: "string",
          description: "Location (for cost calculations and local context)"
        },
        preferences: {
          type: "array",
          description: "User preferences as array of strings",
          items: { type: "string" }
        },
        constraints: {
          type: "array",
          description: "Any constraints (time, budget, etc.)",
          items: {
            type: "object",
            properties: {
              type: { type: "string" }
            }
          }
        }
      },
      required: ["goal_description", "budget", "timeline_months"]
    }
  },
  {
    name: "generate_milestone",
    description: "LEGACY: Generate a single milestone. Use generate_intelligent_roadmap instead for complete journey planning.",
    input_schema: {
      type: "object",
      properties: {
        goal_type: {
          type: "string",
          description: "A short category label for the goal type"
        },
        title: {
          type: "string",
          description: "Descriptive title"
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

    case 'create_multi_goal_plan':
      return await handleCreateMultiGoalPlan(input, context);

    case 'generate_intelligent_roadmap':
      return await handleGenerateIntelligentRoadmap(input, context);

    case 'generate_milestone':
      return await handleGenerateMilestone(input, context);

    case 'generate_deep_dive':
      return await handleGenerateDeepDive(input, context);

    case 'finalize_roadmap':
      return handleFinalizeRoadmap(input, context);

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
    orchestration = await analyzeMultiGoalWithAI(roadmaps, input.total_budget, input.location);
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

    return {
      success: true,
      deep_dive: enhancedDeepDive
    };
  } catch (error) {
    console.error('⚠️ Failed to generate personalized content, using base deep dive:', error);
    console.error('Error stack:', error.stack);
    // Fallback to base deep dive if Claude call fails
    return {
      success: true,
      deep_dive: baseDeepDive
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

function handleFinalizeRoadmap(input, context) {
  return {
    success: true,
    ready: true,
    roadmap_title: input.roadmap_title,
    summary: input.summary,
    total_cost: input.total_cost,
    total_timeline_months: input.total_timeline_months
  };
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
  }

  if (result.deep_dive) {
    context.deepDives = context.deepDives || [];
    context.deepDives.push(result.deep_dive);
  }

  if (result.ready) {
    context.roadmapComplete = true;
    context.roadmapTitle = result.roadmap_title;
    context.summary = result.summary;
    context.totalCost = result.total_cost;
    context.totalTimeline = result.total_timeline_months;
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
