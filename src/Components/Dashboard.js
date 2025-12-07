import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, ArrowRight, Users, Calendar, User, LogOut, Sparkles, Map, TrendingUp, Wallet, CheckCircle2, Clock, Home, Target, Trash2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserRoadmaps, getMilestonesByRoadmap, getTasksByMilestone, getExpensesByRoadmap, deleteRoadmap, deleteMilestone, deleteTask, deleteExpense } from '../services/supabaseService';
import { useDashboardData, useDashboardCache } from '../hooks/useDashboardData';
import DashboardSkeleton from './DashboardSkeleton';
import { NotificationCenter } from './Notifications';

// Feature flag: Set to true to use the new optimized RPC-based loading
// Set to false to use legacy loading (for fallback)
const USE_OPTIMIZED_LOADING = true;

// Inline styles for custom fonts
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

const Dashboard = ({ onContinueRoadmap, onCreateNew, onBackToHome, onOpenAssessment, onOpenPortfolioOverview, successNotification, onDismissNotification }) => {
  const { user, signOut } = useAuth();
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState({ overdue: [], dueThisWeek: [], noDueDate: [] });
  const [taskFilter, setTaskFilter] = useState({ dream: 'all', partner: 'all', sortBy: 'urgency' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, dream: null });
  const [deleting, setDeleting] = useState(false);
  const [hoveredDream, setHoveredDream] = useState(null);
  const [useLegacyLoading, setUseLegacyLoading] = useState(!USE_OPTIMIZED_LOADING);
  const [stats, setStats] = useState({
    totalXP: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    openMilestones: 0,
    activeDreams: 0,
    overallVelocity: 'On Track',
    budgetHealth: 0
  });

  // Track mounted state to prevent state updates on unmounted component
  const isMountedRef = useRef(true);

  // React Query hook for optimized loading (only used when USE_OPTIMIZED_LOADING is true)
  const { invalidateDashboard } = useDashboardCache();
  const {
    data: rpcData,
    isLoading: rpcLoading,
    error: rpcError,
    refetch: rpcRefetch
  } = useDashboardData(1, {
    enabled: USE_OPTIMIZED_LOADING && !!user?.id && !useLegacyLoading,
  });

  // Transform RPC data to component format when available
  useEffect(() => {
    if (!USE_OPTIMIZED_LOADING || useLegacyLoading) return;

    if (rpcError) {
      // RPC failed (function might not exist yet), fall back to legacy loading
      console.log('📊 RPC not available, falling back to legacy loading');
      setUseLegacyLoading(true);
      return;
    }

    if (rpcData && rpcData.dreams) {
      // Transform RPC response to component format
      const transformedDreams = rpcData.dreams.map(dream => ({
        ...dream,
        progress: dream.progress_percentage || 0,
        totalMilestones: dream.total_milestones || 0,
        completedMilestones: dream.completed_milestones || 0,
        totalTasks: dream.total_tasks || 0,
        completedTasks: dream.completed_tasks || 0,
        budgetProgress: dream.budget_amount > 0
          ? Math.min((dream.budget_spent / dream.budget_amount) * 100, 200)
          : 0,
        milestones: [], // Will be loaded on click
      }));

      setDreams(transformedDreams);

      // Set stats from RPC response
      const totalMilestones = transformedDreams.reduce((sum, d) => sum + d.totalMilestones, 0);
      const completedMilestones = transformedDreams.reduce((sum, d) => sum + d.completedMilestones, 0);
      const avgBudgetHealth = transformedDreams.length > 0
        ? transformedDreams.reduce((sum, d) => sum + (d.budgetProgress || 0), 0) / transformedDreams.length
        : 0;

      const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) : 0;
      let velocity = 'On Track';
      if (completionRate >= 0.7) velocity = 'Excellent';
      else if (completionRate >= 0.4) velocity = 'On Track';
      else velocity = 'Needs Attention';

      setStats({
        totalXP: rpcData.stats?.total_xp || 0,
        totalMilestones,
        completedMilestones,
        openMilestones: totalMilestones - completedMilestones,
        activeDreams: rpcData.stats?.active_dreams || transformedDreams.length,
        overallVelocity: velocity,
        budgetHealth: Math.round(avgBudgetHealth)
      });

      // Set upcoming tasks from next_task data
      const overdueTasks = transformedDreams
        .filter(d => d.next_task && d.overdue_tasks > 0)
        .map(d => ({
          ...d.next_task,
          dreamId: d.id,
          dreamTitle: d.title,
        }));

      setUpcomingTasks({
        overdue: overdueTasks,
        dueThisWeek: [],
        noDueDate: []
      });

      setLoading(false);
    }
  }, [rpcData, rpcError, useLegacyLoading]);

  // Update loading state from RPC
  useEffect(() => {
    if (USE_OPTIMIZED_LOADING && !useLegacyLoading) {
      setLoading(rpcLoading);
    }
  }, [rpcLoading, useLegacyLoading]);

  // Inject fonts
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = fontStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  // LEGACY: useEffect for data loading - only used when RPC is not available
  useEffect(() => {
    if (!useLegacyLoading) return; // Skip if using optimized loading

    isMountedRef.current = true;

    if (user?.id) {
      loadUserData();
    } else {
      setLoading(false);
      setDreams([]);
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, useLegacyLoading]); // Run on mount AND when user changes

  const loadUserData = async () => {
    // Guard: No user
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      // Simple fetch - no aggressive timeouts
      const { data: userDreams, error } = await getUserRoadmaps();

      // Check if component unmounted
      if (!isMountedRef.current) return;

      if (error) throw error;

      if (userDreams && userDreams.length > 0) {
        const allTasksWithContext = [];

        const dreamsWithProgress = await Promise.all(
          userDreams.map(async (dream) => {
            // Simple fetch - graceful fallback on error
            const { data: milestones } = await getMilestonesByRoadmap(dream.id)
              .catch(() => ({ data: [] }));

            let allTasks = [];
            if (milestones && milestones.length > 0) {
              const tasksData = await Promise.all(
                milestones.map(async (milestone) => {
                  const { data: tasks } = await getTasksByMilestone(milestone.id)
                    .catch(() => ({ data: [] }));
                  return { milestoneId: milestone.id, tasks: tasks || [] };
                })
              );
              allTasks = tasksData;
            }

            let totalMilestones = 0;
            let completedMilestones = 0;

            milestones?.forEach(milestone => {
              if (milestone.deep_dive_data?.roadmapPhases && milestone.deep_dive_data.roadmapPhases.length > 0) {
                const milestoneTasks = allTasks.find(t => t.milestoneId === milestone.id)?.tasks || [];

                milestone.deep_dive_data.roadmapPhases.forEach((phase, phaseIndex) => {
                  totalMilestones++;

                  const phaseTasks = milestoneTasks.filter(task => {
                    if (task.roadmap_phase_index === phaseIndex) {
                      return true;
                    }
                    if (task.roadmap_phase_index === null || task.roadmap_phase_index === undefined) {
                      const phaseKeywords = phase.title.toLowerCase().split(' ');
                      const taskTitle = (task.title || task.description || '').toLowerCase();
                      return phaseKeywords.some(keyword => keyword.length > 3 && taskTitle.includes(keyword));
                    }
                    return false;
                  });

                  const isPhaseCompleted = phaseTasks.length > 0 && phaseTasks.every(t => t.completed);

                  if (isPhaseCompleted) {
                    completedMilestones++;
                  }
                });
              }
            });

            const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

            let totalTasks = 0;
            let completedTasks = 0;
            if (allTasks.length > 0) {
              const tasksFlat = allTasks.flatMap(mt => mt.tasks);
              totalTasks = tasksFlat.length;
              completedTasks = tasksFlat.filter(t => t.completed).length;

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

            let budgetProgress = 0;
            const dreamBudget = dream.budget_amount || 0;
            if (dreamBudget > 0 && dream.target_date) {
              const { data: expenses } = await getExpensesByRoadmap(dream.id);
              const totalContributions = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

              const startDate = new Date(dream.created_at);
              const targetDate = new Date(dream.target_date);
              const currentDate = new Date();

              const totalTime = targetDate - startDate;
              const timeElapsed = currentDate - startDate;

              if (totalTime > 0 && timeElapsed > 0) {
                const expectedContributions = dreamBudget * (timeElapsed / totalTime);
                budgetProgress = expectedContributions > 0
                  ? Math.min((totalContributions / expectedContributions) * 100, 200)
                  : 0;
              } else if (timeElapsed <= 0) {
                budgetProgress = 100;
              }
            } else if (dreamBudget > 0) {
              const { data: expenses } = await getExpensesByRoadmap(dream.id);
              const totalContributions = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
              budgetProgress = Math.min((totalContributions / dreamBudget) * 100, 100);
            }

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

            const progress = (
              (milestoneProgress * 0.30) +
              (taskProgress * 0.25) +
              (budgetProgress * 0.25) +
              (timelineProgress * 0.20)
            );

            // Calculate total budget from milestones if dream doesn't have one
            const calculatedBudget = dream.budget_amount ||
              (milestones?.reduce((sum, m) => sum + (m.budget_amount || m.estimatedCost || 0), 0) || 0);

            // Calculate target date from milestones if dream doesn't have one
            const milestoneDates = milestones
              ?.filter(m => m.target_date)
              .map(m => new Date(m.target_date))
              .filter(d => !isNaN(d.getTime())) || [];
            const calculatedTargetDate = dream.target_date ||
              (milestoneDates.length > 0 ? new Date(Math.max(...milestoneDates)).toISOString() : null);

            return {
              ...dream,
              milestones: milestones || [],
              totalMilestones,
              completedMilestones,
              totalTasks,
              completedTasks,
              progress,
              budgetProgress,
              // Use calculated values for display
              budget_amount: calculatedBudget,
              target_date: calculatedTargetDate,
              metrics: {
                milestoneProgress: Math.round(milestoneProgress),
                taskProgress: Math.round(taskProgress),
                budgetProgress: Math.round(budgetProgress),
                timelineProgress: Math.round(timelineProgress)
              }
            };
          })
        );

        // Check again after all async operations - component may have unmounted
        if (!isMountedRef.current) return;

        setDreams(dreamsWithProgress);

        const totalXP = dreamsWithProgress.reduce((sum, d) => sum + (d.xp_points || 0), 0);
        const totalMilestones = dreamsWithProgress.reduce((sum, d) => sum + d.totalMilestones, 0);
        const completedMilestones = dreamsWithProgress.reduce((sum, d) => sum + d.completedMilestones, 0);
        const avgBudgetHealth = dreamsWithProgress.reduce((sum, d) => sum + (d.budgetProgress || 0), 0) / dreamsWithProgress.length;

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
      if (isMountedRef.current) {
        setLoadError(error.message || 'Failed to load your dreams. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Retry handler - works with both optimized and legacy loading
  const handleRetryLoad = () => {
    setLoadError(null);
    if (USE_OPTIMIZED_LOADING && !useLegacyLoading) {
      rpcRefetch();
    } else {
      loadUserData();
    }
  };

  // Refresh handler for after mutations (delete, etc.)
  const refreshDashboard = async () => {
    if (USE_OPTIMIZED_LOADING && !useLegacyLoading) {
      invalidateDashboard();
    } else {
      await loadUserData();
    }
  };

  const handleDeleteDream = async () => {
    if (!deleteConfirm.dream) return;

    const dreamId = deleteConfirm.dream.id;
    setDeleting(true);

    try {
      console.log('🗑️ Starting deletion of dream:', dreamId);

      // Step 1: Get all milestones for this dream
      const { data: milestones } = await getMilestonesByRoadmap(dreamId);
      console.log('📋 Found milestones:', milestones?.length || 0);

      // Step 2: Delete all tasks and expenses for each milestone
      if (milestones && milestones.length > 0) {
        for (const milestone of milestones) {
          // Delete tasks for this milestone
          const { data: tasks } = await getTasksByMilestone(milestone.id);
          if (tasks && tasks.length > 0) {
            console.log(`🔧 Deleting ${tasks.length} tasks for milestone:`, milestone.title);
            for (const task of tasks) {
              await deleteTask(task.id);
            }
          }

          // Delete the milestone
          console.log('🎯 Deleting milestone:', milestone.title);
          await deleteMilestone(milestone.id);
        }
      }

      // Step 3: Delete all expenses for this roadmap
      const { data: expenses } = await getExpensesByRoadmap(dreamId);
      if (expenses && expenses.length > 0) {
        console.log(`💰 Deleting ${expenses.length} expenses`);
        for (const expense of expenses) {
          await deleteExpense(expense.id);
        }
      }

      // Step 4: Finally delete the roadmap
      console.log('🏠 Deleting roadmap');
      const { error } = await deleteRoadmap(dreamId);

      if (error) {
        console.error('Error deleting dream:', error);
        alert('Failed to delete dream. Please try again.');
        return;
      }

      console.log('✅ Dream deleted successfully!');
      setDeleteConfirm({ show: false, dream: null });

      // Refresh the dashboard (uses optimized or legacy method automatically)
      await refreshDashboard();
    } catch (error) {
      console.error('Error deleting dream:', error);
      alert('An error occurred while deleting the dream.');
    } finally {
      setDeleting(false);
    }
  };

  const getFilteredTasks = () => {
    let allTasks = [...upcomingTasks.overdue, ...upcomingTasks.dueThisWeek];

    if (taskFilter.dream !== 'all') {
      allTasks = allTasks.filter(t => t.dreamId === taskFilter.dream);
    }

    if (taskFilter.partner !== 'all') {
      allTasks = allTasks.filter(t => t.assigned_to === taskFilter.partner);
    }

    if (taskFilter.sortBy === 'dream') {
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

  const getUniquePartners = () => {
    const allTasks = [...upcomingTasks.overdue, ...upcomingTasks.dueThisWeek];
    const partners = [...new Set(allTasks.map(t => t.assigned_to).filter(Boolean))];
    return partners;
  };

  if (loading) {
    // Use skeleton loading for better UX (shows content structure immediately)
    return <DashboardSkeleton />;
  }

  // Error state with retry option
  if (loadError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FAF7F2', fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center max-w-md px-6">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: '#FEE2E2' }}
          >
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#2D2926' }}>
            Something went wrong
          </h2>
          <p className="mb-6" style={{ color: '#6B5E54' }}>
            {loadError}
          </p>
          <button
            onClick={handleRetryLoad}
            className="px-6 py-3 rounded-xl font-medium transition-all"
            style={{
              backgroundColor: '#C4785A',
              color: 'white'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: '#FAF7F2',
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {/* Subtle texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg"
              style={{
                backgroundColor: '#10B981',
                color: 'white'
              }}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{successNotification.message}</span>
              <button
                onClick={onDismissNotification}
                className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          backgroundColor: 'rgba(250, 247, 242, 0.97)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E8E2DA'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#2D2926' }}
            >
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h1
                className="text-lg font-semibold"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: '#2D2926'
                }}
              >
                TwogetherForward
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #E8E2DA',
                  color: '#6B5E54'
                }}
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Home</span>
              </button>
            )}
            {/* Notification Bell */}
            <div
              className="rounded-lg"
              style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
            >
              <NotificationCenter
                onNotificationClick={(notification) => {
                  // Handle notification click - could navigate to relevant dream/task
                  if (notification.data?.roadmap_id) {
                    const dream = dreams.find(d => d.id === notification.data.roadmap_id);
                    if (dream) {
                      onContinueRoadmap(dream);
                    }
                  }
                }}
              />
            </div>
            <div
              className="px-3 py-2 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
            >
              <User className="w-4 h-4" style={{ color: '#6B5E54' }} />
              <span className="text-sm font-medium" style={{ color: '#2D2926' }}>
                {user?.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" style={{ color: '#6B5E54' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <motion.p
                className="text-xs font-medium tracking-[0.2em] uppercase mb-2"
                style={{ color: '#C4785A' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Welcome Back
              </motion.p>
              <motion.h2
                className="text-3xl md:text-4xl font-light"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: '#2D2926'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Your <span className="italic font-medium" style={{ color: '#C4785A' }}>Dreams</span>
              </motion.h2>
              <motion.p
                className="text-sm mt-2"
                style={{ color: '#6B5E54' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {stats.activeDreams} active {stats.activeDreams === 1 ? 'dream' : 'dreams'} in progress
              </motion.p>
            </div>
            <motion.button
              onClick={onCreateNew}
              className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all self-start md:self-auto"
              style={{ backgroundColor: '#2D2926', color: 'white' }}
              whileHover={{ backgroundColor: '#C4785A', scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Plus className="w-5 h-5" />
              New Dream
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            iconBg="#E8F5E9"
            iconColor="#2E7D32"
            label="Velocity"
            value={stats.overallVelocity}
            sub={`${stats.completedMilestones}/${stats.totalMilestones} milestones`}
          />
          <StatCard
            icon={<Map className="w-5 h-5" />}
            iconBg="#FEF7ED"
            iconColor="#C4785A"
            label="Open Milestones"
            value={stats.openMilestones}
            sub="Across all dreams"
          />
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            iconBg="#FFF3E0"
            iconColor="#E65100"
            label="Budget Health"
            value={`${stats.budgetHealth}%`}
            sub={
              stats.budgetHealth >= 100 ? "On track" :
              stats.budgetHealth >= 80 ? "Slightly behind" :
              stats.budgetHealth >= 50 ? "Need attention" : "Urgently behind"
            }
          />
        </motion.div>

        {/* Attention Tasks */}
        {(upcomingTasks.overdue.length > 0 || upcomingTasks.dueThisWeek.length > 0) && (
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className="rounded-xl p-5 md:p-6"
              style={{
                backgroundColor: 'white',
                border: '1px solid #E8E2DA',
                boxShadow: '0 2px 8px -2px rgba(45, 41, 38, 0.06)'
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#FEF3C7' }}
                  >
                    <Clock className="w-5 h-5" style={{ color: '#D97706' }} />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        color: '#2D2926'
                      }}
                    >
                      Needs Attention
                    </h3>
                    <p className="text-xs" style={{ color: '#6B5E54' }}>
                      {upcomingTasks.overdue.length > 0 && `${upcomingTasks.overdue.length} overdue`}
                      {upcomingTasks.overdue.length > 0 && upcomingTasks.dueThisWeek.length > 0 && ' · '}
                      {upcomingTasks.dueThisWeek.length > 0 && `${upcomingTasks.dueThisWeek.length} due soon`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={taskFilter.dream}
                    onChange={(e) => setTaskFilter({ ...taskFilter, dream: e.target.value })}
                    className="px-3 py-1.5 text-xs rounded-lg outline-none"
                    style={{
                      backgroundColor: '#FAF7F2',
                      border: '1px solid #E8E2DA',
                      color: '#2D2926'
                    }}
                  >
                    <option value="all">All Dreams</option>
                    {dreams.map(dream => (
                      <option key={dream.id} value={dream.id}>{dream.title || 'Untitled'}</option>
                    ))}
                  </select>

                  <select
                    value={taskFilter.sortBy}
                    onChange={(e) => setTaskFilter({ ...taskFilter, sortBy: e.target.value })}
                    className="px-3 py-1.5 text-xs rounded-lg outline-none"
                    style={{
                      backgroundColor: '#FAF7F2',
                      border: '1px solid #E8E2DA',
                      color: '#2D2926'
                    }}
                  >
                    <option value="urgency">By Urgency</option>
                    <option value="dueDate">By Date</option>
                    <option value="dream">By Dream</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {getFilteredTasks().slice(0, 8).map((task) => {
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

                {getFilteredTasks().length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm" style={{ color: '#8B8178' }}>No tasks match your filters</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Portfolio Overview Card */}
        {dreams.length >= 2 && onOpenPortfolioOverview && (
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="rounded-xl p-6 cursor-pointer transition-all"
              style={{
                backgroundColor: '#2D2926',
                boxShadow: '0 4px 20px -4px rgba(45, 41, 38, 0.2)'
              }}
              onClick={onOpenPortfolioOverview}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(196, 120, 90, 0.2)' }}
                  >
                    <Target className="w-6 h-6" style={{ color: '#C4785A' }} />
                  </div>
                  <div>
                    <h3
                      className="text-xl font-semibold text-white mb-1"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      Portfolio Overview
                    </h3>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      See how all {dreams.length} dreams work together
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <span className="text-sm font-medium hidden sm:inline">View Analysis</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Dreams Grid */}
        {dreams.length === 0 ? (
          <motion.div
            className="rounded-xl p-12 text-center"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: '#F5F1EC' }}
            >
              <Sparkles className="w-7 h-7" style={{ color: '#C4785A' }} />
            </div>
            <h3
              className="text-2xl font-light mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: '#2D2926'
              }}
            >
              Start Your Journey
            </h3>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: '#6B5E54' }}>
              You haven't created any dreams yet. Let's build your future together.
            </p>
            <motion.button
              onClick={onCreateNew}
              className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-all"
              style={{ backgroundColor: '#2D2926', color: 'white' }}
              whileHover={{ backgroundColor: '#C4785A' }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              Create Your First Dream
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {dreams.map((dream, index) => (
              <motion.div
                key={dream.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => onContinueRoadmap(dream)}
                onMouseEnter={() => setHoveredDream(dream.id)}
                onMouseLeave={() => setHoveredDream(null)}
                className="group rounded-xl p-6 cursor-pointer transition-all relative overflow-hidden"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #E8E2DA',
                  boxShadow: hoveredDream === dream.id
                    ? '0 12px 32px -8px rgba(45, 41, 38, 0.15)'
                    : '0 2px 8px -2px rgba(45, 41, 38, 0.06)'
                }}
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ show: true, dream });
                  }}
                  className="absolute top-4 right-4 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #E8E2DA'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FCA5A5';
                    e.currentTarget.style.backgroundColor = '#FEF2F2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E8E2DA';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                  title="Delete dream"
                >
                  <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                </button>

                {/* Header */}
                <div className="flex justify-between items-start mb-5 pr-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium"
                        style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}
                      >
                        Active
                      </span>
                      <span className="text-[10px]" style={{ color: '#A09890' }}>
                        Updated {new Date(dream.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3
                      className="text-xl font-semibold mb-1 transition-colors"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        color: hoveredDream === dream.id ? '#C4785A' : '#2D2926'
                      }}
                    >
                      {dream.title || 'Our Dream Together'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B5E54' }}>
                      <Users className="w-3.5 h-3.5" />
                      <span>{dream.partner1_name || 'Partner 1'} & {dream.partner2_name || 'Partner 2'}</span>
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="28" cy="28" r="24" stroke="#F5F1EC" strokeWidth="4" fill="none" />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="#C4785A"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="150"
                        strokeDashoffset={150 - (150 * (dream.progress / 100))}
                        className="transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                      style={{ color: '#C4785A' }}
                    >
                      {Math.round(dream.progress)}%
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricBox
                    icon={<Map className="w-3.5 h-3.5" />}
                    label="Milestones"
                    value={`${dream.completedMilestones}/${dream.totalMilestones}`}
                  />
                  <MetricBox
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    label="Tasks"
                    value={`${dream.completedTasks}/${dream.totalTasks}`}
                  />
                  <MetricBox
                    icon={<Wallet className="w-3.5 h-3.5" />}
                    label="Budget"
                    value={dream.budget_amount > 0
                      ? `€${dream.budget_amount.toLocaleString()}`
                      : '—'
                    }
                    progress={dream.budgetProgress}
                  />
                  <MetricBox
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label="Target"
                    value={dream.target_date
                      ? new Date(dream.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : '—'
                    }
                  />
                </div>

                {/* Hover Arrow */}
                <div
                  className="absolute bottom-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  style={{ backgroundColor: '#2D2926' }}
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <AnimatePresence>
          {deleteConfirm.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: 'rgba(45, 41, 38, 0.5)' }}
              onClick={() => setDeleteConfirm({ show: false, dream: null })}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl p-6 max-w-sm w-full"
                style={{
                  backgroundColor: 'white',
                  boxShadow: '0 20px 40px -12px rgba(45, 41, 38, 0.25)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#FEE2E2' }}
                  >
                    <Trash2 className="w-5 h-5" style={{ color: '#DC2626' }} />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        color: '#2D2926'
                      }}
                    >
                      Delete Dream?
                    </h3>
                    <p className="text-xs" style={{ color: '#6B5E54' }}>This cannot be undone</p>
                  </div>
                </div>

                <div
                  className="mb-5 p-3 rounded-lg"
                  style={{ backgroundColor: '#FAF7F2', border: '1px solid #E8E2DA' }}
                >
                  <p className="text-sm font-medium" style={{ color: '#2D2926' }}>
                    {deleteConfirm.dream?.title || 'Untitled Dream'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#8B8178' }}>
                    All milestones, tasks, and data will be deleted.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm({ show: false, dream: null })}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: '#F5F1EC',
                      color: '#2D2926'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteDream}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: '#DC2626',
                      color: 'white'
                    }}
                  >
                    {deleting ? (
                      <>
                        <div
                          className="w-4 h-4 rounded-full animate-spin"
                          style={{ border: '2px solid white', borderTopColor: 'transparent' }}
                        />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const StatCard = ({ icon, iconBg, iconColor, label, value, sub }) => (
  <div
    className="p-4 rounded-xl flex items-start gap-3"
    style={{
      backgroundColor: 'white',
      border: '1px solid #E8E2DA'
    }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: iconBg, color: iconColor }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p
        className="text-[10px] uppercase tracking-wider font-medium mb-0.5"
        style={{ color: '#8B8178' }}
      >
        {label}
      </p>
      <p
        className="text-xl font-semibold"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          color: '#2D2926'
        }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: '#A09890' }}>{sub}</p>
    </div>
  </div>
);

const MetricBox = ({ icon, label, value, progress }) => (
  <div
    className="p-3 rounded-lg"
    style={{ backgroundColor: '#FAF7F2', border: '1px solid #F5F1EC' }}
  >
    <p
      className="text-[10px] uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1.5"
      style={{ color: '#8B8178' }}
    >
      {icon}
      {label}
    </p>
    {progress !== undefined && progress !== null ? (
      <>
        <div
          className="w-full h-1 rounded-full overflow-hidden mb-1"
          style={{ backgroundColor: '#E8E2DA' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: '#C4785A'
            }}
          />
        </div>
        <p className="text-xs font-medium" style={{ color: '#2D2926' }}>{value}</p>
      </>
    ) : (
      <p className="text-sm font-semibold" style={{ color: '#2D2926' }}>{value}</p>
    )}
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

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays <= 7) return `${diffDays}d left`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      onClick={onClick}
      className="p-3 rounded-xl cursor-pointer transition-all"
      style={{
        backgroundColor: isOverdue ? '#FEF2F2' : '#FFFBEB',
        border: `1px solid ${isOverdue ? '#FECACA' : '#FDE68A'}`
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: isOverdue ? '#DC2626' : '#D97706' }}
            />
            <p
              className="text-sm font-medium truncate"
              style={{ color: '#2D2926' }}
            >
              {task.title}
            </p>
          </div>
          <p className="text-xs truncate" style={{ color: '#6B5E54' }}>
            {task.dreamTitle} · {task.milestoneTitle}
          </p>
        </div>
        <span
          className="text-xs font-medium flex-shrink-0"
          style={{ color: isOverdue ? '#DC2626' : '#D97706' }}
        >
          {formatDueDate(dueDate)}
        </span>
      </div>
    </motion.div>
  );
};

export default Dashboard;
