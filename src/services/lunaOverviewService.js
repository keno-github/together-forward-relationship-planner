/**
 * Luna Overview Service
 *
 * Handles Luna AI chat in the Goal Overview section.
 * Provides tools for Luna to propose modifications to:
 * - Budget
 * - Target date
 * - Roadmap phases (add, modify, remove)
 * - Tasks (add, update, delete)
 * - Full roadmap regeneration
 *
 * All tools return PROPOSED changes (pending confirmation).
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Tool definitions for Luna Overview Chat
 * These tools allow Luna to propose changes (not apply directly)
 */
export const LUNA_OVERVIEW_TOOLS = [
  {
    name: "propose_title_update",
    description: "Propose changing the milestone/goal title. Use when the user wants to change their goal focus.",
    input_schema: {
      type: "object",
      properties: {
        new_title: {
          type: "string",
          description: "The new title for the milestone/goal"
        },
        reason: {
          type: "string",
          description: "Brief explanation for the title change"
        }
      },
      required: ["new_title", "reason"]
    }
  },
  {
    name: "propose_description_update",
    description: "Propose changing the milestone/goal description. Use when the description is outdated, incorrect, or needs to be updated to match the current goal focus.",
    input_schema: {
      type: "object",
      properties: {
        new_description: {
          type: "string",
          description: "The new description for the milestone/goal"
        },
        reason: {
          type: "string",
          description: "Brief explanation for the description change"
        }
      },
      required: ["new_description", "reason"]
    }
  },
  {
    name: "propose_budget_update",
    description: "Propose changing the milestone budget. Returns a pending change for user confirmation.",
    input_schema: {
      type: "object",
      properties: {
        new_budget: {
          type: "number",
          description: "The new budget amount"
        },
        reason: {
          type: "string",
          description: "Brief explanation for the budget change"
        }
      },
      required: ["new_budget", "reason"]
    }
  },
  {
    name: "propose_target_date_update",
    description: "Propose changing the target completion date. Returns a pending change for user confirmation.",
    input_schema: {
      type: "object",
      properties: {
        new_date: {
          type: "string",
          description: "The new target date in YYYY-MM-DD format"
        },
        reason: {
          type: "string",
          description: "Brief explanation for the date change"
        }
      },
      required: ["new_date", "reason"]
    }
  },
  {
    name: "propose_add_phase",
    description: "Propose adding a new phase to the roadmap. Returns a pending change for user confirmation.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the new phase"
        },
        description: {
          type: "string",
          description: "Description of what this phase involves"
        },
        duration: {
          type: "string",
          description: "Estimated duration (e.g., '2-3 weeks')"
        },
        estimated_cost: {
          type: "number",
          description: "Estimated cost for this phase"
        },
        position: {
          type: "number",
          description: "Position in the roadmap (0-indexed). If not specified, adds at end."
        },
        reason: {
          type: "string",
          description: "Why this phase should be added"
        }
      },
      required: ["title", "description", "reason"]
    }
  },
  {
    name: "propose_modify_phase",
    description: "Propose modifying an existing roadmap phase. Returns a pending change for user confirmation.",
    input_schema: {
      type: "object",
      properties: {
        phase_index: {
          type: "number",
          description: "Index of the phase to modify (0-indexed)"
        },
        updates: {
          type: "object",
          description: "Object containing fields to update (title, description, duration, estimated_cost)",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            duration: { type: "string" },
            estimated_cost: { type: "number" }
          }
        },
        reason: {
          type: "string",
          description: "Why this phase should be modified"
        }
      },
      required: ["phase_index", "updates", "reason"]
    }
  },
  {
    name: "propose_remove_phase",
    description: "Propose removing a roadmap phase. Returns a pending change for user confirmation.",
    input_schema: {
      type: "object",
      properties: {
        phase_index: {
          type: "number",
          description: "Index of the phase to remove (0-indexed)"
        },
        reason: {
          type: "string",
          description: "Why this phase should be removed"
        }
      },
      required: ["phase_index", "reason"]
    }
  },
  {
    name: "propose_add_task",
    description: "Propose adding a new task. Returns a pending change for user confirmation.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the task"
        },
        description: {
          type: "string",
          description: "Description of the task"
        },
        phase_index: {
          type: "number",
          description: "Index of the roadmap phase this task belongs to (optional)"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Task priority"
        },
        assigned_to: {
          type: "string",
          description: "Partner name to assign to (optional)"
        },
        reason: {
          type: "string",
          description: "Why this task should be added"
        }
      },
      required: ["title", "reason"]
    }
  },
  {
    name: "propose_update_task",
    description: "Propose updating an existing task. Returns a pending change for user confirmation.",
    input_schema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "ID of the task to update"
        },
        updates: {
          type: "object",
          description: "Fields to update",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "string" },
            assigned_to: { type: "string" },
            completed: { type: "boolean" }
          }
        },
        reason: {
          type: "string",
          description: "Why this task should be updated"
        }
      },
      required: ["task_id", "updates", "reason"]
    }
  },
  {
    name: "propose_delete_task",
    description: "Propose deleting a task. Returns a pending change for user confirmation.",
    input_schema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "ID of the task to delete"
        },
        reason: {
          type: "string",
          description: "Why this task should be deleted"
        }
      },
      required: ["task_id", "reason"]
    }
  },
  {
    name: "propose_regenerate_roadmap",
    description: "Propose completely regenerating the roadmap with new parameters. Use when the goal focus changes significantly (e.g., CFA 3 to CFA 1). This will update the title AND generate a completely new roadmap.",
    input_schema: {
      type: "object",
      properties: {
        new_title: {
          type: "string",
          description: "New title for the goal (e.g., 'Get CFA Level 1')"
        },
        new_budget: {
          type: "number",
          description: "New total budget (optional)"
        },
        new_timeline_months: {
          type: "number",
          description: "New timeline in months (optional)"
        },
        focus_areas: {
          type: "array",
          items: { type: "string" },
          description: "Areas to focus on in the new roadmap"
        },
        reason: {
          type: "string",
          description: "Why the roadmap should be regenerated"
        }
      },
      required: ["new_title", "reason"]
    }
  }
];

