import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Zap, Target, CheckCircle, ArrowRight, MessageCircle } from 'lucide-react';
import BackButton from './BackButton';

const CompatibilityTransition = ({ compatibilityData, onPathSelected, onBack = null }) => {
  const { alignmentScore, categoryScores, partner1Name, partner2Name } = compatibilityData;

  // Generate recommended goals based on compatibility
  const generateRecommendedGoals = () => {
    const goals = [];

    // High alignment recommendations
    if (alignmentScore >= 75) {
      if (categoryScores.timeline >= 75) {
        goals.push({
          id: 'marry',
          title: 'Plan Dream Wedding',
          icon: '💒',
          reason: 'You\'re both aligned on timeline!',
          category: 'relationship',
          priority: 'high'
        });
      }
      if (categoryScores.financial >= 75) {
        goals.push({
          id: 'home',
          title: 'Buy Your First Home',
          icon: '🏠',
          reason: 'Financial sync (92%) makes this achievable',
          category: 'home',
          priority: 'high'
        });
        goals.push({
          id: 'savings',
          title: 'Build Emergency Fund',
          icon: '💰',
          reason: 'You both are savers - perfect!',
          category: 'financial',
          priority: 'high'
        });
      }
      if (categoryScores.lifestyle >= 75) {
        goals.push({
          id: 'vacation',
          title: 'Dream Vacation Together',
          icon: '✈️',
          reason: 'Lifestyle match - great for planning travel',
          category: 'lifestyle',
          priority: 'medium'
        });
      }
      if (categoryScores.timeline >= 75 && categoryScores.parenting >= 75) {
        goals.push({
          id: 'family',
          title: 'Start a Family',
          icon: '👶',
          reason: 'Aligned on family timeline',
          category: 'family',
          priority: 'medium'
        });
      }
    }

    // Medium alignment recommendations
    if (alignmentScore >= 50 && alignmentScore < 75) {
      // Add relationship-building goals
      if (categoryScores.communication < 75) {
        goals.push({
          id: 'communication-workshop',
          title: 'Communication Workshop',
          icon: '💬',
          reason: 'Build skills for navigating differences',
          category: 'relationship',
          priority: 'high',
          isRecommended: true
        });
      }
      if (categoryScores.financial < 75) {
        goals.push({
          id: 'financial-planning',
          title: 'Financial Planning Session',
          icon: '💰',
          reason: 'Align on money management (you differ here)',
          category: 'financial',
          priority: 'high',
          isRecommended: true
        });
      }

      // Add lighter goals
      goals.push({
        id: 'vacation',
        title: 'Weekend Getaway',
        icon: '✈️',
        reason: 'Reconnect and relax together',
        category: 'lifestyle',
        priority: 'medium'
      });
      goals.push({
        id: 'hobby',
        title: 'Learn Something Together',
        icon: '📚',
        reason: 'Shared experiences build connection',
        category: 'lifestyle',
        priority: 'medium'
      });
    }

    // Low alignment recommendations
    if (alignmentScore < 50) {
      goals.push({
        id: 'counseling',
        title: 'Couples Counseling',
        icon: '👥',
        reason: 'Professional guidance for major differences',
        category: 'relationship',
        priority: 'high',
        isRecommended: true
      });
      goals.push({
        id: 'communication-workshop',
        title: 'Communication Workshop',
        icon: '💬',
        reason: 'Learn to navigate your differences',
        category: 'relationship',
        priority: 'high',
        isRecommended: true
      });
      goals.push({
        id: 'retreat',
        title: 'Weekend Retreat Together',
        icon: '🎊',
        reason: 'Dedicated time to discuss your future',
        category: 'relationship',
        priority: 'medium'
      });
      goals.push({
        id: 'date-nights',
        title: 'Weekly Date Nights',
        icon: '🍽️',
        reason: 'Rebuild connection and intimacy',
        category: 'lifestyle',
        priority: 'medium'
      });
    }

    return goals.slice(0, 6); // Return top 6 recommendations
  };

  const recommendedGoals = generateRecommendedGoals();
  const [selectedGoals, setSelectedGoals] = useState(
    recommendedGoals
      .filter(g => g.isRecommended || g.priority === 'high')
      .map(g => g.id)
  );

  const toggleGoal = (goalId) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  // Get status styling
  const getStatusStyle = () => {
    if (alignmentScore >= 75) {
      return {
        color: 'green',
        gradient: 'from-green-500 to-emerald-500',
        bgGradient: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-300',
        emoji: '🎉'
      };
    } else if (alignmentScore >= 50) {
      return {
        color: 'yellow',
        gradient: 'from-yellow-500 to-amber-500',
        bgGradient: 'from-yellow-50 to-amber-50',
        borderColor: 'border-yellow-300',
        emoji: '💡'
      };
    } else {
      return {
        color: 'orange',
        gradient: 'from-orange-500 to-red-500',
        bgGradient: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-300',
        emoji: '🤝'
      };
    }
  };

  const status = getStatusStyle();

  // Get title based on score
  const getTitle = () => {
    if (alignmentScore >= 75) return "Incredible! You're Ready to Build!";
    if (alignmentScore >= 50) return "Strong Start! Let's Build Your Foundation";
    return "We're Here to Support You";
  };

  // Get subtitle
  const getSubtitle = () => {
    if (alignmentScore >= 75) {
      return `With ${alignmentScore}% alignment, you have an excellent foundation for planning major life goals.`;
    } else if (alignmentScore >= 50) {
      return `You have ${alignmentScore}% alignment - a solid base! Let's strengthen it before big milestones.`;
    } else {
      return `${alignmentScore}% alignment means you need intentional work together. Many couples thrive here! 💙`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 py-12 relative">
      {/* Back Button */}
      {onBack && (
        <div className="absolute top-4 left-4 z-50">
          <BackButton onClick={onBack} label="Back" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${status.bgGradient} border-2 ${status.borderColor} rounded-3xl p-8 mb-6`}>
          <div className="text-center">
            <div className="text-6xl mb-4">{status.emoji}</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              {getTitle()}
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {alignmentScore}%
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-600">Alignment Score</div>
                <div className="text-xs text-gray-500">{partner1Name} & {partner2Name}</div>
              </div>
            </div>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              {getSubtitle()}
            </p>
          </div>

          {/* Top Category Scores */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {Object.entries(categoryScores)
              .sort(([_, a], [__, b]) => b - a)
              .slice(0, 4)
              .map(([category, score]) => {
                const categoryLabels = {
                  timeline: 'Timeline',
                  financial: 'Financial',
                  lifestyle: 'Lifestyle',
                  communication: 'Communication',
                  values: 'Values',
                  family: 'Family',
                  career: 'Career'
                };
                const scoreColor = score >= 75 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
                return (
                  <div key={category} className={`px-3 py-1 rounded-full text-sm font-semibold ${scoreColor}`}>
                    {categoryLabels[category]}: {score}%
                  </div>
                );
              })}
          </div>
        </div>

        {/* Recommended Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {alignmentScore >= 75 ? 'Based on your strong alignment, we recommend:' :
             alignmentScore >= 50 ? 'Recommended goals for your journey:' :
             'Recommended first steps:'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {recommendedGoals.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);
              return (
                <motion.div
                  key={goal.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">{goal.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-800">{goal.title}</h3>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-snug">{goal.reason}</p>
                      {goal.isRecommended && (
                        <div className="mt-2 inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                          Recommended
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center text-sm text-gray-500">
            {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected • Click to select/deselect
          </div>
        </motion.div>

        {/* Action Paths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            💬 How would you like to create your roadmaps?
          </h2>

          <div className="space-y-4">
            {/* Path 1: Luna */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                alignmentScore >= 75 ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
              }`}
              onClick={() => onPathSelected('luna', selectedGoals)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">Get Luna's Help</h3>
                    {alignmentScore >= 75 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">
                    Luna knows your compatibility ({alignmentScore}%) and will help you create detailed, personalized roadmaps.
                    She'll ask about your budget, timeline, and priorities.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>⏱️ ~5 minute conversation</span>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-purple-500 flex-shrink-0 mt-2" />
              </div>
            </motion.div>

            {/* Path 2: Instant */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="border-2 border-gray-200 bg-white rounded-2xl p-6 cursor-pointer hover:border-gray-300 transition-all"
              onClick={() => onPathSelected('instant', selectedGoals)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Create Instantly</h3>
                  <p className="text-gray-600 mb-3">
                    Skip the chat - we'll create roadmaps for your selected goals right now with smart defaults.
                    You can customize everything later.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>⏱️ Instant</span>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-blue-500 flex-shrink-0 mt-2" />
              </div>
            </motion.div>

            {/* Path 3: Explore */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="border-2 border-gray-200 bg-white rounded-2xl p-6 cursor-pointer hover:border-gray-300 transition-all"
              onClick={() => onPathSelected('explore', selectedGoals)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Explore More Options</h3>
                  <p className="text-gray-600 mb-3">
                    Browse our full goal template library, create custom goals, or change your selections.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>⏱️ Your pace</span>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-pink-500 flex-shrink-0 mt-2" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CompatibilityTransition;
