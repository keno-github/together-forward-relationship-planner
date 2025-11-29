import { callClaude } from './claudeAPI';

// =====================================================
// IMPORTANCE WEIGHTS FOR SCORING
// =====================================================

export const IMPORTANCE_WEIGHTS = {
  CRITICAL: 1.5,    // Must align - potential dealbreakers
  IMPORTANT: 1.2,   // Should align - significant impact
  NORMAL: 1.0,      // Good to align - standard questions
  NICE_TO_HAVE: 0.7 // Minor impact - lifestyle preferences
};

// =====================================================
// QUESTION GENERATION
// =====================================================

/**
 * Generate personalized assessment questions based on pre-screening context
 */
export const generateAssessmentQuestions = async (prescreening, partnerNames) => {
  // Get focus areas and question count from prescreening
  const p1 = prescreening?.partner1 || {};
  const focusAreas = p1.focus_areas || ['finances', 'communication', 'values'];
  const depth = p1.assessment_depth || 'standard';
  const currentPriority = p1.current_priority || 'just_exploring';

  // Determine question count based on depth
  const questionCounts = {
    'quick': { min: 10, max: 15 },
    'standard': { min: 18, max: 25 },
    'deep': { min: 30, max: 40 }
  };
  const { min: minQuestions, max: maxQuestions } = questionCounts[depth] || questionCounts.standard;

  // Map focus areas to descriptive categories
  const focusAreaDescriptions = {
    finances: 'Money management, spending habits, saving goals, financial priorities',
    travel: 'Travel styles, dream destinations, adventure preferences, vacation planning',
    home: 'Living preferences, home ownership, location priorities, living space ideals',
    career: 'Work-life balance, career ambitions, job priorities, professional goals',
    family: 'Family planning, parenting styles, family involvement, extended family dynamics',
    lifestyle: 'Daily routines, hobbies, social preferences, health and wellness',
    communication: 'Conflict resolution, emotional expression, communication styles, quality time',
    values: 'Core beliefs, life priorities, spirituality, what matters most'
  };

  // Map priorities to what they mean
  const priorityDescriptions = {
    buy_home: 'buying their first home together - focus on location preferences, financial readiness, living space needs, neighborhood priorities',
    travel_trip: 'planning a significant trip together - focus on travel styles, destination preferences, budget approaches, adventure vs relaxation',
    wedding: 'planning their wedding - focus on wedding vision, family involvement, financial priorities, celebration style',
    baby: 'starting a family - focus on parenting philosophies, childcare approaches, work-life balance with kids, family support',
    career_change: 'navigating a career transition - focus on work-life balance, financial impact, relocation willingness, mutual support',
    financial_goal: 'reaching a specific financial goal - focus on saving strategies, spending habits, investment approaches, financial priorities',
    moving: 'moving to a new place - focus on location preferences, lifestyle changes, financial implications, community priorities',
    just_exploring: 'general relationship exploration - focus on core values, communication, and life vision alignment'
  };

  const systemPrompt = `You are Luna, an empathetic AI relationship coach with deep intuition about what truly matters in relationships.

Your task is to generate thoughtful compatibility questions that feel like a warm, insightful conversation - not a clinical survey.

CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${minQuestions} to ${maxQuestions} questions - no fewer, no more
2. Their MAIN GOAL right now is: ${priorityDescriptions[currentPriority] || 'exploring their relationship'}
3. They want to explore these through the lens of: ${focusAreas.map(a => focusAreaDescriptions[a]).join('; ')}

THE KEY INSIGHT: Questions should be about their PRIORITY (${currentPriority}) viewed through their FOCUS AREAS (${focusAreas.join(', ')}).

For example, if priority is "moving" and focus is "finances":
- GOOD: "How much of your savings are you comfortable spending on the move and new place setup?"
- GOOD: "When it comes to your new location, how do you prioritize cost of living vs. other factors?"
- BAD: "How do you generally manage finances?" (too generic, doesn't connect to moving)

IMPORTANCE LEVELS:
- CRITICAL (1.5x weight): Dealbreaker territory - must align
- IMPORTANT (1.2x weight): Should align - significant impact
- NORMAL (1.0x weight): Good to align - helpful to know
- NICE_TO_HAVE (0.7x weight): Minor preferences

Each question needs 4 options with weights 1-4 representing a spectrum of valid perspectives.`;

  const contextSummary = buildContextSummary(prescreening, partnerNames);

  const userPrompt = `Generate ${minQuestions}-${maxQuestions} personalized compatibility questions for this couple:

${contextSummary}

THEIR MAIN GOAL: ${priorityDescriptions[currentPriority] || 'exploring their relationship'}
FOCUS AREAS: ${focusAreas.map(a => `${a.toUpperCase()}: ${focusAreaDescriptions[a]}`).join('\n')}

QUESTION DISTRIBUTION:
- About 50% of questions should directly relate to their priority (${currentPriority})
- About 30% should cover their chosen focus areas (${focusAreas.join(', ')})
- About 20% can cover foundational relationship topics

Return ONLY a valid JSON array (no other text):
[
  {
    "id": "q1",
    "category": "moving",
    "importance": "CRITICAL",
    "importanceWeight": 1.5,
    "question": "When choosing your new location, what's most important to you?",
    "options": [
      {"value": "career_opportunities", "label": "Career and job opportunities", "weight": 1},
      {"value": "cost_of_living", "label": "Affordable cost of living", "weight": 2},
      {"value": "lifestyle_amenities", "label": "Lifestyle and amenities (restaurants, culture)", "weight": 3},
      {"value": "community_family", "label": "Community and proximity to family/friends", "weight": 4}
    ]
  }
]

REMEMBER: Generate EXACTLY ${minQuestions}-${maxQuestions} questions. This is critical.`;

  try {
    console.log('🤖 Luna: Generating personalized assessment questions...');
    console.log('📋 Focus areas:', focusAreas);
    console.log('🎯 Current priority:', currentPriority);
    console.log('📊 Depth:', depth, `(${minQuestions}-${maxQuestions} questions)`);

    const response = await callClaude(
      [{ role: 'user', content: userPrompt }],
      { systemPrompt, maxTokens: 8000, temperature: 0.7 }
    );

    console.log('📥 Claude response received, length:', response?.length || 0);

    // Parse the JSON response
    let questions = parseQuestionsResponse(response);

    if (!questions || questions.length === 0) {
      console.warn('⚠️ Luna returned no questions or parsing failed, using intelligent fallback');
      console.warn('⚠️ Raw response preview:', response?.substring(0, 500));
      return { data: getFallbackQuestions(prescreening), error: null };
    }

    // If Claude returned too few questions, supplement with fallback
    if (questions.length < minQuestions) {
      console.warn(`⚠️ Claude returned only ${questions.length} questions, need ${minQuestions}. Supplementing...`);
      const fallbackQs = getFallbackQuestions(prescreening);
      const existingQuestionTexts = new Set(questions.map(q => q.question));
      const supplemental = fallbackQs.filter(q => !existingQuestionTexts.has(q.question));
      questions = [...questions, ...supplemental].slice(0, maxQuestions);
    }

    console.log(`✅ Luna (Claude API) generated ${questions.length} personalized questions`);
    console.log('📋 Categories:', [...new Set(questions.map(q => q.category))].join(', '));
    return { data: questions, error: null };

  } catch (error) {
    console.error('❌ Error generating questions:', error);
    console.warn('⚠️ Falling back to intelligent priority-aware fallback questions');
    return { data: getFallbackQuestions(prescreening), error };
  }
};

/**
 * Build a context summary for the AI prompt
 * This includes adaptive instructions based on their situation
 */
