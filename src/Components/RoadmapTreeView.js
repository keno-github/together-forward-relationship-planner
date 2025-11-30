import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Check,
  Clock,
  Lock,
  Users,
  Lightbulb,
  DollarSign,
  Calendar,
  Target,
  ArrowRight,
  Plus,
  X,
  Sparkles
} from 'lucide-react';
import { createPhaseTask } from '../services/supabaseService';

/**
 * RoadmapTreeView - Elegant journey phases accordion
 */
const RoadmapTreeView = ({ milestone, tasks = [], userContext, onTaskClick, onTasksUpdated }) => {
  const [expandedPhases, setExpandedPhases] = useState([0]);
  const [addingTaskToPhase, setAddingTaskToPhase] = useState(null);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium'
  });

  const phases = useMemo(() => {
    const deepDive = milestone.deepDiveData || milestone.deep_dive_data;
    const roadmapPhases = deepDive?.roadmapPhases;

    if (roadmapPhases && roadmapPhases.length > 0) {
      return roadmapPhases.map((phase, idx) => ({
        ...phase,
        tasks: tasks.filter(task => {
          if (task.roadmap_phase_index === idx) return true;
          if (task.roadmap_phase_index === null || task.roadmap_phase_index === undefined) {
            const phaseKeywords = phase.title.toLowerCase().split(' ');
            const taskTitle = (task.title || task.description || '').toLowerCase();
            return phaseKeywords.some(keyword => keyword.length > 3 && taskTitle.includes(keyword));
          }
          return false;
        })
      }));
    }
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
    setNewTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium' });
  };

  const handleCancelAddTask = () => {
    setAddingTaskToPhase(null);
    setNewTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium' });
  };

  const handleSaveTask = async (phaseIndex) => {
    if (!newTaskForm.title.trim()) return;

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

      const { error } = await createPhaseTask(taskData, phaseIndex);
      if (error) return;

      handleCancelAddTask();
      if (onTasksUpdated) onTasksUpdated();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const getPhaseStatus = (phase, phaseIndex) => {
    const hasDependency = phaseIndex > 0;
    const previousPhaseCompleted = !hasDependency || (phases[phaseIndex - 1]?.tasks?.every(t => t.completed));

    if (!phase.tasks || phase.tasks.length === 0) {
      return previousPhaseCompleted ? 'pending' : 'waiting';
    }

    const allCompleted = phase.tasks.every(t => t.completed);
    const someInProgress = phase.tasks.some(t => !t.completed && t.started);

    if (allCompleted) return 'completed';
    if (someInProgress) return 'in-progress';
    if (previousPhaseCompleted) return 'pending';
    return 'waiting';
  };

  // Error state - no roadmap
  if (phases === null) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(196, 154, 108, 0.12)' }}
          >
            <Sparkles className="w-8 h-8" style={{ color: '#c49a6c' }} />
          </div>
          <h3
            className="text-2xl font-medium mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
          >
            Create Your Roadmap
          </h3>
          <p className="mb-6" style={{ color: '#6b635b' }}>
            Luna can generate a personalized step-by-step roadmap for "{milestone.title}"
            with detailed phases and actionable steps.
          </p>
          <button
            onClick={() => {
              if (window.openLunaWithMessage) {
                window.openLunaWithMessage(`Please generate a detailed roadmap for my goal "${milestone.title}". Create phases with specific steps I can follow.`);
              }
            }}
            className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:-translate-y-0.5"
            style={{ background: '#c49a6c' }}
          >
            Generate Roadmap with Luna
          </button>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress(phases);

  return (
    <div className="tf-app" style={{ background: '#faf8f5' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2
                className="text-2xl font-medium mb-1"
                style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
              >
                Your Journey
              </h2>
              <p style={{ color: '#6b635b' }}>
                Step-by-step path to {milestone.title?.toLowerCase()}
              </p>
            </div>

            {/* Progress Summary */}
            <div className="text-right">
              <span
                className="text-3xl font-semibold"
                style={{ fontFamily: "'Playfair Display', serif", color: '#c49a6c' }}
              >
                {overallProgress}%
              </span>
              <p className="text-xs uppercase tracking-wider" style={{ color: '#6b635b' }}>
                Complete
              </p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="h-1.5 rounded-full mt-4" style={{ background: '#e8e4de' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: '#c49a6c' }}
            />
          </div>
        </header>

        {/* Phases */}
        <div className="space-y-4">
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
                transition={{ delay: phaseIndex * 0.05, duration: 0.4 }}
                className={`rounded-2xl overflow-hidden ${isWaiting ? 'opacity-60' : ''}`}
                style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
              >
                {/* Phase Header */}
                <button
                  onClick={() => togglePhase(phaseIndex)}
                  className="w-full p-5 flex items-start gap-4 text-left transition-colors hover:bg-[#faf8f5]"
                >
                  {/* Phase Number */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                    style={{
                      background: status === 'completed' ? '#7d8c75' : '#f5f2ed',
                      color: status === 'completed' ? '#ffffff' : '#2d2926'
                    }}
                  >
                    {status === 'completed' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      phaseIndex + 1
                    )}
                  </div>

                  {/* Phase Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className="font-medium truncate"
                        style={{ color: '#2d2926' }}
                      >
                        {phase.title}
                      </h3>
                      {phase.isCriticalPath && (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded"
                          style={{ background: 'rgba(196, 154, 108, 0.15)', color: '#a88352' }}
                        >
                          Key Phase
                        </span>
                      )}
                    </div>

                    <p className="text-sm mb-3" style={{ color: '#6b635b' }}>
                      {phase.description}
                    </p>

                    {/* Phase Meta */}
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#6b635b' }}>
                      {phase.duration && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {phase.duration}
                        </span>
                      )}
                      {phase.estimatedCost > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${phase.estimatedCost.toLocaleString()}
                        </span>
                      )}
                      {phase.tasks && phase.tasks.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          {phase.tasks.length} tasks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Progress + Chevron */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Mini Progress */}
                    <div className="w-16 hidden sm:block">
                      <div className="h-1.5 rounded-full" style={{ background: '#e8e4de' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%`, background: '#7d8c75' }}
                        />
                      </div>
                      <p className="text-xs text-center mt-1" style={{ color: '#6b635b' }}>
                        {progress}%
                      </p>
                    </div>

                    {/* Status Indicator */}
                    <StatusIndicator status={status} />

                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5" style={{ color: '#6b635b' }} />
                    </motion.div>
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid #e8e4de' }}>
                        <div className="pt-4">
                          {/* Waiting Notice */}
                          {isWaiting && (
                            <div
                              className="rounded-xl p-4 mb-4"
                              style={{ background: 'rgba(107, 143, 173, 0.08)', borderLeft: '3px solid #6b8fad' }}
                            >
                              <div className="flex items-start gap-3">
                                <Lock className="w-5 h-5 mt-0.5" style={{ color: '#6b8fad' }} />
                                <div>
                                  <p className="font-medium mb-1" style={{ color: '#5a7a94' }}>
                                    Complete "{phases[phaseIndex - 1]?.title}" first
                                  </p>
                                  <p className="text-sm" style={{ color: '#6b8fad' }}>
                                    This phase unlocks after finishing the previous one.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Smart Tips */}
                          {phase.smartTips && phase.smartTips.length > 0 && (
                            <div className="rounded-xl p-4 mb-4" style={{ background: '#faf8f5' }}>
                              <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4" style={{ color: '#c49a6c' }} />
                                <h4 className="text-sm font-medium" style={{ color: '#2d2926' }}>
                                  Tips for this phase
                                </h4>
                              </div>
                              <ul className="space-y-2">
                                {phase.smartTips.map((tip, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm"
                                    style={{ color: '#6b635b' }}
                                  >
                                    <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#c49a6c' }} />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Tasks */}
                          {!isWaiting && (
                            <div className="space-y-2">
                              {phase.tasks && phase.tasks.length > 0 && (
                                <div className="space-y-2">
                                  {phase.tasks.map((task, taskIndex) => (
                                    <TaskItem
                                      key={task.id || taskIndex}
                                      task={task}
                                      onTaskClick={onTaskClick}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Add Task */}
                              {addingTaskToPhase !== phaseIndex ? (
                                <button
                                  onClick={() => handleAddTaskClick(phaseIndex)}
                                  className="w-full p-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                  style={{ background: '#faf8f5', color: '#c49a6c' }}
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Task
                                </button>
                              ) : (
                                <AddTaskForm
                                  form={newTaskForm}
                                  setForm={setNewTaskForm}
                                  userContext={userContext}
                                  onSave={() => handleSaveTask(phaseIndex)}
                                  onCancel={handleCancelAddTask}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Completion State */}
        {overallProgress === 100 && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 rounded-2xl p-8 text-center"
            style={{ background: 'rgba(125, 140, 117, 0.1)', border: '1px solid rgba(125, 140, 117, 0.2)' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#7d8c75' }}
            >
              <Check className="w-7 h-7 text-white" />
            </div>
            <h3
              className="text-xl font-medium mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
            >
              Journey Complete
            </h3>
            <p style={{ color: '#6b635b' }}>
              You've completed all phases of your roadmap. Congratulations!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/**
 * Status Indicator
 */
const StatusIndicator = ({ status }) => {
  const config = {
    completed: { bg: '#7d8c75', icon: Check },
    'in-progress': { bg: '#c49a6c', icon: Clock },
    pending: { bg: '#6b8fad', icon: Target },
    waiting: { bg: '#d4c4a8', icon: Lock }
  };

  const { bg, icon: Icon } = config[status] || config.pending;

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: `${bg}20` }}
    >
      <Icon className="w-4 h-4" style={{ color: bg }} />
    </div>
  );
};

/**
 * Task Item
 */
const TaskItem = ({ task, onTaskClick }) => {
  const isCompleted = task.completed;

  return (
    <button
      onClick={() => onTaskClick && onTaskClick(task)}
      className="w-full p-4 rounded-xl text-left transition-all hover:-translate-y-0.5 group"
      style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: isCompleted ? '#7d8c75' : 'transparent',
            border: isCompleted ? 'none' : '2px solid #d4c4a8'
          }}
        >
          {isCompleted && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium ${isCompleted ? 'line-through opacity-50' : ''}`}
            style={{ color: '#2d2926' }}
          >
            {task.title || task.description}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1">
            {task.assigned_to && (
              <span className="flex items-center gap-1 text-xs" style={{ color: '#6b635b' }}>
                <Users className="w-3 h-3" />
                {task.assigned_to}
              </span>
            )}
            {task.priority && task.priority !== 'medium' && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  background: task.priority === 'high' ? 'rgba(199, 107, 107, 0.1)' : 'rgba(125, 140, 117, 0.1)',
                  color: task.priority === 'high' ? '#c76b6b' : '#7d8c75'
                }}
              >
                {task.priority}
              </span>
            )}
          </div>
        </div>

        <ArrowRight
          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{ color: '#c49a6c' }}
        />
      </div>
    </button>
  );
};

/**
 * Add Task Form
 */
const AddTaskForm = ({ form, setForm, userContext, onSave, onCancel }) => {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#ffffff', border: '2px solid #c49a6c' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-medium" style={{ color: '#2d2926' }}>
          New Task
        </h5>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100">
          <X className="w-4 h-4" style={{ color: '#6b635b' }} />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Task title"
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{ border: '1px solid #e8e4de', focusRing: '#c49a6c' }}
          autoFocus
        />

        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
          style={{ border: '1px solid #e8e4de' }}
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ border: '1px solid #e8e4de' }}
          >
            <option value="">Both Partners</option>
            <option value={userContext?.partner1}>{userContext?.partner1 || 'Partner 1'}</option>
            <option value={userContext?.partner2}>{userContext?.partner2 || 'Partner 2'}</option>
          </select>

          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ border: '1px solid #e8e4de' }}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onSave}
            disabled={!form.title.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#7d8c75' }}
          >
            Save Task
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#f5f2ed', color: '#6b635b' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

function calculatePhaseProgress(phase) {
  if (!phase.tasks || phase.tasks.length === 0) return 0;
  const completedTasks = phase.tasks.filter(t => t.completed).length;
  return Math.round((completedTasks / phase.tasks.length) * 100);
}

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
