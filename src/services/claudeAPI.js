// Claude API Service (via backend proxy to avoid CORS)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const USE_BACKEND = true; // Set to false to use direct API calls (will fail due to CORS)

/**
 * Call Claude API with conversation history
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options (systemPrompt, maxTokens, etc.)
 */
export const callClaude = async (messages, options = {}) => {
  const {
    systemPrompt = "You are Luna, an empathetic and intelligent AI relationship advisor. You help couples plan their future together by understanding their dreams, asking thoughtful follow-up questions, and providing personalized guidance.",
    maxTokens = 1024,
    temperature = 1.0
  } = options;

  console.log('🤖 Luna: Calling Claude API via backend...', {
    backend: BACKEND_URL,
    messageCount: messages.length,
    systemPrompt: systemPrompt.substring(0, 50) + '...'
  });

  try {
    // Call backend proxy (avoids CORS issues)
    const response = await fetch(`${BACKEND_URL}/api/claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        systemPrompt: systemPrompt,
        maxTokens: maxTokens,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Backend error:', error);
      throw new Error(`Backend error: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Luna: Real AI response received!', {
      responseLength: data.text.length
    });
    return data.text;
  } catch (error) {
    console.error('❌ Error calling backend:', error.message);
    console.warn('⚠️  Is backend running? Start it with: npm run backend');
    console.warn('⚠️  Falling back to mock responses (limited intelligence)');
    // Fallback to mock response
    return await mockClaudeResponse(messages);
  }
};

/**
 * Mock Claude response for development/fallback
 * This tracks conversation context to provide intelligent follow-ups
 * NOTE: This is a FALLBACK with limited intelligence - for full AI, fix Claude API connection
 */
