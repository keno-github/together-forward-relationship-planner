import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, AlertCircle, CheckCircle,
  Target, DollarSign, Clock, Users, Zap, Heart,
  AlertTriangle, Award, ArrowRight, ChevronDown, ChevronUp,
  Activity, Calendar, RefreshCw, Lightbulb, Flag, Sparkles
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
 * Luna Assessment Component - TwogetherForward Brand
 *
 * Warm, sophisticated analysis of a couple's journey with actionable insights
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
   * Get icon for insight type - branded colors
   */
  const getInsightIcon = (type) => {
    switch (type) {
      case 'strength':
        return <CheckCircle className="w-5 h-5" style={{ color: '#7d8c75' }} />;
      case 'concern':
        return <AlertTriangle className="w-5 h-5" style={{ color: '#c76b6b' }} />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5" style={{ color: '#c49a6c' }} />;
      case 'risk':
        return <AlertCircle className="w-5 h-5" style={{ color: '#b07d62' }} />;
      default:
        return <Sparkles className="w-5 h-5" style={{ color: '#c49a6c' }} />;
    }
  };

  /**
   * Get color for priority - branded
   */
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return { bg: 'rgba(199, 107, 107, 0.12)', text: '#c76b6b', border: 'rgba(199, 107, 107, 0.3)' };
      case 'medium':
        return { bg: 'rgba(196, 154, 108, 0.12)', text: '#a88352', border: 'rgba(196, 154, 108, 0.3)' };
      case 'low':
        return { bg: 'rgba(125, 140, 117, 0.12)', text: '#7d8c75', border: 'rgba(125, 140, 117, 0.3)' };
      default:
        return { bg: 'rgba(107, 99, 91, 0.12)', text: '#6b635b', border: 'rgba(107, 99, 91, 0.3)' };
    }
  };

  /**
   * Get status indicator - warm branded design
   */
  const getStatusIndicator = (status) => {
    switch (status) {
      case 'thriving':
        return {
          bgColor: '#7d8c75',
          icon: <Award className="w-8 h-8 text-white" />,
          label: 'Thriving',
          textColor: '#7d8c75'
        };
      case 'on-track':
        return {
          bgColor: '#c49a6c',
          icon: <TrendingUp className="w-8 h-8 text-white" />,
          label: 'On Track',
          textColor: '#c49a6c'
        };
      case 'needs-attention':
        return {
          bgColor: '#C4785A',
          icon: <AlertTriangle className="w-8 h-8 text-white" />,
          label: 'Needs Attention',
          textColor: '#C4785A'
        };
      case 'at-risk':
        return {
          bgColor: '#c76b6b',
          icon: <AlertCircle className="w-8 h-8 text-white" />,
          label: 'At Risk',
          textColor: '#c76b6b'
        };
      default:
        return {
          bgColor: '#6b635b',
          icon: <Activity className="w-8 h-8 text-white" />,
          label: 'Unknown',
          textColor: '#6b635b'
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Brain className="w-16 h-16" style={{ color: '#C4785A' }} />
        </motion.div>
        <p
          className="mt-6 text-lg font-medium"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: '#2D2926'
          }}
        >
          Luna is analyzing your journey...
        </p>
        <p className="mt-2 text-sm" style={{ color: '#6b635b' }}>
          Gathering insights from your roadmaps, tasks, and progress
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <AlertCircle className="w-16 h-16 mb-4" style={{ color: '#C4785A' }} />
        <p
          className="text-xl font-medium mb-2"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: '#2D2926'
          }}
        >
          Unable to Generate Assessment
        </p>
        <p className="text-sm mb-6" style={{ color: '#6b635b' }}>{error}</p>
        <button
          onClick={handleRefreshAssessment}
          className="px-6 py-3 rounded-xl text-white transition-all hover:-translate-y-0.5 flex items-center gap-2 font-medium"
          style={{ background: '#2D2926' }}
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
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(196, 120, 90, 0.12)' }}
        >
          <Brain className="w-10 h-10" style={{ color: '#C4785A' }} />
        </div>
        <p
          className="text-2xl font-medium mb-2"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: '#2D2926'
          }}
        >
          Ready for Your Assessment?
        </p>
        <p className="text-sm mb-8" style={{ color: '#6b635b' }}>
          Get intelligent insights about your journey from Luna
        </p>
        <button
          onClick={handleRefreshAssessment}
          className="px-6 py-3 rounded-xl text-white transition-all hover:-translate-y-0.5 flex items-center gap-2 font-medium"
          style={{ background: '#2D2926' }}
        >
          <Sparkles className="w-4 h-4" />
          Generate Assessment
        </button>
      </div>
    );
  }

  const statusIndicator = getStatusIndicator(assessment.overallHealth?.status);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#FAF7F2' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-10 h-10" style={{ color: '#C4785A' }} />
            <h1
              className="text-4xl font-medium italic"
              style={{
                color: '#2D2926',
                fontFamily: "'Cormorant Garamond', serif"
              }}
            >
              Luna's Assessment
            </h1>
          </div>
          <p style={{ color: '#6b635b' }}>Intelligent insights into your journey together</p>
          <button
            onClick={handleRefreshAssessment}
            className="mt-4 text-sm flex items-center gap-2 mx-auto transition-colors hover:opacity-70"
            style={{ color: '#C4785A' }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Assessment
          </button>
        </motion.div>

        {/* Overall Health Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'white',
            border: '1px solid #E8E2DA'
          }}
        >
          <div
            className="p-8 text-white"
            style={{ backgroundColor: statusIndicator.bgColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {statusIndicator.icon}
                  <div>
                    <h2
                      className="text-2xl font-medium"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      Journey Health
                    </h2>
                    <p className="text-white/90">{statusIndicator.label}</p>
                  </div>
                </div>
                <p className="text-lg leading-relaxed text-white/95">
                  {assessment.overallHealth?.summary}
                </p>
              </div>
              <div className="text-center ml-8">
                <div
                  className="text-6xl font-bold mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {assessment.overallHealth?.score || 0}
                </div>
                <p className="text-white/90 text-sm">Health Score</p>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          {assessment.metrics && (
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6"
              style={{ backgroundColor: '#FDFBF8' }}
            >
              <div className="text-center">
                <Target className="w-6 h-6 mx-auto mb-2" style={{ color: '#C4785A' }} />
                <p
                  className="text-2xl font-bold"
                  style={{ color: '#2D2926' }}
                >
                  {assessment.metrics.totalMilestones}
                </p>
                <p className="text-sm" style={{ color: '#6b635b' }}>Milestones</p>
              </div>
              <div className="text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2" style={{ color: '#7d8c75' }} />
                <p
                  className="text-2xl font-bold"
                  style={{ color: '#2D2926' }}
                >
                  {assessment.metrics.completionRate?.milestones?.toFixed(0) || 0}%
                </p>
                <p className="text-sm" style={{ color: '#6b635b' }}>Complete</p>
              </div>
              <div className="text-center">
                <Activity className="w-6 h-6 mx-auto mb-2" style={{ color: '#c49a6c' }} />
                <p
                  className="text-2xl font-bold"
                  style={{ color: '#2D2926' }}
                >
                  {assessment.metrics.totalTasks}
                </p>
                <p className="text-sm" style={{ color: '#6b635b' }}>Tasks</p>
              </div>
              <div className="text-center">
                <Zap className="w-6 h-6 mx-auto mb-2" style={{ color: '#C4785A' }} />
                <p
                  className="text-2xl font-bold"
                  style={{ color: '#2D2926' }}
                >
                  {assessment.metrics.momentumScore || 0}
                </p>
                <p className="text-sm" style={{ color: '#6b635b' }}>Momentum</p>
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
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA'
            }}
          >
            <button
              onClick={() => toggleSection('insights')}
              className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-opacity-70"
              style={{ backgroundColor: 'transparent' }}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" style={{ color: '#C4785A' }} />
                <h3
                  className="text-xl font-medium"
                  style={{
                    color: '#2D2926',
                    fontFamily: "'Cormorant Garamond', serif"
                  }}
                >
                  Key Insights
                </h3>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: 'rgba(196, 120, 90, 0.12)',
                    color: '#C4785A'
                  }}
                >
                  {assessment.keyInsights.length}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${expandedSections.insights ? 'rotate-180' : ''}`}
                style={{ color: '#6b635b' }}
              />
            </button>

            <AnimatePresence>
              {expandedSections.insights && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid #E8E2DA' }}
                >
                  <div className="p-6 space-y-4">
                    {assessment.keyInsights.map((insight, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex gap-4 p-4 rounded-lg transition-all hover:-translate-y-0.5"
                        style={{
                          border: '1px solid #E8E2DA',
                          backgroundColor: '#FDFBF8'
                        }}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4
                              className="font-semibold"
                              style={{ color: '#2D2926' }}
                            >
                              {insight.title}
                            </h4>
                            {insight.impact && (
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor:
                                    insight.impact === 'high' ? 'rgba(199, 107, 107, 0.12)' :
                                    insight.impact === 'medium' ? 'rgba(196, 154, 108, 0.12)' :
                                    'rgba(125, 140, 117, 0.12)',
                                  color:
                                    insight.impact === 'high' ? '#c76b6b' :
                                    insight.impact === 'medium' ? '#a88352' :
                                    '#7d8c75'
                                }}
                              >
                                {insight.impact} impact
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: '#6b635b' }}>
                            {insight.description}
                          </p>
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
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA'
            }}
          >
            <button
              onClick={() => toggleSection('recommendations')}
              className="w-full px-6 py-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <Flag className="w-6 h-6" style={{ color: '#C4785A' }} />
                <h3
                  className="text-xl font-medium"
                  style={{
                    color: '#2D2926',
                    fontFamily: "'Cormorant Garamond', serif"
                  }}
                >
                  Recommended Actions
                </h3>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: 'rgba(196, 120, 90, 0.12)',
                    color: '#C4785A'
                  }}
                >
                  {assessment.recommendations.length}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${expandedSections.recommendations ? 'rotate-180' : ''}`}
                style={{ color: '#6b635b' }}
              />
            </button>

            <AnimatePresence>
              {expandedSections.recommendations && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid #E8E2DA' }}
                >
                  <div className="p-6 space-y-4">
                    {assessment.recommendations.map((rec, idx) => {
                      const priorityStyle = getPriorityColor(rec.priority);
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 rounded-lg"
                          style={{
                            backgroundColor: priorityStyle.bg,
                            border: `2px solid ${priorityStyle.border}`
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <ArrowRight
                              className="w-5 h-5 flex-shrink-0 mt-0.5"
                              style={{ color: priorityStyle.text }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4
                                  className="font-semibold"
                                  style={{ color: priorityStyle.text }}
                                >
                                  {rec.action}
                                </h4>
                                {rec.assignedTo && rec.assignedTo !== 'both' && (
                                  <span
                                    className="text-xs px-2 py-1 rounded flex items-center gap-1"
                                    style={{
                                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                      color: priorityStyle.text
                                    }}
                                  >
                                    <Users className="w-3 h-3" />
                                    {rec.assignedTo}
                                  </span>
                                )}
                                {rec.timeframe && (
                                  <span
                                    className="text-xs px-2 py-1 rounded flex items-center gap-1"
                                    style={{
                                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                      color: priorityStyle.text
                                    }}
                                  >
                                    <Clock className="w-3 h-3" />
                                    {rec.timeframe.replace('-', ' ')}
                                  </span>
                                )}
                              </div>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: priorityStyle.text, opacity: 0.9 }}
                              >
                                {rec.reason}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
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
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA'
            }}
          >
            <button
              onClick={() => toggleSection('financial')}
              className="w-full px-6 py-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6" style={{ color: '#7d8c75' }} />
                <h3
                  className="text-xl font-medium"
                  style={{
                    color: '#2D2926',
                    fontFamily: "'Cormorant Garamond', serif"
                  }}
                >
                  Financial Health
                </h3>
                <span className="text-sm" style={{ color: '#6b635b' }}>
                  Score: {assessment.financialHealth.score}/100
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${expandedSections.financial ? 'rotate-180' : ''}`}
                style={{ color: '#6b635b' }}
              />
            </button>

            <AnimatePresence>
              {expandedSections.financial && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid #E8E2DA' }}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium" style={{ color: '#2D2926' }}>
                        Budget Status:
                      </span>
                      <span
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            assessment.financialHealth.budgetStatus === 'under-budget' ? 'rgba(125, 140, 117, 0.12)' :
                            assessment.financialHealth.budgetStatus === 'on-budget' ? 'rgba(196, 154, 108, 0.12)' :
                            assessment.financialHealth.budgetStatus === 'over-budget' ? 'rgba(199, 107, 107, 0.12)' :
                            'rgba(107, 99, 91, 0.12)',
                          color:
                            assessment.financialHealth.budgetStatus === 'under-budget' ? '#7d8c75' :
                            assessment.financialHealth.budgetStatus === 'on-budget' ? '#c49a6c' :
                            assessment.financialHealth.budgetStatus === 'over-budget' ? '#c76b6b' :
                            '#6b635b'
                        }}
                      >
                        {assessment.financialHealth.budgetStatus?.replace('-', ' ')}
                      </span>
                    </div>

                    {assessment.financialHealth.insights && assessment.financialHealth.insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2" style={{ color: '#2D2926' }}>
                          Key Financial Insights
                        </h4>
                        <ul className="space-y-2">
                          {assessment.financialHealth.insights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#6b635b' }}>
                              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#7d8c75' }} />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {assessment.financialHealth.alerts && assessment.financialHealth.alerts.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2" style={{ color: '#2D2926' }}>
                          Financial Alerts
                        </h4>
                        <ul className="space-y-2">
                          {assessment.financialHealth.alerts.map((alert, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#c76b6b' }}>
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C4785A' }} />
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
        {assessment.timeline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA'
            }}
          >
            <button
              onClick={() => toggleSection('timeline')}
              className="w-full px-6 py-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6" style={{ color: '#c49a6c' }} />
                <h3
                  className="text-xl font-medium"
                  style={{
                    color: '#2D2926',
                    fontFamily: "'Cormorant Garamond', serif"
                  }}
                >
                  Timeline Analysis
                </h3>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${expandedSections.timeline ? 'rotate-180' : ''}`}
                style={{ color: '#6b635b' }}
              />
            </button>

            <AnimatePresence>
              {expandedSections.timeline && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid #E8E2DA' }}
                >
                  <div className="p-6">
                    <p className="text-sm leading-relaxed" style={{ color: '#6b635b' }}>
                      {assessment.timeline.summary}
                    </p>
                    {assessment.timeline.risks && assessment.timeline.risks.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2" style={{ color: '#2D2926' }}>
                          Timeline Risks
                        </h4>
                        <ul className="space-y-2">
                          {assessment.timeline.risks.map((risk, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#c76b6b' }}>
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C4785A' }} />
                              {risk}
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
        {assessment.balance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA'
            }}
          >
            <button
              onClick={() => toggleSection('balance')}
              className="w-full px-6 py-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6" style={{ color: '#C4785A' }} />
                <h3
                  className="text-xl font-medium"
                  style={{
                    color: '#2D2926',
                    fontFamily: "'Cormorant Garamond', serif"
                  }}
                >
                  Collaboration Balance
                </h3>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${expandedSections.balance ? 'rotate-180' : ''}`}
                style={{ color: '#6b635b' }}
              />
            </button>

            <AnimatePresence>
              {expandedSections.balance && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid #E8E2DA' }}
                >
                  <div className="p-6">
                    <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b635b' }}>
                      {assessment.balance.summary}
                    </p>
                    {assessment.balance.recommendations && assessment.balance.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2" style={{ color: '#2D2926' }}>
                          Balance Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {assessment.balance.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#6b635b' }}>
                              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#7d8c75' }} />
                              {rec}
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
        {assessment.celebrations && assessment.celebrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl p-6"
            style={{
              backgroundColor: 'rgba(196, 120, 90, 0.08)',
              border: '1px solid rgba(196, 120, 90, 0.2)'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6" style={{ color: '#C4785A' }} />
              <h3
                className="text-xl font-medium"
                style={{
                  color: '#2D2926',
                  fontFamily: "'Cormorant Garamond', serif"
                }}
              >
                Celebration Moments
              </h3>
            </div>
            <div className="space-y-2">
              {assessment.celebrations.map((celebration, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: '#6b635b' }}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C4785A' }} />
                  {celebration}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LunaAssessment;
