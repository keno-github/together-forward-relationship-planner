/**
 * Goal Discovery Agent
 *
 * Efficiently extracts user context without overwhelming them with questions.
 * Uses intelligent question sequencing and context inference to minimize
 * the number of questions while gathering comprehensive information.
 *
 * Key Capabilities:
 * - Smart question sequencing (adapts based on previous answers)
 * - Context extraction from conversation
 * - Budget/timeline/preference detection
 * - Knows when enough info is gathered to proceed
 */

/**
 * Extracts implicit context from user messages
 * @param {string} message - User message
 * @param {Array} conversationHistory - Previous messages
 * @returns {Object} Extracted context (budget hints, timeline, preferences, etc.)
 */
export const analyzeMessage = (message, conversationHistory = []) => {
  const context = {
    budgetHints: [],
    timelineHints: [],
    preferences: [],
    constraints: [],
    location: null,
    confidence: {}
  };

  // Budget detection patterns
  const budgetPatterns = [
    { regex: /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, type: 'dollar' },
    { regex: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd)/gi, type: 'dollar' },
    { regex: /€\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, type: 'euro' },
    { regex: /£\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, type: 'pound' },
    { regex: /budget\s+of\s+about\s+(\d+)/gi, type: 'approximate' },
    { regex: /save?\s+(\d+)\s+(?:per|a)\s+month/gi, type: 'monthly_savings' }
  ];

  budgetPatterns.forEach(({ regex, type }) => {
    const matches = [...message.matchAll(regex)];
    matches.forEach(match => {
      const amount = match[1].replace(/,/g, '');
      context.budgetHints.push({
        amount: parseFloat(amount),
        type,
        confidence: 0.8,
        source: match[0]
      });
    });
  });

  // Timeline detection patterns
  const timelinePatterns = [
    { regex: /(?:by|in|within)\s+(\d+)\s+(months?|years?)/gi, unit: 'relative' },
    { regex: /next\s+(summer|winter|spring|fall|year)/gi, unit: 'seasonal' },
    { regex: /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi, unit: 'specific' },
    { regex: /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g, unit: 'date' }
  ];

  timelinePatterns.forEach(({ regex, unit }) => {
    const matches = [...message.matchAll(regex)];
    matches.forEach(match => {
      context.timelineHints.push({
        text: match[0],
        unit,
        confidence: 0.7,
        raw: match
      });
    });
  });

  // Location detection
  const locationRegex = /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  const locationMatches = [...message.matchAll(locationRegex)];
  if (locationMatches.length > 0) {
    context.location = {
      text: locationMatches[0][1],
      confidence: 0.6
    };
  }

  // Preference detection (keywords)
  const preferenceKeywords = {
    style: ['traditional', 'modern', 'rustic', 'elegant', 'casual', 'formal'],
    size: ['small', 'large', 'intimate', 'grand', 'cozy'],
    priority: ['budget-friendly', 'luxury', 'mid-range', 'premium'],
    values: ['sustainable', 'eco-friendly', 'local', 'organic', 'ethical']
  };

  Object.entries(preferenceKeywords).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (message.toLowerCase().includes(keyword)) {
        context.preferences.push({
          category,
          value: keyword,
          confidence: 0.7
        });
      }
    });
  });

  // Constraint detection
  const constraints = [
    { regex: /(?:tight|limited)\s+budget/gi, type: 'budget_constraint' },
    { regex: /(?:rush|urgent|quickly|asap)/gi, type: 'time_constraint' },
    { regex: /(?:can't|cannot|unable|won't)\s+(\w+)/gi, type: 'limitation' }
  ];

  constraints.forEach(({ regex, type }) => {
    if (regex.test(message)) {
      context.constraints.push({
        type,
        confidence: 0.8
      });
    }
  });

  return context;
};

/**
 * Determines what questions still need to be asked
 * @param {Object} extractedContext - Context from all messages so far
 * @param {string} goalType - Type of goal (wedding, home, baby, etc.)
 * @returns {Object} Questions to ask and readiness status
 */
