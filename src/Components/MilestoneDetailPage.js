import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Check, X, Target, TrendingUp, Share2, Users } from 'lucide-react';
import { getVisibleNavigationTabs, calculateClientMetrics } from '../utils/navigationHelpers';
import { getTasksByMilestone, updateMilestone, getMilestoneById, getRoadmapById } from '../services/supabaseService';
import RoadmapTreeView from './RoadmapTreeView';
import BudgetAllocation from './BudgetAllocation';
import TaskManager from './TaskManager';
import LunaAssessment from './LunaAssessment';
import GoalOverviewDashboard from './GoalOverviewDashboard';
import ShareDreamModal from './Sharing/ShareDreamModal';
import { ActivityFeed } from './Activity';

/**
 * MilestoneDetailPage - Dream Detail View
 *
 * A warm, editorial design for viewing and managing a specific dream/goal.
 * Features a clean header with progress, and tabbed content sections.
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [roadmap, setRoadmap] = useState(null);

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

  // Check if milestone ID is a placeholder (not a real UUID)
  const isPlaceholderMilestone = milestone?.id?.startsWith('placeholder-');

  // Load tasks from database
  const loadTasks = async () => {
    if (!milestone?.id || isPlaceholderMilestone) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await getTasksByMilestone(milestone.id);

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

  // Refresh milestone from database (for Luna chat updates)
  const refreshMilestone = async () => {
    if (!milestone?.id || isPlaceholderMilestone) return;

    try {
      const { data, error } = await getMilestoneById(milestone.id);
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

  // Load roadmap data for sharing
  useEffect(() => {
    const loadRoadmap = async () => {
      const id = roadmapId || milestone?.roadmap_id;
      if (!id) return;

      try {
        const { data, error } = await getRoadmapById(id);
        if (!error && data) {
          setRoadmap(data);
        }
      } catch (err) {
        console.error('Error loading roadmap:', err);
      }
    };

    loadRoadmap();
  }, [roadmapId, milestone?.roadmap_id]);

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
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <p className="text-stone-500">No dream selected</p>
      </div>
    );
  }

  const currentTab = visibleTabs.find(t => t.id === activeSection) || visibleTabs[0];
  const progressPercent = metrics.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      {/* Elegant Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-5">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>

              <div className="h-6 w-px bg-stone-200 hidden sm:block" />

              <div>
                <h1
                  className="text-xl md:text-2xl font-semibold text-stone-900 tracking-tight"
                  style={{ fontFamily: 'Georgia, Cambria, serif' }}
                >
                  {milestone.title}
                </h1>
                {userContext?.partner1 && userContext?.partner2 && (
                  <p className="text-sm text-stone-500 mt-0.5">
                    {userContext.partner1} & {userContext.partner2}'s journey
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions, Progress & Date */}
            <div className="flex items-center gap-4">
              {/* Share Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition-all"
                title="Share this dream with your partner"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Share</span>
              </button>

              {/* Target Date - Compact */}
              <div className="hidden md:flex items-center gap-2">
                {!editingTargetDate ? (
                  <button
                    onClick={() => setEditingTargetDate(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all group"
                  >
                    <Calendar className="w-4 h-4 text-stone-400 group-hover:text-amber-600" />
                    <span className="text-sm text-stone-600">
                      {milestone.target_date
                        ? new Date(milestone.target_date).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Set target'}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50">
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="px-2 py-1 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    />
                    <button
                      onClick={handleSaveTargetDate}
                      className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={handleCancelTargetDate}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Ring */}
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11">
                  <svg className="transform -rotate-90" width="44" height="44">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="#E7E5E4"
                      strokeWidth="3"
                      fill="none"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 18}
                      strokeDashoffset={2 * Math.PI * 18 * (1 - progressPercent / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-stone-700">
                      {progressPercent}%
                    </span>
                  </div>
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-medium text-stone-700">Progress</p>
                  <p className="text-xs text-stone-500">
                    {metrics.tasks_completed || 0}/{metrics.tasks_total || 0} tasks
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation - Clean pills style */}
          <nav className="mt-4 -mb-px overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSectionChange(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
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
                  handleSectionChange('tasks');
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
                  currentUserId={userContext?.userId}
                  partnerInfo={roadmap ? {
                    user_id: roadmap.user_id,
                    partner_id: roadmap.partner_id,
                    partner1_name: roadmap.partner1_name,
                    partner2_name: roadmap.partner2_name
                  } : null}
                  onProgressUpdate={() => {
                    loadTasks();
                  }}
                  onNavigateToRoadmap={() => handleSectionChange('roadmap')}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Share Dream Modal */}
      <ShareDreamModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        roadmap={roadmap || {
          id: roadmapId || milestone?.roadmap_id,
          title: milestone?.title
        }}
      />
    </div>
  );
};

/**
 * Placeholder components for sections not yet built
 */

const LunaAssessmentPlaceholder = ({ milestone }) => (
  <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
    <h2
      className="text-2xl font-semibold text-stone-900 mb-4"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      Luna's Assessment
    </h2>
    <div className="space-y-4">
      <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
        <h3 className="font-medium text-amber-900 mb-2">Confidence Level</h3>
        <p className="text-stone-700">
          {milestone.confidence_level || 'High'} confidence in achieving this dream
        </p>
      </div>

      {milestone.personalizedInsights && (
        <div className="bg-stone-50 rounded-xl p-6 border border-stone-200">
          <h3 className="font-medium text-stone-800 mb-2">Key Insights</h3>
          <p className="text-stone-600">
            {milestone.personalizedInsights.assessment || 'Analyzing your situation...'}
          </p>
        </div>
      )}
    </div>
  </div>
);

const TaskAssignmentPlaceholder = ({ tasks, userContext }) => (
  <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
    <h2
      className="text-2xl font-semibold text-stone-900 mb-4"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      Task Assignment
    </h2>
    <div className="space-y-3">
      {tasks.length > 0 ? (
        tasks.map((task, idx) => (
          <div key={idx} className="bg-stone-50 rounded-xl p-4 border border-stone-100">
            <p className="font-medium text-stone-900">{task.title}</p>
            <p className="text-sm text-stone-500 mt-1">
              Assigned to: {task.assigned_to || 'Unassigned'}
            </p>
          </div>
        ))
      ) : (
        <p className="text-stone-500">No tasks yet</p>
      )}
    </div>
  </div>
);

export default MilestoneDetailPage;
