import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLuna } from '../../context/LunaContext';

/**
 * Luna Floating Button
 *
 * An elegant floating action button that provides persistent access to Luna.
 * Features:
 * - Warm, golden glow animation
 * - Badge for pending changes
 * - Subtle breathing animation when idle
 * - Keyboard shortcut support (Ctrl/Cmd + L)
 *
 * Design: Warm editorial aesthetic with golden/amber accents
 */
const LunaFloatingButton = () => {
  const { togglePanel, isPanelOpen, pendingChanges, hasContext } = useLuna();
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const pendingCount = pendingChanges.length;
  const hasPending = pendingCount > 0;

  // Keyboard shortcut: Ctrl/Cmd + L
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        togglePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel]);

  // Show tooltip briefly on first load if context exists
  useEffect(() => {
    if (hasContext && !isPanelOpen) {
      const timer = setTimeout(() => setShowTooltip(true), 2000);
      const hideTimer = setTimeout(() => setShowTooltip(false), 6000);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [hasContext, isPanelOpen]);

  // Don't render if no milestone context or if panel is already open
  // (Panel has its own close button, no need to show floating button)
  if (!hasContext || isPanelOpen) return null;

  return (
    <>
      {/* Tooltip */}
      <AnimatePresence>
        {(showTooltip || isHovered) && !isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-24 z-[9998] pointer-events-none"
          >
            <div className="bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-2xl max-w-xs">
              <p className="text-sm font-medium">Chat with Luna</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {hasPending ? `${pendingCount} changes waiting` : 'Ask anything about your goal'}
              </p>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-stone-900 border-y-4 border-y-transparent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={togglePanel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`
          fixed bottom-6 right-6 z-[9999]
          w-16 h-16 rounded-2xl
          flex items-center justify-center
          shadow-2xl
          transition-all duration-300
          focus:outline-none focus:ring-4 focus:ring-amber-300/50
          ${isPanelOpen
            ? 'bg-stone-800 shadow-stone-900/30'
            : 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/30'
          }
        `}
        style={{
          boxShadow: isPanelOpen
            ? '0 10px 40px -10px rgba(28, 25, 23, 0.3)'
            : hasPending
              ? '0 10px 40px -10px rgba(245, 158, 11, 0.5), 0 0 20px rgba(245, 158, 11, 0.3)'
              : '0 10px 40px -10px rgba(245, 158, 11, 0.4)'
        }}
        aria-label={isPanelOpen ? 'Close Luna' : 'Open Luna'}
      >
        {/* Animated background glow */}
        {!isPanelOpen && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500"
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{ filter: 'blur(8px)', zIndex: -1 }}
          />
        )}

        {/* Icon */}
        <motion.div
          animate={isPanelOpen ? { rotate: 45 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isPanelOpen ? (
            <CloseIcon />
          ) : (
            <LunaIcon hasPending={hasPending} />
          )}
        </motion.div>

        {/* Pending Badge */}
        <AnimatePresence>
          {hasPending && !isPanelOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[24px] h-6 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
            >
              {pendingCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse animation for pending changes */}
        {hasPending && !isPanelOpen && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-amber-400"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
        )}
      </motion.button>

      {/* Keyboard shortcut hint */}
      {isHovered && !isPanelOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 right-24 z-[9998] flex items-center gap-1"
        >
          <kbd className="px-2 py-1 bg-stone-100 border border-stone-300 rounded text-xs font-mono text-stone-600">
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
          </kbd>
          <kbd className="px-2 py-1 bg-stone-100 border border-stone-300 rounded text-xs font-mono text-stone-600">
            L
          </kbd>
        </motion.div>
      )}
    </>
  );
};

/**
 * Luna Icon - Custom sparkle/star icon
 */
const LunaIcon = ({ hasPending }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    className="text-white"
  >
    {/* Main star/sparkle */}
    <motion.path
      d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
      fill="currentColor"
      animate={hasPending ? {
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0]
      } : {}}
      transition={{
        duration: 1.5,
        repeat: hasPending ? Infinity : 0,
        ease: 'easeInOut'
      }}
    />
    {/* Small sparkles */}
    <circle cx="19" cy="5" r="1.5" fill="currentColor" opacity="0.7" />
    <circle cx="5" cy="18" r="1" fill="currentColor" opacity="0.5" />
    <circle cx="20" cy="17" r="1.2" fill="currentColor" opacity="0.6" />
  </svg>
);

/**
 * Close Icon
 */
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
    <path
      d="M6 6L18 18M6 18L18 6"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export default LunaFloatingButton;
