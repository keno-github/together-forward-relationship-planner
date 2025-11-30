/**
 * Luna Goal Service - Generates intelligent milestones for custom goals
 *
 * When a user creates a custom goal with Luna's help, this service:
 * 1. Takes the form data (title, category, budget, duration, details)
 * 2. Calls Claude API to generate personalized tasks and milestones
 * 3. Returns an enhanced goal with intelligent content
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Generate intelligent milestones for a custom goal using Luna/Claude
 * @param {Object} goalData - The custom goal form data
 * @returns {Promise<Object>} Enhanced goal with intelligent tasks and milestones
 */
export const generateIntelligentMilestones = async (goalData) => {
  const { title, category, estimatedCost, duration, details, customDetails } = goalData;
  // Use customDetails if details is not present (from CustomGoalCreator)
  const goalDetails = details || customDetails;

  console.log('🧠 Luna: Generating intelligent milestones for:', title);

  const systemPrompt = `You are Luna, an AI planning advisor. Return ONLY valid JSON, no markdown.`;

  // Calculate budget per phase if provided
  const budget = estimatedCost ? parseInt(estimatedCost) : 0;

  // Truncate details to prevent overly long prompts
  const truncatedDetails = goalDetails ? goalDetails.substring(0, 200) : 'None';

  const userPrompt = `Create a roadmap for: "${title}"
Category: ${category || 'General'}
Budget: €${budget || 0}
Timeline: ${duration || 'Flexible'}
Details: ${truncatedDetails}

Return JSON (NO markdown, NO explanation):
{
  "description": "One sentence about this goal",
  "roadmapPhases": [
    {"title": "Phase 1: [Name]", "description": "Brief desc", "isCriticalPath": true, "isUnlocked": true, "duration": "X weeks", "estimatedCost": [amount], "smartTips": ["Tip 1", "Tip 2"]},
    // Add more phases as needed for this specific goal
  ],
  "expertTips": ["Tip 1", "Tip 2", "Tip 3"]
}

RULES:
- Generate as many phases as makes sense for "${title}" (typically 3-8 phases)
- Simple goals need fewer phases, complex goals need more
- Replace [Name] with goal-specific phase names (NOT generic like "Planning & Research")
- Phase titles must be specific to "${title}"
- Distribute the budget (€${budget || 0}) logically across phases
- Each smartTips array has exactly 2 short tips (max 10 words each)
- Keep descriptions under 15 words
- Return ONLY the JSON object`;

  console.log('📝 Prompt length:', userPrompt.length, 'chars');
  console.log('📝 User prompt preview:', userPrompt.substring(0, 300));

  try {
    const response = await fetch(`${BACKEND_URL}/api/claude-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: userPrompt,
        systemPrompt: systemPrompt,
        maxTokens: 2500,  // Increased to ensure full 5-phase response
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate milestones');
    }

    const data = await response.json();

    console.log('🔍 Raw API response:', data);
    console.log('🔍 Response content type:', typeof data.content);
    console.log('🔍 Response content preview:', data.content?.substring(0, 500));

    // Parse the JSON response
    let generatedContent;
    try {
      let contentToParse = data.content;

      // Remove markdown code blocks if present (```json ... ```)
      if (contentToParse.includes('```')) {
        console.log('🔍 Removing markdown code blocks from response');
        contentToParse = contentToParse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }

      // Try to extract JSON from the response
      const jsonMatch = contentToParse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('🔍 JSON match found, length:', jsonMatch[0].length);
        generatedContent = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed JSON');
        console.log('✅ Parsed roadmapPhases:', generatedContent.roadmapPhases?.length || 0);
        console.log('✅ Parsed detailedSteps:', generatedContent.detailedSteps?.length || 0);
      } else {
        console.error('❌ NO JSON MATCH FOUND IN RESPONSE');
        console.error('Full response content:', data.content);
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Error parsing Luna response:', parseError);
      console.error('Response length:', data.content?.length);
      console.error('Error position:', parseError.message);

      // Check if response was truncated
      if (data.content?.length > 3000 && parseError.message.includes('position')) {
        console.error('⚠️ RESPONSE WAS TRUNCATED - JSON incomplete');
        console.error('Last 200 chars:', data.content.slice(-200));
      }

      // Return fallback structure
      console.warn('⚠️ USING FALLBACK - Luna API call failed or returned invalid JSON');
      return createFallbackMilestones(goalData);
    }

    console.log('✅ Luna: Generated intelligent milestones');
    console.log('📊 roadmapPhases:', generatedContent.roadmapPhases?.length || 0, 'phases');
    console.log('📝 detailedSteps:', generatedContent.detailedSteps?.length || 0, 'steps');

    // Validate we got the critical data
    if (!generatedContent.roadmapPhases || generatedContent.roadmapPhases.length === 0) {
      console.error('⚠️ No roadmapPhases in generated content! Using fallback.');
      return createFallbackMilestones(goalData);
    }

    console.log('🎉 SUCCESS! Using Luna\'s intelligent roadmap (NOT fallback)');

    // Generate detailedSteps from roadmapPhases for TimelineView
    const detailedSteps = generatedContent.roadmapPhases.map((phase, index) => ({
      step: index + 1,
      title: phase.title.replace(/^Phase \d+:\s*/, ''),
      description: phase.description,
      difficulty: index === 0 ? 'easy' : index < 3 ? 'medium' : 'hard',
      duration: phase.duration,
      completed: false,
      actionItems: phase.smartTips || [],
      considerations: ['Stay focused on this phase before moving to the next'],
      resources: ['Luna AI assistance available']
    }));

    // Generate tasks from phases
    const tasks = generatedContent.roadmapPhases.map((phase, index) => ({
      id: index + 1,
      title: phase.title.replace(/^Phase \d+:\s*/, ''),
      phase: index === 0 ? 'Planning' : index === 1 ? 'Preparation' : index === 2 ? 'Execution' : 'Completion',
      estimatedWeeks: parseInt(phase.duration) || 4,
      priority: index < 2 ? 'high' : 'medium',
      completed: false,
      aiGenerated: true
    }));

    // Build enhanced goal with Luna's content
    return {
      ...goalData,
      description: generatedContent.description || goalData.description,
      roadmapPhases: generatedContent.roadmapPhases || [],
      detailedSteps: detailedSteps,
      tasks: tasks,
      milestones: [],
      expertTips: generatedContent.expertTips || [],
      challenges: [
        { challenge: 'Staying on track', solution: 'Review progress weekly with your partner' },
        { challenge: 'Budget constraints', solution: 'Prioritize phases and adjust as needed' }
      ],
      successMetrics: ['Phase completion', 'Budget adherence', 'Timeline progress'],
      budgetBreakdown: generatedContent.roadmapPhases.map(phase => ({
        category: phase.title.replace(/^Phase \d+:\s*/, ''),
        percentage: Math.round((phase.estimatedCost / budget) * 100) || 25,
        notes: phase.description
      })),
      lunaEnhanced: true,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error generating milestones:', error);
    return createFallbackMilestones(goalData);
  }
};

