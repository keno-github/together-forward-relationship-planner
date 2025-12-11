import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, X, Sparkles, AlertTriangle,
  Plus, Grid3X3, Loader, Heart, Leaf, Zap, ChevronRight, Users
} from 'lucide-react';
import GoalOrchestrator from '../services/goalOrchestrator';
import TemplateGallery from './TemplateGallery';
import CustomGoalCreator from './CustomGoalCreator';
import { generateIntelligentMilestones } from '../services/lunaGoalService';

// Inline styles for custom fonts
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

const GoalBuilder = ({ onBack, onComplete, onEnhanceWithLuna, user, locationData }) => {
  const [orchestrator] = useState(() => new GoalOrchestrator(user, locationData));
  const [goals, setGoals] = useState(orchestrator.getGoals());
  const [stats, setStats] = useState(orchestrator.getStats());
  const [suggestions, setSuggestions] = useState(orchestrator.generateSuggestions());

  // Partner names - pre-fill from user data if available
  const [partner1Name, setPartner1Name] = useState(user?.partner1 || user?.partner1_name || '');
  const [partner2Name, setPartner2Name] = useState(user?.partner2 || user?.partner2_name || '');
  const [showPartnerSection, setShowPartnerSection] = useState(true);

  // UI state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingGoalIndex, setGeneratingGoalIndex] = useState(-1);
  const [hoveredGoal, setHoveredGoal] = useState(null);

  // Inject fonts
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = fontStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

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
      // Include partner names in the roadmap
      onComplete({
        ...result.roadmap,
        partner1_name: partner1Name.trim() || undefined,
        partner2_name: partner2Name.trim() || undefined
      });
    } else {
      alert(result.error || 'Failed to create roadmap');
    }
  };

  const handleEnhanceAndCreate = async () => {
    setIsGenerating(true);
    try {
      const currentGoals = orchestrator.getGoals();
      for (let i = 0; i < currentGoals.length; i++) {
        const goal = currentGoals[i];
        setGeneratingGoalIndex(i);
        if (goal.lunaEnhanced && goal.roadmapPhases?.length > 0) continue;
        try {
          const enhancedGoal = await generateIntelligentMilestones(goal);
          orchestrator.updateGoal(goal.id, { ...enhancedGoal, lunaEnhanced: true });
        } catch (error) {
          console.error(`Failed to enhance "${goal.title}":`, error);
        }
      }
      setGeneratingGoalIndex(-1);
      const result = orchestrator.createRoadmap();
      if (result.success) {
        // Include partner names in the roadmap
        onComplete({
          ...result.roadmap,
          partner1_name: partner1Name.trim() || undefined,
          partner2_name: partner2Name.trim() || undefined
        });
      } else {
        alert(result.error || 'Failed to create roadmap');
      }
    } catch (error) {
      console.error('Error in enhance and create:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
      setGeneratingGoalIndex(-1);
    }
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

  const totalBudget = goals.reduce((sum, g) => sum + (g.estimatedCost || 0), 0);
  const hasPartnerNames = partner1Name.trim() && partner2Name.trim();

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

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Button */}
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

          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <motion.p
                className="text-xs font-medium tracking-[0.2em] uppercase mb-2"
                style={{ color: '#C4785A' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Your Vision Board
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
                Build Your <span className="italic font-medium" style={{ color: '#C4785A' }}>Roadmap</span>
              </motion.h1>
              <motion.p
                className="text-sm mt-2 max-w-md"
                style={{ color: '#6B5E54' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Add your dreams and we'll craft an intelligent plan together
              </motion.p>
            </div>

            {/* Stats Card */}
            {goals.length > 0 && (
              <motion.div
                className="px-5 py-4 rounded-xl"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #E8E2DA',
                  boxShadow: '0 2px 8px -2px rgba(45, 41, 38, 0.08)'
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#8B8178' }}>
                  Total Investment
                </div>
                <div
                  className="text-2xl font-semibold"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: '#2D2926'
                  }}
                >
                  €{totalBudget.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Heart className="w-3 h-3" style={{ color: '#C4785A' }} fill="#C4785A" />
                  <span className="text-xs" style={{ color: '#6B5E54' }}>
                    {goals.length} {goals.length === 1 ? 'dream' : 'dreams'}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Partnership Section - Show when goals exist */}
        {goals.length > 0 && showPartnerSection && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: 'white',
                border: '1px solid #E8E2DA',
                boxShadow: '0 2px 8px -2px rgba(45, 41, 38, 0.06)'
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#FEF7ED' }}
                  >
                    <Users className="w-5 h-5" style={{ color: '#C4785A' }} />
                  </div>
                  <div>
                    <h3
                      className="text-base font-semibold"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        color: '#2D2926'
                      }}
                    >
                      Your Partnership
                    </h3>
                    <p className="text-xs" style={{ color: '#8B8178' }}>
                      Personalize your shared journey
                    </p>
                  </div>
                </div>
                {hasPartnerNames && (
                  <button
                    onClick={() => setShowPartnerSection(false)}
                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ color: '#8B8178' }}
                  >
                    Collapse
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: '#6B5E54' }}
                  >
                    Partner 1
                  </label>
                  <input
                    type="text"
                    value={partner1Name}
                    onChange={(e) => setPartner1Name(e.target.value)}
                    placeholder="Enter name"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      backgroundColor: '#FAF7F2',
                      border: '1px solid #E8E2DA',
                      color: '#2D2926'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C4785A'}
                    onBlur={(e) => e.target.style.borderColor = '#E8E2DA'}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: '#6B5E54' }}
                  >
                    Partner 2
                  </label>
                  <input
                    type="text"
                    value={partner2Name}
                    onChange={(e) => setPartner2Name(e.target.value)}
                    placeholder="Enter name"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
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

              {hasPartnerNames && (
                <motion.div
                  className="mt-3 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Heart className="w-3.5 h-3.5" style={{ color: '#C4785A' }} fill="#C4785A" />
                  <span className="text-xs" style={{ color: '#6B5E54' }}>
                    {partner1Name} & {partner2Name}'s dreams
                  </span>
                </motion.div>
              )}

              {!hasPartnerNames && (
                <p className="text-xs mt-3" style={{ color: '#A09890' }}>
                  Adding your names makes the experience more personal
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Collapsed Partnership Indicator */}
        {goals.length > 0 && !showPartnerSection && hasPartnerNames && (
          <motion.button
            onClick={() => setShowPartnerSection(true)}
            className="mb-6 flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ borderColor: '#C4785A' }}
          >
            <Heart className="w-3.5 h-3.5" style={{ color: '#C4785A' }} fill="#C4785A" />
            <span className="text-sm" style={{ color: '#2D2926' }}>
              {partner1Name} & {partner2Name}
            </span>
            <span className="text-xs" style={{ color: '#8B8178' }}>· Edit</span>
          </motion.button>
        )}

        {/* Goals List */}
        {goals.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <h2
                className="text-lg font-medium"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: '#2D2926'
                }}
              >
                Your Dreams
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#F5F1EC', color: '#6B5E54' }}
              >
                {goals.length}
              </span>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {goals.map((goal, index) => {
                  const isHovered = hoveredGoal === goal.id;
                  const isCurrentlyGenerating = isGenerating && generatingGoalIndex === index;

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: 'white',
                        border: isCurrentlyGenerating ? '2px solid #C4785A' : '1px solid #E8E2DA',
                        boxShadow: isHovered
                          ? '0 8px 24px -6px rgba(45, 41, 38, 0.12)'
                          : '0 2px 8px -2px rgba(45, 41, 38, 0.06)'
                      }}
                      onMouseEnter={() => setHoveredGoal(goal.id)}
                      onMouseLeave={() => setHoveredGoal(null)}
                    >
                      {/* Generating indicator */}
                      {isCurrentlyGenerating && (
                        <motion.div
                          className="absolute inset-x-0 top-0 h-1"
                          style={{ backgroundColor: '#C4785A' }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      <div className="p-4 md:p-5">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${goal.color || 'bg-gradient-to-br from-amber-400 to-orange-500'}`}
                          >
                            <span className="text-2xl">{goal.icon}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3
                                    className="text-lg font-semibold"
                                    style={{
                                      fontFamily: "'Cormorant Garamond', serif",
                                      color: '#2D2926'
                                    }}
                                  >
                                    {goal.title}
                                  </h3>
                                  {goal.source === 'custom' && (
                                    <span
                                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                                      style={{
                                        backgroundColor: '#F5F1EC',
                                        color: '#C4785A'
                                      }}
                                    >
                                      Custom
                                    </span>
                                  )}
                                  {goal.lunaEnhanced && (
                                    <span
                                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
                                      style={{
                                        backgroundColor: '#E8F5E9',
                                        color: '#2E7D32'
                                      }}
                                    >
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Enhanced
                                    </span>
                                  )}
                                </div>
                                {goal.description && (
                                  <p
                                    className="text-sm mt-1 line-clamp-1"
                                    style={{ color: '#6B5E54' }}
                                  >
                                    {goal.description}
                                  </p>
                                )}
                              </div>

                              {/* Remove button */}
                              <motion.button
                                onClick={() => handleRemoveGoal(goal.id)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: '#A09890' }}
                                whileHover={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: '#8B8178' }}>
                              <span className="font-medium" style={{ color: '#2D2926' }}>
                                €{goal.estimatedCost?.toLocaleString() || '0'}
                              </span>
                              <span>•</span>
                              <span>{goal.duration || 'Flexible'}</span>
                              <span>•</span>
                              <span className="capitalize">{goal.category}</span>
                            </div>

                            {/* Analysis badges */}
                            {goal.aiAnalysis && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {goal.aiAnalysis.conflicts?.length > 0 && (
                                  <div
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                                    style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    {goal.aiAnalysis.conflicts[0].message}
                                  </div>
                                )}
                                {goal.aiAnalysis.synergies?.length > 0 && (
                                  <div
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                                    style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                                  >
                                    <Leaf className="w-3 h-3" />
                                    {goal.aiAnalysis.synergies[0].message}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Add Goal Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div
            className="rounded-xl p-6 md:p-8"
            style={{
              backgroundColor: 'white',
              border: '2px dashed #D4CCC4'
            }}
          >
            <div className="text-center mb-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: '#F5F1EC' }}
              >
                <Plus className="w-5 h-5" style={{ color: '#8B8178' }} />
              </div>
              <h3
                className="text-xl font-medium mb-1"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: '#2D2926'
                }}
              >
                Add {goals.length > 0 ? 'Another Dream' : 'Your First Dream'}
              </h3>
              <p className="text-sm" style={{ color: '#6B5E54' }}>
                Choose from curated templates or create something unique
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Browse Templates */}
              <motion.button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-4 p-4 rounded-xl text-left transition-all group"
                style={{
                  backgroundColor: '#FAF7F2',
                  border: '1px solid #E8E2DA'
                }}
                whileHover={{
                  backgroundColor: '#F5F1EC',
                  borderColor: '#C4785A',
                  scale: 1.01
                }}
                whileTap={{ scale: 0.99 }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#2D2926' }}
                >
                  <Grid3X3 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div
                    className="font-semibold mb-0.5 group-hover:text-[#C4785A] transition-colors"
                    style={{ color: '#2D2926' }}
                  >
                    Browse Templates
                  </div>
                  <div className="text-xs" style={{ color: '#8B8178' }}>
                    30 curated life goals
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: '#A09890' }} />
              </motion.button>

              {/* Create Custom */}
              <motion.button
                onClick={() => setShowCustomCreator(true)}
                className="flex items-center gap-4 p-4 rounded-xl text-left transition-all group"
                style={{
                  backgroundColor: '#FAF7F2',
                  border: '1px solid #E8E2DA'
                }}
                whileHover={{
                  backgroundColor: '#F5F1EC',
                  borderColor: '#C4785A',
                  scale: 1.01
                }}
                whileTap={{ scale: 0.99 }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#C4785A' }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div
                    className="font-semibold mb-0.5 group-hover:text-[#C4785A] transition-colors"
                    style={{ color: '#2D2926' }}
                  >
                    Create Custom
                  </div>
                  <div className="text-xs" style={{ color: '#8B8178' }}>
                    Build something unique
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: '#A09890' }} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && goals.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: '#C4785A' }} />
              <h3
                className="text-sm font-medium uppercase tracking-wider"
                style={{ color: '#6B5E54' }}
              >
                Insights
              </h3>
            </div>
            <div className="space-y-2">
              {suggestions.slice(0, 2).map((suggestion, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    backgroundColor: suggestion.priority === 'high' ? '#FEF7ED' : 'white',
                    border: '1px solid #E8E2DA'
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <span className="text-lg flex-shrink-0">{suggestion.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium mb-0.5"
                      style={{ color: '#2D2926' }}
                    >
                      {suggestion.title}
                    </div>
                    <div className="text-xs" style={{ color: '#6B5E54' }}>
                      {suggestion.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {goals.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {/* Primary CTA */}
            <motion.button
              onClick={handleEnhanceAndCreate}
              disabled={isGenerating}
              className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#2D2926',
                color: 'white'
              }}
              whileHover={{ backgroundColor: '#C4785A', scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>
                    {generatingGoalIndex >= 0
                      ? `Creating "${goals[generatingGoalIndex]?.title}"...`
                      : 'Finalizing...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Create Roadmap with Luna</span>
                  <span
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ml-1"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    Recommended
                  </span>
                </>
              )}
            </motion.button>

            {/* Secondary CTA */}
            <button
              onClick={handleCreateRoadmap}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'transparent',
                color: '#6B5E54',
                border: '1px solid #E8E2DA'
              }}
            >
              Quick Create (Skip Luna)
            </button>

            {/* Helper text */}
            <p className="text-center text-xs" style={{ color: '#8B8178' }}>
              {isGenerating
                ? 'Luna is crafting detailed phases and personalized guidance...'
                : 'Luna will generate detailed phases, steps, and tips for each dream'}
            </p>
          </motion.div>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#F5F1EC' }}
            >
              <Sparkles size={32} strokeWidth={1.5} style={{ color: '#C4785A' }} />
            </div>
            <p
              className="text-lg font-light"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: '#6B5E54'
              }}
            >
              Start by adding your first dream above
            </p>
          </motion.div>
        )}
      </div>

      {/* Scrollbar hide */}
      <style>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default GoalBuilder;