/**
 * Generate ID for pending changes
 */
const generateChangeId = () => `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Tool handlers that create pending change objects
 * Each handler returns a pending change (not a direct update)
 */
export const toolHandlers = {
  propose_title_update: (input, context) => {
    const { milestone } = context;
    const currentTitle = milestone.title || 'Untitled Goal';

    return {
      id: generateChangeId(),
      type: 'title_update',
      status: 'pending',
      icon: '✏️',
      summary: `Title: "${currentTitle}" → "${input.new_title}"`,
      details: {
        current: currentTitle,
        proposed: input.new_title
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        // Update both the milestone title AND the parent roadmap title
        const milestoneResult = await supabaseService.updateMilestone(milestone.id, {
          title: input.new_title
        });

        // Also update the roadmap title if we have the roadmap_id
        if (milestone.roadmap_id) {
          const { updateRoadmap } = await import('./supabaseService');
          await updateRoadmap(milestone.roadmap_id, {
            title: input.new_title
          });
        }

        return milestoneResult;
      }
    };
  },

  propose_description_update: (input, context) => {
    const { milestone } = context;
    const currentDescription = milestone.description || 'No description';
    const truncatedCurrent = currentDescription.length > 50
      ? currentDescription.substring(0, 50) + '...'
      : currentDescription;
    const truncatedNew = input.new_description.length > 50
      ? input.new_description.substring(0, 50) + '...'
      : input.new_description;

    return {
      id: generateChangeId(),
      type: 'description_update',
      status: 'pending',
      icon: '📝',
      summary: `Description: "${truncatedCurrent}" → "${truncatedNew}"`,
      details: {
        current: currentDescription,
        proposed: input.new_description
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        // Update both the milestone description AND the parent roadmap description
        const milestoneResult = await supabaseService.updateMilestone(milestone.id, {
          description: input.new_description
        });

        // Also update the roadmap description if we have the roadmap_id
        if (milestone.roadmap_id) {
          const { updateRoadmap } = await import('./supabaseService');
          await updateRoadmap(milestone.roadmap_id, {
            description: input.new_description
          });
        }

        return milestoneResult;
      }
    };
  },

  propose_budget_update: (input, context) => {
    const { milestone } = context;
    const currentBudget = milestone.budget_amount || milestone.estimatedCost || 0;

    return {
      id: generateChangeId(),
      type: 'budget_update',
      status: 'pending',
      icon: '💰',
      summary: `Budget: €${currentBudget.toLocaleString()} → €${input.new_budget.toLocaleString()}`,
      details: {
        current: currentBudget,
        proposed: input.new_budget,
        difference: input.new_budget - currentBudget
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        return await supabaseService.updateMilestone(milestone.id, {
          budget_amount: input.new_budget
        });
      }
    };
  },

  propose_target_date_update: (input, context) => {
    const { milestone } = context;
    const currentDate = milestone.target_date;
    const formattedCurrent = currentDate
      ? new Date(currentDate).toLocaleDateString()
      : 'Not set';
    const formattedNew = new Date(input.new_date).toLocaleDateString();

    return {
      id: generateChangeId(),
      type: 'date_update',
      status: 'pending',
      icon: '📅',
      summary: `Target Date: ${formattedCurrent} → ${formattedNew}`,
      details: {
        current: currentDate,
        proposed: input.new_date
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        return await supabaseService.updateMilestone(milestone.id, {
          target_date: input.new_date
        });
      }
    };
  },

  propose_add_phase: (input, context) => {
    const { milestone } = context;
    const phases = milestone.deep_dive_data?.roadmapPhases || [];
    const position = input.position !== undefined ? input.position : phases.length;

    const newPhase = {
      title: input.title,
      description: input.description,
      duration: input.duration || '1-2 weeks',
      estimatedCost: input.estimated_cost || 0,
      tasks: [],
      isUnlocked: position === 0,
      isCriticalPath: false
    };

    return {
      id: generateChangeId(),
      type: 'add_phase',
      status: 'pending',
      icon: '➕',
      summary: `Add Phase: "${input.title}" at position ${position + 1}`,
      details: {
        newPhase,
        position
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        const updatedPhases = [...phases];
        updatedPhases.splice(position, 0, newPhase);

        const currentDeepDive = milestone.deep_dive_data || {};
        return await supabaseService.updateMilestone(milestone.id, {
          deep_dive_data: {
            ...currentDeepDive,
            roadmapPhases: updatedPhases
          }
        });
      }
    };
  },

  propose_modify_phase: (input, context) => {
    const { milestone } = context;
    const phases = milestone.deep_dive_data?.roadmapPhases || [];
    const currentPhase = phases[input.phase_index];

    if (!currentPhase) {
      return {
        id: generateChangeId(),
        type: 'error',
        status: 'error',
        icon: '❌',
        summary: `Phase at index ${input.phase_index} not found`,
        reason: input.reason,
        applyFn: async () => {
          throw new Error(`Cannot modify: Phase at index ${input.phase_index} does not exist`);
        }
      };
    }

    return {
      id: generateChangeId(),
      type: 'modify_phase',
      status: 'pending',
      icon: '✏️',
      summary: `Modify Phase: "${currentPhase.title}"`,
      details: {
        phaseIndex: input.phase_index,
        currentPhase,
        updates: input.updates
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        const updatedPhases = [...phases];
        updatedPhases[input.phase_index] = {
          ...currentPhase,
          ...input.updates
        };

        const currentDeepDive = milestone.deep_dive_data || {};
        return await supabaseService.updateMilestone(milestone.id, {
          deep_dive_data: {
            ...currentDeepDive,
            roadmapPhases: updatedPhases
          }
        });
      }
    };
  },

  propose_remove_phase: (input, context) => {
    const { milestone } = context;
    const phases = milestone.deep_dive_data?.roadmapPhases || [];
    const phaseToRemove = phases[input.phase_index];

    if (!phaseToRemove) {
      return {
        id: generateChangeId(),
        type: 'error',
        status: 'error',
        icon: '❌',
        summary: `Phase at index ${input.phase_index} not found`,
        reason: input.reason,
        applyFn: async () => {
          throw new Error(`Cannot remove: Phase at index ${input.phase_index} does not exist`);
        }
      };
    }

    return {
      id: generateChangeId(),
      type: 'remove_phase',
      status: 'pending',
      icon: '🗑️',
      summary: `Remove Phase: "${phaseToRemove.title}"`,
      details: {
        phaseIndex: input.phase_index,
        phaseToRemove
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        const updatedPhases = phases.filter((_, idx) => idx !== input.phase_index);

        const currentDeepDive = milestone.deep_dive_data || {};
        return await supabaseService.updateMilestone(milestone.id, {
          deep_dive_data: {
            ...currentDeepDive,
            roadmapPhases: updatedPhases
          }
        });
      }
    };
  },

  propose_add_task: (input, context) => {
    const { milestone } = context;

    const newTask = {
      title: input.title,
      description: input.description || '',
      priority: input.priority || 'medium',
      assigned_to: input.assigned_to || null,
      roadmap_phase_index: input.phase_index,
      completed: false,
      ai_generated: true
    };

    return {
      id: generateChangeId(),
      type: 'add_task',
      status: 'pending',
      icon: '✅',
      summary: `Add Task: "${input.title}"`,
      details: {
        newTask,
        phaseIndex: input.phase_index
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        return await supabaseService.createTask({
          ...newTask,
          milestone_id: milestone.id
        });
      }
    };
  },

  propose_update_task: (input, context) => {
    const { tasks } = context;
    const currentTask = tasks?.find(t => t.id === input.task_id);

    if (!currentTask) {
      return {
        id: generateChangeId(),
        type: 'error',
        status: 'error',
        icon: '❌',
        summary: `Task with ID ${input.task_id} not found`,
        reason: input.reason,
        applyFn: async () => {
          throw new Error(`Cannot update: Task with ID ${input.task_id} does not exist`);
        }
      };
    }

    return {
      id: generateChangeId(),
      type: 'update_task',
      status: 'pending',
      icon: '✏️',
      summary: `Update Task: "${currentTask.title}"`,
      details: {
        taskId: input.task_id,
        currentTask,
        updates: input.updates
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        return await supabaseService.updateTask(input.task_id, input.updates);
      }
    };
  },

  propose_delete_task: (input, context) => {
    const { tasks } = context;
    const taskToDelete = tasks?.find(t => t.id === input.task_id);

    if (!taskToDelete) {
      return {
        id: generateChangeId(),
        type: 'error',
        status: 'error',
        icon: '❌',
        summary: `Task with ID ${input.task_id} not found`,
        reason: input.reason,
        applyFn: async () => {
          throw new Error(`Cannot delete: Task with ID ${input.task_id} does not exist`);
        }
      };
    }

    return {
      id: generateChangeId(),
      type: 'delete_task',
      status: 'pending',
      icon: '🗑️',
      summary: `Delete Task: "${taskToDelete.title}"`,
      details: {
        taskId: input.task_id,
        taskToDelete
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        return await supabaseService.deleteTask(input.task_id);
      }
    };
  },

  propose_regenerate_roadmap: (input, context) => {
    const { milestone } = context;
    const newTitle = input.new_title || milestone.title;
    const newBudget = input.new_budget || milestone.budget_amount || 0;
    const newTimeline = input.new_timeline_months || 12;

    return {
      id: generateChangeId(),
      type: 'regenerate_roadmap',
      status: 'pending',
      icon: '🔄',
      summary: `Regenerate roadmap for: "${newTitle}"`,
      details: {
        newTitle: newTitle,
        newBudget: newBudget,
        newTimeline: newTimeline,
        focusAreas: input.focus_areas
      },
      reason: input.reason,
      applyFn: async (supabaseService) => {
        // Call Claude to generate new roadmap phases
        const newRoadmap = await regenerateRoadmapPhases(newTitle, newBudget, newTimeline, input.focus_areas);

        if (newRoadmap.error) {
          throw new Error(newRoadmap.error);
        }

        // Update milestone with new title and roadmap phases
        const updates = {
          title: newTitle,
          deep_dive_data: {
            ...milestone.deep_dive_data,
            roadmapPhases: newRoadmap.roadmapPhases,
            expertTips: newRoadmap.expertTips,
            regeneratedAt: new Date().toISOString()
          }
        };

        // Also update budget if provided
        if (input.new_budget) {
          updates.budget_amount = input.new_budget;
        }

        return await supabaseService.updateMilestone(milestone.id, updates);
      }
    };
  }
};

/**
 * Regenerate roadmap phases using Claude
 */
async function regenerateRoadmapPhases(title, budget, timelineMonths, focusAreas = []) {
  console.log('🔄 Regenerating roadmap for:', title);
  console.log('📊 Parameters:', { budget, timelineMonths, focusAreas });

  const systemPrompt = `You are Luna, an AI planning advisor. Return ONLY valid JSON, no markdown.`;

  const focusText = focusAreas && focusAreas.length > 0
    ? `Focus areas: ${focusAreas.join(', ')}`
    : '';

  const userPrompt = `Create a NEW roadmap for: "${title}"
