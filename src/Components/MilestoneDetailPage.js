import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Calendar, Check, X } from 'lucide-react';
import { getVisibleNavigationTabs, calculateClientMetrics } from '../utils/navigationHelpers';
import { getTasksByMilestone, updateMilestone, getMilestoneById } from '../services/supabaseService';
import RoadmapTreeView from './RoadmapTreeView'; // NEW: Tree-based roadmap
import BudgetAllocation from './BudgetAllocation'; // Budget section
import TaskManager from './TaskManager'; // NEW: Full-featured task management
import LunaAssessment from './LunaAssessment'; // Luna Assessment with AI insights
import GoalOverviewDashboard from './GoalOverviewDashboard'; // Overview with budget setting

/**
 * MilestoneDetailPage - Parent Container
 *
 * Multi-dimensional milestone navigation with persistent header
 *
 * Features:
 * - Tabbed navigation (Overview, Roadmap, Budget, Assessment, Tasks)
 * - Conditional tab rendering (e.g., hide Budget for non-monetary goals)
 * - Responsive design (desktop header nav + mobile top nav)
 * - Section state management
 * - Progress indicator in header
 *
 * Props:
 * - milestone: Full milestone object
 * - section: Current active section ('overview', 'roadmap', etc.)
 * - onSectionChange: Callback when user switches sections
 * - onBack: Navigate back to milestone list
 * - onUpdateMilestone: Update parent state
 * - roadmapId: For database queries
 * - userContext: Partner names, location
 */
