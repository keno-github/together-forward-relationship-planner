/**
 * useVoiceInput - Robust Voice Input Hook
 *
 * PURPOSE:
 * Provides speech-to-text functionality using the Web Speech API.
 * Designed for natural conversation with tolerance for pauses.
 *
 * ROBUSTNESS FEATURES:
 * - Continuous listening mode (doesn't stop on first pause)
 * - Auto-restart on unexpected stops (keeps listening until user clicks stop)
 * - Silence buffer (waits 6 seconds of silence before considering done)
 * - Graceful handling of 'no-speech' errors (restarts instead of stopping)
 *
 * BROWSER SUPPORT:
 * - Chrome: Full support (webkitSpeechRecognition)
 * - Edge: Full support
 * - Safari: Partial support (14.1+)
 * - Firefox: Not supported (graceful fallback)
 *
 * @module useVoiceInput
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// SPEECH RECOGNITION SETUP
// ═══════════════════════════════════════════════════════════════════════════

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// ═══════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const VoiceInputError = {
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NO_SPEECH: 'NO_SPEECH',
  AUDIO_CAPTURE: 'AUDIO_CAPTURE',
  NETWORK: 'NETWORK',
  ABORTED: 'ABORTED',
  UNKNOWN: 'UNKNOWN',
};

const ERROR_MESSAGES = {
  [VoiceInputError.NOT_SUPPORTED]: 'Voice input is not supported in this browser. Try Chrome or Edge.',
  [VoiceInputError.PERMISSION_DENIED]: 'Microphone access was denied. Please allow microphone access to use voice input.',
  [VoiceInputError.NO_SPEECH]: 'No speech was detected. Please try again.',
  [VoiceInputError.AUDIO_CAPTURE]: 'Could not access the microphone. Please check your audio settings.',
  [VoiceInputError.NETWORK]: 'Network error occurred. Please check your connection.',
  [VoiceInputError.ABORTED]: 'Voice input was cancelled.',
  [VoiceInputError.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Voice input hook using Web Speech API
 *
 * @param {Object} options Configuration options
 * @param {boolean} options.continuous Keep listening through pauses (default: true)
 * @param {boolean} options.interimResults Show results while speaking (default: true)
 * @param {boolean} options.autoRestart Restart on unexpected stops (default: true)
 * @param {string} options.language Language code (default: 'en-US')
 * @param {number} options.silenceTimeout Ms of silence before stopping (default: 6000)
 * @param {number} options.maxDuration Maximum recording duration in ms (default: 120000)
 * @param {function} options.onResult Callback when final result is received
 * @param {function} options.onInterim Callback for interim results
 * @param {function} options.onEnd Callback when recognition ends
 * @param {function} options.onError Callback when error occurs
 */
