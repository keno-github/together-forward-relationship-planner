import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Check,
  Circle,
  Trash2,
  Edit3,
  X,
  User,
  Calendar,
  Flag,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { createTask, updateTask, getTasksByMilestone } from '../services/supabaseService';
import NudgeButton from './Tasks/NudgeButton';

/**
 * TaskManager - Elegant task management interface
 * @param {Object} partnerInfo - { user_id, partner_id, partner1_name, partner2_name }
 * @param {string} currentUserId - Current authenticated user's ID
 */
const TaskManager = ({ milestone, userContext, partnerInfo, currentUserId, onProgressUpdate, onNavigateToRoadmap }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    assigned_to_user_id: null,
    priority: 'medium',
    due_date: '',
    roadmap_phase_index: null
  });
  const [editTask, setEditTask] = useState({});

  // Map partner names to user IDs for assignment
  const getPartnerOptions = () => {
    if (!partnerInfo) {
      // Fallback to text-only assignment
      return [
        { name: userContext?.partner1, userId: null },
        { name: userContext?.partner2, userId: null }
      ];
    }

    // Map partner1_name to user_id (owner) and partner2_name to partner_id
    return [
      { name: partnerInfo.partner1_name || userContext?.partner1, userId: partnerInfo.user_id },
      { name: partnerInfo.partner2_name || userContext?.partner2, userId: partnerInfo.partner_id }
    ].filter(p => p.name);
  };

  // Get partner's user ID from name
  const getPartnerUserId = (partnerName) => {
    if (!partnerName || !partnerInfo) return null;
    const options = getPartnerOptions();
    const match = options.find(p => p.name === partnerName);
    return match?.userId || null;
  };

  // Get the other partner's ID (not the current user)
  const getOtherPartnerId = (assignedUserId) => {
    if (!partnerInfo || !currentUserId) return null;
    if (assignedUserId === currentUserId) return null; // Task is assigned to me
    return assignedUserId; // Task is assigned to partner
  };

  useEffect(() => {
    if (milestone?.id) {
      loadTasks();
    } else {
      setLoading(false);
    }
  }, [milestone?.id]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await getTasksByMilestone(milestone.id);
      if (!error) setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      // Get the user ID for the assigned partner
      const assignedUserId = getPartnerUserId(newTask.assigned_to);

      const taskData = {
        milestone_id: milestone.id,
        title: newTask.title,
        description: newTask.description || '',
        assigned_to: newTask.assigned_to || null,
        assigned_to_user_id: assignedUserId,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        roadmap_phase_index: newTask.roadmap_phase_index,
        completed: false,
        ai_generated: false,
        order_index: tasks.length
      };

      const { data, error } = await createTask(taskData);
      if (error) {
        console.error('Error adding task:', error);
        alert(`Failed to save task: ${error.message || 'Unknown error'}`);
        return;
      }

      setTasks([...tasks, data]);
      setNewTask({ title: '', description: '', assigned_to: '', assigned_to_user_id: null, priority: 'medium', due_date: '', roadmap_phase_index: null });
      setShowAddForm(false);
      onProgressUpdate?.();
    } catch (error) {
      console.error('Error adding task:', error);
      alert(`Failed to save task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const { data, error } = await updateTask(task.id, { completed: !task.completed });
      if (error) return;
      setTasks(tasks.map(t => t.id === task.id ? data : t));
      onProgressUpdate?.();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditTask({
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'medium',
      due_date: task.due_date || ''
    });
  };

  const handleSaveEdit = async (taskId) => {
    try {
      // Get the user ID for the assigned partner
      const assignedUserId = getPartnerUserId(editTask.assigned_to);

      const updateData = {
        ...editTask,
        assigned_to_user_id: assignedUserId
      };

      const { data, error } = await updateTask(taskId, updateData);
      if (error) {
        console.error('Error saving task:', error);
        alert(`Failed to save task: ${error.message || 'Unknown error'}`);
        return;
      }
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...data } : t));
      setEditingTaskId(null);
      setEditTask({});
      onProgressUpdate?.();
    } catch (error) {
      console.error('Error saving task:', error);
      alert(`Failed to save task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await updateTask(taskId, { deleted: true });
      setTasks(tasks.filter(t => t.id !== taskId));
      onProgressUpdate?.();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Safety check for missing milestone
  if (!milestone) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: '#6b635b' }}>No milestone selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-[#c49a6c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="tf-app" style={{ background: '#faf8f5' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-2xl font-medium mb-1"
                style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
              >
                Tasks
              </h2>
              <p style={{ color: '#6b635b' }}>
                {milestone.title}
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 rounded-xl font-medium text-white flex items-center gap-2 transition-all hover:-translate-y-0.5"
              style={{ background: '#2d2926' }}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </header>

        {/* Progress */}
        {totalCount > 0 && (
          <div
            className="rounded-xl p-5 mb-8"
            style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: '#2d2926' }}>
                Progress
              </span>
              <span
                className="text-2xl font-semibold"
                style={{ fontFamily: "'Playfair Display', serif", color: '#c49a6c' }}
              >
                {progressPercentage}%
              </span>
            </div>

            <div className="h-2 rounded-full" style={{ background: '#e8e4de' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: '#c49a6c' }}
              />
            </div>

            <p className="text-sm mt-3" style={{ color: '#6b635b' }}>
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>
        )}

        {/* Add Task Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div
                className="rounded-xl p-6"
                style={{ background: '#ffffff', border: '2px solid #c49a6c' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-medium" style={{ color: '#2d2926' }}>
                    New Task
                  </h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" style={{ color: '#6b635b' }} />
                  </button>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title"
                    className="w-full px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2"
                    style={{ border: '1px solid #e8e4de', focusRing: '#c49a6c' }}
                    autoFocus
                  />

                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2"
                    style={{ border: '1px solid #e8e4de' }}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newTask.assigned_to}
                      onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                      className="px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{ border: '1px solid #e8e4de' }}
                    >
                      <option value="">Both Partners</option>
                      {getPartnerOptions().map((partner, idx) => (
                        <option key={idx} value={partner.name}>
                          {partner.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{ border: '1px solid #e8e4de' }}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ border: '1px solid #e8e4de' }}
                  />

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAddTask}
                      disabled={!newTask.title.trim()}
                      className="flex-1 py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
                      style={{ background: '#7d8c75' }}
                    >
                      Add Task
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 rounded-xl font-medium transition-colors"
                      style={{ background: '#f5f2ed', color: '#6b635b' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <EmptyState
              milestone={milestone}
              onAddTask={() => setShowAddForm(true)}
              onNavigateToRoadmap={onNavigateToRoadmap}
            />
          ) : (
            tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                {editingTaskId === task.id ? (
                  <EditTaskForm
                    editTask={editTask}
                    setEditTask={setEditTask}
                    userContext={userContext}
                    partnerOptions={getPartnerOptions()}
                    onSave={() => handleSaveEdit(task.id)}
                    onCancel={() => { setEditingTaskId(null); setEditTask({}); }}
                  />
                ) : (
                  <TaskItem
                    task={task}
                    milestone={milestone}
                    currentUserId={currentUserId}
                    partnerInfo={partnerInfo}
                    onToggle={() => handleToggleComplete(task)}
                    onEdit={() => handleStartEdit(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Task Item
 */
const TaskItem = ({ task, milestone, currentUserId, partnerInfo, onToggle, onEdit, onDelete }) => {
  const priorityColors = {
    high: { bg: 'rgba(199, 107, 107, 0.1)', text: '#c76b6b' },
    medium: { bg: 'rgba(196, 154, 108, 0.1)', text: '#a88352' },
    low: { bg: 'rgba(125, 140, 117, 0.1)', text: '#7d8c75' }
  };

  const priority = priorityColors[task.priority] || priorityColors.medium;

  // Check if task is assigned to the other partner (not me)
  const isAssignedToPartner = task.assigned_to_user_id && task.assigned_to_user_id !== currentUserId;
  const assignedPartnerName = task.assigned_to || 'Partner';

  return (
    <div
      className={`rounded-xl p-4 transition-all group ${task.completed ? 'opacity-60' : ''}`}
      style={{
        background: task.completed ? 'rgba(125, 140, 117, 0.05)' : '#ffffff',
        border: task.completed ? '1px solid rgba(125, 140, 117, 0.2)' : '1px solid #e8e4de'
      }}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
        >
          {task.completed ? (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: '#7d8c75' }}
            >
              <Check className="w-4 h-4 text-white" />
            </div>
          ) : (
            <Circle className="w-6 h-6" style={{ color: '#d4c4a8' }} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3
              className={`font-medium ${task.completed ? 'line-through' : ''}`}
              style={{ color: '#2d2926' }}
            >
              {task.title}
            </h3>

            {/* Actions */}
            {!task.completed && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {/* Nudge Button - only show if assigned to partner */}
                {isAssignedToPartner && (
                  <NudgeButton
                    task={task}
                    recipientId={task.assigned_to_user_id}
                    recipientName={assignedPartnerName}
                  />
                )}
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Edit3 className="w-4 h-4" style={{ color: '#6b635b' }} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" style={{ color: '#c76b6b' }} />
                </button>
              </div>
            )}
          </div>

          {task.description && (
            <p className="text-sm mb-2" style={{ color: '#6b635b' }}>
              {task.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2">
            {/* AI Badge */}
            {task.ai_generated && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
                style={{ background: 'rgba(196, 154, 108, 0.1)', color: '#a88352' }}
              >
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}

            {/* Priority */}
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
              style={{ background: priority.bg, color: priority.text }}
            >
              <Flag className="w-3 h-3" />
              {task.priority}
            </span>

            {/* Assignment */}
            {task.assigned_to && (
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#6b635b' }}>
                <User className="w-3 h-3" />
                {task.assigned_to}
              </span>
            )}

            {/* Due Date */}
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#6b635b' }}>
                <Calendar className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}

            {/* Roadmap Phase */}
            {task.roadmap_phase_index !== null &&
              task.roadmap_phase_index !== undefined &&
              milestone.deep_dive_data?.roadmapPhases?.[task.roadmap_phase_index] && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
                style={{ background: 'rgba(107, 143, 173, 0.1)', color: '#6b8fad' }}
              >
                {milestone.deep_dive_data.roadmapPhases[task.roadmap_phase_index].title}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Edit Task Form
 */
const EditTaskForm = ({ editTask, setEditTask, userContext, partnerOptions, onSave, onCancel }) => {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#ffffff', border: '2px solid #c49a6c' }}
    >
      <div className="space-y-3">
        <input
          type="text"
          value={editTask.title}
          onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
          placeholder="Task title"
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{ border: '1px solid #e8e4de' }}
          autoFocus
        />

        <textarea
          value={editTask.description}
          onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
          placeholder="Description"
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
          style={{ border: '1px solid #e8e4de' }}
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            value={editTask.assigned_to}
            onChange={(e) => setEditTask({ ...editTask, assigned_to: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ border: '1px solid #e8e4de' }}
          >
            <option value="">Both Partners</option>
            {partnerOptions?.map((partner, idx) => (
              <option key={idx} value={partner.name}>
                {partner.name}
              </option>
            ))}
          </select>

          <select
            value={editTask.priority}
            onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ border: '1px solid #e8e4de' }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <input
          type="date"
          value={editTask.due_date}
          onChange={(e) => setEditTask({ ...editTask, due_date: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{ border: '1px solid #e8e4de' }}
        />

        <div className="flex gap-2 pt-2">
          <button
            onClick={onSave}
            disabled={!editTask.title?.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#7d8c75' }}
          >
            Save Changes
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

/**
 * Empty State
 */
const EmptyState = ({ milestone, onAddTask, onNavigateToRoadmap }) => {
  return (
    <div
      className="rounded-xl p-10 text-center"
      style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: 'rgba(196, 154, 108, 0.12)' }}
      >
        <Check className="w-7 h-7" style={{ color: '#c49a6c' }} />
      </div>

      <h3
        className="text-xl font-medium mb-2"
        style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
      >
        No tasks yet
      </h3>

      <p className="mb-6 max-w-sm mx-auto" style={{ color: '#6b635b' }}>
        {milestone.deep_dive_data?.roadmapPhases
          ? "Check your roadmap for suggested phases, or create your first task."
          : "Start tracking your progress by adding your first task."}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onAddTask}
          className="px-5 py-2.5 rounded-xl font-medium text-white transition-all hover:-translate-y-0.5"
          style={{ background: '#2d2926' }}
        >
          Add Task
        </button>

        {milestone.deep_dive_data?.roadmapPhases && onNavigateToRoadmap && (
          <button
            onClick={onNavigateToRoadmap}
            className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors"
            style={{ background: '#f5f2ed', color: '#6b635b' }}
          >
            View Roadmap
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
