import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target, TrendingUp, DollarSign, Clock, Users,
  CheckCircle, MapPin, Calendar, ArrowRight,
  AlertCircle, Sparkles, ChevronRight, Edit3, Check, X
} from 'lucide-react';
import {
  generateSmartAlerts,
  calculateClientMetrics,
  getHealthStatus,
  formatCurrency,
  shouldShowBudgetTab
} from '../utils/navigationHelpers';
import { updateMilestone } from '../services/supabaseService';
import { useLuna } from '../context/LunaContext';

/**
 * Goal Overview Dashboard - Elegant Edition
 * A refined, editorial-quality interface for tracking couple milestones
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

  const { setLunaContext, clearLunaContext } = useLuna();

  // Store callbacks in a ref to avoid infinite loops
  // (functions are recreated each render, causing useEffect to re-run)
  const callbacksRef = React.useRef({
    onMilestoneUpdate: onUpdateMilestone,
    onTasksUpdate: onRefreshTasks,
    onRefreshMilestone
  });

  // Keep callbacks ref updated
  React.useEffect(() => {
    callbacksRef.current = {
      onMilestoneUpdate: onUpdateMilestone,
      onTasksUpdate: onRefreshTasks,
      onRefreshMilestone
    };
  });

  // Set Luna context when viewing a milestone, clear on unmount
  // Only re-run when milestone ID changes (not on every render)
  useEffect(() => {
    if (milestone?.id) {
      setLunaContext(milestone, tasks, userContext, {
        onMilestoneUpdate: (...args) => callbacksRef.current.onMilestoneUpdate?.(...args),
        onTasksUpdate: (...args) => callbacksRef.current.onTasksUpdate?.(...args),
        onRefreshMilestone: (...args) => callbacksRef.current.onRefreshMilestone?.(...args)
      });
    }

    // Cleanup: Clear Luna context when component unmounts
    // This prevents stale data when navigating between dreams
    return () => {
      clearLunaContext();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestone?.id]);

  useEffect(() => {
    setBudgetAmount(milestone.budget_amount || milestone.estimatedCost || 0);
  }, [milestone.budget_amount, milestone.estimatedCost]);

  useEffect(() => {
    if (!milestone) return;

    const dbMetrics = milestone.milestone_metrics || {};
    const clientMetrics = calculateClientMetrics(milestone, tasks, expenses);

    // Merge metrics with correct priority:
    // 1. Start with defaults
    // 2. Apply database metrics (may have some stored values)
    // 3. Apply client-calculated metrics LAST for progress (fresh calculation from phases)
    const mergedMetrics = {
      tasks_completed: 0,
      tasks_total: 0,
      progress_percentage: 0,
      health_score: 50,
      on_track: true,
      budget_amount: milestone.budget_amount || milestone.estimatedCost || 0,
      budget_used_percentage: 0,
      days_remaining: null,
      ...dbMetrics,
      // Client metrics MUST override db metrics for progress (calculated from phases)
      ...clientMetrics
    };

    setMetrics(mergedMetrics);

    const generatedAlerts = generateSmartAlerts(milestone, expenses, tasks);
    setAlerts(generatedAlerts);

    const health = getHealthStatus(mergedMetrics.health_score || 50);
    setHealthStatus(health);
  }, [milestone, tasks, expenses]);

  useEffect(() => {
    setBudgetAmount(milestone.budget_amount || milestone.estimatedCost || 0);
    setTargetDate(milestone.target_date || '');
  }, [milestone]);

  const handleSaveBudget = async () => {
    const budget = parseFloat(budgetAmount);
    if (isNaN(budget) || budget < 0) return;

    try {
      const { error } = await updateMilestone(milestone.id, { budget_amount: budget });
      if (error) return;
      if (onUpdateMilestone) onUpdateMilestone({ ...milestone, budget_amount: budget });
      setEditingBudget(false);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleSaveTargetDate = async () => {
    if (!targetDate) return;

    try {
      const { error } = await updateMilestone(milestone.id, { target_date: targetDate });
      if (error) return;
      if (onUpdateMilestone) onUpdateMilestone({ ...milestone, target_date: targetDate });
      setEditingTargetDate(false);
    } catch (error) {
      console.error('Error saving target date:', error);
    }
  };

  if (!milestone || !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#c49a6c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: '#6b635b' }}>Loading overview...</p>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const nextActions = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    })
    .slice(0, 3);

  return (
    <div className="tf-app min-h-screen" style={{ background: '#faf8f5' }}>
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 md:mb-12"
        >
          <div className="flex items-start gap-3 md:gap-5">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(196, 154, 108, 0.12)' }}
            >
              <Target className="w-6 h-6 md:w-7 md:h-7" style={{ color: '#c49a6c' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl md:text-3xl lg:text-4xl font-medium leading-tight mb-1 md:mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#2d2926' }}
              >
                {milestone.title}
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#6b635b' }}>
                {userContext?.partner1} & {userContext?.partner2}'s journey together
              </p>
            </div>
          </div>

          {milestone.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 md:mt-6 text-base md:text-lg leading-relaxed md:pl-[68px]"
              style={{ color: '#2d2926', fontFamily: "'DM Sans', sans-serif" }}
            >
              {milestone.description}
            </motion.p>
          )}
        </motion.header>

        {/* Progress Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 md:mb-10"
        >
          <ProgressDisplay
            percentage={metrics.progress_percentage}
            tasksCompleted={metrics.tasks_completed}
            tasksTotal={metrics.tasks_total}
            onTrack={metrics.on_track}
            healthScore={metrics.health_score}
          />
        </motion.section>

        {/* Key Metrics Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-10"
        >
          <MetricCard
            icon={DollarSign}
            label="Budget"
            value={budgetAmount > 0 ? formatCurrency(budgetAmount) : 'Not set'}
            subtitle={budgetAmount > 0 ? `${formatCurrency(budgetAmount - totalExpenses)} remaining` : 'Click to set'}
            isEditing={editingBudget}
            onEdit={() => setEditingBudget(true)}
            onSave={handleSaveBudget}
            onCancel={() => { setBudgetAmount(milestone.budget_amount || 0); setEditingBudget(false); }}
            editValue={budgetAmount}
            onEditChange={setBudgetAmount}
            editType="currency"
            accentColor="#c49a6c"
          />

          <MetricCard
            icon={Calendar}
            label="Target Date"
            value={targetDate ? new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
            subtitle={metrics.days_remaining !== null ? `${metrics.days_remaining} days left` : 'Click to set'}
            isEditing={editingTargetDate}
            onEdit={() => setEditingTargetDate(true)}
            onSave={handleSaveTargetDate}
            onCancel={() => { setTargetDate(milestone.target_date || ''); setEditingTargetDate(false); }}
            editValue={targetDate}
            onEditChange={setTargetDate}
            editType="date"
            accentColor="#7d8c75"
          />

          <MetricCard
            icon={CheckCircle}
            label="Tasks"
            value={`${metrics.tasks_completed}/${metrics.tasks_total}`}
            subtitle={`${metrics.progress_percentage}% complete`}
            onClick={() => onNavigateToSection?.('tasks')}
            accentColor="#6b8fad"
          />

          {userContext?.location && (
            <MetricCard
              icon={MapPin}
              label="Location"
              value={userContext.location}
              subtitle="Planning here"
              accentColor="#d4a574"
            />
          )}
        </motion.section>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-6 md:mb-10"
          >
            <AlertsSection alerts={alerts} />
          </motion.section>
        )}

        {/* Next Actions */}
        {nextActions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-6 md:mb-10"
          >
            <NextActions
              actions={nextActions}
              onViewAll={() => onNavigateToSection?.('tasks')}
            />
          </motion.section>
        )}

        {/* Luna Insights */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-6 md:mb-10"
        >
          <LunaInsights
            milestone={milestone}
            metrics={metrics}
            healthStatus={healthStatus}
            tasks={tasks}
            userContext={userContext}
          />
        </motion.section>

        {/* Quick Navigation */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <QuickNav
            milestone={milestone}
            onNavigate={onNavigateToSection}
          />
        </motion.section>
      </div>
    </div>
  );
};

