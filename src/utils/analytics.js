/**
 * Google Analytics 4 Integration
 *
 * This utility initializes and manages Google Analytics tracking
 * for the TwogetherForward app.
 */

import ReactGA from 'react-ga4';

const MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-E59VT1NB6H';

/**
 * Initialize Google Analytics
 * Only runs in production to avoid polluting analytics with dev data
 */
export const initGA = () => {
  // Only initialize in production or if explicitly enabled
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction || process.env.REACT_APP_ENABLE_GA === 'true') {
    ReactGA.initialize(MEASUREMENT_ID, {
      gaOptions: {
        siteSpeedSampleRate: 100, // Track all page load times
      },
    });
    console.log('✅ Google Analytics initialized');
  } else {
    console.log('🔍 Google Analytics disabled in development');
  }
};

/**
 * Track page views
 * Call this on route changes
 */
export const trackPageView = (path, title) => {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_GA === 'true') {
    ReactGA.send({ hitType: 'pageview', page: path, title: title });
  }
};

/**
 * Track custom events
 * Use this to track specific user actions
 *
 * @param {string} category - Event category (e.g., 'Luna AI', 'Goal Creation')
 * @param {string} action - Event action (e.g., 'chat_message_sent', 'roadmap_created')
 * @param {string} label - Optional label for more context
 * @param {number} value - Optional numeric value
 */
export const trackEvent = (category, action, label = '', value = undefined) => {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_GA === 'true') {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
};

/**
 * Track Luna AI interactions
 */
export const trackLunaInteraction = (action, label = '') => {
  trackEvent('Luna AI', action, label);
};

/**
 * Track goal/roadmap actions
 */
export const trackGoalAction = (action, goalType = '') => {
  trackEvent('Goal Management', action, goalType);
};

/**
 * Track user authentication actions
 */
export const trackAuthAction = (action) => {
  trackEvent('Authentication', action);
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackLunaInteraction,
  trackGoalAction,
  trackAuthAction,
};
