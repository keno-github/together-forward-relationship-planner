/**
 * Storage Manager - Handles localStorage with version-based cache invalidation
 *
 * Uses BUILD_TIMESTAMP for automatic cache invalidation on every deploy.
 * Also clears cache if it's older than MAX_CACHE_AGE to prevent stale data.
 */

// Build timestamp - set during build process, or use package version as fallback
// This ensures cache is cleared on every new deploy
export const APP_VERSION = process.env.REACT_APP_BUILD_TIME || '2.0.0';
const VERSION_KEY = 'app_version';
const CACHE_TIMESTAMP_KEY = 'cache_timestamp';

// Maximum cache age in milliseconds (4 hours for more frequent refresh)
const MAX_CACHE_AGE = 4 * 60 * 60 * 1000;

/**
 * Initialize storage - checks version AND cache age, clears if outdated
 * Call this once when the app starts
 */
export const initializeStorage = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const now = Date.now();

  // Check if cache is too old (older than 24 hours)
  const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp, 10) : Infinity;
  const isCacheExpired = cacheAge > MAX_CACHE_AGE;

  if (storedVersion !== APP_VERSION) {
    console.log(`🔄 App version changed (${storedVersion} → ${APP_VERSION}). Clearing localStorage...`);
    clearAllStorage();
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
    console.log('✅ localStorage cleared and version updated');
    return { wasCleared: true, reason: 'version_change', previousVersion: storedVersion, currentVersion: APP_VERSION };
  }

  if (isCacheExpired) {
    console.log(`🔄 Cache expired (${Math.round(cacheAge / 3600000)}h old). Clearing localStorage...`);
    clearAllStorage();
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
    console.log('✅ localStorage cleared due to age');
    return { wasCleared: true, reason: 'cache_expired', cacheAge: Math.round(cacheAge / 3600000), currentVersion: APP_VERSION };
  }

  // Update timestamp on successful load to extend cache life on active use
  localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());

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
  APP_VERSION,
  MAX_CACHE_AGE
};
