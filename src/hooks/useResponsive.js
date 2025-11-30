import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoint definitions matching Tailwind defaults
 */
const BREAKPOINTS = {
  xs: 375,   // Small phones
  sm: 640,   // Large phones / small tablets
  md: 768,   // Tablets - THIS IS THE MOBILE/DESKTOP BOUNDARY
  lg: 1024,  // Small laptops
  xl: 1280,  // Desktops
  '2xl': 1536, // Large desktops
};

/**
 * Custom hook for responsive design
 * Provides current viewport info and boolean flags for common breakpoints
 *
 * @returns {Object} Responsive state object
 *
 * @example
 * const { isMobile, isTablet, isDesktop, width } = useResponsive();
 *
 * return isMobile ? <MobileView /> : <DesktopView />;
 */
export const useResponsive = () => {
  // Initialize with safe defaults (assumes desktop for SSR)
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        breakpoint: 'lg',
        orientation: 'landscape',
      };
    }

    return getResponsiveState();
  });

  /**
   * Calculate responsive state from window dimensions
   */
  function getResponsiveState() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < BREAKPOINTS.md,           // < 768px
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg, // 768-1023px
      isDesktop: width >= BREAKPOINTS.lg,          // >= 1024px
      isLargeDesktop: width >= BREAKPOINTS.xl,     // >= 1280px
      breakpoint: getBreakpoint(width),
      orientation: width > height ? 'landscape' : 'portrait',
    };
  }

  /**
   * Get current breakpoint name
   */
  function getBreakpoint(width) {
    if (width < BREAKPOINTS.xs) return 'xs';
    if (width < BREAKPOINTS.sm) return 'xs';
    if (width < BREAKPOINTS.md) return 'sm';
    if (width < BREAKPOINTS.lg) return 'md';
    if (width < BREAKPOINTS.xl) return 'lg';
    if (width < BREAKPOINTS['2xl']) return 'xl';
    return '2xl';
  }

  /**
   * Handle resize events with debounce
   */
  const handleResize = useCallback(() => {
    setState(getResponsiveState());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial state
    handleResize();

    // Debounced resize handler
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);

    // Also listen for orientation change on mobile
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  return state;
};

/**
 * Hook to detect if keyboard is open (mobile)
 * Useful for adjusting UI when virtual keyboard appears
 *
 * @returns {Object} { isKeyboardOpen, keyboardHeight }
 */
export const useKeyboardDetection = () => {
  const [keyboardState, setKeyboardState] = useState({
    isKeyboardOpen: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use visualViewport API if available (most reliable)
    if (window.visualViewport) {
      const handleViewportResize = () => {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = Math.max(0, windowHeight - viewportHeight);

        setKeyboardState({
          isKeyboardOpen: keyboardHeight > 100, // Threshold to avoid false positives
          keyboardHeight,
        });

        // Toggle body class for CSS hooks
        if (keyboardHeight > 100) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
      };

      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => window.visualViewport.removeEventListener('resize', handleViewportResize);
    }

    // Fallback: detect focus on input elements
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setKeyboardState(prev => ({ ...prev, isKeyboardOpen: true }));
        document.body.classList.add('keyboard-open');
      }
    };

    const handleBlur = () => {
      setKeyboardState({ isKeyboardOpen: false, keyboardHeight: 0 });
      document.body.classList.remove('keyboard-open');
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return keyboardState;
};

/**
 * Hook to check if a specific breakpoint is active
 *
 * @param {string} breakpoint - Breakpoint to check ('sm', 'md', 'lg', 'xl')
 * @param {string} direction - 'up' (>=) or 'down' (<)
 * @returns {boolean}
 *
 * @example
 * const isMediumUp = useBreakpoint('md', 'up'); // >= 768px
 * const isSmallDown = useBreakpoint('sm', 'down'); // < 640px
 */
export const useBreakpoint = (breakpoint, direction = 'up') => {
  const { width } = useResponsive();
  const breakpointValue = BREAKPOINTS[breakpoint] || 768;

  if (direction === 'up') {
    return width >= breakpointValue;
  }
  return width < breakpointValue;
};

/**
 * Hook for safe area insets (for notched phones)
 *
 * @returns {Object} { top, right, bottom, left }
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-top') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-right') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-bottom') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-left') || '0', 10),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};

export default useResponsive;
