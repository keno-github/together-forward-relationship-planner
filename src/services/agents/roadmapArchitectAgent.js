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
import { callClaudeGenerate } from '../claudeAPI';

/**
 * Generates a comprehensive roadmap from user context
 * @param {Object} userContext - Consolidated user data from Goal Discovery Agent
 * @param {string} goalType - Type of goal
 * @param {string} goalDescription - Optional detailed description of the goal
 * @param {Object} options - Optional configuration { useClaudeValidation: boolean }
 * @returns {Object} Complete roadmap with milestones, tasks, and metadata
 */
export const generateRoadmap = async (userContext, goalType, goalDescription = null, options = {}) => {
  const { budget, timeline, location, preferences, constraints } = userContext;
  const { useClaudeValidation = true } = options;

  let milestoneSequence;
  let generationMethod = 'template';
  let validationInsights = null;

  // HYBRID APPROACH - Layer 1: Template Matching
  const templateSequence = determineMilestoneSequence(goalType, constraints);
  const isGenericFallback = templateSequence.includes('goal_definition_and_research'); // Detect if we're using generic fallback

  // HYBRID APPROACH - Layer 2: Claude Validation & Customization
  // Force Claude customization if:
  // 1. Goal description is provided, AND
  // 2. Either validation is enabled OR we're using generic fallback template
  const shouldUseClaudeCustomization = goalDescription && (useClaudeValidation || isGenericFallback);

  if (shouldUseClaudeCustomization) {
    try {
      const validation = await validateAndCustomizeTemplate(
        templateSequence,
        goalType,
        goalDescription,
        userContext
      );

      if (validation && validation.customizedSequence && validation.customizedSequence.length > 0) {
        milestoneSequence = validation.customizedSequence;
        validationInsights = validation.insights;
        generationMethod = validation.approved ? 'template_validated' : 'template_customized';
        console.log('✅ Claude customization successful:', {
          originalLength: templateSequence.length,
          customizedLength: milestoneSequence.length,
          method: generationMethod
        });
      } else {
        // Validation returned empty - fall back to template
        console.warn('Claude validation returned empty, using template');
        milestoneSequence = templateSequence;
        generationMethod = 'template';
      }
    } catch (claudeError) {
      console.warn('Claude validation failed, attempting pure generation...', claudeError.message);

      // HYBRID APPROACH - Layer 3: Pure Claude Generation (fallback for unknown goals)
      try {
        milestoneSequence = await generateMilestonesWithClaude(
          goalDescription,
          userContext
        );
        generationMethod = 'claude_generated';
        console.log('✅ Claude pure generation successful');
      } catch (claudeGenerationError) {
        console.error('Claude generation failed, using template fallback:', claudeGenerationError.message);
        // Final fallback: use template (even if generic)
        milestoneSequence = templateSequence;
        generationMethod = 'fallback';
      }
    }
  } else {
    // No description or validation disabled - use template as-is
    milestoneSequence = templateSequence;
    generationMethod = 'template';
  }

  // Generate each milestone with context
  const milestones = milestoneSequence.map((milestoneType, index) => {
    // Create a human-readable title from milestone type
    const title = milestoneType.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    const milestone = generateMilestone({
      goal_type: goalType,
      title,
      timeline_months: 1,
      budget: budget?.amount || 10000,
      location: location?.text || 'US',
      preferences: preferences || [],
      context: { order: index }
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
        createdWith: 'Roadmap Architect Agent (Hybrid with Validation)',
        generationMethod, // 'template', 'template_validated', 'template_customized', 'claude_generated', or 'fallback'
        validationInsights, // Insights from Claude about customizations made
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
export const determineMilestoneSequence = (goalType, constraints = []) => {
  const sequences = {
    // WEDDING - Comprehensive 12-18 month planning sequence
    wedding: [
      'engagement_celebration',           // Announce engagement, celebrate with family
      'vision_and_style_discovery',       // Define wedding style, theme, vibe, priorities
      'budget_and_financial_planning',    // Set realistic budget, open joint account, track expenses
      'guest_list_development',           // Draft guest list, categorize (must-have, nice-to-have)
      'venue_research_and_booking',       // Tour venues, compare packages, sign contract
      'vendor_discovery_and_selection',   // Research photographers, caterers, florists, DJs
      'save_the_date_distribution',       // Design and send save-the-dates (6-8 months before)
      'attire_shopping_and_fittings',     // Wedding dress/tux shopping, alterations, accessories
      'invitation_design_and_mailing',    // Design invitations, finalize RSVP tracking
      'ceremony_and_vows_planning',       // Write vows, plan ceremony details, rehearsal
      'reception_details_finalization',   // Finalize menu, seating chart, music playlist, decor
      'final_vendor_confirmations',       // Confirm all vendors, create day-of timeline
      'rehearsal_and_final_prep',         // Rehearsal dinner, final dress fitting, pack for honeymoon
      'wedding_day_execution',            // The big day! Enjoy and celebrate
      'post_wedding_tasks'                // Thank you cards, vendor payments, name changes
    ],

    // HOME BUYING - 6-12 month comprehensive process
    home: [
      'financial_health_assessment',      // Check credit score, review debts, calculate affordability
      'savings_and_down_payment_plan',    // Build down payment fund (typically 10-20%)
      'mortgage_preapproval_process',     // Meet lenders, get pre-approved, understand loan types
      'location_and_neighborhood_research', // Research areas, schools, commute, amenities
      'real_estate_agent_selection',      // Interview agents, choose representation
      'house_hunting_and_tours',          // Tour properties, attend open houses, compare options
      'offer_preparation_and_negotiation', // Make offer, negotiate price, contingencies
      'home_inspection_and_appraisal',    // Schedule inspections, review findings, negotiate repairs
      'mortgage_finalization',            // Finalize loan, lock interest rate, submit documents
      'title_and_insurance_review',       // Review title search, purchase homeowners insurance
      'final_walkthrough',                // Verify repairs completed, check property condition
      'closing_and_possession',           // Sign documents, transfer funds, receive keys
      'moving_and_setup',                 // Hire movers, change address, utilities setup
      'home_maintenance_planning'         // Create maintenance schedule, budget for repairs
    ],

    // BABY - Comprehensive pregnancy to first year
    baby: [
      'preconception_planning',           // Health checkup, prenatal vitamins, lifestyle changes
      'pregnancy_confirmation',           // Doctor visit, first ultrasound, share news
      'prenatal_care_establishment',      // Choose OB/midwife, schedule regular checkups
      'financial_planning_for_baby',      // Review insurance, create baby budget, start savings
      'nursery_planning_and_setup',       // Design nursery, purchase furniture, baby-proof home
      'baby_registry_creation',           // Research baby gear, create registry, track gifts
      'childbirth_education',             // Attend classes, create birth plan, tour hospital
      'maternity_leave_planning',         // Submit paperwork, train replacement, arrange coverage
      'hospital_bag_preparation',         // Pack essentials, install car seat, finalize birth plan
      'baby_arrival_and_postpartum',      // Birth, recovery, establish feeding/sleep routines
      'newborn_care_and_adjustment',      // Pediatrician visits, sleep training, partner support
      'work_transition_planning',         // Childcare search, gradual return to work plan
      'first_year_milestones'             // Track development, vaccinations, celebrate firsts
    ],

    // BUSINESS - Startup launch (6-18 months)
    business: [
      'idea_validation_and_research',     // Market research, competitor analysis, validate demand
      'target_market_identification',     // Define ideal customer, create personas, survey potential users
      'business_model_development',       // Revenue streams, pricing strategy, unit economics
      'comprehensive_business_plan',      // Write business plan, financial projections, pitch deck
      'legal_structure_and_registration', // Choose LLC/Corp, register business, get EIN
      'funding_and_capital_raising',      // Bootstrap, seek investors, apply for loans/grants
      'branding_and_identity_creation',   // Logo design, brand colors, messaging, website
      'product_or_service_development',   // Build MVP, test with beta users, iterate based on feedback
      'operations_and_infrastructure',    // Set up tools, hire team, establish workflows
      'marketing_strategy_execution',     // SEO, social media, content marketing, paid ads
      'soft_launch_and_testing',          // Limited release, gather feedback, fix bugs
      'full_launch_and_promotion',        // Public launch, press release, launch event
      'customer_acquisition',             // Sales outreach, partnerships, referral programs
      'growth_and_scaling'                // Analyze metrics, optimize, scale successful channels
    ],

    // VACATION/TRAVEL - Comprehensive trip planning
    vacation: [
      'destination_brainstorming',        // Research destinations, consider season, interests
      'budget_and_savings_plan',          // Set travel budget, open savings account, track progress
      'travel_dates_finalization',        // Check work calendar, book time off, consider peak seasons
      'flight_research_and_booking',      // Compare airlines, use fare alerts, book tickets
      'accommodation_selection',          // Hotels vs Airbnb, read reviews, book lodging
      'itinerary_planning',               // Must-see attractions, day-by-day schedule, local experiences
      'travel_documents_preparation',     // Passport/visa, travel insurance, medical vaccinations
      'packing_and_preparation',          // Create packing list, buy travel essentials, arrange pet care
      'pre_trip_arrangements',            // Notify bank, download offline maps, learn basic phrases
      'trip_execution_and_enjoyment',     // Travel, stay flexible, document memories
      'post_trip_reflection'              // Organize photos, write reviews, plan next adventure
    ],

    // EMERGENCY FUND - Financial security building
    emergency_fund: [
      'current_expenses_analysis',        // Track all expenses for 1-2 months, categorize spending
      'emergency_fund_goal_setting',      // Calculate 3-6 months expenses, set target amount
      'income_and_debt_assessment',       // Review income sources, prioritize high-interest debt
      'budget_optimization',              // Cut unnecessary expenses, negotiate bills, find savings
      'automated_savings_setup',          // Set up auto-transfer, treat savings as a bill
      'high_yield_savings_account',       // Open HYSA, maximize interest, keep separate from checking
      'side_income_exploration',          // Freelance, sell items, gig economy opportunities
      'milestone_celebrations',           // Celebrate 25%, 50%, 75%, 100% completion
      'emergency_fund_maintenance',       // Replenish after use, adjust for life changes
      'next_financial_goals'              // Retirement, investments, debt payoff, next goal
    ],

    // RELOCATION/MOVING - International or long-distance move
    relocation: [
      'destination_research',             // Research new location, cost of living, culture, climate
      'visa_and_immigration_planning',    // Check visa requirements, gather documents, apply
      'job_search_in_new_location',       // Update resume, apply to jobs, network, interview
      'housing_search_and_securing',      // Research neighborhoods, virtual tours, lease/buy
      'financial_planning_for_move',      // Currency exchange, international banking, moving budget
      'logistics_and_moving_coordination', // Hire movers, ship belongings, sell/donate items
      'legal_and_administrative_tasks',   // Cancel subscriptions, transfer records, update address
      'farewell_and_closure',             // Say goodbye, host farewell party, close accounts
      'travel_arrangements',              // Book flights, plan arrival logistics, temporary housing
      'settling_into_new_location',       // Set up utilities, explore neighborhood, make friends
      'cultural_adaptation',              // Learn local customs, language practice, join communities
      'establishing_new_life',            // Get local ID/license, open bank account, find doctors
      'reflection_and_integration'        // Reflect on transition, stay connected with home, embrace new life
    ],

    // MOVING - Same as relocation for consistency
    moving: [
      'destination_research',
      'visa_and_immigration_planning',
      'job_search_in_new_location',
      'housing_search_and_securing',
      'financial_planning_for_move',
      'logistics_and_moving_coordination',
      'legal_and_administrative_tasks',
      'farewell_and_closure',
      'travel_arrangements',
      'settling_into_new_location',
      'cultural_adaptation',
      'establishing_new_life',
      'reflection_and_integration'
    ],

    // CAREER - Job change or career transition
    career: [
      'self_assessment_and_reflection',   // Skills audit, values clarification, career interests
      'industry_and_role_research',       // Explore industries, read job descriptions, salary research
      'skill_gap_analysis',               // Identify needed skills, plan upskilling, certifications
      'resume_and_portfolio_update',      // Tailor resume, build portfolio, LinkedIn optimization
      'networking_and_connections',       // Attend events, informational interviews, join groups
      'job_search_strategy',              // Apply strategically, track applications, follow up
      'interview_preparation',            // Practice questions, research companies, prepare stories
      'negotiation_and_offer_evaluation', // Compare offers, negotiate salary/benefits, review terms
      'transition_planning',              // Give notice, knowledge transfer, maintain relationships
      'onboarding_and_integration',       // Learn new role, build relationships, set 90-day goals
      'continuous_development'            // Seek feedback, pursue growth, build new skills
    ],

    // EDUCATION - Degree or certification pursuit
    education: [
      'program_research_and_selection',   // Research schools, compare programs, rankings, outcomes
      'admission_requirements_review',    // Check prerequisites, test requirements (GRE, GMAT, etc.)
      'test_preparation_and_taking',      // Study for entrance exams, take tests, submit scores
      'application_preparation',          // Write essays, gather transcripts, request recommendations
      'financial_planning',               // Calculate total cost, apply for scholarships, loans
      'application_submission',           // Submit applications, track deadlines, follow up
      'decision_and_enrollment',          // Compare offers, visit campuses, accept offer, enroll
      'pre_program_preparation',          // Arrange housing, buy materials, attend orientation
      'academic_year_planning',           // Create study schedule, join study groups, seek resources
      'degree_completion',                // Complete coursework, capstone/thesis, graduate
      'career_transition',                // Update credentials, job search, leverage alumni network
      'lifelong_learning'                 // Stay current, professional development, mentorship
    ],

    // FINANCIAL - General financial goal (investment, debt payoff, etc.)
    financial: [
      'financial_goal_definition',        // Define specific goal, amount, timeline
      'current_financial_snapshot',       // Net worth calculation, assets, liabilities
      'income_and_expense_tracking',      // Track all money in/out, identify patterns
      'debt_prioritization',              // List all debts, choose payoff strategy (avalanche/snowball)
      'budget_creation_and_optimization', // Create realistic budget, find extra money
      'savings_automation',               // Auto-transfer to savings, retirement accounts
      'investment_education',             // Learn basics, risk tolerance, diversification
      'investment_account_setup',         // Open brokerage, 401k, IRA, start contributing
      'progress_monitoring',              // Monthly reviews, adjust as needed, celebrate wins
      'goal_achievement',                 // Reach target, reinvest gains, set new goal
      'wealth_maintenance'                // Rebalance portfolio, tax optimization, estate planning
    ]
  };

  // Get base sequence
  let sequence = sequences[goalType] || [
    'goal_definition_and_research',
    'comprehensive_planning',
    'budget_and_resource_allocation',
    'execution_and_implementation',
    'completion_and_celebration'
  ];

  // INTELLIGENT CONSTRAINT-BASED ADJUSTMENTS

  // Time Constraint: Compress timeline intelligently
  if (constraints.some(c => c.type === 'time_constraint')) {
    // Keep critical milestones, remove nice-to-haves based on goal type
    const criticalMilestonePatterns = {
      wedding: ['budget', 'venue', 'vendor', 'invitations', 'wedding_day'],
      home: ['financial', 'mortgage', 'house_hunting', 'inspection', 'closing'],
      baby: ['prenatal', 'nursery', 'hospital_bag', 'baby_arrival'],
      relocation: ['visa', 'job_search', 'housing', 'travel', 'settling'],
      business: ['validation', 'business_plan', 'legal', 'product', 'launch'],
      financial: ['goal_definition', 'budget', 'savings', 'monitoring']
    };

    const criticalPatterns = criticalMilestonePatterns[goalType] || [];

    if (criticalPatterns.length > 0) {
      // Keep milestones that match critical patterns
      sequence = sequence.filter(milestone =>
        criticalPatterns.some(pattern =>
          milestone.toLowerCase().includes(pattern.toLowerCase())
        )
      );
    } else {
      // Fallback: Keep every other milestone for unknown goal types
      sequence = sequence.filter((_, index) =>
        index % 2 === 0 || index === sequence.length - 1
      );
    }
  }

  // Budget Constraint: Add financial checkpoints
  if (constraints.some(c => c.type === 'budget_constraint')) {
    // Insert budget review after planning phase
    const planningIndex = sequence.findIndex(m =>
      m.includes('planning') || m.includes('budget')
    );

    if (planningIndex !== -1 && planningIndex < sequence.length - 1) {
      sequence.splice(planningIndex + 1, 0, 'budget_checkpoint_and_review');
    }

    // Add mid-point financial review
    const midPoint = Math.floor(sequence.length / 2);
    if (midPoint > 0 && midPoint < sequence.length - 1) {
      sequence.splice(midPoint, 0, 'financial_health_check');
    }
  }

  // Ensure minimum viable roadmap (at least 3 milestones)
  if (sequence.length < 3) {
    sequence = sequences[goalType] || [
      'goal_definition_and_research',
      'comprehensive_planning',
      'budget_and_resource_allocation',
      'execution_and_implementation',
      'completion_and_celebration'
    ];
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
export const allocateBudget = (milestones, totalBudget) => {
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

/**
 * HYBRID APPROACH - Layer 2: Validates template and customizes it for user's specific dream
 * This is the QUALITY GATE that ensures templates truly serve the user's unique goal
 * @param {Array} templateSequence - Base milestone sequence from template
 * @param {string} goalType - Type of goal
 * @param {string} goalDescription - User's detailed goal description
 * @param {Object} userContext - User context (budget, timeline, preferences)
 * @returns {Promise<Object>} { approved: boolean, customizedSequence: Array, insights: string }
 */
export const validateAndCustomizeTemplate = async (templateSequence, goalType, goalDescription, userContext) => {
  const prompt = `You are a roadmap planning expert helping couples achieve their dreams. Your job is to VALIDATE and CUSTOMIZE a template roadmap to ensure it truly serves their specific goal.

**Template Roadmap (baseline for ${goalType}):**
${templateSequence.map((m, i) => `${i + 1}. ${m}`).join('\n')}

**User's Dream Goal:**
"${goalDescription}"

**User Context:**
- Budget: ${userContext.budget ? `$${userContext.budget.amount}` : 'Not specified'}
- Timeline: ${userContext.timeline?.text || 'Not specified'}
- Location: ${userContext.location?.text || 'Not specified'}
- Preferences: ${userContext.preferences?.map(p => p.value).join(', ') || 'None'}
- Constraints: ${userContext.constraints?.map(c => c.type).join(', ') || 'None'}

**Your Task:**
1. **VALIDATE**: Does this template make sense for their SPECIFIC dream?
   - If template has GENERIC steps like "goal_definition_and_research", "comprehensive_planning", "execution_and_implementation" → REJECT and create custom sequence
   - For real goals (buying apartment, wedding, etc.) → use SPECIFIC templates
   - Look for mismatches and missing critical steps

2. **CUSTOMIZE**: Create a journey roadmap with SPECIFIC, ACTIONABLE stages:
   - For "buying apartment": financial assessment → mortgage pre-approval → property search → offer → inspection → closing → moving
   - For "wedding": engagement → venue → vendors → invitations → ceremony → reception → post-wedding
   - Each milestone should be a STAGE in their journey, not generic planning phases
   - Use snake_case naming (e.g., "mortgage_preapproval" NOT "financial_planning")

3. **INSIGHTS**: Explain key customizations (1-2 sentences)

**CRITICAL RULES:**
- Between 6-14 milestones (comprehensive journey stages)
- Each milestone = ONE stage in their journey from start to completion
- NO generic phases like "planning", "execution", "review"
- YES to journey stages like "credit_score_improvement", "property_tours", "offer_negotiation"
- Maintain logical dependencies and sequence
- Use snake_case naming always

**Return Format (JSON only):**
{
  "approved": true/false,  // false if template is generic/doesn't fit, true if good template with tweaks
  "customizedSequence": ["milestone_1", "milestone_2", ...],
  "insights": "Brief explanation of key customizations"
}

Return ONLY valid JSON, nothing else.`;

  try {
    const responseText = await callClaudeGenerate(prompt, {
      maxTokens: 2048,
      temperature: 0.7
    });

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }

    const validation = JSON.parse(jsonText);

    // Validate the response structure
    if (!validation.customizedSequence || !Array.isArray(validation.customizedSequence)) {
      console.warn('Claude validation returned invalid structure, using template');
      return {
        approved: false,
        customizedSequence: templateSequence,
        insights: 'Validation failed - using template as-is'
      };
    }

    // Validate sequence length
    if (validation.customizedSequence.length < 3 || validation.customizedSequence.length > 20) {
      console.warn('Claude validation produced invalid sequence length, using template');
      return {
        approved: false,
        customizedSequence: templateSequence,
        insights: 'Validation failed - sequence length invalid'
      };
    }

    // Validate all items are strings
    if (!validation.customizedSequence.every(item => typeof item === 'string')) {
      console.warn('Claude validation produced non-string items, using template');
      return {
        approved: false,
        customizedSequence: templateSequence,
        insights: 'Validation failed - invalid milestone format'
      };
    }

    return {
      approved: validation.approved !== false, // Default to true if not specified
      customizedSequence: validation.customizedSequence,
      insights: validation.insights || 'Template validated and customized for your specific goal'
    };
  } catch (error) {
    console.error('Error validating template with Claude:', error);
    throw error;
  }
};

/**
 * LEGACY - Layer 2: Refines a template sequence using Claude
 * @deprecated Use validateAndCustomizeTemplate instead for better quality
 * @param {Array} templateSequence - Base milestone sequence from template
 * @param {string} goalType - Type of goal
 * @param {string} goalDescription - User's detailed goal description
 * @param {Object} userContext - User context (budget, timeline, preferences)
 * @returns {Promise<Array>} Refined milestone sequence
 */
export const refineSequenceWithClaude = async (templateSequence, goalType, goalDescription, userContext) => {
  const prompt = `You are a roadmap planning expert. Your task is to refine a template milestone sequence to better match the user's specific goal.

**Template Sequence (baseline):**
${templateSequence.map((m, i) => `${i + 1}. ${m}`).join('\n')}

**User's Goal:**
${goalDescription}

**Additional Context:**
- Budget: ${userContext.budget ? `$${userContext.budget.amount}` : 'Not specified'}
- Timeline: ${userContext.timeline?.text || 'Not specified'}
- Location: ${userContext.location?.text || 'Not specified'}
- Preferences: ${userContext.preferences?.map(p => p.value).join(', ') || 'None'}
- Constraints: ${userContext.constraints?.map(c => c.type).join(', ') || 'None'}

**Your Task:**
1. Review the template sequence
2. Adapt it to the user's specific goal description and context
3. Add, remove, or reorder milestones as needed
4. Keep milestone names in snake_case format (e.g., "visa_immigration", "job_search")
5. Return ONLY the refined milestone sequence as a JSON array

**Requirements:**
- Between 4-12 milestones
- Each milestone should be specific and actionable
- Maintain logical dependencies (early steps before later steps)
- Consider the user's budget and timeline constraints

Return ONLY a valid JSON array of milestone strings, nothing else.`;

  try {
    const responseText = await callClaudeGenerate(prompt, {
      maxTokens: 1024,
      temperature: 0.7
    });

    // Extract JSON array from response (handle markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }

    const refinedSequence = JSON.parse(jsonText);

    // Validate the refined sequence
    if (!Array.isArray(refinedSequence) || refinedSequence.length < 3 || refinedSequence.length > 15) {
      console.warn('Claude refinement produced invalid sequence length, using template');
      return templateSequence;
    }

    // Validate all items are strings
    if (!refinedSequence.every(item => typeof item === 'string')) {
      console.warn('Claude refinement produced non-string items, using template');
      return templateSequence;
    }

    return refinedSequence;
  } catch (error) {
    console.error('Error refining sequence with Claude:', error);
    throw error;
  }
};

/**
 * HYBRID APPROACH - Layer 3: Generates milestones from scratch using Claude
 * @param {string} goalDescription - User's goal description
 * @param {Object} userContext - User context (budget, timeline, preferences)
 * @returns {Promise<Array>} Generated milestone sequence
 */
export const generateMilestonesWithClaude = async (goalDescription, userContext) => {
  const prompt = `You are a roadmap planning expert. Create a comprehensive JOURNEY roadmap with specific stages from start to completion.

**User's Goal:**
${goalDescription}

**Context:**
- Budget: ${userContext.budget ? `$${userContext.budget.amount}` : 'Not specified'}
- Timeline: ${userContext.timeline?.text || 'Not specified'}
- Location: ${userContext.location?.text || 'Not specified'}
- Preferences: ${userContext.preferences?.map(p => p.value).join(', ') || 'None'}
- Constraints: ${userContext.constraints?.map(c => c.type).join(', ') || 'None'}

**Your Task:**
Create a sequence of JOURNEY STAGES that take the user from START to COMPLETION of their goal.

**Think like this:**
- "Buying an apartment" → [credit_check, savings_plan, mortgage_preapproval, location_research, property_tours, offer_submission, home_inspection, closing_process, moving_preparation]
- "Planning a wedding" → [engagement_announcement, budget_setting, venue_booking, vendor_selection, invitations, ceremony_planning, wedding_day, honeymoon]
- "Starting a business" → [idea_validation, market_research, business_plan, legal_registration, funding, branding, product_development, soft_launch, full_launch]

**CRITICAL RULES:**
- Between 6-12 milestones (complete journey stages)
- Each milestone = ONE specific stage in their journey
- NO generic phases like "planning", "execution", "review", "goal_definition"
- YES to concrete stages like "property_search", "vendor_meetings", "product_testing"
- Use snake_case naming always (e.g., "mortgage_preapproval" NOT "Get Mortgage")
- Maintain logical sequence (can't close on house before finding one)
- Consider budget and timeline in scope

Return ONLY a valid JSON array of milestone strings, nothing else.

Example format:
["milestone_one", "milestone_two", "milestone_three"]`;

  try {
    const responseText = await callClaudeGenerate(prompt, {
      maxTokens: 1024,
      temperature: 0.8 // Higher temperature for more creative generation
    });

    // Extract JSON array from response (handle markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }

    const generatedSequence = JSON.parse(jsonText);

    // Validate the generated sequence
    if (!Array.isArray(generatedSequence) || generatedSequence.length < 3 || generatedSequence.length > 15) {
      throw new Error('Claude generated invalid sequence length');
    }

    // Validate all items are strings
    if (!generatedSequence.every(item => typeof item === 'string')) {
      throw new Error('Claude generated non-string items');
    }

    return generatedSequence;
  } catch (error) {
    console.error('Error generating milestones with Claude:', error);
    throw error;
  }
};

export default {
  generateRoadmap,
  adaptRoadmap,
  determineMilestoneSequence,
  allocateBudget,
  validateAndCustomizeTemplate,
  refineSequenceWithClaude,
  generateMilestonesWithClaude
};
