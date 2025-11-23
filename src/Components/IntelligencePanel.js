import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, AlertTriangle, CheckCircle2, Info,
  ChevronDown, ChevronUp, DollarSign, Calendar, Network,
  Shield, Zap, Target
} from 'lucide-react';

/**
 * IntelligencePanel: Visualizes advanced goal analysis
 *
 * Displays:
 * - Budget analysis and optimization
 * - Timeline visualization
 * - Dependency graph
 * - Risk analysis
 * - Smart recommendations
 */
const IntelligencePanel = ({ stats }) => {
  const [expandedSection, setExpandedSection] = useState('overview');

  if (!stats || stats.totalGoals === 0) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Risk level colors
  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high': return AlertTriangle;
      case 'medium': return Info;
      case 'low': return CheckCircle2;
      default: return Shield;
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Intelligence Summary */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">Intelligence Analysis</h3>
            <p className="text-sm opacity-90">Advanced insights for your roadmap</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs opacity-75 mb-1">Total Budget</div>
            <div className="text-2xl font-bold">€{stats.totalBudget.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs opacity-75 mb-1">Timeline</div>
            <div className="text-2xl font-bold">
              {Math.round(stats.metrics?.maxEndMonth / 12) || 0}y
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs opacity-75 mb-1">Dependencies</div>
            <div className="text-2xl font-bold">{stats.metrics?.totalDependencies || 0}</div>
          </div>
          <div className={`rounded-lg p-3 ${
            stats.metrics?.riskLevel === 'high' ? 'bg-red-500' :
            stats.metrics?.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
          }`}>
            <div className="text-xs opacity-75 mb-1">Risk Level</div>
            <div className="text-2xl font-bold capitalize">{stats.metrics?.riskLevel || 'low'}</div>
          </div>
        </div>
      </div>

      {/* Budget Analysis */}
      {stats.budgetAnalysis && (
        <CollapsibleSection
          title="Budget Analysis"
          icon={DollarSign}
          isExpanded={expandedSection === 'budget'}
          onToggle={() => toggleSection('budget')}
          badge={stats.budgetAnalysis.issues.length}
          badgeColor={stats.budgetAnalysis.issues.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}
        >
          <div className="space-y-4">
            {/* Budget Distribution */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Budget Distribution</h4>
              <div className="space-y-2">
                {stats.budgetAnalysis.goalsWithMetrics?.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.goal.title}</span>
                        <span className="text-gray-600">
                          €{item.cost.toLocaleString()} ({Math.round(item.percentage)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Issues */}
            {stats.budgetAnalysis.issues.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Issues & Recommendations</h4>
                <div className="space-y-2">
                  {stats.budgetAnalysis.issues.map((issue, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-amber-900 text-sm">{issue.message}</div>
                        <div className="text-xs text-amber-700 mt-1">{issue.recommendation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Optimizations */}
            {stats.budgetAnalysis.recommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Optimization Suggestions</h4>
                <div className="space-y-2">
                  {stats.budgetAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-purple-900 text-sm">{rec.message}</div>
                        {rec.actions && (
                          <ul className="text-xs text-purple-700 mt-2 space-y-1">
                            {rec.actions.map((action, i) => (
                              <li key={i}>• {action}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Timeline Visualization */}
      {stats.timeline && stats.timeline.length > 0 && (
        <CollapsibleSection
          title="Timeline Planning"
          icon={Calendar}
          isExpanded={expandedSection === 'timeline'}
          onToggle={() => toggleSection('timeline')}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Recommended timeline based on dependencies and goal priorities
            </p>

            {/* Timeline bars */}
            <div className="space-y-3">
              {stats.timeline.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.goal.title}</span>
                    <span className="text-gray-500">
                      Month {item.startMonth} - {Math.round(item.endMonth)}
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center px-2"
                      style={{
                        left: `${(item.startMonth / stats.metrics.maxEndMonth) * 100}%`,
                        width: `${(item.duration / stats.metrics.maxEndMonth) * 100}%`
                      }}
                    >
                      <span className="text-xs text-white font-medium">
                        {Math.round(item.duration)}mo
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Dependency Graph */}
      {stats.dependencyGraph && stats.dependencyGraph.edges.length > 0 && (
        <CollapsibleSection
          title="Goal Dependencies"
          icon={Network}
          isExpanded={expandedSection === 'dependencies'}
          onToggle={() => toggleSection('dependencies')}
          badge={stats.dependencyGraph.edges.length}
          badgeColor="bg-blue-500"
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Some goals depend on others. Here's the recommended sequence:
            </p>

            {stats.dependencyGraph.edges.map((edge, index) => {
              const fromGoal = stats.dependencyGraph.nodes.find(n => n.id === edge.from);
              const toGoal = stats.dependencyGraph.nodes.find(n => n.id === edge.to);

              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-blue-900">
                      {fromGoal?.title} → {toGoal?.title}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">{edge.reason}</div>
                  </div>
                  <div className="px-2 py-1 bg-blue-100 rounded text-xs font-medium text-blue-700">
                    {edge.strength}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Risk Analysis */}
      {stats.risks && stats.risks.length > 0 && (
        <CollapsibleSection
          title="Risk Analysis"
          icon={Shield}
          isExpanded={expandedSection === 'risks'}
          onToggle={() => toggleSection('risks')}
          badge={stats.risks.length}
          badgeColor={`bg-${stats.metrics?.riskLevel === 'high' ? 'red' : stats.metrics?.riskLevel === 'medium' ? 'amber' : 'emerald'}-500`}
        >
          <div className="space-y-3">
            {stats.risks.map((risk, index) => {
              const RiskIcon = getRiskIcon(risk.severity);

              return (
                <div key={index} className={`p-4 border-2 rounded-xl ${getRiskColor(risk.severity)}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <RiskIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-bold text-sm mb-1">{risk.title}</h5>
                      <p className="text-sm">{risk.message}</p>
                    </div>
                  </div>

                  {risk.mitigation && (
                    <div className="mt-3 pl-9">
                      <div className="text-xs font-semibold mb-2">Mitigation Strategies:</div>
                      <ul className="text-xs space-y-1">
                        {risk.mitigation.map((strategy, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-current">•</span>
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Optimal Goal Order */}
      {stats.optimalOrder && stats.optimalOrder.length > 1 && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-emerald-900">Recommended Goal Sequence</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.optimalOrder.map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-white border-2 border-emerald-300 rounded-lg text-sm font-medium text-emerald-900">
                  {index + 1}. {goal.title}
                </div>
                {index < stats.optimalOrder.length - 1 && (
                  <span className="text-emerald-400">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, isExpanded, onToggle, badge, badgeColor = 'bg-purple-500' }) => {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-700" />
          <span className="font-bold text-gray-800">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className={`${badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200"
          >
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntelligencePanel;