const buildContextSummary = (prescreening, partnerNames) => {
  const p1 = prescreening?.partner1 || {};
  const p2 = prescreening?.partner2 || {};

  const combined = {
    hasChildren: p1.has_children || p2.has_children || false,
    wantsChildren: p1.wants_children || p2.wants_children,
    ownsHome: p1.owns_home || p2.owns_home || false,
    isMarried: p1.is_married || p2.is_married || false,
    livingSituation: p1.living_situation || p2.living_situation || 'unknown',
    relationshipLength: p1.relationship_length || p2.relationship_length || 'unknown',
    focusAreas: p1.focus_areas || ['finances', 'communication', 'values'],
    currentPriority: p1.current_priority || 'just_exploring',
    assessmentDepth: p1.assessment_depth || 'standard'
  };

  const priorityLabels = {
    buy_home: 'Buying a home',
    travel_trip: 'Planning a big trip',
    wedding: 'Planning their wedding',
    baby: 'Starting a family',
    career_change: 'Career transition',
    financial_goal: 'Reaching a financial goal',
    moving: 'Moving to a new place',
    just_exploring: 'General relationship exploration'
  };

  // Build adaptive guidance based on their situation
  const adaptiveGuidance = [];

  if (combined.isMarried) {
    adaptiveGuidance.push('- They are ALREADY MARRIED - do NOT ask about wedding timelines or "when will you get married"');
  } else {
    adaptiveGuidance.push('- They are not yet married - questions about marriage timeline ARE relevant');
  }

  if (combined.hasChildren) {
    adaptiveGuidance.push('- They ALREADY HAVE CHILDREN - do NOT ask "do you want kids?". Instead ask about parenting styles, more children, education values');
  } else if (combined.wantsChildren === 'no') {
    adaptiveGuidance.push('- They do NOT want children - skip all parenting/children questions');
  } else if (combined.wantsChildren === 'yes_soon') {
    adaptiveGuidance.push('- They want children SOON - include questions about parenting readiness, childcare approaches');
  }

  if (combined.ownsHome) {
    adaptiveGuidance.push('- They ALREADY OWN a home - do NOT ask "do you want to buy a home?". Instead ask about home improvement, future housing plans');
  }

  if (combined.livingSituation === 'long_distance') {
    adaptiveGuidance.push('- They are LONG-DISTANCE - include questions about closing the distance, communication across distance, visit frequency');
  } else if (combined.livingSituation === 'separate') {
    adaptiveGuidance.push('- They live SEPARATELY but same area - consider questions about moving in together');
  } else if (combined.livingSituation === 'together') {
    adaptiveGuidance.push('- They ALREADY live together - skip questions about "would you move in together"');
  }

  // Relationship length affects question depth
  if (combined.relationshipLength === 'under_1_year') {
    adaptiveGuidance.push('- NEW relationship (under 1 year) - focus more on getting to know values and communication styles');
  } else if (combined.relationshipLength === '5_plus_years') {
    adaptiveGuidance.push('- ESTABLISHED relationship (5+ years) - they likely know basics, focus on deeper alignment and future vision');
  }

  return `
COUPLE: ${partnerNames.partner1} and ${partnerNames.partner2}

RELATIONSHIP CONTEXT:
- Relationship length: ${formatRelationshipLength(combined.relationshipLength)}
- Currently married: ${combined.isMarried ? 'Yes' : 'No'}
- Living situation: ${formatLivingSituation(combined.livingSituation)}
- Own a home together: ${combined.ownsHome ? 'Yes' : 'No'}
- Have children: ${combined.hasChildren ? 'Yes' : 'No'}
${combined.wantsChildren ? `- Thoughts on children: ${formatWantsChildren(combined.wantsChildren)}` : ''}

CURRENT PRIORITY: ${priorityLabels[combined.currentPriority] || combined.currentPriority}
FOCUS AREAS: ${combined.focusAreas.join(', ')}
DEPTH: ${combined.assessmentDepth}

ADAPTIVE GUIDANCE (use their context to ask RELEVANT questions):
${adaptiveGuidance.join('\n')}
`.trim();
};

/**
 * Parse questions from Claude's response
 */
const parseQuestionsResponse = (response) => {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);

      return questions.filter(q =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length >= 2
      ).map((q, index) => ({
        ...q,
        id: q.id || `q${index + 1}`,
        category: q.category || 'general',
        importance: q.importance || 'NORMAL',
        importanceWeight: q.importanceWeight || IMPORTANCE_WEIGHTS[q.importance] || 1.0
      }));
    }
    return null;
  } catch (error) {
    console.error('Error parsing questions:', error);
    return null;
  }
};

// =====================================================
// INTELLIGENT FALLBACK QUESTIONS
// =====================================================

/**
 * Generate fallback questions that are:
 * 1. Priority-aware (questions about the couple's main goal)
 * 2. Focus-area filtered (viewed through their chosen lenses)
 * 3. Correctly counted (respects the depth setting)
 */
