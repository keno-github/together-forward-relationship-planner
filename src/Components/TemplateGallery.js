import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, X, Heart } from 'lucide-react';

import { GOAL_CATEGORIES, getTemplatesByCategory } from '../data/goalTemplates';

// Inline styles for custom fonts
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

const TemplateGallery = ({ onBack, onComplete }) => {
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const categoryRefs = useRef({});

  // Inject fonts
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = fontStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const toggleGoal = (template) => {
    setSelectedGoals(prev => {
      const isSelected = prev.some(g => g.id === template.id);
      if (isSelected) {
        return prev.filter(g => g.id !== template.id);
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

  const scrollToCategory = (categoryKey) => {
    const element = categoryRefs.current[categoryKey];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveCategory(categoryKey);
    }
  };

  const totalEstimate = selectedGoals.reduce((sum, g) => sum + g.estimatedCost, 0);
  const categoryKeys = Object.keys(GOAL_CATEGORIES);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: '#FAF7F2',
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Hero Section - Compact */}
      <motion.div
        className="relative pt-6 pb-8 px-4 md:px-8 lg:px-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.button
          onClick={onBack}
          className="flex items-center gap-2 group"
          style={{ color: '#6B5E54' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium tracking-wide uppercase">Back</span>
          </motion.button>
        </div>


        {/* Hero Content - More compact */}
        <div className="max-w-3xl">
          <motion.p
            className="text-xs font-medium tracking-[0.2em] uppercase mb-2"
            style={{ color: '#C4785A' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your Shared Journey Begins
          </motion.p>

          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-light leading-[1.15] mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#2D2926'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Curate Your <span className="italic font-medium" style={{ color: '#C4785A' }}>Dreams Together</span>
          </motion.h1>

          <motion.p
            className="text-sm md:text-base max-w-lg leading-relaxed"
            style={{ color: '#6B5E54' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Select the milestones that resonate with your vision.
          </motion.p>
        </div>
      </motion.div>

      {/* Category Navigation - Sticky */}
      <motion.div
        className="sticky top-0 z-40 px-4 md:px-8 lg:px-12 py-3"
        style={{ backgroundColor: 'rgba(250, 247, 242, 0.97)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categoryKeys.map((key, index) => {
            const category = GOAL_CATEGORIES[key];
            const selectedCount = selectedGoals.filter(g => g.category === key).length;

            return (
              <motion.button
                key={key}
                onClick={() => scrollToCategory(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200"
                style={{
                  backgroundColor: activeCategory === key ? '#2D2926' : 'white',
                  color: activeCategory === key ? 'white' : '#2D2926',
                  border: '1px solid',
                  borderColor: activeCategory === key ? '#2D2926' : '#E8E2DA',
                  fontSize: '13px'
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.03 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
                {selectedCount > 0 && (
                  <span
                    className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: '#C4785A', color: 'white' }}
                  >
                    {selectedCount}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Categories with Grid Layout */}
      <div className="px-4 md:px-8 lg:px-12 pb-36">
        {categoryKeys.map((categoryKey) => {
          const category = GOAL_CATEGORIES[categoryKey];
          const templates = getTemplatesByCategory(categoryKey);
          if (templates.length === 0) return null;

          return (
            <motion.section
              key={categoryKey}
              ref={el => categoryRefs.current[categoryKey] = el}
              className="py-6 scroll-mt-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4 }}
            >
              {/* Category Header - Compact */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h2
                    className="text-xl md:text-2xl font-light"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      color: '#2D2926'
                    }}
                  >
                    {category.name}
                  </h2>
                  <p className="text-xs" style={{ color: '#8B8178' }}>
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {templates.map((template, index) => {
                  const selected = isSelected(template.id);
                  const isHovered = hoveredCard === template.id;

                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                    >
                      <motion.div
                        className="relative h-full rounded-xl overflow-hidden cursor-pointer"
                        style={{
                          backgroundColor: 'white',
                          boxShadow: selected
                            ? '0 8px 24px -6px rgba(196, 120, 90, 0.3)'
                            : isHovered
                              ? '0 8px 20px -6px rgba(45, 41, 38, 0.15)'
                              : '0 2px 8px -2px rgba(45, 41, 38, 0.08)',
                          border: selected ? '2px solid #C4785A' : '1px solid #E8E2DA'
                        }}
                        onClick={() => toggleGoal(template)}
                        onHoverStart={() => setHoveredCard(template.id)}
                        onHoverEnd={() => setHoveredCard(null)}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Card Header - Image */}
                        <div className="h-24 relative overflow-hidden">
                          <img
                            src={template.image}
                            alt={template.title}
                            className="w-full h-full object-cover"
                            style={{
                              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                              transition: 'transform 0.3s ease'
                            }}
                          />
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)' }} />

                          {/* Selection indicator */}
                          <AnimatePresence>
                            {selected && (
                              <motion.div
                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'white' }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 500 }}
                              >
                                <Check className="w-4 h-4" style={{ color: '#C4785A' }} strokeWidth={3} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Card Content - Compact */}
                        <div className="p-3">
                          <h3
                            className="text-sm font-semibold mb-1 leading-tight"
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              color: '#2D2926'
                            }}
                          >
                            {template.title}
                          </h3>

                          {/* Meta info */}
                          <div className="flex items-center gap-2 text-[10px]" style={{ color: '#8B8178' }}>
                            <span className="font-medium" style={{ color: '#2D2926' }}>
                              €{template.estimatedCost.toLocaleString()}
                            </span>
                            <span>•</span>
                            <span>{template.duration}</span>
                          </div>

                          {/* Select indicator */}
                          <div
                            className="mt-2 py-1.5 rounded-lg text-center text-xs font-medium transition-all"
                            style={{
                              backgroundColor: selected ? '#C4785A' : '#F5F1EC',
                              color: selected ? 'white' : '#6B5E54'
                            }}
                          >
                            {selected ? '✓ Added' : 'Add'}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Selection Summary - Elegant Bottom Panel */}
      <AnimatePresence>
        {selectedGoals.length > 0 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Gradient fade */}
            <div
              className="absolute inset-x-0 -top-16 h-16 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(250, 247, 242, 0.95), transparent)'
              }}
            />

            <div
              className="relative px-4 md:px-8 lg:px-12 py-4"
              style={{
                backgroundColor: 'white',
                borderTop: '1px solid #E8E2DA',
                boxShadow: '0 -4px 20px -4px rgba(45, 41, 38, 0.1)'
              }}
            >
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left - Selection Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 flex-shrink-0" style={{ color: '#C4785A' }} fill="#C4785A" />
                      <span
                        className="text-lg font-semibold"
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          color: '#2D2926'
                        }}
                      >
                        {selectedGoals.length} {selectedGoals.length === 1 ? 'Dream' : 'Dreams'}
                      </span>
                      <span className="text-xs" style={{ color: '#8B8178' }}>
                        • Est. €{totalEstimate.toLocaleString()}
                      </span>
                    </div>

                    {/* Selected Goals Pills - Scrollable */}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                      {selectedGoals.slice(0, 6).map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: '#F5F1EC',
                            border: '1px solid #E8E2DA'
                          }}
                        >
                          <span className="text-xs">{goal.icon}</span>
                          <span className="text-xs font-medium" style={{ color: '#2D2926' }}>
                            {goal.title.length > 12 ? goal.title.slice(0, 12) + '...' : goal.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGoal(goal);
                            }}
                            className="hover:scale-110 transition-transform"
                          >
                            <X className="w-3 h-3" style={{ color: '#8B8178' }} />
                          </button>
                        </div>
                      ))}
                      {selectedGoals.length > 6 && (
                        <div
                          className="px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
                          style={{ backgroundColor: '#F5F1EC', color: '#6B5E54' }}
                        >
                          +{selectedGoals.length - 6}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right - Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedGoals([])}
                      className="px-3 py-2 rounded-lg font-medium text-xs transition-all hover:bg-gray-100"
                      style={{ color: '#6B5E54' }}
                    >
                      Clear
                    </button>
                    <motion.button
                      onClick={handleAddToBasket}
                      className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2"
                      style={{
                        backgroundColor: '#2D2926',
                        color: 'white'
                      }}
                      whileHover={{ scale: 1.02, backgroundColor: '#C4785A' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Begin Journey
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state encouragement */}
      <AnimatePresence>
        {selectedGoals.length === 0 && (
          <motion.div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div
              className="px-4 py-2 rounded-full flex items-center gap-2"
              style={{
                backgroundColor: 'white',
                boxShadow: '0 2px 12px -2px rgba(45, 41, 38, 0.15)',
                border: '1px solid #E8E2DA'
              }}
            >
              <span>💫</span>
              <span className="text-xs font-medium" style={{ color: '#6B5E54' }}>
                Tap any card to start
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollbar hide styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default TemplateGallery;
