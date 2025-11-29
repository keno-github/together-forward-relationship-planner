/**
 * Milestone Generator
 *
 * Generates milestone objects based on goal types
 * Includes:
 * - Templates for different goal types
 * - Location-based cost adjustments
 * - Task generation
 * - Icons and styling
 */

import { Heart, Home, Baby, Plane, Briefcase, GraduationCap, PiggyBank, Users } from 'lucide-react';

/**
 * Milestone templates with tasks and styling
 */
const MILESTONE_TEMPLATES = {
  wedding: {
    icon: Heart,
    color: 'bg-gradient-to-br from-pink-500 to-rose-500',
    baseTasks: [
      'Set wedding budget and open savings account',
      'Choose wedding date and book venue',
      'Select and book key vendors (photographer, caterer, florist)',
      'Send save-the-dates and invitations',
      'Final details, rehearsal, and big day!'
    ]
  },
  engagement: {
    icon: Heart,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    baseTasks: [
      'Research and choose engagement ring',
      'Plan the proposal (location, timing, details)',
      'Pop the question!',
      'Celebrate with family and friends',
      'Announce engagement'
    ]
  },
  home: {
    icon: Home,
    color: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    baseTasks: [
      'Calculate required deposit and get mortgage advice',
      'Start saving for deposit',
      'Get mortgage pre-approval',
      'Search for properties and schedule viewings',
      'Make offer, complete purchase, and move in!'
    ]
  },
  baby: {
    icon: Baby,
    color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    baseTasks: [
      'Prepare finances and build emergency fund',
      'Health check-ups and prepare for pregnancy',
      'Set up nursery and get baby essentials',
      'Arrange parental leave and childcare',
      'Welcome your little one!'
    ]
  },
  travel: {
    icon: Plane,
    color: 'bg-gradient-to-br from-green-500 to-teal-500',
    baseTasks: [
      'Choose destination and set travel budget',
      'Save for trip and book flights',
      'Book accommodation and plan itinerary',
      'Prepare travel documents and insurance',
      'Enjoy your adventure together!'
    ]
  },
  career: {
    icon: Briefcase,
    color: 'bg-gradient-to-br from-purple-600 to-blue-600',
    baseTasks: [
      'Define career goals and create action plan',
      'Update CV, portfolio, and LinkedIn',
      'Network and apply for target opportunities',
      'Prepare for interviews and skill up',
      'Secure new position and transition'
    ]
  },
  education: {
    icon: GraduationCap,
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    baseTasks: [
      'Research programs and admission requirements',
      'Prepare applications and required documents',
      'Apply for programs and scholarships',
      'Secure funding and plan logistics',
      'Start your educational journey!'
    ]
  },
  financial: {
    icon: PiggyBank,
    color: 'bg-gradient-to-br from-emerald-500 to-green-600',
    baseTasks: [
      'Set financial goals and create budget',
      'Build emergency fund (3-6 months expenses)',
      'Start investing and savings plan',
      'Track progress and adjust as needed',
      'Reach financial milestone!'
    ]
  }
};

/**
 * Location cost multipliers (Dublin as baseline = 1.0)
 * Adjusts costs based on location
 */
const LOCATION_MULTIPLIERS = {
  // Ireland
  'dublin': 1.0,
  'cork': 0.75,
  'galway': 0.7,
  'limerick': 0.65,
  'ireland': 0.8,

  // UK
  'london': 1.4,
  'manchester': 0.9,
  'edinburgh': 0.95,
  'belfast': 0.7,
  'uk': 1.0,

  // Europe
  'paris': 1.3,
  'berlin': 0.85,
  'amsterdam': 1.1,
  'madrid': 0.75,
  'barcelona': 0.8,
  'rome': 0.85,
  'lisbon': 0.65,

  // Default
  'default': 0.85
};

/**
 * Get location multiplier
 */
function getLocationMultiplier(location) {
  if (!location) return LOCATION_MULTIPLIERS.default;

  const locationKey = location.toLowerCase().trim();

  // Exact match
  if (LOCATION_MULTIPLIERS[locationKey]) {
    return LOCATION_MULTIPLIERS[locationKey];
  }

  // Partial match (e.g., "Dublin, Ireland" contains "dublin")
  for (const [key, multiplier] of Object.entries(LOCATION_MULTIPLIERS)) {
    if (locationKey.includes(key)) {
      return multiplier;
    }
  }

  return LOCATION_MULTIPLIERS.default;
}

/**
 * Generate unique milestone ID (UUID format for database compatibility)
 */
function generateMilestoneId() {
  return crypto.randomUUID();
}

/**
 * Main milestone generation function
 *
 * @param {Object} params - Milestone parameters
 * @returns {Object} Complete milestone object
 */
export function generateMilestone(params) {
  const {
    goal_type,
    title,
    description,
    timeline_months,
    budget,
    location,
    preferences = {},
    context = {}
  } = params;

  // Get template
  const template = MILESTONE_TEMPLATES[goal_type] || MILESTONE_TEMPLATES.financial;

  // Adjust budget for location
  const locationMultiplier = getLocationMultiplier(location);
  const adjustedBudget = Math.round(budget * locationMultiplier);

  // Generate ID
  const id = generateMilestoneId();

  // Generate tasks
  const tasks = template.baseTasks.map((taskTitle, index) => ({
    id: `${id}_task_${index}`,
    title: taskTitle,
    completed: false,
    aiGenerated: true
  }));

  // Build milestone object
  const milestone = {
    id,
    title,
    description: description || `Achieve your ${goal_type} goal together`,
    icon: template.icon,
    color: template.color,
    estimatedCost: adjustedBudget,
    duration: `${timeline_months} months`,
    timeline_months,
    aiGenerated: true,
    goalType: goal_type,
    location: location || 'Unknown',
    locationMultiplier,
    preferences,
    tasks,
    createdAt: new Date().toISOString(),
    completedTasks: 0,
    totalTasks: tasks.length
  };

  console.log('✨ Generated milestone:', {
    id: milestone.id,
    title: milestone.title,
    cost: milestone.estimatedCost,
    timeline: milestone.duration
  });

  return milestone;
}

/**
 * Calculate monthly savings required
 */
export function calculateMonthlySavings(totalCost, months) {
  if (!months || months <= 0) return 0;
  return Math.round(totalCost / months);
}

/**
 * Get milestone template info (without generating full milestone)
 */
export function getMilestoneTemplate(goalType) {
  return MILESTONE_TEMPLATES[goalType] || MILESTONE_TEMPLATES.financial;
}

/**
 * Get all available goal types
 */
export function getAvailableGoalTypes() {
  return Object.keys(MILESTONE_TEMPLATES);
}
