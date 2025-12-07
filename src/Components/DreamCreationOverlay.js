import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DreamCreationOverlay
 *
 * An intimate, editorial overlay celebrating the creation of a couple's dream.
 * Design: Warm, magazine-quality aesthetic with organic motion.
 */
const DreamCreationOverlay = ({
  isVisible,
  dreamTitle = 'Your Dream',
  dreamDetails = {},
  onComplete
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [particles, setParticles] = useState([]);

  const phases = [
    'Weaving your vision',
    'Mapping the journey',
    'Setting milestones',
    'Ready to begin'
  ];

  // Generate floating particles
  useEffect(() => {
    if (!isVisible) return;

    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 4,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, [isVisible]);

  // Progress through phases
  useEffect(() => {
    if (!isVisible) {
      setCurrentPhase(0);
      return;
    }

    let isCancelled = false;
    const timeouts = [];

    const phaseDurations = [1200, 1400, 1200, 1000];
    let cumulative = 500;

    phaseDurations.forEach((duration, index) => {
      const timeout = setTimeout(() => {
        if (!isCancelled) setCurrentPhase(index + 1);
      }, cumulative);
      timeouts.push(timeout);
      cumulative += duration;
    });

    // Final completion
    const completeTimeout = setTimeout(() => {
      if (!isCancelled && onComplete) onComplete();
    }, cumulative + 600);
    timeouts.push(completeTimeout);

    return () => {
      isCancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [isVisible, onComplete]);

  const formatBudget = (amount) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTimeline = (months) => {
    if (!months) return null;
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem ? `${years}y ${rem}m` : `${years} year${years > 1 ? 's' : ''}`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1814 0%, #2d2620 50%, #1a1814 100%)',
          }}
        >
          {/* Warm gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%)',
                filter: 'blur(60px)',
              }}
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(180,83,9,0.12) 0%, transparent 70%)',
                filter: 'blur(80px)',
              }}
            />
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{
                  opacity: 0,
                  x: `${particle.x}%`,
                  y: `${particle.y}%`,
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  y: [`${particle.y}%`, `${particle.y - 20}%`],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
                className="absolute rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  background: 'rgba(251, 191, 36, 0.8)',
                  boxShadow: '0 0 6px rgba(251, 191, 36, 0.4)',
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative h-full flex flex-col items-center justify-center px-6">
            {/* Central glowing orb */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-12"
            >
              {/* Outer glow ring */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }}
                className="absolute inset-0 -m-8"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, rgba(251,191,36,0.3), transparent, rgba(217,119,6,0.2), transparent)',
                  borderRadius: '50%',
                  filter: 'blur(2px)',
                }}
              />

              {/* Core orb */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 60px rgba(251,191,36,0.3), inset 0 0 30px rgba(251,191,36,0.1)',
                    '0 0 80px rgba(251,191,36,0.4), inset 0 0 40px rgba(251,191,36,0.15)',
                    '0 0 60px rgba(251,191,36,0.3), inset 0 0 30px rgba(251,191,36,0.1)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(217,119,6,0.15) 100%)',
                  border: '1px solid rgba(251,191,36,0.3)',
                }}
              >
                {/* Inner symbol */}
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12"
                  style={{ color: 'rgba(251,191,36,0.9)' }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path
                    fill="currentColor"
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </motion.svg>
              </motion.div>
            </motion.div>

            {/* Dream title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center mb-10 max-w-lg"
            >
              <motion.p
                className="text-amber-400/70 text-sm tracking-[0.3em] uppercase mb-4"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Creating Your Dream
              </motion.p>
              <h1
                className="text-4xl md:text-5xl font-light text-white/95 leading-tight tracking-tight"
                style={{
                  fontFamily: 'Georgia, Cambria, "Times New Roman", serif',
                }}
              >
                {dreamTitle}
              </h1>

              {/* Dream details badges */}
              {(dreamDetails.budget || dreamDetails.timeline || dreamDetails.location) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap justify-center gap-3 mt-6"
                >
                  {dreamDetails.budget && (
                    <span className="px-4 py-1.5 rounded-full text-sm text-amber-300/90 border border-amber-500/20 bg-amber-500/5">
                      {formatBudget(dreamDetails.budget)}
                    </span>
                  )}
                  {dreamDetails.timeline && (
                    <span className="px-4 py-1.5 rounded-full text-sm text-amber-300/90 border border-amber-500/20 bg-amber-500/5">
                      {formatTimeline(dreamDetails.timeline)}
                    </span>
                  )}
                  {dreamDetails.location && (
                    <span className="px-4 py-1.5 rounded-full text-sm text-amber-300/90 border border-amber-500/20 bg-amber-500/5">
                      {dreamDetails.location}
                    </span>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Progress phases - elegant horizontal line */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="w-full max-w-md"
            >
              {/* Phase indicator text */}
              <div className="text-center mb-6">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentPhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-white/60 text-base"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {phases[Math.min(currentPhase, phases.length - 1)]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Elegant progress bar */}
              <div className="relative h-px bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, rgba(251,191,36,0.6) 0%, rgba(251,191,36,0.9) 100%)',
                    boxShadow: '0 0 20px rgba(251,191,36,0.5)',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${(currentPhase / phases.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              {/* Step dots */}
              <div className="flex justify-between mt-4 px-1">
                {phases.map((_, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      animate={{
                        backgroundColor: currentPhase > index
                          ? 'rgba(251,191,36,0.9)'
                          : 'rgba(255,255,255,0.2)',
                        boxShadow: currentPhase > index
                          ? '0 0 8px rgba(251,191,36,0.6)'
                          : 'none',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Subtle bottom text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute bottom-8 text-white/30 text-xs tracking-wider"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Building something beautiful together
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DreamCreationOverlay;
