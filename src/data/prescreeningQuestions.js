// Pre-screening questions to collect context for adaptive question generation
// These help Luna understand the couple's situation and focus areas

export const PRESCREENING_QUESTIONS = [
  // Section 1: Relationship Context
  {
    id: 'relationship_length',
    question: "How long have you been together?",
    type: 'select',
    icon: '💑',
    section: 'relationship',
    options: [
      { value: 'under_1_year', label: 'Less than 1 year' },
      { value: '1_3_years', label: '1-3 years' },
      { value: '3_5_years', label: '3-5 years' },
      { value: '5_plus_years', label: '5+ years' }
    ]
  },
  {
    id: 'is_married',
    question: "Are you already married?",
    type: 'boolean',
    icon: '💍',
    section: 'relationship',
    options: [
      { value: true, label: "Yes, we're married" },
      { value: false, label: 'Not yet' }
    ]
  },
  {
    id: 'living_situation',
    question: "What's your current living situation?",
    type: 'select',
    icon: '🏠',
    section: 'relationship',
    options: [
      { value: 'together', label: 'We live together' },
      { value: 'separate', label: 'We live separately (same area)' },
      { value: 'long_distance', label: "We're long-distance" }
    ]
  },

  // Section 2: Life Stage (Skip irrelevant questions)
  {
    id: 'owns_home',
    question: "Do you own a home together?",
    type: 'boolean',
    icon: '🔑',
    section: 'life_stage',
    options: [
      { value: true, label: 'Yes, we own our home' },
      { value: false, label: 'No, we rent or live with family' }
    ]
  },
  {
    id: 'has_children',
    question: "Do you have children together?",
    type: 'boolean',
    icon: '👶',
    section: 'life_stage',
    options: [
      { value: true, label: 'Yes, we have kids' },
      { value: false, label: "No, we don't have kids yet" }
    ]
  },
  {
    id: 'wants_children',
    question: "How do you feel about having children?",
    type: 'select',
    icon: '🍼',
    section: 'life_stage',
    dependsOn: { questionId: 'has_children', value: false },
    options: [
      { value: 'yes_soon', label: 'We want kids soon' },
      { value: 'yes_later', label: 'We want kids eventually' },
      { value: 'maybe', label: "We're undecided" },
      { value: 'no', label: "We don't want children" }
    ]
  },

  // Section 3: What do you want to explore? (KEY QUESTION)
  {
    id: 'focus_areas',
    question: "What areas would you like to explore together?",
    type: 'multiselect',
    icon: '🎯',
    section: 'focus',
    description: "Select all that interest you",
    options: [
      { value: 'finances', label: '💰 Money & Finances', description: 'Spending, saving, budgeting, financial goals' },
      { value: 'travel', label: '✈️ Travel & Adventure', description: 'Trip planning, destinations, travel styles' },
      { value: 'home', label: '🏡 Home & Living', description: 'Buying a home, decorating, location preferences' },
      { value: 'career', label: '💼 Career & Work', description: 'Work-life balance, career ambitions, job changes' },
      { value: 'family', label: '👨‍👩‍👧 Family Planning', description: 'Children, parenting styles, family dynamics' },
      { value: 'lifestyle', label: '🌟 Daily Lifestyle', description: 'Routines, hobbies, social life, health' },
      { value: 'communication', label: '💬 Communication', description: 'How you talk, resolve conflicts, express love' },
      { value: 'values', label: '💫 Values & Beliefs', description: 'Life priorities, spirituality, what matters most' }
    ]
  },

  // Section 4: Current Priority
  {
    id: 'current_priority',
    question: "What's your biggest shared goal right now?",
    type: 'select',
    icon: '🚀',
    section: 'priority',
    options: [
      { value: 'buy_home', label: '🏠 Buying a home' },
      { value: 'travel_trip', label: '✈️ Planning a big trip' },
      { value: 'wedding', label: '💒 Planning our wedding' },
      { value: 'baby', label: '👶 Starting a family' },
      { value: 'career_change', label: '💼 Career transition' },
      { value: 'financial_goal', label: '💰 Reaching a financial goal' },
      { value: 'moving', label: '📦 Moving to a new place' },
      { value: 'just_exploring', label: '🔍 Just exploring our alignment' }
    ]
  },

  // Section 5: Assessment Depth
  {
    id: 'assessment_depth',
    question: "How deep do you want to go?",
    type: 'select',
    icon: '📊',
    section: 'depth',
    options: [
      { value: 'quick', label: '⚡ Quick Check (10-15 questions)', description: 'Get a snapshot of your alignment' },
      { value: 'standard', label: '📋 Standard (20-25 questions)', description: 'Balanced depth and coverage' },
      { value: 'deep', label: '🔬 Deep Dive (30-40 questions)', description: 'Comprehensive exploration' }
    ]
  }
];

// Get visible questions based on current answers
export const getVisibleQuestions = (answers = {}) => {
  return PRESCREENING_QUESTIONS.filter(question => {
    // If question has no dependency, always show
    if (!question.dependsOn) return true;

    // Check if dependency condition is met
    const { questionId, value } = question.dependsOn;
    return answers[questionId] === value;
  });
};

// Check if all required questions are answered
export const isPrescreeningComplete = (answers = {}) => {
  const visibleQuestions = getVisibleQuestions(answers);
  return visibleQuestions.every(q => {
    const answer = answers[q.id];
    if (q.type === 'multiselect') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined;
  });
};

// Get focus areas for Luna to prioritize
export const getFocusAreas = (answers = {}) => {
  return answers.focus_areas || ['finances', 'communication', 'values'];
};

// Get question count based on depth
export const getQuestionCount = (answers = {}) => {
  const depth = answers.assessment_depth || 'standard';
  switch (depth) {
    case 'quick': return { min: 10, max: 15 };
    case 'deep': return { min: 30, max: 40 };
    default: return { min: 20, max: 25 };
  }
};
