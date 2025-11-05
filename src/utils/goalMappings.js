import { Heart, Home, Plane, Baby, DollarSign, Users, MessageCircle, Calendar, BookOpen, Utensils } from 'lucide-react';

/**
 * Maps goal IDs from CompatibilityTransition to full milestone objects
 * for instant roadmap creation
 */
export const goalToMilestone = {
  'marry': {
    id: 'marry',
    title: 'Plan Your Dream Wedding',
    icon: Heart,
    description: 'From engagement to the big day - create your perfect celebration',
    estimatedCost: 25000,
    duration: '12-18 months',
    color: 'bg-gradient-to-br from-pink-500 to-rose-500',
    category: 'relationship',
    tasks: [
      { id: 1, title: 'Set wedding budget and priorities', completed: false },
      { id: 2, title: 'Create guest list', completed: false },
      { id: 3, title: 'Book venue', completed: false },
      { id: 4, title: 'Hire photographer', completed: false },
      { id: 5, title: 'Send invitations', completed: false }
    ]
  },

  'home': {
    id: 'home',
    title: 'Buy Your First Home',
    icon: Home,
    description: 'From saving to keys - navigate the home buying journey together',
    estimatedCost: 50000,
    duration: '18-24 months',
    color: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    category: 'home',
    tasks: [
      { id: 1, title: 'Save for down payment', completed: false },
      { id: 2, title: 'Get pre-approved for mortgage', completed: false },
      { id: 3, title: 'Research neighborhoods', completed: false },
      { id: 4, title: 'View properties', completed: false },
      { id: 5, title: 'Make offer and close', completed: false }
    ]
  },

  'savings': {
    id: 'savings',
    title: 'Build Emergency Fund',
    icon: DollarSign,
    description: 'Create financial security with 6 months of expenses saved',
    estimatedCost: 15000,
    duration: '12 months',
    color: 'bg-gradient-to-br from-green-500 to-emerald-500',
    category: 'financial',
    tasks: [
      { id: 1, title: 'Calculate monthly expenses', completed: false },
      { id: 2, title: 'Set savings target (6 months)', completed: false },
      { id: 3, title: 'Automate monthly savings', completed: false },
      { id: 4, title: 'Open high-yield savings account', completed: false },
      { id: 5, title: 'Reach savings goal', completed: false }
    ]
  },

  'vacation': {
    id: 'vacation',
    title: 'Dream Vacation Together',
    icon: Plane,
    description: 'Plan and save for your perfect getaway',
    estimatedCost: 5000,
    duration: '6-12 months',
    color: 'bg-gradient-to-br from-cyan-500 to-blue-500',
    category: 'lifestyle',
    tasks: [
      { id: 1, title: 'Choose destination', completed: false },
      { id: 2, title: 'Set vacation budget', completed: false },
      { id: 3, title: 'Book flights and accommodation', completed: false },
      { id: 4, title: 'Plan activities and itinerary', completed: false },
      { id: 5, title: 'Enjoy your trip!', completed: false }
    ]
  },

  'family': {
    id: 'family',
    title: 'Start a Family',
    icon: Baby,
    description: 'Prepare financially and emotionally for parenthood',
    estimatedCost: 10000,
    duration: '12-24 months',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    category: 'family',
    tasks: [
      { id: 1, title: 'Discuss family planning timeline', completed: false },
      { id: 2, title: 'Prepare financially for baby', completed: false },
      { id: 3, title: 'Set up nursery/baby space', completed: false },
      { id: 4, title: 'Research childcare options', completed: false },
      { id: 5, title: 'Build parenting support network', completed: false }
    ]
  },

  'counseling': {
    id: 'counseling',
    title: 'Couples Counseling Sessions',
    icon: Users,
    description: 'Work with a professional to strengthen your relationship',
    estimatedCost: 2000,
    duration: '3-6 months',
    color: 'bg-gradient-to-br from-indigo-500 to-purple-500',
    category: 'relationship',
    tasks: [
      { id: 1, title: 'Research and select counselor', completed: false },
      { id: 2, title: 'Schedule initial session', completed: false },
      { id: 3, title: 'Attend weekly sessions', completed: false },
      { id: 4, title: 'Complete homework exercises', completed: false },
      { id: 5, title: 'Review progress together', completed: false }
    ]
  },

  'communication-workshop': {
    id: 'communication-workshop',
    title: 'Communication Skills Workshop',
    icon: MessageCircle,
    description: 'Learn tools for better understanding and conflict resolution',
    estimatedCost: 500,
    duration: '1-2 months',
    color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    category: 'relationship',
    tasks: [
      { id: 1, title: 'Find local workshop or online course', completed: false },
      { id: 2, title: 'Complete workshop together', completed: false },
      { id: 3, title: 'Practice active listening techniques', completed: false },
      { id: 4, title: 'Implement daily check-ins', completed: false },
      { id: 5, title: 'Review what you learned', completed: false }
    ]
  },

  'financial-planning': {
    id: 'financial-planning',
    title: 'Financial Planning Session',
    icon: DollarSign,
    description: 'Align on money management and financial goals',
    estimatedCost: 1000,
    duration: '1-3 months',
    color: 'bg-gradient-to-br from-green-500 to-teal-500',
    category: 'financial',
    tasks: [
      { id: 1, title: 'Schedule session with financial advisor', completed: false },
      { id: 2, title: 'Review current finances together', completed: false },
      { id: 3, title: 'Set shared financial goals', completed: false },
      { id: 4, title: 'Create joint budget', completed: false },
      { id: 5, title: 'Implement spending plan', completed: false }
    ]
  },

  'retreat': {
    id: 'retreat',
    title: 'Weekend Retreat Together',
    icon: Calendar,
    description: 'Reconnect and discuss your future in a peaceful setting',
    estimatedCost: 800,
    duration: '1 month',
    color: 'bg-gradient-to-br from-rose-500 to-pink-500',
    category: 'relationship',
    tasks: [
      { id: 1, title: 'Choose retreat location', completed: false },
      { id: 2, title: 'Book accommodation', completed: false },
      { id: 3, title: 'Plan discussion topics', completed: false },
      { id: 4, title: 'Disconnect from distractions', completed: false },
      { id: 5, title: 'Document insights and decisions', completed: false }
    ]
  },

  'hobby': {
    id: 'hobby',
    title: 'Learn Something Together',
    icon: BookOpen,
    description: 'Build connection through shared learning experiences',
    estimatedCost: 300,
    duration: '3-6 months',
    color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    category: 'lifestyle',
    tasks: [
      { id: 1, title: 'Choose skill or hobby to learn', completed: false },
      { id: 2, title: 'Sign up for class or course', completed: false },
      { id: 3, title: 'Practice together weekly', completed: false },
      { id: 4, title: 'Celebrate progress milestones', completed: false },
      { id: 5, title: 'Share what you learned', completed: false }
    ]
  },

  'date-nights': {
    id: 'date-nights',
    title: 'Weekly Date Nights',
    icon: Utensils,
    description: 'Rebuild connection and intimacy through regular quality time',
    estimatedCost: 2400,
    duration: '12 months',
    color: 'bg-gradient-to-br from-red-500 to-pink-500',
    category: 'relationship',
    tasks: [
      { id: 1, title: 'Block weekly date night in calendar', completed: false },
      { id: 2, title: 'Create list of date ideas', completed: false },
      { id: 3, title: 'Take turns planning dates', completed: false },
      { id: 4, title: 'Try new activities together', completed: false },
      { id: 5, title: 'Reflect on favorite moments', completed: false }
    ]
  }
};

/**
 * Converts an array of goal IDs into milestone objects
 */
export const convertGoalsToMilestones = (goalIds) => {
  return goalIds
    .map(id => goalToMilestone[id])
    .filter(Boolean); // Remove any undefined mappings
};

/**
 * Get recommended goals based on compatibility score
 * Used as fallback if no goals are selected
 */
export const getDefaultGoalsForScore = (alignmentScore) => {
  if (alignmentScore >= 75) {
    return ['marry', 'home', 'savings'];
  } else if (alignmentScore >= 50) {
    return ['communication-workshop', 'financial-planning', 'vacation'];
  } else {
    return ['counseling', 'communication-workshop', 'retreat'];
  }
};

export default {
  goalToMilestone,
  convertGoalsToMilestones,
  getDefaultGoalsForScore
};
