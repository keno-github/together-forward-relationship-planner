import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target, TrendingUp, DollarSign, Clock, Users, AlertTriangle,
  CheckCircle, MapPin, Calendar, Award, Zap, Heart, ArrowRight,
  AlertCircle, Activity, Sparkles, Brain, Map, Edit2, Check, X
} from 'lucide-react';
import {
  generateSmartAlerts,
  calculateClientMetrics,
  getHealthStatus,
  formatCurrency,
  formatDaysRemaining,
  getPriorityColor,
  shouldShowBudgetTab
} from '../utils/navigationHelpers';
import { updateMilestone } from '../services/supabaseService';
import { useLuna } from '../context/LunaContext';

/**
 * Goal Overview Dashboard
 *
 * Smart, card-based overview showing intelligent metrics for a roadmap
 * (Note: milestone prop = roadmap in business logic)
 *
 * Features:
 * - Multi-dimensional progress tracking
 * - Budget status (conditional)
 * - Next actions & priorities
 * - Couple activity balance
 * - Health score & alerts
 * - Time tracking
 */
const GoalOverviewDashboard = ({
  milestone,
  userContext,
  tasks = [],
  expenses = [],
  onNavigateToSection,
  onUpdateMilestone,
  onRefreshTasks,
  onRefreshMilestone
}) => {
  // CRITICAL: Initialize with default metrics to prevent blank page
  const [metrics, setMetrics] = useState({
    tasks_completed: 0,
    tasks_total: 0,
    progress_percentage: 0,
    health_score: 50,
    on_track: true,
    budget_amount: 0,
    budget_used_percentage: 0,
    days_remaining: null
  });
  const [alerts, setAlerts] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(milestone.budget_amount || milestone.estimatedCost || 0);
  const [editingTargetDate, setEditingTargetDate] = useState(false);
  const [targetDate, setTargetDate] = useState(milestone.target_date || '');

  // Connect to global Luna context
  const { setLunaContext, clearLunaContext } = useLuna();

  // Set Luna context when component mounts or milestone changes
  useEffect(() => {
    if (milestone) {
      setLunaContext(milestone, tasks, userContext, {
        onMilestoneUpdate: onUpdateMilestone,
        onTasksUpdate: onRefreshTasks,
        onRefreshMilestone: onRefreshMilestone
      });
    }

    // Clear context when component unmounts
    return () => {
      // Don't clear if there are pending changes - let the panel handle it
    };
  }, [milestone?.id, tasks, userContext, onUpdateMilestone, onRefreshTasks, onRefreshMilestone, setLunaContext]);

  // CRITICAL: Sync budgetAmount state when milestone prop changes
  useEffect(() => {
    console.log('🔄 Milestone prop changed, updating budgetAmount:', milestone.budget_amount);
    setBudgetAmount(milestone.budget_amount || milestone.estimatedCost || 0);
  }, [milestone.budget_amount, milestone.estimatedCost]);

  // Calculate metrics on mount and when data changes
  useEffect(() => {
    if (!milestone) return;

    // Use database metrics if available, otherwise calculate client-side
    const dbMetrics = milestone.milestone_metrics || {};
    const clientMetrics = calculateClientMetrics(milestone, tasks, expenses);

    // Merge database and client metrics (db takes precedence)
    // CRITICAL: Always provide default values to prevent blank page
    const mergedMetrics = {
      // Default values for required fields
      tasks_completed: 0,
      tasks_total: 0,
      progress_percentage: 0,
      health_score: 50,
      on_track: true,
      budget_amount: milestone.budget_amount || milestone.estimatedCost || 0,
      budget_used_percentage: 0,
      days_remaining: null,
      // Override with calculated/database values
      ...clientMetrics,
      ...dbMetrics
    };

    setMetrics(mergedMetrics);

    // Generate alerts
    const generatedAlerts = generateSmartAlerts(milestone, expenses, tasks);
    setAlerts(generatedAlerts);

    // Get health status
    const health = getHealthStatus(mergedMetrics.health_score || 50);
    setHealthStatus(health);
  }, [milestone, tasks, expenses]);

  // Update local budget amount when milestone changes
  useEffect(() => {
    setBudgetAmount(milestone.budget_amount || milestone.estimatedCost || 0);
    setTargetDate(milestone.target_date || '');
  }, [milestone]);

  const handleSaveBudget = async () => {
    const budget = parseFloat(budgetAmount);

    if (isNaN(budget) || budget < 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    try {
      const { error } = await updateMilestone(milestone.id, {
        budget_amount: budget
      });

      if (error) {
        console.error('Error updating budget:', error);
        alert('Failed to save budget');
        return;
      }

      console.log('✅ Budget saved to database:', budget);

      // Update parent component state FIRST
      if (onUpdateMilestone) {
        console.log('📤 Calling onUpdateMilestone with budget:', budget);
        onUpdateMilestone({ ...milestone, budget_amount: budget });
      } else {
        console.warn('⚠️ onUpdateMilestone callback not provided!');
      }

      setEditingBudget(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('An error occurred while saving');
    }
  };

  const handleCancelBudget = () => {
    setBudgetAmount(milestone.budget_amount || milestone.estimatedCost || 0);
    setEditingBudget(false);
  };

  const handleSaveTargetDate = async () => {
    if (!targetDate) {
      alert('Please select a target date');
      return;
    }

    try {
      const { error } = await updateMilestone(milestone.id, {
        target_date: targetDate
      });

      if (error) {
        console.error('Error updating target date:', error);
        alert('Failed to save target date');
        return;
      }

      console.log('✅ Target date saved to database:', targetDate);

      // Update parent component state
      if (onUpdateMilestone) {
        onUpdateMilestone({ ...milestone, target_date: targetDate });
      }

      setEditingTargetDate(false);
    } catch (error) {
      console.error('Error saving target date:', error);
      alert('An error occurred while saving');
    }
  };

  const handleCancelTargetDate = () => {
    setTargetDate(milestone.target_date || '');
    setEditingTargetDate(false);
  };

  if (!milestone || !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading overview...</p>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Get next 3 priority tasks
  const nextActions = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    })
    .slice(0, 3);

  // Get couple activity
  const coupleActivity = metrics.couple_activity || {};

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{milestone.title}</h1>
            <p className="text-gray-600">
              {userContext?.partner1} & {userContext?.partner2}
            </p>
          </div>
        </div>

        {milestone.description && (
          <p className="text-lg text-gray-700 mt-4 bg-gray-50 p-4 rounded-xl">
            {milestone.description}
          </p>
        )}
      </motion.div>

      {/* Top Row: Progress + Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Card */}
        <ProgressCard
          percentage={metrics.progress_percentage}
          tasksCompleted={metrics.tasks_completed}
          tasksTotal={metrics.tasks_total}
          onTrack={metrics.on_track}
        />

        {/* Health Score Card */}
        <HealthScoreCard
          healthScore={metrics.health_score}
          healthStatus={healthStatus}
          onTrack={metrics.on_track}
        />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Budget Card - Always visible and editable */}
        <EditableBudgetCard
          budgetAmount={budgetAmount}
          totalExpenses={totalExpenses}
          budgetUsedPercentage={metrics.budget_used_percentage}
          isEditing={editingBudget}
          onEdit={() => setEditingBudget(true)}
          onSave={handleSaveBudget}
          onCancel={handleCancelBudget}
          onChange={(value) => setBudgetAmount(value)}
          onNavigate={() => onNavigateToSection?.('budget')}
        />

        {/* Target Date - Editable */}
        <EditableTargetDateCard
          targetDate={targetDate}
          daysRemaining={metrics.days_remaining}
          isEditing={editingTargetDate}
          onEdit={() => setEditingTargetDate(true)}
          onSave={handleSaveTargetDate}
          onCancel={handleCancelTargetDate}
          onChange={(value) => setTargetDate(value)}
        />

        {/* Tasks */}
        <MetricCard
          icon={CheckCircle}
          label="Tasks"
          value={`${metrics.tasks_completed}/${metrics.tasks_total}`}
          subtitle={`${metrics.progress_percentage}% complete`}
          color="green"
          onClick={() => onNavigateToSection?.('tasks')}
        />

        {/* Location */}
        {userContext?.location && (
          <MetricCard
            icon={MapPin}
            label="Location"
            value={userContext.location}
            subtitle="Planning here"
            color="indigo"
          />
        )}
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <SmartAlertsCard alerts={alerts} />
      )}

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <NextActionsCard
          actions={nextActions}
          onNavigate={() => onNavigateToSection?.('tasks')}
        />
      )}

      {/* Couple Activity */}
      {coupleActivity.partner1_name && (
        <CoupleActivityCard
          activity={coupleActivity}
          onNavigate={() => onNavigateToSection?.('tasks')}
        />
      )}

      {/* Goal Summary (if available from Luna) */}
      {milestone.goal_summary && (
        <GoalSummaryCard summary={milestone.goal_summary} />
      )}

      {/* Luna Insights - Smart suggestions based on health */}
      <LunaInsightsCard
        milestone={milestone}
        metrics={metrics}
        healthStatus={healthStatus}
        tasks={tasks}
        expenses={expenses}
        userContext={userContext}
      />

      {/* Luna Chat is now a floating panel - accessible via the floating button */}

      {/* Quick Actions */}
      <QuickActionsSection
        milestone={milestone}
        metrics={metrics}
        onNavigateToSection={onNavigateToSection}
      />
    </div>
  );
};