const mockClaudeResponse = async (messages) => {
  console.warn('⚠️  Using MOCK response - Luna has limited intelligence in this mode');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

  // Get full conversation history to track context
  const fullConversation = messages.map(m => m.content.toLowerCase()).join(' ');

  // More intelligent mock responses
  if (messages.length === 1) {
    return "✨ Welcome! I'm Luna, your personal AI relationship advisor.\n\n" +
      "I'm here to help you transform your dreams into reality - whether that's planning your dream wedding, buying your first home together, starting a family, taking that perfect vacation, or building your financial future.\n\n" +
      "💕 The beautiful thing? You don't have to choose just one! I can help you plan multiple goals at once and create a comprehensive roadmap for your journey together.\n\n" +
      "Let's start by getting to know each other:\n" +
      "• What are your names?\n" +
      "• What goals are you most excited to work towards together?\n\n" +
      "Tell me about your dreams - I'm here to listen and guide you every step of the way! 🌟";
  }

  // Detect ALL topics from conversation history, not just one
  const isAboutWedding = fullConversation.includes('marr') || fullConversation.includes('wedding') || fullConversation.includes('engaged');
  const isAboutVacation = fullConversation.includes('vacation') || fullConversation.includes('travel') || fullConversation.includes('trip');
  const isAboutHome = fullConversation.includes('house') || fullConversation.includes('home') || fullConversation.includes('property') || fullConversation.includes('buy') && fullConversation.includes('place');
  const isAboutFamily = fullConversation.includes('family') || fullConversation.includes('baby') || fullConversation.includes('child') || fullConversation.includes('kid');
  const isAboutSavings = fullConversation.includes('sav') || fullConversation.includes('money') || fullConversation.includes('financial');

  // Count how many goals they've mentioned
  const goalCount = [isAboutWedding, isAboutVacation, isAboutHome, isAboutFamily, isAboutSavings].filter(Boolean).length;

  // IMPORTANT: Check context-aware follow-ups FIRST before asking initial questions
  // This prevents re-asking questions when the user is already providing answers
  if (isAboutWedding) {
    // They're discussing wedding details
    const hasTimeline = fullConversation.match(/\d+\s*(year|month|week)/);
    const hasSize = fullConversation.includes('intimate') || fullConversation.includes('small') || fullConversation.includes('big') || fullConversation.includes('large');
    const hasBudget = fullConversation.includes('budget') || fullConversation.match(/\$|€|£/);
    const hasPriorities = fullConversation.includes('venue') || fullConversation.includes('photography') || fullConversation.includes('photo');

    // Check if they've provided enough info
    if (hasTimeline && hasSize && hasPriorities) {
      let summary = "Perfect! I'm getting a clear picture of your dream wedding. 💕\n\nBased on what you've told me:\n• Timeline: " +
        (fullConversation.match(/\d+\s*years?/) ? fullConversation.match(/\d+\s*years?/)[0] : "flexible") + "\n" +
        "• Style: Intimate celebration\n" +
        "• Priorities: Venue & Photography\n\n";

      // If they have multiple goals, mention them
      if (goalCount > 1) {
        const goals = [];
        if (isAboutWedding) goals.push("Wedding");
        if (isAboutVacation) goals.push("Dream Vacation");
        if (isAboutHome) goals.push("Home Purchase");
        if (isAboutFamily) goals.push("Starting a Family");
        if (isAboutSavings) goals.push("Financial Planning");

        summary += "I also see you're interested in: " + goals.filter(g => g !== "Wedding").join(", ") + "\n\n" +
          "This is wonderful! I can create personalized roadmaps for ALL your goals, showing you how to achieve them together.\n\n" +
          "Ready to see your custom roadmap? Or would you like to add any more details about your other goals?";
      } else {
        summary += "This is wonderful information! I can help you create a detailed roadmap with realistic costs and timelines.\n\n" +
          "Would you like me to generate your custom wedding planning roadmap now, or is there anything else you'd like to add?";
      }

      return summary;
    }

    // If NO info collected yet, this is first mention - ask all questions at once
    if (!hasTimeline && !hasSize && !hasPriorities) {
      if (goalCount > 1) {
        return "Wonderful! I see you're interested in multiple goals including your wedding! 💍\n\nLet's start with the wedding. Tell me:\n\n• When are you hoping to get married?\n• What size wedding are you imagining? (intimate gathering or big celebration?)\n• Do you have a budget in mind?\n• What's most important to you? (venue, photography, guest experience?)\n\nAfter we discuss the wedding, we can dive into your other goals too!";
      }
      return "Congratulations on planning your wedding! 💍\n\nLet's make sure we create something perfect for YOU both. Tell me:\n\n• When are you hoping to get married?\n• What size wedding are you imagining? (intimate gathering or big celebration?)\n• Do you have a budget in mind?\n• What's most important to you? (venue, photography, guest experience?)\n\nI want to understand your vision!";
    }

    // We have some info but not all - ask for specific missing details
    if (!hasTimeline) {
      return "Great start! When are you hoping to tie the knot? Having a timeline will help me give you the most accurate planning roadmap.";
    }
    if (!hasSize) {
      return "Thanks for sharing! How many guests are you thinking? This really helps with budgeting and venue selection.";
    }
    if (!hasPriorities) {
      return "Wonderful! What aspects of the wedding are most important to you both? For example: the venue, photography, food, music, or the overall guest experience?";
    }

    // Acknowledge their input and ask for more
    if (goalCount > 1) {
      return "I love hearing about your vision! I see you have multiple dreams you're working toward. Tell me more about any of your goals - I'm here to help with all of them!";
    }
    return "I love hearing about your vision! Tell me more - what other details have you been dreaming about for your special day?";
  }

  if (isAboutVacation) {
    const hasDestination = fullConversation.includes('beach') || fullConversation.includes('europe') || fullConversation.includes('asia') || fullConversation.match(/paris|italy|japan|hawaii|caribbean/);
    const hasTimeline = fullConversation.match(/\d+\s*(year|month|week)/);

    if (hasDestination && hasTimeline) {
      if (goalCount > 1) {
        const goals = [];
        if (isAboutWedding) goals.push("Wedding");
        if (isAboutVacation) goals.push("Dream Vacation");
        if (isAboutHome) goals.push("Home Purchase");
        if (isAboutFamily) goals.push("Starting a Family");
        if (isAboutSavings) goals.push("Financial Planning");

        return "This sounds like an amazing trip! 🌴\n\nI see you're planning multiple exciting milestones: " + goals.join(", ") + "\n\n" +
          "I can create personalized roadmaps for all of them, showing you realistic timelines and budgets for each goal.\n\n" +
          "Ready to see your complete roadmap?";
      }
      return "This sounds like an amazing trip! I'm excited to help you plan it. 🌴\n\nWould you like me to create a personalized roadmap with budgets, timelines, and tips for your dream vacation?";
    }

    // First mention of vacation - ask all questions
    if (!hasDestination && !hasTimeline) {
      if (goalCount > 1) {
        return "A dream vacation - love it! ✈️ And I see you have other goals in mind too.\n\nFor the vacation, tell me:\n\n• Where are you dreaming of going?\n• What time of year are you thinking?\n• What's your rough budget?\n• What kind of experience do you want? (relaxation, adventure, culture?)\n\nWe'll tackle your other goals next!";
      }
      return "A dream vacation - how exciting! ✈️\n\nTo help you plan this perfectly, I'd love to know more:\n\n• Where are you dreaming of going? (beach paradise, European cities, adventure destination?)\n• What time of year are you thinking?\n• What's your rough budget?\n• What kind of experience do you want? (relaxation, adventure, culture, romance?)\n\nTell me what speaks to you!";
    }

    return "That sounds exciting! What's drawing you to this destination? And do you have a timeframe in mind?";
  }

  if (isAboutHome) {
    const hasLocation = fullConversation.includes('neighborhood') || fullConversation.includes('area') || fullConversation.includes('city');
    const hasPrice = fullConversation.match(/\$|€|£/) || fullConversation.includes('budget') || fullConversation.includes('price');

    // First mention - ask comprehensive questions
    if (!hasLocation && !hasPrice) {
      if (goalCount > 1) {
        return "Buying a home - such an exciting milestone! 🏠 I see you have a few dreams you're working toward.\n\nFor the home, let me know:\n\n• Where are you looking to buy?\n• What's your budget or target price range?\n• What's your must-have list? (bedrooms, location, yard?)\n• When are you hoping to move in?\n\nWe'll create roadmaps for all your goals!";
      }
      return "Buying your first home together - such an exciting milestone! 🏠\n\nLet me help you navigate this. I'm curious:\n\n• Where are you looking to buy?\n• What's your budget or target price range?\n• What's your must-have list? (bedrooms, location, yard?)\n• When are you hoping to move in?\n\nThe more I know, the better I can guide you!";
    }

    // Follow-up if some info collected
    if (goalCount > 1) {
      return "Home buying is such a big step! 🏠 I see you have multiple goals in mind - that's smart planning!\n\nFor the home: Have you started looking at specific neighborhoods or price ranges yet?";
    }
    return "Home buying is such a big step! Have you started looking at specific neighborhoods or price ranges yet?";
  }

  if (isAboutFamily) {
    const hasTimeline = fullConversation.match(/\d+\s*(year|month|week)/);
    const hasConcerns = fullConversation.includes('concern') || fullConversation.includes('worry') || fullConversation.includes('prepare');

    // First mention
    if (!hasTimeline && !hasConcerns) {
      if (goalCount > 1) {
        return "Starting a family is beautiful! 👶 And I see you're thinking about other life goals too - love the holistic approach!\n\nFor the family planning, tell me:\n\n• When are you hoping to start?\n• What concerns or questions do you have?\n• How are you preparing?\n\nI'm here to help with all your dreams!";
      }
      return "Starting a family is such a beautiful journey! 👶\n\nTo help you prepare, I'd love to know:\n\n• When are you hoping to start?\n• What concerns or questions do you have?\n• Are you preparing anything specific (financially, home setup, etc.)?\n\nLet's make sure you're ready for this amazing step!";
    }

    // Follow-up
    if (goalCount > 1) {
      return "Starting a family is beautiful! 👶 And I see you're thinking about other life goals too - love the holistic approach!\n\nWhat stage are you at in this journey, and what questions or concerns do you have?";
    }
    return "Starting a family is beautiful! What stage are you at in this journey, and what questions or concerns do you have?";
  }

  // Default: encourage them to share their goals
  if (messages.length <= 3) {
    return "Tell me more! What brings you here today? What are you hoping to achieve together? 💕";
  }

  // Generic follow-up
  return "I'm listening! What else would you like to share about your goals and dreams?";
};

