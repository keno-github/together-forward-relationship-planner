import React, { useState, useEffect } from 'react';
import { Heart, Trophy, Brain } from 'lucide-react';

import DeepDiveModal from './DeepDiveModal';
import MileStoneCard from './MileStoneCard';
import SampleData from './SampleData'; // contains roadmap, coupleData, etc.
import AIAnalysisModal from './Components/AIAnalysisModal';

import { convertGoalsToMilestones } from './utils/goalMappings';

const TogetherForward = ({
  coupleData: propCoupleData,
  userGoals = [],
  conversationHistory = [],
  selectedTemplates = [], // NEW: Templates from gallery
  customGoal = null, // NEW: Custom goal
  instantGoals = [] // NEW: Instant goals from compatibility transition
}) => {
  // Load from localStorage or use default sample data
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  // Generate roadmap based on user goals
  const generateRoadmapFromGoals = (goals) => {
    // NEW: If instant goals from compatibility transition, convert them
    if (instantGoals && instantGoals.length > 0) {
      return convertGoalsToMilestones(instantGoals);
    }

    // NEW: If templates were selected, use them directly
    if (selectedTemplates.length > 0) {
      return selectedTemplates;
    }

    // NEW: If custom goal was created, use it
    if (customGoal) {
      return [customGoal];
    }

    if (!goals || goals.length === 0) return SampleData.roadmap || [];

    const roadmapTemplates = {
      'Get Married': {
        id: 'marry',
        title: 'Plan Your Dream Wedding',
        description: 'From engagement to the big day - let\'s make it unforgettable!',
        icon: Heart,
        color: 'bg-gradient-to-br from-pink-500 to-rose-500',
        estimatedCost: 25000,
        duration: '12-18 months',
        aiGenerated: true,
        tasks: [
          { id: 1, title: 'Set wedding budget', completed: false, aiGenerated: true },
          { id: 2, title: 'Choose wedding date', completed: false, aiGenerated: true },
          { id: 3, title: 'Book venue', completed: false, aiGenerated: true },
          { id: 4, title: 'Send invitations', completed: false, aiGenerated: true }
        ]
      },
      'Get Engaged': {
        id: 'engaged',
        title: 'Get Engaged',
        description: 'Pop the question and start your journey to marriage!',
        icon: Heart,
        color: 'bg-gradient-to-br from-purple-500 to-pink-500',
        estimatedCost: 5000,
        duration: '1-3 months',
        aiGenerated: true,
        tasks: [
          { id: 1, title: 'Choose engagement ring', completed: false, aiGenerated: true },
          { id: 2, title: 'Plan proposal', completed: false, aiGenerated: true },
          { id: 3, title: 'Celebrate with family', completed: false, aiGenerated: true }
        ]
      },
      'Buy a Home': {
        id: 'home',
        title: 'Buy Your First Home',
        description: 'Build equity and create your perfect nest together.',
        icon: Heart,
        color: 'bg-gradient-to-br from-blue-500 to-indigo-500',
        estimatedCost: 50000,
        duration: '12-24 months',
        aiGenerated: true,
        tasks: [
          { id: 1, title: 'Save for down payment', completed: false, aiGenerated: true },
          { id: 2, title: 'Get pre-approved for mortgage', completed: false, aiGenerated: true },
          { id: 3, title: 'Start house hunting', completed: false, aiGenerated: true },
          { id: 4, title: 'Make an offer', completed: false, aiGenerated: true }
        ]
      },
      'Start a Family': {
        id: 'family',
        title: 'Start a Family',
        description: 'Prepare for the beautiful journey of parenthood.',
        icon: Heart,
        color: 'bg-gradient-to-br from-green-500 to-emerald-500',
        estimatedCost: 15000,
        duration: '9-12 months',
        aiGenerated: true,
        tasks: [
          { id: 1, title: 'Prepare nursery', completed: false, aiGenerated: true },
          { id: 2, title: 'Review insurance coverage', completed: false, aiGenerated: true },
          { id: 3, title: 'Take parenting classes', completed: false, aiGenerated: true },
          { id: 4, title: 'Build baby emergency fund', completed: false, aiGenerated: true }
        ]
      },
      'Dream Vacation': {
        id: 'vacation',
        title: 'Take Your Dream Vacation',
        description: 'Create unforgettable memories exploring the world together.',
        icon: Heart,
        color: 'bg-gradient-to-br from-orange-500 to-amber-500',
        estimatedCost: 5000,
        duration: '3-6 months',
        aiGenerated: true,
        tasks: [
          { id: 1, title: 'Choose destination', completed: false, aiGenerated: true },
          { id: 2, title: 'Set travel budget', completed: false, aiGenerated: true },
          { id: 3, title: 'Book flights and hotels', completed: false, aiGenerated: true },
          { id: 4, title: 'Plan itinerary', completed: false, aiGenerated: true }
        ]
      },
      'Build Savings': {
        id: 'savings',
        title: 'Build Emergency Savings',
        description: 'Create financial security for your future together.',
        icon: Heart,
        color: 'bg-gradient-to-br from-teal-500 to-cyan-500',
        estimatedCost: 10000,
        duration: '6-12 months',
        aiGenerated: true,
        tasks: [
          { id: 1, title: 'Set savings goal', completed: false, aiGenerated: true },
          { id: 2, title: 'Open high-yield savings account', completed: false, aiGenerated: true },
          { id: 3, title: 'Automate monthly transfers', completed: false, aiGenerated: true },
          { id: 4, title: 'Track progress monthly', completed: false, aiGenerated: true }
        ]
      }
    };

    // Generate roadmap from user goals
    return goals.map(goal => roadmapTemplates[goal]).filter(Boolean);
  };

  const [roadmap, setRoadmap] = useState(() => {
    // If we have user goals, always generate fresh roadmap (don't use cached)
    if (userGoals && userGoals.length > 0) {
      return generateRoadmapFromGoals(userGoals);
    }

    // Otherwise try to load from storage
    const saved = loadFromStorage('roadmap', null);
    if (saved && saved.length > 0) return saved;

    // Fallback to sample data
    return SampleData.roadmap || [];
  });
  const [coupleData] = useState(propCoupleData || SampleData.coupleData || { partner1: '', partner2: '', timeline: 0 });
  const [xpPoints, setXpPoints] = useState(() => loadFromStorage('xpPoints', 0));
  const [achievements, setAchievements] = useState(() => loadFromStorage('achievements', []));
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [deepDiveData, setDeepDiveData] = useState(null);
  const [analyzingMilestone, setAnalyzingMilestone] = useState(null);

  // Store user context for Luna
  const [userContext] = useState({
    goals: userGoals,
    conversationHistory: conversationHistory,
    partner1: propCoupleData?.partner1,
    partner2: propCoupleData?.partner2,
    location: propCoupleData?.location,
    locationData: propCoupleData?.locationData
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('roadmap', JSON.stringify(roadmap));
    } catch (error) {
      console.error('Error saving roadmap to localStorage:', error);
    }
  }, [roadmap]);

  useEffect(() => {
    try {
      localStorage.setItem('xpPoints', JSON.stringify(xpPoints));
    } catch (error) {
      console.error('Error saving xpPoints to localStorage:', error);
    }
  }, [xpPoints]);

  useEffect(() => {
    try {
      localStorage.setItem('achievements', JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving achievements to localStorage:', error);
    }
  }, [achievements]);

  // Chat props for DeepDiveModal
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const addAchievement = (title, description, xp) => {
    setAchievements(prev => [...prev, { title, description }]);
    setXpPoints(prev => prev + (xp || 0));
  };

  const generatePersonalizedDeepDive = (milestone) => {
    const { partner1, partner2, location, locationData } = userContext;
    const currency = locationData?.currency || '€';

    // Generate comprehensive, context-aware deep dive data
    const enhancedMilestone = {
      ...milestone,

      // AI Analysis Summary (Bug #7 fix - softer tone)
      aiAnalysis: {
        basedOn: [
          `${partner1} & ${partner2}`,
          `Location: ${location}`,
          `Goal: ${milestone.title}`,
          `Timeline: ${milestone.duration}`
        ],
        summary: `I've created a personalized plan for ${milestone.title.toLowerCase()} based on your unique situation in ${location}. Let's explore what this journey looks like for you both! 💕`
      },

      // Enhanced cost breakdown
      totalCostBreakdown: {
        currency: currency,
        minimum: Math.floor(milestone.estimatedCost * 0.7),
        typical: milestone.estimatedCost,
        maximum: Math.floor(milestone.estimatedCost * 1.4),
        breakdown: generateCostBreakdown(milestone.id, currency, milestone.estimatedCost),
      },

      // Hidden costs specific to goal
      hiddenCosts: generateHiddenCosts(milestone.id, currency, location),

      // Detailed steps
      detailedSteps: generateDetailedSteps(milestone.id, location),

      // Expert tips
      expertTips: generateExpertTips(milestone.id, location),

      // Common mistakes
      commonMistakes: generateCommonMistakes(milestone.id),

      // Success metrics
      successMetrics: generateSuccessMetrics(milestone.id),

      // Challenges specific to their situation
      challenges: generateChallenges(milestone.id, location),

      // Warning flags
      warningFlags: generateWarningFlags(milestone.id, location),

      // Location-specific info
      locationSpecific: {
        localCosts: `Costs in ${location} are ${getLocationCostLevel(location)} compared to average`,
        culturalFactors: getCulturalFactors(milestone.id, location),
        resources: getLocalResources(milestone.id, location),
        regulations: getLocalRegulations(milestone.id, location)
      }
    };

    return enhancedMilestone;
  };

  const generateCostBreakdown = (goalId, currency, totalCost) => {
    const breakdowns = {
      'marry': [
        { item: 'Venue rental', cost: Math.floor(totalCost * 0.25), notes: 'Reception space for 80-100 guests', required: true },
        { item: 'Catering', cost: Math.floor(totalCost * 0.30), notes: 'Food and beverages per person', required: true },
        { item: 'Photography/Video', cost: Math.floor(totalCost * 0.12), notes: 'Professional coverage', required: true },
        { item: 'Wedding attire', cost: Math.floor(totalCost * 0.08), notes: 'Dress, suit, accessories', required: true },
        { item: 'Flowers & decoration', cost: Math.floor(totalCost * 0.10), notes: 'Bouquet, centerpieces, venue decor', required: true },
        { item: 'Music/Entertainment', cost: Math.floor(totalCost * 0.08), notes: 'DJ or live band', required: false },
        { item: 'Invitations & stationery', cost: Math.floor(totalCost * 0.02), notes: 'Save-the-dates, invites, programs', required: true },
        { item: 'Miscellaneous', cost: Math.floor(totalCost * 0.05), notes: 'Favors, transportation, tips', required: false }
      ],
      'home': [
        { item: 'Down payment (20%)', cost: Math.floor(totalCost * 0.80), notes: 'Typical requirement for mortgage', required: true },
        { item: 'Closing costs', cost: Math.floor(totalCost * 0.08), notes: 'Legal fees, inspections, appraisal', required: true },
        { item: 'Moving expenses', cost: Math.floor(totalCost * 0.02), notes: 'Truck rental, movers, supplies', required: true },
        { item: 'Initial repairs/updates', cost: Math.floor(totalCost * 0.05), notes: 'Immediate fixes needed', required: false },
        { item: 'Furniture & appliances', cost: Math.floor(totalCost * 0.05), notes: 'New items for bigger space', required: false }
      ],
      'family': [
        { item: 'Prenatal care', cost: Math.floor(totalCost * 0.20), notes: 'Doctor visits, tests, ultrasounds', required: true },
        { item: 'Hospital/delivery', cost: Math.floor(totalCost * 0.30), notes: 'Birth costs (check insurance)', required: true },
        { item: 'Nursery setup', cost: Math.floor(totalCost * 0.15), notes: 'Crib, changing table, decor', required: true },
        { item: 'Baby gear', cost: Math.floor(totalCost * 0.15), notes: 'Stroller, car seat, carrier', required: true },
        { item: 'First year supplies', cost: Math.floor(totalCost * 0.20), notes: 'Diapers, formula, clothes, toys', required: true }
      ],
      'vacation': [
        { item: 'Flights', cost: Math.floor(totalCost * 0.35), notes: 'Round trip airfare', required: true },
        { item: 'Accommodation', cost: Math.floor(totalCost * 0.35), notes: 'Hotel or rental for duration', required: true },
        { item: 'Activities/Tours', cost: Math.floor(totalCost * 0.15), notes: 'Excursions and experiences', required: false },
        { item: 'Food & dining', cost: Math.floor(totalCost * 0.10), notes: 'Meals and drinks', required: true },
        { item: 'Transportation', cost: Math.floor(totalCost * 0.05), notes: 'Car rental, taxis, transit', required: false }
      ],
      'default': [
        { item: 'Primary expense', cost: Math.floor(totalCost * 0.60), notes: 'Main cost component', required: true },
        { item: 'Secondary costs', cost: Math.floor(totalCost * 0.25), notes: 'Supporting expenses', required: true },
        { item: 'Buffer/contingency', cost: Math.floor(totalCost * 0.15), notes: 'Unexpected costs', required: false }
      ]
    };

    return breakdowns[goalId] || breakdowns['default'];
  };

  const generateHiddenCosts = (goalId, currency, location) => {
    const costs = {
      'marry': [
        { cost: 'Marriage license', amount: 100, why: 'Legal requirement' },
        { cost: 'Alterations', amount: 300, why: 'Dress/suit fitting' },
        { cost: 'Vendor meals', amount: 200, why: 'Required to feed vendors' },
        { cost: 'Overtime charges', amount: 500, why: 'If celebration runs late' },
        { cost: 'Hair & makeup trial', amount: 200, why: 'Practice session before wedding' }
      ],
      'home': [
        { cost: 'Home inspection', amount: 500, why: 'Before purchase' },
        { cost: 'Appraisal fee', amount: 400, why: 'Required by lender' },
        { cost: 'Property tax escrow', amount: 2000, why: 'Prepaid at closing' },
        { cost: 'Homeowners insurance', amount: 1500, why: 'First year prepaid' },
        { cost: 'HOA fees', amount: 500, why: 'If applicable, often prepaid' }
      ],
      'family': [
        { cost: 'Maternity clothes', amount: 500, why: 'Growing body needs' },
        { cost: 'Breast pump', amount: 300, why: 'If planning to breastfeed' },
        { cost: 'Childcare deposits', amount: 1000, why: 'Reserve spot at daycare' },
        { cost: 'Life insurance', amount: 800, why: 'Protecting new family' },
        { cost: 'Will/estate planning', amount: 500, why: 'Legal protection for child' }
      ],
      'vacation': [
        { cost: 'Travel insurance', amount: 150, why: 'Protect your investment' },
        { cost: 'Visa fees', amount: 200, why: 'If required for destination' },
        { cost: 'Pet boarding', amount: 300, why: 'If you have pets' },
        { cost: 'Travel adapters/gear', amount: 100, why: 'Electronic compatibility' },
        { cost: 'Luggage fees', amount: 100, why: 'Checked bag charges' }
      ],
      'default': [
        { cost: 'Administrative fees', amount: 100, why: 'Processing and paperwork' },
        { cost: 'Unexpected expenses', amount: 500, why: 'Buffer for surprises' }
      ]
    };

    return costs[goalId] || costs['default'];
  };

  const generateDetailedSteps = (goalId, location) => {
    const steps = {
      'marry': [
        { step: 1, title: 'Set your wedding budget', description: 'Discuss finances openly and determine realistic spending limit', difficulty: 'easy', duration: '1 week' },
        { step: 2, title: 'Choose wedding date', description: 'Consider season, venue availability, and guest schedules', difficulty: 'easy', duration: '1-2 weeks' },
        { step: 3, title: 'Book venue', description: `Research and visit 5-10 venues in ${location}, secure your top choice`, difficulty: 'medium', duration: '2-4 weeks' },
        { step: 4, title: 'Hire key vendors', description: 'Caterer, photographer, florist - book 8-12 months ahead', difficulty: 'medium', duration: '1-2 months' },
        { step: 5, title: 'Send save-the-dates', description: 'Mail 6-8 months before wedding', difficulty: 'easy', duration: '1 week' },
        { step: 6, title: 'Plan ceremony details', description: 'Write vows, choose readings, select music', difficulty: 'medium', duration: '2-3 weeks' },
        { step: 7, title: 'Send invitations', description: 'Mail 6-8 weeks before, track RSVPs', difficulty: 'easy', duration: '2 weeks' },
        { step: 8, title: 'Final vendor meetings', description: 'Confirm all details 2-4 weeks before', difficulty: 'hard', duration: '2 weeks' }
      ],
      'home': [
        { step: 1, title: 'Check your credit score', description: 'Need 620+ for conventional mortgage, higher is better', difficulty: 'easy', duration: '1 day' },
        { step: 2, title: 'Save for down payment', description: `In ${location}, aim for 20% down payment to avoid PMI`, difficulty: 'hard', duration: '6-24 months' },
        { step: 3, title: 'Get pre-approved', description: 'Mortgage pre-approval shows sellers you are serious', difficulty: 'medium', duration: '1-2 weeks' },
        { step: 4, title: 'Find a real estate agent', description: 'Interview 3-5 agents, choose one who knows your target area', difficulty: 'medium', duration: '1-2 weeks' },
        { step: 5, title: 'House hunting', description: 'Visit 10-20 properties, make list of must-haves vs nice-to-haves', difficulty: 'hard', duration: '1-3 months' },
        { step: 6, title: 'Make an offer', description: 'Work with agent on competitive offer, expect negotiations', difficulty: 'hard', duration: '1-2 weeks' },
        { step: 7, title: 'Home inspection', description: 'Hire professional inspector, negotiate repairs if needed', difficulty: 'medium', duration: '1-2 weeks' },
        { step: 8, title: 'Close on property', description: 'Final walkthrough, sign paperwork, get keys!', difficulty: 'medium', duration: '1 week' }
      ],
      'default': [
        { step: 1, title: 'Research and planning', description: 'Gather information and create initial plan', difficulty: 'easy', duration: '1-2 weeks' },
        { step: 2, title: 'Set budget', description: 'Determine realistic financial commitment', difficulty: 'medium', duration: '1 week' },
        { step: 3, title: 'Begin execution', description: 'Start taking action on your plan', difficulty: 'medium', duration: 'varies' },
        { step: 4, title: 'Monitor progress', description: 'Track milestones and adjust as needed', difficulty: 'easy', duration: 'ongoing' }
      ]
    };

    return steps[goalId] || steps['default'];
  };

  const generateExpertTips = (goalId, location) => {
    const tips = {
      'marry': [
        { category: 'Budget', tip: `In ${location}, couples often overspend on venue and underestimate catering costs. Allocate 45-50% to venue + food` },
        { category: 'Timeline', tip: 'Book your photographer first - the best ones are reserved 12-18 months out' },
        { category: 'Savings', tip: 'Consider Friday or Sunday weddings for 20-30% venue discount' },
        { category: 'Planning', tip: 'Hire a day-of coordinator (€800-1500) to handle logistics - worth every penny' }
      ],
      'home': [
        { category: 'Financing', tip: `In ${location}, shop around with 3-5 lenders. Rates can vary by 0.5% or more, saving thousands` },
        { category: 'Search', tip: 'Set up alerts for new listings - best properties get offers within 48 hours' },
        { category: 'Negotiation', tip: 'Ask for seller concessions to cover closing costs instead of lower price' },
        { category: 'Inspection', tip: 'Never skip inspection, even if market is competitive. A €500 inspection can save you €20K+ in repairs' }
      ],
      'default': [
        { category: 'Planning', tip: 'Start early and give yourself buffer time for unexpected delays' },
        { category: 'Budget', tip: 'Add 15-20% contingency to your budget for surprises' }
      ]
    };

    return tips[goalId] || tips['default'];
  };

  const generateCommonMistakes = (goalId) => {
    const mistakes = {
      'marry': [
        { mistake: 'Not creating a realistic budget first', impact: 'Leads to debt and regret', solution: 'Set budget based on what you can actually afford, not dream wedding prices' },
        { mistake: 'Trying to please everyone', impact: 'Lose sight of what YOU want', solution: 'Remember: it is YOUR day, not your families day' },
        { mistake: 'Booking vendors without reviews', impact: 'Risk of unprofessional service', solution: 'Read reviews, check references, meet in person' }
      ],
      'home': [
        { mistake: 'House poor - buying max approved amount', impact: 'No money left for living', solution: 'Buy below your approval amount, keep emergency fund' },
        { mistake: 'Skipping inspection to compete', impact: 'Inherit expensive problems', solution: 'Always inspect, even in hot market' },
        { mistake: 'Not considering total monthly cost', impact: 'Payment shock beyond mortgage', solution: 'Factor in insurance, tax, HOA, utilities, maintenance' }
      ],
      'default': [
        { mistake: 'Underestimating time required', impact: 'Rushed decisions, poor outcomes', solution: 'Build in buffer time for each phase' },
        { mistake: 'Not having contingency budget', impact: 'Stuck when unexpected costs arise', solution: 'Always budget extra 15-20% for surprises' }
      ]
    };

    return mistakes[goalId] || mistakes['default'];
  };

  const generateSuccessMetrics = (goalId) => {
    const metrics = {
      'marry': ['Stayed within budget', 'Both partners feel heard', 'Guests enjoyed themselves', 'No major day-of disasters'],
      'home': ['Bought within budget', 'In desired location', 'Home meets must-have list', 'Can afford monthly payments comfortably'],
      'family': ['Healthy baby and mother', 'Financially prepared', 'Support system in place', 'Nursery ready'],
      'vacation': ['Trip booked within budget', 'All logistics arranged', 'Time off work approved', 'Created lasting memories'],
      'default': ['Goal achieved on time', 'Within budget', 'Minimal stress', 'Positive outcome']
    };

    return metrics[goalId] || metrics['default'];
  };

  const generateChallenges = (goalId, location) => {
    const challenges = {
      'marry': [
        { challenge: 'Family drama and expectations', likelihood: 'high', solution: 'Set boundaries early, communicate openly' },
        { challenge: `Venue availability in ${location}`, likelihood: 'medium', solution: 'Book 12-18 months ahead or consider off-peak dates' },
        { challenge: 'Budget creep', likelihood: 'very high', solution: 'Track every expense, be willing to cut less important items' }
      ],
      'home': [
        { challenge: `Competitive market in ${location}`, likelihood: 'high', solution: 'Get pre-approved, be ready to move quickly, consider less popular neighborhoods' },
        { challenge: 'Finding "perfect" home', likelihood: 'high', solution: 'Prioritize must-haves, accept you will need to compromise' },
        { challenge: 'Unexpected repair costs', likelihood: 'medium', solution: 'Always get inspection, budget for immediate repairs' }
      ],
      'default': [
        { challenge: 'Staying motivated long-term', likelihood: 'medium', solution: 'Break into smaller milestones, celebrate progress' },
        { challenge: 'Unexpected obstacles', likelihood: 'high', solution: 'Build flexibility into timeline and budget' }
      ]
    };

    return challenges[goalId] || challenges['default'];
  };

  const generateWarningFlags = (goalId, location) => {
    const flags = {
      'marry': [
        '⚠️ Booking venue before setting budget',
        '⚠️ Not reading vendor contracts carefully',
        '⚠️ Ignoring weather backup plan for outdoor venues',
        '⚠️ Forgetting to eat and hydrate on wedding day'
      ],
      'home': [
        `⚠️ Buying in ${location} without researching neighborhood crime rates`,
        '⚠️ Waiving inspection to make offer more competitive',
        '⚠️ Not factoring in renovation costs',
        '⚠️ Forgetting about property taxes and insurance'
      ],
      'default': [
        '⚠️ Starting without clear plan',
        '⚠️ Ignoring hidden costs',
        '⚠️ Not having contingency plan'
      ]
    };

    return flags[goalId] || flags['default'];
  };

  const getLocationCostLevel = (location) => {
    const highCost = ['Paris', 'London', 'New York', 'Tokyo', 'San Francisco'];
    if (highCost.some(city => location.includes(city))) return 'significantly higher';
    return 'moderate';
  };

  const getCulturalFactors = (goalId, location) => {
    if (location.includes('Paris') || location.includes('France')) {
      const factors = {
        'marry': 'French weddings typically involve civil ceremony at mairie (town hall) followed by religious or symbolic ceremony',
        'home': 'French property purchases require notaire (notary) and process takes 3-4 months minimum',
        'default': 'French bureaucracy can be complex - patience and proper documentation essential'
      };
      return factors[goalId] || factors['default'];
    }
    return 'Consider local customs and regulations';
  };

  const getLocalResources = (goalId, location) => {
    if (location.includes('Paris')) {
      const resources = {
        'marry': ['ParisWeddingPlanner.com', 'Mairie de Paris', 'French Wedding Style magazine'],
        'home': ['SeLoger.com', 'LeBonCoin property section', 'Paris Property Group'],
        'default': ['Local government website', 'Expat forums', 'Community Facebook groups']
      };
      return resources[goalId] || resources['default'];
    }
    return ['Local government resources', 'Community forums', 'Online guides'];
  };

  const getLocalRegulations = (goalId, location) => {
    // Bug #6 fix - Support multiple locations dynamically
    const locationLower = location?.toLowerCase() || '';

    // France regulations
    if (locationLower.includes('paris') || locationLower.includes('france')) {
      const regulations = {
        'marry': 'Must publish banns 10 days before civil ceremony at mairie',
        'home': 'Notary fees (frais de notaire) are 7-8% of purchase price and legally required',
        'default': 'Check prefecture website for local regulations'
      };
      return regulations[goalId] || regulations['default'];
    }

    // Italy regulations
    if (locationLower.includes('italy') || locationLower.includes('como') || locationLower.includes('rome') || locationLower.includes('florence')) {
      const regulations = {
        'marry': 'Nulla osta (certificate of no impediment) required; residency requirement may apply',
        'home': 'Rogito (deed) must be signed before a notaio; cadastral registration mandatory',
        'default': 'Check comune (municipality) website for local requirements'
      };
      return regulations[goalId] || regulations['default'];
    }

    // US regulations
    if (locationLower.includes('united states') || locationLower.includes('usa') || locationLower.includes('new york') || locationLower.includes('california')) {
      const regulations = {
        'marry': 'Marriage license required; waiting period varies by state (24hrs-3 days)',
        'home': 'Title insurance recommended; inspection contingencies vary by state',
        'default': 'Check state and county regulations'
      };
      return regulations[goalId] || regulations['default'];
    }

    // UK regulations
    if (locationLower.includes('london') || locationLower.includes('uk') || locationLower.includes('england')) {
      const regulations = {
        'marry': 'Give notice 29 days before ceremony at local register office',
        'home': 'Solicitor/conveyancer required; stamp duty applies on properties over £250,000',
        'default': 'Check gov.uk for local council requirements'
      };
      return regulations[goalId] || regulations['default'];
    }

    // Default for any location
    return 'Check local government website for specific requirements';
  };

  const openDeepDive = (milestone) => {
    // Show analysis loading state
    setAnalyzingMilestone(milestone);
    setDeepDiveData(null);

    // Simulate AI analysis (in production, this might be a real API call)
    setTimeout(() => {
      const enhancedMilestone = generatePersonalizedDeepDive(milestone);
      setDeepDiveData(enhancedMilestone);
      setAnalyzingMilestone(null);
    }, 2500); // 2.5 second analysis animation
  };

  const handleUpdateMilestone = (updatedMilestoneData) => {
    // Update the deep dive data
    setDeepDiveData(updatedMilestoneData);

    // ALSO update the roadmap state so changes persist
    setRoadmap(prevRoadmap =>
      prevRoadmap.map(milestone =>
        milestone.id === updatedMilestoneData.id
          ? { ...milestone, ...updatedMilestoneData }
          : milestone
      )
    );
  };

  const sendChatMessage = (message) => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    // Generate context-aware response
    setTimeout(() => {
      const response = generateContextualResponse(message, deepDiveData);
      const assistantMsg = { role: 'assistant', content: response };
      setChatMessages(prev => [...prev, assistantMsg]);
      setIsChatLoading(false);
    }, 1000);
  };

  const generateContextualResponse = (userMessage, currentMilestone) => {
    const lowerMsg = userMessage.toLowerCase();
    const goals = userContext.goals.join(', ');
    const names = `${userContext.partner1} and ${userContext.partner2}`;

    // Reference the user's stated goals
    if (lowerMsg.includes('help') || lowerMsg.includes('how')) {
      if (currentMilestone) {
        return `I'm here to help you with "${currentMilestone.title}"! Remember, you told me your goals are: ${goals}. This milestone aligns with your vision. What specific aspect would you like guidance on?`;
      }
      return `I remember you want to: ${goals}. I'm here to help ${names} achieve these dreams! What would you like to know?`;
    }

    if (lowerMsg.includes('cost') || lowerMsg.includes('price') || lowerMsg.includes('budget')) {
      if (currentMilestone) {
        return `For "${currentMilestone.title}", the estimated cost is €${currentMilestone.estimatedCost?.toLocaleString() || 'varies'}. This is based on your location in ${userContext.location}. Would you like me to break down the costs further?`;
      }
      return `I can help you understand the costs for ${goals}. Which goal would you like to explore first?`;
    }

    if (lowerMsg.includes('timeline') || lowerMsg.includes('when') || lowerMsg.includes('how long')) {
      if (currentMilestone) {
        return `Based on "${currentMilestone.title}", the typical timeline is ${currentMilestone.duration}. But remember, this is flexible based on your personal situation!`;
      }
      return `Let's talk timelines! For your goals (${goals}), I can create a realistic schedule. Which goal's timeline are you most curious about?`;
    }

    if (lowerMsg.includes('start') || lowerMsg.includes('first step') || lowerMsg.includes('begin')) {
      if (currentMilestone && currentMilestone.tasks) {
        const firstTask = currentMilestone.tasks[0];
        return `Great question! For "${currentMilestone.title}", I recommend starting with: "${firstTask.title}". This foundational step will set you up for success!`;
      }
      return `I remember you want to ${goals}. Let's start by looking at your roadmap and breaking down the first actionable steps for each goal!`;
    }

    // Default response with context
    if (currentMilestone) {
      return `I understand you're focused on "${currentMilestone.title}". This aligns with your goal to ${goals}. Let me help you - could you be more specific about what you'd like to know?`;
    }

    return `I'm Luna, and I remember everything we discussed! You want to ${goals} as ${names}. How can I help you with that right now?`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* AI Analysis Modal */}
      {analyzingMilestone && (
        <AIAnalysisModal
          milestone={analyzingMilestone}
          userContext={userContext}
        />
      )}

      {/* Deep Dive Modal */}
      <DeepDiveModal
        deepDiveData={deepDiveData}
        activeTab="overview"
        onClose={() => setDeepDiveData(null)}
        onUpdateMilestone={handleUpdateMilestone}
        chatProps={{ chatMessages, sendChatMessage, isChatLoading, chatInput, setChatInput }}
        userContext={userContext}
      />

      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-30 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">TogetherForward</h1>
              <p className="text-sm text-gray-500">{coupleData.partner1} & {coupleData.partner2}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-yellow-700">{xpPoints} XP</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Start over?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Brain className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {roadmap.map((milestone, index) => (
          <MileStoneCard
            key={milestone.id}
            milestone={milestone}
            selectedMilestone={selectedMilestone}
            setSelectedMilestone={setSelectedMilestone}
            openDeepDive={openDeepDive}
            roadmap={roadmap}
            setRoadmap={setRoadmap}
            addAchievement={addAchievement}
          />
        ))}
      </div>
    </div>
  );
};

export default TogetherForward;
