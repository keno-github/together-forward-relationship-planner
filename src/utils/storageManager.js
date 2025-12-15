/**
 * Storage Manager - Netflix-grade cache management
 *
 * PHILOSOPHY: Cache is PRECIOUS - never clear it aggressively
 * - React Query handles data freshness through background refetch
 * - Only clear cache on MAJOR version changes (breaking schema changes)
 * - Selective invalidation > nuclear option
 *
 * Why aggressive cache clearing is BAD:
 * - Forces full page reloads with spinners
 * - Loses user's context and scroll position
 * - Makes app feel slow and unresponsive
 * - Netflix/Twitter NEVER clear cache on navigation
 */

// Only the MAJOR version triggers cache clear (e.g., 2.x.x -> 3.x.x)
// Minor updates should NOT clear cache - React Query handles freshness
export const APP_VERSION = process.env.REACT_APP_BUILD_TIME || '2.0.0';
const VERSION_KEY = 'app_version';
const CACHE_TIMESTAMP_KEY = 'cache_timestamp';

// Maximum cache age: 7 DAYS (not 4 hours!)
// Let React Query handle data freshness through staleTime/refetch
// 7 days is safe - long enough for good UX, short enough to recover from issues
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Get major version number (e.g., "2.1.3" -> "2")
 * Only major version changes should trigger cache clear
 */
const getMajorVersion = (version) => {
  if (!version) return '0';
  const parts = version.split('.');
  return parts[0] || '0';
};

/**
 * Initialize storage - Netflix-grade cache preservation
 *
 * ONLY clears cache when:
 * 1. MAJOR version changes (2.x -> 3.x) - indicates breaking schema changes
 * 2. Cache is older than 30 days (user hasn't visited in a month)
 *
 * DOES NOT clear cache when:
 * - Minor version changes (2.1 -> 2.2)
 * - Patch version changes (2.1.1 -> 2.1.2)
 * - Every deploy (this was killing performance!)
 */
export const initializeStorage = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const now = Date.now();

  // Check if cache is too old (older than 30 days)
  const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp, 10) : Infinity;
  const isCacheExpired = cacheAge > MAX_CACHE_AGE;

  // Only clear on MAJOR version change (breaking changes)
  const storedMajor = getMajorVersion(storedVersion);
  const currentMajor = getMajorVersion(APP_VERSION);
  const isMajorVersionChange = storedMajor !== currentMajor && storedVersion !== null;

  if (isMajorVersionChange) {
    console.log(`🔄 MAJOR version change (${storedVersion} → ${APP_VERSION}). Clearing localStorage...`);
    clearAllStorage();
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
    console.log('✅ localStorage cleared due to major version update');
    return { wasCleared: true, reason: 'major_version_change', previousVersion: storedVersion, currentVersion: APP_VERSION };
  }

  // Update version without clearing (minor/patch updates)
  if (storedVersion !== APP_VERSION) {
    console.log(`📦 Minor update (${storedVersion} → ${APP_VERSION}). Keeping cache intact.`);
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }

  if (isCacheExpired) {
    console.log(`🔄 Cache expired (${Math.round(cacheAge / 86400000)} days old). Clearing localStorage...`);
    clearAllStorage();
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
    console.log('✅ localStorage cleared due to age (30+ days)');
    return { wasCleared: true, reason: 'cache_expired', cacheAgeDays: Math.round(cacheAge / 86400000), currentVersion: APP_VERSION };
  }

  // Update timestamp on successful load to extend cache life on active use
  localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());

  console.log(`✅ Storage version ${APP_VERSION} validated. Cache preserved for instant rendering.`);
  return { wasCleared: false, previousVersion: storedVersion, currentVersion: APP_VERSION };
};

/**
 * Clear app-related localStorage data
 * PRESERVES critical data that should never be cleared:
 * - Supabase auth session (sb-*)
 * - React Query persisted cache (tf-query-cache)
 * - Pending invite codes
 */
export const clearAllStorage = () => {
  // Keys/prefixes to PRESERVE (never clear these)
  const preservePrefixes = [
    'sb-',                          // Supabase auth session
    'tf-query-cache',               // React Query persisted cache (CRITICAL!)
    'pending_invite_code',          // Partner invite in progress
    'pending_partner_invite_code',  // Partner invite in progress
  ];

  // Get all keys
  const allKeys = Object.keys(localStorage);

  // Clear non-preserved keys
  allKeys.forEach(key => {
    const shouldPreserve = preservePrefixes.some(prefix =>
      key.startsWith(prefix) || key === prefix
    );
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
