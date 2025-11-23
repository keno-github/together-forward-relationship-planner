import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Target, TrendingUp, DollarSign, Calendar,
  AlertTriangle, Sparkles, Users, Map, Brain
} from 'lucide-react';
import { getUserRoadmaps, getMilestonesByRoadmap, getTasksByMilestone, getExpensesByMilestone } from '../services/supabaseService';
import GoalOrchestrator from '../services/goalOrchestrator';
import IntelligencePanel from './IntelligencePanel';

/**
 * Portfolio Overview
 *
 * High-level intelligence view showing ALL dreams together
 * - Cross-dream conflicts and synergies
 * - Budget distribution across all dreams
 * - Timeline visualization
 * - Dependencies and risk analysis
 */
const PortfolioOverview = ({ onBack, userId, userContext }) => {
  const [loading, setLoading] = useState(true);
  const [dreams, setDreams] = useState([]);
  const [orchestrator, setOrchestrator] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPortfolioData();
  }, [userId]);

  const loadPortfolioData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Load all roadmaps/dreams
      const { data: roadmaps, error: roadmapsError } = await getUserRoadmaps();

      if (roadmapsError) throw roadmapsError;

      if (!roadmaps || roadmaps.length === 0) {
        setError('No dreams found. Create your first dream to see portfolio overview!');
        setLoading(false);
        return;
      }

      // Step 2: Load milestones, tasks, and expenses for each dream
      const enrichedDreams = await Promise.all(
        roadmaps.map(async (dream) => {
          const { data: milestones } = await getMilestonesByRoadmap(dream.id);

          // For each milestone, load tasks and expenses
          const enrichedMilestones = await Promise.all(
            (milestones || []).map(async (milestone) => {
              const { data: tasks } = await getTasksByMilestone(milestone.id);
              const { data: expenses } = await getExpensesByMilestone(milestone.id);

              return {
                ...milestone,
                tasks: tasks || [],
                expenses: expenses || []
              };
            })
          );

          return {
            ...dream,
            milestones: enrichedMilestones
          };
        })
      );

      setDreams(enrichedDreams);

      // Step 3: Create orchestrator and analyze all dreams
      const orch = new GoalOrchestrator(userId, null);

      // Add each dream as a goal to the orchestrator
      enrichedDreams.forEach(dream => {
        dream.milestones.forEach(milestone => {
          orch.addGoal({
            id: milestone.id,
            title: milestone.title,
            category: milestone.category,
            estimatedCost: milestone.estimated_cost || milestone.budget_amount || 0,
            duration: milestone.duration || 12, // Default 12 months if not specified
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

      setOrchestrator(orch);

      const portfolioStats = orch.getStats();
      setStats(portfolioStats);

    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError('Failed to load portfolio data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-xl font-semibold text-gray-800">Analyzing your dreams...</p>
          <p className="text-sm text-gray-600 mt-2">Calculating conflicts, synergies, and opportunities</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="container mx-auto max-w-6xl">
          <button
            onClick={onBack}
            className="mb-6 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Your Dreams
          </button>

          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Overview Not Available</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Return to Your Dreams
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary metrics
  const totalDreams = dreams.length;
  const totalMilestones = dreams.reduce((sum, d) => sum + (d.milestones?.length || 0), 0);
  const totalBudget = stats?.totalBudget || 0;
  const conflictsCount = stats?.conflicts?.length || 0;
  const synergiesCount = stats?.synergies?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-6 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Your Dreams
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Portfolio Overview</h1>
              <p className="text-lg text-gray-600">
                Intelligent insights across all your dreams
              </p>
            </div>
          </div>

          {userContext && (
            <p className="text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {userContext.partner1_name || userContext.partner1} & {userContext.partner2_name || userContext.partner2}
            </p>
          )}
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Target className="w-6 h-6 text-purple-600" />}
            label="Active Dreams"
            value={totalDreams}
            subtitle={`${totalMilestones} total milestones`}
            bg="bg-purple-50"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
            label="Total Budget"
            value={`$${totalBudget.toLocaleString()}`}
            subtitle="Across all dreams"
            bg="bg-emerald-50"
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
            label="Conflicts Detected"
            value={conflictsCount}
            subtitle={conflictsCount > 0 ? 'Needs attention' : 'All clear'}
            bg="bg-amber-50"
          />
          <StatCard
            icon={<Sparkles className="w-6 h-6 text-indigo-600" />}
            label="Synergies Found"
            value={synergiesCount}
            subtitle={synergiesCount > 0 ? 'Optimize these!' : 'Keep planning'}
            bg="bg-indigo-50"
          />
        </div>

        {/* Intelligence Panel */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Luna's Intelligence</h2>
                <p className="text-gray-600">Cross-dream analysis and recommendations</p>
              </div>
            </div>

            <IntelligencePanel stats={stats} />
          </motion.div>
        )}

        {/* Dreams List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Your Dreams</h3>
          <div className="space-y-4">
            {dreams.map(dream => (
              <div
                key={dream.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{dream.title || 'Untitled Dream'}</h4>
                  <p className="text-sm text-gray-600">
                    {dream.milestones?.length || 0} milestones •
                    {dream.partner1_name} & {dream.partner2_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">
                    ${(dream.budget_amount || 0).toLocaleString()}
                  </p>
                  {dream.target_date && (
                    <p className="text-xs text-gray-500">
                      Target: {new Date(dream.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Helper: Stat Card Component
const StatCard = ({ icon, label, value, subtitle, bg }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`${bg} rounded-xl p-6 border border-gray-200`}
  >
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-xs text-gray-600">{subtitle}</p>
  </motion.div>
);

export default PortfolioOverview;
