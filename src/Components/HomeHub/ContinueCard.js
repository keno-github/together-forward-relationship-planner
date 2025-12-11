import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * ContinueCard - Elegant "Continue Where You Left Off" card
 *
 * Design: Minimal, sophisticated with magnetic hover effect
 */
const ContinueCard = ({
  continueData,
  onContinue,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!continueData) return null;

  const handleContinue = () => {
    if (onContinue && continueData.dreamId) {
      onContinue(continueData.dreamId);
    }
  };

  return (
    <motion.button
      onClick={handleContinue}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full text-left relative overflow-hidden group"
      style={{
        borderRadius: '1rem',
        background: 'linear-gradient(135deg, #2d2926 0%, #3d3633 100%)',
        border: '1px solid rgba(196, 154, 108, 0.15)',
        boxShadow: '0 4px 16px -4px rgba(45, 41, 38, 0.3)',
        fontFamily: "'DM Sans', sans-serif",
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="relative p-6 md:p-7">
        <div className="flex items-center justify-between gap-6">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: '#c49a6c', letterSpacing: '0.05em' }}
            >
              Jump back in
            </p>
            <h3
              className="text-2xl md:text-3xl font-normal italic text-white mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {continueData.dreamTitle}
            </h3>
            {continueData.milestoneName && (
              <p className="text-sm mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {continueData.milestoneName}
              </p>
            )}
          </div>

          {/* Arrow */}
          <motion.div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(196, 154, 108, 0.2)',
              backdropFilter: 'blur(4px)',
            }}
            animate={{
              backgroundColor: isHovered ? 'rgba(196, 154, 108, 0.3)' : 'rgba(196, 154, 108, 0.2)',
            }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className="w-5 h-5" style={{ color: '#c49a6c' }} />
          </motion.div>
        </div>
      </div>
    </motion.button>
  );
};

export default ContinueCard;
