import { supabase } from '../config/supabaseClient'
import { activityService } from './activityService'

// =====================================================
// ROADMAP OPERATIONS
// =====================================================

/**
 * Create a new roadmap for the current user
 */
export const createRoadmap = async (roadmapData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('roadmaps')
      .insert([{
        user_id: user.id,
        ...roadmapData
      }])
      .select()
      .single()

    if (error) throw error

    // Log activity (non-blocking)
    if (data) {
      activityService.logDreamCreated(data, user.id)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Create roadmap error:', error)
    return { data: null, error }
  }
}

/**
 * Get all roadmaps accessible to the current user
 *
 * This includes:
 * 1. User's own roadmaps (user_id = current user)
 * 2. Roadmaps where user is per-dream partner (partner_id = current user)
 * 3. Global partner's roadmaps (via partnerships table + visible_to_partner = TRUE)
 *
 * Access control is handled by RLS policies - we just query all and let RLS filter
 */
export const getUserRoadmaps = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Query all roadmaps - RLS policies handle access control
    // This allows global partners to see each other's dreams
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get roadmaps error:', error)
    return { data: null, error }
  }
}

/**
 * Get a specific roadmap by ID
 */
export const getRoadmapById = async (roadmapId) => {
  try {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', roadmapId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get roadmap error:', error)
    return { data: null, error }
  }
}

/**
 * Update a roadmap
 */
export const updateRoadmap = async (roadmapId, updates) => {
  try {
    const { data, error } = await supabase
      .from('roadmaps')
      .update(updates)
      .eq('id', roadmapId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Update roadmap error:', error)
    return { data: null, error }
  }
}

/**
 * Delete a roadmap
 */
export const deleteRoadmap = async (roadmapId) => {
  try {
    const { error } = await supabase
      .from('roadmaps')
      .delete()
      .eq('id', roadmapId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Delete roadmap error:', error)
    return { error }
  }
}

// =====================================================
// MILESTONE OPERATIONS
// =====================================================

/**
 * Create a new milestone
 */
export const createMilestone = async (milestoneData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('milestones')
      .insert([milestoneData])
      .select()
      .single()

    if (error) throw error

    // Log activity (non-blocking)
    if (data && user && milestoneData.roadmap_id) {
      activityService.logMilestoneCreated(milestoneData.roadmap_id, data, user.id)
    }

    // If milestone was created with a budget, sync to roadmap
    if (data?.budget_amount > 0 && data?.roadmap_id) {
      console.log('💰 Milestone created with budget - syncing to roadmap...');
      recalculateRoadmapBudgetAmount(data.roadmap_id);
    }

    return { data, error: null }
  } catch (error) {
    console.error('Create milestone error:', error?.message || error?.code || error)
    console.error('Create milestone error details:', JSON.stringify(error, null, 2))
    return { data: null, error }
  }
}

/**
 * Get all milestones for a roadmap
 */
export const getMilestonesByRoadmap = async (roadmapId) => {
  try {
    console.log('🔍 getMilestonesByRoadmap called with roadmapId:', roadmapId);

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('order_index', { ascending: true })

    console.log('📊 Database response - error:', error);
    console.log('📊 Number of milestones found:', data?.length || 0);

    // CRITICAL: Log each milestone's budget_amount to verify DB has it
    if (data && data.length > 0) {
      console.log('💰 BUDGET CHECK - Milestones from database:');
      data.forEach((m, idx) => {
        console.log(`  ${idx + 1}. ${m.title}:`);
        console.log(`     - budget_amount: ${m.budget_amount}`);
        console.log(`     - target_date: ${m.target_date}`);
        console.log(`     - estimated_cost: ${m.estimated_cost}`);
      });
    }

    if (error) throw error

    // Mark all milestones as saved to database (they came from DB, so they exist)
    const milestonesWithFlag = data?.map(m => ({ ...m, _savedToDb: true })) || [];

    return { data: milestonesWithFlag, error: null }
  } catch (error) {
    console.error('❌ Get milestones error:', error)
    return { data: null, error }
  }
}

/**
 * Check if a string is a valid UUID
 */
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Get a milestone by ID
 */
export const getMilestoneById = async (milestoneId) => {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestoneId)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get milestone by ID error:', error)
    return { data: null, error }
  }
}

/**
 * Update a milestone
 * For non-authenticated users, returns local success without hitting Supabase
 */
export const updateMilestone = async (milestoneId, updates) => {
  try {
    console.log('💾 updateMilestone called:');
    console.log('   - milestoneId:', milestoneId);
    console.log('   - updates:', updates);

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('ℹ️ User not authenticated - applying changes locally (demo mode)');
      // For demo users, return success with merged data
      // This allows the UI to update without hitting Supabase
      return {
        data: { id: milestoneId, ...updates },
        error: null,
        isLocalOnly: true,
        message: 'Changes applied locally. Sign in to save permanently.'
      };
    }

    // Check if the milestone ID is a valid UUID
    if (!isValidUUID(milestoneId)) {
      console.warn('⚠️ Milestone ID is not a valid UUID:', milestoneId);
      console.warn('   This milestone may not exist in the database yet.');
      console.warn('   Updates will only be applied locally. Please recreate the goal for full database sync.');
      return {
        data: { id: milestoneId, ...updates },
        error: null,
        warning: 'Local-only update: milestone ID is not a valid UUID'
      };
    }

    if (updates.budget_amount !== undefined) {
      console.log('   🔴 BUDGET UPDATE: Setting budget_amount to', updates.budget_amount);
    }

    const { data, error } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', milestoneId)
      .select()

    if (error) {
      console.error('❌ Update milestone failed:', error);
      throw error;
    }

    // Check if update affected any rows
    if (!data || data.length === 0) {
      console.error('❌ Update milestone: No rows affected. This could mean:');
      console.error('   1. The milestone does not exist in the database');
      console.error('   2. RLS policy is blocking the update (check your Supabase auth)');
      console.error('   3. The user does not have permission to update this milestone');
      return {
        data: null,
        error: {
          code: 'NO_ROWS_AFFECTED',
          message: 'Update failed: milestone not found or you do not have permission to update it. Try signing out and back in.'
        }
      };
    }

    const updatedMilestone = data[0];
    console.log('✅ Update milestone success! Returned data:');
    console.log('   - budget_amount:', updatedMilestone.budget_amount);
    console.log('   - target_date:', updatedMilestone.target_date);

    // If budget_amount was updated, recalculate roadmap's total budget
    // This is CRITICAL for Dashboard budget health to work correctly
    if (updates.budget_amount !== undefined && updatedMilestone.roadmap_id) {
      console.log('   💰 Budget changed - syncing to roadmap...');
      recalculateRoadmapBudgetAmount(updatedMilestone.roadmap_id);
    }

    return { data: updatedMilestone, error: null }
  } catch (error) {
    console.error('Update milestone error:', error)
    return { data: null, error }
  }
}