Budget: €${budget || 0}
Timeline: ${timelineMonths} months
${focusText}

Return JSON (NO markdown, NO explanation):
{
  "roadmapPhases": [
    {"title": "Phase 1: [Name]", "description": "Brief desc", "isCriticalPath": true, "isUnlocked": true, "duration": "X weeks", "estimatedCost": [amount], "smartTips": ["Tip 1", "Tip 2"]},
    // Add more phases as needed for this specific goal (typically 3-8 phases depending on complexity)
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
- Return ONLY the JSON object, no explanation before or after`;

  try {
    const response = await fetch(`${BACKEND_URL}/api/claude-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userPrompt,
        systemPrompt: systemPrompt,
        maxTokens: 2500, // Increased to ensure full 5-phase response
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to regenerate roadmap');
    }

    const data = await response.json();
    console.log('📦 Raw API response length:', data.content?.length);

    let contentToParse = data.content;

    // Remove markdown code blocks if present
    if (contentToParse.includes('```')) {
      contentToParse = contentToParse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }

    // Extract JSON
    const jsonMatch = contentToParse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const generatedContent = JSON.parse(jsonMatch[0]);
      const phaseCount = generatedContent.roadmapPhases?.length || 0;
      console.log('✅ Regenerated roadmap with', phaseCount, 'phases');

      // Log warning only if no phases were generated (likely truncation issue)
      if (phaseCount === 0) {
        console.warn('⚠️ No phases received. API response may have been truncated.');
        console.warn('Response preview:', data.content?.substring(0, 500));
      }

      return {
        roadmapPhases: generatedContent.roadmapPhases || [],
        expertTips: generatedContent.expertTips || [],
        error: phaseCount === 0 ? 'No phases generated' : null
      };
    }

    throw new Error('Failed to parse regenerated roadmap');
  } catch (error) {
    console.error('❌ Roadmap regeneration error:', error);
    console.error('Error stack:', error.stack);
    return {
      roadmapPhases: [],
      expertTips: [],
      error: error.message
    };
  }
}

