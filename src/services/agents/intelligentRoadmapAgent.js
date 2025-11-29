/**
 * Intelligent Roadmap Agent (Claude-First Approach)
 *
 * This agent generates roadmaps for ANY goal using Claude as the primary intelligence.
 * Templates are used as reference examples, not strict categories.
 *
 * Philosophy:
 * - Claude understands the user's goal better than hardcoded templates
 * - Templates serve as quality examples, not rigid constraints
 * - Every goal deserves a custom journey, not forced categorization
 */

import { callClaudeGenerate } from '../claudeAPI';

/**
 * Generates a roadmap using Claude with optional template guidance
 * @param {string} goalDescription - User's goal in their own words
 * @param {Object} userContext - Budget, timeline, location, preferences
 * @returns {Promise<Object>} Complete roadmap with milestones
 */
export const generateIntelligentRoadmap = async (goalDescription, userContext) => {
  const prompt = `You are an expert journey planner. Create a comprehensive roadmap for someone's goal.

**User's Goal:**
"${goalDescription}"

**User Context:**
- Budget: ${userContext.budget ? `$${userContext.budget.amount}` : 'Not specified'}
- Timeline: ${userContext.timeline?.text || 'Not specified'}
- Location: ${userContext.location?.text || 'Not specified'}
- Preferences: ${userContext.preferences?.map(p => p.value).join(', ') || 'None'}
- Constraints: ${userContext.constraints?.map(c => c.type).join(', ') || 'None'}

**Your Task:**
Create a journey roadmap that takes them from START to COMPLETION of their goal.
Think about the logical stages they need to go through.

**Examples of Good Roadmaps:**

For "Buy an apartment in Berlin":
1. financial_health_check
2. savings_and_down_payment_plan
3. mortgage_preapproval
4. location_and_neighborhood_research
5. property_search_and_tours
6. offer_and_negotiation
7. home_inspection_and_due_diligence
8. closing_and_legal_process
9. moving_and_setup

For "Learn to play guitar":
1. instrument_selection_and_purchase
2. find_teacher_or_online_course
3. master_basic_chords_and_strumming
4. learn_music_theory_basics
5. practice_simple_songs
6. develop_fingerpicking_technique
7. learn_intermediate_songs
8. perform_for_friends_or_open_mic

For "Start a bakery business":
1. market_research_and_niche_identification
2. develop_signature_recipes
3. business_plan_and_financial_projections
4. legal_registration_and_permits
5. secure_funding_or_investment
6. find_and_lease_commercial_space
7. purchase_equipment_and_supplies
8. hire_and_train_staff
9. soft_launch_with_friends_and_family
10. grand_opening_and_marketing_campaign
11. build_customer_base_and_optimize

**Guidelines:**
- Create 6-12 milestones (adjust based on goal complexity and timeline)
- Each milestone = ONE concrete stage in their journey
- Use snake_case naming (e.g., "find_apartment" not "Finding Apartment")
- Think about dependencies (can't do X before Y)
- Consider their budget and timeline
- Be specific to THEIR goal, not generic
- NO generic phases like "planning", "execution", "completion"
- YES to concrete actions like "property_search", "recipe_testing", "equipment_purchase"

**Return Format (JSON only):**
{
  "goal_category": "short category label (e.g., real_estate_purchase, skill_learning, business_launch)",
  "milestones": [
    {
      "id": "milestone_1",
      "title": "Human readable title",
      "description": "Brief description of what happens in this stage",
      "estimated_duration": "2-4 weeks",
      "estimated_cost": 5000,
      "key_actions": ["Action 1", "Action 2", "Action 3"]
    },
    ...
  ],
  "total_estimated_duration": "6-9 months",
  "total_estimated_cost": 50000,
  "success_factors": ["Factor 1", "Factor 2", "Factor 3"],
  "common_pitfalls": ["Pitfall 1", "Pitfall 2"]
}

Return ONLY valid JSON, nothing else.`;

  try {
    const responseText = await callClaudeGenerate(prompt, {
      maxTokens: 4096,
      temperature: 0.7
    });

    // Extract JSON from response
    let jsonText = responseText.trim();
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }

    const roadmap = JSON.parse(jsonText);

    // Validate the response structure
    if (!roadmap.milestones || !Array.isArray(roadmap.milestones)) {
      throw new Error('Invalid roadmap structure: missing milestones array');
    }

    if (roadmap.milestones.length < 3 || roadmap.milestones.length > 20) {
      throw new Error(`Invalid roadmap length: ${roadmap.milestones.length} milestones`);
    }

    // Add metadata
    roadmap.metadata = {
      generatedAt: new Date().toISOString(),
      generationMethod: 'claude_intelligent',
      model: 'claude-haiku-4-5',
      userGoal: goalDescription,
      location: userContext.location?.text,
      confidence: calculateConfidenceScore(userContext, roadmap)
    };

    return roadmap;
  } catch (error) {
    console.error('Error generating intelligent roadmap:', error);
    throw error;
  }
};