export const determineNextQuestions = (extractedContext, goalType) => {
  const requiredInfo = {
    budget: false,
    timeline: false,
    location: false,
    preferences: false
  };

  // Check what we already have
  if (extractedContext.budgetHints.length > 0) {
    requiredInfo.budget = true;
  }
  if (extractedContext.timelineHints.length > 0) {
    requiredInfo.timeline = true;
  }
  if (extractedContext.location) {
    requiredInfo.location = true;
  }
  if (extractedContext.preferences.length > 2) {
    requiredInfo.preferences = true;
  }

  // Calculate readiness
  const infoCollected = Object.values(requiredInfo).filter(Boolean).length;
  const totalRequired = Object.keys(requiredInfo).length;
  const readiness = infoCollected / totalRequired;

  // Determine next question
  let nextQuestion = null;
  if (!requiredInfo.budget) {
    nextQuestion = {
      type: 'budget',
      question: `What's your budget for this ${goalType}? Even a rough estimate helps!`,
      priority: 'high'
    };
  } else if (!requiredInfo.timeline) {
    nextQuestion = {
      type: 'timeline',
      question: `When are you hoping to achieve this? Any specific timeline in mind?`,
      priority: 'high'
    };
  } else if (!requiredInfo.location) {
    nextQuestion = {
      type: 'location',
      question: `Where are you planning this? The location can help me give you more specific advice.`,
      priority: 'medium'
    };
  } else if (!requiredInfo.preferences) {
    nextQuestion = {
      type: 'preferences',
      question: `What style or vibe are you going for? Traditional, modern, something unique?`,
      priority: 'low'
    };
  }

  return {
    readiness,
    isReady: readiness >= 0.5, // Can proceed with 50% info minimum
    nextQuestion,
    missingInfo: Object.entries(requiredInfo)
      .filter(([_, hasInfo]) => !hasInfo)
      .map(([info, _]) => info)
  };
};

/**
 * Generates a conversational follow-up question
 * @param {Object} context - Current context
 * @param {string} goalType - Type of goal
 * @returns {string} Natural follow-up question
 */
export const generateFollowUp = (context, goalType) => {
  const { nextQuestion } = determineNextQuestions(context, goalType);

  if (!nextQuestion) {
    return "I think I have enough to get started! Let me create a personalized roadmap for you.";
  }

  // Add context-aware phrasing
  const introductions = [
    "Great! ",
    "Got it! ",
    "Perfect! ",
    "I see! ",
    "Understood! "
  ];

  const intro = introductions[Math.floor(Math.random() * introductions.length)];

  return intro + nextQuestion.question;
};

/**
 * Consolidates all hints into a structured format
 * @param {Array} allContexts - Array of extracted contexts from all messages
 * @returns {Object} Consolidated user data
 */
export const consolidateContext = (allContexts) => {
  const consolidated = {
    budget: null,
    timeline: null,
    location: null,
    preferences: [],
    constraints: [],
    confidence: {}
  };

  // Consolidate budget (take highest confidence or most recent)
  const budgetHints = allContexts.flatMap(c => c.budgetHints);
  if (budgetHints.length > 0) {
    const bestBudget = budgetHints.sort((a, b) => b.confidence - a.confidence)[0];
    consolidated.budget = {
      amount: bestBudget.amount,
      type: bestBudget.type,
      confidence: bestBudget.confidence
    };
  }

  // Consolidate timeline (take most specific)
  const timelineHints = allContexts.flatMap(c => c.timelineHints);
  if (timelineHints.length > 0) {
    const specificTimeline = timelineHints.find(t => t.unit === 'date' || t.unit === 'specific');
    const bestTimeline = specificTimeline || timelineHints[0];
    consolidated.timeline = {
      text: bestTimeline.text,
      unit: bestTimeline.unit,
      confidence: bestTimeline.confidence
    };
  }

  // Location (take highest confidence)
  const locations = allContexts.map(c => c.location).filter(Boolean);
  if (locations.length > 0) {
    consolidated.location = locations.sort((a, b) => b.confidence - a.confidence)[0];
  }

  // Preferences (deduplicate and rank)
  const allPreferences = allContexts.flatMap(c => c.preferences);
  const uniquePreferences = [...new Map(allPreferences.map(p => [p.value, p])).values()];
  consolidated.preferences = uniquePreferences.sort((a, b) => b.confidence - a.confidence);

  // Constraints (deduplicate)
  const allConstraints = allContexts.flatMap(c => c.constraints);
  const uniqueConstraints = [...new Map(allConstraints.map(c => [c.type, c])).values()];
  consolidated.constraints = uniqueConstraints;

  return consolidated;
};

export default {
  analyzeMessage,
  determineNextQuestions,
  generateFollowUp,
  consolidateContext
};