const getFallbackQuestions = (prescreening) => {
  const p1 = prescreening?.partner1 || {};
  const depth = p1.assessment_depth || 'standard';
  const focusAreas = p1.focus_areas || ['finances', 'communication', 'values'];
  const currentPriority = p1.current_priority || 'just_exploring';
  const hasChildren = p1.has_children;
  const ownsHome = p1.owns_home;
  const isMarried = p1.is_married;

  // Target question counts
  const targetCounts = {
    'quick': 12,
    'standard': 20,
    'deep': 35
  };
  const targetCount = targetCounts[depth] || 20;

  // =====================================================
  // PRIORITY-SPECIFIC QUESTION POOLS
  // =====================================================

  const priorityQuestions = {
    moving: [
      {
        id: 'moving_location_priority',
        category: 'moving',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'When choosing where to move, what matters most to you?',
        options: [
          { value: 'career', label: 'Career and job opportunities', weight: 1 },
          { value: 'cost', label: 'Affordable cost of living', weight: 2 },
          { value: 'lifestyle', label: 'Lifestyle amenities and culture', weight: 3 },
          { value: 'community', label: 'Community and proximity to loved ones', weight: 4 }
        ]
      },
      {
        id: 'moving_urban_preference',
        category: 'moving',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What type of area do you want to move to?',
        options: [
          { value: 'city_center', label: 'City center - urban, walkable, vibrant', weight: 1 },
          { value: 'suburbs', label: 'Suburbs - quiet, space, community', weight: 2 },
          { value: 'small_town', label: 'Small town - peaceful, tight-knit', weight: 3 },
          { value: 'rural', label: 'Rural/countryside - nature, privacy', weight: 4 }
        ]
      },
      {
        id: 'moving_timeline',
        category: 'moving',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How quickly do you want to make the move?',
        options: [
          { value: 'asap', label: 'As soon as possible (within 3 months)', weight: 1 },
          { value: 'soon', label: 'Soon (3-6 months)', weight: 2 },
          { value: 'year', label: 'Within a year', weight: 3 },
          { value: 'flexible', label: 'No rush, when the right opportunity comes', weight: 4 }
        ]
      },
      {
        id: 'moving_budget_comfort',
        category: 'moving',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How much of your savings are you comfortable using for the move?',
        options: [
          { value: 'minimal', label: 'As little as possible, stay frugal', weight: 1 },
          { value: 'moderate', label: 'Moderate amount for a smooth transition', weight: 2 },
          { value: 'significant', label: 'Willing to spend significantly for the right place', weight: 3 },
          { value: 'whatever_takes', label: 'Whatever it takes for our dream location', weight: 4 }
        ]
      },
      {
        id: 'moving_rent_vs_buy',
        category: 'moving',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'In your new location, would you prefer to rent or buy?',
        options: [
          { value: 'buy_immediately', label: 'Buy right away if possible', weight: 1 },
          { value: 'rent_then_buy', label: 'Rent first, then buy once settled', weight: 2 },
          { value: 'rent_long_term', label: 'Prefer renting for flexibility', weight: 3 },
          { value: 'depends', label: 'Depends entirely on the market/opportunity', weight: 4 }
        ]
      },
      {
        id: 'moving_distance_family',
        category: 'moving',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How important is staying close to family when choosing your new location?',
        options: [
          { value: 'very_important', label: 'Very important - want to be nearby', weight: 1 },
          { value: 'somewhat', label: 'Somewhat - prefer reasonable distance', weight: 2 },
          { value: 'not_priority', label: 'Not a priority - open to anywhere', weight: 3 },
          { value: 'prefer_distance', label: 'Actually prefer some distance', weight: 4 }
        ]
      },
      {
        id: 'moving_lifestyle_change',
        category: 'moving',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How much lifestyle change are you willing to make for the move?',
        options: [
          { value: 'minimal', label: 'Minimal - want similar lifestyle', weight: 1 },
          { value: 'some_adjustments', label: 'Some adjustments are fine', weight: 2 },
          { value: 'significant', label: 'Open to significant changes', weight: 3 },
          { value: 'fresh_start', label: 'Looking for a complete fresh start', weight: 4 }
        ]
      }
    ],

    financial_goal: [
      {
        id: 'financial_goal_approach',
        category: 'finances',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How aggressive should your approach be to reach your financial goal?',
        options: [
          { value: 'very_aggressive', label: 'Very aggressive - maximize savings, minimize spending', weight: 1 },
          { value: 'focused', label: 'Focused but balanced - steady progress', weight: 2 },
          { value: 'flexible', label: 'Flexible - save when possible, enjoy life too', weight: 3 },
          { value: 'relaxed', label: 'Relaxed - it will happen when it happens', weight: 4 }
        ]
      },
      {
        id: 'financial_sacrifice',
        category: 'finances',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What are you willing to sacrifice to reach your financial goal faster?',
        options: [
          { value: 'major_lifestyle', label: 'Major lifestyle changes (move, downsize, etc.)', weight: 1 },
          { value: 'entertainment', label: 'Entertainment and non-essentials', weight: 2 },
          { value: 'minor_cuts', label: 'Minor cuts here and there', weight: 3 },
          { value: 'nothing', label: 'Prefer not to sacrifice quality of life', weight: 4 }
        ]
      },
      {
        id: 'financial_tracking',
        category: 'finances',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How do you prefer to track progress toward your financial goal?',
        options: [
          { value: 'detailed', label: 'Detailed tracking - spreadsheets, apps, weekly reviews', weight: 1 },
          { value: 'regular_checkins', label: 'Regular check-ins - monthly reviews', weight: 2 },
          { value: 'occasional', label: 'Occasional glances at the balance', weight: 3 },
          { value: 'not_tracking', label: 'Prefer not to obsess over numbers', weight: 4 }
        ]
      },
      {
        id: 'financial_joint_separate',
        category: 'finances',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How should you work together toward this financial goal?',
        options: [
          { value: 'fully_joint', label: 'Fully joint - pool everything together', weight: 1 },
          { value: 'proportional', label: 'Proportional contributions based on income', weight: 2 },
          { value: 'equal_split', label: 'Equal fixed contributions from each', weight: 3 },
          { value: 'independent', label: 'Separate goals that add up to the total', weight: 4 }
        ]
      },
      {
        id: 'financial_windfall',
        category: 'finances',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'If you received unexpected money (bonus, gift, etc.), how would you use it?',
        options: [
          { value: 'all_to_goal', label: 'Put it all toward our goal', weight: 1 },
          { value: 'mostly_goal', label: 'Mostly to the goal, small treat', weight: 2 },
          { value: 'split', label: 'Split between goal and enjoying it', weight: 3 },
          { value: 'enjoy', label: 'Enjoy it - we deserve a reward', weight: 4 }
        ]
      },
      {
        id: 'financial_setback',
        category: 'finances',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How would you handle a financial setback that delays your goal?',
        options: [
          { value: 'double_down', label: 'Double down - work harder to catch up', weight: 1 },
          { value: 'adjust_timeline', label: 'Calmly adjust the timeline', weight: 2 },
          { value: 'reassess', label: 'Reassess if the goal is still right', weight: 3 },
          { value: 'take_break', label: 'Take a break from intense saving', weight: 4 }
        ]
      }
    ],

    buy_home: [
      {
        id: 'home_location_priority',
        category: 'home',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What\'s most important when choosing your home\'s location?',
        options: [
          { value: 'commute', label: 'Short commute to work', weight: 1 },
          { value: 'schools', label: 'Good schools and family-friendly area', weight: 2 },
          { value: 'lifestyle', label: 'Walkable with restaurants and culture', weight: 3 },
          { value: 'space_nature', label: 'Space, nature, and privacy', weight: 4 }
        ]
      },
      {
        id: 'home_budget_stretch',
        category: 'home',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How much would you stretch your budget for the perfect home?',
        options: [
          { value: 'stay_under', label: 'Stay well under budget for safety', weight: 1 },
          { value: 'comfortable', label: 'Up to a comfortable maximum', weight: 2 },
          { value: 'stretch_bit', label: 'Willing to stretch a bit for the right one', weight: 3 },
          { value: 'whatever_takes', label: 'Do whatever it takes for our dream home', weight: 4 }
        ]
      },
      {
        id: 'home_size_space',
        category: 'home',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'What size home do you envision?',
        options: [
          { value: 'cozy', label: 'Cozy and efficient - quality over quantity', weight: 1 },
          { value: 'comfortable', label: 'Comfortable with room to grow', weight: 2 },
          { value: 'spacious', label: 'Spacious - room for everything', weight: 3 },
          { value: 'large', label: 'Large with extra space for guests/hobbies', weight: 4 }
        ]
      },
      {
        id: 'home_renovation',
        category: 'home',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How do you feel about a home that needs work?',
        options: [
          { value: 'move_in_ready', label: 'Must be move-in ready', weight: 1 },
          { value: 'minor_updates', label: 'Minor cosmetic updates are fine', weight: 2 },
          { value: 'some_projects', label: 'Open to some renovation projects', weight: 3 },
          { value: 'fixer_upper', label: 'Love a fixer-upper with potential', weight: 4 }
        ]
      },
      {
        id: 'home_outdoor_space',
        category: 'home',
        importance: 'NORMAL',
        importanceWeight: 1.0,
        question: 'How important is outdoor space?',
        options: [
          { value: 'essential', label: 'Essential - need a good-sized yard', weight: 1 },
          { value: 'nice', label: 'Nice to have - small yard or patio is fine', weight: 2 },
          { value: 'not_priority', label: 'Not a priority - nearby parks work', weight: 3 },
          { value: 'prefer_none', label: 'Prefer no yard maintenance', weight: 4 }
        ]
      }
    ],

    travel_trip: [
      {
        id: 'travel_style',
        category: 'travel',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What\'s your ideal vacation style?',
        options: [
          { value: 'adventure', label: 'Adventure - hiking, exploring, active', weight: 1 },
          { value: 'cultural', label: 'Cultural - museums, history, local experiences', weight: 2 },
          { value: 'relaxation', label: 'Relaxation - beach, spa, unwinding', weight: 3 },
          { value: 'mix', label: 'Mix of everything - variety is key', weight: 4 }
        ]
      },
      {
        id: 'travel_planning',
        category: 'travel',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How do you prefer to plan trips?',
        options: [
          { value: 'detailed', label: 'Detailed itinerary - every day planned', weight: 1 },
          { value: 'outline', label: 'General outline with flexibility', weight: 2 },
          { value: 'spontaneous', label: 'Minimal planning, go with the flow', weight: 3 },
          { value: 'no_plan', label: 'No plan at all - pure spontaneity', weight: 4 }
        ]
      },
      {
        id: 'travel_budget',
        category: 'travel',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What\'s your approach to travel spending?',
        options: [
          { value: 'splurge', label: 'Splurge - travel is worth every penny', weight: 1 },
          { value: 'comfortable', label: 'Comfortable - nice experiences, reasonable cost', weight: 2 },
          { value: 'budget', label: 'Budget-conscious - stretch the money', weight: 3 },
          { value: 'minimal', label: 'Minimal spending - backpacker style', weight: 4 }
        ]
      },
      {
        id: 'travel_accommodation',
        category: 'travel',
        importance: 'NORMAL',
        importanceWeight: 1.0,
        question: 'What type of accommodation do you prefer?',
        options: [
          { value: 'luxury', label: 'Luxury hotels and resorts', weight: 1 },
          { value: 'nice_hotel', label: 'Nice mid-range hotels', weight: 2 },
          { value: 'airbnb', label: 'Airbnbs and local rentals', weight: 3 },
          { value: 'budget', label: 'Budget options - hostels, basic stays', weight: 4 }
        ]
      },
      {
        id: 'travel_frequency',
        category: 'travel',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How often would you ideally travel?',
        options: [
          { value: 'frequent', label: 'Frequently - every few months', weight: 1 },
          { value: 'regular', label: 'Regularly - 2-3 times a year', weight: 2 },
          { value: 'annual', label: 'Once a year big trip', weight: 3 },
          { value: 'occasional', label: 'Occasionally - when opportunity arises', weight: 4 }
        ]
      }
    ],

    wedding: [
      {
        id: 'wedding_size',
        category: 'wedding',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What size wedding do you envision?',
        options: [
          { value: 'intimate', label: 'Intimate - close family and friends only', weight: 1 },
          { value: 'medium', label: 'Medium - 50-100 guests', weight: 2 },
          { value: 'large', label: 'Large celebration - 100-200 guests', weight: 3 },
          { value: 'huge', label: 'Grand affair - the more the merrier', weight: 4 }
        ]
      },
      {
        id: 'wedding_budget_priority',
        category: 'wedding',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How do you prioritize wedding spending?',
        options: [
          { value: 'minimal', label: 'Keep it minimal - save for the future', weight: 1 },
          { value: 'balanced', label: 'Balanced - nice wedding, within reason', weight: 2 },
          { value: 'splurge', label: 'Willing to splurge - it\'s a once in a lifetime day', weight: 3 },
          { value: 'no_limit', label: 'No real limit - want it to be perfect', weight: 4 }
        ]
      },
      {
        id: 'wedding_style',
        category: 'wedding',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'What wedding style appeals to you?',
        options: [
          { value: 'traditional', label: 'Traditional and classic', weight: 1 },
          { value: 'modern', label: 'Modern and elegant', weight: 2 },
          { value: 'rustic', label: 'Rustic and natural', weight: 3 },
          { value: 'unique', label: 'Unique and non-traditional', weight: 4 }
        ]
      },
      {
        id: 'wedding_family_input',
        category: 'wedding',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How much should family be involved in wedding decisions?',
        options: [
          { value: 'very_involved', label: 'Very involved - it\'s a family event', weight: 1 },
          { value: 'input_welcome', label: 'Input welcome but we decide', weight: 2 },
          { value: 'minimal', label: 'Minimal involvement - our day, our way', weight: 3 },
          { value: 'just_us', label: 'Just us making all decisions', weight: 4 }
        ]
      }
    ],

    baby: [
      {
        id: 'baby_timeline',
        category: 'family',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'When do you envision starting your family?',
        options: [
          { value: 'asap', label: 'As soon as possible', weight: 1 },
          { value: '1_2_years', label: 'In 1-2 years', weight: 2 },
          { value: '3_5_years', label: 'In 3-5 years', weight: 3 },
          { value: 'not_sure', label: 'Not sure yet - when it feels right', weight: 4 }
        ]
      },
      {
        id: 'baby_parenting_style',
        category: 'family',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What parenting approach resonates with you?',
        options: [
          { value: 'structured', label: 'Structured - clear rules and routines', weight: 1 },
          { value: 'balanced', label: 'Balanced - structure with flexibility', weight: 2 },
          { value: 'relaxed', label: 'Relaxed - go with the flow', weight: 3 },
          { value: 'child_led', label: 'Child-led - follow their interests', weight: 4 }
        ]
      },
      {
        id: 'baby_work_balance',
        category: 'family',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How do you envision balancing work and childcare?',
        options: [
          { value: 'one_stays_home', label: 'One parent stays home full-time', weight: 1 },
          { value: 'part_time', label: 'One parent works part-time', weight: 2 },
          { value: 'both_work', label: 'Both work with childcare support', weight: 3 },
          { value: 'flexible', label: 'Flexible arrangement based on circumstances', weight: 4 }
        ]
      },
      {
        id: 'baby_family_help',
        category: 'family',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How much would you rely on family for childcare help?',
        options: [
          { value: 'primary', label: 'Primary support - grandparents are key', weight: 1 },
          { value: 'regular', label: 'Regular help when needed', weight: 2 },
          { value: 'occasional', label: 'Occasional babysitting', weight: 3 },
          { value: 'independent', label: 'Prefer to handle it ourselves', weight: 4 }
        ]
      }
    ],

    career_change: [
      {
        id: 'career_risk_tolerance',
        category: 'career',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How much career risk are you comfortable with?',
        options: [
          { value: 'high_risk', label: 'High risk for high reward potential', weight: 1 },
          { value: 'moderate', label: 'Moderate risk with safety net', weight: 2 },
          { value: 'low_risk', label: 'Low risk - stability is important', weight: 3 },
          { value: 'no_risk', label: 'Avoid risk - security first', weight: 4 }
        ]
      },
      {
        id: 'career_support_expectations',
        category: 'career',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What support do you expect from your partner during a career transition?',
        options: [
          { value: 'full_financial', label: 'Full financial support while transitioning', weight: 1 },
          { value: 'emotional_practical', label: 'Emotional support and practical help', weight: 2 },
          { value: 'encouragement', label: 'Encouragement and understanding', weight: 3 },
          { value: 'independence', label: 'Handle it mostly independently', weight: 4 }
        ]
      },
      {
        id: 'career_relocation',
        category: 'career',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'Would you relocate for a career opportunity?',
        options: [
          { value: 'absolutely', label: 'Absolutely - career comes first', weight: 1 },
          { value: 'right_opportunity', label: 'For the right opportunity, yes', weight: 2 },
          { value: 'reluctant', label: 'Reluctantly, if really necessary', weight: 3 },
          { value: 'no', label: 'No - our roots matter more', weight: 4 }
        ]
      }
    ],

    just_exploring: [
      {
        id: 'future_vision',
        category: 'values',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'Where do you see yourselves in 5 years?',
        options: [
          { value: 'settled', label: 'Settled with home, possibly family', weight: 1 },
          { value: 'growing', label: 'Growing careers and building foundation', weight: 2 },
          { value: 'exploring', label: 'Still exploring and having adventures', weight: 3 },
          { value: 'flexible', label: 'Open to wherever life takes us', weight: 4 }
        ]
      },
      {
        id: 'life_priorities',
        category: 'values',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What matters most to you in life?',
        options: [
          { value: 'family', label: 'Family and relationships', weight: 1 },
          { value: 'career', label: 'Career achievement and success', weight: 2 },
          { value: 'experiences', label: 'Experiences and adventure', weight: 3 },
          { value: 'balance', label: 'Balance of everything', weight: 4 }
        ]
      }
    ]
  };

  // =====================================================
  // FOCUS AREA QUESTION POOLS
  // =====================================================

  const focusAreaQuestions = {
    finances: [
      {
        id: 'fin_management',
        category: 'finances',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How do you prefer to manage money as a couple?',
        options: [
          { value: 'everything_joint', label: 'Everything joint - complete partnership', weight: 1 },
          { value: 'mostly_joint', label: 'Mostly joint with personal spending money', weight: 2 },
          { value: 'split', label: 'Split shared expenses, keep rest separate', weight: 3 },
          { value: 'independent', label: 'Mostly independent finances', weight: 4 }
        ]
      },
      {
        id: 'fin_saving',
        category: 'finances',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What\'s your approach to saving?',
        options: [
          { value: 'aggressive', label: 'Aggressive - save as much as possible', weight: 1 },
          { value: 'balanced', label: 'Balanced - save and enjoy', weight: 2 },
          { value: 'flexible', label: 'Flexible - save when convenient', weight: 3 },
          { value: 'enjoy_now', label: 'Enjoy now, save what\'s left', weight: 4 }
        ]
      },
      {
        id: 'fin_spending',
        category: 'finances',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How do you feel about spontaneous purchases?',
        options: [
          { value: 'never', label: 'Never - always plan purchases', weight: 1 },
          { value: 'small_only', label: 'Only small items spontaneously', weight: 2 },
          { value: 'sometimes', label: 'Sometimes, if we can afford it', weight: 3 },
          { value: 'often', label: 'Often - life is short', weight: 4 }
        ]
      },
      {
        id: 'fin_debt',
        category: 'finances',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How do you view debt?',
        options: [
          { value: 'avoid', label: 'Avoid all debt except mortgage', weight: 1 },
          { value: 'strategic', label: 'Strategic debt is okay', weight: 2 },
          { value: 'comfortable', label: 'Comfortable with manageable debt', weight: 3 },
          { value: 'not_worried', label: 'Not too worried about debt', weight: 4 }
        ]
      }
    ],

    communication: [
      {
        id: 'comm_conflict',
        category: 'communication',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How do you prefer to handle disagreements?',
        options: [
          { value: 'immediately', label: 'Discuss immediately until resolved', weight: 1 },
          { value: 'cool_off', label: 'Cool off first, then discuss', weight: 2 },
          { value: 'compromise', label: 'Find quick compromise', weight: 3 },
          { value: 'let_go', label: 'Let small things go', weight: 4 }
        ]
      },
      {
        id: 'comm_expression',
        category: 'communication',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How do you prefer to express love?',
        options: [
          { value: 'words', label: 'Words of affirmation', weight: 1 },
          { value: 'acts', label: 'Acts of service', weight: 2 },
          { value: 'touch', label: 'Physical affection', weight: 3 },
          { value: 'gifts', label: 'Thoughtful gifts', weight: 4 }
        ]
      },
      {
        id: 'comm_space',
        category: 'communication',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How much personal space do you need?',
        options: [
          { value: 'together', label: 'Love being together constantly', weight: 1 },
          { value: 'mostly_together', label: 'Mostly together, some alone time', weight: 2 },
          { value: 'balanced', label: 'Balanced together and apart', weight: 3 },
          { value: 'lots_space', label: 'Need significant personal time', weight: 4 }
        ]
      }
    ],

    values: [
      {
        id: 'val_religion',
        category: 'values',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'What role does spirituality/religion play in your life?',
        options: [
          { value: 'central', label: 'Central - guides everything', weight: 1 },
          { value: 'important', label: 'Important but personal', weight: 2 },
          { value: 'somewhat', label: 'Somewhat important', weight: 3 },
          { value: 'not', label: 'Not significant', weight: 4 }
        ]
      },
      {
        id: 'val_success',
        category: 'values',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How do you define success?',
        options: [
          { value: 'family', label: 'Happy family and relationships', weight: 1 },
          { value: 'career', label: 'Career and financial achievement', weight: 2 },
          { value: 'growth', label: 'Personal growth and fulfillment', weight: 3 },
          { value: 'impact', label: 'Making a difference for others', weight: 4 }
        ]
      }
    ],

    lifestyle: [
      {
        id: 'life_weekends',
        category: 'lifestyle',
        importance: 'NORMAL',
        importanceWeight: 1.0,
        question: 'How do you prefer to spend weekends?',
        options: [
          { value: 'social', label: 'Socially active - events and friends', weight: 1 },
          { value: 'mix', label: 'Mix of social and quiet time', weight: 2 },
          { value: 'relaxed', label: 'Relaxed at home together', weight: 3 },
          { value: 'solo', label: 'Recharge with solo time', weight: 4 }
        ]
      },
      {
        id: 'life_fitness',
        category: 'lifestyle',
        importance: 'NORMAL',
        importanceWeight: 1.0,
        question: 'How important is health and fitness?',
        options: [
          { value: 'very', label: 'Very - regular exercise is essential', weight: 1 },
          { value: 'moderate', label: 'Moderately - try to stay active', weight: 2 },
          { value: 'casual', label: 'Casual approach', weight: 3 },
          { value: 'not', label: 'Not a priority', weight: 4 }
        ]
      },
      {
        id: 'life_social',
        category: 'lifestyle',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How social do you like to be?',
        options: [
          { value: 'very', label: 'Very social - love having people around', weight: 1 },
          { value: 'moderate', label: 'Moderate - enjoy socializing in doses', weight: 2 },
          { value: 'selective', label: 'Selective - quality over quantity', weight: 3 },
          { value: 'homebody', label: 'Homebody - prefer quiet evenings', weight: 4 }
        ]
      }
    ],

    family: [
      {
        id: 'fam_children',
        category: 'family',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How do you feel about having children?',
        options: [
          { value: 'definitely', label: 'Definitely want children', weight: 1 },
          { value: 'probably', label: 'Probably, not urgent', weight: 2 },
          { value: 'unsure', label: 'Unsure, still figuring out', weight: 3 },
          { value: 'no', label: 'Don\'t want children', weight: 4 }
        ]
      },
      {
        id: 'fam_extended',
        category: 'family',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How involved should extended family be?',
        options: [
          { value: 'very', label: 'Very involved - family is everything', weight: 1 },
          { value: 'close', label: 'Close with healthy boundaries', weight: 2 },
          { value: 'occasional', label: 'Occasional contact', weight: 3 },
          { value: 'minimal', label: 'Minimal involvement', weight: 4 }
        ]
      }
    ],

    travel: [
      {
        id: 'travel_importance',
        category: 'travel',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How important is travel in your life?',
        options: [
          { value: 'essential', label: 'Essential - top priority', weight: 1 },
          { value: 'important', label: 'Important - want regular trips', weight: 2 },
          { value: 'occasional', label: 'Occasional trips are fine', weight: 3 },
          { value: 'homebody', label: 'Prefer staying close to home', weight: 4 }
        ]
      },
      {
        id: 'travel_style_gen',
        category: 'travel',
        importance: 'NORMAL',
        importanceWeight: 1.0,
        question: 'What\'s your travel planning style?',
        options: [
          { value: 'planned', label: 'Everything planned in advance', weight: 1 },
          { value: 'outline', label: 'Rough outline, flexible', weight: 2 },
          { value: 'spontaneous', label: 'Spontaneous, minimal planning', weight: 3 },
          { value: 'no_plan', label: 'No plan, pure adventure', weight: 4 }
        ]
      }
    ],

    home: [
      {
        id: 'home_ownership',
        category: 'home',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How important is owning a home?',
        options: [
          { value: 'essential', label: 'Essential - want to own ASAP', weight: 1 },
          { value: 'important', label: 'Important, timing flexible', weight: 2 },
          { value: 'nice', label: 'Nice to have, not priority', weight: 3 },
          { value: 'rent_fine', label: 'Happy renting long-term', weight: 4 }
        ]
      },
      {
        id: 'home_location_gen',
        category: 'home',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'What type of area do you want to live in?',
        options: [
          { value: 'city', label: 'City center - urban, walkable', weight: 1 },
          { value: 'suburbs', label: 'Suburbs - quiet, spacious', weight: 2 },
          { value: 'small_town', label: 'Small town - community feel', weight: 3 },
          { value: 'rural', label: 'Rural - nature, privacy', weight: 4 }
        ]
      }
    ],

    career: [
      {
        id: 'career_importance',
        category: 'career',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How important is career advancement?',
        options: [
          { value: 'top', label: 'Top priority - ambitious goals', weight: 1 },
          { value: 'important', label: 'Important but balanced', weight: 2 },
          { value: 'stable', label: 'Prefer stability over climbing', weight: 3 },
          { value: 'not', label: 'Not a major focus', weight: 4 }
        ]
      },
      {
        id: 'career_balance',
        category: 'career',
        importance: 'IMPORTANT',
        importanceWeight: 1.2,
        question: 'How do you approach work-life balance?',
        options: [
          { value: 'work_first', label: 'Work hard now, enjoy later', weight: 1 },
          { value: 'flexible', label: 'Flexible, work when productive', weight: 2 },
          { value: 'boundaries', label: 'Clear boundaries, protect personal time', weight: 3 },
          { value: 'life_first', label: 'Life first, work fits around it', weight: 4 }
        ]
      }
    ]
  };

  // =====================================================
  // BUILD THE QUESTION SET
  // =====================================================

  const questions = [];
  const usedIds = new Set();

  // Helper to add questions without duplicates
  const addQuestions = (pool, count) => {
    let added = 0;
    for (const q of pool) {
      if (added >= count) break;
      if (!usedIds.has(q.id)) {
        questions.push(q);
        usedIds.add(q.id);
        added++;
      }
    }
    return added;
  };

  // 1. Add priority-specific questions (50% of target)
  const priorityPool = priorityQuestions[currentPriority] || priorityQuestions.just_exploring;
  const priorityCount = Math.ceil(targetCount * 0.5);
  addQuestions(priorityPool, priorityCount);

  // 2. Add focus area questions (30% of target)
  const focusCount = Math.ceil(targetCount * 0.3);
  const questionsPerFocus = Math.ceil(focusCount / focusAreas.length);

  for (const area of focusAreas) {
    const areaPool = focusAreaQuestions[area] || [];
    addQuestions(areaPool, questionsPerFocus);
  }

  // 3. Fill remaining with foundational questions from other areas
  const remaining = targetCount - questions.length;
  if (remaining > 0) {
    // Add from areas not yet covered
    const allAreas = ['communication', 'values', 'lifestyle', 'finances'];
    for (const area of allAreas) {
      if (questions.length >= targetCount) break;
      const pool = focusAreaQuestions[area] || [];
      addQuestions(pool, 2);
    }
  }

  // 4. If still short, add conditional questions
  if (questions.length < targetCount) {
    if (!isMarried && !usedIds.has('marriage_timeline')) {
      questions.push({
        id: 'marriage_timeline',
        category: 'future',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'When do you see yourselves getting married?',
        options: [
          { value: 'asap', label: 'As soon as possible', weight: 1 },
          { value: '1_2_years', label: 'Within 1-2 years', weight: 2 },
          { value: '3_5_years', label: 'In 3-5 years', weight: 3 },
          { value: 'no_rush', label: 'No specific timeline', weight: 4 }
        ]
      });
    }

    if (!hasChildren && !usedIds.has('fam_children')) {
      questions.push({
        id: 'children_feelings',
        category: 'family',
        importance: 'CRITICAL',
        importanceWeight: 1.5,
        question: 'How do you feel about having children?',
        options: [
          { value: 'definitely', label: 'Definitely want children', weight: 1 },
          { value: 'probably', label: 'Probably, not urgent', weight: 2 },
          { value: 'unsure', label: 'Unsure, still figuring out', weight: 3 },
          { value: 'no', label: 'Don\'t want children', weight: 4 }
        ]
      });
    }
  }

  console.log(`📋 Fallback generated ${questions.length} questions for priority: ${currentPriority}, focus: ${focusAreas.join(', ')}, depth: ${depth} (target: ${targetCount})`);

  return questions;
};

