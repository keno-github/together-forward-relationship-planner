// RoadmapTreeView.js
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  CheckCircle,
  Clock,
  Lock,
  AlertCircle,
  User,
  Lightbulb,
  TrendingUp,
  DollarSign,
  Calendar,
  Zap,
  Target,
  ArrowRight,
  Flag,
  Plus,
  X,
  Save
} from 'lucide-react';
import { createPhaseTask } from '../services/supabaseService';

/**
 * RoadmapTreeView - Interactive accordion roadmap showing journey phases
 *
 * Features:
 * - Expandable/collapsible phases
 * - Progress indicators (completed, in-progress, locked)
 * - Dependency visualization
 * - Partner assignment display
 * - Smart contextual tips per phase
 * - Critical path highlighting
 * - Add tasks directly to phases
 * - Partner-specific task assignment
 */
const RoadmapTreeView = ({ milestone, tasks = [], userContext, onTaskClick, onTasksUpdated }) => {
  const [expandedPhases, setExpandedPhases] = useState([0]); // First phase expanded by default
  const [addingTaskToPhase, setAddingTaskToPhase] = useState(null); // Track which phase is adding a task
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium'
  });

  // Use Luna-generated roadmap phases from deep_dive_data
  const phases = useMemo(() => {
    console.log('🔍 RoadmapTreeView checking for phases in milestone:', milestone.title);
    console.log('🔍 milestone.deepDiveData exists?', !!milestone.deepDiveData);
    console.log('🔍 milestone.deep_dive_data exists?', !!milestone.deep_dive_data);
    console.log('🔍 All milestone keys:', Object.keys(milestone));

    // PRIORITY 1: Check both deepDiveData (camelCase) and deep_dive_data (snake_case)
    const deepDive = milestone.deepDiveData || milestone.deep_dive_data;
    console.log('🔍 deepDive exists?', !!deepDive);
    if (deepDive) {
      console.log('🔍 deepDive keys:', Object.keys(deepDive));
    }

    const roadmapPhases = deepDive?.roadmapPhases;

    if (roadmapPhases && roadmapPhases.length > 0) {
      console.log('✨ Using Luna-generated roadmap phases:', roadmapPhases.length);
      // Map Luna phases to component format and attach tasks
      return roadmapPhases.map((phase, idx) => ({
        ...phase,
        // Attach tasks linked to this specific phase index
        tasks: tasks.filter(task => {
          // First priority: tasks explicitly linked to this phase
          if (task.roadmap_phase_index === idx) {
            return true;
          }
          // Fallback: tasks without phase assignment - try keyword matching
          if (task.roadmap_phase_index === null || task.roadmap_phase_index === undefined) {
            const phaseKeywords = phase.title.toLowerCase().split(' ');
            const taskTitle = (task.title || task.description || '').toLowerCase();
            return phaseKeywords.some(keyword => keyword.length > 3 && taskTitle.includes(keyword));
          }
          return false;
        })
      }));
    }

    // If no Luna phases, this is an error state
    console.error('❌ No roadmap phases found in milestone deep dive data');
    console.error('   Milestone:', milestone.title);
    console.error('   Has deepDiveData:', !!milestone.deepDiveData);
    console.error('   Has deep_dive_data:', !!milestone.deep_dive_data);
    console.error('   Deep dive keys:', deepDive ? Object.keys(deepDive) : 'none');

    // Return null to signal generation failure
    return null;
  }, [milestone, tasks]);

  const togglePhase = (phaseIndex) => {
    setExpandedPhases(prev =>
      prev.includes(phaseIndex)
        ? prev.filter(i => i !== phaseIndex)
        : [...prev, phaseIndex]
    );
  };

  const handleAddTaskClick = (phaseIndex) => {
    setAddingTaskToPhase(phaseIndex);
    setNewTaskForm({
      title: '',
      description: '',
      assigned_to: '',
      priority: 'medium'
    });
  };

  const handleCancelAddTask = () => {
    setAddingTaskToPhase(null);
    setNewTaskForm({
      title: '',
      description: '',
      assigned_to: '',
      priority: 'medium'
    });
  };

  const handleSaveTask = async (phaseIndex) => {
    if (!newTaskForm.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      const taskData = {
        milestone_id: milestone.id,
        title: newTaskForm.title,
        description: newTaskForm.description || '',
        assigned_to: newTaskForm.assigned_to || null,
        priority: newTaskForm.priority,
        completed: false,
        ai_generated: false,
        order_index: 0
      };

      const { data, error } = await createPhaseTask(taskData, phaseIndex);

      if (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task. Please try again.');
        return;
      }

      console.log('✅ Task created successfully:', data);

      // Reset form
      handleCancelAddTask();

      // Notify parent to reload tasks
      if (onTasksUpdated) {
        onTasksUpdated();
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('An error occurred while creating the task.');
    }
  };

  const getPhaseStatus = (phase, phaseIndex) => {
    // Check if previous phase is completed (for dependency visualization)
    const hasDependency = phaseIndex > 0;
    const previousPhaseCompleted = !hasDependency || (phases[phaseIndex - 1]?.tasks?.every(t => t.completed));

    if (!phase.tasks || phase.tasks.length === 0) {
      // No tasks yet, show as pending (not locked)
      return previousPhaseCompleted ? 'pending' : 'waiting';
    }

    const allCompleted = phase.tasks.every(t => t.completed);
    const someInProgress = phase.tasks.some(t => !t.completed && t.started);

    if (allCompleted) return 'completed';
    if (someInProgress) return 'in-progress';
    if (previousPhaseCompleted) return 'pending';
    return 'waiting'; // Waiting for previous phase
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-purple-500 animate-pulse" />;
      case 'waiting':
        return <Lock className="w-5 h-5 text-gray-400" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'in-progress':
        return 'bg-purple-100 border-purple-300';
      case 'waiting':
        return 'bg-gray-100 border-gray-300';
      case 'pending':
        return 'bg-blue-100 border-blue-300';
      default:
        return 'bg-yellow-100 border-yellow-300';
    }
  };

  // Show error state if no roadmap was generated
  if (phases === null) {
    return (
      <div className="space-y-4 p-6">
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-8 text-center">
          <Lightbulb className="w-16 h-16 mx-auto mb-4 text-purple-600" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Roadmap Not Generated
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Luna hasn't created a personalized roadmap for "{milestone.title}" yet.
            This usually happens if the generation was interrupted or failed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Refresh Page
            </button>
            <button
              onClick={() => alert('Chat with Luna feature coming soon!')}
              className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
            >
              Chat with Luna to Generate
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            If this issue persists, please contact support
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#2B2B2B' }}>
            Journey Roadmap
          </h2>
          <p className="text-sm mt-1" style={{ color: '#2B2B2B', opacity: 0.7 }}>
            Your step-by-step path to {milestone.title?.toLowerCase()}
          </p>
        </div>

        {/* Progress Summary */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: '#C084FC' }}>
              {calculateOverallProgress(phases)}%
            </div>
            <div className="text-xs" style={{ color: '#2B2B2B', opacity: 0.6 }}>
              Overall Progress
            </div>
          </div>
        </div>
      </div>

      {/* Phases Accordion */}
      <div className="space-y-3">
        {phases.map((phase, phaseIndex) => {
          const status = getPhaseStatus(phase, phaseIndex);
          const isExpanded = expandedPhases.includes(phaseIndex);
          const isWaiting = status === 'waiting';
          const progress = calculatePhaseProgress(phase);

          return (
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIndex * 0.1 }}
              className={`glass-card rounded-2xl overflow-hidden ${
                phase.isCriticalPath ? 'ring-2 ring-purple-400' : ''
              }`}
            >
              {/* Phase Header */}
              <button
                onClick={() => togglePhase(phaseIndex)}
                className={`w-full p-5 flex items-center justify-between smooth-transition hover:glass-card-strong cursor-pointer ${
                  isWaiting ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Phase Number Badge */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getStatusColor(
                      status
                    )} border-2`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      phaseIndex + 1
                    )}
                  </div>

                  {/* Phase Info */}
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold" style={{ color: '#2B2B2B' }}>
                        {phase.title}
                      </h3>
                      {phase.isCriticalPath && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: '#2B2B2B', opacity: 0.7 }}>
                      {phase.description}
                    </p>

                    {/* Phase Metadata */}
                    <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#2B2B2B', opacity: 0.6 }}>
                      {phase.duration && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{phase.duration}</span>
                        </div>
                      )}
                      {phase.estimatedCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>€{phase.estimatedCost.toLocaleString()}</span>
                        </div>
                      )}
                      {phase.tasks && phase.tasks.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{phase.tasks.length} tasks</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                      </div>
                      <div className="text-xs text-center mt-1" style={{ color: '#2B2B2B', opacity: 0.6 }}>
                        {progress}%
                      </div>
                    </div>

                    {/* Status Icon */}
                    {getStatusIcon(status)}

                    {/* Expand/Collapse Icon */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-5 h-5" style={{ color: '#2B2B2B', opacity: 0.6 }} />
                    </motion.div>
                  </div>
                </div>
              </button>

              {/* Phase Content (Expanded) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4">
                      {/* Waiting Hint (for phases that need previous completion) */}
                      {isWaiting && (
                        <div className="glass-card-light rounded-xl p-4 border-l-4 border-blue-400">
                          <div className="flex items-start gap-3">
                            <ArrowRight className="w-5 h-5 mt-0.5 text-blue-500" />
                            <div>
                              <h5 className="font-semibold text-sm mb-1" style={{ color: '#2B2B2B' }}>
                                Complete "{phases[phaseIndex - 1]?.title}" First
                              </h5>
                              <p className="text-xs" style={{ color: '#2B2B2B', opacity: 0.7 }}>
                                This phase will become available once you finish the previous phase. Preview the tips below to prepare!
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Smart Tips for this Phase */}
                      {phase.smartTips && phase.smartTips.length > 0 && (
                        <div className="glass-card-light rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4" style={{ color: '#C084FC' }} />
                            <h4 className="font-semibold text-sm" style={{ color: '#2B2B2B' }}>
                              {isWaiting ? 'Preview: Smart Moves for This Phase' : 'Smart Moves for This Phase'}
                            </h4>
                          </div>
                          <ul className="space-y-2">
                            {phase.smartTips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#2B2B2B', opacity: 0.8 }}>
                                <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C084FC' }} />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tasks in this Phase */}
                      {!isWaiting && (
                        <div className="space-y-3">
                          {phase.tasks && phase.tasks.length > 0 && (
                            <div className="space-y-2">
                              {phase.tasks.map((task, taskIndex) => (
                                <TaskCard
                                  key={task.id || taskIndex}
                                  task={task}
                                  userContext={userContext}
                                  onTaskClick={onTaskClick}
                                />
                              ))}
                            </div>
                          )}

                          {/* Add Task Button */}
                          {addingTaskToPhase !== phaseIndex && (
                            <button
                              onClick={() => handleAddTaskClick(phaseIndex)}
                              className="w-full p-3 glass-card-light rounded-xl text-sm font-medium smooth-transition hover:glass-card flex items-center justify-center gap-2"
                              style={{ color: '#C084FC' }}
                            >
                              <Plus className="w-4 h-4" />
                              Add Task to This Phase
                            </button>
                          )}

                          {/* Add Task Form */}
                          {addingTaskToPhase === phaseIndex && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="glass-card rounded-xl p-4 border-2"
                              style={{ borderColor: '#C084FC' }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold text-sm" style={{ color: '#2B2B2B' }}>
                                  Add Task to {phase.title}
                                </h5>
                                <button
                                  onClick={handleCancelAddTask}
                                  className="p-1 hover:bg-gray-100 rounded-lg"
                                >
                                  <X className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>

                              <div className="space-y-3">
                                {/* Task Title */}
                                <div>
                                  <label className="block text-xs font-medium mb-1" style={{ color: '#2B2B2B', opacity: 0.7 }}>
                                    Task Title *
                                  </label>
                                  <input
                                    type="text"
                                    value={newTaskForm.title}
                                    onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                                    placeholder="e.g., Visit 3 potential venues"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>

                                {/* Task Description */}
                                <div>
                                  <label className="block text-xs font-medium mb-1" style={{ color: '#2B2B2B', opacity: 0.7 }}>
                                    Description (Optional)
                                  </label>
                                  <textarea
                                    value={newTaskForm.description}
                                    onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                                    placeholder="Add any details..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                  />
                                </div>

                                {/* Assign To & Priority */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#2B2B2B', opacity: 0.7 }}>
                                      Assign To
                                    </label>
                                    <select
                                      value={newTaskForm.assigned_to}
                                      onChange={(e) => setNewTaskForm({ ...newTaskForm, assigned_to: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                      <option value="">Both Partners</option>
                                      <option value={userContext?.partner1}>{userContext?.partner1 || 'Partner 1'}</option>
                                      <option value={userContext?.partner2}>{userContext?.partner2 || 'Partner 2'}</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#2B2B2B', opacity: 0.7 }}>
                                      Priority
                                    </label>
                                    <select
                                      value={newTaskForm.priority}
                                      onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                      <option value="low">Low</option>
                                      <option value="medium">Medium</option>
                                      <option value="high">High</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-2">
                                  <button
                                    onClick={() => handleSaveTask(phaseIndex)}
                                    disabled={!newTaskForm.title.trim()}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:shadow-lg smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    <Save className="w-4 h-4" />
                                    Save Task
                                  </button>
                                  <button
                                    onClick={handleCancelAddTask}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 smooth-transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Preview of what's coming (for waiting phases) */}
                      {isWaiting && (
                        <div className="glass-card-light rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4" style={{ color: '#2B2B2B', opacity: 0.6 }} />
                            <h5 className="font-semibold text-sm" style={{ color: '#2B2B2B' }}>
                              What to Expect
                            </h5>
                          </div>
                          <p className="text-sm" style={{ color: '#2B2B2B', opacity: 0.7 }}>
                            {phase.description}
                          </p>
                          {phase.estimatedCost > 0 && (
                            <div className="mt-2 text-xs flex items-center gap-2" style={{ color: '#2B2B2B', opacity: 0.6 }}>
                              <DollarSign className="w-3 h-3" />
                              <span>Estimated budget: €{phase.estimatedCost.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dependencies */}
                      {phase.dependencies && phase.dependencies.length > 0 && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: '#2B2B2B', opacity: 0.6 }}>
                          <ArrowRight className="w-3 h-3" />
                          <span>Requires: {phase.dependencies.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Journey Completion */}
      {calculateOverallProgress(phases) === 100 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-2xl p-6 text-center bg-gradient-to-r from-green-50 to-emerald-50"
        >
          <Flag className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <h3 className="text-xl font-bold mb-2" style={{ color: '#2B2B2B' }}>
            Journey Complete! 🎉
          </h3>
          <p className="text-sm" style={{ color: '#2B2B2B', opacity: 0.7 }}>
            You've completed all phases of your roadmap
          </p>
        </motion.div>
      )}
    </div>
  );
};

/**
 * TaskCard - Individual task within a phase
 */
const TaskCard = ({ task, userContext, onTaskClick }) => {
  const getTaskStatus = () => {
    if (task.completed) return 'completed';
    if (task.started || task.inProgress) return 'in-progress';
    return 'pending';
  };

  const status = getTaskStatus();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card-light rounded-xl p-4 smooth-transition hover:glass-card cursor-pointer"
      onClick={() => onTaskClick && onTaskClick(task)}
    >
      <div className="flex items-start gap-3">
        {/* Task Status Icon */}
        <div className="mt-0.5">
          {status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {status === 'in-progress' && <Clock className="w-5 h-5 text-purple-500" />}
          {status === 'pending' && (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
          )}
        </div>

        {/* Task Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h5
              className={`font-medium ${status === 'completed' ? 'line-through opacity-60' : ''}`}
              style={{ color: '#2B2B2B' }}
            >
              {task.title || task.description}
            </h5>

            {/* Assigned Partner */}
            {task.assignedTo && userContext && (
              <div className="flex items-center gap-1 px-2 py-1 glass-card-light rounded-lg text-xs">
                <User className="w-3 h-3" />
                <span style={{ color: '#2B2B2B', opacity: 0.7 }}>
                  {task.assignedTo}
                </span>
              </div>
            )}
          </div>

          {/* Task Metadata */}
          <div className="flex items-center gap-3 text-xs" style={{ color: '#2B2B2B', opacity: 0.6 }}>
            {task.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{task.estimatedTime}</span>
              </div>
            )}
            {task.cost && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>€{task.cost.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Organize tasks into logical phases based on goal type and dependencies
 */
function organizeTasksIntoPhases(milestone, tasks) {
  const goalType = milestone.goal_type?.toLowerCase() || '';

  // For buying apartment/house
  if (goalType.includes('apartment') || goalType.includes('house') || goalType.includes('home')) {
    return [
      {
        title: 'Financial Preparation',
        description: 'Secure funding and assess financial readiness',
        isCriticalPath: true,
        isUnlocked: true,
        duration: '2-4 weeks',
        estimatedCost: milestone.budget_amount ? milestone.budget_amount * 0.1 : 0,
        tasks: tasks.filter(t =>
          t.title?.toLowerCase().includes('budget') ||
          t.title?.toLowerCase().includes('financial') ||
          t.title?.toLowerCase().includes('mortgage') ||
          t.title?.toLowerCase().includes('savings')
        ),
        smartTips: [
          'Get pre-approved for mortgage before house hunting to strengthen your offer',
          'Budget for 10-15% beyond purchase price for closing costs and fees',
          'Check your credit score early - improvements take 3-6 months'
        ]
      },
      {
        title: 'Property Search & Research',
        description: 'Find and evaluate potential properties',
        isCriticalPath: true,
        isUnlocked: true,
        duration: '4-8 weeks',
        estimatedCost: 500,
        tasks: tasks.filter(t =>
          t.title?.toLowerCase().includes('search') ||
          t.title?.toLowerCase().includes('viewing') ||
          t.title?.toLowerCase().includes('location') ||
          t.title?.toLowerCase().includes('agent')
        ),
        smartTips: [
          'Visit neighborhoods at different times of day to assess noise, parking, and activity',
          'Use online tools to check crime stats, school ratings, and future development plans',
          'Attend open houses even if not interested - builds knowledge of market pricing'
        ],
        dependencies: ['Financial Preparation']
      },
      {
        title: 'Legal & Documentation',
        description: 'Handle contracts, inspections, and legal requirements',
        isCriticalPath: true,
        isUnlocked: false,
        duration: '3-6 weeks',
        estimatedCost: milestone.budget_amount ? milestone.budget_amount * 0.05 : 2000,
        tasks: tasks.filter(t =>
          t.title?.toLowerCase().includes('inspection') ||
          t.title?.toLowerCase().includes('legal') ||
          t.title?.toLowerCase().includes('contract') ||
          t.title?.toLowerCase().includes('notary')
        ),
        smartTips: [
          'Never skip the home inspection - it can save you thousands in hidden repairs',
          'Review all contracts with a real estate lawyer before signing',
          'Negotiate based on inspection findings - sellers often cover repair costs'
        ],
        dependencies: ['Property Search & Research']
      },
      {
        title: 'Closing & Move-In',
        description: 'Finalize purchase and prepare for moving',
        isCriticalPath: false,
        isUnlocked: false,
        duration: '2-4 weeks',
        estimatedCost: milestone.budget_amount ? milestone.budget_amount * 0.03 : 1500,
        tasks: tasks.filter(t =>
          t.title?.toLowerCase().includes('closing') ||
          t.title?.toLowerCase().includes('move') ||
          t.title?.toLowerCase().includes('utilities') ||
          t.title?.toLowerCase().includes('insurance')
        ),
        smartTips: [
          'Schedule movers 4-6 weeks in advance for better rates and availability',
          'Transfer utilities 2 weeks before move-in to avoid service gaps',
          'Do a final walk-through 24 hours before closing to verify property condition'
        ],
        dependencies: ['Legal & Documentation']
      }
    ];
  }

  // For wedding planning
  if (goalType.includes('wedding')) {
    return [
      {
        title: 'Vision & Budget',
        description: 'Define your dream wedding and financial plan',
        isCriticalPath: true,
        isUnlocked: true,
        duration: '2-3 weeks',
        estimatedCost: 0,
        tasks: tasks.filter(t =>
          t.title?.toLowerCase().includes('budget') ||
          t.title?.toLowerCase().includes('vision') ||
          t.title?.toLowerCase().includes('guest list')
        ),
        smartTips: [
          'Allocate budget by priority: venue (40%), catering (30%), photography (15%), other (15%)',
          'Create A-list and B-list for guests to manage numbers',
          'Book venue and photographer first - they fill up 12-18 months in advance'
        ]
      },
      {
        title: 'Major Vendors',
        description: 'Book venue, catering, and photography',
        isCriticalPath: true,
        isUnlocked: true,
        duration: '4-6 weeks',
        estimatedCost: milestone.budget_amount ? milestone.budget_amount * 0.7 : 0,
        tasks: tasks.filter(t =>
          t.title?.toLowerCase().includes('venue') ||
          t.title?.toLowerCase().includes('catering') ||
          t.title?.toLowerCase().includes('photographer')
        ),
        smartTips: [
          'Visit venues in person - photos can be deceiving',
          'Taste test catering options and negotiate per-plate pricing',
          'Review photographer portfolios for full weddings, not just highlight reels'
        ],
        dependencies: ['Vision & Budget']
      },
      {
        title: 'Details & Styling',
        description: 'Finalize décor, attire, and wedding details',
        isCriticalPath: false,
        isUnlocked: false,
        duration: '6-8 weeks',
        estimatedCost: milestone.budget_amount ? milestone.budget_amount * 0.2 : 0,
        tasks: tasks.filter(t =>
          t.title?.toLowerCase().includes('dress') ||
          t.title?.toLowerCase().includes('decor') ||
          t.title?.toLowerCase().includes('flowers') ||
          t.title?.toLowerCase().includes('music')
        ),
        smartTips: [
          'Order wedding dress 6-9 months early for alterations',
          'DIY centerpieces can save 40-60% vs florist arrangements',
          'Create Spotify playlist as backup for live band/DJ'
        ],
        dependencies: ['Major Vendors']
      },
      {
        title: 'Final Preparations',
        description: 'Confirm details and prepare for the big day',
        isCriticalPath: true,
        isUnlocked: false,
        duration: '2-4 weeks',
        estimatedCost: milestone.budget_amount ? milestone.budget_amount * 0.1 : 0,
        tasks: tasks.filter(t =>
          t.title?.toLowerCase().includes('rehearsal') ||
          t.title?.toLowerCase().includes('confirm') ||
          t.title?.toLowerCase().includes('timeline')
        ),
        smartTips: [
          'Confirm all vendor arrival times 1 week before',
          'Create day-of timeline with 30-min buffer for delays',
          'Assign a point person to handle vendor questions on wedding day'
        ],
        dependencies: ['Details & Styling']
      }
    ];
  }

  // Generic phases for other goal types
  return [
    {
      title: 'Planning & Preparation',
      description: 'Research and create your action plan',
      isCriticalPath: true,
      isUnlocked: true,
      duration: '1-2 weeks',
      tasks: tasks.filter((_, i) => i < Math.ceil(tasks.length / 3)),
      smartTips: [
        'Break down large goals into weekly milestones',
        'Identify potential obstacles and create backup plans',
        'Set specific, measurable success criteria'
      ]
    },
    {
      title: 'Execution',
      description: 'Take action and build momentum',
      isCriticalPath: true,
      isUnlocked: true,
      duration: milestone.duration || '4-8 weeks',
      tasks: tasks.filter((_, i) => i >= Math.ceil(tasks.length / 3) && i < Math.ceil(tasks.length * 2 / 3)),
      smartTips: [
        'Focus on high-impact tasks first',
        'Track progress weekly and adjust as needed',
        'Celebrate small wins to maintain motivation'
      ],
      dependencies: ['Planning & Preparation']
    },
    {
      title: 'Completion & Review',
      description: 'Finalize and reflect on your journey',
      isCriticalPath: false,
      isUnlocked: false,
      duration: '1-2 weeks',
      tasks: tasks.filter((_, i) => i >= Math.ceil(tasks.length * 2 / 3)),
      smartTips: [
        'Document lessons learned for future goals',
        'Review what worked well and what to improve',
        'Share your success with your partner'
      ],
      dependencies: ['Execution']
    }
  ];
}

/**
 * Calculate progress percentage for a phase
 */
function calculatePhaseProgress(phase) {
  if (!phase.tasks || phase.tasks.length === 0) return 0;

  const completedTasks = phase.tasks.filter(t => t.completed).length;
  return Math.round((completedTasks / phase.tasks.length) * 100);
}

/**
 * Calculate overall progress across all phases
 */
function calculateOverallProgress(phases) {
  if (!phases || phases.length === 0) return 0;

  const totalTasks = phases.reduce((sum, phase) => sum + (phase.tasks?.length || 0), 0);
  if (totalTasks === 0) return 0;

  const completedTasks = phases.reduce(
    (sum, phase) => sum + (phase.tasks?.filter(t => t.completed).length || 0),
    0
  );

  return Math.round((completedTasks / totalTasks) * 100);
}

export default RoadmapTreeView;