/**
 * Generate Luna's response during onboarding
 */
export const getLunaOnboardingResponse = async (conversationHistory, userContext = {}) => {
  const systemPrompt = `You are Luna, an empathetic AI relationship advisor helping couples plan their future together.

CONTEXT:
- Location: ${userContext.location || 'Unknown'}
- Conversation stage: ${conversationHistory.length === 0 ? 'Initial greeting' : 'Building rapport'}

YOUR ROLE:
1. Ask thoughtful, open-ended questions
2. Show genuine interest in their dreams - ALL of them
3. Dig deeper with follow-ups when they mention goals
4. Build a complete picture before offering solutions
5. Be warm, encouraging, and never judgmental
6. SUPPORT MULTIPLE GOALS - couples can plan several milestones at once!

CONVERSATION GUIDELINES:
- Start with a beautiful, polished welcome that invites them to share ALL their goals
- Learn their names first
- Encourage them to share MULTIPLE goals if they have them (wedding, home, vacation, family, etc.)
- When they mention goal(s), ask specific follow-up questions:
  * For vacation: WHERE, WHEN, BUDGET, TYPE of experience
  * For wedding: DATE, SIZE, BUDGET, PRIORITIES
  * For home: LOCATION, BUDGET, MUST-HAVES, TIMELINE
  * For family: TIMELINE, CONCERNS, PREPARATIONS
  * For savings: AMOUNT, PURPOSE, TIMELINE
- If they mention multiple goals, acknowledge ALL of them and let them know you'll help with each one
- Build understanding before offering to create roadmaps (plural if multiple goals)
- Keep responses conversational, not prescriptive
- Use emojis sparingly and naturally

IMPORTANT NOTES:
- Emphasize that they DON'T have to choose just one goal - you can create multiple roadmaps
- Only mention location-specific research AFTER understanding their goals and IF relevant
- When enough information is gathered, offer to create personalized roadmaps for ALL their goals

WELCOME MESSAGE STYLE:
Your initial greeting should be warm, inviting, polished, and make it clear that you can help with multiple life goals simultaneously.`;

  return await callClaude(conversationHistory, {
    systemPrompt,
    maxTokens: 512,
    temperature: 1.0
  });
};

