/**
 * Platform Detection Utilities
 *
 * Abstraction layer for platform-specific code.
 * Makes it easier to migrate to React Native in the future.
 */

// Platform constants
export const PLATFORMS = {
  WEB: 'web',
  IOS: 'ios',
  ANDROID: 'android'
};

/**
 * Get current platform
 * @returns {string} - 'web' | 'ios' | 'android'
 */
export const getPlatform = () => {
  // In React Native, this would use Platform.OS
  // For now, always return 'web'
  return PLATFORMS.WEB;
};

/**
 * Check if running on web
 * @returns {boolean}
 */
export const isWeb = () => getPlatform() === PLATFORMS.WEB;

/**
 * Check if running on iOS (native)
 * @returns {boolean}
 */
export const isIOS = () => getPlatform() === PLATFORMS.IOS;

/**
 * Check if running on Android (native)
 * @returns {boolean}
 */
export const isAndroid = () => getPlatform() === PLATFORMS.ANDROID;

/**
 * Check if running on mobile (native app)
 * @returns {boolean}
 */
export const isNative = () => isIOS() || isAndroid();

/**
 * Check if running in iOS Safari (web)
 * @returns {boolean}
 */
export const isIOSSafari = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
};

/**
 * Check if running in Android Chrome (web)
 * @returns {boolean}
 */
export const isAndroidChrome = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Android/.test(ua) && /Chrome/.test(ua);
};

/**
 * Check if running in mobile browser
 * @returns {boolean}
 */
export const isMobileBrowser = () => isIOSSafari() || isAndroidChrome();

/**
 * Platform-specific storage
 * Abstraction over localStorage/AsyncStorage
 */
export const storage = {
  async get(key) {
    if (isWeb()) {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
    // In React Native: return AsyncStorage.getItem(key)
    return null;
  },

  async set(key, value) {
    if (isWeb()) {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
    // In React Native: return AsyncStorage.setItem(key, JSON.stringify(value))
    return false;
  },

  async remove(key) {
    if (isWeb()) {
      localStorage.removeItem(key);
      return true;
    }
    // In React Native: return AsyncStorage.removeItem(key)
    return false;
  },

  async clear() {
    if (isWeb()) {
      localStorage.clear();
      return true;
    }
    // In React Native: return AsyncStorage.clear()
    return false;
  }
};

/**
 * Platform-specific haptic feedback
 * No-op on web, would use react-native-haptic-feedback on native
 */
export const haptics = {
  impact(style = 'medium') {
    // On web, we could use the Vibration API for basic feedback
    if (isWeb() && navigator.vibrate) {
      const durations = {
        light: 10,
        medium: 20,
        heavy: 30
      };
      navigator.vibrate(durations[style] || 20);
    }
    // In React Native: HapticFeedback.trigger(style)
  },

  notification(type = 'success') {
    if (isWeb() && navigator.vibrate) {
      const patterns = {
        success: [10, 50, 10],
        warning: [20, 50, 20],
        error: [30, 50, 30, 50, 30]
      };
      navigator.vibrate(patterns[type] || patterns.success);
    }
    // In React Native: HapticFeedback.trigger(type)
  },

  selection() {
    if (isWeb() && navigator.vibrate) {
      navigator.vibrate(5);
    }
    // In React Native: HapticFeedback.trigger('selection')
  }
};

/**
 * Open URL (handles web and native differently)
 * @param {string} url - URL to open
 * @param {boolean} external - Open in external browser (native only)
 */
export const openURL = (url, external = false) => {
  if (isWeb()) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  // In React Native: Linking.openURL(url)
};

/**
 * Get status bar height
 * @returns {number}
 */
export const getStatusBarHeight = () => {
  if (isWeb()) {
    // On web, use CSS env() for safe area
    return 0;
  }
  // In React Native: return StatusBar.currentHeight || 0
  return 0;
};

export default {
  PLATFORMS,
  getPlatform,
  isWeb,
  isIOS,
  isAndroid,
  isNative,
  isIOSSafari,
  isAndroidChrome,
  isMobileBrowser,
  storage,
  haptics,
  openURL,
  getStatusBarHeight
};
