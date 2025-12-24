/**
 * useVoiceInput - Staff Engineer Level Voice Input Hook
 *
 * PURPOSE:
 * Provides speech-to-text functionality using the Web Speech API.
 * Designed for seamless integration with chat interfaces.
 *
 * ARCHITECTURE:
 * - Uses native Web Speech API (SpeechRecognition)
 * - Progressive enhancement: works without voice, enhanced with it
 * - Graceful degradation: falls back cleanly on unsupported browsers
 * - Real-time transcription with interim results
 *
 * BROWSER SUPPORT:
 * - Chrome: Full support (webkitSpeechRecognition)
 * - Edge: Full support
 * - Safari: Partial support (14.1+)
 * - Firefox: Not supported (graceful fallback)
 *
 * USAGE:
 * ```jsx
 * const {
 *   isListening,
 *   transcript,
 *   interimTranscript,
 *   error,
 *   isSupported,
 *   startListening,
 *   stopListening,
 *   resetTranscript
 * } = useVoiceInput({
 *   continuous: false,
 *   onResult: (text) => setInput(text),
 *   onEnd: () => console.log('Recording stopped'),
 *   language: 'en-US'
 * });
 * ```
 *
 * @module useVoiceInput
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// SPEECH RECOGNITION SETUP
// ═══════════════════════════════════════════════════════════════════════════

// Get the SpeechRecognition constructor (with vendor prefixes)
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

// Human-readable error messages
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
 * @param {boolean} options.continuous Keep listening after user stops speaking
 * @param {boolean} options.interimResults Show results while user is speaking
 * @param {string} options.language Language code (default: 'en-US')
 * @param {function} options.onResult Callback when final result is received
 * @param {function} options.onInterim Callback for interim results
 * @param {function} options.onEnd Callback when recognition ends
 * @param {function} options.onError Callback when error occurs
 * @param {number} options.maxDuration Maximum recording duration in ms (default: 60000)
 */
export function useVoiceInput(options = {}) {
  const {
    continuous = false,
    interimResults = true,
    language = 'en-US',
    onResult,
    onInterim,
    onEnd,
    onError,
    maxDuration = 60000, // 60 seconds max
  } = options;

  // State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'

  // Refs
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const isStoppingRef = useRef(false);

  // Check if speech recognition is supported
  const isSupported = !!SpeechRecognition;

  // ═══════════════════════════════════════════════════════════════════════
  // PERMISSION CHECK
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    // Check microphone permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => setPermissionState(result.state);
        })
        .catch(() => {
          // Permission query not supported, assume prompt
          setPermissionState('prompt');
        });
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // RECOGNITION SETUP
  // ═══════════════════════════════════════════════════════════════════════

  const setupRecognition = useCallback(() => {
    if (!isSupported) return null;

    const recognition = new SpeechRecognition();

    // Configuration
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
    };

    recognition.onresult = (event) => {
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
      }

      if (currentInterim) {
        setInterimTranscript(currentInterim);
        onInterim?.(currentInterim);
      }
    };

    recognition.onerror = (event) => {
      console.error('🎤 Voice recognition error:', event.error);

      let errorType;
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorType = VoiceInputError.PERMISSION_DENIED;
          setPermissionState('denied');
          break;
        case 'no-speech':
          errorType = VoiceInputError.NO_SPEECH;
          break;
        case 'audio-capture':
          errorType = VoiceInputError.AUDIO_CAPTURE;
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
      setIsListening(false);
      setInterimTranscript('');

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Only call onEnd if we're not in the middle of stopping
      if (!isStoppingRef.current) {
        onEnd?.();
      }
    };

    return recognition;
  }, [isSupported, continuous, interimResults, language, onResult, onInterim, onEnd, onError]);

  // ═══════════════════════════════════════════════════════════════════════
  // START LISTENING
  // ═══════════════════════════════════════════════════════════════════════

  const startListening = useCallback(async () => {
    // Check support
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
      recognitionRef.current.abort();
    }

    // Reset state
    setTranscript('');
    setInterimTranscript('');
    setError(null);

    // Create new recognition instance
    const recognition = setupRecognition();
    if (!recognition) return false;

    recognitionRef.current = recognition;

    try {
      // Start recognition
      recognition.start();

      // Set max duration timeout
      timeoutRef.current = setTimeout(() => {
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
  }, [isSupported, setupRecognition, maxDuration, onError]);

  // ═══════════════════════════════════════════════════════════════════════
  // STOP LISTENING
  // ═══════════════════════════════════════════════════════════════════════

  const stopListening = useCallback(() => {
    isStoppingRef.current = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore errors when stopping
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
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
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
