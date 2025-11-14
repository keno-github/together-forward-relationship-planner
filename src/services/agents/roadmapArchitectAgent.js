/**
 * Roadmap Architect Agent
 *
 * Generates comprehensive, personalized roadmaps for ANY goal type.
 * Goes beyond templates to create intelligent, context-aware milestone
 * sequences with realistic timelines and dependencies.
 *
 * Key Capabilities:
 * - Generate milestones for any goal (not just templates)
 * - Create task dependencies (can't do X before Y)
 * - Realistic timeline estimation
 * - Budget-aware recommendations
 * - Location-specific customization
 * - Partner task assignment suggestions
 */

import { generateMilestone, MILESTONE_TEMPLATES } from '../milestoneGenerator';

/**
 * Generates a comprehensive roadmap from user context
 * @param {Object} userContext - Consolidated user data from Goal Discovery Agent
 * @param {string} goalType - Type of goal
 * @returns {Object} Complete roadmap with milestones, tasks, and metadata
 */
export const generateRoadmap = async (userContext, goalType) => {
  const { budget, timeline, location, preferences, constraints } = userContext;

  // Determine milestone sequence based on goal type
  const milestoneSequence = determineMilestoneSequence(goalType, constraints);

  // Generate each milestone with context
  const milestones = milestoneSequence.map((milestoneType, index) => {
    const milestone = generateMilestone(milestoneType, {
      budget: budget?.amount,
      location: location?.text,
      preferences: preferences.map(p => p.value),
      order: index
    });

    // Add dependencies
    milestone.depends_on = index > 0 ? [milestoneSequence[index - 1]] : [];

    // Add realistic timeline
    milestone.estimated_duration = estimateDuration(milestoneType, constraints);

    // Assign tasks to partners
    milestone.tasks = assignTasksToPartners(milestone.tasks, preferences);

    return milestone;
  });

  // Calculate total timeline
  const totalDuration = calculateTotalDuration(milestones);

  // Calculate budget allocation
  const budgetAllocation = allocateBudget(milestones, budget?.amount);

  return {
    roadmap: {
      goal: goalType,
      milestones,
      metadata: {
        totalMilestones: milestones.length,
        totalDuration,
        estimatedCost: budgetAllocation.total,
        location: location?.text,
        createdWith: 'Roadmap Architect Agent',
        confidence: calculateConfidence(userContext)
      }
    },
    budgetAllocation
  };
};

/**
 * Determines the sequence of milestones for a goal
 * @param {string} goalType - Type of goal
 * @param {Array} constraints - User constraints
 * @returns {Array} Ordered array of milestone types
 */
const determineMilestoneSequence = (goalType, constraints = []) => {
  const sequences = {
    wedding: [
      'engagement',
      'budget_planning',
      'venue_booking',
      'vendor_selection',
      'guest_list',
      'invitations',
      'dress_tux',
      'final_preparations',
      'wedding_day'
    ],
    home: [
      'financial_assessment',
      'location_research',
      'mortgage_preapproval',
      'house_hunting',
      'home_inspection',
      'offer_negotiation',
      'closing_preparations',
      'moving'
    ],
    baby: [
      'preconception',
      'prenatal_care',
      'nursery_setup',
      'baby_gear',
      'birth_plan',
      'childcare_planning',
      'maternity_leave',
      'baby_arrival'
    ],
    business: [
      'idea_validation',
      'business_plan',
      'legal_setup',
      'funding',
      'branding',
      'product_development',
      'marketing_launch',
      'first_customers'
    ],
    vacation: [
      'destination_selection',
      'budget_planning',
      'booking_flights',
      'accommodation',
      'itinerary_planning',
      'packing',
      'trip_preparation'
    ],
    emergency_fund: [
      'expense_analysis',
      'savings_goal',
      'budget_adjustment',
      'automated_savings',
      'emergency_fund_growth'
    ]
  };

  // Get base sequence
  let sequence = sequences[goalType] || [
    'research',
    'planning',
    'budgeting',
    'execution',
    'completion'
  ];

  // Adjust based on constraints
  if (constraints.some(c => c.type === 'time_constraint')) {
    // Remove optional milestones for rushed timeline
    sequence = sequence.filter((_, index) => index % 2 === 0 || index === sequence.length - 1);
  }

  if (constraints.some(c => c.type === 'budget_constraint')) {
    // Add budget review checkpoint
    sequence.splice(2, 0, 'budget_review');
  }

  return sequence;
};

