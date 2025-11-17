import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getVisibleNavigationTabs } from '../utils/navigationHelpers';
import GoalOverviewDashboard from './GoalOverviewDashboard';
import RoadmapTreeView from './RoadmapTreeView'; // NEW: Tree-based roadmap
import BudgetAllocation from './BudgetAllocation'; // Budget section

/**
 * MilestoneDetailPage - Parent Container
 *
 * Multi-dimensional milestone navigation with persistent header
 *
 * Features:
 * - Tabbed navigation (Overview, Roadmap, Budget, Assessment, Tasks, Status)
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

  // Load tasks and expenses (mock for now - will connect to DB)
  useEffect(() => {
    if (milestone) {
      // TODO: Fetch from Supabase
      // For now, use mock data or data from milestone object
      setTasks(milestone.tasks || []);
      setExpenses(milestone.expenses || []);
      setLoading(false);
    }
  }, [milestone]);

  const handleSectionChange = (newSection) => {
    setActiveSection(newSection);
    if (onSectionChange) {
      onSectionChange(newSection);
    }
  };

  if (!milestone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No milestone selected</p>
      </div>
    );
  }

  const currentTab = visibleTabs.find(t => t.id === activeSection) || visibleTabs[0];
  const metrics = milestone.milestone_metrics || {};

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
              <GoalOverviewDashboard
                milestone={milestone}
                userContext={userContext}
                tasks={tasks}
                expenses={expenses}
                onNavigateToSection={handleSectionChange}
              />
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
              />
            )}

            {activeSection === 'budget' && (
              <div className="p-6">
                <BudgetAllocation
                  budgetData={milestone.budgetAllocation || {}}
                  totalBudget={milestone.budget_amount || 0}
                  expenses={expenses}
                />
              </div>
            )}

            {activeSection === 'assessment' && (
              <div className="p-6">
                <LunaAssessmentPlaceholder milestone={milestone} />
              </div>
            )}

            {activeSection === 'tasks' && (
              <div className="p-6">
                <TaskAssignmentPlaceholder tasks={tasks} userContext={userContext} />
              </div>
            )}

            {activeSection === 'status' && (
              <div className="p-6">
                <MilestoneStatusPlaceholder milestone={milestone} metrics={metrics} />
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

const MilestoneStatusPlaceholder = ({ milestone, metrics }) => (
  <div className="bg-white rounded-2xl p-8 border-2 border-gray-100">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Milestone Status</h2>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-green-50 rounded-xl p-4">
        <p className="text-sm text-gray-600">Completed</p>
        <p className="text-2xl font-bold text-green-600">
          {metrics.tasks_completed || 0}
        </p>
      </div>
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-sm text-gray-600">Remaining</p>
        <p className="text-2xl font-bold text-blue-600">
          {(metrics.tasks_total || 0) - (metrics.tasks_completed || 0)}
        </p>
      </div>
      <div className="bg-purple-50 rounded-xl p-4">
        <p className="text-sm text-gray-600">Progress</p>
        <p className="text-2xl font-bold text-purple-600">
          {metrics.progress_percentage || 0}%
        </p>
      </div>
      <div className="bg-pink-50 rounded-xl p-4">
        <p className="text-sm text-gray-600">Health Score</p>
        <p className="text-2xl font-bold text-pink-600">
          {metrics.health_score || 0}/100
        </p>
      </div>
    </div>
    <p className="text-sm text-gray-500 italic mt-6">
      Full status tracking interface coming soon...
    </p>
  </div>
);

export default MilestoneDetailPage;