/**
 * Calculate confidence score based on context completeness and roadmap quality
 */
const calculateConfidenceScore = (userContext, roadmap) => {
  let score = 0;
  const weights = {
    budget: 0.2,
    timeline: 0.2,
    location: 0.15,
    preferences: 0.15,
    milestoneCount: 0.15,
    detailLevel: 0.15
  };

  // Context completeness
  if (userContext.budget) score += weights.budget;
  if (userContext.timeline) score += weights.timeline;
  if (userContext.location) score += weights.location;
  if (userContext.preferences && userContext.preferences.length > 0) {
    score += weights.preferences;
  }

  // Roadmap quality indicators
  if (roadmap.milestones.length >= 6 && roadmap.milestones.length <= 12) {
    score += weights.milestoneCount;
  } else if (roadmap.milestones.length >= 4) {
    score += weights.milestoneCount * 0.7;
  }

  // Check detail level (milestones have descriptions and actions)
  const hasGoodDetail = roadmap.milestones.every(m =>
    m.description && m.key_actions && m.key_actions.length > 0
  );
  if (hasGoodDetail) score += weights.detailLevel;

  return Math.min(score, 1.0);
};

/**
 * Generates a quick roadmap using template matching (fallback)
 * This is used when Claude is unavailable or for faster generation
 */
export const generateTemplateBasedRoadmap = (goalDescription, userContext) => {
  // Use simple keyword matching to suggest a template
  const keywords = goalDescription.toLowerCase();

  let templateMilestones = [];
  let category = 'general_goal';

  if (keywords.includes('apartment') || keywords.includes('house') || keywords.includes('home') || keywords.includes('property')) {
    category = 'real_estate_purchase';
    templateMilestones = [
      'financial_assessment',
      'mortgage_preapproval',
      'property_search',
      'offer_and_negotiation',
      'inspection_and_due_diligence',
      'closing_process',
      'moving_and_setup'
    ];
  } else if (keywords.includes('wedding') || keywords.includes('marry') || keywords.includes('ceremony')) {
    category = 'wedding_planning';
    templateMilestones = [
      'venue_selection',
      'vendor_booking',
      'invitations_and_rsvp',
      'ceremony_planning',
      'reception_planning',
      'final_preparations',
      'wedding_day'
    ];
  } else if (keywords.includes('business') || keywords.includes('startup') || keywords.includes('company')) {
    category = 'business_launch';
    templateMilestones = [
      'idea_validation',
      'business_plan',
      'legal_setup',
      'funding',
      'product_development',
      'marketing_and_branding',
      'launch'
    ];
  } else if (keywords.includes('learn') || keywords.includes('skill') || keywords.includes('study')) {
    category = 'skill_development';
    templateMilestones = [
      'goal_definition',
      'resource_gathering',
      'foundational_learning',
      'practice_and_application',
      'intermediate_mastery',
      'real_world_application'
    ];
  } else {
    // Generic but better than nothing
    templateMilestones = [
      'goal_clarification_and_research',
      'planning_and_preparation',
      'initial_execution',
      'progress_and_adjustment',
      'completion_and_celebration'
    ];
  }

  // Convert to proper milestone format
  const milestones = templateMilestones.map((id, index) => {
    const title = id.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    return {
      id: `milestone_${index + 1}`,
      title,
      description: `Complete ${title.toLowerCase()} for your goal`,
      estimated_duration: '2-4 weeks',
      estimated_cost: (userContext.budget?.amount || 10000) / templateMilestones.length,
      key_actions: []
    };
  });

  return {
    goal_category: category,
    milestones,
    total_estimated_duration: `${templateMilestones.length * 2}-${templateMilestones.length * 4} weeks`,
    total_estimated_cost: userContext.budget?.amount || 10000,
    success_factors: [],
    common_pitfalls: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      generationMethod: 'template_matching',
      userGoal: goalDescription,
      location: userContext.location?.text,
      confidence: 0.5 // Lower confidence for template matching
    }
  };
};

export default {
  generateIntelligentRoadmap,
  generateTemplateBasedRoadmap
};
