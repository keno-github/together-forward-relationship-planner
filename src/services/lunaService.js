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

const BACKEND_URL = ''; // Use proxy - relative URLs

/**
 * System prompt that defines Luna's role and behavior
 * Keep it concise - Claude is smart enough to understand
 */
const LUNA_SYSTEM_PROMPT = `You are Luna, an AI planning assistant for couples planning their future together.

YOUR MISSION:
Help couples create realistic, actionable roadmaps for their goals (wedding, home, baby, travel, etc.)

CONVERSATION STYLE:
- Warm, supportive, conversational (like a helpful friend)
- Ask clarifying questions naturally - don't interrogate
- Celebrate their goals ("That's exciting!", "I love that!")
- Handle "what if" scenarios enthusiastically
- Build on previous answers, don't repeat questions

WORKFLOW:
1. Get partner names casually
2. Ask location (needed for accurate costs)
3. Discover their goals through conversation
4. For each goal, learn: timeline, budget, key preferences
5. Use tools to generate milestones and deep dive data
6. Finalize when you have 1-3 complete milestones

TOOL USAGE:
- Call extract_user_data() as soon as you learn names/location
- Call generate_milestone() when you have: goal type + budget + timeline
- Call generate_deep_dive() right after creating a milestone
- Call finalize_roadmap() when all milestones are complete

Be conversational between tool calls - explain what you're creating!`;

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
    description: "Generate a complete milestone object with tasks, costs, and timeline. Call when you have goal type, budget, and timeline.",
    input_schema: {
      type: "object",
      properties: {
        goal_type: {
          type: "string",
          enum: ["wedding", "engagement", "home", "baby", "travel", "career", "education", "financial"],
          description: "Type of goal"
        },
        title: {
          type: "string",
          description: "Descriptive title (e.g., 'Plan Dream Wedding', 'Buy First Home')"
        },
        description: {
          type: "string",
          description: "Brief description incorporating user preferences"
        },
        timeline_months: {
          type: "number",
          description: "Timeline in months"
        },
        budget: {
          type: "number",
          description: "Budget in euros"
        },
        location: {
          type: "string",
          description: "Location for cost calculations"
        },
        preferences: {
          type: "object",
          description: "User preferences (size, style, must-haves, etc.)",
          properties: {
            size: { type: "string" },
            style: { type: "string" },
            priorities: { type: "array", items: { type: "string" } }
          }
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
      required: ["summary"]
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
  console.log('🔧 Claude wants to use a tool');

  // Find the tool use request in Claude's response
  const toolUse = data.content.find(c => c.type === 'tool_use');
  if (!toolUse) {
    throw new Error('Tool use indicated but no tool found in response');
  }

  console.log(`📞 Calling tool: ${toolUse.name}`, toolUse.input);

  // Execute the tool
  const toolResult = await executeToolCall(toolUse.name, toolUse.input, context);

  // Update context with any extracted/generated data
  updateContextFromToolResult(context, toolResult);

  // Continue conversation with tool result
  const continueMessages = [
    ...messages,
    { role: 'assistant', content: data.content },
    {
      role: 'user',
      content: [{
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(toolResult)
      }]
    }
  ];

  // Recursive call to get Claude's response after tool execution
  return converseWithLuna(continueMessages, context);
}

/**
 * Execute tool calls from Claude
 * Routes to appropriate handler
 */
async function executeToolCall(toolName, input, context) {
  switch(toolName) {
    case 'extract_user_data':
      return handleExtractUserData(input);

    case 'generate_milestone':
      return await handleGenerateMilestone(input, context);

    case 'generate_deep_dive':
      return await handleGenerateDeepDive(input, context);

    case 'finalize_roadmap':
      return handleFinalizeRoadmap(input, context);

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

function handleExtractUserData(input) {
  return {
    success: true,
    extracted: {
      partner1: input.partner1,
      partner2: input.partner2 || null,
      location: input.location || null
    }
  };
}

async function handleGenerateMilestone(input, context) {
  // Import milestone generator
  const { generateMilestone } = await import('./milestoneGenerator');

  const milestone = generateMilestone({
    ...input,
    context
  });

  return {
    success: true,
    milestone,
    milestone_id: milestone.id
  };
}

async function handleGenerateDeepDive(input, context) {
  // Import deep dive generator
  const { generateDeepDive } = await import('./deepDiveGenerator');

  const deepDive = generateDeepDive({
    ...input,
    context
  });

  return {
    success: true,
    deep_dive: deepDive
  };
}

function handleFinalizeRoadmap(input, context) {
  return {
    success: true,
    ready: true,
    summary: input.summary,
    total_cost: input.total_cost,
    total_timeline_months: input.total_timeline_months
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
 */
export function getRoadmapData(context) {
  return {
    partner1: context.partner1 || 'Partner 1',
    partner2: context.partner2 || 'Partner 2',
    location: context.location || 'Unknown',
    milestones: context.milestones || [],
    deepDives: context.deepDives || [],
    summary: context.summary,
    totalCost: context.totalCost,
    totalTimeline: context.totalTimeline
  };
}
