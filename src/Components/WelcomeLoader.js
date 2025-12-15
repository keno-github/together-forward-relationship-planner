import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/**
 * WelcomeLoader - A warm, intentional loading experience
 *
 * Design Philosophy:
 * - Make the app feel like a home, not a tool
 * - Reduce perceived waiting time through meaningful messaging
 * - Reinforce that Luna is actively preparing something meaningful
 * - Avoid anxiety or confusion during loading
 *
 * Features:
 * - Personalized welcome message using user's name
 * - Rotating sublines that give meaning to the wait
 * - Subtle, warm animations (no harsh spinners)
 * - Seamless transition into loaded content
 * - Reusable across different hubs
 */

// Rotating sublines - these give meaning to the wait
const SUBLINES = [
  'Getting your planning space ready…',
  'Syncing your progress…',
  'Preparing your dashboard…',
  'Just a moment — almost there.'
];

// Time between subline rotations (ms)
const SUBLINE_INTERVAL = 2500;

const WelcomeLoader = ({
  userName,
  customSublines,
  showLunaAvatar = true,
  minDisplayTime = 0, // Minimum time to show loader (prevents flash)
}) => {
  const [currentSublineIndex, setCurrentSublineIndex] = useState(0);
  const [startTime] = useState(Date.now());

  const sublines = customSublines || SUBLINES;

  // Rotate through sublines
  const rotateSubline = useCallback(() => {
    setCurrentSublineIndex((prev) => (prev + 1) % sublines.length);
  }, [sublines.length]);

  useEffect(() => {
    const interval = setInterval(rotateSubline, SUBLINE_INTERVAL);
    return () => clearInterval(interval);
  }, [rotateSubline]);

  // Extract first name from email or full name
  const getFirstName = () => {
    if (!userName) return null;

    // If it's an email, get the part before @
    if (userName.includes('@')) {
      const localPart = userName.split('@')[0];
      // Capitalize first letter
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }

    // If it's a name, get the first part
    const firstName = userName.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1);
  };

  const firstName = getFirstName();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#FAF7F2',
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {/* Subtle warm background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(196, 120, 90, 0.08) 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-md">
        {/* Luna Avatar with warm glow */}
        {showLunaAvatar && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: 0.1
            }}
            className="relative w-20 h-20 mx-auto mb-8"
          >
            {/* Soft glowing background */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(196, 120, 90, 0.3) 0%, transparent 70%)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* Outer ring pulse */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid rgba(196, 120, 90, 0.2)'
              }}
              animate={{
                scale: [1, 1.3],
                opacity: [0.6, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />

            {/* Main avatar circle */}
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #C4785A 0%, #a86a4a 100%)',
                boxShadow: '0 8px 32px -8px rgba(196, 120, 90, 0.4)'
              }}
            >
              <Sparkles
                className="w-8 h-8 text-white"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
            </div>
          </motion.div>
        )}

        {/* Primary welcome message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1
            className="text-3xl md:text-4xl font-light mb-2"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#2D2926'
            }}
          >
            Welcome back{firstName ? `, ${firstName}` : ''} <span role="img" aria-label="heart">💛</span>
          </h1>
        </motion.div>

        {/* Rotating sublines */}
        <div className="h-8 mt-4 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentSublineIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-base absolute inset-x-0"
              style={{ color: '#6B5E54' }}
            >
              {sublines[currentSublineIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Subtle progress indicator - three dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-2 mt-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#C4785A' }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WelcomeLoader;
