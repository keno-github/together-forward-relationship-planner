/**
 * VoiceInputButton - Premium Voice Input Component
 *
 * PURPOSE:
 * Provides an elegant, accessible microphone button for voice-to-text input.
 * Designed to integrate seamlessly with chat interfaces.
 *
 * STATES:
 * - idle: Ready to record (microphone icon)
 * - listening: Recording in progress (pulsing animation)
 * - processing: Processing speech (optional loading state)
 * - error: Error occurred (error indicator)
 * - unsupported: Browser doesn't support voice input
 *
 * ACCESSIBILITY:
 * - Full keyboard support (Space/Enter to toggle)
 * - ARIA labels for screen readers
 * - Visual state indicators
 * - Focus management
 *
 * @module VoiceInputButton
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';
import { useVoiceInput, VoiceInputError } from '../hooks/useVoiceInput';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const VoiceInputButton = ({
  onTranscript,
  onListeningChange,
  disabled = false,
  size = 'md',
  className = '',
  showTooltip = true,
}) => {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Voice input hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    permissionState,
    startListening,
    stopListening,
    resetTranscript,
    displayTranscript,
  } = useVoiceInput({
    continuous: false,
    interimResults: true,
    language: 'en-US',
    maxDuration: 30000, // 30 seconds max for chat messages
    onResult: (text) => {
      console.log('🎤 Voice result:', text);
    },
    onEnd: () => {
      console.log('🎤 Voice input ended');
    },
    onError: (err) => {
      console.error('🎤 Voice error:', err);
      setErrorMessage(err.message);
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    },
  });

  // Notify parent of transcript changes
  useEffect(() => {
    if (displayTranscript) {
      onTranscript?.(displayTranscript);
    }
  }, [displayTranscript, onTranscript]);

  // Notify parent of listening state changes
  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  // Toggle recording
  const handleToggle = useCallback(() => {
    if (disabled) return;

    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [disabled, isListening, startListening, stopListening, resetTranscript]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  // If not supported, show disabled state with tooltip
  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          type="button"
          disabled
          className={`
            ${sizeClasses[size]}
            rounded-full bg-stone-100 text-stone-400
            flex items-center justify-center
            cursor-not-allowed opacity-50
            ${className}
          `}
          aria-label="Voice input not supported"
        >
          <MicOff size={iconSizes[size]} />
        </button>

        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5
                          bg-stone-900 text-white text-xs rounded-lg whitespace-nowrap
                          opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Voice input not supported in this browser
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                            border-4 border-transparent border-t-stone-900" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Button */}
      <motion.button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center
          transition-all duration-200 relative
          focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2
          ${
            isListening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : disabled
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
          }
          ${className}
        `}
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
        aria-pressed={isListening}
      >
        {/* Pulsing ring when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              {/* Outer pulse */}
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{
                  scale: [1, 1.5, 1.5],
                  opacity: [0.6, 0, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute inset-0 rounded-full bg-red-500"
              />
              {/* Inner pulse */}
              <motion.div
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{
                  scale: [1, 1.3, 1.3],
                  opacity: [0.4, 0, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 0.2,
                }}
                className="absolute inset-0 rounded-full bg-red-500"
              />
            </>
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div
          animate={isListening ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
          className="relative z-10"
        >
          {isListening ? (
            <Mic size={iconSizes[size]} className="animate-pulse" />
          ) : (
            <Mic size={iconSizes[size]} />
          )}
        </motion.div>
      </motion.button>

      {/* Recording indicator dot */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full
                       border-2 border-white shadow-sm"
          >
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-full h-full rounded-full bg-red-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast - anchored to right to prevent overflow */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-3
                       bg-red-50 border border-red-200 rounded-lg px-3 py-2
                       shadow-lg min-w-[200px] max-w-[280px]"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-tight">{errorMessage}</p>
            </div>
            <div className="absolute top-full right-3
                            border-4 border-transparent border-t-red-50" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listening tooltip - anchored to right to prevent overflow */}
      <AnimatePresence>
        {isListening && showTooltip && !showError && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full right-0 mb-3
                       bg-stone-900 text-white text-xs rounded-lg px-3 py-1.5
                       whitespace-nowrap shadow-lg"
          >
            Listening... tap to stop
            <div className="absolute top-full right-3
                            border-4 border-transparent border-t-stone-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// INLINE VOICE INPUT (for text field integration)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A version of VoiceInputButton designed to sit inside a text input field
 */
export const InlineVoiceInput = ({
  onTranscript,
  onListeningChange,
  disabled = false,
  className = '',
}) => {
  return (
    <VoiceInputButton
      onTranscript={onTranscript}
      onListeningChange={onListeningChange}
      disabled={disabled}
      size="sm"
      showTooltip={true}
      className={`hover:bg-stone-200 ${className}`}
    />
  );
};

export default VoiceInputButton;