/**
 * Delete a milestone
 */
export const deleteMilestone = async (milestoneId) => {
  try {
    // Get milestone first to capture roadmap_id for budget recalculation
    const { data: milestone } = await supabase
      .from('milestones')
      .select('roadmap_id, budget_amount')
      .eq('id', milestoneId)
      .single()

    const roadmapId = milestone?.roadmap_id
    const hadBudget = milestone?.budget_amount > 0

    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)

    if (error) throw error

    // If milestone had a budget, recalculate roadmap's total budget
    if (roadmapId && hadBudget) {
      console.log('💰 Milestone with budget deleted - recalculating roadmap budget...');
      recalculateRoadmapBudgetAmount(roadmapId);
    }

    return { error: null }
  } catch (error) {
    console.error('Delete milestone error:', error)
    return { error }
  }
}

// =====================================================
// TASK OPERATIONS
// =====================================================

/**
 * Create a task
 * @param {object} taskData - Task data including milestone_id
 * @param {object} [activityContext] - Optional context for activity logging
 * @param {string} activityContext.roadmapId - The roadmap ID for activity logging
 */
export const createTask = async (taskData, activityContext = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single()

    if (error) throw error

    // Log activity (non-blocking) if context provided
    if (data && user && activityContext?.roadmapId) {
      activityService.logTaskCreated(activityContext.roadmapId, data, user.id)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Create task error:', error)
    return { data: null, error }
  }
}

/**
 * Get all tasks for a milestone
 */
export const getTasksByMilestone = async (milestoneId) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('order_index', { ascending: true })

    if (error) throw error

    // Filter out deleted tasks client-side
    const filteredData = data ? data.filter(task => !task.deleted) : [];

    return { data: filteredData, error: null }
  } catch (error) {
    console.error('Get tasks error:', error)
    return { data: null, error }
  }
}

/**
 * Update a task (typically for marking complete)
 * @param {string} taskId - Task ID to update
 * @param {object} updates - Fields to update
 * @param {object} [activityContext] - Optional context for activity logging
 * @param {string} activityContext.roadmapId - The roadmap ID
 * @param {boolean} [activityContext.wasCompleted] - Previous completion state (for detecting completion changes)
 */
export const updateTask = async (taskId, updates, activityContext = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    // If marking as complete, add completed_by and completed_at
    if (updates.completed && !updates.completed_by) {
      updates.completed_by = user?.id
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error

    // Log activity (non-blocking) if context provided
    if (data && user && activityContext?.roadmapId) {
      // Detect completion state change
      if (updates.completed === true && !activityContext.wasCompleted) {
        activityService.logTaskCompleted(activityContext.roadmapId, data, user.id)
      } else if (updates.completed === false && activityContext.wasCompleted) {
        activityService.logTaskUncompleted(activityContext.roadmapId, data, user.id)
      } else if (updates.assigned_to !== undefined) {
        activityService.logTaskAssigned(activityContext.roadmapId, data, user.id, updates.assigned_to)
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Update task error:', error)
    return { data: null, error }
  }
}

/**
 * Delete a task
 * @param {string} taskId - Task ID to delete
 * @param {object} [activityContext] - Optional context for activity logging
 * @param {string} activityContext.roadmapId - The roadmap ID
 * @param {object} activityContext.task - The task object (for title in activity log)
 */
export const deleteTask = async (taskId, activityContext = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error

    // Log activity (non-blocking) if context provided
    if (user && activityContext?.roadmapId && activityContext?.task) {
      activityService.logTaskDeleted(activityContext.roadmapId, activityContext.task, user.id)
    }

    return { error: null }
  } catch (error) {
    console.error('Delete task error:', error)
    return { error }
  }
}

/**
 * Get tasks for a specific roadmap phase
 */
export const getTasksByPhase = async (milestoneId, phaseIndex) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('milestone_id', milestoneId)
      .eq('roadmap_phase_index', phaseIndex)
      .order('order_index', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get tasks by phase error:', error)
    return { data: null, error }
  }
}

/**
 * Get tasks assigned to a specific partner
 */
export const getTasksByPartner = async (milestoneId, partnerName) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('milestone_id', milestoneId)
      .or(`assigned_to.eq.${partnerName},assigned_to.is.null`)
      .order('order_index', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get tasks by partner error:', error)
    return { data: null, error }
  }
}

/**
 * Create a task linked to a specific roadmap phase
 */
export const createPhaseTask = async (taskData, phaseIndex) => {
  try {
    const taskWithPhase = {
      ...taskData,
      roadmap_phase_index: phaseIndex
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskWithPhase])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Create phase task error:', error)
    return { data: null, error }
  }
}

/**
 * Get phase completion statistics
 * Returns: { total, completed, percentage, allCompleted }
 */