// =====================================================
// AI ANALYSIS
// =====================================================

export const analyzeAssessmentResults = async (assessmentData) => {
  const { session, prescreening, questions, responses, conversational } = assessmentData;
  const partnerNames = {
    partner1: session.partner1_name,
    partner2: session.partner2_name
  };

  // Extract prescreening context
  const p1 = prescreening?.partner1 || {};
  const currentPriority = p1.current_priority || 'just_exploring';
  const focusAreas = p1.focus_areas || ['finances', 'communication', 'values'];
  const relationshipLength = p1.relationship_length || 'unknown';
  const isMarried = p1.is_married || false;
  const hasChildren = p1.has_children || false;
  const livingSituation = p1.living_situation || 'unknown';

  const priorityLabels = {
    buy_home: 'buying a home',
    travel_trip: 'planning a big trip',
    wedding: 'planning their wedding',
    baby: 'starting a family',
    career_change: 'navigating a career transition',
    financial_goal: 'reaching a financial goal',
    moving: 'moving to a new place',
    just_exploring: 'exploring their relationship'
  };

  const systemPrompt = `You are Luna, a warm and insightful AI relationship coach. You've just helped a couple complete their compatibility assessment.

CRITICAL CONTEXT ABOUT THIS COUPLE:
- Their main goal right now: ${priorityLabels[currentPriority] || 'exploring their relationship'}
- Focus areas they care about: ${focusAreas.join(', ')}
- Relationship length: ${formatRelationshipLength(relationshipLength)}
- Married: ${isMarried ? 'Yes' : 'No'}
- Have children: ${hasChildren ? 'Yes' : 'No'}
- Living situation: ${formatLivingSituation(livingSituation)}

ANALYSIS WEIGHTING INSTRUCTIONS:
1. Questions related to their PRIORITY (${currentPriority}) should be weighted MORE heavily in your analysis
2. Misalignments in their focus areas (${focusAreas.join(', ')}) are MORE significant than other areas
3. For couples ${relationshipLength === 'under_1_year' ? 'who are new together, values alignment is crucial' : relationshipLength === '5_plus_years' ? 'who have been together 5+ years, future vision alignment is crucial' : 'at their stage, both values and practical alignment matter'}
4. ${isMarried ? 'Since they are married, focus on deepening partnership and growth areas' : 'Since they are not yet married, alignment on big life decisions is especially important'}

Your task is to analyze their responses and provide:
1. A weighted alignment score (0-100) - weight their PRIORITY and FOCUS AREAS more heavily
2. Category-by-category breakdown
3. Strong alignments with positive insights (especially celebrate alignment in their priority area!)
4. Misalignments with constructive guidance (flag priority-area misalignments as more urgent)
5. A warm, personalized analysis that references their specific situation and goals
6. Recommended goals that directly relate to their stated priority

Be warm, supportive, and constructive - never judgmental.`;

  const analysisPrompt = buildAnalysisPrompt(partnerNames, questions, responses, prescreening, conversational);

  try {
    console.log('🤖 Luna: Analyzing assessment results...');
    console.log('📋 Analysis context - Priority:', currentPriority, 'Focus:', focusAreas.join(', '));

    const response = await callClaude(
      [{ role: 'user', content: analysisPrompt }],
      { systemPrompt, maxTokens: 4096, temperature: 0.7 }
    );

    const analysis = parseAnalysisResponse(response, questions, responses);

    console.log(`✅ Luna's analysis complete. Alignment score: ${analysis.alignmentScore}%`);
    return { data: analysis, error: null };

  } catch (error) {
    console.error('❌ Error analyzing results:', error);
    const fallbackAnalysis = calculateFallbackAnalysis(questions, responses, partnerNames, prescreening);
    return { data: fallbackAnalysis, error };
  }
};

