import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Wind,
  Calendar,
  ArrowUpRight,
  Check,
  X,
  MoreHorizontal,
  Wallet,
  FileSpreadsheet
} from 'lucide-react';
import { getExpensesByMilestone } from '../services/supabaseService';

/**
 * MilestonePortfolioView - Modern, elegant unified view
 * Features: Sliding toggle, glass morphism, ambient gradients, river timeline, Luna intelligence
 */
const MilestonePortfolioView = ({
  milestones = [],
  userContext = {},
  onMilestoneClick,
  renderMilestoneCard
}) => {
  const [viewMode, setViewMode] = useState('dreams'); // 'dreams' or 'overview'
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyCapacity] = useState(3000); // Default savings capacity
  const [showLunaOptimization, setShowLunaOptimization] = useState(false);

  useEffect(() => {
    if (viewMode === 'overview' && milestones && milestones.length > 0) {
      aggregatePortfolioData();
    }
  }, [viewMode, milestones]);

  const aggregatePortfolioData = async () => {
    setLoading(true);

    try {
      const financialMilestones = milestones.filter(m => m.budget_amount && m.budget_amount > 0);

      if (financialMilestones.length === 0) {
        setPortfolioData({ milestones: [], isEmpty: true });
        setLoading(false);
        return;
      }

      // Load financial data
      const milestonesWithData = await Promise.all(
        financialMilestones.map(async (milestone) => {
          const { data: expenses } = await getExpensesByMilestone(milestone.id);
          const totalSaved = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) || 0;
          const targetBudget = parseFloat(milestone.budget_amount || 0);
          const remaining = targetBudget - totalSaved;
          const percentageSaved = targetBudget > 0 ? (totalSaved / targetBudget) * 100 : 0;

          let monthsUntilDeadline = null;
          let monthlyRequired = null;

          if (milestone.target_date) {
            const today = new Date();
            const deadline = new Date(milestone.target_date);
            const diffTime = deadline - today;
            const daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            monthsUntilDeadline = Math.max(1, Math.ceil(daysUntilDeadline / 30));
            monthlyRequired = remaining > 0 ? remaining / monthsUntilDeadline : 0;
          }

          return {
            ...milestone,
            totalSaved,
            remaining,
            percentageSaved,
            monthsUntilDeadline,
            monthlyRequired,
            status: getStatus(percentageSaved, monthlyRequired)
          };
        })
      );

      milestonesWithData.sort((a, b) => {
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return new Date(a.target_date) - new Date(b.target_date);
      });

      // Calculate metrics
      const totalBudgetNeeded = milestonesWithData.reduce((sum, m) => sum + parseFloat(m.budget_amount), 0);
      const totalSaved = milestonesWithData.reduce((sum, m) => sum + m.totalSaved, 0);
      const totalRemaining = totalBudgetNeeded - totalSaved;
      const percentageSaved = totalBudgetNeeded > 0 ? (totalSaved / totalBudgetNeeded) * 100 : 0;

      const soonestMilestone = milestonesWithData.find(m => m.target_date);
      const monthlyRequired = soonestMilestone?.monthsUntilDeadline > 0
        ? totalRemaining / soonestMilestone.monthsUntilDeadline
        : 0;

      const monthlyGap = monthlyRequired - monthlyCapacity;
      const isRealistic = monthlyRequired <= monthlyCapacity;

      // Confidence score (0-100)
      const confidenceScore = calculateConfidenceScore(percentageSaved, isRealistic, milestonesWithData);

      // Generate timeline data (actual monthly contributions)
      const timelineData = await generateTimelineData(milestonesWithData, monthlyCapacity);

      // Generate Luna insights (conflicts, opportunities, recommendations)
      const lunaInsights = generateLunaInsights(milestonesWithData, monthlyCapacity, monthlyGap);

      setPortfolioData({
        milestones: milestonesWithData,
        totalBudgetNeeded,
        totalSaved,
        totalRemaining,
        percentageSaved,
        monthlyRequired,
        monthlyGap,
        confidenceScore,
        timelineData,
        lunaInsights,
        isEmpty: false
      });
      setLoading(false);
    } catch (error) {
      console.error('Error aggregating portfolio data:', error);
      setLoading(false);
    }
  };

  const getStatus = (percentageSaved, monthlyRequired) => {
    if (percentageSaved >= 80) return 'ontrack';
    if (monthlyRequired > monthlyCapacity) return 'risk';
    if (percentageSaved >= 50) return 'ontrack';
    return 'behind';
  };

  const calculateConfidenceScore = (percentageSaved, isRealistic, milestonesWithData) => {
    let score = 0;
    score += percentageSaved * 0.4;
    score += isRealistic ? 30 : 0;
    score += (milestonesWithData.filter(m => m.percentageSaved > 50).length / milestonesWithData.length) * 30;
    return Math.round(Math.min(100, score));
  };

  const generateTimelineData = async (milestonesWithData, capacity) => {
    // Generate 6-month timeline showing ACTUAL monthly contributions
    const months = [];
    const today = new Date();

    // Get all expenses for all milestones
    const allExpenses = await Promise.all(
      milestonesWithData.map(async (m) => {
        const { data: expenses } = await getExpensesByMilestone(m.id);
        return (expenses || []).map(exp => ({
          ...exp,
          milestoneTitle: m.title,
          milestoneId: m.id
        }));
      })
    );

    const flatExpenses = allExpenses.flat();

    // Generate past 6 months (going backwards from current month)
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Sum all contributions made in this month
      const monthContributions = flatExpenses.filter(exp => {
        const expDate = new Date(exp.date || exp.created_at);
        return expDate >= monthStart && expDate <= monthEnd;
      });

      const totalContributed = monthContributions.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      const loadPercent = Math.min(100, (totalContributed / capacity) * 100);
      const hasConflict = totalContributed > capacity * 1.2;

      months.push({
        month: monthName,
        load: loadPercent,
        conflict: hasConflict,
        label: hasConflict ? '⚠️ Over Capacity' : '',
        actualContributed: totalContributed,
        contributions: monthContributions
      });
    }

    return months;
  };

  const generateLunaInsights = (milestonesWithData, capacity, monthlyGap) => {
    const insights = [];
    const today = new Date();

    // === MULTI-GOAL INTELLIGENCE ===
    if (milestonesWithData.length > 1) {
      // Check for timeline conflicts (2+ goals overlapping)
      const monthGroups = {};
      milestonesWithData.forEach(m => {
        if (m.target_date && m.monthlyRequired > capacity * 0.2) {
          const month = new Date(m.target_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          if (!monthGroups[month]) monthGroups[month] = [];
          monthGroups[month].push(m);
        }
      });

      for (const [month, goals] of Object.entries(monthGroups)) {
        if (goals.length >= 2) {
          const totalRequired = goals.reduce((sum, g) => sum + (g.monthlyRequired || 0), 0);
          if (totalRequired > capacity) {
            insights.push({
              type: 'conflict',
              title: 'Luna detected a timeline friction',
              message: `Your ${goals.map(g => g.title).join(' and ')} overlap in ${month}. This creates a €${Math.round(totalRequired - capacity)} cash flow gap for that period.`,
              recommendation: `I recommend adjusting timelines to flatten the curve and avoid cash flow pressure.`,
              actions: ['Auto-Rebalance', 'Review Manually'],
              severity: 10, // Highest priority
              priority: 10
            });
          }
        }
      }

      // Portfolio-level velocity warning
      if (monthlyGap > capacity * 0.3 && insights.length === 0) {
        insights.push({
          type: 'warning',
          title: 'Portfolio velocity gap detected',
          message: `Your combined goals need €${Math.round(monthlyGap)} more per month than your current capacity. This affects ${milestonesWithData.filter(m => m.monthlyRequired > 0).length} active dreams.`,
          recommendation: `Consider extending target dates or prioritizing your most important goals first.`,
          actions: ['Prioritize Goals', 'Adjust Timeline'],
          severity: 9,
          priority: 9
        });
      }
    }

    // === SINGLE-GOAL INTELLIGENCE ===
    // Analyze each milestone individually for specific insights
    milestonesWithData.forEach(milestone => {
      const {
        title,
        budget_amount,
        totalSaved,
        remaining,
        percentageSaved,
        target_date,
        monthsUntilDeadline,
        monthlyRequired
      } = milestone;

      // CRITICAL: Deadline approaching with low savings
      if (target_date && monthsUntilDeadline <= 2 && percentageSaved < 50) {
        insights.push({
          type: 'critical',
          title: 'Urgent: Deadline approaching',
          message: `Your ${title} goal has only ${monthsUntilDeadline} month${monthsUntilDeadline > 1 ? 's' : ''} left but you're at ${Math.round(percentageSaved)}% (€${totalSaved.toLocaleString()} / €${budget_amount.toLocaleString()}).`,
          recommendation: `You need €${Math.round(monthlyRequired).toLocaleString()}/month to reach your target. Consider adjusting your deadline or making a large contribution.`,
          actions: ['Extend Deadline', 'Add Funds'],
          severity: 10,
          priority: 10
        });
      }

      // HIGH: Velocity warning - deadline exists but pace is too slow
      else if (target_date && monthlyRequired > capacity && percentageSaved < 90) {
        const shortfall = monthlyRequired - capacity;
        insights.push({
          type: 'velocity_warning',
          title: 'Savings pace needs adjustment',
          message: `Your ${title} goal requires €${Math.round(monthlyRequired).toLocaleString()}/month, but your capacity is €${capacity.toLocaleString()}/month (€${Math.round(shortfall)} shortfall).`,
          recommendation: `At current pace, you'll be €${Math.round(shortfall * monthsUntilDeadline).toLocaleString()} short by ${new Date(target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}. Consider extending your deadline by ${Math.ceil(shortfall / capacity)} months.`,
          actions: ['Adjust Timeline', 'Increase Savings'],
          severity: 8,
          priority: 8
        });
      }

      // MEDIUM: Good progress but can optimize
      else if (target_date && percentageSaved >= 50 && percentageSaved < 90 && monthlyRequired <= capacity) {
        insights.push({
          type: 'progress',
          title: 'Strong progress on your dream',
          message: `Your ${title} goal is ${Math.round(percentageSaved)}% complete (€${totalSaved.toLocaleString()} saved). You're on track to reach €${budget_amount.toLocaleString()} by ${new Date(target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.`,
          recommendation: `Keep saving €${Math.round(monthlyRequired).toLocaleString()}/month to stay on pace. You're doing great!`,
          actions: ['View Details', 'Optimize'],
          severity: 4,
          priority: 4
        });
      }

      // CELEBRATION: Nearly complete or ahead of schedule
      else if (percentageSaved >= 90) {
        const daysUntilDeadline = target_date ? Math.ceil((new Date(target_date) - today) / (1000 * 60 * 60 * 24)) : null;
        const isAhead = daysUntilDeadline && daysUntilDeadline > 30;

        insights.push({
          type: 'celebration',
          title: 'Dream nearly achieved!',
          message: `Amazing! Your ${title} goal is ${Math.round(percentageSaved)}% complete with €${remaining.toLocaleString()} remaining. ${isAhead ? `You're ahead of schedule by ${Math.floor(daysUntilDeadline / 30)} months!` : 'You\'re in the final stretch!'}`,
          recommendation: isAhead ? `Consider reallocating future savings to other goals, or accelerate this one to finish early.` : `Just €${remaining.toLocaleString()} more and you're there!`,
          actions: ['Reallocate', 'Complete Now'],
          severity: 2,
          priority: 2
        });
      }

      // GUIDANCE: Has budget but no target date
      else if (!target_date && budget_amount > 0) {
        insights.push({
          type: 'planning',
          title: 'Set a target date for better planning',
          message: `Your ${title} goal has a €${budget_amount.toLocaleString()} budget${totalSaved > 0 ? ` with €${totalSaved.toLocaleString()} already saved` : ''}, but no target date set.`,
          recommendation: `Setting a deadline helps Luna calculate your required monthly savings and detect potential conflicts with other goals.`,
          actions: ['Set Target Date', 'Skip'],
          severity: 5,
          priority: 5
        });
      }

      // ENCOURAGEMENT: Just getting started (low savings, has target)
      else if (target_date && percentageSaved < 20 && totalSaved > 0 && monthsUntilDeadline > 6) {
        insights.push({
          type: 'encouragement',
          title: 'Great start on your dream',
          message: `You've saved €${totalSaved.toLocaleString()} toward your ${title} goal of €${budget_amount.toLocaleString()}. That's ${Math.round(percentageSaved)}% - every journey starts with a first step!`,
          recommendation: `To reach your goal by ${new Date(target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}, aim for €${Math.round(monthlyRequired).toLocaleString()}/month.`,
          actions: ['Set Up Auto-Save', 'View Plan'],
          severity: 3,
          priority: 3
        });
      }

      // OPPORTUNITY: Ahead of pace
      else if (target_date && monthlyRequired < capacity * 0.5 && percentageSaved >= 30 && percentageSaved < 90) {
        const monthsEarly = Math.floor((capacity - monthlyRequired) / monthlyRequired * monthsUntilDeadline);
        insights.push({
          type: 'opportunity',
          title: 'Opportunity to accelerate',
          message: `Your ${title} goal only needs €${Math.round(monthlyRequired).toLocaleString()}/month, but you have €${capacity.toLocaleString()} capacity. You could finish ${monthsEarly} months early!`,
          recommendation: `Consider increasing your monthly contribution to €${Math.round(capacity * 0.7).toLocaleString()} to accelerate this dream, or start funding another goal.`,
          actions: ['Accelerate', 'Add New Goal'],
          severity: 3,
          priority: 3
        });
      }

      // INITIAL SETUP: Budget set but no savings yet
      else if (totalSaved === 0 && budget_amount > 0) {
        insights.push({
          type: 'setup',
          title: 'Ready to start saving',
          message: `Your ${title} goal is set up with a €${budget_amount.toLocaleString()} target${target_date ? ` by ${new Date(target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}.`,
          recommendation: target_date
            ? `Start contributing €${Math.round(monthlyRequired).toLocaleString()}/month to stay on track.`
            : `Set a target date to see your recommended monthly savings amount.`,
          actions: target_date ? ['Make First Contribution', 'Set Up Auto-Save'] : ['Set Target Date', 'Contribute'],
          severity: 6,
          priority: 6
        });
      }
    });

    // Sort by priority (highest severity first) and return the most important insight
    insights.sort((a, b) => b.priority - a.priority);

    return insights.length > 0 ? insights[0] : null;
  };

  const handleExportSpreadsheet = () => {
    // TODO: Implement CSV/Excel export
    console.log('Exporting portfolio data to spreadsheet...');
    alert('Spreadsheet export feature coming soon!');
  };

  const handleOptimizationTips = () => {
    // TODO: Open Luna optimization chat or modal
    console.log('Opening Luna optimization tips...');
    setShowLunaOptimization(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Ambient Background */}
      <div className="fixed top-0 left-0 w-full h-screen overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/40 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-rose-100/30 blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-300/50">
              T
            </div>
            <span className="font-semibold text-lg tracking-tight">
              {userContext.partner1 && userContext.partner2
                ? `${userContext.partner1} & ${userContext.partner2}`
                : 'TogetherForward'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
            <span className="text-xs">
              {userContext.partner1?.charAt(0) || 'J'}{userContext.partner2?.charAt(0) || 'M'}
            </span>
          </div>
        </header>

        {/* THE SLIDING TOGGLE */}
        <PerspectiveToggle active={viewMode} onChange={setViewMode} />

        <AnimatePresence mode="wait">
          {viewMode === 'dreams' && (
            <motion.div
              key="dreams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 animate-[fadeIn_0.6s_ease-out]"
            >
              {milestones.length === 0 ? (
                <EmptyState />
              ) : (
                milestones.map((milestone) => renderMilestoneCard(milestone))
              )}
            </motion.div>
          )}

          {viewMode === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="animate-[fadeIn_0.6s_ease-out]"
            >
              {loading ? (
                <LoadingState />
              ) : portfolioData?.isEmpty ? (
                <EmptyPortfolioState />
              ) : (
                <OverviewContent
                  portfolioData={portfolioData}
                  monthlyCapacity={monthlyCapacity}
                  onMilestoneClick={onMilestoneClick}
                  onOptimizationTips={handleOptimizationTips}
                  onExportSpreadsheet={handleExportSpreadsheet}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- ATOMS & MICRO-COMPONENTS ---

const AvatarGroup = ({ partner1, partner2 }) => (
  <div className="flex items-center -space-x-2">
    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
      {partner1?.charAt(0) || 'A'}
    </div>
    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
      {partner2?.charAt(0) || 'L'}
    </div>
  </div>
);

const PerspectiveToggle = ({ active, onChange }) => (
  <div className="flex justify-center mb-8">
    <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-slate-200 shadow-sm inline-flex relative">
      <div
        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-900 rounded-full shadow-md transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          active === 'overview' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
        }`}
      />
      <button
        onClick={() => onChange('dreams')}
        className={`relative z-10 px-6 py-2 text-sm font-medium transition-colors duration-300 w-32 text-center ${
          active === 'dreams' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Milestones
      </button>
      <button
        onClick={() => onChange('overview')}
        className={`relative z-10 px-6 py-2 text-sm font-medium transition-colors duration-300 w-32 text-center ${
          active === 'overview' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Overview
      </button>
    </div>
  </div>
);

const ProgressBar = ({ progress, colorClass }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
      style={{ width: `${progress}%` }}
    />
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    ontrack: "bg-emerald-50 text-emerald-700 border-emerald-100",
    risk: "bg-amber-50 text-amber-700 border-amber-100",
    behind: "bg-rose-50 text-rose-700 border-rose-100"
  };
  const labels = {
    ontrack: "On Track",
    risk: "At Risk",
    behind: "Behind"
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

// --- STATES ---

const EmptyState = () => (
  <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
    <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
    <p className="text-slate-500 text-lg">No dreams yet. Start building your future!</p>
  </div>
);

const LoadingState = () => (
  <div className="text-center py-20">
    <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto"></div>
    <p className="text-slate-500 mt-4">Calculating your portfolio...</p>
  </div>
);

const EmptyPortfolioState = () => (
  <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
    <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
    <p className="text-slate-500 text-lg mb-2">Set budgets to see portfolio intelligence</p>
    <p className="text-slate-400 text-sm">Go to each dream's Budget Allocation to get started</p>
  </div>
);

// --- OVERVIEW CONTENT ---

const OverviewContent = ({ portfolioData, monthlyCapacity, onMilestoneClick, onOptimizationTips, onExportSpreadsheet }) => {
  const {
    milestones,
    totalBudgetNeeded,
    totalSaved,
    totalRemaining,
    monthlyRequired,
    monthlyGap,
    confidenceScore,
    timelineData,
    lunaInsights
  } = portfolioData;

  return (
    <div>
      {/* HERO METRICS */}
      <HeroSection
        totalBudgetNeeded={totalBudgetNeeded}
        totalSaved={totalSaved}
        monthlyRequired={monthlyRequired}
        monthlyGap={monthlyGap}
        confidenceScore={confidenceScore}
        onOptimizationTips={onOptimizationTips}
      />

      {/* LUNA'S INSIGHT - Always show if insights exist */}
      {lunaInsights && <LunaInsight insight={lunaInsights} />}

      {/* TIMELINE RIVER */}
      {timelineData && <TimelineRiver data={timelineData} capacity={monthlyCapacity} />}

      {/* DREAM CARDS */}
      <div className="flex justify-between items-end mb-6">
        <h3 className="font-bold text-xl text-slate-800">Strategic Deep Dive</h3>
        <button
          onClick={onExportSpreadsheet}
          className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
        >
          <FileSpreadsheet size={14} />
          View Full Spreadsheet
        </button>
      </div>

      <DreamDeck milestones={milestones} onMilestoneClick={onMilestoneClick} />
    </div>
  );
};

const HeroSection = ({ totalBudgetNeeded, totalSaved, monthlyRequired, monthlyGap, confidenceScore, onOptimizationTips }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
    {/* Left: The Big Number */}
    <div className="lg:col-span-7 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-slate-500 font-medium text-sm tracking-wide uppercase mb-1">Combined Portfolio Load</h2>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-slate-900 tracking-tight">€{totalBudgetNeeded.toLocaleString()}</span>
              <span className="text-sm font-medium text-slate-400">Total Roadmap Cost</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Savings</span>
            </div>
            <p className="text-xl font-semibold text-slate-800">€{totalSaved.toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Required Velocity</span>
            </div>
            <p className="text-xl font-semibold text-slate-800">
              €{Math.round(monthlyRequired).toLocaleString()}
              <span className="text-sm text-slate-400 font-normal">/mo</span>
            </p>
            {monthlyGap > 0 && (
              <div className="flex items-center gap-1 text-xs text-rose-500 mt-1 font-medium">
                <AlertCircle size={12} />
                <span>€{Math.round(monthlyGap)} gap detected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Right: Confidence Score */}
    <div className="lg:col-span-5 bg-slate-900 text-white rounded-[32px] p-8 shadow-xl shadow-indigo-900/20 relative overflow-hidden flex flex-col justify-between">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900 animate-pulse" />
      </div>

      <div className="relative z-10 flex justify-between items-start">
        <h2 className="text-indigo-200 font-medium text-sm tracking-wide uppercase">Roadmap Confidence</h2>
        <Sparkles size={18} className="text-indigo-300" />
      </div>

      <div className="relative z-10 text-center py-4">
        <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 inline-block">
          {confidenceScore}<span className="text-2xl">%</span>
        </div>
        <p className="text-indigo-200 text-sm mt-2">
          {confidenceScore >= 80 ? 'Your plan is solid and achievable.' :
           confidenceScore >= 60 ? 'Your plan is ambitious but feasible.' :
           'Your plan needs some adjustments.'}
        </p>
      </div>

      <div className="relative z-10">
        <button
          onClick={onOptimizationTips}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          See Optimization Tips <ChevronRight size={14} />
        </button>
      </div>
    </div>
  </div>
);

const LunaInsight = ({ insight }) => (
  <div className="mb-10 transform transition-all hover:-translate-y-1 duration-300">
    <div className="bg-gradient-to-r from-indigo-50/50 via-white to-white border border-indigo-100 rounded-2xl p-1 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)] flex gap-4 items-start">
      <div className="p-4 flex-1 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
          <Sparkles className="text-white" size={20} />
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{insight.title}</h3>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Intelligence</span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            {insight.message} {insight.recommendation}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border-l border-slate-100 flex flex-col justify-center gap-2 min-w-[180px]">
        <button className="w-full py-2 px-3 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-2">
          <Wind size={12} /> {insight.actions[0]}
        </button>
        <button className="w-full py-2 px-3 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 transition">
          {insight.actions[1]}
        </button>
      </div>
    </div>
  </div>
);

const TimelineRiver = ({ data, capacity }) => (
  <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-10">
    <div className="flex justify-between items-center mb-8">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <Calendar className="text-slate-400" size={18} />
        6-Month Cash Flow Map
      </h3>
      <div className="flex gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>Savings Capacity
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-200"></div>Expenses
        </div>
      </div>
    </div>

    <div className="relative h-48 w-full flex items-end justify-between gap-2">
      {/* Capacity Line */}
      <div className="absolute top-[30%] left-0 w-full border-t-2 border-dashed border-indigo-200 z-10 flex justify-end">
        <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full -mt-3 mr-2">Avg Capacity</span>
      </div>

      {data.map((item, i) => (
        <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
          {/* Hover Tooltip */}
          <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-3 rounded-lg transition-opacity whitespace-nowrap z-20">
            €{Math.round(item.actualContributed || 0).toLocaleString()} contributed
          </div>

          {/* Conflict Label */}
          {item.conflict && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-500 uppercase tracking-wide animate-bounce">
              {item.label}
            </div>
          )}

          {/* The Bar */}
          <div className="relative w-full px-1 h-full flex items-end">
            <div
              className={`w-full rounded-t-xl transition-all duration-500 relative ${
                item.conflict ? "bg-rose-200" : "bg-slate-100 group-hover:bg-slate-200"
              }`}
              style={{ height: `${item.load}%` }}
            >
              <div
                className={`absolute bottom-0 w-full rounded-t-xl transition-all duration-500 ${
                  item.conflict
                    ? "bg-gradient-to-t from-rose-400 to-rose-500 h-[60%]"
                    : "bg-gradient-to-t from-emerald-300 to-emerald-400 h-full"
                }`}
              />
            </div>
          </div>

          {/* Month Label */}
          <div className="text-center mt-3 text-xs font-medium text-slate-400 group-hover:text-slate-800 transition-colors">
            {item.month}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DreamDeck = ({ milestones, onMilestoneClick }) => {
  const getGradient = (index) => {
    const gradients = [
      "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
      "linear-gradient(120deg, #f6d365 0%, #fda085 100%)",
      "linear-gradient(to top, #fdcbf1 0%, #e6dee9 100%)",
      "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
      "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {milestones.map((dream, index) => (
        <div
          key={dream.id}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
          onClick={() => onMilestoneClick && onMilestoneClick(dream)}
        >
          <div className="flex justify-between items-start mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner"
              style={{ background: getGradient(index) }}
            >
              {dream.title?.charAt(0) || dream.icon}
            </div>
            <StatusBadge status={dream.status} />
          </div>

          <h3 className="font-semibold text-slate-900 text-lg mb-1">{dream.title}</h3>
          <p className="text-xs text-slate-400 mb-6 font-medium uppercase tracking-wider">
            {dream.target_date
              ? new Date(dream.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'Ongoing'}
          </p>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Saved</span>
              <span className="text-slate-900 font-semibold">
                €{dream.totalSaved?.toLocaleString() || 0}{' '}
                <span className="text-slate-300 font-normal">/ €{dream.budget_amount?.toLocaleString() || 0}</span>
              </span>
            </div>
            <ProgressBar
              progress={dream.percentageSaved || 0}
              colorClass={
                dream.status === 'risk' ? 'bg-amber-400' :
                dream.status === 'behind' ? 'bg-rose-400' :
                'bg-emerald-400'
              }
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              View Details <ArrowUpRight size={12} />
            </button>
            <button className="text-slate-300 hover:text-slate-600">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MilestonePortfolioView;
