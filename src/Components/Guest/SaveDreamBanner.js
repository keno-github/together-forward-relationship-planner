/**
 * SaveDreamBanner Component
 *
 * A refined, non-intrusive sign-up prompt that appears after a guest user
 * has created and viewed their dream. Matches the app's warm editorial aesthetic.
 *
 * Design:
 * - Clean card matching Dashboard style
 * - Warm, human copy (not pushy)
 * - Cormorant Garamond headings, DM Sans body
 * - Subtle entrance, dismissible
 *
 * @module SaveDreamBanner
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { markSignUpPromptShown, getGuestDreamMeta } from '../../services/guestDreamService';

const SaveDreamBanner = ({
  isVisible = false,
  onCreateAccount,
  onDismiss,
  partner1 = null,
  partner2 = null
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    const meta = getGuestDreamMeta();
    if (meta.signUpPromptShown) {
      setHasBeenShown(true);
    }
  }, []);

  useEffect(() => {
    if (isVisible && !hasBeenShown) {
      markSignUpPromptShown();
      setHasBeenShown(true);
    }
  }, [isVisible, hasBeenShown]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || !isVisible) {
    return null;
  }

  const names = partner1 && partner2 ? `${partner1} & ${partner2}'s` : 'Your';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 400,
          delay: 0.1
        }}
        className="fixed bottom-0 left-0 right-0 z-[9980] p-4 pointer-events-none"
      >
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="currentColor" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        className="text-base font-semibold text-stone-900 mb-1"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {names} dream is ready
                      </h3>
                      <p className="text-sm text-stone-500 leading-relaxed">
                        Right now it's only saved here. Create a free account to keep it forever.
                      </p>
                    </div>

                    <button
                      onClick={handleDismiss}
                      className="flex-shrink-0 p-1 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* CTA */}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={onCreateAccount}
                      className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
                    >
                      Save my dream
                    </button>
                    <span className="text-xs text-stone-400">
                      Free, takes 10 seconds
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SaveDreamBanner;
