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
  aiAnalysis: {
    summary: 'This comprehensive vacation plan balances careful budgeting with memorable experiences, tailored to your timeline and interests.',
    basedOn: [
      'Budget of €2,000',
      '3-month planning timeline',
      'European destination preference',
      'Mid-range accommodation'
    ]
  },
  duration: '3 months',
  totalCostBreakdown: {
    currency: '€',
    minimum: 1500,
    typical: 2000,
    maximum: 2500,
    breakdown: [
      { item: 'Flights', cost: 800, notes: 'Round trip to European destination', required: true },
      { item: 'Hotel', cost: 1000, notes: '7 nights in 3-star hotel', required: true },
      { item: 'Daily expenses', cost: 150, notes: 'Food and local transport', required: true },
      { item: 'Activities', cost: 50, notes: 'Museum entries and tours', required: false },
    ],
  },
  hiddenCosts: [
    { cost: 'Travel Insurance', amount: 50, why: 'Mandatory for visas' },
  ],
  detailedSteps: [
    {
      step: 1,
      title: 'Research destinations',
      description: 'Explore and compare potential vacation destinations based on budget, interests, and season',
      difficulty: 'easy',
      duration: '3-5 days',
      completed: false,
      actionItems: [
        'Create a list of 5-10 dream destinations',
        'Research average costs for each location',
        'Check weather patterns for travel season',
        'Read travel blogs and reviews'
      ],
      considerations: [
        'What activities interest you most? (beach, culture, adventure, relaxation)',
        'Do you need a visa for this destination?',
        'What is the local language and culture?',
        'Are there any health or safety concerns?'
      ],
      resources: ['TripAdvisor', 'Lonely Planet', 'Travel blogs', 'YouTube vlogs']
    },
    {
      step: 2,
      title: 'Set vacation budget',
      description: 'Determine realistic budget based on destination and create savings plan',
      difficulty: 'medium',
      duration: '1 week',
      completed: false,
      dependencies: [1],
      actionItems: [
        'Calculate total available savings',
        'Break down costs by category (flights, hotel, food, activities)',
        'Set aside 10-15% buffer for unexpected expenses',
        'Create monthly savings target'
      ],
      considerations: [
        'How much can you realistically save per month?',
        'Are there any upcoming expenses that might affect savings?',
        'Should you adjust the destination based on budget?',
        'Can you supplement with side income?'
      ],
      resources: ['Budget calculator', 'Savings app', 'Excel template']
    },
    {
      step: 3,
      title: 'Book flights',
      description: 'Find and book flights at the best price',
      difficulty: 'medium',
      duration: '1-2 weeks',
      completed: false,
      dependencies: [1, 2],
      actionItems: [
        'Set up price alerts on multiple sites',
        'Compare prices across different dates',
        'Check baggage policies and fees',
        'Book tickets when prices are optimal'
      ],
      considerations: [
        'Are you flexible with travel dates?',
        'Direct flight vs. layover - cost vs. convenience?',
        'Travel insurance worth it?',
        'Cancellation and change policies'
      ],
      resources: ['Skyscanner', 'Google Flights', 'Kayak', 'Hopper app']
    },
    {
      step: 4,
      title: 'Reserve accommodation',
      description: 'Find and book hotel or vacation rental',
      difficulty: 'easy',
      duration: '3-5 days',
      completed: false,
      dependencies: [3],
      actionItems: [
        'Decide on hotel vs. Airbnb vs. hostel',
        'Check location proximity to attractions',
        'Read recent reviews carefully',
        'Confirm reservation and save confirmation'
      ],
      considerations: [
        'Location: central vs. quiet neighborhood?',
        'Amenities needed? (kitchen, wifi, parking)',
        'Cancellation policy - is it flexible?',
        'Breakfast included or nearby food options?'
      ],
      resources: ['Booking.com', 'Airbnb', 'Hotels.com', 'Hostelworld']
    },
    {
      step: 5,
      title: 'Plan itinerary',
      description: 'Create day-by-day plan for activities and experiences',
      difficulty: 'medium',
      duration: '1 week',
      completed: false,
      dependencies: [4],
      actionItems: [
        'List must-see attractions and hidden gems',
        'Map out daily routes to minimize travel time',
        'Book tickets for popular attractions in advance',
        'Leave buffer time for spontaneous exploration'
      ],
      considerations: [
        'Balance between planned activities and free time',
        'Consider opening hours and best times to visit',
        'Factor in rest days if trip is long',
        'Plan for different weather scenarios'
      ],
      resources: ['Google Maps', 'TripIt', 'Local tourism websites', 'Walking tour apps']
    },
    {
      step: 6,
      title: 'Prepare travel documents',
      description: 'Ensure all necessary documents are ready',
      difficulty: 'easy',
      duration: '2-3 days',
      completed: false,
      dependencies: [3],
      actionItems: [
        'Check passport expiration (needs 6+ months validity)',
        'Apply for visa if required',
        'Make copies of important documents',
        'Download digital copies to cloud storage'
      ],
      considerations: [
        'Does destination require visa? How long to process?',
        'Do you need vaccination certificates?',
        'Travel insurance documents ready?',
        'Emergency contact information prepared?'
      ],
      resources: ['Embassy websites', 'Travel.State.Gov', 'VisaHQ']
    },
    {
      step: 7,
      title: 'Pack and prepare',
      description: 'Pack smartly and handle last-minute preparations',
      difficulty: 'easy',
      duration: '2-3 days',
      completed: false,
      dependencies: [5, 6],
      actionItems: [
        'Create packing list based on weather and activities',
        'Arrange pet/plant care or house sitting',
        'Notify bank and credit card companies of travel',
        'Download offline maps and translation apps'
      ],
      considerations: [
        'Checked bag vs. carry-on only?',
        'Power adapters needed for destination?',
        'Medication and first-aid supplies?',
        'Secure valuables at home before leaving?'
      ],
      resources: ['Packing list templates', 'Weather forecast', 'Google Translate']
    },
    {
      step: 8,
      title: 'Track expenses during trip',
      description: 'Monitor spending to stay within budget',
      difficulty: 'easy',
      duration: 'Throughout trip',
      completed: false,
      dependencies: [2],
      actionItems: [
        'Log all expenses daily',
        'Keep receipts for major purchases',
        'Check budget status every few days',
        'Adjust spending if approaching limits'
      ],
      considerations: [
        'Using cash, card, or both?',
        'Currency exchange rates and fees?',
        'Tipping customs in destination?',
        'Emergency fund accessible?'
      ],
      resources: ['Splitwise', 'Trail Wallet', 'XE Currency app']
    },
    {
      step: 9,
      title: 'Review and reflect',
      description: 'Evaluate trip experience and lessons learned',
      difficulty: 'easy',
      duration: '1 day',
      completed: false,
      dependencies: [8],
      actionItems: [
        'Compare actual vs. planned budget',
        'Note what worked well and what didn\'t',
        'Organize photos and memories',
        'Write reviews for helpful businesses'
      ],
      considerations: [
        'What would you do differently next time?',
        'Were there unexpected costs to plan for next trip?',
        'Favorite experiences worth repeating?',
        'Budget adjustments needed for future trips?'
      ],
      resources: ['Expense tracker', 'Photo organization app', 'Travel journal']
    }
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
