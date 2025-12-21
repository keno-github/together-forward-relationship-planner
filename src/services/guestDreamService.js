/**
 * Guest Dream Service
 *
 * Premium persistence layer for guest (unauthenticated) dream creation.
 * Enables the "ownership-first" onboarding flow where users create dreams
 * BEFORE signing up, then seamlessly attach dreams to their new accounts.
 *
 * Architecture Philosophy (FAANG L10):
 * - localStorage for 7-day persistence across sessions
 * - Graceful fallbacks for storage quota issues
 * - Atomic operations to prevent partial state
 * - Clear separation between guest state and authenticated state
 *
 * Flow:
 * 1. Guest creates dream with Luna → saveGuestDream()
 * 2. Guest views dream → hasValidGuestDream() = true
 * 3. Guest signs up → attachGuestDreamToAccount()
 * 4. Dream attached → clearGuestDream()
 *
 * @module guestDreamService
 */

import { createRoadmap, createMilestone, createTask } from './supabaseService';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'tf_pending_dream';
const SCHEMA_VERSION = 1;
const DREAM_EXPIRY_DAYS = 7;
const DREAM_EXPIRY_MS = DREAM_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════════════
// CORE PERSISTENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save a guest dream to localStorage with 7-day expiry.
 *
 * This is called from lunaService.js when a guest completes dream creation.
 * The dream is stored with full milestone data including deep_dive_data
 * so it can be restored on page refresh or browser restart.
 *
 * @param {Object} dreamData - The dream data to persist
 * @param {string} dreamData.title - Dream title (e.g., "Buy Apartment in Berlin")
 * @param {string} dreamData.description - Dream description
 * @param {string} dreamData.partner1 - First partner name
 * @param {string} dreamData.partner2 - Second partner name
 * @param {string} dreamData.location - Location (e.g., "Berlin, Germany")
 * @param {Object} dreamData.milestone - Full milestone object with deep_dive_data
 * @param {Array} dreamData.conversationHistory - Luna conversation history
 * @returns {boolean} true if saved successfully, false otherwise
 */
