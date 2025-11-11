/**
 * Deep Dive Generator
 *
 * Generates detailed analysis for milestones including:
 * - Cost breakdowns by category
 * - Common challenges and solutions
 * - Month-by-month action steps
 * - AI-powered tips and advice
 */

/**
 * Cost breakdown templates
 * Percentages should add up to 100%
 */
const COST_BREAKDOWNS = {
  wedding: [
    { category: 'Venue & Catering', percentage: 45, description: 'Reception venue, food, and drinks' },
    { category: 'Photography & Videography', percentage: 12, description: 'Professional photo and video services' },
    { category: 'Attire', percentage: 10, description: 'Wedding dress, suit, and accessories' },
    { category: 'Flowers & Decoration', percentage: 8, description: 'Bouquets, centerpieces, and venue decor' },
    { category: 'Music & Entertainment', percentage: 8, description: 'DJ, band, or entertainment' },
    { category: 'Invitations & Stationery', percentage: 3, description: 'Save-the-dates, invitations, thank you cards' },
    { category: 'Rings', percentage: 5, description: 'Wedding bands' },
    { category: 'Miscellaneous', percentage: 9, description: 'Transportation, favors, unexpected costs' }
  ],
  engagement: [
    { category: 'Engagement Ring', percentage: 80, description: 'The ring itself' },
    { category: 'Proposal Setup', percentage: 10, description: 'Location, decorations, photographer' },
    { category: 'Celebration', percentage: 10, description: 'Dinner, champagne, announcing' }
  ],
  home: [
    { category: 'Deposit (10%)', percentage: 10, description: 'Down payment on property' },
    { category: 'Mortgage Arrangement', percentage: 1, description: 'Mortgage fees and advisor costs' },
    { category: 'Legal & Survey', percentage: 2, description: 'Solicitor fees and property survey' },
    { category: 'Stamp Duty', percentage: 2, description: 'Government tax on property purchase' },
    { category: 'Moving & Initial Setup', percentage: 3, description: 'Moving costs, furniture, essentials' },
    { category: 'Mortgage Payments', percentage: 82, description: 'Ongoing monthly mortgage (over loan term)' }
  ],
  baby: [
    { category: 'Nursery Setup', percentage: 20, description: 'Crib, dresser, decor' },
    { category: 'Baby Gear', percentage: 25, description: 'Stroller, car seat, carrier' },
    { category: 'Clothing & Essentials', percentage: 15, description: 'Clothes, diapers, bottles' },
    { category: 'Medical & Delivery', percentage: 20, description: 'Prenatal care, delivery costs' },
    { category: 'First Year Supplies', percentage: 20, description: 'Ongoing diapers, formula, etc.' }
  ],
  travel: [
    { category: 'Flights', percentage: 35, description: 'Round-trip airfare' },
    { category: 'Accommodation', percentage: 30, description: 'Hotels or rentals' },
    { category: 'Activities & Tours', percentage: 15, description: 'Excursions and experiences' },
    { category: 'Food & Dining', percentage: 12, description: 'Meals and restaurants' },
    { category: 'Transportation', percentage: 5, description: 'Local transport, car rental' },
    { category: 'Miscellaneous', percentage: 3, description: 'Travel insurance, souvenirs' }
  ],
  career: [
    { category: 'Skills Development', percentage: 40, description: 'Courses, certifications' },
    { category: 'Networking', percentage: 15, description: 'Events, memberships' },
    { category: 'Professional Services', percentage: 20, description: 'CV review, career coaching' },
    { category: 'Interview Preparation', percentage: 15, description: 'Wardrobe, training' },
    { category: 'Transition Costs', percentage: 10, description: 'Potential income gap' }
  ],
  education: [
    { category: 'Tuition & Fees', percentage: 60, description: 'Course tuition' },
    { category: 'Books & Materials', percentage: 10, description: 'Textbooks, supplies' },
    { category: 'Living Expenses', percentage: 20, description: 'If full-time student' },
    { category: 'Technology', percentage: 5, description: 'Laptop, software' },
    { category: 'Miscellaneous', percentage: 5, description: 'Transport, misc costs' }
  ],
  financial: [
    { category: 'Emergency Fund', percentage: 40, description: '3-6 months expenses' },
    { category: 'Investments', percentage: 35, description: 'Stocks, ETFs, retirement' },
    { category: 'Debt Repayment', percentage: 15, description: 'Pay off high-interest debt' },
    { category: 'Savings Goals', percentage: 10, description: 'Specific goal savings' }
  ]
};

