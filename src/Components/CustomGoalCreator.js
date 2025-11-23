import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Briefcase, Plane, Palette, Dumbbell, Home, DollarSign, BookOpen, Heart } from 'lucide-react';

const CustomGoalCreator = ({ onBack, onComplete }) => {
  const [goalTitle, setGoalTitle] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [duration, setDuration] = useState('');
  const [details, setDetails] = useState('');
  const [getLunaHelp, setGetLunaHelp] = useState(false); // Changed: Default to false for instant roadmap

  const categories = [
    { value: 'business', label: 'Career & Business', icon: Briefcase },
    { value: 'travel', label: 'Travel & Adventure', icon: Plane },
    { value: 'creative', label: 'Creative Projects', icon: Palette },
    { value: 'health', label: 'Health & Fitness', icon: Dumbbell },
    { value: 'home', label: 'Home & Living', icon: Home },
    { value: 'financial', label: 'Financial', icon: DollarSign },
    { value: 'learning', label: 'Learning & Growth', icon: BookOpen },
    { value: 'relationship', label: 'Relationship', icon: Heart }
  ];

  const exampleGoals = [
    'Open a cat cafe together',
    'Start a podcast',
    'Learn Spanish fluently',
    'Run a marathon together',
    'Build a tiny house',
    'Volunteer abroad for 3 months'
  ];

  const handleCreate = () => {
    if (!goalTitle.trim()) {
      alert('Please enter a goal title');
      return;
    }

    const customGoal = {
      id: 'custom_' + Date.now(),
      title: goalTitle,
      icon: '✨',
      category: category || 'custom',
      estimatedCost: estimatedCost ? parseInt(estimatedCost) : 0,
      duration: duration || 'Flexible',
      description: details || `Custom goal: ${goalTitle}`,
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      tasks: [
        { id: 1, title: 'Research and plan', completed: false, aiGenerated: true },
        { id: 2, title: 'Set timeline', completed: false, aiGenerated: true },
        { id: 3, title: 'Start taking action', completed: false, aiGenerated: true }
      ],
      customDetails: details,
      needsLunaRefinement: getLunaHelp
    };

    onComplete(customGoal);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Templates
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              Create Your Custom Goal ✨
            </h1>
          </div>
        </div>

        {/* Form */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Goal Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What's your unique goal together?
            </label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g., Open a cat cafe together"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg transition-colors"
            />
            <p className="text-sm text-gray-500 mt-2">
              Examples: {exampleGoals.slice(0, 3).join(', ')}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              What category does this fit?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      category === cat.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${category === cat.value ? 'text-purple-600' : 'text-gray-400'}`} />
                    <div className="text-sm font-medium text-gray-700">{cat.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget and Timeline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What's your budget? <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  €
                </span>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  min="0"
                />
              </div>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target timeline? <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 24 months, 1 year"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Any details you want to add? <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Share what makes this goal special to you both..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Luna Help Checkbox */}
          <div className={`rounded-xl p-4 border-2 transition-colors ${
            getLunaHelp
              ? 'bg-purple-50 border-purple-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={getLunaHelp}
                onChange={(e) => setGetLunaHelp(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div>
                <div className="font-semibold text-gray-800 mb-1">
                  Get Luna's help planning the details <span className="text-gray-400 font-normal">(Optional)</span>
                </div>
                <div className="text-sm text-gray-600">
                  {getLunaHelp ? (
                    <>✨ Luna will ask smart questions and create a detailed action plan for your goal</>
                  ) : (
                    <>⚡ Your roadmap will be created instantly with basic tasks you can customize later</>
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreate}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Add to Goal Basket →
            </button>
          </div>
        </motion.div>

        {/* Inspiration */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-gray-600 text-sm">
            💡 <strong>Need inspiration?</strong> Try: {exampleGoals.slice(3).join(' • ')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomGoalCreator;
