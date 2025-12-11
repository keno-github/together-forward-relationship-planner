import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/**
 * MomentumCard - Clean streak and progress celebration card
 *
 * Design: Nature-inspired with sage green accents
 */
const MomentumCard = ({
  streak,
  overallProgress,
  onCelebrate,
}) => {
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Trigger celebration animation
  const handleCelebrate = useCallback(() => {
    if (isCelebrating) return;

    setIsCelebrating(true);

    // Reset after animation
    setTimeout(() => {
      setIsCelebrating(false);
    }, 2500);

    onCelebrate?.();
  }, [isCelebrating, onCelebrate]);

  const progressPercentage = overallProgress?.percentage || 0;

  return (
    <motion.div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #f5f2ed 0%, #faf8f5 100%)',
        border: '1px solid #e8e4de',
        boxShadow: '0 4px 12px rgba(45, 41, 38, 0.08)',
        fontFamily: "'DM Sans', sans-serif",
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Content */}
      <div className="p-6">
        {/* Stat Row */}
        <div className="flex items-end justify-between mb-4">
          <h3
            className="text-2xl font-normal italic"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#c49a6c',
            }}
          >
            {streak && streak.current > 0
              ? `${streak.current} Day Streak!`
              : 'Start Your Streak'}
          </h3>
          {overallProgress && progressPercentage > 0 && (
            <span
              className="text-sm font-bold"
              style={{ color: '#c49a6c' }}
            >
              {progressPercentage}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {overallProgress && progressPercentage > 0 && (
          <div
            className="h-2.5 rounded-full overflow-hidden mb-5"
            style={{
              backgroundColor: '#e8e4de',
            }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #c49a6c 0%, #d4b08a 100%)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
            />
          </div>
        )}

        {/* Message */}
        {streak && (
          <p className="text-sm mb-5" style={{ color: '#6b635b' }}>
            {streak.message || 'Start planning to build momentum!'}
          </p>
        )}

        {/* Celebrate Button */}
        <motion.button
          onClick={handleCelebrate}
          disabled={isCelebrating}
          className="w-full px-5 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: '#FFFFFF',
            color: '#c49a6c',
            boxShadow: '0 2px 8px rgba(45, 41, 38, 0.06)',
            border: '1px solid #e8e4de',
          }}
          whileHover={{ boxShadow: '0 4px 16px rgba(45, 41, 38, 0.12)', y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {isCelebrating ? (
              <motion.span
                key="celebrating"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-2"
              >
                <span>✨ Amazing!</span>
              </motion.span>
            ) : (
              <motion.span
                key="celebrate"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Celebrate Progress ✨</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MomentumCard;