/**
 * Build system prompt for Luna Overview Chat
 * Provides full milestone context
 */
export function buildSystemPrompt(milestone, tasks, userContext) {
  const phases = milestone.deep_dive_data?.roadmapPhases || [];
  const completedTasks = tasks?.filter(t => t.completed).length || 0;
  const totalTasks = tasks?.length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const phasesText = phases.map((phase, idx) =>
    `  ${idx + 1}. ${phase.title} (${phase.duration || 'TBD'}, €${phase.estimatedCost || 0})`
  ).join('\n');

  const tasksText = tasks?.slice(0, 10).map((task, idx) =>
    `  ${idx + 1}. [${task.completed ? '✓' : ' '}] ${task.title}${task.assigned_to ? ` (${task.assigned_to})` : ''}`
  ).join('\n') || '  No tasks yet';

  return `You are Luna, a warm and intelligent AI assistant helping ${userContext?.partner1 || 'Partner 1'} and ${userContext?.partner2 || 'Partner 2'} achieve their dream: "${milestone.title}".

CURRENT MILESTONE STATE:
- Title: ${milestone.title}
- Description: ${milestone.description || 'No description'}
- Budget: €${(milestone.budget_amount || milestone.estimatedCost || 0).toLocaleString()}
- Target Date: ${milestone.target_date ? new Date(milestone.target_date).toLocaleDateString() : 'Not set'}
- Progress: ${progressPercent}% (${completedTasks}/${totalTasks} tasks)
- Location: ${userContext?.location || 'Not specified'}

ROADMAP PHASES (${phases.length} total):
${phasesText || '  No phases defined'}

TASKS (showing first 10):
${tasksText}

YOUR CAPABILITIES:
You can PROPOSE changes using these tools (all changes require user confirmation):
1. propose_title_update - Change the goal title
2. propose_description_update - Change the goal description (use when description is outdated or doesn't match current goal)
3. propose_budget_update - Change the milestone budget
4. propose_target_date_update - Change the target completion date
5. propose_add_phase - Add a new roadmap phase
6. propose_modify_phase - Update an existing phase
7. propose_remove_phase - Delete a phase
8. propose_add_task - Create a new task
9. propose_update_task - Modify an existing task
10. propose_delete_task - Remove a task
11. propose_regenerate_roadmap - IMPORTANT: Use when goal focus changes significantly (e.g., changing from CFA 3 to CFA 1). This updates BOTH the title AND generates a completely new roadmap.

RULES:
1. ALWAYS propose changes - NEVER apply them directly
2. Explain WHY you're suggesting each change
3. Be conversational and supportive
4. Reference their specific situation (budget, timeline, location)
5. If they ask about progress, give encouraging feedback
6. For big changes, use propose_regenerate_roadmap
7. Keep responses concise but warm

CONVERSATION STYLE:
- Warm and encouraging like a helpful friend
- Use their names when natural
- Celebrate their progress
- Be specific about numbers and dates
- Ask clarifying questions if needed`;
}