/**
 * Generate Luna's response during Deep Dive chat
 */
export const getLunaDeepDiveResponse = async (conversationHistory, context = {}) => {
  const { milestone, userGoals, location, partner1, partner2 } = context;

  const systemPrompt = `You are Luna, helping ${partner1} and ${partner2} with their goal: "${milestone?.title}".

CONTEXT:
- Their goals: ${userGoals?.join(', ') || 'Not specified'}
- Location: ${location || 'Unknown'}
- Current focus: ${milestone?.title || 'General planning'}
- Budget: ${milestone?.estimatedCost ? '€' + milestone.estimatedCost.toLocaleString() : 'Not set'}

YOUR ROLE:
- Provide specific, actionable advice for this milestone
- Reference their personal situation
- Be encouraging but realistic
- Suggest concrete next steps
- Answer questions with detail and context

Keep responses concise (2-3 paragraphs max) and actionable.`;

  return await callClaude(conversationHistory, {
    systemPrompt,
    maxTokens: 800,
    temperature: 0.8
  });
};

/**
 * Extract structured data from conversation
 */
export const extractUserDataFromConversation = async (conversationHistory) => {
  const systemPrompt = `You are a data extraction assistant. Analyze the conversation and extract structured information.

Extract and return ONLY a JSON object with these fields (use null if not found):
{
  "partner1": "first name mentioned",
  "partner2": "second name mentioned",
  "goals": ["array of goals - use EXACTLY these strings: 'Get Married', 'Get Engaged', 'Buy a Home', 'Start a Family', 'Dream Vacation', 'Build Savings'"],
  "goalDetails": {
    "vacation": { "destination": "", "budget": "", "timeframe": "", "type": "" },
    "wedding": { "date": "", "size": "", "budget": "", "priorities": [] },
    "home": { "location": "", "budget": "", "mustHaves": [], "timeline": "" },
    "family": { "timeline": "", "concerns": [], "preparations": [] },
    "savings": { "amount": "", "purpose": "", "timeline": "" }
  },
  "budget": "overall budget mentioned",
  "timeline": "overall timeline mentioned",
  "priorities": ["what matters most to them"]
}

IMPORTANT:
- The "goals" array should contain multiple goals if mentioned (e.g., ["Get Married", "Buy a Home", "Dream Vacation"])
- Use the EXACT strings listed above for goal names
- Extract ALL goals mentioned in the conversation, not just one`;

  const conversationText = conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const extractionMessages = [
    { role: 'user', content: `Extract data from this conversation:\n\n${conversationText}\n\nReturn only the JSON object, no other text.` }
  ];

  try {
    const response = await callClaude(extractionMessages, {
      systemPrompt,
      maxTokens: 1024,
      temperature: 0.3
    });

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // If JSON parsing fails, use fallback extraction
    console.warn('JSON extraction failed, using fallback parser');
    return fallbackExtraction(conversationHistory);
  } catch (error) {
    console.error('Error extracting user data:', error);
    // Use fallback extraction
    return fallbackExtraction(conversationHistory);
  }
};