const buildAnalysisPrompt = (partnerNames, questions, responses, prescreening, conversational) => {
  const { partner1Answers, partner2Answers } = responses;
  const p1 = prescreening?.partner1 || {};
  const currentPriority = p1.current_priority || 'just_exploring';
  const focusAreas = p1.focus_areas || [];

  const comparisons = questions.map(q => {
    const p1Answer = partner1Answers[q.id];
    const p2Answer = partner2Answers[q.id];

    if (!p1Answer || !p2Answer) return null;

    const p1Option = q.options.find(o => o.value === p1Answer.value);
    const p2Option = q.options.find(o => o.value === p2Answer.value);

    // Check if this question is in their priority or focus areas
    const isInPriority = q.category === currentPriority ||
                         (currentPriority === 'financial_goal' && q.category === 'finances') ||
                         (currentPriority === 'buy_home' && q.category === 'home') ||
                         (currentPriority === 'baby' && q.category === 'family');
    const isInFocusArea = focusAreas.includes(q.category);

    return {
      category: q.category,
      importance: q.importance,
      question: q.question,
      partner1Answer: p1Option?.label || p1Answer.value,
      partner2Answer: p2Option?.label || p2Answer.value,
      aligned: p1Answer.value === p2Answer.value,
      weightDiff: Math.abs((p1Option?.weight || 0) - (p2Option?.weight || 0)),
      isHighPriority: isInPriority || isInFocusArea,
      priorityNote: isInPriority ? `PRIORITY AREA (${currentPriority})` : isInFocusArea ? `FOCUS AREA` : null
    };
  }).filter(Boolean);

  // Separate high-priority and regular comparisons
  const highPriorityComparisons = comparisons.filter(c => c.isHighPriority);
  const regularComparisons = comparisons.filter(c => !c.isHighPriority);

  return `Analyze this couple's compatibility assessment:

COUPLE: ${partnerNames.partner1} and ${partnerNames.partner2}
THEIR MAIN GOAL: ${currentPriority}
THEIR FOCUS AREAS: ${focusAreas.join(', ') || 'general'}

=== HIGH PRIORITY QUESTIONS (weight these 1.5x in scoring) ===
${JSON.stringify(highPriorityComparisons, null, 2)}

=== OTHER QUESTIONS ===
${JSON.stringify(regularComparisons, null, 2)}

SCORING GUIDANCE:
- Same answer = 100% alignment
- 1 weight apart = 75% alignment
- 2 weights apart = 50% alignment
- 3+ weights apart = 25% alignment
- HIGH PRIORITY questions count 1.5x in the overall score

Return a JSON object with:
{
  "alignmentScore": <0-100>,
  "categoryScores": { "<category>": <0-100>, ... },
  "strongAlignments": [{ "question": "...", "sharedAnswer": "...", "insight": "..." }],
  "misalignments": [{ "question": "...", "partner1Answer": "...", "partner2Answer": "...", "severity": "high|medium|low", "insight": "...", "discussionPrompt": "..." }],
  "lunaAnalysis": "<2-3 paragraphs referencing their specific priority and situation>",
  "discussionPrompts": ["<specific to their goal>", ...],
  "recommendedGoals": ["<goals related to their priority>", ...]
}`;
};