/**
 * Estimates duration for a milestone type
 * @param {string} milestoneType - Type of milestone
 * @param {Array} constraints - User constraints
 * @returns {string} Duration estimate (e.g., "2-4 weeks")
 */
const estimateDuration = (milestoneType, constraints = []) => {
  const baseDurations = {
    research: '1-2 weeks',
    planning: '2-3 weeks',
    budget_planning: '1 week',
    booking: '1-2 weeks',
    shopping: '2-4 weeks',
    preparation: '3-6 weeks',
    execution: '1 day - 1 week',
    review: '1 week'
  };

  // Check if milestone type matches a base duration pattern
  for (const [key, duration] of Object.entries(baseDurations)) {
    if (milestoneType.includes(key)) {
      return adjustForConstraints(duration, constraints);
    }
  }

  return '1-2 weeks'; // Default
};

/**
 * Adjusts duration based on constraints
 * @param {string} duration - Base duration
 * @param {Array} constraints - User constraints
 * @returns {string} Adjusted duration
 */
const adjustForConstraints = (duration, constraints) => {
  if (constraints.some(c => c.type === 'time_constraint')) {
    // Halve the duration for rushed timeline
    const [min, max] = duration.match(/\d+/g).map(Number);
    return `${Math.ceil(min / 2)}-${Math.ceil(max / 2)} weeks`;
  }
  return duration;
};

/**
 * Calculates total roadmap duration
 * @param {Array} milestones - Array of milestones
 * @returns {string} Total duration estimate
 */
const calculateTotalDuration = (milestones) => {
  // Sum up all durations (simplified - assumes sequential)
  let totalWeeks = 0;

  milestones.forEach(m => {
    const duration = m.estimated_duration || m.duration;
    if (duration) {
      const matches = duration.match(/(\d+)/g);
      if (matches) {
        // Take average of range
        const nums = matches.map(Number);
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        totalWeeks += avg;
      }
    }
  });

  if (totalWeeks < 4) {
    return `${totalWeeks.toFixed(0)} weeks`;
  } else if (totalWeeks < 52) {
    return `${(totalWeeks / 4).toFixed(1)} months`;
  } else {
    return `${(totalWeeks / 52).toFixed(1)} years`;
  }
};

/**
 * Allocates budget across milestones
 * @param {Array} milestones - Array of milestones
 * @param {number} totalBudget - Total available budget
 * @returns {Object} Budget allocation by milestone
 */
const allocateBudget = (milestones, totalBudget) => {
  if (!totalBudget) {
    return {
      total: 0,
      byMilestone: {},
      message: 'No budget specified'
    };
  }

  // Budget weights by milestone type (some cost more than others)
  const weights = {
    venue: 0.30,
    catering: 0.25,
    photography: 0.12,
    dress: 0.08,
    flowers: 0.05,
    music: 0.08,
    invitations: 0.02,
    planning: 0.10
  };

  const allocation = {};
  milestones.forEach(milestone => {
    const type = milestone.title.toLowerCase();
    let weight = 0.10; // Default weight

    // Find matching weight
    for (const [key, value] of Object.entries(weights)) {
      if (type.includes(key)) {
        weight = value;
        break;
      }
    }

    allocation[milestone.title] = {
      amount: totalBudget * weight,
      percentage: (weight * 100).toFixed(1)
    };
  });

  return {
    total: totalBudget,
    byMilestone: allocation,
    currency: 'USD'
  };
};

/**
 * Assigns tasks to partners based on preferences
 * @param {Array} tasks - Array of tasks
 * @param {Array} preferences - User preferences
 * @returns {Array} Tasks with partner assignments
 */
