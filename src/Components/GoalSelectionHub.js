import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Grid3x3, Sparkles } from 'lucide-react';

const GoalSelectionHub = ({ partner1, partner2, onSelectPath }) => {
  const options = [
    {
      id: 'luna',
      title: 'Talk with Luna',
      subtitle: 'Most Personal',
      icon: MessageCircle,
      description: 'Luna will ask thoughtful questions to understand your unique dreams and priorities',
      benefits: [
        '✨ Deeply personalized roadmap',
        '⏱️ 5-10 minute conversation',
        '🎯 Best for couples exploring multiple goals'
      ],
      color: 'from-purple-500 to-pink-500',
      buttonText: 'Start Conversation with Luna →'
    },
    {
      id: 'templates',
      title: 'Browse Goal Templates',
      subtitle: 'Quick Start',
      icon: Grid3x3,
      description: 'Pick from 12 popular couple goals - we\'ll create instant roadmaps you can customize',
      benefits: [
        '⚡ Fastest option',
        '⏱️ 2-3 minutes to select',
        '💡 Wedding, Home, Travel, Financial & more'
      ],
      color: 'from-blue-500 to-indigo-500',
      buttonText: 'Browse 12 Goal Templates →'
    },
    {
      id: 'custom',
      title: 'Create Custom Goal',
      subtitle: 'Your Unique Vision',
      icon: Sparkles,
      description: 'Have something unique in mind? Build your own milestone and Luna will help plan it',
      benefits: [
        '🎨 Most flexible',
        '⏱️ 3-5 minutes to create',
        '💭 Examples: Move abroad, start business'
      ],
      color: 'from-emerald-500 to-teal-500',
      buttonText: 'Create Your Own Goal →'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-5xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-block mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💕</span>
            </div>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Welcome, {partner1} & {partner2}! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            How would you like to plan your goals together?
          </p>
        </div>

        {/* Options Grid */}
        <div className="space-y-6">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-purple-200">
                  <div className="p-8">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            {option.icon === MessageCircle && '💬'}
                            {option.icon === Grid3x3 && '🎯'}
                            {option.icon === Sparkles && '✨'}
                            {option.title}
                          </h2>
                          <p className="text-purple-600 font-semibold text-sm">
                            {option.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {option.description}
                    </p>

                    {/* Benefits */}
                    <div className="space-y-2 mb-6">
                      {option.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-600">
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => onSelectPath(option.id)}
                      className={`w-full bg-gradient-to-r ${option.color} text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
                    >
                      {option.buttonText}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Help Text */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-600">
            Not sure? <span className="font-semibold text-purple-600">Start with templates!</span> 💡
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GoalSelectionHub;