export const getPhaseProgress = async (milestoneId, phaseIndex) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('completed')
      .eq('milestone_id', milestoneId)
      .eq('roadmap_phase_index', phaseIndex)

    if (error) throw error

    const total = data?.length || 0
    const completed = data?.filter(t => t.completed).length || 0
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      data: {
        total,
        completed,
        percentage,
        allCompleted: total > 0 && completed === total
      },
      error: null
    }
  } catch (error) {
    console.error('Get phase progress error:', error)
    return { data: null, error }
  }
}

// =====================================================
// ACHIEVEMENT OPERATIONS
// =====================================================

/**
 * Create a new achievement
 */
export const createAchievement = async (achievementData) => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .insert([achievementData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Create achievement error:', error)
    return { data: null, error }
  }
}

/**
 * Get all achievements for a roadmap
 */
export const getAchievementsByRoadmap = async (roadmapId) => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get achievements error:', error)
    return { data: null, error }
  }
}

// =====================================================
// BUDGET POCKET OPERATIONS
// =====================================================

/**
 * Validate a contribution against pocket target limits
 * Server-side validation using the database function
 * @param {string} milestoneId - The milestone ID
 * @param {string} category - The pocket/category name
 * @param {number} amount - The contribution amount
 * @returns {Promise<{allowed: boolean, remaining: number|null, message: string}>}
 */
export const validatePocketContribution = async (milestoneId, category, amount) => {
  try {
    const { data, error } = await supabase.rpc('validate_pocket_contribution', {
      p_milestone_id: milestoneId,
      p_category: category,
      p_amount: amount
    })

    if (error) {
      // If RPC doesn't exist yet (migration not run), allow contribution
      if (error.code === '42883') { // function does not exist
        console.log('⚠️ validate_pocket_contribution RPC not found - allowing contribution')
        return { allowed: true, remaining: null, message: 'No server-side validation' }
      }
      throw error
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining,
      message: data.message
    }
  } catch (error) {
    console.error('Validate pocket contribution error:', error)
    // On error, allow contribution but log warning
    return { allowed: true, remaining: null, message: 'Validation error - proceeding' }
  }
}

/**
 * Get current status of all budget pockets for a milestone
 * @param {string} milestoneId - The milestone ID
 * @returns {Promise<Object>} - Status for each pocket { pocketName: { target, contributed, remaining, isFunded, percentFunded } }
 */
export const getPocketStatus = async (milestoneId) => {
  try {
    const { data, error } = await supabase.rpc('get_pocket_status', {
      p_milestone_id: milestoneId
    })

    if (error) {
      // If RPC doesn't exist yet, return empty
      if (error.code === '42883') {
        console.log('⚠️ get_pocket_status RPC not found - returning empty')
        return { data: {}, error: null }
      }
      throw error
    }

    return { data: data || {}, error: null }
  } catch (error) {
    console.error('Get pocket status error:', error)
    return { data: {}, error }
  }
}

/**
 * Update budget pockets for a milestone
 * @param {string} milestoneId - The milestone ID
 * @param {Object} pockets - Pocket definitions { "Flights": { target: 600 }, "Hotel": { target: 800 } }
 */
export const updateMilestoneBudgetPockets = async (milestoneId, pockets) => {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .update({ budget_pockets: pockets })
      .eq('id', milestoneId)
      .select('budget_pockets')
      .single()

    if (error) throw error
    console.log('💰 Budget pockets saved for milestone:', milestoneId)
    return { data, error: null }
  } catch (error) {
    console.error('Update budget pockets error:', error)
    return { data: null, error }
  }
}

/**
 * Get budget pockets for a milestone
 * @param {string} milestoneId - The milestone ID
 */
export const getMilestoneBudgetPockets = async (milestoneId) => {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .select('budget_pockets')
      .eq('id', milestoneId)
      .single()

    if (error) throw error
    return { data: data?.budget_pockets || {}, error: null }
  } catch (error) {
    console.error('Get budget pockets error:', error)
    return { data: {}, error }
  }
}

// =====================================================
// EXPENSE OPERATIONS
// =====================================================

/**
 * Recalculate and update budget_amount on a roadmap from its milestones
 * Called after any milestone budget_amount change to keep Dashboard budget health in sync
 * This is CRITICAL: Dashboard uses roadmap.budget_amount, but users set budget on milestones
 * @param {string} roadmapId - The roadmap to update
 */
const recalculateRoadmapBudgetAmount = async (roadmapId) => {
  if (!roadmapId) return { error: null }

  try {
    // Get all milestones for this roadmap
    const { data: milestones, error: fetchError } = await supabase
      .from('milestones')
      .select('budget_amount')
      .eq('roadmap_id', roadmapId)

    if (fetchError) {
      console.error('Error fetching milestones for budget recalc:', fetchError)
      return { error: fetchError }
    }

    // Sum all milestone budget_amounts
    const totalBudget = milestones?.reduce((sum, m) => sum + (m.budget_amount || 0), 0) || 0

    // Update the roadmap's budget_amount
    const { error: updateError } = await supabase
      .from('roadmaps')
      .update({ budget_amount: totalBudget })
      .eq('id', roadmapId)

    if (updateError) {
      console.error('Error updating roadmap budget_amount:', updateError)
      return { error: updateError }
    }

    console.log(`💰 Roadmap budget_amount recalculated for ${roadmapId}: $${totalBudget}`)
    return { error: null, totalBudget }
  } catch (error) {
    console.error('Recalculate roadmap budget error:', error)
    return { error }
  }
}

// NOTE: budget_spent is calculated on-the-fly from expenses in the RPC/legacy loading
// We do NOT store it on the roadmaps table - it's always derived from SUM(expenses.amount)

/**
 * Create a new expense (contribution to a budget pocket)
 * Validates against pocket limits before creating
 * @param {object} expenseData - Expense data including milestone_id, category, amount
 * @param {object} options - Optional settings
 * @param {boolean} options.skipValidation - Skip pocket validation (use carefully)
 */