export function useVoiceInput(options = {}) {
  const {
    continuous = true, // Keep listening through pauses
    interimResults = true,
    autoRestart = true, // Restart if recognition stops unexpectedly
    language = 'en-US',
    silenceTimeout = 6000, // 6 seconds of silence before stopping (generous for thought-gathering)
    maxDuration = 120000, // 2 minutes max
    onResult,
    onInterim,
    onEnd,
    onError,
  } = options;

  // State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt');

  // Refs
  const recognitionRef = useRef(null);
  const maxDurationTimeoutRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const isStoppingRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const lastSpeechTimeRef = useRef(Date.now());
  const restartAttemptsRef = useRef(0);
  const maxRestartAttempts = 5;

  const isSupported = !!SpeechRecognition;

  // ═══════════════════════════════════════════════════════════════════════
  // PERMISSION CHECK
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => setPermissionState(result.state);
        })
        .catch(() => {
          setPermissionState('prompt');
        });
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // SILENCE DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  const resetSilenceTimer = useCallback(() => {
    lastSpeechTimeRef.current = Date.now();

    // Clear existing silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    // Don't start if we're stopping or not listening
    if (isStoppingRef.current || !shouldRestartRef.current) return;

    // Clear existing
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    // Set new silence timeout
    silenceTimeoutRef.current = setTimeout(() => {
      const silenceDuration = Date.now() - lastSpeechTimeRef.current;
      console.log(`🎤 Silence detected for ${silenceDuration}ms, stopping...`);

      // User has been silent long enough, stop listening
      shouldRestartRef.current = false;
      stopListening();
    }, silenceTimeout);
  }, [silenceTimeout]);

  // ═══════════════════════════════════════════════════════════════════════
  // RECOGNITION SETUP
  // ═══════════════════════════════════════════════════════════════════════

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const recognition = new SpeechRecognition();

    // Configuration for robust listening
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      setIsListening(true);
      setError(null);
      isStoppingRef.current = false;
      restartAttemptsRef.current = 0;
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      // Reset silence timer - user is speaking
      resetSilenceTimer();

      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          currentInterim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript('');
        onResult?.(finalTranscript);

        // Start silence timer after receiving final result
        startSilenceTimer();
      }

      if (currentInterim) {
        setInterimTranscript(currentInterim);
        onInterim?.(currentInterim);
      }
    };

    recognition.onspeechstart = () => {
      console.log('🎤 Speech detected');
      resetSilenceTimer();
    };

    recognition.onspeechend = () => {
      console.log('🎤 Speech ended, waiting for more...');
      // Don't stop immediately - start silence timer
      startSilenceTimer();
    };

    recognition.onerror = (event) => {
      console.warn('🎤 Voice recognition error:', event.error);

      // Handle 'no-speech' gracefully - just restart
      if (event.error === 'no-speech') {
        console.log('🎤 No speech detected, continuing to listen...');
        // Don't show error, just restart if we should
        if (shouldRestartRef.current && autoRestart && restartAttemptsRef.current < maxRestartAttempts) {
          restartAttemptsRef.current++;
          return; // onend will handle restart
        }
        return;
      }

      // Handle 'aborted' silently if we initiated it
      if (event.error === 'aborted' && isStoppingRef.current) {
        return;
      }

      let errorType;
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorType = VoiceInputError.PERMISSION_DENIED;
          setPermissionState('denied');
          shouldRestartRef.current = false; // Don't restart on permission error
          break;
        case 'audio-capture':
          errorType = VoiceInputError.AUDIO_CAPTURE;
          shouldRestartRef.current = false;
          break;
        case 'network':
          errorType = VoiceInputError.NETWORK;
          break;
        case 'aborted':
          errorType = VoiceInputError.ABORTED;
          break;
        default:
          errorType = VoiceInputError.UNKNOWN;
      }

      const errorInfo = {
        type: errorType,
        message: ERROR_MESSAGES[errorType],
        originalError: event.error,
      };

      setError(errorInfo);
      onError?.(errorInfo);
    };

    recognition.onend = () => {
      console.log('🎤 Voice recognition ended');

      // Clear timeouts
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      // Should we restart?
      if (shouldRestartRef.current && autoRestart && !isStoppingRef.current) {
        if (restartAttemptsRef.current < maxRestartAttempts) {
          console.log(`🎤 Auto-restarting... (attempt ${restartAttemptsRef.current + 1}/${maxRestartAttempts})`);
          restartAttemptsRef.current++;

          // Small delay before restart to avoid rapid cycling
          setTimeout(() => {
            if (shouldRestartRef.current && !isStoppingRef.current) {
              try {
                recognition.start();
              } catch (err) {
                console.warn('🎤 Restart failed:', err);
                setIsListening(false);
                onEnd?.();
              }
            }
          }, 100);
          return;
        } else {
          console.log('🎤 Max restart attempts reached');
        }
      }

      setIsListening(false);
      setInterimTranscript('');

      if (!isStoppingRef.current) {
        onEnd?.();
      }
    };

    return recognition;
  }, [
    isSupported, continuous, interimResults, language,
    onResult, onInterim, onEnd, onError, autoRestart,
    resetSilenceTimer, startSilenceTimer
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // START LISTENING
  // ═══════════════════════════════════════════════════════════════════════

  const startListening = useCallback(async () => {
    if (!isSupported) {
      const errorInfo = {
        type: VoiceInputError.NOT_SUPPORTED,
        message: ERROR_MESSAGES[VoiceInputError.NOT_SUPPORTED],
      };
      setError(errorInfo);
      onError?.(errorInfo);
      return false;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
    }

    // Reset state
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    isStoppingRef.current = false;
    shouldRestartRef.current = true;
    restartAttemptsRef.current = 0;

    // Create new recognition instance
    const recognition = createRecognition();
    if (!recognition) return false;

    recognitionRef.current = recognition;

    try {
      recognition.start();

      // Set max duration timeout
      maxDurationTimeoutRef.current = setTimeout(() => {
        console.log('🎤 Max duration reached, stopping...');
        stopListening();
      }, maxDuration);

      return true;
    } catch (err) {
      console.error('🎤 Failed to start recognition:', err);

      const errorInfo = {
        type: VoiceInputError.UNKNOWN,
        message: ERROR_MESSAGES[VoiceInputError.UNKNOWN],
        originalError: err.message,
      };
      setError(errorInfo);
      onError?.(errorInfo);
      return false;
    }
  }, [isSupported, createRecognition, maxDuration, onError]);

  // ═══════════════════════════════════════════════════════════════════════
  // STOP LISTENING
  // ═══════════════════════════════════════════════════════════════════════

  const stopListening = useCallback(() => {
    console.log('🎤 Stop listening called');
    isStoppingRef.current = true;
    shouldRestartRef.current = false;

    // Clear all timeouts
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.debug('🎤 Stop error (safe to ignore):', err);
      }
    }

    setIsListening(false);
    setInterimTranscript('');
    onEnd?.();
  }, [onEnd]);

  // ═══════════════════════════════════════════════════════════════════════
  // RESET TRANSCRIPT
  // ═══════════════════════════════════════════════════════════════════════

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // RETURN API
  // ═══════════════════════════════════════════════════════════════════════

  return {
    // State
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    permissionState,

    // Actions
    startListening,
    stopListening,
    resetTranscript,

    // Computed
    hasError: !!error,
    isPermissionDenied: permissionState === 'denied',
    displayTranscript: transcript + interimTranscript,
  };
}

export default useVoiceInput;