const parseAnalysisResponse = (response, questions, responses) => {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        alignmentScore: analysis.alignmentScore || 75,
        categoryScores: analysis.categoryScores || {},
        strongAlignments: analysis.strongAlignments || [],
        misalignments: analysis.misalignments || [],
        lunaAnalysis: analysis.lunaAnalysis || 'Unable to generate analysis.',
        discussionPrompts: analysis.discussionPrompts || [],
        recommendedGoals: analysis.recommendedGoals || [],
        questionsAsked: questions.length,
        analysisModel: 'claude'
      };
    }
    throw new Error('No JSON found');
  } catch (error) {
    return calculateFallbackAnalysis(questions, responses, { partner1: 'Partner 1', partner2: 'Partner 2' }, null);
  }
};

const calculateFallbackAnalysis = (questions, responses, partnerNames, prescreening) => {
  const { partner1Answers, partner2Answers } = responses;

  // Get prescreening context for intelligent weighting
  const p1Pre = prescreening?.partner1 || {};
  const currentPriority = p1Pre.current_priority || 'just_exploring';
  const focusAreas = p1Pre.focus_areas || [];

  // Map priority to related categories for intelligent weighting
  const priorityCategoryMap = {
    financial_goal: ['finances', 'financial'],
    buy_home: ['home', 'moving'],
    moving: ['moving', 'home', 'lifestyle'],
    travel_trip: ['travel'],
    wedding: ['wedding', 'family', 'values'],
    baby: ['family', 'parenting', 'lifestyle'],
    career_change: ['career', 'finances'],
    just_exploring: []
  };
  const priorityCategories = priorityCategoryMap[currentPriority] || [];

  let totalWeightedScore = 0;
  let totalPossibleScore = 0;
  const categoryScores = {};
  const strongAlignments = [];
  const misalignments = [];

  questions.forEach(question => {
    const p1 = partner1Answers[question.id];
    const p2 = partner2Answers[question.id];

    if (!p1 || !p2) return;

    const p1Option = question.options.find(o => o.value === p1.value);
    const p2Option = question.options.find(o => o.value === p2.value);

    if (!p1Option || !p2Option) return;

    const weightDiff = Math.abs(p1Option.weight - p2Option.weight);
    const maxDiff = question.options.length - 1;
    const alignment = 1 - (weightDiff / maxDiff);

    // INTELLIGENT WEIGHTING: Apply extra weight to priority and focus area questions
    let questionWeight = question.importanceWeight || 1.0;
    const isInPriority = priorityCategories.includes(question.category);
    const isInFocusArea = focusAreas.includes(question.category);

    if (isInPriority) {
      questionWeight *= 1.5; // Priority area questions count 1.5x
    } else if (isInFocusArea) {
      questionWeight *= 1.3; // Focus area questions count 1.3x
    }

    totalWeightedScore += alignment * questionWeight;
    totalPossibleScore += questionWeight;

    if (!categoryScores[question.category]) {
      categoryScores[question.category] = { score: 0, possible: 0 };
    }
    categoryScores[question.category].score += alignment * questionWeight;
    categoryScores[question.category].possible += questionWeight;

    // Generate contextual insights
    const priorityLabel = isInPriority ? ' (key for your goal!)' : isInFocusArea ? ' (in your focus area)' : '';

    if (p1.value === p2.value) {
      strongAlignments.push({
        question: question.question,
        sharedAnswer: p1Option.label,
        insight: isInPriority
          ? `Great alignment on something crucial for ${formatPriorityLabel(currentPriority)}!`
          : 'You both feel the same way about this!',
        isHighPriority: isInPriority || isInFocusArea
      });
    } else if (alignment < 0.5) {
      misalignments.push({
        question: question.question,
        partner1Answer: p1Option.label,
        partner2Answer: p2Option.label,
        severity: isInPriority ? 'high' : alignment < 0.25 ? 'high' : 'medium',
        insight: isInPriority
          ? `This difference is important to discuss since you\'re focused on ${formatPriorityLabel(currentPriority)}.`
          : 'This is an area where you have different perspectives.',
        discussionPrompt: `Talk about why you each feel differently about: ${question.question}`,
        isHighPriority: isInPriority || isInFocusArea
      });
    }
  });

  const alignmentScore = totalPossibleScore > 0
    ? Math.round((totalWeightedScore / totalPossibleScore) * 100)
    : 75;

  const categoryPercentages = {};
  Object.keys(categoryScores).forEach(cat => {
    const { score, possible } = categoryScores[cat];
    categoryPercentages[cat] = possible > 0 ? Math.round((score / possible) * 100) : 75;
  });

  // Sort alignments/misalignments to prioritize high-priority items first
  const sortedAlignments = strongAlignments
    .sort((a, b) => (b.isHighPriority ? 1 : 0) - (a.isHighPriority ? 1 : 0))
    .slice(0, 5);
  const sortedMisalignments = misalignments
    .sort((a, b) => (b.isHighPriority ? 1 : 0) - (a.isHighPriority ? 1 : 0))
    .slice(0, 5);

  // Generate contextual analysis
  const priorityScore = categoryPercentages[priorityCategories[0]] || alignmentScore;
  const analysisText = generateContextualAnalysis(
    alignmentScore,
    priorityScore,
    currentPriority,
    sortedAlignments.length,
    sortedMisalignments.length,
    partnerNames
  );

  // Generate contextual goals based on their priority
  const recommendedGoals = generateContextualGoals(currentPriority, focusAreas, sortedMisalignments);

  return {
    alignmentScore,
    categoryScores: categoryPercentages,
    strongAlignments: sortedAlignments,
    misalignments: sortedMisalignments,
    lunaAnalysis: analysisText,
    discussionPrompts: generateContextualPrompts(currentPriority, sortedMisalignments),
    recommendedGoals,
    questionsAsked: questions.length,
    analysisModel: 'fallback-intelligent'
  };
};