/**
 * Common challenges and solutions by goal type
 */
const CHALLENGES = {
  wedding: [
    {
      title: 'Guest List Management',
      description: 'Balancing family expectations with budget and venue capacity',
      solution: 'Set a firm number early, create A/B lists, have honest family conversations'
    },
    {
      title: 'Vendor Coordination',
      description: 'Managing multiple vendors with different timelines and requirements',
      solution: 'Use a wedding planner or detailed spreadsheet, set up vendor group chat'
    },
    {
      title: 'Budget Creep',
      description: 'Costs adding up beyond initial budget',
      solution: 'Build in 15% buffer, track every expense, say no to unnecessary upgrades'
    }
  ],
  engagement: [
    {
      title: 'Ring Selection',
      description: 'Choosing the perfect ring within budget',
      solution: 'Research styles together subtly, consider lab-grown diamonds, prioritize quality over size'
    },
    {
      title: 'Keeping it Secret',
      description: 'Planning proposal without spoiling the surprise',
      solution: 'Enlist trusted friend, use private browsing, plan during "work" time'
    }
  ],
  home: [
    {
      title: 'Saving Deposit',
      description: 'Accumulating required 10% deposit while managing expenses',
      solution: 'Automate savings, cut discretionary spending, consider Help to Buy schemes'
    },
    {
      title: 'Mortgage Approval',
      description: 'Meeting lender requirements for income and credit',
      solution: 'Get pre-approval early, improve credit score, reduce existing debts'
    },
    {
      title: 'Competitive Market',
      description: 'Finding and securing property in competitive market',
      solution: 'Be ready to move quickly, have finance in place, consider off-peak viewing times'
    }
  ],
  baby: [
    {
      title: 'Financial Preparation',
      description: 'Adjusting budget for reduced income and new expenses',
      solution: 'Build 6-month emergency fund, review parental leave benefits, create baby budget'
    },
    {
      title: 'Sleep Deprivation',
      description: 'Managing exhaustion while working',
      solution: 'Take turns with night feeds, accept help, consider parental leave timing'
    }
  ],
  travel: [
    {
      title: 'Trip Planning',
      description: 'Coordinating schedules, booking, and itinerary',
      solution: 'Book flights first, use planning apps, be flexible with dates for deals'
    },
    {
      title: 'Budget Management',
      description: 'Avoiding overspending while traveling',
      solution: 'Set daily budget, book key items in advance, mix splurge and save activities'
    }
  ],
  career: [
    {
      title: 'Job Search While Employed',
      description: 'Finding time for applications and interviews',
      solution: 'Use lunch breaks, schedule morning/evening interviews, be strategic'
    },
    {
      title: 'Skills Gap',
      description: 'Lacking required skills for target roles',
      solution: 'Online courses, side projects, highlight transferable skills'
    }
  ],
  education: [
    {
      title: 'Work-Study Balance',
      description: 'Managing full-time work with part-time study',
      solution: 'Set study schedule, negotiate flexible work hours, use weekends wisely'
    },
    {
      title: 'Funding',
      description: 'Paying for education while covering living costs',
      solution: 'Apply for scholarships, consider employer sponsorship, part-time study'
    }
  ],
  financial: [
    {
      title: 'Consistency',
      description: 'Maintaining savings habits month-to-month',
      solution: 'Automate everything, treat savings as bills, review progress monthly'
    },
    {
      title: 'Market Volatility',
      description: 'Dealing with investment ups and downs',
      solution: "Long-term mindset, diversify, don't panic sell, regular contributions"
    }
  ]
};

