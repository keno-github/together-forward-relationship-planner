import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Briefcase, Plane, Palette, Dumbbell, Home, DollarSign, BookOpen, Heart, Loader, Check } from 'lucide-react';
import { generateIntelligentMilestones } from '../services/lunaGoalService';

// Inline styles for custom fonts
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

const CustomGoalCreator = ({ onBack, onComplete }) => {
  const [goalTitle, setGoalTitle] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [duration, setDuration] = useState('');
  const [details, setDetails] = useState('');
  const [getLunaHelp, setGetLunaHelp] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Inject fonts
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = fontStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const categories = [
    { value: 'business', label: 'Career', icon: Briefcase },
    { value: 'travel', label: 'Travel', icon: Plane },
    { value: 'creative', label: 'Creative', icon: Palette },
    { value: 'health', label: 'Health', icon: Dumbbell },
    { value: 'home', label: 'Home', icon: Home },
    { value: 'financial', label: 'Financial', icon: DollarSign },
    { value: 'learning', label: 'Learning', icon: BookOpen },
    { value: 'relationship', label: 'Love', icon: Heart }
  ];

  const exampleGoals = [
    'Open a cat cafe together',
    'Start a podcast',
    'Learn Spanish fluently',
    'Run a marathon together',
    'Build a tiny house',
    'Volunteer abroad'
  ];

  const handleCreate = async () => {
    if (!goalTitle.trim()) {
      alert('Please enter a goal title');
      return;
    }

    const baseGoal = {
      id: crypto.randomUUID(),
      title: goalTitle,
      icon: '✨',
      category: category || 'custom',
      estimatedCost: estimatedCost ? parseInt(estimatedCost) : 0,
      duration: duration || 'Flexible',
      description: details || `Custom goal: ${goalTitle}`,
      color: 'bg-gradient-to-br from-amber-400 to-orange-500',
      customDetails: details
    };

    if (getLunaHelp) {
      setIsGenerating(true);
      try {
        const enhancedGoal = await generateIntelligentMilestones(baseGoal);
        onComplete({
          ...baseGoal,
          ...enhancedGoal,
          lunaEnhanced: true
        });
      } catch (error) {
        console.error('Error generating milestones:', error);
        onComplete({
          ...baseGoal,
          tasks: [
            { id: 1, title: 'Research and plan', completed: false, aiGenerated: true },
            { id: 2, title: 'Set timeline', completed: false, aiGenerated: true },
            { id: 3, title: 'Start taking action', completed: false, aiGenerated: true }
          ]
        });
      } finally {
        setIsGenerating(false);
      }
    } else {
      onComplete({
        ...baseGoal,
        tasks: [
          { id: 1, title: 'Research and plan', completed: false, aiGenerated: true },
          { id: 2, title: 'Set timeline', completed: false, aiGenerated: true },
          { id: 3, title: 'Start taking action', completed: false, aiGenerated: true }
        ]
      });
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: '#FAF7F2',
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {/* Subtle texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 mb-8 group"
            style={{ color: '#6B5E54' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -4 }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium tracking-wide uppercase">Back</span>
          </motion.button>

          <div className="mb-8">
            <motion.p
              className="text-xs font-medium tracking-[0.2em] uppercase mb-2"
              style={{ color: '#C4785A' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Dream Your Own
            </motion.p>
            <motion.h1
              className="text-3xl md:text-4xl font-light leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: '#2D2926'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Create a <span className="italic font-medium" style={{ color: '#C4785A' }}>Custom Goal</span>
            </motion.h1>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="rounded-xl p-6 md:p-8 space-y-6"
          style={{
            backgroundColor: 'white',
            border: '1px solid #E8E2DA',
            boxShadow: '0 4px 20px -4px rgba(45, 41, 38, 0.08)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Goal Title */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: '#2D2926' }}
            >
              What's your unique goal together?
            </label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g., Open a cat cafe together"
              className="w-full px-4 py-3 rounded-xl text-base transition-all outline-none"
              style={{
                backgroundColor: '#FAF7F2',
                border: '1px solid #E8E2DA',
                color: '#2D2926'
              }}
              onFocus={(e) => e.target.style.borderColor = '#C4785A'}
              onBlur={(e) => e.target.style.borderColor = '#E8E2DA'}
            />
            <p className="text-xs mt-2" style={{ color: '#8B8178' }}>
              Try: {exampleGoals.slice(0, 3).join(' • ')}
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: '#2D2926' }}
            >
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <motion.button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className="p-3 rounded-xl transition-all text-center"
                    style={{
                      backgroundColor: isSelected ? '#C4785A' : '#FAF7F2',
                      border: '1px solid',
                      borderColor: isSelected ? '#C4785A' : '#E8E2DA',
                      color: isSelected ? 'white' : '#6B5E54'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-xs font-medium">{cat.label}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Budget and Timeline Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#2D2926' }}
              >
                Budget <span style={{ color: '#A09890' }}>(Optional)</span>
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: '#8B8178' }}
                >
                  €
                </span>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 rounded-xl text-base transition-all outline-none"
                  style={{
                    backgroundColor: '#FAF7F2',
                    border: '1px solid #E8E2DA',
                    color: '#2D2926'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#C4785A'}
                  onBlur={(e) => e.target.style.borderColor = '#E8E2DA'}
                  min="0"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#2D2926' }}
              >
                Timeline <span style={{ color: '#A09890' }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 12 months"
                className="w-full px-4 py-3 rounded-xl text-base transition-all outline-none"
                style={{
                  backgroundColor: '#FAF7F2',
                  border: '1px solid #E8E2DA',
                  color: '#2D2926'
                }}
                onFocus={(e) => e.target.style.borderColor = '#C4785A'}
                onBlur={(e) => e.target.style.borderColor = '#E8E2DA'}
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: '#2D2926' }}
            >
              Details <span style={{ color: '#A09890' }}>(Optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Share what makes this goal special..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-base transition-all outline-none resize-none"
              style={{
                backgroundColor: '#FAF7F2',
                border: '1px solid #E8E2DA',
                color: '#2D2926'
              }}
              onFocus={(e) => e.target.style.borderColor = '#C4785A'}
              onBlur={(e) => e.target.style.borderColor = '#E8E2DA'}
            />
          </div>

          {/* Luna Help Toggle */}
          <motion.div
            className="rounded-xl p-4 cursor-pointer transition-all"
            style={{
              backgroundColor: getLunaHelp ? '#FEF7ED' : '#FAF7F2',
              border: '1px solid',
              borderColor: getLunaHelp ? '#C4785A' : '#E8E2DA'
            }}
            onClick={() => !isGenerating && setGetLunaHelp(!getLunaHelp)}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                style={{
                  backgroundColor: getLunaHelp ? '#C4785A' : 'transparent',
                  border: getLunaHelp ? 'none' : '2px solid #D4CCC4'
                }}
              >
                {getLunaHelp && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
              <div className="flex-1">
                <div
                  className="font-medium mb-0.5"
                  style={{ color: '#2D2926' }}
                >
                  Let Luna create intelligent roadmaps
                </div>
                <div className="text-xs" style={{ color: '#6B5E54' }}>
                  {getLunaHelp
                    ? 'Luna will create personalized phases, tasks, and expert tips'
                    : 'Quick start with basic tasks - enhance with Luna later'}
                </div>
              </div>
              <span
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: getLunaHelp ? '#C4785A' : '#E8E2DA',
                  color: getLunaHelp ? 'white' : '#6B5E54'
                }}
              >
                {getLunaHelp ? 'On' : 'Off'}
              </span>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.button
            onClick={handleCreate}
            disabled={isGenerating || !goalTitle.trim()}
            className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#2D2926',
              color: 'white'
            }}
            whileHover={!isGenerating && goalTitle.trim() ? { backgroundColor: '#C4785A', scale: 1.01 } : {}}
            whileTap={!isGenerating && goalTitle.trim() ? { scale: 0.99 } : {}}
          >
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Luna is crafting your roadmap...</span>
              </>
            ) : getLunaHelp ? (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Create with Luna</span>
              </>
            ) : (
              <span>Add to Goal Basket</span>
            )}
          </motion.button>
        </motion.div>

        {/* Inspiration */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs" style={{ color: '#8B8178' }}>
            More ideas: {exampleGoals.slice(3).join(' • ')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomGoalCreator;
