// Pre-screening questions to collect context for adaptive question generation
// These help Luna understand the couple's situation and focus areas

export const PRESCREENING_QUESTIONS = [
  // Section 1: Relationship Context
  {
    id: 'relationship_length',
    question: "How long have you been together?",
    type: 'select',
    lucideIcon: 'HeartHandshake',
    iconColor: 'from-rose-500 to-pink-600',
    section: 'relationship',
    options: [
      { value: 'under_1_year', label: 'Less than 1 year', lucideIcon: 'Sprout' },
      { value: '1_3_years', label: '1-3 years', lucideIcon: 'Flower' },
      { value: '3_5_years', label: '3-5 years', lucideIcon: 'TreeDeciduous' },
      { value: '5_plus_years', label: '5+ years', lucideIcon: 'TreePine' }
    ]
  },
  {
    id: 'is_married',
    question: "Are you already married?",
    type: 'boolean',
    lucideIcon: 'Gem',
    iconColor: 'from-violet-500 to-purple-600',
    section: 'relationship',
    options: [
      { value: true, label: "Yes, we're married", lucideIcon: 'Heart' },
      { value: false, label: 'Not yet', lucideIcon: 'Clock' }
    ]
  },
  {
    id: 'living_situation',
    question: "What's your current living situation?",
    type: 'select',
    lucideIcon: 'Home',
    iconColor: 'from-blue-500 to-indigo-600',
    section: 'relationship',
    options: [
      { value: 'together', label: 'We live together', lucideIcon: 'Home' },
      { value: 'separate', label: 'We live separately (same area)', lucideIcon: 'Building2' },
      { value: 'long_distance', label: "We're long-distance", lucideIcon: 'Plane' }
    ]
  },

  // Section 2: Life Stage (Skip irrelevant questions)
  {
    id: 'owns_home',
    question: "Do you own a home together?",
    type: 'boolean',
    lucideIcon: 'Key',
    iconColor: 'from-amber-500 to-orange-600',
    section: 'life_stage',
    options: [
      { value: true, label: 'Yes, we own our home', lucideIcon: 'KeyRound' },
      { value: false, label: 'No, we rent or live with family', lucideIcon: 'DoorOpen' }
    ]
  },
  {
    id: 'has_children',
    question: "Do you have children together?",
    type: 'boolean',
    lucideIcon: 'Baby',
    iconColor: 'from-pink-500 to-rose-600',
    section: 'life_stage',
    options: [
      { value: true, label: 'Yes, we have kids', lucideIcon: 'Users' },
      { value: false, label: "No, we don't have kids yet", lucideIcon: 'UserPlus' }
    ]
  },
  {
    id: 'wants_children',
    question: "How do you feel about having children?",
    type: 'select',
    lucideIcon: 'Heart',
    iconColor: 'from-pink-500 to-rose-600',
    section: 'life_stage',
    dependsOn: { questionId: 'has_children', value: false },
    options: [
      { value: 'yes_soon', label: 'We want kids soon', lucideIcon: 'Baby' },
      { value: 'yes_later', label: 'We want kids eventually', lucideIcon: 'CalendarHeart' },
      { value: 'maybe', label: "We're undecided", lucideIcon: 'HelpCircle' },
      { value: 'no', label: "We don't want children", lucideIcon: 'X' }
    ]
  },

  // Section 3: What do you want to explore? (KEY QUESTION)
  {
    id: 'focus_areas',
    question: "What areas would you like to explore together?",
    type: 'multiselect',
    lucideIcon: 'Compass',
    iconColor: 'from-teal-500 to-emerald-600',
    section: 'focus',
    description: "Select all that interest you",
    options: [
      { value: 'finances', label: 'Money & Finances', description: 'Spending, saving, budgeting, financial goals', lucideIcon: 'Wallet' },
      { value: 'travel', label: 'Travel & Adventure', description: 'Trip planning, destinations, travel styles', lucideIcon: 'Plane' },
      { value: 'home', label: 'Home & Living', description: 'Buying a home, decorating, location preferences', lucideIcon: 'Home' },
      { value: 'career', label: 'Career & Work', description: 'Work-life balance, career ambitions, job changes', lucideIcon: 'Briefcase' },
      { value: 'family', label: 'Family Planning', description: 'Children, parenting styles, family dynamics', lucideIcon: 'Users' },
      { value: 'lifestyle', label: 'Daily Lifestyle', description: 'Routines, hobbies, social life, health', lucideIcon: 'Sparkles' },
      { value: 'communication', label: 'Communication', description: 'How you talk, resolve conflicts, express love', lucideIcon: 'MessageCircle' },
      { value: 'values', label: 'Values & Beliefs', description: 'Life priorities, spirituality, what matters most', lucideIcon: 'Star' }
    ]
  },

  // Section 4: Current Priority
  {
    id: 'current_priority',
    question: "What's your biggest shared goal right now?",
    type: 'select',
    lucideIcon: 'Target',
    iconColor: 'from-indigo-500 to-violet-600',
    section: 'priority',
    options: [
      { value: 'buy_home', label: 'Buying a home', lucideIcon: 'Home' },
      { value: 'travel_trip', label: 'Planning a big trip', lucideIcon: 'MapPin' },
      { value: 'wedding', label: 'Planning our wedding', lucideIcon: 'Heart' },
      { value: 'baby', label: 'Starting a family', lucideIcon: 'Baby' },
      { value: 'career_change', label: 'Career transition', lucideIcon: 'TrendingUp' },
      { value: 'financial_goal', label: 'Reaching a financial goal', lucideIcon: 'PiggyBank' },
      { value: 'moving', label: 'Moving to a new place', lucideIcon: 'Truck' },
      { value: 'just_exploring', label: 'Just exploring our alignment', lucideIcon: 'Search' }
    ]
  },

  // Section 5: Assessment Depth
  {
    id: 'assessment_depth',
    question: "How deep do you want to go?",
    type: 'select',
    lucideIcon: 'Layers',
    iconColor: 'from-cyan-500 to-blue-600',
    section: 'depth',
    options: [
      { value: 'quick', label: 'Quick Check (10-15 questions)', description: 'Get a snapshot of your alignment', lucideIcon: 'Zap' },
      { value: 'standard', label: 'Standard (20-25 questions)', description: 'Balanced depth and coverage', lucideIcon: 'BarChart3' },
      { value: 'deep', label: 'Deep Dive (30-40 questions)', description: 'Comprehensive exploration', lucideIcon: 'Microscope' }
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