/**
 * Fallback extraction when API fails
 * Manually parses conversation to extract basic data
 */
const fallbackExtraction = (conversationHistory) => {
  const conversationText = conversationHistory
    .map(msg => msg.content)
    .join(' ')
    .toLowerCase();

  // Extract goals
  const goals = [];
  if (conversationText.includes('marr') || conversationText.includes('wedding')) {
    goals.push('Get Married');
  }
  if (conversationText.includes('engaged') || conversationText.includes('engagement')) {
    goals.push('Get Engaged');
  }
  if (conversationText.includes('home') || conversationText.includes('house') || conversationText.includes('property')) {
    goals.push('Buy a Home');
  }
  if (conversationText.includes('family') || conversationText.includes('baby') || conversationText.includes('child')) {
    goals.push('Start a Family');
  }
  if (conversationText.includes('vacation') || conversationText.includes('travel') || conversationText.includes('trip')) {
    goals.push('Dream Vacation');
  }
  if (conversationText.includes('sav') || conversationText.includes('money') || conversationText.includes('financial')) {
    goals.push('Build Savings');
  }

  // Try to extract names from early messages
  let partner1 = null;
  let partner2 = null;

  // Look in first few user messages for names
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  if (userMessages.length > 0) {
    const firstUserMsg = userMessages[0].content;
    // Simple name extraction - look for "I'm X" or "My name is X" or "X and Y"
    const namePatterns = [
      /(?:i'm|i am|my name is)\s+([A-Z][a-z]+)/i,
      /([A-Z][a-z]+)\s+and\s+([A-Z][a-z]+)/i,
      /^([A-Z][a-z]+)\s+&\s+([A-Z][a-z]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = firstUserMsg.match(pattern);
      if (match) {
        partner1 = match[1];
        partner2 = match[2] || match[1]; // Use same name if only one found
        break;
      }
    }
  }

  // If no names found, use defaults
  if (!partner1) {
    partner1 = 'Partner 1';
    partner2 = 'Partner 2';
  }

  return {
    partner1,
    partner2,
    goals: goals.length > 0 ? goals : ['Get Married'], // Default to wedding if nothing detected
    goalDetails: {},
    budget: null,
    timeline: null,
    priorities: []
  };
};

export default {
  callClaude,
  getLunaOnboardingResponse,
  getLunaDeepDiveResponse,
  extractUserDataFromConversation
};
