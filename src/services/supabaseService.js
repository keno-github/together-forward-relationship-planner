import { supabase } from '../config/supabaseClient'

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
    return { data, error: null }
  } catch (error) {
    console.error('Create roadmap error:', error)
    return { data: null, error }
  }
}

/**
 * Get all roadmaps for the current user
 */
export const getUserRoadmaps = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
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
    const { data, error } = await supabase
      .from('milestones')
      .insert([milestoneData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Create milestone error:', error)
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
    return { data, error: null }
  } catch (error) {
    console.error('❌ Get milestones error:', error)
    return { data: null, error }
  }
}

/**
 * Update a milestone
 */
export const updateMilestone = async (milestoneId, updates) => {
  try {
    console.log('💾 updateMilestone called:');
    console.log('   - milestoneId:', milestoneId);
    console.log('   - updates:', updates);

    if (updates.budget_amount !== undefined) {
      console.log('   🔴 BUDGET UPDATE: Setting budget_amount to', updates.budget_amount);
    }

    const { data, error } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', milestoneId)
      .select()
      .single()

    if (error) {
      console.error('❌ Update milestone failed:', error);
      throw error;
    }

    console.log('✅ Update milestone success! Returned data:');
    console.log('   - budget_amount:', data.budget_amount);
    console.log('   - target_date:', data.target_date);

    return { data, error: null }
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
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)

    if (error) throw error
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
 * Create a new task
 */
export const createTask = async (taskData) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single()

    if (error) throw error
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
 */
export const updateTask = async (taskId, updates) => {
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
    return { data, error: null }
  } catch (error) {
    console.error('Update task error:', error)
    return { data: null, error }
  }
}

/**
 * Delete a task
 */
export const deleteTask = async (taskId) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
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
// EXPENSE OPERATIONS
// =====================================================

/**
 * Create a new expense
 */
export const createExpense = async (expenseData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: user.id,
        ...expenseData
      }])
      .select()
      .single()

    if (error) throw error
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
 */
export const updateExpense = async (expenseId, updates) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Update expense error:', error)
    return { data: null, error }
  }
}

/**
 * Delete an expense
 */
export const deleteExpense = async (expenseId) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (error) throw error
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
 */
export const createUserProfile = async (userId, profileData = {}) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        email: profileData.email || null,
        full_name: profileData.full_name || null,
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
 */
export const getOrCreateUserProfile = async (userId, profileData = {}) => {
  try {
    const { data: existingProfile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (existingProfile) {
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
        deep_dive_data: milestone.deepDiveData || {},
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