/**
 * Create fallback milestones when API fails
 */
const createFallbackMilestones = (goalData) => {
  const { title, category, duration } = goalData;

  // Generate basic tasks based on category
  const categoryTasks = {
    'business': [
      'Research market and competition',
      'Create business plan',
      'Set up legal structure',
      'Build initial product/service',
      'Launch marketing campaign',
      'Get first customers'
    ],
    'travel': [
      'Research destinations',
      'Set travel budget',
      'Book flights and accommodation',
      'Plan itinerary',
      'Prepare documents (passport, visa)',
      'Pack and prepare'
    ],
    'health': [
      'Set specific health goals',
      'Create workout schedule',
      'Plan nutrition strategy',
      'Track progress weekly',
      'Adjust plan as needed',
      'Celebrate milestones'
    ],
    'financial': [
      'Assess current financial situation',
      'Set specific savings targets',
      'Create budget plan',
      'Set up automatic savings',
      'Review and adjust monthly',
      'Reach savings goal'
    ],
    'home': [
      'Define requirements and budget',
      'Research options and locations',
      'View properties/get quotes',
      'Make decision and negotiate',
      'Complete paperwork',
      'Move in / complete project'
    ],
    'default': [
      'Define clear objectives',
      'Research and plan approach',
      'Gather resources needed',
      'Start implementation',
      'Review progress regularly',
      'Complete and celebrate'
    ]
  };

  const tasks = (categoryTasks[category] || categoryTasks['default']).map((task, index) => ({
    id: index + 1,
    title: task,
    phase: index < 2 ? 'Planning' : index < 4 ? 'Execution' : 'Completion',
    completed: false,
    aiGenerated: true
  }));

  // Generate detailedSteps in the correct format (individual steps, not phases)
  const allTasks = categoryTasks[category] || categoryTasks['default'];
  const detailedSteps = allTasks.map((taskTitle, index) => ({
    step: index + 1,
    title: taskTitle,
    description: `Complete this important step: ${taskTitle}`,
    difficulty: index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard',
    duration: index < 2 ? '1-2 weeks' : index < 4 ? '2-4 weeks' : '4-8 weeks',
    completed: false,
    actionItems: [
      `Start working on ${taskTitle.toLowerCase()}`,
      `Research best practices`,
      `Track progress regularly`
    ],
    considerations: [
      'Plan ahead and set realistic timelines',
      'Budget appropriately for this step'
    ],
    resources: ['Online guides', 'Expert consultations', 'Community support']
  }));

  // Generate roadmapPhases (5 high-level phases for consistency)
  const totalBudget = goalData.estimatedCost || 0;
  const roadmapPhases = [
    {
      title: 'Phase 1: Planning & Research',
      description: 'Define your objectives, research options, and create a detailed plan',
      isCriticalPath: true,
      isUnlocked: true,
      duration: '1-2 weeks',
      estimatedCost: Math.round(totalBudget * 0.10),
      smartTips: [
        'Start with clear, measurable objectives',
        'Research thoroughly before making decisions'
      ]
    },
    {
      title: 'Phase 2: Preparation',
      description: 'Gather resources, set up systems, and prepare for execution',
      isCriticalPath: true,
      isUnlocked: true,
      duration: '2-3 weeks',
      estimatedCost: Math.round(totalBudget * 0.20),
      smartTips: [
        'Organize all necessary resources in advance',
        'Set up tracking systems early'
      ]
    },
    {
      title: 'Phase 3: Initial Execution',
      description: 'Begin implementing your plan with initial actions',
      isCriticalPath: true,
      isUnlocked: true,
      duration: '3-4 weeks',
      estimatedCost: Math.round(totalBudget * 0.25),
      smartTips: [
        'Focus on one task at a time',
        'Track progress regularly'
      ]
    },
    {
      title: 'Phase 4: Core Execution',
      description: 'Complete the main milestones and achieve key objectives',
      isCriticalPath: true,
      isUnlocked: true,
      duration: '4-6 weeks',
      estimatedCost: Math.round(totalBudget * 0.30),
      smartTips: [
        'Stay focused on priority items',
        'Adjust your approach as needed'
      ]
    },
    {
      title: 'Phase 5: Completion & Review',
      description: 'Finalize details, review results, and celebrate your achievement',
      isCriticalPath: true,
      isUnlocked: true,
      duration: '1-2 weeks',
      estimatedCost: Math.round(totalBudget * 0.15),
      smartTips: [
        'Review what worked well',
        'Celebrate your accomplishment together'
      ]
    }
  ];

  console.warn('⚠️⚠️⚠️ FALLBACK ROADMAP - Using generic template, NOT Luna intelligence! ⚠️⚠️⚠️');
  console.log('📊 Generic roadmapPhases:', roadmapPhases.length, 'phases');
  console.log('📝 Generic detailedSteps:', detailedSteps.length, 'steps');

  return {
    ...goalData,
    description: `Your custom goal: ${title}. This roadmap will help you achieve this step by step.`,
    roadmapPhases,
    detailedSteps,
    tasks,
    expertTips: [
      'Break large tasks into smaller, manageable steps',
      'Set regular check-in points to track progress',
      'Celebrate small wins along the way'
    ],
    challenges: [
      { challenge: 'Staying motivated over time', solution: 'Set milestone rewards and track visible progress' },
      { challenge: 'Unexpected obstacles', solution: 'Build buffer time and budget into your plan' }
    ],
    successMetrics: [
      'Tasks completed on schedule',
      'Budget adherence',
      'Overall goal achievement'
    ],
    lunaEnhanced: false,
    generatedAt: new Date().toISOString()
  };
};

export default {
  generateIntelligentMilestones
};
