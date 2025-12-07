/**
 * Responsive Utilities
 *
 * Shared breakpoints and responsive helpers for web and future mobile app.
 * These values match Tailwind defaults for consistency.
 */

// Breakpoint values (in pixels)
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Check if current viewport is mobile-sized
 * @returns {boolean}
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
};

/**
 * Check if current viewport is tablet-sized
 * @returns {boolean}
 */
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
};

/**
 * Check if current viewport is desktop-sized
 * @returns {boolean}
 */
export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
};

/**
 * Get current breakpoint name
 * @returns {string} - 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 */
export const getCurrentBreakpoint = () => {
  if (typeof window === 'undefined') return 'md';

  const width = window.innerWidth;

  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

/**
 * Check if device supports touch
 * @returns {boolean}
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Check if running in standalone mode (PWA)
 * @returns {boolean}
 */
export const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

/**
 * Get safe area insets for notched devices
 * @returns {Object} - { top, right, bottom, left }
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined' || !CSS.supports('padding-top: env(safe-area-inset-top)')) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const div = document.createElement('div');
  div.style.paddingTop = 'env(safe-area-inset-top)';
  div.style.paddingRight = 'env(safe-area-inset-right)';
  div.style.paddingBottom = 'env(safe-area-inset-bottom)';
  div.style.paddingLeft = 'env(safe-area-inset-left)';
  document.body.appendChild(div);

  const styles = getComputedStyle(div);
  const insets = {
    top: parseInt(styles.paddingTop) || 0,
    right: parseInt(styles.paddingRight) || 0,
    bottom: parseInt(styles.paddingBottom) || 0,
    left: parseInt(styles.paddingLeft) || 0
  };

  document.body.removeChild(div);
  return insets;
};

export default {
  BREAKPOINTS,
  isMobile,
  isTablet,
  isDesktop,
  getCurrentBreakpoint,
  isTouchDevice,
  isStandalone,
  getSafeAreaInsets
};
