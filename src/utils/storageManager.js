/**
 * Storage Manager - Handles localStorage with version-based cache invalidation
 *
 * When APP_VERSION changes, all localStorage data is automatically cleared
 * to prevent stale data issues during development.
 */

// Increment this when you make breaking changes to stored data structures
export const APP_VERSION = '1.0.0';
const VERSION_KEY = 'app_version';

/**
 * Initialize storage - checks version and clears if outdated
 * Call this once when the app starts
 */
export const initializeStorage = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);

  if (storedVersion !== APP_VERSION) {
    console.log(`🔄 App version changed (${storedVersion} → ${APP_VERSION}). Clearing localStorage...`);
    clearAllStorage();
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    console.log('✅ localStorage cleared and version updated');
    return { wasCleared: true, previousVersion: storedVersion, currentVersion: APP_VERSION };
  }

  console.log(`✅ Storage version ${APP_VERSION} matches. Using cached data.`);
  return { wasCleared: false, previousVersion: storedVersion, currentVersion: APP_VERSION };
};

/**
 * Clear all app-related localStorage data
 * Preserves Supabase auth session
 */
export const clearAllStorage = () => {
  // Keys to preserve (authentication)
  const preserveKeys = [
    'sb-', // Supabase keys start with sb-
  ];

  // Get all keys
  const allKeys = Object.keys(localStorage);

  // Clear non-preserved keys
  allKeys.forEach(key => {
    const shouldPreserve = preserveKeys.some(prefix => key.startsWith(prefix));
    if (!shouldPreserve) {
      localStorage.removeItem(key);
    }
  });

  // Set the new version
  localStorage.setItem(VERSION_KEY, APP_VERSION);
};

/**
 * Reset app data (callable from UI)
 * Clears all data and reloads the page
 */
export const resetAppData = () => {
  console.log('🗑️ Resetting all app data...');
  clearAllStorage();
  window.location.reload();
};

/**
 * Get storage info for debugging
 */
export const getStorageInfo = () => {
  const keys = Object.keys(localStorage);
  const items = {};
  let totalSize = 0;

  keys.forEach(key => {
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    totalSize += size;
    items[key] = {
      size: `${(size / 1024).toFixed(2)} KB`,
      preview: value.substring(0, 100) + (value.length > 100 ? '...' : '')
    };
  });

  return {
    version: localStorage.getItem(VERSION_KEY) || 'not set',
    itemCount: keys.length,
    totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
    items
  };
};

/**
 * Safe localStorage getter with error handling
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Safe localStorage setter with error handling
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

export default {
  initializeStorage,
  clearAllStorage,
  resetAppData,
  getStorageInfo,
  getStorageItem,
  setStorageItem,
  APP_VERSION
};
