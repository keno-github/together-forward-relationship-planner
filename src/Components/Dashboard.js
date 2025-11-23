import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, ArrowRight, Users, Calendar, User, LogOut, Sparkles, Map, TrendingUp, Wallet, CheckCircle2, Clock, Circle, MoreHorizontal, Home, Brain, Target, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserRoadmaps, getMilestonesByRoadmap, getTasksByMilestone, getExpensesByRoadmap, deleteRoadmap } from '../services/supabaseService';
import PortfolioOverview from './PortfolioOverview';

const Dashboard = ({ onContinueRoadmap, onCreateNew, onBackToHome, onOpenAssessment, onOpenPortfolioOverview }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dreams'); // 'dreams' or 'portfolio'
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingTasks, setUpcomingTasks] = useState({ overdue: [], dueThisWeek: [], noDueDate: [] });
  const [taskFilter, setTaskFilter] = useState({ dream: 'all', partner: 'all', sortBy: 'urgency' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, dream: null });
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalXP: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    openMilestones: 0,
    activeDreams: 0,
    overallVelocity: 'On Track',
    budgetHealth: 0
  });

  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: userDreams, error } = await getUserRoadmaps();

      if (error) throw error;

      if (userDreams && userDreams.length > 0) {
        // Collect all tasks across all dreams
        const allTasksWithContext = [];

        const dreamsWithProgress = await Promise.all(
          userDreams.map(async (dream) => {
            const { data: milestones } = await getMilestonesByRoadmap(dream.id);

            // Load all tasks first (needed to calculate phase completion)
            let allTasks = [];
            if (milestones && milestones.length > 0) {
              const tasksData = await Promise.all(
                milestones.map(async (milestone) => {
                  const { data: tasks } = await getTasksByMilestone(milestone.id);
                  return { milestoneId: milestone.id, tasks: tasks || [] };
                })
              );
              allTasks = tasksData;
            }

            // Count roadmap phases as milestones (not the milestone records themselves)
            let totalMilestones = 0;
            let completedMilestones = 0;

            milestones?.forEach(milestone => {
              if (milestone.deep_dive_data?.roadmapPhases && milestone.deep_dive_data.roadmapPhases.length > 0) {
                const milestoneTasks = allTasks.find(t => t.milestoneId === milestone.id)?.tasks || [];

                milestone.deep_dive_data.roadmapPhases.forEach((phase, phaseIndex) => {
                  // Count this phase as a milestone
                  totalMilestones++;

                  // Find tasks for this specific phase (using same logic as RoadmapTreeView)
                  const phaseTasks = milestoneTasks.filter(task => {
                    // First priority: tasks explicitly linked to this phase
                    if (task.roadmap_phase_index === phaseIndex) {
                      return true;
                    }
                    // Fallback: tasks without phase assignment - try keyword matching
                    if (task.roadmap_phase_index === null || task.roadmap_phase_index === undefined) {
                      const phaseKeywords = phase.title.toLowerCase().split(' ');
                      const taskTitle = (task.title || task.description || '').toLowerCase();
                      return phaseKeywords.some(keyword => keyword.length > 3 && taskTitle.includes(keyword));
                    }
                    return false;
                  });

                  // Phase is completed if it has tasks AND all tasks are completed
                  const isPhaseCompleted = phaseTasks.length > 0 && phaseTasks.every(t => t.completed);

                  if (isPhaseCompleted) {
                    completedMilestones++;
                  }
                });
              }
              // No else - if no roadmap phases, the roadmap is empty, don't count anything
            });

            // 1. Milestone Completion (30% weight)
            const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

            // 2. Task Completion (25% weight)
            let totalTasks = 0;
            let completedTasks = 0;
            if (allTasks.length > 0) {
              const tasksFlat = allTasks.flatMap(mt => mt.tasks);
              totalTasks = tasksFlat.length;
              completedTasks = tasksFlat.filter(t => t.completed).length;

              // Collect tasks with dream/milestone context for the "What Needs Attention" section
              allTasks.forEach(({ milestoneId, tasks }) => {
                const milestone = milestones.find(m => m.id === milestoneId);
                if (tasks && tasks.length > 0) {
                  tasks.forEach(task => {
                    allTasksWithContext.push({
                      ...task,
                      dreamId: dream.id,
                      dreamTitle: dream.title || 'Untitled Dream',
                      milestoneId: milestone.id,
                      milestoneTitle: milestone.title || 'Untitled Milestone'
                    });
                  });
                }
              });
            }
            const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // 3. Budget Progress (25% weight) - Based on savings pace toward target
            let budgetProgress = 0;
            const dreamBudget = dream.budget_amount || 0;
            if (dreamBudget > 0 && dream.target_date) {
              // Get total contributions (stored in expenses table)
              const { data: expenses } = await getExpensesByRoadmap(dream.id);
              const totalContributions = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

              // Calculate expected contributions based on time elapsed
              const startDate = new Date(dream.created_at);
              const targetDate = new Date(dream.target_date);
              const currentDate = new Date();

              const totalTime = targetDate - startDate;
              const timeElapsed = currentDate - startDate;

              if (totalTime > 0 && timeElapsed > 0) {
                // Expected contributions = budget * (time elapsed / total time)
                const expectedContributions = dreamBudget * (timeElapsed / totalTime);

                // Budget progress = actual / expected * 100
                // >100% means ahead of schedule, <100% means behind
                budgetProgress = expectedContributions > 0
                  ? Math.min((totalContributions / expectedContributions) * 100, 200)
                  : 0;
              } else if (timeElapsed <= 0) {
                // Haven't started yet - 100% health
                budgetProgress = 100;
              }
            } else if (dreamBudget > 0) {
              // No target date set - just show contribution progress
              const { data: expenses } = await getExpensesByRoadmap(dream.id);
              const totalContributions = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
              budgetProgress = Math.min((totalContributions / dreamBudget) * 100, 100);
            }

            // 4. Timeline Progress (20% weight)
            let timelineProgress = 0;
            if (dream.target_date) {
              const startDate = new Date(dream.created_at);
              const targetDate = new Date(dream.target_date);
              const currentDate = new Date();

              const totalDuration = targetDate - startDate;
              const elapsed = currentDate - startDate;

              if (totalDuration > 0) {
                timelineProgress = Math.min((elapsed / totalDuration) * 100, 100);
              }
            } else if (milestones && milestones.length > 0) {
              // Fallback: Use earliest and latest milestone target dates
              const targetDates = milestones
                .map(m => m.target_date)
                .filter(d => d)
                .map(d => new Date(d));

              if (targetDates.length > 0) {
                const startDate = new Date(dream.created_at);
                const latestTargetDate = new Date(Math.max(...targetDates));
                const currentDate = new Date();

                const totalDuration = latestTargetDate - startDate;
                const elapsed = currentDate - startDate;

                if (totalDuration > 0) {
                  timelineProgress = Math.min((elapsed / totalDuration) * 100, 100);
                }
              }
            }

            // Calculate weighted overall progress
            // Milestone: 30%, Task: 25%, Budget: 25%, Timeline: 20%
            const progress = (
              (milestoneProgress * 0.30) +
              (taskProgress * 0.25) +
              (budgetProgress * 0.25) +
              (timelineProgress * 0.20)
            );

            return {
              ...dream,
              milestones: milestones || [],
              totalMilestones,
              completedMilestones,
              totalTasks,
              completedTasks,
              progress,
              budgetProgress,
              // Store individual metrics for debugging/display
              metrics: {
                milestoneProgress: Math.round(milestoneProgress),
                taskProgress: Math.round(taskProgress),
                budgetProgress: Math.round(budgetProgress),
                timelineProgress: Math.round(timelineProgress)
              }
            };
          })
        );

        setDreams(dreamsWithProgress);

        const totalXP = dreamsWithProgress.reduce((sum, d) => sum + (d.xp_points || 0), 0);
        const totalMilestones = dreamsWithProgress.reduce((sum, d) => sum + d.totalMilestones, 0);
        const completedMilestones = dreamsWithProgress.reduce((sum, d) => sum + d.completedMilestones, 0);
        const avgBudgetHealth = dreamsWithProgress.reduce((sum, d) => sum + (d.budgetProgress || 0), 0) / dreamsWithProgress.length;


        // Calculate velocity (simplified - could be more sophisticated)
        const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) : 0;
        let velocity = 'On Track';
        if (completionRate >= 0.7) velocity = 'Excellent';
        else if (completionRate >= 0.4) velocity = 'On Track';
        else velocity = 'Needs Attention';

        const openMilestones = totalMilestones - completedMilestones;

        setStats({
          totalXP,
          totalMilestones,
          completedMilestones,
          openMilestones,
          activeDreams: dreamsWithProgress.length,
          overallVelocity: velocity,
          budgetHealth: Math.round(avgBudgetHealth)
        });

        // Categorize tasks by urgency
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const oneWeekFromNow = new Date(today);
        oneWeekFromNow.setDate(today.getDate() + 7);

        const incompleteTasks = allTasksWithContext.filter(t => !t.completed);

        const overdue = incompleteTasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        });

        const dueThisWeek = incompleteTasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today && dueDate <= oneWeekFromNow;
        });

        const noDueDate = incompleteTasks.filter(t => !t.due_date);

        setUpcomingTasks({ overdue, dueThisWeek, noDueDate });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete dream
  const handleDeleteDream = async () => {
    if (!deleteConfirm.dream) return;

    setDeleting(true);
    try {
      const { error } = await deleteRoadmap(deleteConfirm.dream.id);

      if (error) {
        console.error('Error deleting dream:', error);
        alert('Failed to delete dream. Please try again.');
        return;
      }

      console.log('✅ Dream deleted successfully:', deleteConfirm.dream.title);

      // Close confirmation dialog
      setDeleteConfirm({ show: false, dream: null });

      // Reload dashboard data
      await loadUserData();
    } catch (error) {
      console.error('Error deleting dream:', error);
      alert('An error occurred while deleting the dream.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter and sort tasks
  const getFilteredTasks = () => {
    let allTasks = [...upcomingTasks.overdue, ...upcomingTasks.dueThisWeek];

    // Filter by dream
    if (taskFilter.dream !== 'all') {
      allTasks = allTasks.filter(t => t.dreamId === taskFilter.dream);
    }

    // Filter by partner
    if (taskFilter.partner !== 'all') {
      allTasks = allTasks.filter(t => t.assigned_to === taskFilter.partner);
    }

    // Sort
    if (taskFilter.sortBy === 'urgency') {
      // Already sorted by urgency (overdue first, then due this week)
    } else if (taskFilter.sortBy === 'dream') {
      allTasks.sort((a, b) => a.dreamTitle.localeCompare(b.dreamTitle));
    } else if (taskFilter.sortBy === 'dueDate') {
      allTasks.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    }

    return allTasks;
  };

  // Get unique partners from tasks
  const getUniquePartners = () => {
    const allTasks = [...upcomingTasks.overdue, ...upcomingTasks.dueThisWeek];
    const partners = [...new Set(allTasks.map(t => t.assigned_to).filter(Boolean))];
    return partners;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading your dreams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8]">

      {/* Header */}
      <div className="bg-white sticky top-0 z-30 border-b border-stone-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">TogetherForward</h1>
              <p className="text-xs text-stone-500">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3 py-2 rounded-lg hover:bg-stone-50 border border-stone-200 transition-colors flex items-center gap-2"
                title="Back to Home"
              >
                <Home className="w-4 h-4 text-stone-600" />
                <span className="text-sm font-medium text-stone-700">Home</span>
              </button>
            )}
            <div className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-2">
              <User className="w-4 h-4 text-stone-600" />
              <span className="text-sm font-medium text-stone-900">{user?.email?.split('@')[0]}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg hover:bg-stone-50 border border-stone-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-8 border-b border-stone-200">
          <button
            onClick={() => setActiveTab('dreams')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === 'dreams'
                ? 'text-stone-900'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Heart className="w-4 h-4 inline-block mr-2" />
            Your Dreams
            {activeTab === 'dreams' && (
              <motion.div
                layoutId="dashboardTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === 'portfolio'
                ? 'text-stone-900'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Brain className="w-4 h-4 inline-block mr-2" />
            Portfolio Intelligence
            {activeTab === 'portfolio' && (
              <motion.div
                layoutId="dashboardTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dreams' ? (
          <>
            {/* Welcome Section */}
            <header className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-serif text-stone-900 mb-2">
                  Your Dreams
                </h2>
                <p className="text-stone-500">
                  You have {stats.activeDreams} active {stats.activeDreams === 1 ? 'dream' : 'dreams'} in progress
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateNew}
                className="bg-emerald-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Dream
              </motion.button>
            </header>

        {/* Top Stats - At-a-Glance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <StatCard
            icon={<TrendingUp className="text-emerald-600" />}
            label="Overall Velocity"
            value={stats.overallVelocity}
            sub={`${stats.completedMilestones} of ${stats.totalMilestones} milestones completed`}
            bg="bg-emerald-50"
          />
          <StatCard
            icon={<Map className="text-indigo-600" />}
            label="Open Milestones"
            value={stats.openMilestones}
            sub="Across all dreams"
            bg="bg-indigo-50"
          />
          <StatCard
            icon={<Wallet className="text-orange-600" />}
            label="Budget Health"
            value={`${stats.budgetHealth}%`}
            sub={
              stats.budgetHealth >= 100
                ? "On track or ahead"
                : stats.budgetHealth >= 80
                ? "Slightly behind"
                : stats.budgetHealth >= 50
                ? "Need to save more"
                : "Urgently behind"
            }
            bg="bg-orange-50"
          />
        </motion.div>

        {/* Upcoming Tasks Section */}
        {(upcomingTasks.overdue.length > 0 || upcomingTasks.dueThisWeek.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="bg-white rounded-2xl p-6 border-2 border-stone-200 shadow-md">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">What Needs Attention</h3>
                    <p className="text-sm text-stone-600">
                      {upcomingTasks.overdue.length > 0 && `${upcomingTasks.overdue.length} overdue`}
                      {upcomingTasks.overdue.length > 0 && upcomingTasks.dueThisWeek.length > 0 && ' • '}
                      {upcomingTasks.dueThisWeek.length > 0 && `${upcomingTasks.dueThisWeek.length} due this week`}
                    </p>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-2">
                  {/* Dream Filter */}
                  <select
                    value={taskFilter.dream}
                    onChange={(e) => setTaskFilter({ ...taskFilter, dream: e.target.value })}
                    className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Dreams</option>
                    {dreams.map(dream => (
                      <option key={dream.id} value={dream.id}>{dream.title || 'Untitled'}</option>
                    ))}
                  </select>

                  {/* Partner Filter */}
                  {getUniquePartners().length > 0 && (
                    <select
                      value={taskFilter.partner}
                      onChange={(e) => setTaskFilter({ ...taskFilter, partner: e.target.value })}
                      className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Partners</option>
                      {getUniquePartners().map(partner => (
                        <option key={partner} value={partner}>{partner}</option>
                      ))}
                    </select>
                  )}

                  {/* Sort By */}
                  <select
                    value={taskFilter.sortBy}
                    onChange={(e) => setTaskFilter({ ...taskFilter, sortBy: e.target.value })}
                    className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  >
                    <option value="urgency">Sort: Urgency</option>
                    <option value="dueDate">Sort: Due Date</option>
                    <option value="dream">Sort: Dream</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {/* Filtered Tasks */}
                {getFilteredTasks().slice(0, 10).map((task) => {
                  const isOverdue = upcomingTasks.overdue.some(t => t.id === task.id);
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      urgency={isOverdue ? 'overdue' : 'upcoming'}
                      onClick={() => {
                        const dream = dreams.find(d => d.id === task.dreamId);
                        if (dream) {
                          onContinueRoadmap(dream, 'tasks');
                        }
                      }}
                    />
                  );
                })}

                {/* No tasks message */}
                {getFilteredTasks().length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-stone-500">No tasks match your filters</p>
                  </div>
                )}

                {/* Show "View All" if more than 10 tasks */}
                {getFilteredTasks().length > 10 && (
                  <button className="w-full mt-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors">
                    View all {getFilteredTasks().length} tasks →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Portfolio Overview Card - NEW (Show when user has 2+ dreams) */}
        {dreams.length >= 2 && onOpenPortfolioOverview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all group cursor-pointer"
              onClick={onOpenPortfolioOverview}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Portfolio Overview</h3>
                      <p className="text-sm text-white/90">See how all your dreams work together</p>
                    </div>
                  </div>
                  <p className="text-white/90 mb-4 leading-relaxed">
                    View conflicts, synergies, and dependencies across all {dreams.length} dreams. Get Luna's insights on optimal sequencing and resource allocation.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                      Cross-Dream Analysis
                    </span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                      Budget Distribution
                    </span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                      Timeline Conflicts
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-md flex items-center gap-2 group-hover:gap-3"
                  >
                    View Portfolio <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dreams Section */}
        {dreams.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-stone-200 rounded-2xl p-16 text-center"
          >
            <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-stone-600" />
            </div>
            <h3 className="text-2xl font-serif text-stone-900 mb-3">Start Your Journey</h3>
            <p className="text-stone-600 mb-8 max-w-md mx-auto">
              You haven't created any dreams yet. Let's build your future together!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateNew}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Dream
            </motion.button>
          </motion.div>
        ) : (
          /* Dream Cards Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {dreams.map((dream, index) => (
              <motion.div
                key={dream.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => onContinueRoadmap(dream)}
                className="group bg-white border border-stone-200 rounded-2xl p-8 hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Delete Button - Top Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ show: true, dream });
                  }}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white border border-stone-200 hover:border-red-300 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 z-10"
                  title="Delete dream"
                >
                  <Trash2 className="w-4 h-4 text-stone-600 hover:text-red-600" />
                </button>

                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-stone-100 text-stone-700 text-xs font-bold uppercase tracking-wide rounded">
                        Active
                      </span>
                      <span className="text-xs text-stone-400">
                        Updated {new Date(dream.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-serif text-stone-900 group-hover:text-emerald-800 transition-colors mb-2">
                      {dream.title || 'Our Dream Together'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Users className="w-4 h-4" />
                      <span>{dream.partner1_name || 'Partner 1'} & {dream.partner2_name || 'Partner 2'}</span>
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#059669"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="175"
                        strokeDashoffset={175 - (175 * (dream.progress / 100))}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-emerald-700">
                      {Math.round(dream.progress)}%
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  {/* Milestones Metric */}
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider font-medium">Milestones</p>
                    <div className="flex items-center gap-2">
                      <Map size={16} className="text-stone-400"/>
                      <span className="font-semibold text-stone-800">
                        {dream.completedMilestones} of {dream.totalMilestones}
                      </span>
                    </div>
                  </div>

                  {/* Budget Metric */}
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider font-medium">Budget</p>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-1000"
                        style={{ width: `${Math.min(dream.budgetProgress || 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-stone-500">
                      {dream.budgetProgress ? `${Math.round(dream.budgetProgress)}% spent` : 'Not set'}
                    </p>
                  </div>

                  {/* Tasks Metric */}
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider font-medium">Tasks</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-stone-400"/>
                      <span className="font-semibold text-stone-800">
                        {dream.completedTasks} of {dream.totalTasks}
                      </span>
                    </div>
                  </div>

                  {/* Target Date */}
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider font-medium">Target</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-stone-400"/>
                      <span className="font-semibold text-stone-800 text-sm">
                        {dream.target_date
                          ? new Date(dream.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'Not set'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all opacity-0 group-hover:opacity-100">
                  <ArrowRight size={20} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

          </>
        ) : (
          /* Portfolio Intelligence Tab */
          <PortfolioOverview
            onBack={() => setActiveTab('dreams')}
            userId={user?.id}
            userContext={{ partner1: user?.user_metadata?.partner1, partner2: user?.user_metadata?.partner2 }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {deleteConfirm.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setDeleteConfirm({ show: false, dream: null })}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Delete Dream?</h3>
                    <p className="text-sm text-stone-600">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-sm text-stone-700 mb-2">
                    You're about to permanently delete:
                  </p>
                  <p className="font-semibold text-stone-900">
                    {deleteConfirm.dream?.title || 'Untitled Dream'}
                  </p>
                  <p className="text-xs text-stone-500 mt-2">
                    This will delete all milestones, tasks, and expenses associated with this dream.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm({ show: false, dream: null })}
                    disabled={deleting}
                    className="flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteDream}
                    disabled={deleting}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Dream
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, bg }) => (
  <div className="bg-white p-6 rounded-xl border border-stone-200 flex items-start gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-lg ${bg}`}>{icon}</div>
    <div>
      <p className="text-stone-500 text-xs uppercase font-bold tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-serif text-stone-900 mb-1">{value}</p>
      <p className="text-stone-400 text-xs">{sub}</p>
    </div>
  </div>
);

const TaskItem = ({ task, urgency, onClick }) => {
  const isOverdue = urgency === 'overdue';
  const dueDate = task.due_date ? new Date(task.due_date) : null;

  const formatDueDate = (date) => {
    if (!date) return 'No due date';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `Due in ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 cursor-pointer transition-all
        ${isOverdue
          ? 'border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
          : 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-600' : 'bg-amber-600'}`} />
            <p className="font-semibold text-stone-900 truncate">{task.title}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {task.dreamTitle}
            </span>
            <span>•</span>
            <span>{task.milestoneTitle}</span>
          </div>

          {task.assigned_to && (
            <div className="mt-2 flex items-center gap-1 text-xs text-stone-500">
              <User className="w-3 h-3" />
              Assigned to {task.assigned_to}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs font-bold ${isOverdue ? 'text-red-700' : 'text-amber-700'}`}>
            {formatDueDate(dueDate)}
          </span>
          <ArrowRight className="w-4 h-4 text-stone-400" />
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
