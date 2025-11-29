import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, Calendar, AlertTriangle, CheckCircle2,
  ChevronRight, Zap, ArrowUpRight, ArrowDownRight, Minus,
  BarChart3, GitBranch, Shield, RefreshCw
} from 'lucide-react';
import { getUserRoadmaps, getMilestonesByRoadmap, getTasksByMilestone, getExpensesByMilestone } from '../services/supabaseService';
import GoalOrchestrator from '../services/goalOrchestrator';

/**
 * Portfolio Overview - Redesigned
 *
 * A sophisticated, data-driven view of all dreams together.
 * Design: Warm, editorial, matches Dashboard aesthetic.
 */
const PortfolioOverview = ({ onBack, userId, userContext }) => {
  const [loading, setLoading] = useState(true);
  const [dreams, setDreams] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const loadPortfolioData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: roadmaps, error: roadmapsError } = await getUserRoadmaps();
      if (roadmapsError) throw roadmapsError;

      if (!roadmaps || roadmaps.length === 0) {
        setError('No dreams found. Create your first dream to see portfolio overview!');
        setLoading(false);
        return;
      }

      // Load milestones, tasks, and expenses for each dream
      const enrichedDreams = await Promise.all(
        roadmaps.map(async (dream) => {
          const { data: milestones } = await getMilestonesByRoadmap(dream.id);

          let totalSpent = 0;
          let totalTasks = 0;
          let completedTasks = 0;

          const enrichedMilestones = await Promise.all(
            (milestones || []).map(async (milestone) => {
              const { data: tasks } = await getTasksByMilestone(milestone.id);
              const { data: expenses } = await getExpensesByMilestone(milestone.id);

              totalSpent += expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
              totalTasks += tasks?.length || 0;
              completedTasks += tasks?.filter(t => t.completed)?.length || 0;

              return { ...milestone, tasks: tasks || [], expenses: expenses || [] };
            })
          );

          return {
            ...dream,
            milestones: enrichedMilestones,
            totalSpent,
            totalTasks,
            completedTasks,
            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          };
        })
      );

      setDreams(enrichedDreams);

      // Create orchestrator for analysis
      const orch = new GoalOrchestrator(userId, null);
      enrichedDreams.forEach(dream => {
        dream.milestones.forEach(milestone => {
          orch.addGoal({
            id: milestone.id,
            title: milestone.title,
            category: milestone.category,
            estimatedCost: milestone.estimated_cost || milestone.budget_amount || 0,
            duration: milestone.duration || 12,
            timeline: milestone.target_date ? {
              startDate: new Date(milestone.created_at),
              endDate: new Date(milestone.target_date)
            } : null,
            description: milestone.description,
            priority: milestone.priority || 'medium',
            dreamId: dream.id,
            dreamTitle: dream.title
          });
        });
      });

      setStats(orch.getStats());
    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError('Failed to load portfolio data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-medium">Analyzing your portfolio...</p>
          <p className="text-stone-400 text-sm mt-1">Calculating conflicts and synergies</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] p-6">
        <div className="container mx-auto max-w-6xl">
          <button
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="bg-white rounded-2xl p-12 text-center border-2 border-stone-200">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-serif text-stone-900 mb-2">Portfolio Not Available</h2>
            <p className="text-stone-600 mb-6">{error}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalBudget = dreams.reduce((sum, d) => {
    const dreamBudget = d.milestones?.reduce((mSum, m) => mSum + (m.budget_amount || 0), 0) || 0;
    return sum + dreamBudget;
  }, 0);
  const totalSpent = dreams.reduce((sum, d) => sum + (d.totalSpent || 0), 0);
  const totalMilestones = dreams.reduce((sum, d) => sum + (d.milestones?.length || 0), 0);
  const overallProgress = dreams.length > 0
    ? Math.round(dreams.reduce((sum, d) => sum + d.progress, 0) / dreams.length)
    : 0;
  const conflictsCount = stats?.conflicts?.length || 0;
  const synergiesCount = stats?.synergies?.length || 0;

  // Get health status
  const getHealthStatus = () => {
    if (conflictsCount > 2) return { label: 'Needs Attention', color: 'amber', icon: AlertTriangle };
    if (conflictsCount > 0) return { label: 'Minor Issues', color: 'amber', icon: AlertTriangle };
    if (synergiesCount > 0) return { label: 'Optimized', color: 'emerald', icon: CheckCircle2 };
    return { label: 'Healthy', color: 'emerald', icon: CheckCircle2 };
  };
  const health = getHealthStatus();

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 border-b border-stone-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="w-px h-6 bg-stone-200" />
            <div>
              <h1 className="text-xl font-bold text-stone-900">Portfolio Intelligence</h1>
              {userContext && (
                <p className="text-xs text-stone-500">
                  {userContext.partner1_name || userContext.partner1} & {userContext.partner2_name || userContext.partner2}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={loadPortfolioData}
            className="p-2 rounded-lg hover:bg-stone-50 border border-stone-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Hero Stats */}
        <div className="mb-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-stone-500 text-sm font-medium uppercase tracking-wide mb-1">Total Portfolio Value</p>
              <h2 className="text-5xl font-serif text-stone-900">${totalBudget.toLocaleString()}</h2>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              health.color === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <health.icon className="w-4 h-4" />
              <span className="text-sm font-semibold">{health.label}</span>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat
              label="Active Dreams"
              value={dreams.length}
              sublabel={`${totalMilestones} milestones`}
            />
            <QuickStat
              label="Saved So Far"
              value={`$${totalSpent.toLocaleString()}`}
              sublabel={totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% of goal` : 'No budget set'}
              trend={totalSpent > 0 ? 'up' : 'neutral'}
            />
            <QuickStat
              label="Overall Progress"
              value={`${overallProgress}%`}
              sublabel="tasks completed"
              trend={overallProgress > 50 ? 'up' : overallProgress > 20 ? 'neutral' : 'down'}
            />
            <QuickStat
              label="Conflicts"
              value={conflictsCount}
              sublabel={conflictsCount > 0 ? 'require attention' : 'all clear'}
              trend={conflictsCount === 0 ? 'up' : 'down'}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Dreams List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dreams Section */}
            <section className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-bold text-stone-900">Your Dreams</h3>
                <span className="text-sm text-stone-500">{dreams.length} active</span>
              </div>

              <div className="divide-y divide-stone-100">
                {dreams.map((dream, index) => (
                  <DreamRow key={dream.id} dream={dream} index={index} />
                ))}
              </div>
            </section>

            {/* Timeline Section */}
            {stats?.timeline && stats.timeline.length > 0 && (
              <section className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-stone-600" />
                  <h3 className="font-bold text-stone-900">Timeline</h3>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {stats.timeline.slice(0, 6).map((item, index) => (
                      <TimelineBar key={index} item={item} maxMonth={stats.metrics?.maxEndMonth || 24} />
                    ))}
                  </div>

                  {stats.timeline.length > 6 && (
                    <p className="text-sm text-stone-500 mt-4 text-center">
                      +{stats.timeline.length - 6} more milestones
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Budget Distribution */}
            {stats?.budgetAnalysis?.goalsWithMetrics && (
              <section className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-stone-600" />
                  <h3 className="font-bold text-stone-900">Budget Distribution</h3>
                </div>

                <div className="p-6 space-y-4">
                  {stats.budgetAnalysis.goalsWithMetrics.slice(0, 5).map((item, index) => (
                    <BudgetBar key={index} item={item} index={index} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Insights */}
          <div className="space-y-6">
            {/* Conflicts Card */}
            {conflictsCount > 0 && (
              <InsightCard
                icon={AlertTriangle}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                title="Resource Conflicts"
                count={conflictsCount}
                items={stats?.conflicts || []}
                renderItem={(conflict, i) => (
                  <div key={i} className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                    <p className="text-sm font-medium text-stone-800">{conflict.message || conflict.title}</p>
                    {conflict.recommendation && (
                      <p className="text-xs text-stone-600 mt-1">{conflict.recommendation}</p>
                    )}
                  </div>
                )}
              />
            )}

            {/* Synergies Card */}
            {synergiesCount > 0 && (
              <InsightCard
                icon={Zap}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                title="Synergies Found"
                count={synergiesCount}
                items={stats?.synergies || []}
                renderItem={(synergy, i) => (
                  <div key={i} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                    <p className="text-sm font-medium text-stone-800">{synergy.message || synergy.title}</p>
                    {synergy.benefit && (
                      <p className="text-xs text-emerald-700 mt-1">Potential: {synergy.benefit}</p>
                    )}
                  </div>
                )}
              />
            )}

            {/* Dependencies Card */}
            {stats?.dependencyGraph?.edges?.length > 0 && (
              <InsightCard
                icon={GitBranch}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                title="Dependencies"
                count={stats.dependencyGraph.edges.length}
                items={stats.dependencyGraph.edges}
                renderItem={(edge, i) => {
                  const fromGoal = stats.dependencyGraph.nodes.find(n => n.id === edge.from);
                  const toGoal = stats.dependencyGraph.nodes.find(n => n.id === edge.to);
                  return (
                    <div key={i} className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 text-sm font-medium text-stone-800">
                        <span>{fromGoal?.title}</span>
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                        <span>{toGoal?.title}</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">{edge.reason}</p>
                    </div>
                  );
                }}
              />
            )}

            {/* Risks Card */}
            {stats?.risks && stats.risks.length > 0 && (
              <InsightCard
                icon={Shield}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                title="Risk Analysis"
                count={stats.risks.length}
                items={stats.risks}
                renderItem={(risk, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    risk.severity === 'high' ? 'bg-rose-50/50 border-rose-100' :
                    risk.severity === 'medium' ? 'bg-amber-50/50 border-amber-100' :
                    'bg-stone-50 border-stone-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase ${
                        risk.severity === 'high' ? 'text-rose-600' :
                        risk.severity === 'medium' ? 'text-amber-600' :
                        'text-stone-500'
                      }`}>{risk.severity}</span>
                    </div>
                    <p className="text-sm font-medium text-stone-800">{risk.title}</p>
                    <p className="text-xs text-stone-600 mt-1">{risk.message}</p>
                  </div>
                )}
              />
            )}

            {/* Optimal Order */}
            {stats?.optimalOrder && stats.optimalOrder.length > 1 && (
              <section className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-stone-900">Recommended Sequence</h3>
                </div>
                <div className="p-5">
                  <ol className="space-y-2">
                    {stats.optimalOrder.map((goal, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-600">
                          {index + 1}
                        </span>
                        <span className="text-sm text-stone-700">{goal.title}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}

            {/* Empty State for Insights */}
            {conflictsCount === 0 && synergiesCount === 0 && (!stats?.risks || stats.risks.length === 0) && (
              <section className="bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-bold text-emerald-900 mb-1">All Clear!</h3>
                <p className="text-sm text-emerald-700">No conflicts detected. Your dreams are well-balanced.</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components

const QuickStat = ({ label, value, sublabel, trend }) => {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-stone-400';

  return (
    <div className="bg-white rounded-xl border-2 border-stone-200 p-4">
      <p className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-stone-900">{value}</p>
        {trend && <TrendIcon className={`w-4 h-4 ${trendColor}`} />}
      </div>
      {sublabel && <p className="text-xs text-stone-500 mt-1">{sublabel}</p>}
    </div>
  );
};

const DreamRow = ({ dream, index }) => {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-amber-500',
    'bg-rose-500', 'bg-violet-500', 'bg-cyan-500'
  ];
  const bgColor = colors[index % colors.length];

  return (
    <div className="px-6 py-4 flex items-center gap-4 hover:bg-stone-50 transition-colors">
      <div className={`w-3 h-3 rounded-full ${bgColor}`} />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-stone-900 truncate">{dream.title || 'Untitled Dream'}</h4>
        <p className="text-sm text-stone-500">
          {dream.milestones?.length || 0} milestones • {dream.progress}% complete
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-stone-900">${(dream.budget_amount || 0).toLocaleString()}</p>
        <p className="text-xs text-stone-500">${(dream.totalSpent || 0).toLocaleString()} saved</p>
      </div>
      {/* Progress bar */}
      <div className="w-20 hidden md:block">
        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${bgColor} rounded-full transition-all duration-500`}
            style={{ width: `${dream.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const TimelineBar = ({ item, maxMonth }) => {
  const startPercent = (item.startMonth / maxMonth) * 100;
  const widthPercent = Math.max((item.duration / maxMonth) * 100, 8); // Min 8% width for visibility

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-stone-700 truncate max-w-[60%]">{item.goal.title}</span>
        <span className="text-stone-500 text-xs">
          {Math.round(item.duration)} months
        </span>
      </div>
      <div className="relative h-6 bg-stone-100 rounded overflow-hidden">
        <div
          className="absolute h-full bg-stone-800 rounded flex items-center px-2"
          style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
        >
          <span className="text-xs text-white font-medium truncate">
            M{Math.round(item.startMonth)}-{Math.round(item.endMonth)}
          </span>
        </div>
      </div>
    </div>
  );
};

const BudgetBar = ({ item, index }) => {
  const colors = [
    'bg-stone-800', 'bg-stone-600', 'bg-stone-500',
    'bg-stone-400', 'bg-stone-300'
  ];

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-stone-700 truncate max-w-[60%]">{item.goal.title}</span>
        <span className="text-stone-600 font-semibold">
          ${item.cost.toLocaleString()} <span className="text-stone-400 font-normal">({Math.round(item.percentage)}%)</span>
        </span>
      </div>
      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.percentage}%` }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`h-full ${colors[index % colors.length]} rounded-full`}
        />
      </div>
    </div>
  );
};

const InsightCard = ({ icon: Icon, iconBg, iconColor, title, count, items, renderItem }) => {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, 2);

  return (
    <section className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 border-b border-stone-100 flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <h3 className="font-bold text-stone-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-600">{count}</span>
          <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {displayItems.map((item, i) => renderItem(item, i))}
              {items.length > 2 && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-sm text-stone-500 hover:text-stone-700 w-full text-center py-1"
                >
                  +{items.length - 2} more
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PortfolioOverview;
