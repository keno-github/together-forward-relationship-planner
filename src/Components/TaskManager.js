import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  CheckCircle,
  Circle,
  Trash2,
  Edit2,
  X,
  Save,
  Brain,
  User,
  Users,
  Calendar,
  Flag,
  Sparkles
} from 'lucide-react';
import { createTask, updateTask, getTasksByMilestone } from '../services/supabaseService';

/**
 * TaskManager - Comprehensive task management for milestone roadmaps
 *
 * Features:
 * - View all tasks (AI-generated + user-created)
 * - Add custom tasks
 * - Mark tasks complete (updates progress)
 * - Assign tasks to partners
 * - Priority levels
 * - Inline editing
 * - Real-time progress calculation
 */
const TaskManager = ({ milestone, userContext, onProgressUpdate }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: ''
  });

  // Edit task state
  const [editTask, setEditTask] = useState({});

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [milestone.id]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await getTasksByMilestone(milestone.id);

      if (error) {
        console.error('Error loading tasks:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const taskData = {
        milestone_id: milestone.id,
        title: newTask.title,
        description: newTask.description || '',
        assigned_to: newTask.assigned_to || null,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        completed: false,
        ai_generated: false,
        order_index: tasks.length
      };

      const { data, error } = await createTask(taskData);

      if (error) {
        console.error('Error creating task:', error);
        return;
      }

      // Add to local state
      setTasks([...tasks, data]);

      // Reset form
      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: ''
      });
      setShowAddForm(false);

      // Notify parent of progress update
      onProgressUpdate?.();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updates = {
        completed: !task.completed
      };

      const { data, error } = await updateTask(task.id, updates);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      // Update local state
      setTasks(tasks.map(t => t.id === task.id ? data : t));

      // Notify parent of progress update
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
      const { data, error } = await updateTask(taskId, editTask);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      // Update local state
      setTasks(tasks.map(t => t.id === taskId ? data : t));
      setEditingTaskId(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTask({});
  };

  const handleDeleteTask = async (taskId) => {
    // For now, mark as deleted (soft delete)
    // TODO: Add actual delete endpoint
    try {
      await updateTask(taskId, { deleted: true });
      setTasks(tasks.filter(t => t.id !== taskId));
      onProgressUpdate?.();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  // Calculate stats
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const aiGeneratedCount = tasks.filter(t => t.ai_generated).length;
  const userCreatedCount = tasks.filter(t => !t.ai_generated).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-600 mt-1">
            {completedCount} of {totalCount} completed • {progressPercentage}% progress
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-purple-600">{progressPercentage}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3 text-purple-500" />
            <span>{aiGeneratedCount} AI-generated</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-pink-500" />
            <span>{userCreatedCount} Custom</span>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New Task</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g., Book venue deposit"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add any details or notes..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Assignment and Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Assign To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Both</option>
                    <option value={userContext?.partner1}>{userContext?.partner1}</option>
                    <option value={userContext?.partner2}>{userContext?.partner2}</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">Low 🟢</option>
                    <option value="medium">Medium 🟡</option>
                    <option value="high">High 🔴</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.title.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first task to start tracking progress on this milestone
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Task
            </button>
          </div>
        ) : (
          tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl p-4 border-2 transition-all ${
                task.completed
                  ? 'border-green-200 bg-green-50/30'
                  : 'border-gray-100 hover:border-purple-200'
              }`}
            >
              {editingTaskId === task.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTask.title}
                    onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <textarea
                    value={editTask.description}
                    onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveEdit(task.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-green-600"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-purple-500" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3
                        className={`font-semibold ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {/* Actions */}
                      {!task.completed && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleStartEdit(task)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit task"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs">
                      {/* AI Generated Badge */}
                      {task.ai_generated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          <Brain className="w-3 h-3" />
                          AI Generated
                        </span>
                      )}

                      {/* Priority */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                        <Flag className="w-3 h-3" />
                        {task.priority || 'medium'}
                      </span>

                      {/* Assignment */}
                      {task.assigned_to && (
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <User className="w-3 h-3" />
                          {task.assigned_to}
                        </span>
                      )}

                      {/* Due Date */}
                      {task.due_date && (
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}

                      {/* Completed Info */}
                      {task.completed && task.completed_at && (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Completed {new Date(task.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager;
