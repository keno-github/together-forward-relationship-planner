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

    console.log('📊 Database response - data:', data);
    console.log('📊 Database response - error:', error);
    console.log('📊 Number of milestones found:', data?.length || 0);

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
    const { data, error } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', milestoneId)
      .select()
      .single()

    if (error) throw error
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
    return { data, error: null }
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
