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

    // Check if they've provided enough info for initial summary
    if (hasTimeline && hasSize && hasPriorities) {
      let summary = "Perfect! I'm getting a clear picture of your dream wedding. 💕\n\nBased on what you've shared:\n• Timeline: " +
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
          "That's wonderful. Is there anything else you'd love to add about any of these goals, or shall we start building your personalized roadmap?";
      } else {
        summary += "That's wonderful. Is there anything else you'd love to add, or shall we start building your personalized roadmap?";
      }

      return summary;
    }

    // If NO info collected yet, this is first mention - ask conversationally
    if (!hasTimeline && !hasSize && !hasPriorities) {
      if (goalCount > 1) {
        return "Wonderful! I see you're interested in multiple goals including your wedding! 💍 Let's start there.\n\nWhen are you thinking about getting married?";
      }
      return "Congratulations on planning your wedding! 💍 That's so exciting.\n\nWhen are you thinking about tying the knot?";
    }

    // We have some info but not all - ask conversationally for missing details
    if (!hasTimeline) {
      return "I love that! When are you hoping to tie the knot?";
    }
    if (!hasSize) {
      return "Beautiful! And are you picturing something intimate or a bigger celebration?";
    }
    if (!hasPriorities) {
      return "Got it! What matters most to you both when you picture that day? Is it the venue, the photography, the experience for your guests?";
    }

    // Acknowledge their input naturally (they're adding more details)
    if (goalCount > 1) {
      return "I love that! I'll make sure to include that in your plan. Anything else you'd like to add?";
    }
    return "Got it, adding that to your plan! Is there anything else you'd love to mention?";
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
  // Build compatibility context if available
  let compatibilityContext = '';
  if (userContext.compatibilityData) {
    const { alignmentScore, categoryScores, strongAlignments, misalignments, partner1Name, partner2Name } = userContext.compatibilityData;

    compatibilityContext = `
COMPATIBILITY ASSESSMENT COMPLETED:
- Overall Alignment: ${alignmentScore}%
- Partners: ${partner1Name} & ${partner2Name}
- Category Scores: ${Object.entries(categoryScores).map(([cat, score]) => `${cat}: ${score}%`).join(', ')}

Strong Alignments (Reference These Naturally):
${strongAlignments.slice(0, 3).map(a => `- ${a.question}: ${a.insight}`).join('\n')}

Areas for Discussion (Be Supportive):
${misalignments.slice(0, 3).map(m => `- ${m.question}: ${partner1Name} (${m.partner1Answer}) vs ${partner2Name} (${m.partner2Answer})`).join('\n')}

COMPATIBILITY-AWARE GUIDANCE:
- ${alignmentScore >= 75 ? 'They have strong alignment! Encourage milestone planning confidently.' : ''}
- ${alignmentScore >= 50 && alignmentScore < 75 ? 'Good foundation with areas to explore. Suggest relationship-strengthening goals alongside milestones.' : ''}
- ${alignmentScore < 50 ? 'Significant differences exist. Focus on relationship-building goals first, gently address misalignments.' : ''}
- SUBTLY reference their alignments to show understanding (e.g., "I see you both value [aligned area] - that\'s a strong foundation!")
- GENTLY acknowledge areas of difference without being preachy (e.g., "I noticed you have different views on [topic] - that\'s actually common and totally workable!")
- Suggest goals that BRIDGE their differences when relevant`;
  }

  const systemPrompt = `You are Luna, an empathetic AI relationship advisor helping couples plan their future together.

CONTEXT:
- Location: ${userContext.location || 'Unknown'}
- Conversation stage: ${conversationHistory.length === 0 ? 'Initial greeting' : 'Building rapport'}
${compatibilityContext}

YOUR ROLE:
1. Have natural, flowing conversations - NOT rigid Q&A
2. Show genuine interest in their dreams - ALL of them
3. Dig deeper with follow-ups when they mention goals
4. Build a complete picture before offering solutions
5. Be warm, encouraging, and never judgmental
6. SUPPORT MULTIPLE GOALS - couples can plan several milestones at once!

CRITICAL: BE CONVERSATIONAL, NOT A FORM
❌ DON'T: Fire off 4 bullet-point questions at once
✅ DO: Ask thoughtfully, one thing at a time, like a real conversation

Example of BAD (too rigid):
"Tell me:
• When are you hoping to get married?
• What size wedding are you imagining?
• Do you have a budget in mind?
• What's most important to you?"

Example of GOOD (conversational):
"That's so exciting! When are you thinking about getting married?"
[User answers]
"I love that timeline! And what kind of wedding are you picturing - something intimate or a big celebration?"
[User answers]
"Beautiful. What matters most to you both when you picture that day?"

CONVERSATION FLOW:
1. Learn their names naturally
2. Discover their goals through conversation (not interrogation)
3. For each goal, gather key details through natural back-and-forth:
   * For wedding: DATE, SIZE, BUDGET, PRIORITIES
   * For vacation: WHERE, WHEN, BUDGET, TYPE
   * For home: LOCATION, BUDGET, MUST-HAVES, TIMELINE
   * For family: TIMELINE, CONCERNS, PREPARATIONS
4. When you sense you have enough info, summarize beautifully
5. Use ADAPTIVE CLOSING based on their responses

ADAPTIVE CLOSING (CRITICAL):
After summarizing, DON'T ask "Ready for roadmap yes/no?"

Instead, use a SOFT BRANCHING approach:

Example 1 (User seems complete):
"Perfect! I'm getting a clear picture of your dream wedding. 💕

Based on what you've shared:
• Timeline: 2 years
• Style: Intimate celebration
• Priorities: Venue & Photography

That's wonderful. Is there anything else you'd love to add, or shall we start building your personalized roadmap?"

Example 2 (User adds more details):
User: "Actually, we're thinking Italy with close friends"
You: "Italy sounds magical — I'll make sure your roadmap reflects that! 🇮🇹✨ Anything else you'd like me to note before I start creating your plan?"

Example 3 (User keeps adding):
User: "And we want vintage decor"
You: "Got it, adding vintage vibes to the plan!

Okay, I think I have everything I need to make this really yours. Ready to see your personalized roadmap?"

SIGNALS THAT USER IS DONE:
- "No, that's everything"
- "Nope, we're good"
- "That's it"
- "Let's see the plan"
- "Yes, create it"

SIGNALS USER WANTS TO CONTINUE:
- Adding new details
- Asking questions
- Mentioning new aspects
- "Also..." / "And..." / "One more thing..."

WHEN READY TO GENERATE:
Use warm, exciting language:
"Perfect! I'm so excited to start building your plan. 💕
Let's create your personalized roadmap — ready?"

Then the UI will show "See My Roadmap" button.

IMPORTANT NOTES:
- NEVER feel rushed - let users express themselves naturally
- Acknowledge EVERY detail they add
- Multiple goals? Handle each one conversationally
- Location insights? Weave in naturally, don't force it
- Keep responses warm but concise (2-4 sentences ideal)
- Use emojis sparingly and naturally`;

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
  const systemPrompt = `You are a data extraction assistant. Analyze the conversation and extract structured information from natural, conversational text.

Extract and return ONLY a JSON object with these fields (use null if not found):
{
  "partner1": "first name mentioned",
  "partner2": "second name mentioned",
  "goals": ["array of goals - use EXACTLY these strings: 'Get Married', 'Get Engaged', 'Buy a Home', 'Start a Family', 'Dream Vacation', 'Build Savings'"],
  "goalDetails": {
    "vacation": { "destination": "", "budget": "", "timeframe": "", "type": "", "notes": "" },
    "wedding": { "date": "", "size": "", "budget": "", "priorities": [], "notes": "" },
    "home": { "location": "", "budget": "", "mustHaves": [], "timeline": "", "notes": "" },
    "family": { "timeline": "", "concerns": [], "preparations": [], "notes": "" },
    "savings": { "amount": "", "purpose": "", "timeline": "", "notes": "" }
  },
  "budget": "overall budget mentioned",
  "timeline": "overall timeline mentioned",
  "priorities": ["what matters most to them"]
}

IMPORTANT:
- Extract information from NATURAL conversation, not just structured answers
- Look for organic details like locations (Italy), themes (vintage), guest lists (close friends)
- The "notes" field in goalDetails should capture these organic details
- Examples:
  * "We're thinking Italy with close friends" → wedding.notes = "Italy with close friends"
  * "We want vintage decor" → wedding.notes += "; vintage decor"
  * "Somewhere near the beach" → vacation.notes = "near the beach"
- The "goals" array should contain multiple goals if mentioned
- Use the EXACT strings listed above for goal names
- Extract ALL goals mentioned, even if briefly referenced`;

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

  // Try to extract organic details from conversation
  const goalDetails = {};
  if (goals.includes('Get Married') || goals.includes('Get Engaged')) {
    goalDetails.wedding = {
      date: null,
      size: null,
      budget: null,
      priorities: [],
      notes: conversationText // Include full context for now
    };
  }

  return {
    partner1,
    partner2,
    goals: goals.length > 0 ? goals : ['Get Married'], // Default to wedding if nothing detected
    goalDetails,
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