// Helper to format priority label
const formatPriorityLabel = (priority) => {
  const labels = {
    buy_home: 'buying a home',
    travel_trip: 'your trip planning',
    wedding: 'wedding planning',
    baby: 'starting a family',
    career_change: 'career transition',
    financial_goal: 'your financial goal',
    moving: 'your move',
    just_exploring: 'your relationship'
  };
  return labels[priority] || priority;
};

// Generate contextual analysis text
const generateContextualAnalysis = (overallScore, priorityScore, priority, alignCount, misalignCount, partnerNames) => {
  const priorityLabel = formatPriorityLabel(priority);

  let analysis = `Based on your assessment, ${partnerNames.partner1} and ${partnerNames.partner2} have a ${overallScore}% overall compatibility score. `;

  if (priority !== 'just_exploring') {
    if (priorityScore >= 80) {
      analysis += `Great news for ${priorityLabel} - you're very aligned on the key decisions! `;
    } else if (priorityScore >= 60) {
      analysis += `For ${priorityLabel}, you have solid alignment with a few areas to discuss. `;
    } else {
      analysis += `When it comes to ${priorityLabel}, there are some important differences to work through together. `;
    }
  }

  if (alignCount > misalignCount) {
    analysis += `You share common ground on ${alignCount} topics, which provides a strong foundation. `;
  }

  if (misalignCount > 0) {
    analysis += `The ${misalignCount} areas of difference represent opportunities for deeper conversation and understanding.`;
  }

  return analysis;
};

