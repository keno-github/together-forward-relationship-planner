// SampleData.js

export const coupleData = {
  partner1: 'Alice',
  partner2: 'Bob',
  timeline: 12, // months
};

export const roadmap = [
  {
    id: 1,
    title: 'Save for Vacation',
    description: 'Plan and save money for a summer vacation.',
    iconName: 'Heart',
    color: 'bg-pink-500',
    estimatedCost: 2000,
    duration: '3 months',
    aiGenerated: false,
    tasks: [
      { id: 1, title: 'Set up budget', completed: false, aiGenerated: false },
      { id: 2, title: 'Open savings account', completed: false, aiGenerated: true },
    ],
  },
  // add more milestones
];

export const deepDiveData = {
  totalCostBreakdown: {
    currency: '€',
    minimum: 1500,
    typical: 2000,
    maximum: 2500,
    breakdown: [
      { item: 'Flights', cost: 800, notes: 'Round trip', required: true },
      { item: 'Hotel', cost: 1000, notes: '3-star hotel', required: true },
    ],
  },
  hiddenCosts: [
    { cost: 'Travel Insurance', amount: 50, why: 'Mandatory for visas' },
  ],
  detailedSteps: [
    { step: 1, title: 'Research destinations', description: 'Choose best vacation spot', difficulty: 'easy', duration: '2 days' },
  ],
  expertTips: [
    { category: 'Savings', tip: 'Automate savings to reach your goal faster' },
  ],
  commonMistakes: [
    { mistake: 'Overspending', impact: 'Exceeds budget', solution: 'Track expenses daily' },
  ],
  successMetrics: ['Budget met', 'Tasks completed on time'],
  challenges: [
    { challenge: 'Unexpected expenses', likelihood: 'medium', solution: 'Keep emergency fund' },
  ],
  warningFlags: ['Missing visa', 'Flights sold out'],
  locationSpecific: {
    localCosts: 'Some costs may vary by city',
    culturalFactors: 'Respect local customs',
    resources: ['Tourist info website', 'Local guide app'],
  },
};

// Optional: default export for convenience
const SampleData = { coupleData, roadmap, deepDiveData };
export default SampleData;