/**
 * Progress Card - Circular progress indicator
 */
const ProgressCard = ({ percentage, tasksCompleted, tasksTotal, onTrack }) => {
  const circumference = 2 * Math.PI * 70; // radius = 70
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-purple-200 transition-all"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-gray-900">Overall Progress</h3>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative">
          {/* Background circle */}
          <svg className="transform -rotate-90" width="160" height="160">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={onTrack ? '#8B5CF6' : '#EF4444'}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-900">{percentage}%</span>
            <span className="text-sm text-gray-600">Complete</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-gray-700">
          <span className="font-semibold text-purple-600">{tasksCompleted}</span> of{' '}
          <span className="font-semibold">{tasksTotal}</span> tasks completed
        </p>
        {onTrack ? (
          <div className="flex items-center justify-center gap-1 text-green-600 mt-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">On Track</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 text-orange-600 mt-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Needs Attention</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Health Score Card
 */
const HealthScoreCard = ({ healthScore, healthStatus, onTrack }) => {
  if (!healthStatus) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className={`bg-gradient-to-br from-${healthStatus.color}-50 to-white rounded-2xl p-6 border-2 border-${healthStatus.color}-200`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart className={`w-5 h-5 text-${healthStatus.color}-600`} />
        <h3 className="font-bold text-gray-900">Milestone Health</h3>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white border-4 border-${healthStatus.color}-200 mb-4">
          <span className={`text-3xl font-bold text-${healthStatus.color}-600`}>
            {healthScore}
          </span>
        </div>

        <div className={`inline-block px-4 py-2 rounded-full ${healthStatus.colorClass} font-semibold mb-2`}>
          {healthStatus.label}
        </div>

        <p className="text-gray-700 mt-2">
          {healthStatus.message}
        </p>
      </div>

      {/* Health factors */}
      <div className="mt-4 space-y-2">
        <HealthFactor label="Progress" value={onTrack ? 'On Track' : 'Behind'} positive={onTrack} />
      </div>
    </motion.div>
  );
};

const HealthFactor = ({ label, value, positive }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-600">{label}:</span>
    <span className={`font-medium ${positive ? 'text-green-600' : 'text-orange-600'}`}>
      {value}
    </span>
  </div>
);

/**
 * Luna Insights Card - AI-powered suggestions based on milestone health
 */
const LunaInsightsCard = ({ milestone, metrics, healthStatus, tasks, expenses, userContext }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, [milestone, metrics, healthStatus]);

  const generateInsights = () => {
    const suggestions = [];

    // Analyze health score
    const healthScore = metrics?.health_score || 0;
    const progressPercent = metrics?.progress_percentage || 0;
    const tasksCompleted = metrics?.tasks_completed || 0;
    const tasksTotal = metrics?.tasks_total || 0;
    const daysRemaining = metrics?.days_remaining;

    // 1. LOW HEALTH SCORE (< 50)
    if (healthScore < 50) {
      suggestions.push({
        type: 'critical',
        icon: '🚨',
        title: 'Your milestone needs immediate attention',
        message: `With a health score of ${healthScore}%, it's time to reassess your plan. Let's break this down together.`,
        actions: [
          'Review your roadmap phases - are they realistic?',
          'Identify blockers preventing progress',
          'Consider adjusting your timeline or scope'
        ]
      });
    }

    // 2. BEHIND SCHEDULE
    if (daysRemaining !== null && daysRemaining > 0 && progressPercent < 30 && daysRemaining < 60) {
      suggestions.push({
        type: 'warning',
        icon: '⏰',
        title: `Only ${daysRemaining} days left, but ${100 - progressPercent}% to go`,
        message: `Time is moving faster than your progress. Here's how to catch up:`,
        actions: [
          `Focus on the current phase: "${milestone.deep_dive_data?.roadmapPhases?.[0]?.title || 'first phase'}"`,
          'Set aside dedicated time this week for milestone tasks',
          'Divide remaining tasks between both partners'
        ]
      });
    }

    // 3. NO RECENT ACTIVITY
    const recentTasks = tasks.filter(t => {
      const completedRecently = t.completed_at &&
        (new Date() - new Date(t.completed_at)) < (7 * 24 * 60 * 60 * 1000);
      return completedRecently;
    });

    if (tasksTotal > 0 && recentTasks.length === 0) {
      suggestions.push({
        type: 'info',
        icon: '💤',
        title: 'This milestone has been quiet lately',
        message: `No tasks completed in the past week. Let's reignite your momentum!`,
        actions: [
          'Schedule a 30-minute planning session with your partner',
          'Pick one small task to complete today',
          'Revisit why this milestone matters to you both'
        ]
      });
    }

    // 4. GOOD PROGRESS BUT NO TARGET DATE
    if (progressPercent > 20 && !milestone.target_date) {
      suggestions.push({
        type: 'suggestion',
        icon: '📅',
        title: 'Set a target date to stay accountable',
        message: `You're making progress! Setting a target date will help you maintain momentum.`,
        actions: [
          'Discuss a realistic completion date with your partner',
          'Add it to your milestone settings',
          'Break down remaining work by target date'
        ]
      });
    }

    // 5. IMBALANCED WORKLOAD
    const partner1Tasks = tasks.filter(t => t.assigned_to === userContext?.partner1);
    const partner2Tasks = tasks.filter(t => t.assigned_to === userContext?.partner2);
    const imbalance = Math.abs(partner1Tasks.length - partner2Tasks.length);

    if (imbalance > 5 && tasksTotal > 10) {
      const heavierPartner = partner1Tasks.length > partner2Tasks.length
        ? userContext?.partner1
        : userContext?.partner2;

      suggestions.push({
        type: 'suggestion',
        icon: '⚖️',
        title: 'Task distribution could be more balanced',
        message: `${heavierPartner} has significantly more tasks. Sharing the load strengthens your partnership!`,
        actions: [
          'Review unassigned tasks together',
          'Assign based on each person\'s strengths and availability',
          'Check in regularly about workload balance'
        ]
      });
    }

    // 6. BUDGET CONCERNS
    const budgetUsed = metrics?.budget_used_percentage || 0;
    if (budgetUsed > 90 && progressPercent < 70) {
      suggestions.push({
        type: 'warning',
        icon: '💰',
        title: 'Budget is running low faster than progress',
        message: `You've used ${budgetUsed}% of your budget but only ${progressPercent}% complete.`,
        actions: [
          'Review recent expenses - any surprises?',
          'Identify cost-effective alternatives for remaining tasks',
          'Consider if additional budget is needed'
        ]
      });
    }

    // 7. EXCELLENT PROGRESS - ENCOURAGEMENT!
    if (healthScore >= 80 && progressPercent >= 50) {
      suggestions.push({
        type: 'success',
        icon: '🌟',
        title: 'You\'re crushing it!',
        message: `Health score of ${healthScore}% and ${progressPercent}% complete - you two are an amazing team!`,
        actions: [
          'Celebrate your progress together',
          'Keep up the momentum with your current rhythm',
          'Think about how this success applies to future milestones'
        ]
      });
    }

    setInsights(suggestions.slice(0, 2)); // Show top 2 most relevant insights
    setLoading(false);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Luna's Insights</h3>
            <p className="text-sm text-gray-600">Analyzing your milestone...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  const getInsightStyle = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'guidance':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-purple-50 border-purple-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Luna's Insights</h3>
          <p className="text-sm text-gray-600">Personalized suggestions for you both</p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className={`${getInsightStyle(insight.type)} rounded-xl p-4 border-2`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{insight.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-700 mb-3">{insight.message}</p>

                {insight.actions && insight.actions.length > 0 && (
                  <div className="space-y-2">
                    {insight.actions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-purple-500 flex-shrink-0 mt-0.5">•</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-xs text-gray-600 text-center italic">
          💜 Luna learns from your progress and adapts suggestions to your journey
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Editable Target Date Card - Always visible, click to edit
 */
const EditableTargetDateCard = ({
  targetDate,
  daysRemaining,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onChange
}) => {
  const gradient = 'from-blue-500 to-cyan-500';
  const borderColor = 'border-blue-200';

  const formattedDate = targetDate
    ? new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-4 border-2 ${isEditing ? 'border-blue-400 shadow-lg' : borderColor} transition-all relative group`}
    >
      {!isEditing ? (
        <>
          {/* View Mode */}
          <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center mb-3`}>
            <Calendar className="w-5 h-5 text-white" />
          </div>

          <p className="text-sm text-gray-600 mb-1">Target Date</p>
          <p className="text-xl font-bold text-gray-900 mb-1">
            {formattedDate || 'Not set'}
          </p>

          {targetDate && daysRemaining !== null && (
            <p className="text-xs text-gray-500 mb-2">
              {daysRemaining > 0
                ? `${daysRemaining} days left`
                : daysRemaining === 0
                ? 'Due today'
                : `${Math.abs(daysRemaining)} days overdue`
              }
            </p>
          )}

          {!targetDate && (
            <p className="text-xs text-gray-500 mb-2">Click to set date</p>
          )}

          {/* Edit button - visible on hover */}
          <button
            onClick={onEdit}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 hover:bg-blue-50 hover:border-blue-300 transition-all"
            title="Edit target date"
          >
            <Edit2 className="w-3 h-3 text-blue-600" />
          </button>
        </>
      ) : (
        <>
          {/* Edit Mode */}
          <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center mb-3`}>
            <Calendar className="w-5 h-5 text-white" />
          </div>

          <p className="text-sm text-gray-600 mb-2">Set Target Date</p>

          <input
            type="date"
            value={targetDate}
            onChange={(e) => onChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-2 py-1.5 text-sm border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 bg-transparent mb-3"
            autoFocus
          />

          {/* Save/Cancel buttons */}
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

/**
 * Editable Budget Card - Always visible, click to edit
 */
const EditableBudgetCard = ({
  budgetAmount,
  totalExpenses,
  budgetUsedPercentage,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onChange,
  onNavigate
}) => {
  const gradient = 'from-purple-500 to-indigo-500';
  const borderColor = 'border-purple-200';

  const currentBudget = parseFloat(budgetAmount) || 0;
  const displayRemaining = currentBudget - totalExpenses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-4 border-2 ${isEditing ? 'border-purple-400 shadow-lg' : borderColor} transition-all relative group`}
    >
      {!isEditing ? (
        <>
          {/* View Mode */}
          <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center mb-3`}>
            <DollarSign className="w-5 h-5 text-white" />
          </div>

          <p className="text-sm text-gray-600 mb-1">Budget</p>
          <p className="text-xl font-bold text-gray-900 mb-1">
            {currentBudget === 0 ? '$0' : formatCurrency(currentBudget)}
          </p>

          {currentBudget > 0 && (
            <>
              <p className="text-xs text-gray-500 mb-2">
                {formatCurrency(displayRemaining)} left
              </p>

              {budgetUsedPercentage !== undefined && (
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`bg-gradient-to-r ${gradient} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {currentBudget === 0 && (
            <p className="text-xs text-gray-500 mb-2">Click to set budget</p>
          )}

          {/* Edit button - visible on hover */}
          <button
            onClick={onEdit}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 hover:bg-purple-50 hover:border-purple-300 transition-all"
            title="Edit budget"
          >
            <Edit2 className="w-3 h-3 text-purple-600" />
          </button>

          {/* View details button */}
          {currentBudget > 0 && (
            <button
              onClick={onNavigate}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1"
            >
              View details →
            </button>
          )}
        </>
      ) : (
        <>
          {/* Edit Mode */}
          <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center mb-3`}>
            <DollarSign className="w-5 h-5 text-white" />
          </div>

          <p className="text-sm text-gray-600 mb-2">Set Budget Amount</p>

          <div className="flex items-center gap-1 mb-3">
            <span className="text-lg font-bold text-gray-700">$</span>
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => onChange(e.target.value)}
              min="0"
              step="100"
              className="flex-1 px-2 py-1 text-lg font-bold border-b-2 border-purple-400 focus:outline-none focus:border-purple-600 bg-transparent"
              placeholder="0"
              autoFocus
            />
          </div>

          {/* Save/Cancel buttons */}
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

/**
 * Generic Metric Card
 */
const MetricCard = ({ icon: Icon, label, value, subtitle, color, percentage, onClick }) => {
  const colorClasses = {
    purple: 'from-purple-500 to-indigo-500 text-purple-600 bg-purple-50 border-purple-200',
    blue: 'from-blue-500 to-cyan-500 text-blue-600 bg-blue-50 border-blue-200',
    green: 'from-green-500 to-emerald-500 text-green-600 bg-green-50 border-green-200',
    indigo: 'from-indigo-500 to-purple-500 text-indigo-600 bg-indigo-50 border-indigo-200',
    pink: 'from-pink-500 to-rose-500 text-pink-600 bg-pink-50 border-pink-200'
  };

  const classes = colorClasses[color] || colorClasses.purple;
  const [gradient, textColor, bgColor, borderColor] = classes.split(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border-2 ${borderColor} ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} transition-all`}
    >
      <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}

      {percentage !== undefined && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`bg-gradient-to-r ${gradient} h-1.5 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Smart Alerts Card
 */
const SmartAlertsCard = ({ alerts }) => {
  const iconMap = {
    AlertTriangle,
    AlertCircle,
    Clock,
    DollarSign,
    CheckCircle,
    TrendingUp
  };

  const severityColors = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border-2 border-gray-100"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-gray-900">Smart Alerts</h3>
        <span className="ml-auto text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, idx) => {
          const Icon = iconMap[alert.icon] || AlertCircle;
          const colorClass = severityColors[alert.severity] || severityColors.info;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 ${colorClass}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">{alert.message}</p>
                  {alert.action && (
                    <p className="text-sm opacity-75">→ {alert.action}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

/**
 * Next Actions Card
 */
const NextActionsCard = ({ actions, onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border-2 border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold text-gray-900">Next Actions</h3>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {actions.map((task, idx) => (
          <div
            key={task.id || idx}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
              {idx + 1}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {task.priority && (
                  <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                )}
                {task.assigned_to && (
                  <span className="text-xs text-gray-600">
                    {task.assigned_to}
                  </span>
                )}
                {task.due_date && (
                  <span className="text-xs text-gray-500">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Couple Activity Card
 */
const CoupleActivityCard = ({ activity, onNavigate }) => {
  const total = (activity.partner1_tasks || 0) + (activity.partner2_tasks || 0);
  const partner1Percentage = total > 0 ? (activity.partner1_tasks / total) * 100 : 50;
  const partner2Percentage = total > 0 ? (activity.partner2_tasks / total) * 100 : 50;

  const isBalanced = Math.abs(partner1Percentage - partner2Percentage) < 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border-2 border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-600" />
          <h3 className="font-bold text-gray-900">Couple Activity</h3>
        </div>
        {isBalanced ? (
          <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
            Balanced
          </span>
        ) : (
          <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
            Unbalanced
          </span>
        )}
      </div>

      {/* Visual distribution */}
      <div className="flex gap-2 mb-4">
        <div
          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-8 rounded-l-lg flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
          style={{ width: `${partner1Percentage}%` }}
        >
          {partner1Percentage > 15 && `${Math.round(partner1Percentage)}%`}
        </div>
        <div
          className="bg-gradient-to-r from-pink-500 to-rose-500 h-8 rounded-r-lg flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
          style={{ width: `${partner2Percentage}%` }}
        >
          {partner2Percentage > 15 && `${Math.round(partner2Percentage)}%`}
        </div>
      </div>

      {/* Partner stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-purple-50 rounded-xl">
          <p className="text-2xl font-bold text-purple-600">{activity.partner1_tasks}</p>
          <p className="text-sm text-gray-600">{activity.partner1_name}'s tasks</p>
        </div>
        <div className="text-center p-3 bg-pink-50 rounded-xl">
          <p className="text-2xl font-bold text-pink-600">{activity.partner2_tasks}</p>
          <p className="text-sm text-gray-600">{activity.partner2_name}'s tasks</p>
        </div>
      </div>

      {!isBalanced && onNavigate && (
        <button
          onClick={onNavigate}
          className="mt-4 w-full py-2 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1"
        >
          Rebalance tasks
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

/**
 * Goal Summary Card
 */
const GoalSummaryCard = ({ summary }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-gray-900">Your Goal</h3>
      </div>

      <p className="text-lg text-gray-800 leading-relaxed">
        {summary}
      </p>
    </motion.div>
  );
};

/**
 * Quick Actions Section
 */
const QuickActionsSection = ({ milestone, metrics, onNavigateToSection }) => {
  const actions = [
    {
      icon: Map,
      label: 'View Roadmap',
      description: 'See detailed action plan',
      section: 'roadmap',
      color: 'purple'
    },
    {
      icon: Brain,
      label: 'Luna\'s Assessment',
      description: 'AI confidence & insights',
      section: 'assessment',
      color: 'blue'
    },
    {
      icon: CheckCircle,
      label: 'Manage Tasks',
      description: 'Assign & track progress',
      section: 'tasks',
      color: 'green'
    }
  ];

  // Conditionally add budget action
  if (shouldShowBudgetTab(milestone)) {
    actions.push({
      icon: DollarSign,
      label: 'Track Budget',
      description: 'Monitor expenses',
      section: 'budget',
      color: 'indigo'
    });
  }

  return (
    <div className="mt-8">
      <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <button
            key={action.section}
            onClick={() => onNavigateToSection?.(action.section)}
            className="p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-lg transition-all text-left group"
          >
            <action.icon className={`w-8 h-8 text-${action.color}-600 mb-2 group-hover:scale-110 transition-transform`} />
            <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
            <p className="text-xs text-gray-600 mt-1">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GoalOverviewDashboard;
