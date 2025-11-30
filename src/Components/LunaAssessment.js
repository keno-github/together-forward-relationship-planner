import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, AlertCircle, CheckCircle,
  Target, DollarSign, Clock, Users, Zap, Heart, Sparkles,
  AlertTriangle, Award, ArrowRight, ChevronDown, ChevronUp,
  Activity, Calendar, RefreshCw, Lightbulb, Flag
} from 'lucide-react';
import { generateCoupleAssessment } from '../services/agents/assessmentIntelligenceAgent';
import {
  getUserRoadmaps,
  getMilestonesByRoadmap,
  getTasksByMilestone,
  getExpensesByMilestone,
  getRoadmapBudgetSummary
} from '../services/supabaseService';

/**
 * Luna Assessment Component
 *
 * Provides comprehensive, intelligent analysis of a couple's journey
 * with actionable insights, recommendations, and progress tracking
 *
 * Features:
 * - Overall health score with visual indicators
 * - Key insights categorized by type (strengths, concerns, opportunities)
 * - Prioritized actionable recommendations
 * - Financial health assessment for monetary milestones
 * - Timeline and momentum analysis
 * - Partner collaboration balance
 * - Celebration moments
 */
const LunaAssessment = ({ userId, roadmapId, userContext }) => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    insights: true,
    recommendations: true,
    financial: false,
    timeline: false,
    balance: false
  });

  /**
   * Manual refresh handler
   */
  const handleRefreshAssessment = async () => {
    await generateAssessmentData();
  };

  /**
   * Collect all data and generate assessment
   */
  const generateAssessmentData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Gather all roadmap data
        const roadmapsResult = await getUserRoadmaps();

        if (roadmapsResult.error) {
          throw new Error(roadmapsResult.error.message || 'Failed to fetch roadmaps');
        }

        const roadmaps = roadmapId
          ? [roadmapsResult.data?.find(r => r.id === roadmapId)].filter(Boolean)
          : roadmapsResult.data || [];

        if (!roadmaps || roadmaps.length === 0) {
          setError('No dreams found. Create a dream to get your assessment.');
          setLoading(false);
          return;
        }

        // Step 2: Gather all milestones across roadmaps
        const allMilestones = [];
        for (const roadmap of roadmaps) {
          const milestonesResult = await getMilestonesByRoadmap(roadmap.id);
          if (milestonesResult.data) {
            allMilestones.push(...milestonesResult.data);
          }
        }

        // Step 3: Gather all tasks across milestones
        const allTasks = [];
        for (const milestone of allMilestones) {
          const tasksResult = await getTasksByMilestone(milestone.id);
          if (tasksResult.data) {
            allTasks.push(...tasksResult.data);
          }
        }

        // Step 4: Gather all expenses across milestones
        const allExpenses = [];
        for (const milestone of allMilestones) {
          try {
            const expensesResult = await getExpensesByMilestone(milestone.id);
            if (expensesResult.data) {
              allExpenses.push(...expensesResult.data);
            }
          } catch (e) {
            console.warn('Could not fetch expenses for milestone:', milestone.id);
          }
        }

        // Step 5: Gather budget summaries for each roadmap
        let budgetSummary = null;
        try {
          if (roadmapId) {
            const budgetResult = await getRoadmapBudgetSummary(roadmapId);
            budgetSummary = budgetResult.data;
          }
        } catch (e) {
          console.warn('Could not fetch budget summary');
        }

        // Step 6: Build comprehensive data package
        const assessmentData = {
          couple: {
            partner1: userContext?.partner1_name || roadmaps[0]?.partner1_name || 'Partner A',
            partner2: userContext?.partner2_name || roadmaps[0]?.partner2_name || 'Partner B',
            compatibilityScore: roadmaps[0]?.compatibility_score,
            relationshipContext: userContext?.relationshipContext || 'Building their future together',
          },
          roadmaps: roadmaps.filter(r => r), // Filter out any null values
          milestones: allMilestones,
          tasks: allTasks,
          expenses: allExpenses,
          budgetSummary,
        };

        console.log('Assessment data collected:', {
          roadmaps: assessmentData.roadmaps.length,
          milestones: assessmentData.milestones.length,
          tasks: assessmentData.tasks.length,
          expenses: assessmentData.expenses.length,
        });

        // Step 7: Generate assessment with AI
        const result = await generateCoupleAssessment(assessmentData);
        setAssessment(result);

      } catch (err) {
        console.error('Assessment generation failed:', err);
        setError('Failed to generate assessment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

  // Generate assessment on mount
  useEffect(() => {
    if (userId) {
      generateAssessmentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, roadmapId]);

  /**
   * Toggle section expansion
   */
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /**
   * Get icon for insight type
   */
  const getInsightIcon = (type) => {
    switch (type) {
      case 'strength': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'concern': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'opportunity': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'risk': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Sparkles className="w-5 h-5" style={{ color: '#c49a6c' }} />;
    }
  };

  /**
   * Get color for priority
   */
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  /**
   * Get status color and icon
   */
  const getStatusIndicator = (status) => {
    switch (status) {
      case 'thriving':
        return {
          color: 'from-green-500 to-emerald-600',
          icon: <Award className="w-8 h-8 text-white" />,
          label: 'Thriving',
          textColor: 'text-green-700'
        };
      case 'on-track':
        return {
          color: 'from-blue-500 to-cyan-600',
          icon: <TrendingUp className="w-8 h-8 text-white" />,
          label: 'On Track',
          textColor: 'text-blue-700'
        };
      case 'needs-attention':
        return {
          color: 'from-amber-500 to-orange-600',
          icon: <AlertTriangle className="w-8 h-8 text-white" />,
          label: 'Needs Attention',
          textColor: 'text-amber-700'
        };
      case 'at-risk':
        return {
          color: 'from-red-500 to-rose-600',
          icon: <AlertCircle className="w-8 h-8 text-white" />,
          label: 'At Risk',
          textColor: 'text-red-700'
        };
      default:
        return {
          color: 'from-gray-500 to-slate-600',
          icon: <Activity className="w-8 h-8 text-white" />,
          label: 'Unknown',
          textColor: 'text-gray-700'
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Brain className="w-16 h-16" style={{ color: '#c49a6c' }} />
        </motion.div>
        <p className="mt-6 text-lg" style={{ color: '#2d2926' }}>Luna is analyzing your journey...</p>
        <p className="mt-2 text-sm" style={{ color: '#6b635b' }}>Gathering insights from your roadmaps, tasks, and progress</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 mb-4" style={{ color: '#b07d62' }} />
        <p className="text-lg mb-2" style={{ color: '#2d2926' }}>Unable to Generate Assessment</p>
        <p className="text-sm mb-6" style={{ color: '#6b635b' }}>{error}</p>
        <button
          onClick={handleRefreshAssessment}
          className="px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #2d2926, #3d3633)' }}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // No assessment yet
  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Brain className="w-16 h-16 mb-4" style={{ color: '#c49a6c' }} />
        <p className="text-lg mb-2" style={{ color: '#2d2926' }}>Ready for Your Assessment?</p>
        <p className="text-sm mb-6" style={{ color: '#6b635b' }}>Get intelligent insights about your journey from Luna</p>
        <button
          onClick={handleRefreshAssessment}
          className="px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #2d2926, #3d3633)' }}
        >
          <Sparkles className="w-4 h-4" />
          Generate Assessment
        </button>
      </div>
    );
  }

  const statusIndicator = getStatusIndicator(assessment.overallHealth?.status);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-10 h-10" style={{ color: '#c49a6c' }} />
          <h1 className="text-4xl font-bold" style={{ color: '#2d2926', fontFamily: "'Playfair Display', Georgia, serif" }}>Luna's Assessment</h1>
        </div>
        <p style={{ color: '#6b635b' }}>Intelligent insights into your journey together</p>
        <button
          onClick={handleRefreshAssessment}
          className="mt-4 text-sm flex items-center gap-1 mx-auto transition-colors"
          style={{ color: '#c49a6c' }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Assessment
        </button>
      </motion.div>

      {/* Overall Health Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className={`bg-gradient-to-r ${statusIndicator.color} p-8 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                {statusIndicator.icon}
                <div>
                  <h2 className="text-2xl font-bold">Journey Health</h2>
                  <p className="text-white/90">{statusIndicator.label}</p>
                </div>
              </div>
              <p className="text-lg leading-relaxed text-white/95">
                {assessment.overallHealth?.summary}
              </p>
            </div>
            <div className="text-center ml-8">
              <div className="text-6xl font-bold mb-2">
                {assessment.overallHealth?.score || 0}
              </div>
              <p className="text-white/90 text-sm">Health Score</p>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        {assessment.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6" style={{ backgroundColor: '#faf8f5' }}>
            <div className="text-center">
              <Target className="w-6 h-6 mx-auto mb-2" style={{ color: '#c49a6c' }} />
              <p className="text-2xl font-bold text-gray-900">{assessment.metrics.totalMilestones}</p>
              <p className="text-sm text-gray-600">Milestones</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {assessment.metrics.completionRate?.milestones?.toFixed(0) || 0}%
              </p>
              <p className="text-sm text-gray-600">Complete</p>
            </div>
            <div className="text-center">
              <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{assessment.metrics.totalTasks}</p>
              <p className="text-sm text-gray-600">Tasks</p>
            </div>
            <div className="text-center">
              <Zap className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{assessment.metrics.momentumScore || 0}</p>
              <p className="text-sm text-gray-600">Momentum</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Key Insights */}
      {assessment.keyInsights && assessment.keyInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <button
            onClick={() => toggleSection('insights')}
            className="w-full px-6 py-4 flex items-center justify-between transition-colors"
            style={{ ':hover': { backgroundColor: '#faf8f5' } }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" style={{ color: '#c49a6c' }} />
              <h3 className="text-xl font-bold" style={{ color: '#2d2926' }}>Key Insights</h3>
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(196, 154, 108, 0.15)', color: '#c49a6c' }}>
                {assessment.keyInsights.length}
              </span>
            </div>
            {expandedSections.insights ? <ChevronUp /> : <ChevronDown />}
          </button>

          <AnimatePresence>
            {expandedSections.insights && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200"
              >
                <div className="p-6 space-y-4">
                  {assessment.keyInsights.map((insight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                          {insight.impact && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                              insight.impact === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {insight.impact} impact
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{insight.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Recommendations */}
      {assessment.recommendations && assessment.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <button
            onClick={() => toggleSection('recommendations')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Flag className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Recommended Actions</h3>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {assessment.recommendations.length}
              </span>
            </div>
            {expandedSections.recommendations ? <ChevronUp /> : <ChevronDown />}
          </button>

          <AnimatePresence>
            {expandedSections.recommendations && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200"
              >
                <div className="p-6 space-y-4">
                  {assessment.recommendations.map((rec, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-4 rounded-lg border-2 ${getPriorityColor(rec.priority)}`}
                    >
                      <div className="flex items-start gap-3">
                        <ArrowRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{rec.action}</h4>
                            {rec.assignedTo && rec.assignedTo !== 'both' && (
                              <span className="text-xs bg-white/50 px-2 py-1 rounded">
                                <Users className="w-3 h-3 inline mr-1" />
                                {rec.assignedTo}
                              </span>
                            )}
                            {rec.timeframe && (
                              <span className="text-xs bg-white/50 px-2 py-1 rounded">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {rec.timeframe.replace('-', ' ')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm opacity-90">{rec.reason}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Financial Health */}
      {assessment.financialHealth && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <button
            onClick={() => toggleSection('financial')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Financial Health</h3>
              <span className="text-sm text-gray-600">
                Score: {assessment.financialHealth.score}/100
              </span>
            </div>
            {expandedSections.financial ? <ChevronUp /> : <ChevronDown />}
          </button>

          <AnimatePresence>
            {expandedSections.financial && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Budget Status:</span>
                    <span className={`px-3 py-1 rounded-full ${
                      assessment.financialHealth.budgetStatus === 'under-budget' ? 'bg-green-100 text-green-700' :
                      assessment.financialHealth.budgetStatus === 'on-budget' ? 'bg-blue-100 text-blue-700' :
                      assessment.financialHealth.budgetStatus === 'over-budget' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {assessment.financialHealth.budgetStatus?.replace('-', ' ')}
                    </span>
                  </div>

                  {assessment.financialHealth.insights && assessment.financialHealth.insights.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Key Financial Insights</h4>
                      <ul className="space-y-2">
                        {assessment.financialHealth.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assessment.financialHealth.alerts && assessment.financialHealth.alerts.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Financial Alerts</h4>
                      <ul className="space-y-2">
                        {assessment.financialHealth.alerts.map((alert, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Timeline Analysis */}
      {assessment.timelineAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <button
            onClick={() => toggleSection('timeline')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Timeline & Momentum</h3>
            </div>
            {expandedSections.timeline ? <ChevronUp /> : <ChevronDown />}
          </button>

          <AnimatePresence>
            {expandedSections.timeline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200"
              >
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-700">
                        {assessment.timelineAnalysis.onTrackCount || 0}
                      </p>
                      <p className="text-sm text-gray-600">On Track</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-3xl font-bold text-red-700">
                        {assessment.timelineAnalysis.delayedCount || 0}
                      </p>
                      <p className="text-sm text-gray-600">Delayed</p>
                    </div>
                  </div>

                  {assessment.timelineAnalysis.upcomingDeadlines && assessment.timelineAnalysis.upcomingDeadlines.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Upcoming Deadlines</h4>
                      <ul className="space-y-2">
                        {assessment.timelineAnalysis.upcomingDeadlines.map((deadline, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            {deadline}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assessment.timelineAnalysis.criticalPathItems && assessment.timelineAnalysis.criticalPathItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Critical Path Items</h4>
                      <ul className="space-y-2">
                        {assessment.timelineAnalysis.criticalPathItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <Flag className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Partner Balance */}
      {assessment.partnerBalance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <button
            onClick={() => toggleSection('balance')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-pink-600" />
              <h3 className="text-xl font-bold text-gray-900">Partnership Balance</h3>
              <span className="text-sm text-gray-600">
                Score: {assessment.partnerBalance.score}/100
              </span>
            </div>
            {expandedSections.balance ? <ChevronUp /> : <ChevronDown />}
          </button>

          <AnimatePresence>
            {expandedSections.balance && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200"
              >
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">{assessment.partnerBalance.description}</p>

                  {assessment.partnerBalance.suggestions && assessment.partnerBalance.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Suggestions</h4>
                      <ul className="space-y-2">
                        {assessment.partnerBalance.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <Users className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Celebration Moments */}
      {assessment.celebrationMoments && assessment.celebrationMoments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl shadow-md p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #2d2926 0%, #3d3633 100%)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8" style={{ color: '#c49a6c' }} />
            <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Worth Celebrating!</h3>
          </div>
          <ul className="space-y-2">
            {assessment.celebrationMoments.map((moment, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#c49a6c' }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.95)' }}>{moment}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Generated At Footer */}
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Assessment generated {new Date(assessment.generatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default LunaAssessment;
