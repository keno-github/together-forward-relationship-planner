// 12 Core Goal Templates for Phase 1 MVP

export const GOAL_TEMPLATES = [
  // Relationship Milestones (4)
  {
    id: 'engaged',
    title: 'Get Engaged',
    icon: '💍',
    category: 'relationship',
    estimatedCost: 5000,
    duration: '1-3 months',
    description: 'Pop the question and start your journey to marriage!',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    tasks: [
      { id: 1, title: 'Choose engagement ring', completed: false, aiGenerated: false },
      { id: 2, title: 'Plan proposal location and moment', completed: false, aiGenerated: false },
      { id: 3, title: 'Celebrate with family and friends', completed: false, aiGenerated: false }
    ]
  },
  {
    id: 'marry',
    title: 'Plan Dream Wedding',
    icon: '💒',
    category: 'relationship',
    estimatedCost: 25000,
    duration: '12-18 months',
    description: 'From engagement to the big day - make it unforgettable!',
    color: 'bg-gradient-to-br from-pink-500 to-rose-500',
    tasks: [
      { id: 1, title: 'Set wedding budget', completed: false, aiGenerated: false },
      { id: 2, title: 'Choose wedding date', completed: false, aiGenerated: false },
      { id: 3, title: 'Book venue', completed: false, aiGenerated: false },
      { id: 4, title: 'Send invitations', completed: false, aiGenerated: false }
    ]
  },
  {
    id: 'honeymoon',
    title: 'Honeymoon Getaway',
    icon: '🌙',
    category: 'travel',
    estimatedCost: 8000,
    duration: '3-6 months',
    description: 'Create unforgettable memories on your romantic escape',
    color: 'bg-gradient-to-br from-orange-500 to-amber-500',
    tasks: [
      { id: 1, title: 'Choose dream destination', completed: false, aiGenerated: false },
      { id: 2, title: 'Set honeymoon budget', completed: false, aiGenerated: false },
      { id: 3, title: 'Book flights and accommodation', completed: false, aiGenerated: false },
      { id: 4, title: 'Plan activities and experiences', completed: false, aiGenerated: false }
    ]
  },
  {
    id: 'family',
    title: 'Start a Family',
    icon: '👶',
    category: 'relationship',
    estimatedCost: 15000,
    duration: '9-12 months',
    description: 'Prepare for the beautiful journey of parenthood',
    color: 'bg-gradient-to-br from-green-500 to-emerald-500',
    tasks: [
      { id: 1, title: 'Prepare nursery', completed: false, aiGenerated: false },
      { id: 2, title: 'Review insurance coverage', completed: false, aiGenerated: false },
      { id: 3, title: 'Take parenting classes', completed: false, aiGenerated: false },
      { id: 4, title: 'Build baby emergency fund', completed: false, aiGenerated: false }
    ]
  },

  // Home & Living (4)
  {
    id: 'home',
    title: 'Buy First Home',
    icon: '🏡',
    category: 'home',
    estimatedCost: 50000,
    duration: '12-24 months',
    description: 'Build equity and create your perfect nest together',
    color: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    tasks: [
      { id: 1, title: 'Save for down payment', completed: false, aiGenerated: false },
      { id: 2, title: 'Get pre-approved for mortgage', completed: false, aiGenerated: false },
      { id: 3, title: 'Start house hunting', completed: false, aiGenerated: false },
      { id: 4, title: 'Make an offer', completed: false, aiGenerated: false }
    ]
  },
  {
    id: 'renovation',
    title: 'Home Renovation',
    icon: '🏗️',
    category: 'home',
    estimatedCost: 30000,
    duration: '6-9 months',
    description: 'Transform your space into your dream home',
    color: 'bg-gradient-to-br from-cyan-500 to-blue-500',
    tasks: [
      { id: 1, title: 'Plan renovation scope', completed: false, aiGenerated: false },
      { id: 2, title: 'Get contractor quotes', completed: false, aiGenerated: false },
      { id: 3, title: 'Secure permits', completed: false, aiGenerated: false },
      { id: 4, title: 'Begin construction', completed: false, aiGenerated: false }
    ]
  },
  {
    id: 'pet',
    title: 'Adopt a Pet',
    icon: '🐕',
    category: 'home',
    estimatedCost: 2000,
    duration: '1-2 months',
    description: 'Welcome a furry family member into your home',
    color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    tasks: [
      { id: 1, title: 'Research pet breeds and needs', completed: false, aiGenerated: false },
      { id: 2, title: 'Pet-proof your home', completed: false, aiGenerated: false },
      { id: 3, title: 'Visit shelters or breeders', completed: false, aiGenerated: false },
      { id: 4, title: 'Schedule vet appointment', completed: false, aiGenerated: false }
    ]
  },
  {
    id: 'move',
    title: 'Move Together',
    icon: '🌳',
    category: 'home',
    estimatedCost: 5000,
    duration: '2-4 months',
    description: 'Start your shared life in a new place',
    color: 'bg-gradient-to-br from-teal-500 to-green-500',
    tasks: [
      { id: 1, title: 'Find new place together', completed: false, aiGenerated: false },
      { id: 2, title: 'Coordinate move-in date', completed: false, aiGenerated: false },
      { id: 3, title: 'Pack and organize belongings', completed: false, aiGenerated: false },
      { id: 4, title: 'Set up utilities', completed: false, aiGenerated: false }
    ]
  },

  // Financial Goals (4)
  {
    id: 'emergency',
    title: 'Emergency Fund',
    icon: '💎',
    category: 'financial',
    estimatedCost: 10000,
    duration: '6-12 months',
    description: 'Build a 6-month safety net for peace of mind',
    color: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    tasks: [
      { id: 1, title: 'Calculate monthly expenses', completed: false, aiGenerated: false },
      { id: 2, title: 'Open high-yield savings account', completed: false, aiGenerated: false },
      { id: 3, title: 'Automate monthly savings', completed: false, aiGenerated: false },
      { id: 4, title: 'Track progress monthly', completed: false, aiGenerated: false }
    ]
  },
  {
    id: 'debt',
    title: 'Pay Off Debt',
    icon: '📊',
    category: 'financial',
    estimatedCost: 20000,
    duration: '12-24 months',
    description: 'Become debt-free and financially empowered',
    color: 'bg-gradient-to-br from-red-500 to-pink-500',
    tasks: [
      { id: 1, title: 'List all debts and interest rates', completed: false, aiGenerated: false },
      { id: 2, title: 'Choose payoff strategy (avalanche/snowball)', completed: false, aiGenerated: false },
      { id: 3, title: 'Create debt payment budget', completed: false, aiGenerated: false },
      { id: 4, title: 'Make extra payments', completed: false, aiGenerated: false }
    ]
  },
  {
    id: 'invest',
    title: 'Start Investing',
    icon: '🏦',
    category: 'financial',
    estimatedCost: 5000,
    duration: '3-6 months',
    description: 'Build wealth together for your future',
    color: 'bg-gradient-to-br from-violet-500 to-purple-500',
    tasks: [
      { id: 1, title: 'Learn investment basics together', completed: false, aiGenerated: false },
      { id: 2, title: 'Open investment accounts', completed: false, aiGenerated: false },
      { id: 3, title: 'Choose investment strategy', completed: false, aiGenerated: false },
      { id: 4, title: 'Make first investment', completed: false, aiGenerated: false }
    ]
  },
  {
    id: 'downpayment',
    title: 'Save Down Payment',
    icon: '🎯',
    category: 'financial',
    estimatedCost: 40000,
    duration: '12-18 months',
    description: 'Save for your dream home down payment',
    color: 'bg-gradient-to-br from-indigo-500 to-blue-500',
    tasks: [
      { id: 1, title: 'Set down payment target', completed: false, aiGenerated: false },
      { id: 2, title: 'Create savings plan', completed: false, aiGenerated: false },
      { id: 3, title: 'Cut unnecessary expenses', completed: false, aiGenerated: false },
      { id: 4, title: 'Track savings progress', completed: false, aiGenerated: false }
    ]
  }
];

// Category groupings for the gallery
export const GOAL_CATEGORIES = {
  relationship: {
    name: 'Relationship Milestones',
    icon: '💒',
    color: 'purple'
  },
  home: {
    name: 'Home & Living',
    icon: '🏠',
    color: 'blue'
  },
  financial: {
    name: 'Financial Goals',
    icon: '💰',
    color: 'green'
  },
  travel: {
    name: 'Travel & Adventure',
    icon: '✈️',
    color: 'orange'
  }
};

// Get templates by category
export const getTemplatesByCategory = (category) => {
  return GOAL_TEMPLATES.filter(template => template.category === category);
};

// Get template by ID
export const getTemplateById = (id) => {
  return GOAL_TEMPLATES.find(template => template.id === id);
};
