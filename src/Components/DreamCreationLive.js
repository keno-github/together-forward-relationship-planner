/**
 * DreamCreationLive - Premium Dream Creation Experience
 *
 * A calm, intentional creation moment. Not a loading screen.
 * Inspired by Apple device setup, Linear workspace sync.
 *
 * Design principles:
 * - Progress through meaning, not percentages
 * - Structured content appearing in layers
 * - Whitespace, pacing, and hierarchy do the work
 * - Subtle warmth and ambient motion
 * - Quiet confidence, no theatrics
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreationProgress, CreationEvent } from '../context/CreationProgressContext';
import { forceCompleteCreation } from '../services/lunaService';

// Conceptual progress phases - human language, not technical
const CONCEPTUAL_PHASES = [
  { id: 'understanding', label: 'Understanding your intention', icon: '✦' },
  { id: 'aligning', label: 'Aligning priorities', icon: '◈' },
  { id: 'shaping', label: 'Shaping the path forward', icon: '◇' },
  { id: 'finalizing', label: 'Finalizing your dream', icon: '❖' },
];

// Map technical phases to conceptual ones
const PHASE_TO_CONCEPT = {
  initializing: 0,
  extracting: 0,
  milestone_generating: 1,
  milestone_ready: 2,
  deep_dive_generating: 2,
  deep_dive_ready: 3,
  finalizing: 3,
  complete: 4,
};

// Luna's restrained guidance - appears sparingly
const LUNA_MOMENTS = {
  aligning: "I'm aligning what matters most to both of you.",
  shaping: "Every great journey needs a thoughtful beginning.",
};

const DreamCreationLive = ({ onComplete, onError, onRetry }) => {
  const {
    progress,
    currentPhase,
    currentMilestone,
    error,
    roadmapData,
    isComplete,
    isError,
    canRetry,
    retry,
    subscribe,
    userContext,
  } = useCreationProgress();

  // UI state for the living preview
  const [revealedSections, setRevealedSections] = useState({
    title: false,
    timeline: false,
    interpretation: false,
    priorities: 0,
  });

  const [isReadyToEnter, setIsReadyToEnter] = useState(false);
  const [showLunaMoment, setShowLunaMoment] = useState(null);
  const [particles, setParticles] = useState([]);

  // Stall detection - if progress doesn't change for 30s, something went wrong
  const [isStalled, setIsStalled] = useState(false);
  const lastProgressRef = React.useRef(progress);
  const stallTimerRef = React.useRef(null);

  // Generate ambient particles on mount
  useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 6,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // STALL DETECTION - Safeguard against incomplete creation flow
  //
  // If progress hasn't changed for 90 seconds and we're not complete,
  // something went wrong (Luna didn't finish the tool sequence).
  // Show error state with retry option.
  //
  // 90 seconds is generous to avoid false positives during slow AI operations.
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Don't check if already complete, errored, or stalled
    if (isComplete || isError || isStalled) {
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
      return;
    }

    // Clear existing timer
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
    }

    // Update last progress reference
    lastProgressRef.current = progress;

    // Set new timer - 90 seconds without progress = stalled
    // This is generous because:
    // - AI tool calls (generate_milestone, generate_deep_dive) can take 15-30+ seconds each
    // - Network latency and database operations add time
    // - Under load, Claude API can be slower
    // 90 seconds catches true stalls without false positives during slow operations
    stallTimerRef.current = setTimeout(() => {
      console.warn('⚠️ Dream creation stalled - no progress for 90 seconds');
      console.warn('   Last progress:', progress, 'Phase:', currentPhase);
      setIsStalled(true);
    }, 90000);

    // Cleanup
    return () => {
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
      }
    };
  }, [progress, isComplete, isError, isStalled, currentPhase]);

  // Determine current conceptual phase
  const conceptualPhaseIndex = useMemo(() => {
    return PHASE_TO_CONCEPT[currentPhase] ?? 0;
  }, [currentPhase]);

  // Progressive reveal of the preview card
  useEffect(() => {
    if (progress >= 10) {
      setRevealedSections(prev => ({ ...prev, title: true }));
    }
    if (progress >= 25) {
      setRevealedSections(prev => ({ ...prev, timeline: true }));
    }
    if (progress >= 40) {
      setRevealedSections(prev => ({ ...prev, interpretation: true }));
    }
    if (progress >= 55) {
      setRevealedSections(prev => ({ ...prev, priorities: 1 }));
    }
    if (progress >= 70) {
      setRevealedSections(prev => ({ ...prev, priorities: 2 }));
    }
    if (progress >= 85) {
      setRevealedSections(prev => ({ ...prev, priorities: 3 }));
    }
  }, [progress]);

  // Luna's restrained appearances
  useEffect(() => {
    if (conceptualPhaseIndex === 1 && !showLunaMoment) {
      setTimeout(() => setShowLunaMoment('aligning'), 800);
    } else if (conceptualPhaseIndex === 2 && showLunaMoment === 'aligning') {
      setTimeout(() => setShowLunaMoment('shaping'), 1200);
    }
  }, [conceptualPhaseIndex, showLunaMoment]);

  // Handle completion - let UI settle before enabling CTA
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        setIsReadyToEnter(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  // Subscribe to error events
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.type === CreationEvent.CREATION_FAILED && onError) {
        onError(event.data?.error);
      }
    });
    return unsubscribe;
  }, [subscribe, onError]);

  const handleEnterDream = useCallback(() => {
    if (onComplete) {
      onComplete(roadmapData);
    }
  }, [onComplete, roadmapData]);

  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    // Reset UI state
    setRevealedSections({ title: false, timeline: false, interpretation: false, priorities: 0 });
    setShowLunaMoment(null);
    setIsReadyToEnter(false);
    setIsStalled(false);
    lastProgressRef.current = 0;
    setIsRetrying(true);

    // If we have milestone data, try to force-complete the creation
    if (currentMilestone && currentMilestone.id) {
      console.log('🔄 Attempting force-complete with existing milestone:', currentMilestone.title);

      try {
        const result = await forceCompleteCreation(currentMilestone, userContext || {});

        if (result.success) {
          console.log('✅ Force-complete succeeded!');
          // onComplete will be called via CREATION_COMPLETE event
        }
      } catch (error) {
        console.error('❌ Force-complete failed:', error);
        // If force-complete fails, fall back to onRetry (back to chat)
        if (onRetry) {
          onRetry();
        }
      } finally {
        setIsRetrying(false);
      }
    } else {
      // No milestone data - must go back to chat
      console.log('⚠️ No milestone data for force-complete, navigating back to chat');
      setIsRetrying(false);
      if (onRetry) {
        onRetry();
      } else {
        retry();
      }
    }
  }, [currentMilestone, userContext, onRetry, retry]);

  // Extract preview data from milestone and user context
  const previewData = useMemo(() => {
    const milestone = currentMilestone || roadmapData?.milestones?.[0] || {};

    // Determine if a real timeline was specified by the user
    const wasTimelineSpecified =
      milestone.timeline_specified === true ||
      userContext?.timelineSpecified === true ||
      (milestone.total_timeline_months && milestone.total_timeline_months > 0) ||
      (userContext?.timelineMonths && userContext.timelineMonths > 0);

    // Get timeline only if it was actually specified
    const getTimeline = () => {
      if (!wasTimelineSpecified) {
        return null; // Don't show fake timeline
      }

      // 1. Check milestone's total_timeline_months (from roadmap architect)
      if (milestone.total_timeline_months) {
        return `${milestone.total_timeline_months} months`;
      }
      // 2. Check userContext.timelineMonths (from Luna's input)
      if (userContext?.timelineMonths) {
        return `${userContext.timelineMonths} months`;
      }
      // 3. Check milestone.timelineMonths (from generating phase)
      if (milestone.timelineMonths) {
        return `${milestone.timelineMonths} months`;
      }
      // 4. Check milestone.duration (string format like "18 months")
      if (milestone.duration && typeof milestone.duration === 'string') {
        return milestone.duration;
      }
      return null;
    };

    const timeline = getTimeline();

    // Build dynamic context based on what we know
    const buildContextItems = () => {
      const items = [];

      // Partner names if available
      if (userContext?.partner1 && userContext?.partner2) {
        items.push(`A journey for ${userContext.partner1} & ${userContext.partner2}`);
      }

      // Location if available
      if (userContext?.location || milestone.location) {
        items.push(`Based in ${userContext?.location || milestone.location}`);
      }

      // Budget context if available
      if (userContext?.budget || milestone.estimatedCost) {
        const budget = userContext?.budget || milestone.estimatedCost;
        if (typeof budget === 'number' && budget > 0) {
          items.push(`Budget: $${budget.toLocaleString()}`);
        }
      }

      // Fallback items if we don't have specific context
      if (items.length === 0) {
        items.push('Building your roadmap');
        items.push('Personalizing your journey');
      }

      return items;
    };

    return {
      title: typeof milestone.title === 'string' ? milestone.title : 'Your Dream',
      timeline,
      interpretation: milestone.description || 'A shared vision taking shape',
      contextItems: buildContextItems(),
    };
  }, [currentMilestone, roadmapData, userContext]);

  // Error or Stalled state
  if (isError || isStalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFCF9] via-[#FBF9F4] to-[#F9F6F0] flex items-center justify-center px-4 py-8 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
            <span className="text-2xl">{isStalled ? '◇' : '✧'}</span>
          </div>
          <p className="text-stone-400 text-sm tracking-wide uppercase mb-4">
            {isStalled ? 'Creation paused' : 'Something didn\'t go as planned'}
          </p>
          <p className="text-stone-600 text-lg mb-8 leading-relaxed">
            {isStalled
              ? 'The dream creation process stopped unexpectedly. Let\'s try that again.'
              : 'We couldn\'t finish shaping your dream. This happens sometimes.'}
          </p>
          {(canRetry || isStalled) && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-8 py-4 bg-stone-900 text-white rounded-full text-base font-medium hover:bg-stone-800 transition-all duration-300 shadow-lg shadow-stone-900/10 disabled:opacity-70 disabled:cursor-wait flex items-center gap-2 mx-auto"
            >
              {isRetrying ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    ◇
                  </motion.span>
                  Retrying...
                </>
              ) : (
                'Try again'
              )}
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCF9] via-[#FBF9F4] to-[#F9F6F0] flex flex-col items-center py-8 px-4 sm:px-6 sm:py-12 md:justify-center relative overflow-x-hidden overflow-y-auto">
      {/*
        Mobile-first layout:
        - overflow-y-auto: Allow vertical scrolling
        - overflow-x-hidden: Prevent horizontal scroll from decorative elements
        - py-8 on mobile, py-12 on sm+: Safe padding top/bottom
        - md:justify-center: Only center vertically on desktop
      */}

      {/* Ambient floating particles - contained within fixed bounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              background: 'rgba(217, 119, 6, 0.15)',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Warm gradient orbs - fixed position so they don't scroll with content */}
      <motion.div
        className="fixed top-0 right-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full opacity-30 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-0 left-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full opacity-20 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(217,119,6,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Main content container */}
      <div className="max-w-lg w-full relative z-10 flex-shrink-0">

        {/* Header with subtle glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center mb-10"
        >
          {/* Glowing orb icon */}
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(217,119,6,0.05) 100%)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(251,191,36,0.1)',
                '0 0 40px rgba(251,191,36,0.15)',
                '0 0 20px rgba(251,191,36,0.1)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.span
              className="text-amber-600/70 text-xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              ✦
            </motion.span>
          </motion.div>

          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.p
                key="creating"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
                className="text-stone-500 text-sm tracking-[0.2em] uppercase"
              >
                Shaping your dream
              </motion.p>
            ) : (
              <motion.p
                key="ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-amber-700 text-sm tracking-[0.2em] uppercase font-medium"
              >
                Your dream is ready
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Living Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 shadow-xl shadow-stone-900/5 overflow-hidden mb-8"
        >
          <div className="p-8">
            {/* Dream Title */}
            <AnimatePresence>
              {revealedSections.title && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                  className="mb-5"
                >
                  <h2
                    className="text-2xl font-semibold text-stone-900 leading-tight"
                    style={{ fontFamily: 'Georgia, Cambria, serif' }}
                  >
                    {previewData.title}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeline Badge - only show if user specified a timeline */}
            <AnimatePresence>
              {revealedSections.timeline && previewData.timeline && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="mb-5"
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-amber-800 text-sm font-medium">
                      {previewData.timeline} journey
                    </span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interpretation */}
            <AnimatePresence>
              {revealedSections.interpretation && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="mb-6"
                >
                  <p className="text-stone-600 text-base leading-relaxed">
                    {previewData.interpretation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Context Items */}
            <AnimatePresence>
              {revealedSections.priorities > 0 && previewData.contextItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="pt-5 border-t border-stone-100"
                >
                  <p className="text-stone-400 text-xs uppercase tracking-wider mb-4">
                    Your dream
                  </p>
                  <div className="space-y-2.5">
                    {previewData.contextItems.slice(0, revealedSections.priorities).map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: idx * 0.15,
                          ease: [0.23, 1, 0.32, 1]
                        }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-amber-500 text-xs">✓</span>
                        <span className="text-stone-700 text-sm">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Placeholder skeleton */}
            {!revealedSections.title && (
              <div className="space-y-4">
                <div className="h-7 bg-gradient-to-r from-stone-100 to-stone-50 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gradient-to-r from-stone-50 to-transparent rounded w-1/3 animate-pulse" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress Steps - Horizontal elegant line */}
        <AnimatePresence>
          {!isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              {/* Current phase text */}
              <div className="text-center mb-4">
                <motion.p
                  key={conceptualPhaseIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-stone-500 text-sm"
                >
                  {CONCEPTUAL_PHASES[Math.min(conceptualPhaseIndex, CONCEPTUAL_PHASES.length - 1)]?.label}
                </motion.p>
              </div>

              {/* Progress bar */}
              <div className="relative h-1 bg-stone-100 rounded-full overflow-hidden mx-8">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${(conceptualPhaseIndex / CONCEPTUAL_PHASES.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              {/* Step dots */}
              <div className="flex justify-between mt-3 px-8">
                {CONCEPTUAL_PHASES.map((phase, idx) => {
                  const isActive = idx === conceptualPhaseIndex;
                  const isCompleted = idx < conceptualPhaseIndex;

                  return (
                    <motion.div
                      key={phase.id}
                      className="flex flex-col items-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                    >
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full"
                        animate={{
                          backgroundColor: isCompleted || isActive ? '#d97706' : '#e7e5e4',
                          scale: isActive ? 1.2 : 1,
                          boxShadow: isActive ? '0 0 8px rgba(217,119,6,0.4)' : 'none',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Luna's Presence */}
        <AnimatePresence>
          {showLunaMoment && !isComplete && LUNA_MOMENTS[showLunaMoment] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="text-center mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-stone-200/40">
                <span className="text-amber-500 text-xs">✦</span>
                <p className="text-stone-500 text-sm italic">
                  {LUNA_MOMENTS[showLunaMoment]}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion CTA */}
        <AnimatePresence>
          {isReadyToEnter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="text-center"
            >
              <motion.button
                onClick={handleEnterDream}
                className="px-10 py-4 bg-stone-900 text-white rounded-full text-base font-medium transition-all duration-300"
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
              >
                Enter your dream
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Brand mark - part of document flow for mobile scrolling */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="mt-8 sm:mt-12 text-stone-300 text-xs tracking-widest uppercase text-center relative z-10"
        style={{
          // Use CSS safe-area-inset for proper bottom padding on all devices
          // - iOS with home indicator: adds ~34px
          // - iOS without / Android / Desktop: adds 0
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))'
        }}
      >
        Twogether Forward
      </motion.p>
    </div>
  );
};

export default DreamCreationLive;