const MilestoneDetailPage = ({
  milestone,
  section = 'overview',
  onSectionChange,
  onBack,
  onUpdateMilestone,
  roadmapId,
  userContext
}) => {
  const [activeSection, setActiveSection] = useState(section);
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(milestone.milestone_metrics || {});
  const [editingTargetDate, setEditingTargetDate] = useState(false);
  const [targetDate, setTargetDate] = useState(milestone.target_date || '');

  // Update visible tabs when milestone changes
  useEffect(() => {
    if (milestone) {
      const tabs = getVisibleNavigationTabs(milestone);
      setVisibleTabs(tabs);
    }
  }, [milestone]);

  // Sync with parent's section prop
  useEffect(() => {
    setActiveSection(section);
  }, [section]);

  // Helper: fetch with timeout to prevent hanging
  const fetchWithTimeout = async (fetchFn, timeoutMs = 8000) => {
    return Promise.race([
      fetchFn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      )
    ]);
  };

  // Load tasks from database with timeout protection
  const loadTasks = async () => {
    if (!milestone?.id) return;

    try {
      const { data, error } = await fetchWithTimeout(
        () => getTasksByMilestone(milestone.id),
        8000 // 8 second timeout
      );

      if (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh milestone from database (for Luna chat updates) with timeout
  const refreshMilestone = async () => {
    if (!milestone?.id) return;

    try {
      const { data, error } = await fetchWithTimeout(
        () => getMilestoneById(milestone.id),
        8000 // 8 second timeout
      );
      if (!error && data && onUpdateMilestone) {
        console.log('🔄 Refreshing milestone from database:', data.id);
        onUpdateMilestone(data);
      }
    } catch (error) {
      console.error('Error refreshing milestone:', error);
    }
  };

  // Load tasks and expenses when milestone changes
  useEffect(() => {
    if (milestone) {
      loadTasks();
      setExpenses(milestone.expenses || []);
    }
  }, [milestone]);

  const handleSectionChange = (newSection) => {
    setActiveSection(newSection);
    if (onSectionChange) {
      onSectionChange(newSection);
    }
  };

  const handleSaveTargetDate = async () => {
    if (!targetDate) {
      alert('Please select a target date');
      return;
    }

    try {
      const { data, error } = await updateMilestone(milestone.id, {
        target_date: targetDate
      });

      if (error) {
        console.error('Error updating target date:', error);
        alert('Failed to save target date');
        return;
      }

      console.log('✅ Target date saved:', targetDate);

      // Update parent component
      if (onUpdateMilestone) {
        onUpdateMilestone({ ...milestone, target_date: targetDate });
      }

      setEditingTargetDate(false);

      // Reload tasks to recalculate metrics
      loadTasks();
    } catch (error) {
      console.error('Error saving target date:', error);
      alert('An error occurred while saving');
    }
  };

  const handleCancelTargetDate = () => {
    setTargetDate(milestone.target_date || '');
    setEditingTargetDate(false);
  };

  if (!milestone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No milestone selected</p>
      </div>
    );
  }

  const currentTab = visibleTabs.find(t => t.id === activeSection) || visibleTabs[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header with Navigation */}
      <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-50 shadow-sm">
        {/* Top Bar: Back button, Title, Progress */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="hidden md:block w-px h-6 bg-gray-300" />

            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-900">{milestone.title}</h1>
              <p className="text-sm text-gray-600">
                {userContext?.partner1} & {userContext?.partner2}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Target Date */}
            <div className="flex items-center gap-2">
              {!editingTargetDate ? (
                <button
                  onClick={() => setEditingTargetDate(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors group"
                >
                  <Calendar className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Target Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {milestone.target_date
                        ? new Date(milestone.target_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Set date'}
                    </p>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-purple-300 bg-purple-50">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSaveTargetDate}
                    className="p-1 hover:bg-green-100 rounded transition-colors"
                    title="Save"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </button>
                  <button
                    onClick={handleCancelTargetDate}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            {metrics.progress_percentage !== undefined && (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {metrics.progress_percentage}% Complete
                  </p>
                  <p className="text-xs text-gray-600">
                    {metrics.tasks_completed}/{metrics.tasks_total} tasks
                  </p>
                </div>

                {/* Circular progress indicator */}
                <div className="relative w-12 h-12">
                  <svg className="transform -rotate-90" width="48" height="48">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="#E5E7EB"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="#8B5CF6"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 20}
                      strokeDashoffset={2 * Math.PI * 20 * (1 - metrics.progress_percentage / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-600">
                      {metrics.progress_percentage}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Title (shown below back button) */}
        <div className="md:hidden px-6 pb-3">
          <h1 className="text-lg font-bold text-gray-900">{milestone.title}</h1>
        </div>

        {/* Tab Navigation */}
        <nav className="px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSectionChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 font-medium transition-all relative
                    ${isActive
                      ? 'text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Breadcrumbs */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Your Roadmap</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-gray-900">{milestone.title}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-purple-600 font-medium">{currentTab?.label}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'overview' && (
              <div className="p-6">
                <GoalOverviewDashboard
                  milestone={milestone}
                  userContext={userContext}
                  tasks={tasks}
                  expenses={expenses}
                  onNavigateToSection={handleSectionChange}
                  onUpdateMilestone={onUpdateMilestone}
                  onRefreshTasks={loadTasks}
                  onRefreshMilestone={refreshMilestone}
                />
              </div>
            )}

            {activeSection === 'roadmap' && (
              <RoadmapTreeView
                milestone={milestone}
                tasks={tasks}
                userContext={userContext}
                onTaskClick={(task) => {
                  // Navigate to tasks tab with specific task selected
                  handleSectionChange('tasks');
                  // TODO: Pass selected task to tasks section
                }}
                onTasksUpdated={loadTasks}
              />
            )}

            {activeSection === 'budget' && (
              <div className="p-6">
                <BudgetAllocation
                  milestone={milestone}
                  roadmapId={roadmapId}
                  onProgressUpdate={loadTasks}
                  onNavigateToSection={handleSectionChange}
                />
              </div>
            )}

            {activeSection === 'assessment' && (
              <div className="p-6">
                <LunaAssessment
                  userId={userContext?.userId}
                  roadmapId={roadmapId}
                  userContext={userContext}
                />
              </div>
            )}

            {activeSection === 'tasks' && (
              <div className="p-6">
                <TaskManager
                  milestone={milestone}
                  userContext={userContext}
                  onProgressUpdate={() => {
                    // Reload tasks to refresh progress
                    loadTasks();
                  }}
                  onNavigateToRoadmap={() => handleSectionChange('roadmap')}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

/**
 * Placeholder components for sections not yet built
 * These will be replaced with full components in later phases
 */

const LunaAssessmentPlaceholder = ({ milestone }) => (
  <div className="bg-white rounded-2xl p-8 border-2 border-gray-100">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Luna's Assessment</h2>
    <div className="space-y-4">
      <div className="bg-purple-50 rounded-xl p-6">
        <h3 className="font-semibold text-purple-900 mb-2">Confidence Level</h3>
        <p className="text-gray-700">
          {milestone.confidence_level || 'High'} confidence in achieving this milestone
        </p>
      </div>

      {milestone.personalizedInsights && (
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Key Insights</h3>
          <p className="text-gray-700">
            {milestone.personalizedInsights.assessment || 'Analyzing your situation...'}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-500 italic">
        Full assessment section coming soon...
      </p>
    </div>
  </div>
);

const TaskAssignmentPlaceholder = ({ tasks, userContext }) => (
  <div className="bg-white rounded-2xl p-8 border-2 border-gray-100">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Assignment</h2>
    <div className="space-y-3">
      {tasks.length > 0 ? (
        tasks.map((task, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-4">
            <p className="font-medium text-gray-900">{task.title}</p>
            <p className="text-sm text-gray-600 mt-1">
              Assigned to: {task.assigned_to || 'Unassigned'}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-600">No tasks yet</p>
      )}
      <p className="text-sm text-gray-500 italic mt-6">
        Full task assignment interface coming soon...
      </p>
    </div>
  </div>
);

export default MilestoneDetailPage;