/**
 * AI Tips by goal type
 */
const AI_TIPS = {
  wedding: [
    'Book your venue 12-18 months in advance for best selection and pricing',
    'Friday or Sunday weddings can save 20-30% compared to Saturday',
    'Micro-weddings (30-50 guests) can cut costs in half while feeling intimate',
    'Off-season months (Nov-Mar) offer significant discounts from vendors',
    'Buffet or family-style service is cheaper than plated meals'
  ],
  engagement: [
    'Lab-grown diamonds are 30-40% cheaper and chemically identical to mined',
    'Consider unique stones like sapphire or morganite for budget savings',
    'Buy ring one month before proposal to avoid rush fees',
    'Proposal photographers often have 3-hour packages perfect for this'
  ],
  home: [
    'First-time buyers in Ireland can get up to €30k Help to Buy grant',
    'Save 3-6 months expenses AFTER deposit for unexpected costs',
    'Get mortgage pre-approval before house hunting to act quickly',
    'Consider properties needing cosmetic work for better value',
    'Mortgage brokers are free and access better rates than direct lenders'
  ],
  baby: [
    'Buy big-ticket items (crib, stroller) second-hand to save 50-70%',
    'Register for baby registry - friends/family love to contribute',
    'Cloth diapers save €1,000+ over disposables in first year',
    'Many baby essentials can be borrowed - ask parent friends first',
    "Hospital provides basics - don't overbuy before baby arrives"
  ],
  travel: [
    'Book flights on Tuesday/Wednesday for best prices',
    'Use Google Flights price tracking for deal alerts',
    'Shoulder season (just before/after peak) offers 30% savings',
    'Local Airbnb with kitchen saves money on dining out',
    'Free walking tours are excellent - just tip the guide'
  ],
  career: [
    'Tailor CV for each application - mention company name',
    'LinkedIn is key - recruiters search daily, keep it updated',
    'Network before applying - warm intros get 5x more interviews',
    'Practice STAR method for behavioral interview questions',
    'Research salary ranges before negotiating - know your worth'
  ],
  education: [
    'Apply for multiple scholarships - competition is less than you think',
    'Many employers offer education assistance - ask HR',
    'Online accredited programs are 40-60% cheaper than in-person',
    'Start part-time to test waters before committing to full program',
    'Use free resources (Khan Academy, Coursera audits) to test interest first'
  ],
  financial: [
    'Pay yourself first - automate savings on payday',
    'Emergency fund goes in high-yield savings, not investing',
    'Start with index funds (ETFs) - simple, low-cost, diversified',
    "Max out employer pension match - it's free money",
    'Review subscriptions quarterly - average person wastes €50/month'
  ]
};

/**
 * Calculate cost breakdown with actual amounts
 */
function calculateCostBreakdown(goalType, totalBudget) {
  const template = COST_BREAKDOWNS[goalType] || COST_BREAKDOWNS.financial;

  return template.map(item => ({
    ...item,
    amount: Math.round(totalBudget * (item.percentage / 100))
  }));
}

/**
 * Generate month-by-month action steps
 */