/**
 * Progress Display - Clean circular progress with stats
 */
const ProgressDisplay = ({ percentage, tasksCompleted, tasksTotal, onTrack, healthScore }) => {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="rounded-xl md:rounded-2xl p-5 md:p-8"
      style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
    >
      <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" className="transform -rotate-90 md:w-[140px] md:h-[140px]">
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#f5f2ed"
              strokeWidth="8"
              className="md:hidden"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#c49a6c"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={(2 * Math.PI * 48) - (percentage / 100) * (2 * Math.PI * 48)}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              className="md:hidden"
            />
            {/* Desktop version */}
            <circle
              cx="70"
              cy="70"
              r="54"
              fill="none"
              stroke="#f5f2ed"
              strokeWidth="10"
              className="hidden md:block"
            />
            <circle
              cx="70"
              cy="70"
              r="54"
              fill="none"
              stroke="#c49a6c"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              className="hidden md:block"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-3xl md:text-4xl font-semibold"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
            >
              {percentage}%
            </span>
            <span className="text-[10px] md:text-xs uppercase tracking-wider mt-1" style={{ color: '#6b635b' }}>
              Complete
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 w-full grid grid-cols-2 gap-4 md:gap-6">
          <div className="text-center md:text-left">
            <p className="text-[10px] md:text-xs uppercase tracking-wider mb-1" style={{ color: '#6b635b' }}>
              Tasks Done
            </p>
            <p className="text-xl md:text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}>
              {tasksCompleted} <span className="text-sm md:text-base font-normal" style={{ color: '#6b635b' }}>/ {tasksTotal}</span>
            </p>
          </div>

          <div className="text-center md:text-left">
            <p className="text-[10px] md:text-xs uppercase tracking-wider mb-1" style={{ color: '#6b635b' }}>
              Health
            </p>
            <p className="text-xl md:text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}>
              {healthScore}
            </p>
          </div>

          <div className="col-span-2 flex justify-center md:justify-start">
            <div className="flex items-center gap-2">
              {onTrack ? (
                <>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#7d8c75' }} />
                  <span className="text-sm font-medium" style={{ color: '#7d8c75' }}>On Track</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#d4a574' }} />
                  <span className="text-sm font-medium" style={{ color: '#d4a574' }}>Needs Attention</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Metric Card - Editable stat cards
 */
const MetricCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  editValue,
  onEditChange,
  editType,
  onClick,
  accentColor = '#c49a6c'
}) => {
  return (
    <div
      onClick={!isEditing && onClick ? onClick : undefined}
      className={`rounded-lg md:rounded-xl p-4 md:p-5 transition-all group relative ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      style={{
        background: '#ffffff',
        border: '1px solid #e8e4de',
        borderLeft: `3px solid ${accentColor}`
      }}
    >
      {!isEditing ? (
        <>
          <div className="flex items-start justify-between mb-2 md:mb-3">
            <div
              className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${accentColor}15` }}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: accentColor }} />
            </div>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-2 md:p-1.5 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-target"
                style={{ background: '#f5f2ed' }}
              >
                <Edit3 className="w-4 h-4 md:w-3.5 md:h-3.5" style={{ color: '#6b635b' }} />
              </button>
            )}
          </div>

          <p className="text-[10px] md:text-xs uppercase tracking-wider mb-1" style={{ color: '#6b635b' }}>
            {label}
          </p>
          <p
            className="text-lg md:text-xl font-semibold mb-1 truncate"
            style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
          >
            {value}
          </p>
          <p className="text-[10px] md:text-xs truncate" style={{ color: '#6b635b' }}>
            {subtitle}
          </p>

          {onClick && (
            <ChevronRight
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 opacity-50 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              style={{ color: accentColor }}
            />
          )}
        </>
      ) : (
        <>
          <div
            className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 md:mb-3"
            style={{ background: `${accentColor}15` }}
          >
            <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: accentColor }} />
          </div>

          <p className="text-[10px] md:text-xs uppercase tracking-wider mb-2" style={{ color: '#6b635b' }}>
            Set {label}
          </p>

          {editType === 'currency' ? (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-base md:text-lg font-medium" style={{ color: '#6b635b' }}>$</span>
              <input
                type="number"
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                min="0"
                step="100"
                className="flex-1 text-base md:text-lg font-semibold bg-transparent border-b-2 focus:outline-none"
                style={{ borderColor: accentColor, color: '#2d2926' }}
                autoFocus
              />
            </div>
          ) : (
            <input
              type="date"
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full text-sm bg-transparent border-b-2 focus:outline-none mb-3 py-1"
              style={{ borderColor: accentColor, color: '#2d2926' }}
              autoFocus
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex-1 py-2.5 md:py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-1 active:scale-[0.98]"
              style={{ background: '#7d8c75' }}
            >
              <Check className="w-4 h-4 md:w-3.5 md:h-3.5" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 md:py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 active:scale-[0.98]"
              style={{ background: '#f5f2ed', color: '#6b635b' }}
            >
              <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Alerts Section
 */
const AlertsSection = ({ alerts }) => {
  const severityStyles = {
    critical: { bg: 'rgba(199, 107, 107, 0.08)', border: '#c76b6b', text: '#a55555' },
    warning: { bg: 'rgba(212, 165, 116, 0.08)', border: '#d4a574', text: '#a67c4a' },
    info: { bg: 'rgba(107, 143, 173, 0.08)', border: '#6b8fad', text: '#5a7a94' }
  };

  return (
    <div>
      <h3
        className="text-lg font-medium mb-4"
        style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
      >
        Attention Needed
      </h3>

      <div className="space-y-3">
        {alerts.slice(0, 3).map((alert, idx) => {
          const style = severityStyles[alert.severity] || severityStyles.info;
          return (
            <div
              key={idx}
              className="rounded-xl p-4"
              style={{ background: style.bg, borderLeft: `3px solid ${style.border}` }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: style.border }} />
                <div>
                  <p className="font-medium mb-1" style={{ color: style.text }}>{alert.message}</p>
                  {alert.action && (
                    <p className="text-sm" style={{ color: style.text, opacity: 0.8 }}>
                      {alert.action}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Next Actions
 */
const NextActions = ({ actions, onViewAll }) => {
  const priorityColors = {
    critical: '#c76b6b',
    high: '#d4a574',
    medium: '#c49a6c',
    low: '#7d8c75'
  };

  return (
    <div
      className="rounded-xl md:rounded-2xl p-4 md:p-6"
      style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
    >
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h3
          className="text-base md:text-lg font-medium"
          style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
        >
          Next Actions
        </h3>
        <button
          onClick={onViewAll}
          className="text-sm font-medium flex items-center gap-1 active:gap-2 md:hover:gap-2 transition-all p-2 -mr-2"
          style={{ color: '#c49a6c' }}
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 md:space-y-3">
        {actions.map((task, idx) => (
          <div
            key={task.id || idx}
            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl transition-colors active:scale-[0.99]"
            style={{ background: '#faf8f5' }}
          >
            <div
              className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold text-white flex-shrink-0"
              style={{ background: '#2d2926' }}
            >
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base font-medium truncate" style={{ color: '#2d2926' }}>{task.title}</p>
              <div className="flex items-center gap-2 md:gap-3 mt-1">
                {task.priority && (
                  <span
                    className="text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded"
                    style={{
                      background: `${priorityColors[task.priority]}15`,
                      color: priorityColors[task.priority]
                    }}
                  >
                    {task.priority}
                  </span>
                )}
                {task.assigned_to && (
                  <span className="text-[10px] md:text-xs truncate" style={{ color: '#6b635b' }}>
                    {task.assigned_to}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{ color: '#c49a6c' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Luna Insights - Refined AI suggestions
 */
const LunaInsights = ({ milestone, metrics, healthStatus, tasks, userContext }) => {
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    generateInsights();
  }, [milestone, metrics, healthStatus]);

  const generateInsights = () => {
    const suggestions = [];
    const healthScore = metrics?.health_score || 0;
    const progressPercent = metrics?.progress_percentage || 0;
    const daysRemaining = metrics?.days_remaining;

    if (healthScore < 50) {
      suggestions.push({
        type: 'attention',
        title: 'This milestone needs your focus',
        message: `With a health score of ${healthScore}%, consider reassessing your approach. What's blocking progress?`,
        action: 'Review your roadmap and identify bottlenecks'
      });
    }

    if (daysRemaining !== null && daysRemaining > 0 && progressPercent < 30 && daysRemaining < 60) {
      suggestions.push({
        type: 'warning',
        title: `${daysRemaining} days remaining`,
        message: `You're ${100 - progressPercent}% away from completion. Time to accelerate.`,
        action: 'Schedule focused work sessions this week'
      });
    }

    if (healthScore >= 80 && progressPercent >= 50) {
      suggestions.push({
        type: 'success',
        title: 'Excellent progress',
        message: `You're at ${progressPercent}% with a health score of ${healthScore}. Keep this momentum going.`,
        action: 'Celebrate this milestone together'
      });
    }

    if (progressPercent > 20 && !milestone.target_date) {
      suggestions.push({
        type: 'suggestion',
        title: 'Set a target date',
        message: 'A deadline helps maintain focus and accountability.',
        action: 'Choose a realistic completion date'
      });
    }

    setInsights(suggestions.slice(0, 2));
  };

  if (insights.length === 0) return null;

  const typeStyles = {
    attention: { accent: '#c76b6b' },
    warning: { accent: '#d4a574' },
    success: { accent: '#7d8c75' },
    suggestion: { accent: '#6b8fad' }
  };

  return (
    <div
      className="rounded-xl md:rounded-2xl p-4 md:p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2d2926 0%, #3d3633 100%)' }}
    >
      <div
        className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(196, 154, 108, 0.1) 0%, transparent 70%)' }}
      />

      <div className="flex items-center gap-3 mb-4 md:mb-6 relative">
        <div
          className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #c49a6c 0%, #a88352 100%)' }}
        >
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div>
          <h3
            className="text-base md:text-lg font-medium text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Luna's Guidance
          </h3>
          <p className="text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Personalized insights for your journey
          </p>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4 relative">
        {insights.map((insight, idx) => {
          const style = typeStyles[insight.type] || typeStyles.suggestion;
          return (
            <div
              key={idx}
              className="rounded-lg md:rounded-xl p-3 md:p-4"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderLeft: `3px solid ${style.accent}`
              }}
            >
              <h4 className="text-sm md:text-base font-medium text-white mb-1">{insight.title}</h4>
              <p className="text-xs md:text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {insight.message}
              </p>
              <p className="text-[10px] md:text-xs font-medium" style={{ color: style.accent }}>
                → {insight.action}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Quick Navigation
 */
const QuickNav = ({ milestone, onNavigate }) => {
  const navItems = [
    { id: 'roadmap', icon: TrendingUp, label: 'Roadmap', desc: 'View your journey phases' },
    { id: 'tasks', icon: CheckCircle, label: 'Tasks', desc: 'Manage action items' },
    { id: 'assessment', icon: Sparkles, label: 'Assessment', desc: 'Luna\'s analysis' }
  ];

  if (shouldShowBudgetTab(milestone)) {
    navItems.push({ id: 'budget', icon: DollarSign, label: 'Budget', desc: 'Track expenses' });
  }

  return (
    <div className="pb-4 md:pb-0">
      <h3
        className="text-base md:text-lg font-medium mb-3 md:mb-4"
        style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
      >
        Explore
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            className="p-4 md:p-5 rounded-lg md:rounded-xl text-left transition-all group active:scale-[0.98] md:hover:-translate-y-1"
            style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
          >
            <div
              className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 md:mb-3 transition-transform group-active:scale-110 md:group-hover:scale-110"
              style={{ background: 'rgba(196, 154, 108, 0.12)' }}
            >
              <item.icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#c49a6c' }} />
            </div>
            <p className="text-sm md:text-base font-medium mb-0.5 md:mb-1" style={{ color: '#2d2926' }}>{item.label}</p>
            <p className="text-[10px] md:text-xs hidden md:block" style={{ color: '#6b635b' }}>{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GoalOverviewDashboard;