const assignTasksToPartners = (tasks, preferences = []) => {
  if (!tasks || tasks.length === 0) return [];

  return tasks.map((task, index) => {
    // Alternate assignments by default
    const defaultPartner = index % 2 === 0 ? 'partner_a' : 'partner_b';

    // Check if preferences suggest a specific partner for this task type
    const taskType = task.title.toLowerCase();
    let suggestedPartner = defaultPartner;

    // Simple logic: creative tasks to one partner, logistical to other
    const creativeKeywords = ['design', 'style', 'decor', 'flowers', 'aesthetic'];
    const logisticalKeywords = ['book', 'schedule', 'coordinate', 'confirm', 'budget'];

    if (creativeKeywords.some(keyword => taskType.includes(keyword))) {
      suggestedPartner = 'partner_b'; // Could be customized based on preferences
    } else if (logisticalKeywords.some(keyword => taskType.includes(keyword))) {
      suggestedPartner = 'partner_a';
    }

    return {
      ...task,
      suggested_assignee: suggestedPartner,
      estimated_time: estimateTaskTime(task),
      assignment_reason: getAssignmentReason(taskType, suggestedPartner)
    };
  });
};

/**
 * Estimates time for a task
 * @param {Object} task - Task object
 * @returns {string} Time estimate
 */
const estimateTaskTime = (task) => {
  const taskType = task.title.toLowerCase();

  if (taskType.includes('research') || taskType.includes('compare')) {
    return '2-4 hours';
  } else if (taskType.includes('book') || taskType.includes('schedule')) {
    return '1-2 hours';
  } else if (taskType.includes('create') || taskType.includes('design')) {
    return '3-5 hours';
  }

  return '1-2 hours'; // Default
};

/**
 * Gets reason for task assignment
 * @param {string} taskType - Type of task
 * @param {string} partner - Assigned partner
 * @returns {string} Reason for assignment
 */
const getAssignmentReason = (taskType, partner) => {
  if (taskType.includes('creative') || taskType.includes('design')) {
    return 'Creative task - suits visual/design skills';
  } else if (taskType.includes('budget') || taskType.includes('financial')) {
    return 'Financial task - requires number management';
  } else if (taskType.includes('research')) {
    return 'Research task - requires analytical skills';
  }

  return 'Balanced task distribution';
};

/**
 * Calculates confidence in the generated roadmap
 * @param {Object} userContext - User context
 * @returns {number} Confidence score (0-1)
 */
const calculateConfidence = (userContext) => {
  let score = 0;
  const weights = {
    budget: 0.3,
    timeline: 0.3,
    location: 0.2,
    preferences: 0.2
  };

  if (userContext.budget) score += weights.budget;
  if (userContext.timeline) score += weights.timeline;
  if (userContext.location) score += weights.location;
  if (userContext.preferences && userContext.preferences.length > 0) {
    score += weights.preferences;
  }

  return score;
};

/**
 * Adapts an existing roadmap based on changes
 * @param {Object} roadmap - Current roadmap
 * @param {Object} changes - Changes to apply
 * @returns {Object} Adapted roadmap
 */
export const adaptRoadmap = (roadmap, changes) => {
  const adapted = { ...roadmap };

  // Handle budget changes
  if (changes.budget) {
    const newAllocation = allocateBudget(adapted.milestones, changes.budget);
    adapted.budgetAllocation = newAllocation;
  }

  // Handle timeline changes
  if (changes.timeline) {
    // Recalculate durations based on new timeline
    adapted.milestones = adapted.milestones.map(m => ({
      ...m,
      estimated_duration: adjustForConstraints(
        m.estimated_duration,
        changes.constraints || []
      )
    }));
  }

  // Handle location changes
  if (changes.location) {
    adapted.metadata.location = changes.location;
    // Could trigger location-specific recommendations
  }

  return adapted;
};

export default {
  generateRoadmap,
  adaptRoadmap,
  determineMilestoneSequence,
  allocateBudget
};