// Generate contextual discussion prompts
const generateContextualPrompts = (priority, misalignments) => {
  const prompts = ['What surprised you most about each other\'s answers?'];

  const priorityPrompts = {
    buy_home: 'How can you find a home that satisfies both of your priorities?',
    moving: 'What would your ideal new location look like if you combined both visions?',
    financial_goal: 'How can you balance your different financial approaches while reaching your goal?',
    travel_trip: 'How can you plan a trip that incorporates both of your travel styles?',
    baby: 'What parenting values are most important for you both to share?',
    wedding: 'How can your wedding reflect both of your visions?',
    career_change: 'How will you support each other through this career transition?'
  };

  if (priorityPrompts[priority]) {
    prompts.push(priorityPrompts[priority]);
  }

  if (misalignments.length > 0) {
    prompts.push(`Which of these differences feels most important to resolve first?`);
  }

  return prompts;
};

// Generate contextual goals based on priority and misalignments
const generateContextualGoals = (priority, focusAreas, misalignments) => {
  const goals = [];

  const priorityGoals = {
    buy_home: ['Create a Home Buying Criteria List', 'Set a Joint Housing Budget'],
    moving: ['Research Potential Locations Together', 'Create a Moving Timeline'],
    financial_goal: ['Build a Shared Savings Plan', 'Set Monthly Financial Check-ins'],
    travel_trip: ['Plan Your Dream Trip Together', 'Create a Travel Bucket List'],
    baby: ['Discuss Parenting Philosophy', 'Research Childcare Options'],
    wedding: ['Define Your Wedding Vision Together', 'Set a Wedding Budget'],
    career_change: ['Create a Transition Support Plan', 'Discuss Financial Runway'],
    just_exploring: ['Weekly Relationship Check-ins', 'Shared Goal Setting']
  };

  goals.push(...(priorityGoals[priority] || priorityGoals.just_exploring));

  // Add goals based on misalignment areas
  if (misalignments.some(m => m.question.toLowerCase().includes('communicat'))) {
    goals.push('Communication Style Workshop');
  }
  if (misalignments.some(m => m.question.toLowerCase().includes('financ') || m.question.toLowerCase().includes('money'))) {
    goals.push('Joint Financial Planning Session');
  }

  return goals.slice(0, 4);
};

// =====================================================
// FOLLOW-UP GENERATION
// =====================================================

export const generateFollowUpQuestion = async (misalignment, partnerNames, partnerNumber) => {
  const partnerName = partnerNumber === 1 ? partnerNames.partner1 : partnerNames.partner2;

  try {
    const response = await callClaude(
      [{ role: 'user', content: `Generate ONE follow-up question for ${partnerName} who answered "${misalignment.partner1Answer}" to: "${misalignment.question}". Their partner answered differently. Be warm and curious.` }],
      { systemPrompt: 'You are Luna, a warm relationship coach.', maxTokens: 200, temperature: 0.8 }
    );
    return { data: response.trim(), error: null };
  } catch (error) {
    return { data: `${partnerName}, can you share more about your perspective?`, error };
  }
};

// =====================================================
// HELPER FORMATTERS
// =====================================================

const formatRelationshipLength = (value) => {
  const map = {
    'under_1_year': 'Less than 1 year',
    '1_3_years': '1-3 years',
    '3_5_years': '3-5 years',
    '5_plus_years': '5+ years'
  };
  return map[value] || value || 'Not specified';
};

const formatLivingSituation = (value) => {
  const map = {
    'together': 'Living together',
    'separate': 'Living separately (same city)',
    'long_distance': 'Long-distance relationship'
  };
  return map[value] || value || 'Not specified';
};

const formatWantsChildren = (value) => {
  const map = {
    'yes_soon': 'Want children soon',
    'yes_later': 'Want children eventually',
    'maybe': 'Undecided',
    'no': 'Don\'t want children'
  };
  return map[value] || value || 'Not specified';
};