export const createExpense = async (expenseData, options = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // CRITICAL: Validate pocket contribution before creating expense
    // This is a HARD BUSINESS RULE - pockets cannot exceed their target amounts
    if (!options.skipValidation && expenseData.milestone_id && expenseData.category && expenseData.amount) {
      const validation = await validatePocketContribution(
        expenseData.milestone_id,
        expenseData.category,
        expenseData.amount
      )

      if (!validation.allowed) {
        console.warn('🚫 Pocket overfunding prevented:', validation.message)
        return {
          data: null,
          error: {
            code: 'POCKET_OVERFUNDING',
            message: validation.message,
            remaining: validation.remaining
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: user.id,
        ...expenseData
      }])
      .select()
      .single()

    if (error) {
      // Check if this is a pocket limit violation from the database trigger
      if (error.message && error.message.includes('Pocket overfunding prevented')) {
        return {
          data: null,
          error: {
            code: 'POCKET_OVERFUNDING',
            message: error.message
          }
        }
      }
      throw error
    }

    // Log activity (non-blocking)
    if (data && expenseData.roadmap_id) {
      activityService.logExpenseAdded(expenseData.roadmap_id, data, user.id)
    }

    // NOTE: budget_spent is calculated on-the-fly from expenses, not stored on roadmaps
    // Dashboard will fetch fresh data via RPC or legacy loading

    return { data, error: null }
  } catch (error) {
    console.error('Create expense error:', error)
    return { data: null, error }
  }
}

/**
 * Get all expenses for a roadmap
 */
export const getExpensesByRoadmap = async (roadmapId) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('expense_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get expenses error:', error)
    return { data: null, error }
  }
}

/**
 * Get all expenses for a milestone
 */
export const getExpensesByMilestone = async (milestoneId) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('expense_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get milestone expenses error:', error)
    return { data: null, error }
  }
}

/**
 * Get expense by ID
 */
export const getExpenseById = async (expenseId) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get expense error:', error)
    return { data: null, error }
  }
}

/**
 * Update an expense
 * @param {string} expenseId - Expense ID
 * @param {object} updates - Fields to update
 * @param {string} [roadmapId] - Optional roadmap ID for activity logging
 */
export const updateExpense = async (expenseId, updates, roadmapId = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single()

    if (error) throw error

    // Log activity (non-blocking)
    if (data && user && roadmapId) {
      activityService.logExpenseUpdated(roadmapId, data, user.id)
    }

    // NOTE: budget_spent is calculated on-the-fly from expenses, not stored on roadmaps

    return { data, error: null }
  } catch (error) {
    console.error('Update expense error:', error)
    return { data: null, error }
  }
}

/**
 * Delete an expense
 * @param {string} expenseId - Expense ID
 * @param {object} [activityContext] - Optional context for activity logging
 * @param {string} activityContext.roadmapId - The roadmap ID
 * @param {object} activityContext.expense - The expense object (for logging)
 */
export const deleteExpense = async (expenseId, activityContext = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (error) throw error

    // Log activity (non-blocking) if context provided
    if (user && activityContext?.roadmapId && activityContext?.expense) {
      activityService.logExpenseDeleted(activityContext.roadmapId, activityContext.expense, user.id)
    }

    // NOTE: budget_spent is calculated on-the-fly from expenses, not stored on roadmaps

    return { error: null }
  } catch (error) {
    console.error('Delete expense error:', error)
    return { error }
  }
}

/**
 * Mark expense as paid
 */
export const markExpenseAsPaid = async (expenseId, paidDate = null) => {
  try {
    const updates = {
      status: 'paid',
      paid_date: paidDate || new Date().toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Mark expense paid error:', error)
    return { data: null, error }
  }
}

/**
 * Get budget summary for a roadmap
 */
export const getRoadmapBudgetSummary = async (roadmapId) => {
  try {
    const { data, error } = await supabase
      .from('roadmap_budget_summary')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get budget summary error:', error)
    return { data: null, error }
  }
}

/**
 * Get expense breakdown by category for a roadmap
 */
export const getExpenseCategoryBreakdown = async (roadmapId) => {
  try {
    const { data, error } = await supabase
      .from('expense_category_breakdown')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('total_amount', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get expense breakdown error:', error)
    return { data: null, error }
  }
}

/**
 * Get overdue expenses for a roadmap
 */
export const getOverdueExpenses = async (roadmapId) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .eq('status', 'overdue')
      .order('due_date', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get overdue expenses error:', error)
    return { data: null, error }
  }
}

/**
 * Get upcoming expenses (due in next 30 days)
 */
export const getUpcomingExpenses = async (roadmapId, daysAhead = 30) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .eq('status', 'pending')
      .gte('due_date', today)
      .lte('due_date', futureDate)
      .order('due_date', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get upcoming expenses error:', error)
    return { data: null, error }
  }
}

// =====================================================
// CONVERSATION HISTORY OPERATIONS
// =====================================================

/**
 * Save a conversation message
 */
export const saveConversationMessage = async (roadmapId, role, content) => {
  try {
    const { data, error } = await supabase
      .from('conversation_history')
      .insert([{
        roadmap_id: roadmapId,
        role,
        content
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Save conversation error:', error)
    return { data: null, error }
  }
}

/**
 * Get conversation history for a roadmap
 */
export const getConversationHistory = async (roadmapId) => {
  try {
    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('timestamp', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get conversation error:', error)
    return { data: null, error }
  }
}

// =====================================================
// PROFILE OPERATIONS
// =====================================================

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get profile error:', error)
    return { data: null, error }
  }
}

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Update profile error:', error)
    return { data: null, error }
  }
}


/**
 * Create user profile (called after signup)
 *
 * IMPORTANT: Always ensures a display_name is set for activity tracking.
 * Fallback chain: full_name → email prefix → 'User'
 */
