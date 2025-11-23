import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, AlertTriangle, Calendar, Target,
  DollarSign, CheckCircle, Clock, Lightbulb, Activity,
  ArrowRight, TrendingDown, Sparkles
} from 'lucide-react';
import { getExpensesByMilestone } from '../services/supabaseService';

/**
 * MilestoneOverview - Portfolio Financial Intelligence
 *
 * Aggregates all roadmap budgets to provide strategic insights:
 * (Note: milestones prop = roadmaps in business logic)
 * - Reality check: Can user afford all goals?
 * - Timeline conflicts: Overlapping expensive periods
 * - Smart recommendations: AI-guided allocation
 * - Portfolio health scoring
 */
const MilestoneOverview = ({ milestones = [], userContext, onBack, onMilestoneClick }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyCapacity, setMonthlyCapacity] = useState(5000); // Default capacity
  const [showCapacityEdit, setShowCapacityEdit] = useState(false);

  useEffect(() => {
    console.log('🔍 MilestoneOverview received milestones:', milestones);
    if (milestones && milestones.length > 0) {
      aggregatePortfolioData();
    } else {
      console.warn('⚠️ No milestones provided to MilestoneOverview');
      setLoading(false);
    }
  }, [milestones]);

  /**
   * Aggregate all milestone financial data into portfolio intelligence
   */
  const aggregatePortfolioData = async () => {
    setLoading(true);

    try {
      console.log('💰 Checking milestones for budgets...');
      console.log('Total milestones received:', milestones.length);

      // Debug each milestone
      milestones.forEach((m, idx) => {
        console.log(`Milestone ${idx + 1}: "${m.title}"`);
        console.log(`  - budget_amount: ${m.budget_amount}`);
        console.log(`  - estimatedCost: ${m.estimatedCost}`);
        console.log(`  - Has budget?: ${m.budget_amount && m.budget_amount > 0 ? 'YES ✅' : 'NO ❌'}`);
      });

      // Filter only milestones with budgets
      const financialMilestones = milestones.filter(m => m.budget_amount && m.budget_amount > 0);

      console.log(`📊 Found ${financialMilestones.length} financial milestones out of ${milestones.length} total`);

      if (financialMilestones.length === 0) {
        console.warn('⚠️ No financial milestones found! Showing empty state.');
        setPortfolioData({ milestones: [], isEmpty: true });
        setLoading(false);
        return;
      }

      console.log('✅ Processing financial milestones:', financialMilestones.map(m => m.title));

      // Load contributions for each milestone
      const milestonesWithData = await Promise.all(
        financialMilestones.map(async (milestone) => {
          const { data: expenses } = await getExpensesByMilestone(milestone.id);

          // Calculate total saved (all contributions)
          const totalSaved = expenses && expenses.length > 0
            ? expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
            : 0;

          const targetBudget = parseFloat(milestone.budget_amount || 0);
          const remaining = targetBudget - totalSaved;
          const percentageSaved = targetBudget > 0 ? (totalSaved / targetBudget) * 100 : 0;

          // Calculate months until deadline
          let monthsUntilDeadline = null;
          let monthlyRequired = null;
          let daysUntilDeadline = null;

          if (milestone.target_date) {
            const today = new Date();
            const deadline = new Date(milestone.target_date);
            const diffTime = deadline - today;
            daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
            daysUntilDeadline,
            contributions: expenses || [],
            status: getStatusLabel(percentageSaved, monthlyRequired, monthlyCapacity),
            priority: getPriority(milestone, daysUntilDeadline)
          };
        })
      );

      // Sort by urgency (soonest deadline first)
      milestonesWithData.sort((a, b) => {
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return new Date(a.target_date) - new Date(b.target_date);
      });

      // Calculate portfolio totals
      const totalBudgetNeeded = milestonesWithData.reduce((sum, m) => sum + parseFloat(m.budget_amount), 0);
      const totalSaved = milestonesWithData.reduce((sum, m) => sum + m.totalSaved, 0);
      const totalRemaining = totalBudgetNeeded - totalSaved;
      const percentageSaved = totalBudgetNeeded > 0 ? (totalSaved / totalBudgetNeeded) * 100 : 0;

      // Find soonest deadline
      const milestonesWithDeadlines = milestonesWithData.filter(m => m.target_date);
      const soonestMilestone = milestonesWithDeadlines[0];
      const soonestDeadline = soonestMilestone?.target_date;
      const monthsToSoonest = soonestMilestone?.monthsUntilDeadline;

      // Calculate monthly required (based on soonest deadline)
      const monthlyRequired = soonestDeadline && monthsToSoonest > 0
        ? totalRemaining / monthsToSoonest
        : 0;

      // Calculate gap
      const monthlyGap = monthlyRequired - monthlyCapacity;
      const isRealistic = monthlyRequired <= monthlyCapacity;

      // Portfolio health score (0-100)
      const healthScore = calculateHealthScore(
        percentageSaved,
        isRealistic,
        milestonesWithData,
        monthlyCapacity
      );

      // Generate smart recommendations
      const recommendations = generateRecommendations(
        milestonesWithData,
        monthlyCapacity,
        totalRemaining,
        monthlyRequired
      );

      // CRITICAL: Detect timeline conflicts (multiple milestones in same month)
      const conflicts = detectTimelineConflicts(
        milestonesWithData,
        monthlyCapacity,
        totalSaved
      );

      setPortfolioData({
        milestones: milestonesWithData,
        totalBudgetNeeded,
        totalSaved,
        totalRemaining,
        percentageSaved,
        soonestDeadline,
        monthsToSoonest,
        monthlyRequired,
        monthlyGap,
        isRealistic,
        healthScore,
        recommendations,
        conflicts, // Add conflict detection results
        isEmpty: false
      });
    } catch (error) {
      console.error('Error aggregating portfolio data:', error);
      setPortfolioData({ milestones: [], isEmpty: true, error: true });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate portfolio health score (0-100)
   */
  const calculateHealthScore = (percentageSaved, isRealistic, milestones, capacity) => {
    let score = 0;

    // Factor 1: Progress (40 points max)
    score += Math.min(40, percentageSaved * 0.4);

    // Factor 2: Feasibility (30 points max)
    if (isRealistic) {
      score += 30;
    } else {
      // Partial credit if close
      const totalRequired = milestones.reduce((sum, m) => sum + (m.monthlyRequired || 0), 0);
      const feasibilityRatio = capacity / totalRequired;
      score += Math.min(30, feasibilityRatio * 30);
    }

    // Factor 3: Time buffer (20 points max)
    const avgMonthsLeft = milestones.reduce((sum, m) => sum + (m.monthsUntilDeadline || 12), 0) / milestones.length;
    const timeScore = Math.min(20, (avgMonthsLeft / 24) * 20); // 24 months = full score
    score += timeScore;

    // Factor 4: Distribution (10 points max)
    const milestonesOnTrack = milestones.filter(m => m.percentageSaved >= 50).length;
    score += (milestonesOnTrack / milestones.length) * 10;

    return Math.round(Math.min(100, score));
  };

  /**
   * Determine status label for milestone
   */
  const getStatusLabel = (percentageSaved, monthlyRequired, capacity) => {
    if (percentageSaved >= 100) return 'complete';
    if (!monthlyRequired) return 'no-deadline';
    if (monthlyRequired <= capacity * 0.3) return 'on-track'; // Less than 30% of capacity
    if (monthlyRequired <= capacity) return 'achievable';
    if (monthlyRequired <= capacity * 1.5) return 'challenging';
    return 'unrealistic';
  };

  /**
   * Determine priority level
   */
  const getPriority = (milestone, daysUntilDeadline) => {
    if (!daysUntilDeadline) return 'MEDIUM';
    if (daysUntilDeadline < 180) return 'HIGH'; // Less than 6 months
    if (daysUntilDeadline < 365) return 'MEDIUM'; // Less than 1 year
    return 'LOW';
  };

  /**
   * Generate AI-powered smart recommendations
   */
  const generateRecommendations = (milestones, capacity, totalRemaining, monthlyRequired) => {
    const recommendations = [];

    // Recommendation 1: Adjust capacity
    if (monthlyRequired > capacity) {
      const neededIncrease = monthlyRequired - capacity;
      recommendations.push({
        type: 'increase-capacity',
        icon: TrendingUp,
        title: 'Increase Monthly Savings',
        description: `To hit all goals on time, increase savings by ${formatCurrency(neededIncrease)}/month to ${formatCurrency(monthlyRequired)}/month.`,
        impact: 'All milestones hit target dates',
        difficulty: neededIncrease > capacity ? 'High' : 'Medium'
      });
    }

    // Recommendation 2: Prioritize by deadline
    const urgentMilestones = milestones.filter(m => m.daysUntilDeadline && m.daysUntilDeadline < 365);
    if (urgentMilestones.length > 0) {
      const urgentTotal = urgentMilestones.reduce((sum, m) => sum + m.remaining, 0);
      const urgentMonthly = urgentTotal / 12; // Assume 12 months focus

      if (urgentMonthly <= capacity) {
        recommendations.push({
          type: 'focus-urgent',
          icon: Target,
          title: 'Focus on Urgent Goals First',
          description: `Allocate ${formatCurrency(urgentMonthly)}/month to goals due within 12 months. Delay other goals.`,
          impact: `${urgentMilestones.length} urgent milestone${urgentMilestones.length > 1 ? 's' : ''} completed on time`,
          difficulty: 'Low'
        });
      }
    }

    // Recommendation 3: Adjust timelines
    const flexibleMilestones = milestones.filter(m =>
      m.priority === 'LOW' || m.priority === 'MEDIUM'
    );

    if (flexibleMilestones.length > 0 && monthlyRequired > capacity) {
      recommendations.push({
        type: 'adjust-timeline',
        icon: Calendar,
        title: 'Extend Flexible Timelines',
        description: `Delay ${flexibleMilestones.length} flexible goal${flexibleMilestones.length > 1 ? 's' : ''} by 6-12 months to reduce monthly pressure.`,
        impact: 'Monthly requirement becomes achievable',
        difficulty: 'Low'
      });
    }

    // Recommendation 4: If doing well
    if (monthlyRequired < capacity * 0.7) {
      const surplus = capacity - monthlyRequired;
      recommendations.push({
        type: 'accelerate',
        icon: Sparkles,
        title: 'Accelerate Your Goals',
        description: `You have ${formatCurrency(surplus)}/month surplus. Consider moving deadlines earlier or adding new goals.`,
        impact: 'Achieve goals faster or expand plans',
        difficulty: 'Low'
      });
    }

    return recommendations.slice(0, 3); // Show top 3
  };

  /**
   * Detect Timeline Conflicts - CRITICAL FEATURE
   *
   * Identifies when multiple milestones have deadlines in the same month,
   * causing cash flow problems even if average monthly savings look achievable.
   *
   * Example: You save $4k/month (looks good!), but in June you need $60k
   * for wedding + house down payment in the same month = CONFLICT!
   */
  const detectTimelineConflicts = (milestones, monthlyCapacity, currentSavings) => {
    console.log('🔍 Detecting timeline conflicts...');

    // Step 1: Group milestones by month
    const monthlyDemand = {};

    milestones.forEach(m => {
      if (!m.target_date || m.remaining <= 0) return;

      const date = new Date(m.target_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthlyDemand[monthKey]) {
        monthlyDemand[monthKey] = {
          monthKey,
          monthLabel,
          date,
          totalNeeded: 0,
          milestones: []
        };
      }

      monthlyDemand[monthKey].totalNeeded += m.remaining;
      monthlyDemand[monthKey].milestones.push(m);
    });

    // Step 2: Calculate cumulative savings available by each month
    const today = new Date();
    const monthsData = Object.values(monthlyDemand).map(month => {
      // Calculate months until this deadline
      const target = new Date(month.date);
      const monthsDiff = (target.getFullYear() - today.getFullYear()) * 12
                        + (target.getMonth() - today.getMonth());
      const monthsUntil = Math.max(0, monthsDiff);

      // Available cash = current savings + (monthly capacity × months until deadline)
      const availableCash = currentSavings + (monthlyCapacity * monthsUntil);

      // Check if this is a conflict
      const isConflict = month.totalNeeded > availableCash;
      const shortage = isConflict ? month.totalNeeded - availableCash : 0;

      // Calculate severity
      const severityRatio = month.totalNeeded / Math.max(availableCash, 1);
      let severity = 'SAFE';
      if (severityRatio > 1.5) severity = 'CRITICAL';
      else if (severityRatio > 1.2) severity = 'HIGH';
      else if (severityRatio > 1.0) severity = 'MODERATE';

      // Calculate percentage of available cash being used
      const percentageUsed = (month.totalNeeded / Math.max(availableCash, 1)) * 100;

      return {
        ...month,
        monthsUntil,
        availableCash,
        isConflict,
        shortage,
        severity,
        percentageUsed,
        hasMultipleMilestones: month.milestones.length > 1
      };
    });

    // Step 3: Sort by date and filter to only conflicted or high-demand months
    const sortedMonths = monthsData
      .sort((a, b) => a.date - b.date)
      .filter(m => m.isConflict || m.hasMultipleMilestones || m.percentageUsed > 50);

    // Step 4: Generate specific recommendations for each conflict
    const conflictsWithRecommendations = sortedMonths.map(conflict => {
      const recommendations = [];

      if (conflict.isConflict) {
        // Recommendation 1: Delay flexible milestone
        const flexibleMilestone = conflict.milestones
          .filter(m => m.priority !== 'HIGH')
          .sort((a, b) => a.remaining - b.remaining)[0];

        if (flexibleMilestone) {
          const delayMonths = Math.ceil(conflict.shortage / monthlyCapacity) + 3;
          recommendations.push({
            type: 'delay',
            title: `Delay "${flexibleMilestone.title}"`,
            description: `Move to ${delayMonths} months later (${new Date(new Date(conflict.date).setMonth(conflict.date.getMonth() + delayMonths)).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`,
            impact: `Reduces ${conflict.monthLabel} demand by ${formatCurrency(flexibleMilestone.remaining)}`,
            milestoneId: flexibleMilestone.id
          });
        }

        // Recommendation 2: Increase savings
        const monthsToConflict = conflict.monthsUntil;
        const additionalMonthly = Math.ceil(conflict.shortage / Math.max(monthsToConflict, 1));
        recommendations.push({
          type: 'increase-savings',
          title: 'Increase Monthly Savings',
          description: `Save an extra ${formatCurrency(additionalMonthly)}/month`,
          impact: `Covers ${conflict.monthLabel} shortage by deadline`
        });

        // Recommendation 3: Reduce scope
        const largestMilestone = conflict.milestones.sort((a, b) => b.remaining - a.remaining)[0];
        const reductionAmount = Math.min(largestMilestone.remaining * 0.2, conflict.shortage);
        recommendations.push({
          type: 'reduce-scope',
          title: `Reduce "${largestMilestone.title}" Budget`,
          description: `Lower target by ${formatCurrency(reductionAmount)} (${((reductionAmount / largestMilestone.budget_amount) * 100).toFixed(0)}%)`,
          impact: `Eliminates or reduces ${conflict.monthLabel} shortage`
        });
      } else if (conflict.hasMultipleMilestones && conflict.percentageUsed > 50) {
        // High-pressure month (multiple milestones, using >50% of available cash)
        recommendations.push({
          type: 'spread-out',
          title: 'Consider Spreading Deadlines',
          description: `${conflict.milestones.length} goals due in ${conflict.monthLabel} will use ${conflict.percentageUsed.toFixed(0)}% of your available savings`,
          impact: 'Moving one goal to adjacent month reduces financial pressure'
        });
      }

      return {
        ...conflict,
        recommendations: recommendations.slice(0, 2) // Top 2 recommendations per conflict
      };
    });

    console.log(`✅ Found ${conflictsWithRecommendations.length} timeline issues`);

    return conflictsWithRecommendations;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const getHealthColor = (score) => {
    if (score >= 80) return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
    if (score >= 60) return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
    if (score >= 40) return { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' };
    return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
  };

  const getHealthMessage = (score) => {
    if (score >= 80) return 'Excellent financial planning';
    if (score >= 60) return 'Good progress, minor adjustments needed';
    if (score >= 40) return 'Needs attention and planning';
    return 'Requires immediate action';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return { bg: 'bg-green-100', text: 'text-green-700', label: '✓ COMPLETE' };
      case 'on-track': return { bg: 'bg-green-50', text: 'text-green-600', label: '✓ ON TRACK' };
      case 'achievable': return { bg: 'bg-blue-50', text: 'text-blue-600', label: '✓ ACHIEVABLE' };
      case 'challenging': return { bg: 'bg-yellow-50', text: 'text-yellow-600', label: '⚠ CHALLENGING' };
      case 'unrealistic': return { bg: 'bg-red-50', text: 'text-red-600', label: '✗ UNREALISTIC' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', label: 'NO DEADLINE' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return { bg: 'bg-red-100', text: 'text-red-700' };
      case 'MEDIUM': return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
      case 'LOW': return { bg: 'bg-gray-100', text: 'text-gray-700' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Empty state: No financial milestones
  if (portfolioData?.isEmpty) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Financial Milestones Yet</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Set budgets for your milestones to see portfolio-level financial intelligence and smart recommendations.
        </p>
      </div>
    );
  }

  const data = portfolioData;
  const healthColors = getHealthColor(data.healthScore);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <div className="flex items-center gap-3 mb-4 relative z-30">
          <button
            onClick={() => {
              console.log('🔙 Back button clicked in MilestoneOverview');
              if (onBack) {
                console.log('✅ Calling onBack callback');
                onBack();
              } else {
                console.error('❌ onBack callback not provided!');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-white font-medium transition-colors cursor-pointer shadow-md hover:shadow-lg"
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Milestones</span>
          </button>
        </div>
      )}

      {/* Portfolio Health Header */}
      <div className={`rounded-2xl p-6 border-2 ${healthColors.border} ${healthColors.bg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Financial Portfolio Overview</h2>
            <p className="text-sm text-gray-600">
              Strategic analysis of {data.milestones.length} financial milestone{data.milestones.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${healthColors.text}`}>{data.healthScore}</div>
            <div className="text-xs text-gray-600 mt-1">Portfolio Health</div>
          </div>
        </div>
        <div className={`text-sm font-medium ${healthColors.text}`}>
          {getHealthMessage(data.healthScore)}
        </div>
      </div>

      {/* Reality Check Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Reality Check</h3>
            <p className="text-sm text-gray-600">Can you afford all your goals?</p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Total Goal Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalBudgetNeeded)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Total Saved So Far</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalSaved)}</p>
            <p className="text-xs text-gray-600 mt-1">{data.percentageSaved.toFixed(0)}% complete</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Still Need</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalRemaining)}</p>
          </div>
        </div>

        {/* Timeline & Capacity Analysis */}
        {data.soonestDeadline && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Soonest Deadline</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(data.soonestDeadline)} ({data.monthsToSoonest} months)
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Monthly Needed (to meet soonest)</p>
                <p className={`text-lg font-bold ${data.isRealistic ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.monthlyRequired)}/mo
                </p>
              </div>
            </div>

            {/* Monthly Capacity Input */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Your Monthly Savings Capacity</p>
                  {!showCapacityEdit ? (
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(monthlyCapacity)}/mo</p>
                      <button
                        onClick={() => setShowCapacityEdit(true)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={monthlyCapacity}
                        onChange={(e) => setMonthlyCapacity(parseFloat(e.target.value) || 0)}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg text-sm"
                        step="100"
                        min="0"
                      />
                      <button
                        onClick={() => {
                          setShowCapacityEdit(false);
                          aggregatePortfolioData();
                        }}
                        className="px-3 py-1 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800"
                      >
                        Update
                      </button>
                    </div>
                  )}
                </div>

                {/* Gap Analysis */}
                <div className="text-right">
                  {data.monthlyGap > 0 ? (
                    <div className="text-red-600">
                      <p className="text-xs">Monthly Gap</p>
                      <p className="text-lg font-bold">-{formatCurrency(data.monthlyGap)}</p>
                      <p className="text-xs">Short by {((data.monthlyGap / data.monthlyRequired) * 100).toFixed(0)}%</p>
                    </div>
                  ) : (
                    <div className="text-green-600">
                      <p className="text-xs">Monthly Surplus</p>
                      <p className="text-lg font-bold">+{formatCurrency(Math.abs(data.monthlyGap))}</p>
                      <p className="text-xs">✓ Goals achievable</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Warning/Success Message */}
            {!data.isRealistic && (
              <div className="mt-4 flex items-start gap-2 text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Unrealistic Timeline</p>
                  <p>You need to save {formatCurrency(data.monthlyRequired)}/month but your capacity is {formatCurrency(monthlyCapacity)}/month. Consider adjusting timelines or amounts below.</p>
                </div>
              </div>
            )}
            {data.isRealistic && data.monthlyRequired > 0 && (
              <div className="mt-4 flex items-start gap-2 text-green-600 bg-green-50 rounded-lg p-3 border border-green-200">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Goals are achievable!</p>
                  <p>You can meet all deadlines by saving {formatCurrency(data.monthlyRequired)}/month.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline Conflicts Detection - CRITICAL FEATURE */}
      {data.conflicts && data.conflicts.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">⚠️ Timeline Conflicts Detected</h3>
              <p className="text-sm text-gray-700">
                {data.conflicts.filter(c => c.isConflict).length} critical cash flow issue(s) found
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {data.conflicts.map((conflict, index) => {
              // Determine colors based on severity
              const severityColors = {
                'CRITICAL': { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-600 text-white' },
                'HIGH': { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-600 text-white' },
                'MODERATE': { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-600 text-white' },
                'SAFE': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-600 text-white' }
              };
              const colors = severityColors[conflict.severity] || severityColors['MODERATE'];

              return (
                <motion.div
                  key={conflict.monthKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${colors.bg} rounded-xl p-5 border-2 ${colors.border}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{conflict.monthLabel}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${colors.badge}`}>
                          {conflict.severity}
                        </span>
                        {conflict.hasMultipleMilestones && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-600 text-white font-medium">
                            {conflict.milestones.length} Milestones
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {conflict.monthsUntil === 0 ? 'Due this month!' :
                         conflict.monthsUntil === 1 ? 'Due next month!' :
                         `${conflict.monthsUntil} months away`}
                      </p>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Cash Needed</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(conflict.totalNeeded)}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Available by Then</p>
                      <p className={`text-lg font-bold ${conflict.isConflict ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(conflict.availableCash)}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">{conflict.isConflict ? 'Shortage' : 'Buffer'}</p>
                      <p className={`text-lg font-bold ${conflict.isConflict ? 'text-red-600' : 'text-green-600'}`}>
                        {conflict.isConflict ? `-${formatCurrency(conflict.shortage)}` : `+${formatCurrency(conflict.availableCash - conflict.totalNeeded)}`}
                      </p>
                    </div>
                  </div>

                  {/* Milestones in this month */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Milestones due in {conflict.monthLabel}:</p>
                    <div className="space-y-2">
                      {conflict.milestones.map(milestone => (
                        <div key={milestone.id} className="flex items-center justify-between bg-white/80 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              milestone.priority === 'HIGH' ? 'bg-red-500' :
                              milestone.priority === 'MEDIUM' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-900">{milestone.title}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{formatCurrency(milestone.remaining)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {conflict.recommendations && conflict.recommendations.length > 0 && (
                    <div className="bg-white/80 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm font-bold text-gray-900">Recommended Solutions:</p>
                      </div>
                      <div className="space-y-2">
                        {conflict.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="mt-1 w-5 h-5 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{rec.description}</p>
                              <p className="text-xs text-green-600 font-medium mt-1">✓ {rec.impact}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Overall Summary */}
          <div className="mt-6 bg-white/80 rounded-xl p-4 border border-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Action Required</p>
                <p className="text-sm text-gray-700">
                  {data.conflicts.filter(c => c.isConflict).length > 0 ? (
                    <>Review the recommendations above and adjust your timeline or savings plan to avoid cash shortages.
                    Even small changes can prevent major financial stress!</>
                  ) : (
                    <>You have {data.conflicts.length} high-demand month(s) ahead. While not critical, consider spreading
                    these expenses to maintain a comfortable buffer.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Milestone Breakdown (by urgency)
        </h3>

        <div className="space-y-4">
          {data.milestones.map((milestone) => {
            const statusColors = getStatusColor(milestone.status);
            const priorityColors = getPriorityColor(milestone.priority);

            return (
              <div
                key={milestone.id}
                className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onMilestoneClick && onMilestoneClick(milestone)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
                      {milestone.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {milestone.target_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(milestone.target_date)} · {milestone.monthsUntilDeadline} months away
                        </div>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors.bg} ${priorityColors.text} font-medium`}>
                        Priority: {milestone.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-xs px-3 py-1 rounded-full ${statusColors.bg} ${statusColors.text} font-semibold`}>
                      {statusColors.label}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{formatCurrency(milestone.totalSaved)} saved</span>
                    <span>{formatCurrency(milestone.budget_amount)} goal</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(milestone.percentageSaved, 100)}%` }}
                      className={`h-full rounded-full ${
                        milestone.percentageSaved >= 100 ? 'bg-green-500' :
                        milestone.percentageSaved >= 50 ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-semibold text-gray-900">
                      {milestone.percentageSaved.toFixed(0)}% complete
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatCurrency(milestone.remaining)} remaining
                    </span>
                  </div>
                </div>

                {/* Monthly Requirement */}
                {milestone.monthlyRequired !== null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Monthly savings needed:</span>
                      <span className={`text-sm font-bold ${
                        milestone.monthlyRequired <= monthlyCapacity * 0.3 ? 'text-green-600' :
                        milestone.monthlyRequired <= monthlyCapacity ? 'text-blue-600' :
                        milestone.monthlyRequired <= monthlyCapacity * 1.5 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {formatCurrency(milestone.monthlyRequired)}/month
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Smart Recommendations</h3>
              <p className="text-sm text-gray-300">AI-powered strategies to achieve your goals</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.recommendations.map((rec, index) => {
              const Icon = rec.icon;
              return (
                <div key={index} className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{rec.title}</h4>
                      <p className="text-sm text-gray-300 mb-2">{rec.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-green-300">
                          ✓ Impact: {rec.impact}
                        </span>
                        <span className={`${
                          rec.difficulty === 'Low' ? 'text-green-300' :
                          rec.difficulty === 'Medium' ? 'text-yellow-300' :
                          'text-red-300'
                        }`}>
                          Difficulty: {rec.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline Visualization */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timeline View
        </h3>

        <div className="relative py-8">
          {/* Timeline axis */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200"></div>

          {/* Milestone markers */}
          <div className="relative flex justify-between items-center">
            {/* Today marker */}
            <div className="flex flex-col items-center z-10">
              <div className="text-xs font-semibold text-gray-900 mb-2 whitespace-nowrap">
                TODAY
              </div>
              <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
            </div>

            {/* Milestone markers */}
            {data.milestones
              .filter(m => m.target_date)
              .slice(0, 4)
              .map((milestone, index) => (
                <div key={milestone.id} className="flex flex-col items-center z-10 relative">
                  {/* Date above marker */}
                  <div className="text-xs font-semibold text-gray-900 mb-2 whitespace-nowrap">
                    {formatDate(milestone.target_date)}
                  </div>

                  {/* Colored marker dot */}
                  <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${
                    milestone.percentageSaved >= 100 ? 'bg-green-500' :
                    milestone.status === 'on-track' || milestone.status === 'achievable' ? 'bg-blue-500' :
                    'bg-red-500'
                  }`}></div>

                  {/* Title and budget below marker */}
                  <div className="mt-2 text-center max-w-[100px]">
                    <div className="text-xs text-gray-900 font-medium truncate">
                      {milestone.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {formatCurrency(milestone.budget_amount)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity (All Milestones)
        </h3>

        {/* Aggregate all contributions and sort by date */}
        {(() => {
          const allContributions = data.milestones.flatMap(m =>
            m.contributions.map(c => ({
              ...c,
              milestoneTitle: m.title
            }))
          );
          allContributions.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
          const recentContributions = allContributions.slice(0, 8);

          if (recentContributions.length === 0) {
            return (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No contributions yet</p>
              </div>
            );
          }

          return (
            <div className="space-y-2">
              {recentContributions.map((contribution, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        +{formatCurrency(contribution.amount)} → {contribution.milestoneTitle}
                      </p>
                      <p className="text-xs text-gray-600">
                        {contribution.category || 'General'} · {new Date(contribution.expense_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default MilestoneOverview;