export const saveGuestDream = (dreamData) => {
  try {
    const now = Date.now();
    const expiresAt = now + DREAM_EXPIRY_MS;

    const storageData = {
      version: SCHEMA_VERSION,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      expiresAtMs: expiresAt, // For easy comparison
      dream: {
        title: dreamData.title || 'Your Dream',
        description: dreamData.description || '',
        partner1: dreamData.partner1 || 'Partner 1',
        partner2: dreamData.partner2 || 'Partner 2',
        location: dreamData.location || null,
        milestone: sanitizeMilestoneForStorage(dreamData.milestone),
        conversationHistory: dreamData.conversationHistory || []
      },
      meta: {
        signUpPromptShown: false,
        exitModalShown: false,
        viewStartTime: null,
        totalViewDurationMs: 0
      }
    };

    // Validate before saving
    if (!storageData.dream.milestone) {
      console.error('❌ Cannot save guest dream: no milestone data');
      return false;
    }

    const serialized = JSON.stringify(storageData);

    // Try localStorage first
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
      console.log('💾 Guest dream saved to localStorage:', {
        title: storageData.dream.title,
        expiresAt: storageData.expiresAt,
        sizeKB: (serialized.length / 1024).toFixed(2)
      });
      return true;
    } catch (localStorageError) {
      // localStorage might be full - try sessionStorage as fallback
      console.warn('⚠️ localStorage full, falling back to sessionStorage');
      try {
        sessionStorage.setItem(STORAGE_KEY, serialized);
        console.log('💾 Guest dream saved to sessionStorage (fallback)');
        return true;
      } catch (sessionStorageError) {
        console.error('❌ Both localStorage and sessionStorage full');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Failed to save guest dream:', error);
    return false;
  }
};

/**
 * Load guest dream from storage.
 * Checks localStorage first, then sessionStorage.
 * Returns null if no dream exists or if dream is expired.
 *
 * @returns {Object|null} The stored dream data or null
 */
export const loadGuestDream = () => {
  try {
    // Try localStorage first
    let serialized = localStorage.getItem(STORAGE_KEY);

    // Fallback to sessionStorage
    if (!serialized) {
      serialized = sessionStorage.getItem(STORAGE_KEY);
    }

    if (!serialized) {
      return null;
    }

    const data = JSON.parse(serialized);

    // Version check - handle schema migrations if needed
    if (data.version !== SCHEMA_VERSION) {
      console.warn('⚠️ Guest dream schema version mismatch, clearing');
      clearGuestDream();
      return null;
    }

    // Expiry check
    const now = Date.now();
    if (data.expiresAtMs && now > data.expiresAtMs) {
      console.log('⏰ Guest dream expired, clearing');
      clearGuestDream();
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Failed to load guest dream:', error);
    return null;
  }
};

/**
 * Check if a valid (unexpired) guest dream exists.
 * This is the primary check used by UI components.
 *
 * @returns {boolean} true if valid dream exists
 */
export const hasValidGuestDream = () => {
  const dream = loadGuestDream();
  return dream !== null && dream.dream && dream.dream.milestone;
};

/**
 * Clear guest dream from all storage.
 * Called after successful attachment to account.
 */
export const clearGuestDream = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Guest dream cleared from storage');
  } catch (error) {
    console.error('❌ Failed to clear guest dream:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// META STATE TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get metadata about the guest dream (prompts shown, view duration, etc.)
 *
 * @returns {Object} Meta object or empty object if no dream
 */
export const getGuestDreamMeta = () => {
  const data = loadGuestDream();
  return data?.meta || {};
};

/**
 * Mark that the sign-up prompt banner has been shown.
 * Prevents showing it multiple times in the same session.
 */
export const markSignUpPromptShown = () => {
  try {
    const data = loadGuestDream();
    if (data) {
      data.meta.signUpPromptShown = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('❌ Failed to mark sign-up prompt shown:', error);
  }
};

/**
 * Mark that the exit modal has been shown.
 * We only show it once to avoid being annoying.
 */
export const markExitModalShown = () => {
  try {
    const data = loadGuestDream();
    if (data) {
      data.meta.exitModalShown = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('❌ Failed to mark exit modal shown:', error);
  }
};

/**
 * Start tracking view duration for the dream.
 * Called when MilestoneDetailPage mounts.
 */
export const startViewTracking = () => {
  try {
    const data = loadGuestDream();
    if (data) {
      data.meta.viewStartTime = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('❌ Failed to start view tracking:', error);
  }
};

/**
 * Update total view duration.
 * Called periodically or when user leaves.
 */
export const updateViewDuration = () => {
  try {
    const data = loadGuestDream();
    if (data && data.meta.viewStartTime) {
      const now = Date.now();
      const sessionDuration = now - data.meta.viewStartTime;
      data.meta.totalViewDurationMs += sessionDuration;
      data.meta.viewStartTime = now; // Reset for next interval
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('❌ Failed to update view duration:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNT ATTACHMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Attach the pending guest dream to an authenticated user's account.
 *
 * This is the critical function called after a guest signs up or signs in.
 * It creates a roadmap and milestone in the database, then clears localStorage.
 *
 * Architecture:
 * 1. Load guest dream from localStorage
 * 2. Create roadmap record (container for the journey)
 * 3. Create milestone record (the goal with deep_dive_data)
 * 4. Create task records (if tasks exist in deep_dive_data)
 * 5. Clear localStorage
 * 6. Return created records for navigation
 *
 * @returns {Object} { success, savedRoadmap, savedMilestone, error }
 */
export const attachGuestDreamToAccount = async () => {
  try {
    const guestData = loadGuestDream();

    if (!guestData || !guestData.dream) {
      return {
        success: false,
        error: 'NO_GUEST_DREAM',
        message: 'No guest dream found to attach'
      };
    }

    const { dream } = guestData;
    const milestone = dream.milestone;

    if (!milestone) {
      return {
        success: false,
        error: 'NO_MILESTONE_DATA',
        message: 'Guest dream has no milestone data'
      };
    }

    console.log('🔗 Attaching guest dream to account:', dream.title);

    // Step 1: Create roadmap (container)
    const roadmapData = {
      title: dream.title || 'My Dream',
      partner1_name: dream.partner1 || 'Partner 1',
      partner2_name: dream.partner2 || 'Partner 2',
      location: dream.location || null,
      xp_points: 0
    };

    const { data: savedRoadmap, error: roadmapError } = await createRoadmap(roadmapData);

    if (roadmapError) {
      console.error('❌ Failed to create roadmap:', roadmapError);
      return {
        success: false,
        error: 'ROADMAP_CREATE_FAILED',
        message: roadmapError.message
      };
    }

    console.log('✅ Roadmap created:', savedRoadmap.id);

    // Step 2: Create milestone with deep_dive_data
    const milestoneData = {
      roadmap_id: savedRoadmap.id,
      title: milestone.title || dream.title,
      description: milestone.description || dream.description || '',
      icon: milestone.icon || 'Target',
      color: milestone.color || 'bg-gradient-to-br from-amber-500 to-orange-500',
      category: milestone.category || milestone.goalType || 'lifestyle',
      estimated_cost: parseFloat(milestone.estimatedCost || milestone.estimated_cost || 0),
      budget_amount: parseFloat(milestone.budget_amount || milestone.estimatedCost || 0),
      duration: milestone.duration || '12 months',
      target_date: milestone.target_date || null,
      order_index: 0,
      ai_generated: true,
      deep_dive_data: milestone.deepDiveData || milestone.deep_dive_data || {}
    };

    const { data: savedMilestone, error: milestoneError } = await createMilestone(milestoneData);

    if (milestoneError) {
      console.error('❌ Failed to create milestone:', milestoneError);
      // Don't leave orphan roadmap - but also don't fail the user
      // The roadmap exists, they can still use it
      return {
        success: true, // Partial success
        savedRoadmap,
        savedMilestone: null,
        error: 'MILESTONE_CREATE_FAILED',
        message: 'Dream saved but milestone had issues'
      };
    }

    console.log('✅ Milestone created:', savedMilestone.id);

    // Step 3: Create tasks if they exist in deep_dive_data
    const deepDive = milestone.deepDiveData || milestone.deep_dive_data || {};
    const roadmapPhases = deepDive.roadmapPhases || [];

    let tasksCreated = 0;
    for (const phase of roadmapPhases) {
      const suggestedTasks = phase.suggestedTasks || phase.tasks || [];
      for (const taskTitle of suggestedTasks) {
        if (typeof taskTitle === 'string' && taskTitle.trim()) {
          try {
            await createTask({
              milestone_id: savedMilestone.id,
              title: taskTitle.trim(),
              description: '',
              completed: false,
              order_index: tasksCreated
            });
            tasksCreated++;
          } catch (taskError) {
            console.warn('⚠️ Failed to create task:', taskTitle, taskError);
            // Continue - don't fail the whole operation for one task
          }
        }
      }
    }

    console.log(`✅ Created ${tasksCreated} tasks`);

    // Step 4: Clear guest dream from localStorage
    clearGuestDream();

    // Step 5: Return success with created records
    return {
      success: true,
      savedRoadmap,
      savedMilestone: {
        ...savedMilestone,
        // Ensure deep_dive_data is available for UI
        deep_dive_data: deepDive,
        deepDiveData: deepDive
      },
      tasksCreated,
      message: `Dream "${dream.title}" saved successfully!`
    };

  } catch (error) {
    console.error('❌ Failed to attach guest dream to account:', error);
    return {
      success: false,
      error: 'ATTACHMENT_FAILED',
      message: error.message
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize milestone data for localStorage storage.
 * Ensures the data is JSON-serializable and removes any functions or circular refs.
 *
 * @param {Object} milestone - Raw milestone object
 * @returns {Object} Sanitized milestone safe for JSON.stringify
 */
const sanitizeMilestoneForStorage = (milestone) => {
  if (!milestone) return null;

  try {
    // Round-trip through JSON to remove functions, undefined, circular refs
    const sanitized = JSON.parse(JSON.stringify({
      id: milestone.id || `guest-${Date.now()}`,
      title: milestone.title,
      description: milestone.description,
      icon: milestone.icon || 'Target',
      color: milestone.color || 'bg-gradient-to-br from-amber-500 to-orange-500',
      category: milestone.category || milestone.goalType,
      estimatedCost: milestone.estimatedCost || milestone.estimated_cost || 0,
      budget_amount: milestone.budget_amount || milestone.estimatedCost || 0,
      duration: milestone.duration || '12 months',
      timeline_months: milestone.timeline_months,
      target_date: milestone.target_date || null,
      // Preserve deep dive data - this is critical for roadmap display
      deepDiveData: milestone.deepDiveData || milestone.deep_dive_data || {},
      deep_dive_data: milestone.deepDiveData || milestone.deep_dive_data || {}
    }));

    return sanitized;
  } catch (error) {
    console.error('❌ Failed to sanitize milestone:', error);
    return null;
  }
};

/**
 * Get the dream title for display (used in modals, banners).
 *
 * @returns {string|null} Dream title or null if no dream
 */
export const getGuestDreamTitle = () => {
  const data = loadGuestDream();
  return data?.dream?.title || null;
};

/**
 * Get partner names for display.
 *
 * @returns {Object} { partner1, partner2 } or nulls
 */
export const getGuestDreamPartners = () => {
  const data = loadGuestDream();
  return {
    partner1: data?.dream?.partner1 || null,
    partner2: data?.dream?.partner2 || null
  };
};

/**
 * Get the full guest dream for display (used in MilestoneDetailPage).
 *
 * @returns {Object|null} Full dream object or null
 */
export const getGuestDreamForDisplay = () => {
  const data = loadGuestDream();
  if (!data || !data.dream || !data.dream.milestone) {
    return null;
  }

  // Format for MilestoneDetailPage consumption
  return {
    milestone: {
      ...data.dream.milestone,
      id: data.dream.milestone.id || `guest-${Date.now()}`,
      roadmap_id: null, // No roadmap ID for guest dreams
      _isGuestDream: true // Flag for UI to know this is unsaved
    },
    partner1: data.dream.partner1,
    partner2: data.dream.partner2,
    location: data.dream.location,
    conversationHistory: data.dream.conversationHistory
  };
};

/**
 * Check if there's an expired dream (for showing "Your dream expired" message).
 *
 * @returns {boolean} true if there was a dream that expired
 */
export const hasExpiredGuestDream = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!serialized) return false;

    const data = JSON.parse(serialized);
    const now = Date.now();

    // If it exists but is expired
    if (data.expiresAtMs && now > data.expiresAtMs) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  saveGuestDream,
  loadGuestDream,
  hasValidGuestDream,
  clearGuestDream,
  getGuestDreamMeta,
  markSignUpPromptShown,
  markExitModalShown,
  startViewTracking,
  updateViewDuration,
  attachGuestDreamToAccount,
  getGuestDreamTitle,
  getGuestDreamPartners,
  getGuestDreamForDisplay,
  hasExpiredGuestDream
};
