import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, X, Sparkles, AlertTriangle, CheckCircle2,
  Plus, Grid3x3, Wand2, TrendingUp, DollarSign, Calendar
} from 'lucide-react';
import GoalOrchestrator from '../services/goalOrchestrator';
import TemplateGallery from './TemplateGallery';
import CustomGoalCreator from './CustomGoalCreator';
import IntelligencePanel from './IntelligencePanel';

/**
 * GoalBuilder: Unified interface for building multi-goal roadmaps
 *
 * Features:
 * - Add templates and custom goals in one place
 * - See conflicts and synergies in real-time
 * - Get smart suggestions
 * - Auto-saves progress
 */
const GoalBuilder = ({ onBack, onComplete, onEnhanceWithLuna, user, locationData }) => {
  const [orchestrator] = useState(() => new GoalOrchestrator(user, locationData));
  const [goals, setGoals] = useState(orchestrator.getGoals());
  const [stats, setStats] = useState(orchestrator.getStats());
  const [suggestions, setSuggestions] = useState(orchestrator.generateSuggestions());

  // UI state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCustomCreator, setShowCustomCreator] = useState(false);

  // Subscribe to orchestrator changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((state) => {
      setGoals(state.goals);
      setStats(state.stats);
      setSuggestions(state.suggestions);
    });

    return unsubscribe;
  }, [orchestrator]);

  // Handlers
  const handleAddTemplate = (template) => {
    const result = orchestrator.addGoal(template);
    if (!result.success) {
      alert(result.error);
    }
    setShowTemplates(false);
  };

  const handleAddCustomGoal = (customGoal) => {
    const result = orchestrator.addGoal(customGoal);
    if (!result.success) {
      alert(result.error);
    }
    setShowCustomCreator(false);
  };

  const handleRemoveGoal = (goalId) => {
    orchestrator.removeGoal(goalId);
  };

  const handleCreateRoadmap = () => {
    const result = orchestrator.createRoadmap();
    if (result.success) {
      onComplete(result.roadmap);
    } else {
      alert(result.error || 'Failed to create roadmap');
    }
  };

  const handleEnhanceWithLuna = () => {
    // Pass orchestrator to Luna optimization
    // Luna will use orchestrator to get all goal intelligence
    onEnhanceWithLuna({
      orchestrator: orchestrator
    });
  };

  // Show template gallery
  if (showTemplates) {
    return (
      <TemplateGallery
        onBack={() => setShowTemplates(false)}
        onComplete={(selectedTemplates) => {
          selectedTemplates.forEach(template => handleAddTemplate(template));
          setShowTemplates(false);
        }}
      />
    );
  }

  // Show custom goal creator
  if (showCustomCreator) {
    return (
      <CustomGoalCreator
        onBack={() => setShowCustomCreator(false)}
        onComplete={handleAddCustomGoal}
      />
    );
  }

  // Main goal builder interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-3">
                Build Your Roadmap 🎯
              </h1>
              <p className="text-lg text-gray-600">
                Add your goals, and we'll help you create an intelligent plan
              </p>
            </div>

            {goals.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Total Investment</div>
                <div className="text-3xl font-bold text-gray-800">
                  €{stats.totalBudget.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Goals List */}
        {goals.length > 0 && (
          <div className="mb-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">
              Your Goals ({goals.length})
            </h2>

            <AnimatePresence>
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
                >
                  {/* Goal Header */}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-16 h-16 ${goal.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <span className="text-3xl">{goal.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                              {goal.title}
                              {goal.source === 'custom' && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                  Custom
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">{goal.description}</p>
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => handleRemoveGoal(goal.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            €{goal.estimatedCost.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {goal.duration}
                          </div>
                          <div className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                            {goal.category}
                          </div>
                        </div>

                        {/* AI Analysis */}
                        {goal.aiAnalysis && (
                          <div className="space-y-2">
                            {/* Conflicts */}
                            {goal.aiAnalysis.conflicts?.length > 0 && (
                              <div className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div className="text-amber-700">
                                  {goal.aiAnalysis.conflicts[0].message}
                                </div>
                              </div>
                            )}

                            {/* Synergies */}
                            {goal.aiAnalysis.synergies?.length > 0 && (
                              <div className="flex items-start gap-2 text-sm">
                                <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <div className="text-emerald-700">
                                  {goal.aiAnalysis.synergies[0].message}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Intelligence Panel (Phase 2) */}
        {goals.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <IntelligencePanel stats={stats} />
          </motion.div>
        )}

        {/* Add Goal Section */}
        <div className="mb-6">
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Add {goals.length > 0 ? 'Another' : 'Your First'} Goal
              </h3>
              <p className="text-gray-600">
                Choose from templates or create your own custom goal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Browse Templates */}
              <button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Grid3x3 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                    Browse Templates
                  </div>
                  <div className="text-sm text-gray-600">
                    12 popular goals ready to use
                  </div>
                </div>
              </button>

              {/* Create Custom */}
              <button
                onClick={() => setShowCustomCreator(true)}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                    Create Custom Goal
                  </div>
                  <div className="text-sm text-gray-600">
                    Build something unique
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              💡 Smart Suggestions
            </h3>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl p-4 border-2 ${
                    suggestion.priority === 'high'
                      ? 'border-purple-200 bg-purple-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{suggestion.icon}</div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 mb-1">
                        {suggestion.title}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {suggestion.description}
                      </div>
                      {suggestion.action === 'enhanceWithLuna' && (
                        <button
                          onClick={handleEnhanceWithLuna}
                          className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          Get Luna's Help
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          {goals.length > 0 && (
            <>
              <button
                onClick={handleCreateRoadmap}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Create Roadmap ({goals.length} {goals.length === 1 ? 'goal' : 'goals'})
              </button>

              {goals.length >= 2 && (
                <button
                  onClick={handleEnhanceWithLuna}
                  className="px-6 py-4 bg-white border-2 border-purple-300 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  Optimize with Luna
                </button>
              )}
            </>
          )}
        </div>

        {/* Empty State */}
        {goals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">Start by adding your first goal above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalBuilder;
