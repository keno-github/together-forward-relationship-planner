import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * WelcomeHeader - Stunning personalized greeting for returning users
 *
 * Design: Editorial luxury with warm, inviting aesthetics
 */
const WelcomeHeader = ({ dreams = [], user }) => {
  // Extract partner names from the first dream
  const partnerNames = useMemo(() => {
    if (!dreams || dreams.length === 0) {
      return user?.email?.split('@')[0] || 'there';
    }

    const firstDream = dreams[0];
    const partner1 = firstDream?.partner1_name;
    const partner2 = firstDream?.partner2_name;

    if (partner1 && partner2) {
      return `${partner1} & ${partner2}`;
    }
    return partner1 || user?.email?.split('@')[0] || 'there';
  }, [dreams, user]);

  // Time-aware greeting
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Time-aware image
  const timeImage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      // Morning - Sun
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop&q=90';
    }
    if (hour < 17) {
      // Afternoon - Warm sun
      return 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=100&h=100&fit=crop&q=90';
    }
    // Evening - Moon
    return 'https://images.unsplash.com/photo-1511452885600-a3d2c9148a31?w=100&h=100&fit=crop&q=90';
  }, []);

  return (
    <motion.div
      className="relative mb-10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative">
        {/* Main greeting with time image */}
        <div className="flex items-start gap-4 md:gap-6 mb-4">
          <motion.div
            className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden"
            style={{
              boxShadow: '0 8px 24px -8px rgba(196, 154, 108, 0.3)',
              border: '3px solid rgba(255, 255, 255, 0.9)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <img
              src={timeImage}
              alt={timeGreeting}
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(1.05) contrast(1.05) saturate(0.9)' }}
            />
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-normal leading-tight flex-1"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#2d2926',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            {timeGreeting},<br />
            <span
              className="italic"
              style={{
                color: '#c49a6c',
              }}
            >
              {partnerNames}.
            </span>
          </motion.h1>
        </div>

        {/* Tagline */}
        <motion.p
          className="text-base md:text-lg font-normal leading-relaxed ml-16 md:ml-22"
          style={{
            color: '#6b635b',
            fontFamily: "'DM Sans', sans-serif",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Building a life together.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default WelcomeHeader;
