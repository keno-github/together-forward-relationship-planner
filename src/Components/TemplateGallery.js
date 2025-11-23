import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, CheckCircle2 } from 'lucide-react';
import { GOAL_CATEGORIES, getTemplatesByCategory } from '../data/goalTemplates';

const TemplateGallery = ({ onBack, onComplete }) => {
  const [selectedGoals, setSelectedGoals] = useState([]);

  const toggleGoal = (template) => {
    setSelectedGoals(prev => {
      const isSelected = prev.some(g => g.id === template.id);
      if (isSelected) {
        return prev.filter(g => g.id === template.id);
      } else {
        return [...prev, template];
      }
    });
  };

  const isSelected = (templateId) => {
    return selectedGoals.some(g => g.id === templateId);
  };

  const handleAddToBasket = () => {
    onComplete(selectedGoals);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Choose Your Goals 💕
          </h1>
          <p className="text-lg text-gray-600">
            Select the goals that matter to you both (pick as many as you'd like - you can always add more later!)
          </p>
        </div>

        {/* Goal Categories */}
        {Object.entries(GOAL_CATEGORIES).map(([categoryKey, category]) => {
          const templates = getTemplatesByCategory(categoryKey);
          if (templates.length === 0) return null;

          return (
            <div key={categoryKey} className="mb-12">
              {/* Category Header */}
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.name}
              </h2>

              {/* Goal Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className={`bg-white rounded-xl p-6 border-2 transition-all duration-300 cursor-pointer h-full flex flex-col ${
                        isSelected(template.id)
                          ? 'border-purple-500 shadow-lg scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => toggleGoal(template)}
                    >
                      {/* Icon */}
                      <div className="text-center mb-4">
                        <div className={`w-16 h-16 ${template.color} rounded-full flex items-center justify-center mx-auto mb-3 relative`}>
                          <span className="text-3xl">{template.icon}</span>
                          {isSelected(template.id) && (
                            <motion.div
                              className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring' }}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-1">
                          {template.title}
                        </h3>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4 flex-1">
                        <div className="flex items-center justify-center gap-1">
                          <span>💰</span>
                          <span>€{template.estimatedCost.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <span>⏱️</span>
                          <span>{template.duration}</span>
                        </div>
                      </div>

                      {/* Button */}
                      <button
                        className={`w-full py-2 rounded-lg font-semibold transition-all ${
                          isSelected(template.id)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGoal(template);
                        }}
                      >
                        {isSelected(template.id) ? 'Selected ✓' : 'Select'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Selected Goals Summary - Fixed at bottom */}
        <AnimatePresence>
          {selectedGoals.length > 0 && (
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-purple-200 shadow-2xl z-50"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
            >
              <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-between gap-6">
                  {/* Selected Count */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      ✨ Your Selected Goals ({selectedGoals.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedGoals.map(goal => (
                        <div
                          key={goal.id}
                          className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{goal.icon}</span>
                          <span className="font-medium">{goal.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex gap-3 flex-shrink-0">
                    <button
                      onClick={handleAddToBasket}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      Add to Goal Basket
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer for fixed footer */}
        {selectedGoals.length > 0 && <div className="h-32"></div>}
      </div>
    </div>
  );
};

export default TemplateGallery;
