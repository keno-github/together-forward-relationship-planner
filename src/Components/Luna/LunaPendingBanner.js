import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRight, X, Sparkles } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

/**
 * Luna Pending Banner
 *
 * A sticky banner that appears at the top of the page when:
 * - Luna has pending changes waiting for confirmation
 * - The chat panel is closed
 *
 * This ensures users never forget about pending changes
 * and can easily access them from anywhere.
 *
 * Design: Warm amber/gold gradient, matches the editorial aesthetic
 */
const LunaPendingBanner = () => {
  const {
    pendingChanges,
    isPanelOpen,
    openPanel,
    rejectAllChanges,
    hasContext
  } = useLuna();

  const pendingCount = pendingChanges.length;

  // Only show when:
  // - There are pending changes
  // - Panel is NOT open
  // - We have a milestone context
  const shouldShow = pendingCount > 0 && !isPanelOpen && hasContext;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9980] px-4 py-2"
        >
          <div className="max-w-4xl mx-auto">
            <div
              className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-xl shadow-lg overflow-hidden"
              style={{
                boxShadow: '0 4px 20px -5px rgba(245, 158, 11, 0.2), 0 10px 30px -10px rgba(0,0,0,0.1)'
              }}
            >
              <div className="px-4 py-3 flex items-center justify-between gap-4">
                {/* Left: Icon and Message */}
                <div className="flex items-center gap-3 min-w-0">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20"
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </motion.div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-stone-900 text-sm">
                        Luna has {pendingCount} proposed {pendingCount === 1 ? 'change' : 'changes'}
                      </h4>
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-amber-500"
                      />
                    </div>
                    <p className="text-xs text-stone-500 truncate">
                      {getChangeSummary(pendingChanges)}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openPanel}
                    className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-md"
                  >
                    Review
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>

                  <button
                    onClick={rejectAllChanges}
                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Dismiss all changes"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar animation */}
              <motion.div
                className="h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Get a summary of the pending changes
 */
const getChangeSummary = (changes) => {
  if (changes.length === 0) return '';

  if (changes.length === 1) {
    return changes[0].summary;
  }

  // Group by type
  const types = changes.reduce((acc, change) => {
    const type = getTypeLabel(change.type);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Create summary
  const parts = Object.entries(types).map(([type, count]) => {
    return count > 1 ? `${count} ${type.toLowerCase()}s` : `1 ${type.toLowerCase()}`;
  });

  if (parts.length === 1) {
    return parts[0];
  } else if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  } else {
    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
  }
};

/**
 * Get readable type label
 */
const getTypeLabel = (type) => {
  const labels = {
    title_update: 'title update',
    description_update: 'description update',
    budget_update: 'budget update',
    date_update: 'date update',
    add_phase: 'new phase',
    modify_phase: 'phase edit',
    remove_phase: 'phase removal',
    add_task: 'new task',
    update_task: 'task update',
    delete_task: 'task deletion',
    regenerate_roadmap: 'roadmap regeneration'
  };
  return labels[type] || 'change';
};

export default LunaPendingBanner;
