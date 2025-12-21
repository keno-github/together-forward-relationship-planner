/**
 * SaveDreamModal Component
 *
 * Exit-intent modal that appears when a guest user tries to leave.
 * Uses warm, supportive messaging rather than alarming warnings.
 *
 * Design:
 * - Clean, centered modal matching app aesthetic
 * - Warm messaging, not pushy or alarming
 * - Shows dream preview for emotional connection
 * - Two clear actions: save or leave
 *
 * @module SaveDreamModal
 */

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Clock, Users, X } from 'lucide-react';
import { markExitModalShown, getGuestDreamMeta } from '../../services/guestDreamService';

const SaveDreamModal = ({
  isOpen = false,
  onSave,
  onLeave,
  onClose,
  dreamData = {}
}) => {
  useEffect(() => {
    if (isOpen) {
      const meta = getGuestDreamMeta();
      if (!meta.exitModalShown) {
        markExitModalShown();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSave = useCallback(() => {
    onSave?.();
  }, [onSave]);

  const handleLeave = useCallback(() => {
    onLeave?.();
  }, [onLeave]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }, [onClose]);

  const {
    title = 'Your Dream',
    partner1 = 'You',
    partner2 = 'Your Partner',
    duration = '12 months'
  } = dreamData;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 400 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 pt-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <h2
                  className="text-lg font-semibold text-stone-900"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Before you go
                </h2>
              </div>

              {/* Dream preview */}
              <div className="bg-stone-50 rounded-xl p-4 mb-4 border border-stone-100">
                <p
                  className="font-medium text-stone-900 mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {title}
                </p>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {partner1} & {partner2}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {duration}
                  </span>
                </div>
              </div>

              {/* Message */}
              <p className="text-sm text-stone-600 mb-5 leading-relaxed">
                This dream is only saved in your browser. If you leave now, you might lose it.
              </p>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  className="w-full py-2.5 px-4 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors"
                >
                  Create free account
                </button>
                <button
                  onClick={handleLeave}
                  className="w-full py-2.5 px-4 text-stone-500 text-sm font-medium rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Leave anyway
                </button>
              </div>

              {/* Note */}
              <p className="text-xs text-stone-400 text-center mt-4">
                Saved for 7 days in this browser
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SaveDreamModal;