/**
 * Process tool calls from streaming response
 * Returns pending changes for each tool call
 */
export function processToolCall(toolName, toolInput, context) {
  const handler = toolHandlers[toolName];
  if (!handler) {
    console.error(`Unknown tool: ${toolName}`);
    return null;
  }

  return handler(toolInput, context);
}

/**
 * Call Claude with streaming for Luna Overview Chat
 */
export async function callLunaOverviewStreaming(messages, context, callbacks) {
  const { onChunk, onToolCall, onDone, onError } = callbacks;
  const { milestone, tasks, userContext } = context;

  const systemPrompt = buildSystemPrompt(milestone, tasks, userContext);

  try {
    const response = await fetch(`${BACKEND_URL}/api/claude-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt,
        tools: LUNA_OVERVIEW_TOOLS,
        maxTokens: 1024,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (onDone) onDone();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (currentEvent === 'text' && data.text) {
              if (onChunk) onChunk(data.text);
            } else if (currentEvent === 'tool_use' && data.tool) {
              // Process tool call and return pending change
              const pendingChange = processToolCall(data.tool.name, data.tool.input, context);
              if (pendingChange && onToolCall) {
                onToolCall(pendingChange);
              }
            } else if (currentEvent === 'done') {
              if (onDone) onDone();
            } else if (currentEvent === 'error') {
              if (onError) onError(new Error(data.error || 'Stream error'));
            }
          } catch (e) {
            // Skip non-JSON data lines
          }
        }
      }
    }
  } catch (error) {
    console.error('Luna Overview streaming error:', error);
    if (onError) onError(error);
  }
}

export default {
  LUNA_OVERVIEW_TOOLS,
  toolHandlers,
  buildSystemPrompt,
  processToolCall,
  callLunaOverviewStreaming
};
