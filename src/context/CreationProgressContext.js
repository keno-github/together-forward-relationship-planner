/**
 * CreationProgressContext - Staff Engineer Level State Machine
 *
 * PURPOSE:
 * Manages the dream creation lifecycle with real-time progress tracking.
 * Enables immediate navigation to live preview while creation continues in background.
 *
 * ARCHITECTURE:
 * - State Machine: IDLE → INITIALIZING → CREATING → FINALIZING → COMPLETE
 * - Event Emitter Pattern: Components subscribe to progress events
 * - Optimistic UI: Navigate immediately, show progress as it happens
 * - Resilient: Handles errors, retries, and edge cases
 *
 * USAGE:
 * ```jsx
 * const { state, progress, milestones, startCreation, subscribe } = useCreationProgress();
 *
 * // Subscribe to real-time updates
 * useEffect(() => {
 *   const unsubscribe = subscribe((event) => {
 *     if (event.type === 'MILESTONE_GENERATED') {
 *       // Animate milestone into view
 *     }
 *   });
 *   return unsubscribe;
 * }, []);
 * ```
 *
 * @module CreationProgressContext
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// STATE MACHINE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const CreationState = {
  IDLE: 'IDLE',                     // No creation in progress
  INITIALIZING: 'INITIALIZING',     // Starting creation (extracting user data)
  CREATING: 'CREATING',             // Generating milestones and deep dives
  FINALIZING: 'FINALIZING',         // Saving to database
  COMPLETE: 'COMPLETE',             // Successfully created
  ERROR: 'ERROR',                   // Creation failed
};

export const CreationEvent = {
  CREATION_STARTED: 'CREATION_STARTED',         // Navigate to live preview
  EXTRACTING_DATA: 'EXTRACTING_DATA',           // Getting user info
  MILESTONE_GENERATING: 'MILESTONE_GENERATING', // Creating goal card
  MILESTONE_GENERATED: 'MILESTONE_GENERATED',   // Goal card ready
  DEEP_DIVE_GENERATING: 'DEEP_DIVE_GENERATING', // Building roadmap phases
  DEEP_DIVE_GENERATED: 'DEEP_DIVE_GENERATED',   // Roadmap phases ready
  FINALIZING: 'FINALIZING',                     // Saving to database
  CREATION_COMPLETE: 'CREATION_COMPLETE',       // All done
  CREATION_FAILED: 'CREATION_FAILED',           // Error occurred
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',           // Generic progress update
};

// Progress weights for each phase (must sum to 100)
const PROGRESS_WEIGHTS = {
  EXTRACTING_DATA: 5,
  MILESTONE_GENERATING: 25,
  MILESTONE_GENERATED: 35,
  DEEP_DIVE_GENERATING: 55,
  DEEP_DIVE_GENERATED: 80,
  FINALIZING: 90,
  CREATION_COMPLETE: 100,
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT & PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

const CreationProgressContext = createContext(null);

export const CreationProgressProvider = ({ children }) => {
  // State machine state
  const [state, setState] = useState(CreationState.IDLE);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [phaseMessage, setPhaseMessage] = useState('');

  // Created milestones (for live preview)
  const [milestones, setMilestones] = useState([]);
  const [currentMilestone, setCurrentMilestone] = useState(null);

  // Error handling
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Final roadmap data (after creation)
  const [roadmapData, setRoadmapData] = useState(null);

  // User context from creation (partner names, timeline, budget, location)
  const [userContext, setUserContext] = useState(null);

  // Event subscribers (for real-time updates)
  const subscribersRef = useRef(new Set());

  // Pending creation context (for retry)
  const creationContextRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT EMITTER
  // ═══════════════════════════════════════════════════════════════════════

  const emit = useCallback((event) => {
    console.log(`📡 CreationProgress: ${event.type}`, event.data || '');
    subscribersRef.current.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in creation progress subscriber:', err);
      }
    });
  }, []);

  const subscribe = useCallback((callback) => {
    subscribersRef.current.add(callback);
    return () => subscribersRef.current.delete(callback);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // STATE TRANSITIONS
  // ═══════════════════════════════════════════════════════════════════════

  const startCreation = useCallback((context = {}) => {
    console.log('🚀 CreationProgress: Starting dream creation');
    creationContextRef.current = context;

    setState(CreationState.INITIALIZING);
    setProgress(0);
    setCurrentPhase('initializing');
    setPhaseMessage('Preparing your dream...');
    setMilestones([]);
    setCurrentMilestone(null);
    setError(null);

    emit({ type: CreationEvent.CREATION_STARTED, data: context });
  }, [emit]);

  const updateProgress = useCallback((eventType, data = {}) => {
    const progressValue = PROGRESS_WEIGHTS[eventType] || progress;

    switch (eventType) {
      case CreationEvent.EXTRACTING_DATA:
        setState(CreationState.INITIALIZING);
        setProgress(PROGRESS_WEIGHTS.EXTRACTING_DATA);
        setCurrentPhase('extracting');
        setPhaseMessage('Learning about you...');
        break;

      case CreationEvent.MILESTONE_GENERATING:
        setState(CreationState.CREATING);
        setProgress(PROGRESS_WEIGHTS.MILESTONE_GENERATING);
        setCurrentPhase('milestone_generating');
        setPhaseMessage(`Creating your goal: "${data.title || 'Your Dream'}"...`);
        setCurrentMilestone({
          title: data.title,
          status: 'generating',
          timelineMonths: data.timelineMonths,
          budget: data.budget,
          location: data.location,
        });
        break;

      case CreationEvent.MILESTONE_GENERATED:
        setProgress(PROGRESS_WEIGHTS.MILESTONE_GENERATED);
        setCurrentPhase('milestone_ready');
        setPhaseMessage('Goal created! Building roadmap...');
        if (data.milestone) {
          setMilestones((prev) => [...prev, { ...data.milestone, status: 'ready' }]);
          setCurrentMilestone({ ...data.milestone, status: 'ready' });
        }
        // Capture user context for display
        if (data.userContext) {
          setUserContext(data.userContext);
        }
        break;

      case CreationEvent.DEEP_DIVE_GENERATING:
        setProgress(PROGRESS_WEIGHTS.DEEP_DIVE_GENERATING);
        setCurrentPhase('deep_dive_generating');
        setPhaseMessage('Mapping out your journey...');
        break;

      case CreationEvent.DEEP_DIVE_GENERATED:
        setProgress(PROGRESS_WEIGHTS.DEEP_DIVE_GENERATED);
        setCurrentPhase('deep_dive_ready');
        setPhaseMessage('Roadmap ready! Saving...');
        if (data.deepDive && data.milestoneId) {
          setMilestones((prev) =>
            prev.map((m) =>
              m.id === data.milestoneId
                ? { ...m, deep_dive_data: data.deepDive, status: 'complete' }
                : m
            )
          );
        }
        break;

      case CreationEvent.FINALIZING:
        setState(CreationState.FINALIZING);
        setProgress(PROGRESS_WEIGHTS.FINALIZING);
        setCurrentPhase('finalizing');
        setPhaseMessage('Saving your dream...');
        break;

      case CreationEvent.CREATION_COMPLETE:
        setState(CreationState.COMPLETE);
        setProgress(100);
        setCurrentPhase('complete');
        setPhaseMessage('Your dream is ready!');
        if (data.roadmapData) {
          setRoadmapData(data.roadmapData);
        }
        break;

      case CreationEvent.CREATION_FAILED:
        setState(CreationState.ERROR);
        setCurrentPhase('error');
        setPhaseMessage(data.message || 'Something went wrong');
        setError(data.error || new Error('Creation failed'));
        break;

      default:
        // Generic progress update
        if (data.progress) setProgress(data.progress);
        if (data.message) setPhaseMessage(data.message);
    }

    emit({ type: eventType, data: { ...data, progress: progressValue } });
  }, [emit, progress]);

  const handleError = useCallback((error, message = 'Creation failed') => {
    console.error('❌ CreationProgress: Error', error);
    updateProgress(CreationEvent.CREATION_FAILED, {
      error,
      message,
      retryAvailable: retryCount < 3,
    });
  }, [updateProgress, retryCount]);

  const retry = useCallback(() => {
    if (retryCount >= 3) {
      console.error('❌ CreationProgress: Max retries exceeded');
      return false;
    }

    setRetryCount((prev) => prev + 1);
    console.log(`🔄 CreationProgress: Retry attempt ${retryCount + 1}/3`);

    // Reset to initial state but preserve context
    startCreation(creationContextRef.current);
    return true;
  }, [retryCount, startCreation]);

  const reset = useCallback(() => {
    console.log('🔄 CreationProgress: Resetting state');
    setState(CreationState.IDLE);
    setProgress(0);
    setCurrentPhase(null);
    setPhaseMessage('');
    setMilestones([]);
    setCurrentMilestone(null);
    setError(null);
    setRetryCount(0);
    setRoadmapData(null);
    setUserContext(null);
    creationContextRef.current = null;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════

  const value = {
    // State
    state,
    progress,
    currentPhase,
    phaseMessage,
    milestones,
    currentMilestone,
    error,
    roadmapData,
    retryCount,
    userContext,

    // Computed
    isCreating: state === CreationState.CREATING || state === CreationState.INITIALIZING || state === CreationState.FINALIZING,
    isComplete: state === CreationState.COMPLETE,
    isError: state === CreationState.ERROR,
    canRetry: state === CreationState.ERROR && retryCount < 3,

    // Actions
    startCreation,
    updateProgress,
    handleError,
    retry,
    reset,
    subscribe,
  };

  return (
    <CreationProgressContext.Provider value={value}>
      {children}
    </CreationProgressContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useCreationProgress = () => {
  const context = useContext(CreationProgressContext);
  if (!context) {
    throw new Error('useCreationProgress must be used within CreationProgressProvider');
  }
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON FOR NON-COMPONENT ACCESS (e.g., lunaService)
// ═══════════════════════════════════════════════════════════════════════════

let globalProgressUpdater = null;

export const setGlobalProgressUpdater = (updater) => {
  globalProgressUpdater = updater;
};

export const emitProgressEvent = (eventType, data = {}) => {
  if (globalProgressUpdater) {
    globalProgressUpdater(eventType, data);
  } else {
    console.warn('CreationProgress: No global updater set, event ignored:', eventType);
  }
};

export default CreationProgressContext;
