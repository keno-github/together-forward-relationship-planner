import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CheckCircle2, Circle, Clock, AlertCircle,
  ArrowRight, ChevronDown, ChevronRight, Target, Zap, Flag
} from 'lucide-react';

const TimelineView = ({ milestone, onUpdateProgress }) => {
  const [expandedStep, setExpandedStep] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState('all');

  // Transform steps into timeline phases
  const createTimelinePhases = () => {
    if (!milestone?.detailedSteps) return [];

    // Group steps into phases based on timeline
    const phases = [
      {
        id: 'phase-1',
        name: 'Planning & Research',
        duration: '1-2 months',
        color: '#3B82F6',
        startWeek: 0,
        endWeek: 8,
        steps: milestone.detailedSteps.slice(0, 3) || []
      },
      {
        id: 'phase-2',
        name: 'Decision Making',
        duration: '1-3 months',
        color: '#8B5CF6',
        startWeek: 8,
        endWeek: 20,
        steps: milestone.detailedSteps.slice(3, 6) || []
      },
      {
        id: 'phase-3',
        name: 'Execution',
        duration: '3-6 months',
        color: '#10B981',
        startWeek: 20,
        endWeek: 44,
        steps: milestone.detailedSteps.slice(6, 9) || []
      },
      {
        id: 'phase-4',
        name: 'Finalization',
        duration: '1-2 months',
        color: '#F59E0B',
        startWeek: 44,
        endWeek: 52,
        steps: milestone.detailedSteps.slice(9) || []
      }
    ];

    return phases.filter(phase => phase.steps.length > 0);
  };

  const phases = createTimelinePhases();

  // Calculate overall progress
  const calculateProgress = () => {
    if (!milestone?.detailedSteps) return 0;
    const total = milestone.detailedSteps.length;
    const completed = milestone.detailedSteps.filter(s => s.completed).length;
    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  // Get current phase based on progress
  const getCurrentPhase = () => {
    const progressWeek = Math.floor((progress / 100) * 52);
    return phases.find(p => progressWeek >= p.startWeek && progressWeek < p.endWeek) || phases[0];
  };

  const currentPhase = getCurrentPhase();

  // Toggle step expansion
  const toggleStep = (stepId) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  // Filter steps by phase
  const filteredPhases = selectedPhase === 'all'
    ? phases
    : phases.filter(p => p.id === selectedPhase);

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{color: '#2B2B2B'}}>
              Your Journey Timeline
            </h2>
            <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
              Track your progress through each phase of this milestone
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium mb-1" style={{color: '#2B2B2B', opacity: 0.7}}>
              Overall Progress
            </div>
            <div className="text-4xl font-bold" style={{color: '#C084FC'}}>
              {progress}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full h-4 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{background: 'linear-gradient(90deg, #C084FC, #F8C6D0)'}}
            />
          </div>

          {/* Phase Markers on Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-4 flex">
            {phases.map((phase, index) => (
              <div
                key={phase.id}
                className="h-full border-r-2 border-white/50"
                style={{
                  width: `${((phase.endWeek - phase.startWeek) / 52) * 100}%`
                }}
              />
            ))}
          </div>
        </div>

        {/* Phase Labels */}
        <div className="flex justify-between mt-2 text-xs" style={{color: '#2B2B2B', opacity: 0.6}}>
          <span>Start</span>
          {phases.map((phase, index) => (
            <span key={phase.id}>{phase.name}</span>
          ))}
          <span>Complete</span>
        </div>
      </div>

      {/* Current Phase Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
        style={{borderLeft: `4px solid ${currentPhase?.color}`}}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{background: `${currentPhase?.color}20`}}
          >
            <Zap className="w-6 h-6" style={{color: currentPhase?.color}} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold" style={{color: '#2B2B2B'}}>
                Current Phase: {currentPhase?.name}
              </h3>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{background: `${currentPhase?.color}20`, color: currentPhase?.color}}
              >
                In Progress
              </span>
            </div>
            <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
              Duration: {currentPhase?.duration} • {currentPhase?.steps.length} steps
            </p>
          </div>
        </div>
      </motion.div>

      {/* Phase Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedPhase('all')}
          className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
            selectedPhase === 'all'
              ? 'text-white'
              : 'glass-card-light'
          }`}
          style={selectedPhase === 'all' ? {background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'} : {color: '#2B2B2B'}}
        >
          All Phases
        </motion.button>
        {phases.map((phase) => (
          <motion.button
            key={phase.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedPhase(phase.id)}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedPhase === phase.id
                ? 'text-white'
                : 'glass-card-light'
            }`}
            style={selectedPhase === phase.id ? {background: phase.color, color: 'white'} : {color: '#2B2B2B'}}
          >
            {phase.name}
          </motion.button>
        ))}
      </div>

      {/* Visual Timeline */}
      <div className="space-y-8">
        {filteredPhases.map((phase, phaseIndex) => (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: phaseIndex * 0.1 }}
            className="relative"
          >
            {/* Phase Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{background: `${phase.color}20`}}
              >
                <Flag className="w-8 h-8" style={{color: phase.color}} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1" style={{color: '#2B2B2B'}}>
                  Phase {phaseIndex + 1}: {phase.name}
                </h3>
                <div className="flex items-center gap-4 text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {phase.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {phase.steps.length} steps
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Week {phase.startWeek} - {phase.endWeek}
                  </span>
                </div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="ml-8 border-l-4 space-y-6" style={{borderColor: `${phase.color}40`}}>
              {phase.steps.map((step, stepIndex) => {
                const isExpanded = expandedStep === `${phase.id}-${step.step}`;
                const isCompleted = step.completed;
                const stepNumber = step.step;

                return (
                  <motion.div
                    key={stepNumber}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: stepIndex * 0.05 }}
                    className="relative pl-8"
                  >
                    {/* Timeline Dot */}
                    <div
                      className="absolute left-0 top-0 w-8 h-8 rounded-full border-4 flex items-center justify-center -ml-4"
                      style={{
                        borderColor: phase.color,
                        background: isCompleted ? phase.color : 'white'
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <Circle className="w-3 h-3" style={{color: phase.color}} />
                      )}
                    </div>

                    {/* Step Card */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`glass-card rounded-2xl p-5 cursor-pointer transition-all ${
                        isCompleted ? 'opacity-80' : ''
                      }`}
                      onClick={() => toggleStep(`${phase.id}-${step.step}`)}
                    >
                      {/* Step Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="text-sm font-bold px-3 py-1 rounded-full"
                              style={{background: `${phase.color}20`, color: phase.color}}
                            >
                              Step {stepNumber}
                            </span>
                            <h4 className="text-lg font-bold" style={{color: '#2B2B2B'}}>
                              {step.title}
                            </h4>
                          </div>
                          <p className="text-sm mb-3" style={{color: '#2B2B2B', opacity: 0.7}}>
                            {step.description}
                          </p>

                          {/* Step Meta */}
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1" style={{color: '#2B2B2B', opacity: 0.6}}>
                              <Clock className="w-3 h-3" />
                              {step.duration}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full font-semibold ${
                                step.difficulty === 'easy'
                                  ? 'bg-green-100 text-green-700'
                                  : step.difficulty === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {step.difficulty}
                            </span>
                            {step.dependencies && (
                              <span className="flex items-center gap-1" style={{color: '#2B2B2B', opacity: 0.6}}>
                                <AlertCircle className="w-3 h-3" />
                                Depends on Step {step.dependencies.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-5 h-5" style={{color: phase.color}} />
                        </motion.div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-white/20 space-y-4">
                              {/* Action Items */}
                              {step.actionItems && (
                                <div>
                                  <h5 className="text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                                    📋 Action Items:
                                  </h5>
                                  <div className="space-y-2">
                                    {step.actionItems.map((item, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2 text-sm glass-card-light rounded-lg p-2"
                                      >
                                        <input
                                          type="checkbox"
                                          className="w-4 h-4 rounded"
                                          style={{accentColor: phase.color}}
                                        />
                                        <span style={{color: '#2B2B2B'}}>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Key Considerations */}
                              {step.considerations && (
                                <div>
                                  <h5 className="text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                                    💡 Key Considerations:
                                  </h5>
                                  <ul className="space-y-1 text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                                    {step.considerations.map((item, i) => (
                                      <li key={i}>• {item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Resources */}
                              {step.resources && (
                                <div>
                                  <h5 className="text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                                    🔗 Helpful Resources:
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {step.resources.map((resource, i) => (
                                      <span
                                        key={i}
                                        className="text-xs px-3 py-1 rounded-full glass-card-light"
                                        style={{color: phase.color}}
                                      >
                                        {resource}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Mark Complete Button */}
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                                style={{background: isCompleted ? '#6B7280' : phase.color}}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle completion toggle
                                }}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-5 h-5" />
                                    Mark as Complete
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Arrow to Next Step */}
                    {stepIndex < phase.steps.length - 1 && (
                      <div className="flex items-center gap-2 mt-4 mb-2 ml-8 text-sm" style={{color: phase.color, opacity: 0.5}}>
                        <ArrowRight className="w-4 h-4" />
                        <span>Then</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Phase Complete Indicator */}
            {phaseIndex < phases.length - 1 && (
              <div className="flex items-center justify-center my-8">
                <div
                  className="px-6 py-3 rounded-full font-semibold flex items-center gap-2"
                  style={{background: `${phases[phaseIndex + 1].color}20`, color: phases[phaseIndex + 1].color}}
                >
                  <ArrowRight className="w-5 h-5" />
                  Continue to {phases[phaseIndex + 1].name}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Completion Celebration */}
      {progress === 100 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-2xl p-8 text-center"
          style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Congratulations!
          </h3>
          <p className="text-white/90">
            You've completed all steps for this milestone. Time to celebrate! 🎊
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default TimelineView;