function generateActionSteps(goalType, timelineMonths, preferences = {}) {
  // Divide timeline into phases
  const phases = Math.min(timelineMonths, 6); // Max 6 phases for readability
  const monthsPerPhase = Math.ceil(timelineMonths / phases);

  const actionTemplates = {
    wedding: [
      { title: 'Set Budget & Book Venue', tasks: ['Calculate total budget', 'Research venues', 'Visit top 3', 'Book favorite venue'] },
      { title: 'Secure Key Vendors', tasks: ['Book photographer', 'Book caterer', 'Book florist', 'Book entertainment'] },
      { title: 'Invitations & Attire', tasks: ['Finalize guest list', 'Order invitations', 'Choose attire', 'Schedule fittings'] },
      { title: 'Details & Decor', tasks: ['Plan ceremony details', 'Choose decor theme', 'Order flowers', 'Confirm all vendors'] },
      { title: 'Final Preparations', tasks: ['Send invitations', 'Final vendor meetings', 'Rehearsal', 'Enjoy your day!'] }
    ],
    home: [
      { title: 'Financial Planning', tasks: ['Calculate required deposit', 'Review mortgage options', 'Check credit score', 'Start saving'] },
      { title: 'Build Deposit', tasks: ['Automate savings', 'Cut unnecessary expenses', 'Explore Help to Buy', 'Track progress'] },
      { title: 'Mortgage Pre-Approval', tasks: ['Gather documents', 'Meet mortgage broker', 'Get pre-approval', 'Set search criteria'] },
      { title: 'Property Search', tasks: ['Search listings daily', 'Schedule viewings', 'Research neighborhoods', 'Make shortlist'] },
      { title: 'Purchase & Move', tasks: ['Make offer', 'Hire solicitor', 'Complete sale', 'Move in!'] }
    ],
    baby: [
      { title: 'Financial Prep', tasks: ['Build emergency fund', 'Review health insurance', 'Calculate parental leave budget', 'Create baby budget'] },
      { title: 'Health & Planning', tasks: ['Prenatal appointments', 'Choose hospital/midwife', 'Take parenting classes', 'Plan birth'] },
      { title: 'Nursery & Essentials', tasks: ['Set up nursery', 'Buy crib & furniture', 'Stock diapers & clothes', 'Install car seat'] },
      { title: 'Logistics', tasks: ['Arrange parental leave', 'Research childcare', 'Pack hospital bag', 'Prepare home'] }
    ],
    travel: [
      { title: 'Planning', tasks: ['Choose destination', 'Set budget', 'Research activities', 'Create rough itinerary'] },
      { title: 'Booking', tasks: ['Book flights', 'Book accommodation', 'Reserve key activities', 'Get travel insurance'] },
      { title: 'Preparation', tasks: ['Plan detailed itinerary', 'Arrange transport', 'Handle travel documents', 'Pack'] }
    ]
  };

  const template = actionTemplates[goalType] || actionTemplates.travel;

  // Map template phases to actual timeline
  return template.slice(0, phases).map((phase, index) => ({
    month: Math.round((index + 1) * monthsPerPhase),
    title: phase.title,
    tasks: phase.tasks
  }));
}

/**
 * Main deep dive generation function
 */
export function generateDeepDive(params) {
  const {
    milestone_id,
    goal_type,
    budget,
    timeline_months,
    location,
    preferences = {},
    context = {}
  } = params;

  // Generate cost breakdown
  const costBreakdown = calculateCostBreakdown(goal_type, budget);

  // Get challenges
  const challenges = CHALLENGES[goal_type] || CHALLENGES.financial;

  // Generate action steps
  const actionSteps = generateActionSteps(goal_type, timeline_months, preferences);

  // Get tips
  const tips = AI_TIPS[goal_type] || AI_TIPS.financial;

  // Build deep dive object
  const deepDive = {
    milestoneId: milestone_id,
    goalType: goal_type,
    totalBudget: budget,
    timeline_months,
    location,
    costBreakdown,
    challenges: challenges.map(c => ({
      ...c,
      id: `challenge_${Math.random().toString(36).substr(2, 9)}`
    })),
    actionSteps,
    tips,
    createdAt: new Date().toISOString()
  };

  console.log('📊 Generated deep dive:', {
    milestoneId: milestone_id,
    costCategories: costBreakdown.length,
    challenges: challenges.length,
    actionPhases: actionSteps.length,
    tips: tips.length
  });

  return deepDive;
}

/**
 * Get estimated monthly savings required
 */
export function calculateMonthlySavings(totalCost, months) {
  if (!months || months <= 0) return 0;
  return Math.round(totalCost / months);
}
