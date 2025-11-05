import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowRight, Download, AlertTriangle, CheckCircle, TrendingUp, MessageCircle } from 'lucide-react';

const CompatibilityResults = ({ compatibilityData, onContinue, onDownloadGuide }) => {
  const {
    alignmentScore,
    categoryScores,
    misalignments,
    strongAlignments,
    partner1Name,
    partner2Name
  } = compatibilityData;

  // Determine overall status
  const getStatus = () => {
    if (alignmentScore >= 75) return {
      level: 'high',
      emoji: '🎉',
      title: 'Strong Foundation!',
      color: 'green',
      message: 'You have excellent alignment! You\'re ready to start planning your future together.'
    };
    if (alignmentScore >= 50) return {
      level: 'medium',
      emoji: '💡',
      title: 'Good Start with Some Areas to Discuss',
      color: 'yellow',
      message: 'You have solid alignment, but there are a few areas worth discussing before major commitments.'
    };
    return {
      level: 'low',
      emoji: '🤔',
      title: 'Important Differences to Address',
      color: 'red',
      message: 'You have some significant differences. We recommend working through these before major life decisions.'
    };
  };

  const status = getStatus();

  // Get category label
  const getCategoryLabel = (category) => {
    const labels = {
      timeline: '📅 Timeline & Milestones',
      financial: '💰 Financial Philosophy',
      lifestyle: '🏡 Lifestyle Preferences',
      communication: '💬 Communication Style'
    };
    return labels[category] || category;
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Overall Score Card */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center mb-6"
        >
          <div className="text-6xl mb-4">{status.emoji}</div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {status.title}
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            {partner1Name} & {partner2Name}'s Vision Alignment
          </p>

          {/* Big Score Circle */}
          <div className="relative inline-block mb-6">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#E5E7EB"
                strokeWidth="12"
                fill="none"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - alignmentScore / 100) }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {alignmentScore}%
                </div>
                <div className="text-sm text-gray-500 font-medium">Aligned</div>
              </div>
            </div>
          </div>

          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            {status.message}
          </p>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            Category Breakdown
          </h2>

          <div className="space-y-4">
            {Object.entries(categoryScores).map(([category, score]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700">
                      {getCategoryLabel(category)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${
                        score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Strong Alignments */}
        {strongAlignments && strongAlignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Where You Align
            </h2>

            <div className="space-y-4">
              {strongAlignments.map((alignment, index) => (
                <div key={index} className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">{alignment.question}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Both answered: <strong>{alignment.answer}</strong>
                      </p>
                      <p className="text-sm text-green-700">{alignment.insight}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Misalignments */}
        {misalignments && misalignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-xl p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-yellow-500" />
              Areas for Discussion
            </h2>

            <div className="space-y-4">
              {misalignments.map((misalignment, index) => (
                <div key={index} className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-2">{misalignment.question}</h3>

                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                        <div className="bg-purple-100 rounded-lg p-3">
                          <span className="text-xs font-semibold text-purple-700 uppercase">
                            {partner1Name}
                          </span>
                          <p className="text-sm text-gray-800 mt-1">{misalignment.partner1Answer}</p>
                        </div>
                        <div className="bg-pink-100 rounded-lg p-3">
                          <span className="text-xs font-semibold text-pink-700 uppercase">
                            {partner2Name}
                          </span>
                          <p className="text-sm text-gray-800 mt-1">{misalignment.partner2Answer}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-yellow-300">
                        <p className="text-sm text-gray-700">
                          <strong>💡 Discussion starter:</strong> {misalignment.discussionPrompt}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Your Personalized Next Steps
          </h2>

          {/* HIGH ALIGNMENT (75%+) - Celebration & Direct Action */}
          {alignmentScore >= 75 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-4">
                <h3 className="font-bold text-green-800 text-lg mb-2 flex items-center gap-2">
                  🎉 You're Ready to Plan Together!
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  With {alignmentScore}% alignment, you have an excellent foundation for planning major life goals. Your strong compatibility across key areas means you can confidently move forward with milestone planning.
                </p>
              </div>

              <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                <p className="font-semibold text-gray-800 mb-3">🎯 Recommended Starting Points:</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  {categoryScores.timeline >= 75 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span><strong>Timeline aligned:</strong> Consider planning wedding or home purchase goals</span>
                    </li>
                  )}
                  {categoryScores.financial >= 75 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span><strong>Financial sync:</strong> Perfect for setting joint savings and investment goals</span>
                    </li>
                  )}
                  {categoryScores.lifestyle >= 75 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span><strong>Lifestyle match:</strong> Great foundation for planning travel or relocation goals</span>
                    </li>
                  )}
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onContinue}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Heart className="w-6 h-6" fill="currentColor" />
                Start Planning Your Goals Together
                <ArrowRight className="w-6 h-6" />
              </motion.button>

              {misalignments.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDownloadGuide}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-3 border-2 border-gray-300"
                >
                  <Download className="w-5 h-5" />
                  Download Discussion Guide (Optional)
                </motion.button>
              )}
            </div>
          )}

          {/* MEDIUM ALIGNMENT (50-74%) - Discussion Plan + Relationship Goals */}
          {alignmentScore >= 50 && alignmentScore < 75 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6 mb-4">
                <h3 className="font-bold text-yellow-800 text-lg mb-2 flex items-center gap-2">
                  💡 Strong Foundation with Areas to Explore
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  You have {alignmentScore}% alignment - a solid base! Before major commitments, we recommend having thoughtful conversations about the areas where you differ.
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  📋 Your Action Plan:
                </p>
              </div>

              <div className="bg-white border-2 border-yellow-200 rounded-xl p-6">
                <p className="font-semibold text-gray-800 mb-3">🗣️ Priority Discussions (Complete These First):</p>
                <div className="space-y-3 text-sm">
                  {Object.entries(categoryScores)
                    .filter(([_, score]) => score < 75)
                    .sort(([_, a], [__, b]) => a - b)
                    .map(([category, score]) => {
                      const categoryLabels = {
                        timeline: 'Timeline & Milestones',
                        financial: 'Financial Philosophy',
                        lifestyle: 'Lifestyle Preferences',
                        communication: 'Communication Style',
                        values: 'Core Values',
                        family: 'Family Dynamics',
                        career: 'Career Priorities',
                        parenting: 'Parenting Philosophy',
                        future: 'Long-term Vision'
                      };
                      return (
                        <div key={category} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-800">{categoryLabels[category]}</span>
                            <span className="text-xs text-yellow-700 font-bold">{score}% aligned</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {score < 50
                              ? '⚠️ High priority - schedule dedicated conversation'
                              : '💬 Moderate priority - discuss when planning related goals'}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                <p className="font-semibold text-gray-800 mb-2">💡 Recommended First Goals:</p>
                <p className="text-sm text-gray-700 mb-3">
                  Consider starting with relationship-strengthening goals before major life milestones:
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">→</span>
                    <span><strong>Couples Communication Workshop:</strong> Build skills for navigating differences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">→</span>
                    <span><strong>Weekend Retreat Together:</strong> Dedicated time to discuss your future</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">→</span>
                    <span><strong>Financial Planning Session:</strong> Align on money management together</span>
                  </li>
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDownloadGuide}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-6 h-6" />
                Download Your Discussion Guide
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onContinue}
                className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 border-2 border-purple-300"
              >
                <Heart className="w-5 h-5" />
                Explore Relationship-Building Goals
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          )}

          {/* LOW ALIGNMENT (<50%) - Support & Resources */}
          {alignmentScore < 50 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6 mb-4">
                <h3 className="font-bold text-orange-800 text-lg mb-2 flex items-center gap-2">
                  🤝 Important Differences to Address
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your {alignmentScore}% alignment shows significant differences in key areas. This doesn't mean you're incompatible - but it does mean you need intentional conversations before making major life decisions together.
                </p>
              </div>

              <div className="bg-white border-2 border-red-200 rounded-xl p-6">
                <p className="font-semibold text-gray-800 mb-3">⚠️ Critical Areas Needing Discussion:</p>
                <div className="space-y-2 text-sm">
                  {Object.entries(categoryScores)
                    .filter(([_, score]) => score < 50)
                    .sort(([_, a], [__, b]) => a - b)
                    .map(([category, score]) => {
                      const categoryLabels = {
                        timeline: 'Timeline & Milestones',
                        financial: 'Financial Philosophy',
                        lifestyle: 'Lifestyle Preferences',
                        communication: 'Communication Style',
                        values: 'Core Values',
                        family: 'Family Dynamics',
                        career: 'Career Priorities',
                        parenting: 'Parenting Philosophy',
                        future: 'Long-term Vision'
                      };
                      return (
                        <div key={category} className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">{categoryLabels[category]}</span>
                            <span className="text-xs text-red-700 font-bold">{score}% aligned</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <p className="font-semibold text-gray-800 mb-2">💙 We're Here to Support You:</p>
                <p className="text-sm text-gray-700 mb-4">
                  Many couples successfully navigate differences with the right support. Consider these resources:
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">📚</span>
                    <span><strong>Couples Counseling:</strong> Professional guidance for working through major differences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">📚</span>
                    <span><strong>Relationship Workshops:</strong> Structured programs for building alignment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">📚</span>
                    <span><strong>Discussion Guide:</strong> Step-by-step prompts for productive conversations</span>
                  </li>
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDownloadGuide}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-6 h-6" />
                Download Discussion Guide & Resources
              </motion.button>

              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-3">
                  ⚠️ We recommend addressing key differences before planning major milestones
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onContinue}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  Explore Relationship Goals First
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Bottom note */}
          <p className="text-center text-gray-500 text-sm mt-6">
            💕 Remember: Differences don't mean incompatibility - they mean opportunity for growth together!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CompatibilityResults;
