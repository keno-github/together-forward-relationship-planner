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
      aiGenerated: true,
      generatedAt: new Date().toISOString()
    };

    console.log('✨ Enhanced deep dive with Claude intelligence:', {
      hasPersonalizedInsights: !!enhancedDeepDive.personalizedInsights,
      hasIntelligentTips: !!enhancedDeepDive.intelligentTips,
      hasRiskAnalysis: !!enhancedDeepDive.riskAnalysis,
      hasSmartSavings: !!enhancedDeepDive.smartSavings,
      hasCoupleAdvice: !!enhancedDeepDive.coupleAdvice,
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

  // Build a rich prompt for Claude with all context
  const prompt = `You are Luna, an AI planning assistant. Based on this couple's situation, generate personalized advice.

COUPLE DETAILS:
- Partners: ${partner1} and ${partner2}
- Goal: ${goal_type}
- Budget: €${budget.toLocaleString()}
- Timeline: ${timeline_months} months
- Location: ${location}
- Preferences: ${JSON.stringify(preferences || {})}

CONVERSATION CONTEXT:
${context.conversationSummary || 'First time planning this goal'}

Generate personalized content in JSON format:

{
  "insights": {
    "confidence": "High/Medium/Low - assess their readiness",
    "assessment": "2-3 sentences about their specific situation",
    "strength": "What's their biggest advantage?",
    "challenge": "What's their biggest obstacle?"
  },
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