export const createUserProfile = async (userId, profileData = {}) => {
  try {
    // Derive display name with proper fallback chain
    const displayName = profileData.full_name
      || (profileData.email ? profileData.email.split('@')[0] : null)
      || 'User'

    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        email: profileData.email || null,
        full_name: profileData.full_name || null,
        display_name: displayName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Create profile error:', error)
    return { data: null, error }
  }
}

/**
 * Get or create user profile (ensures profile exists)
 *
 * IMPORTANT: If profile exists but has no display_name, updates it.
 * This ensures activity tracking always shows a real name.
 */
export const getOrCreateUserProfile = async (userId, profileData = {}) => {
  try {
    const { data: existingProfile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      // CRITICAL: Backfill display_name if missing (fixes "Someone" issue)
      const needsNameUpdate =
        !existingProfile.display_name &&
        (profileData.full_name || profileData.email || existingProfile.full_name || existingProfile.email)

      if (needsNameUpdate) {
        const displayName =
          profileData.full_name ||
          existingProfile.full_name ||
          (profileData.email ? profileData.email.split('@')[0] : null) ||
          (existingProfile.email ? existingProfile.email.split('@')[0] : null) ||
          'User'

        // Update the profile with display_name (non-blocking, fire-and-forget)
        supabase
          .from('profiles')
          .update({
            display_name: displayName,
            full_name: profileData.full_name || existingProfile.full_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .then(({ error: updateError }) => {
            if (updateError) {
              console.warn('Failed to backfill display_name:', updateError.message)
            } else {
              console.log('✅ Backfilled display_name for user:', userId)
            }
          })

        // Return updated profile immediately (optimistic)
        return {
          data: { ...existingProfile, display_name: displayName },
          error: null
        }
      }

      return { data: existingProfile, error: null }
    }

    // If not found (PGRST116 = no rows returned), create it
    if (getError?.code === 'PGRST116') {
      return await createUserProfile(userId, profileData)
    }

    if (getError) throw getError
    return { data: null, error: getError }
  } catch (error) {
    console.error('Get or create profile error:', error)
    return { data: null, error }
  }
}


// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to roadmap changes
 * @param {string} roadmapId - The roadmap ID to watch
 * @param {function} callback - Function called when data changes
 * @returns {object} Subscription object (call .unsubscribe() to stop)
 */
export const subscribeToRoadmap = (roadmapId, callback) => {
  const subscription = supabase
    .channel(`roadmap:${roadmapId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'roadmaps',
        filter: `id=eq.${roadmapId}`
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return subscription
}

/**
 * Subscribe to milestone changes for a roadmap
 */
export const subscribeToMilestones = (roadmapId, callback) => {
  const subscription = supabase
    .channel(`milestones:${roadmapId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'milestones',
        filter: `roadmap_id=eq.${roadmapId}`
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return subscription
}

/**
 * Subscribe to task changes for a milestone
 */
export const subscribeToTasks = (milestoneId, callback) => {
  const subscription = supabase
    .channel(`tasks:${milestoneId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `milestone_id=eq.${milestoneId}`
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return subscription
}

/**
 * Subscribe to expense changes for a roadmap
 */
export const subscribeToExpenses = (roadmapId, callback) => {
  const subscription = supabase
    .channel(`expenses:${roadmapId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `roadmap_id=eq.${roadmapId}`
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return subscription
}

// =====================================================
// MILESTONE CONVERSATION OPERATIONS (Luna Overview Chat)
// =====================================================

/**
 * Get conversation for a milestone
 */
export const getMilestoneConversation = async (milestoneId) => {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // For demo users, check localStorage first
      try {
        const key = `luna_conversation_${milestoneId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('ℹ️ Loaded conversation from localStorage (demo mode)');
          return { data: parsed, error: null, isLocalOnly: true };
        }
      } catch (e) {
        console.warn('Could not load conversation from localStorage:', e);
      }
      return { data: null, error: null };
    }

    const { data, error } = await supabase
      .from('milestone_conversations')
      .select('*')
      .eq('milestone_id', milestoneId)
      .maybeSingle()  // Returns null if no row, doesn't error

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get milestone conversation error:', error)
    return { data: null, error }
  }
}

/**
 * Save/update conversation for a milestone (upsert pattern)
 */
export const saveMilestoneConversation = async (milestoneId, messages) => {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // For demo users, store in localStorage instead
      try {
        const key = `luna_conversation_${milestoneId}`;
        localStorage.setItem(key, JSON.stringify({ messages, updated_at: new Date().toISOString() }));
        console.log('ℹ️ Conversation saved to localStorage (demo mode)');
        return { data: { messages }, error: null, isLocalOnly: true };
      } catch (e) {
        console.warn('Could not save conversation to localStorage:', e);
        return { data: null, error: null }; // Silently fail for demo mode
      }
    }

    // Use upsert - insert or update if exists
    const { data, error } = await supabase
      .from('milestone_conversations')
      .upsert({
        milestone_id: milestoneId,
        messages: messages,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'milestone_id'
      })
      .select()
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Save milestone conversation error:', error)
    return { data: null, error }
  }
}

/**
 * Clear conversation for a milestone
 */
export const clearMilestoneConversation = async (milestoneId) => {
  try {
    const { error } = await supabase
      .from('milestone_conversations')
      .delete()
      .eq('milestone_id', milestoneId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Clear milestone conversation error:', error)
    return { error }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Migrate localStorage data to Supabase
 * Call this once when user first logs in
 */
export const migrateLocalStorageToSupabase = async () => {
  try {
    // Get data from localStorage
    const localRoadmap = JSON.parse(localStorage.getItem('roadmap') || '[]')
    const localXP = parseInt(localStorage.getItem('xpPoints') || '0')
    const localAchievements = JSON.parse(localStorage.getItem('achievements') || '[]')

    if (localRoadmap.length === 0) {
      return { success: true, message: 'No local data to migrate' }
    }

    // Create roadmap in Supabase
    const { data: roadmap } = await createRoadmap({
      title: 'My Migrated Roadmap',
      xp_points: localXP
    })

    if (!roadmap) throw new Error('Failed to create roadmap')

    // Create milestones
    for (const milestone of localRoadmap) {
      const { data: newMilestone } = await createMilestone({
        roadmap_id: roadmap.id,
        title: milestone.title,
        description: milestone.description,
        icon: milestone.icon,
        color: milestone.color,
        category: milestone.category || 'relationship',
        estimated_cost: milestone.estimatedCost || 0,
        duration: milestone.duration,
        ai_generated: milestone.aiGenerated || false,
        deep_dive_data: {
          ...(milestone.deepDiveData || {}),
          // Preserve Luna-enhanced fields for roadmap visualization
          roadmapPhases: milestone.roadmapPhases || [],
          detailedSteps: milestone.detailedSteps || [],
          milestones: milestone.milestones || [],
          expertTips: milestone.expertTips || [],
          challenges: milestone.challenges || [],
          successMetrics: milestone.successMetrics || [],
          budgetBreakdown: milestone.budgetBreakdown || [],
          lunaEnhanced: milestone.lunaEnhanced || false,
          generatedAt: milestone.generatedAt || null
        },
        order_index: localRoadmap.indexOf(milestone)
      })

      // Create tasks for this milestone
      if (milestone.tasks && newMilestone) {
        for (const task of milestone.tasks) {
          await createTask({
            milestone_id: newMilestone.id,
            title: task.title,
            description: task.description || '',
            completed: task.completed || false,
            ai_generated: task.aiGenerated || false,
            order_index: milestone.tasks.indexOf(task)
          })
        }
      }
    }

    // Create achievements
    if (localAchievements.length > 0 && roadmap) {
      for (const achievement of localAchievements) {
        await createAchievement({
          roadmap_id: roadmap.id,
          title: achievement.title,
          description: achievement.description,
          xp_earned: achievement.xp || 0
        })
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem('roadmap')
    localStorage.removeItem('xpPoints')
    localStorage.removeItem('achievements')

    return { success: true, message: 'Data migrated successfully!', roadmapId: roadmap.id }
  } catch (error) {
    console.error('Migration error:', error)
    return { success: false, error }
  }
}

// =====================================================
// DASHBOARD OPTIMIZED QUERIES
// =====================================================

/**
 * Get dashboard summary with pre-computed metrics
 * Uses RPC function for single-query performance
 * Replaces 22+ individual API calls with 1 optimized query
 *
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @returns {Promise<{data: DashboardData, error: Error|null}>}
 */
export const getDashboardSummary = async (page = 1, limit = 20) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('get_dashboard_summary', {
      user_uuid: user.id,
      page_num: page,
      page_size: limit
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get dashboard summary error:', error)
    return { data: null, error }
  }
}

// =====================================================
// PARTNER & DREAM SHARING OPERATIONS
// =====================================================

/**
 * Create a share invite for a dream (roadmap)
 * Generates an 8-character share code
 * @param {string} roadmapId - The roadmap to share
 * @param {string} invitedEmail - Optional email of invited partner
 * @param {string} message - Optional invitation message
 */
export const createDreamShareInvite = async (roadmapId, invitedEmail = null, message = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Use the RPC function to generate unique share code
    const { data, error } = await supabase.rpc('create_dream_share_invite', {
      p_roadmap_id: roadmapId,
      p_invited_email: invitedEmail,
      p_message: message
    })

    if (error) throw error
    return { data: data[0], error: null }
  } catch (error) {
    console.error('Create dream share invite error:', error)
    return { data: null, error }
  }
}

/**
 * Accept a dream share invite using share code
 * @param {string} shareCode - The 8-character share code
 */
export const acceptDreamShare = async (shareCode) => {
  console.log('🔗 acceptDreamShare called with code:', shareCode)

  try {
    // Note: We don't call getUser() here because:
    // 1. AcceptInvitePage already verified user is logged in
    // 2. The RPC function uses auth.uid() from the JWT token automatically
    // 3. getUser() was causing hangs in some cases

    console.log('🔗 Calling accept_dream_share RPC...')

    // Create a proper timeout wrapper
    const timeoutMs = 15000 // 15 seconds
    let timeoutId

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        console.error('🔗 RPC call timed out after', timeoutMs, 'ms')
        reject(new Error('Request timed out. Please try again.'))
      }, timeoutMs)
    })

    // Wrap the RPC call in a proper Promise to ensure Promise.race works
    const rpcPromise = new Promise(async (resolve, reject) => {
      try {
        const result = await supabase.rpc('accept_dream_share', {
          p_share_code: shareCode.toUpperCase()
        })
        console.log('🔗 RPC completed:', result)
        resolve(result)
      } catch (err) {
        console.error('🔗 RPC error:', err)
        reject(err)
      }
    })

    const { data, error } = await Promise.race([rpcPromise, timeoutPromise])

    // Clear the timeout since we got a response
    clearTimeout(timeoutId)

    console.log('🔗 RPC result - data:', data, 'error:', error)

    if (error) throw error

    // Handle case where RPC returns empty or no data
    if (!data || data.length === 0) {
      console.log('🔗 No data returned from RPC')
      return { data: { success: false, message: 'Invalid or expired invite code' }, error: null }
    }

    console.log('🔗 Success! Returning:', data[0])
    return { data: data[0], error: null }
  } catch (error) {
    console.error('🔗 Accept dream share error:', error)
    return { data: null, error }
  }
}

/**
 * Get share info for a dream
 * @param {string} roadmapId - The roadmap ID
 */
export const getDreamShareInfo = async (roadmapId) => {
  try {
    const { data, error } = await supabase
      .from('dream_sharing')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get dream share info error:', error)
    return { data: null, error }
  }
}

/**
 * Get pending invites for current user (invites sent to their email)
 */
export const getPendingInvites = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('dream_sharing')
      .select(`
        *,
        roadmaps:roadmap_id (
          id,
          title,
          partner1_name,
          partner2_name
        )
      `)
      .eq('invited_email', user.email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get pending invites error:', error)
    return { data: null, error }
  }
}

/**
 * Cancel/revoke a dream share
 * @param {string} shareId - The dream_sharing record ID
 */
export const revokeDreamShare = async (shareId) => {
  try {
    const { error } = await supabase
      .from('dream_sharing')
      .update({ status: 'cancelled' })
      .eq('id', shareId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Revoke dream share error:', error)
    return { error }
  }
}

/**
 * Get partner info for a roadmap
 * @param {string} roadmapId - The roadmap ID
 */
export const getPartnerInfo = async (roadmapId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get roadmap with partner info
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('user_id, partner_id, partner1_name, partner2_name')
      .eq('id', roadmapId)
      .single()

    if (roadmapError) throw roadmapError

    // Determine which user is the partner
    const partnerId = roadmap.user_id === user.id ? roadmap.partner_id : roadmap.user_id

    if (!partnerId) {
      return { data: { hasPartner: false }, error: null }
    }

    // Get partner's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', partnerId)
      .single()

    return {
      data: {
        hasPartner: true,
        partner: profile,
        isOwner: roadmap.user_id === user.id
      },
      error: null
    }
  } catch (error) {
    console.error('Get partner info error:', error)
    return { data: null, error }
  }
}


// =====================================================
// GLOBAL PARTNERSHIP OPERATIONS
// =====================================================

/**
 * Create or get existing partnership invite
 * Returns an invite code that can be shared with a partner
 */
export const createPartnershipInvite = async () => {
  try {
    const { data, error } = await supabase.rpc('create_partnership_invite')
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Create partnership invite error:', error)
    return { data: null, error }
  }
}

/**
 * Accept a partnership invite using the invite code
 * @param {string} inviteCode - The 8-character invite code
 */
export const acceptPartnershipInvite = async (inviteCode) => {
  try {
    const { data, error } = await supabase.rpc('accept_partnership_invite', {
      p_invite_code: inviteCode
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Accept partnership invite error:', error)
    return { data: null, error }
  }
}

/**
 * Get the current user's partnership (if any)
 * Returns partner info and "Together Since" date
 */
export const getUserPartnership = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('get_user_partnership', {
      user_id: user.id
    })
    if (error) throw error

    // RPC returns array, get first result
    const partnership = data && data.length > 0 ? data[0] : null
    return { data: partnership, error: null }
  } catch (error) {
    console.error('Get user partnership error:', error)
    return { data: null, error }
  }
}

/**
 * Get pending partnership invite (if user has sent one)
 */
export const getPendingPartnershipInvite = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('partnerships')
      .select('id, invite_code, created_at')
      .eq('inviter_id', user.id)
      .eq('status', 'pending')
      .single()

    // No error if not found, just return null
    if (error && error.code !== 'PGRST116') throw error

    return { data, error: null }
  } catch (error) {
    console.error('Get pending partnership invite error:', error)
    return { data: null, error }
  }
}

/**
 * Cancel the current partnership
 */
export const cancelPartnership = async () => {
  try {
    const { data, error } = await supabase.rpc('cancel_partnership')
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Cancel partnership error:', error)
    return { data: null, error }
  }
}

/**
 * Validate a partnership invite code (check if it exists and is valid)
 * Uses RPC to avoid exposing partnership data via RLS
 * @param {string} inviteCode - The invite code to validate
 */
export const validatePartnershipCode = async (inviteCode) => {
  try {
    const { data, error } = await supabase.rpc('validate_partnership_code', {
      p_invite_code: inviteCode
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Validate partnership code error:', error)
    return { data: null, error }
  }
}


// =====================================================
// NOTIFICATION OPERATIONS
// =====================================================

/**
 * Get notifications for current user
 * @param {number} limit - Max notifications to return
 * @param {number} offset - Pagination offset
 */
export const getNotifications = async (limit = 50, offset = 0) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const unreadCount = data?.filter(n => !n.read).length || 0
    return { data: { notifications: data, unreadCount }, error: null }
  } catch (error) {
    console.error('Get notifications error:', error)
    return { data: null, error }
  }
}

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: 0, error: null }

    const { data, error } = await supabase.rpc('get_unread_notification_count')
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get unread count error:', error)
    return { data: 0, error }
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Mark notification read error:', error)
    return { error }
  }
}

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async () => {
  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read')
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return { data: null, error }
  }
}

/**
 * Dismiss a notification (hide it)
 * @param {string} notificationId - The notification ID
 */
export const dismissNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ dismissed: true })
      .eq('id', notificationId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Dismiss notification error:', error)
    return { error }
  }
}

/**
 * Subscribe to notifications in real-time
 * @param {function} callback - Called when new notification arrives
 * @returns {Object} Channel object with unsubscribe method
 */
export const subscribeToNotifications = async (callback) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const channel = supabase
    .channel(`notifications:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        callback(payload.new)
      }
    )

  // Wait for subscription to be ready before returning
  // This ensures we don't miss early notifications
  await new Promise((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        resolve()
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('Notification subscription error:', status)
        reject(new Error(`Subscription failed: ${status}`))
      }
    })
  }).catch(err => {
    console.warn('Notification subscription warning:', err.message)
    // Still return the channel even on error - it may reconnect
  })

  // Return the channel so .unsubscribe() can be called
  return channel
}


// =====================================================
// ACTIVITY FEED OPERATIONS
// =====================================================

/**
 * Get activity feed for a roadmap
 * @param {string} roadmapId - The roadmap ID
 * @param {number} limit - Max items to return
 */
export const getActivityFeed = async (roadmapId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get activity feed error:', error)
    return { data: null, error }
  }
}

/**
 * Log an activity to the feed
 * @param {object} activity - Activity data
 */
export const logActivity = async (activity) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    // Get actor name
    let actorName = 'Someone'
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      actorName = profile?.full_name || user.email?.split('@')[0] || 'Someone'
    }

    const { data, error } = await supabase
      .from('activity_feed')
      .insert([{
        roadmap_id: activity.roadmapId,
        actor_id: user?.id,
        actor_name: actorName,
        action_type: activity.actionType,
        target_type: activity.targetType,
        target_id: activity.targetId,
        target_title: activity.targetTitle,
        metadata: activity.metadata || {}
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Log activity error:', error)
    return { data: null, error }
  }
}

/**
 * Subscribe to activity feed in real-time
 * @param {string} roadmapId - The roadmap ID
 * @param {function} callback - Called when new activity arrives
 * @returns {Object} Channel object with unsubscribe method
 */
export const subscribeToActivityFeed = (roadmapId, callback) => {
  const channel = supabase
    .channel(`activity:${roadmapId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed',
        filter: `roadmap_id=eq.${roadmapId}`
      },
      (payload) => {
        callback(payload.new)
      }
    )

  channel.subscribe()

  // Return the channel so .unsubscribe() can be called
  return channel
}


// =====================================================
// NUDGE OPERATIONS
// =====================================================

/**
 * Send a nudge to partner for a task
 * @param {string} taskId - The task to nudge about
 * @param {string} recipientId - The partner's user ID
 * @param {string} message - Optional nudge message
 * @param {string} nudgeType - 'gentle', 'friendly', or 'urgent'
 */
export const sendNudge = async (taskId, recipientId, message = null, nudgeType = 'gentle') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get task info for the notification
    const { data: task } = await supabase
      .from('tasks')
      .select('title, milestone_id')
      .eq('id', taskId)
      .single()

    // Get roadmap_id from milestone
    const { data: milestone } = await supabase
      .from('milestones')
      .select('roadmap_id')
      .eq('id', task?.milestone_id)
      .single()

    // Create the nudge
    const { data, error } = await supabase
      .from('nudges')
      .insert([{
        task_id: taskId,
        roadmap_id: milestone?.roadmap_id,
        sender_id: user.id,
        recipient_id: recipientId,
        message,
        nudge_type: nudgeType
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Send nudge error:', error)
    return { data: null, error }
  }
}

/**
 * Get unread nudges for current user
 */
export const getUnreadNudges = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('nudges')
      .select(`
        *,
        tasks:task_id (
          id,
          title
        )
      `)
      .eq('recipient_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get unread nudges error:', error)
    return { data: null, error }
  }
}

/**
 * Mark nudge as read
 * @param {string} nudgeId - The nudge ID
 */
export const markNudgeRead = async (nudgeId) => {
  try {
    const { error } = await supabase
      .from('nudges')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', nudgeId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Mark nudge read error:', error)
    return { error }
  }
}


// =====================================================
// NOTIFICATION PREFERENCES OPERATIONS
// =====================================================

/**
 * Get notification preferences for current user
 */
export const getNotificationPreferences = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

    // Return defaults if no preferences exist
    if (!data) {
      return {
        data: {
          in_app_enabled: true,
          push_enabled: true,
          email_enabled: true,
          email_weekly_digest: true
        },
        error: null
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return { data: null, error }
  }
}

/**
 * Update notification preferences
 * @param {object} preferences - The preferences to update
 */
export const updateNotificationPreferences = async (preferences) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return { data: null, error }
  }
}


// =====================================================
// PUSH SUBSCRIPTION OPERATIONS
// =====================================================

/**
 * Save push subscription for current user
 * @param {object} subscription - Push subscription data
 */
export const savePushSubscription = async (subscription) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.p256dh_key,
        auth_key: subscription.auth_key,
        device_type: subscription.device_type || 'web',
        active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Save push subscription error:', error)
    return { data: null, error }
  }
}

/**
 * Remove push subscription
 * @param {string} endpoint - The subscription endpoint to remove
 */
export const removePushSubscription = async (endpoint) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Remove push subscription error:', error)
    return { error }
  }
}

/**
 * Get all push subscriptions for current user
 */
export const getPushSubscriptions = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Get push subscriptions error:', error)
    return { data: null, error }
  }
}

/**
 * Deactivate all push subscriptions for current user
 */
export const deactivateAllPushSubscriptions = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('user_id', user.id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Deactivate push subscriptions error:', error)
    return { error }
  }
}


// =====================================================
// EMAIL OPERATIONS
// =====================================================

/**
 * Send an email via the Edge Function
 * @param {string} to - Recipient email address
 * @param {string} type - Email type (partner_invite, task_assigned, nudge, etc.)
 * @param {object} data - Email data (varies by type)
 */
export const sendEmail = async (to, type, data) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: { to, type, data }
    })

    if (error) throw error
    return { data: result, error: null }
  } catch (error) {
    console.error('Send email error:', error)
    return { data: null, error }
  }
}

/**
 * Send partner invite email
 * @param {string} email - Partner's email address
 * @param {object} inviteData - { inviterName, dreamTitle, message, shareCode }
 */
export const sendPartnerInviteEmail = async (email, inviteData) => {
  const inviteUrl = `${window.location.origin}/invite/${inviteData.shareCode}`

  return sendEmail(email, 'partner_invite', {
    inviter_name: inviteData.inviterName,
    dream_title: inviteData.dreamTitle,
    message: inviteData.message,
    share_code: inviteData.shareCode,
    invite_url: inviteUrl
  })
}

/**
 * Send assessment invite email
 * @param {string} email - Partner's email address
 * @param {object} inviteData - { inviterName, partnerName, sessionCode }
 */
export const sendAssessmentInviteEmail = async (email, inviteData) => {
  const inviteUrl = `${window.location.origin}/assessment/join/${inviteData.sessionCode}`

  return sendEmail(email, 'assessment_invite', {
    inviter_name: inviteData.inviterName,
    partner_name: inviteData.partnerName,
    session_code: inviteData.sessionCode,
    invite_url: inviteUrl
  })
}
