/**
 * Environment Configuration and Validation
 *
 * This module ensures all required environment variables are present
 * and properly configured before the application starts.
 */

/**
 * Validates that required environment variables are set
 * @throws {Error} If any required variables are missing
 */
const validateEnv = () => {
  const requiredVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY',
    'REACT_APP_BACKEND_URL'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      'Please copy .env.example to .env and fill in the required values.'
    );
  }

  // Validate URL formats
  const urlVars = ['REACT_APP_SUPABASE_URL', 'REACT_APP_BACKEND_URL'];
  urlVars.forEach(varName => {
    const value = process.env[varName];
    try {
      new URL(value);
    } catch (error) {
      throw new Error(`${varName} is not a valid URL: ${value}`);
    }
  });

  console.log('✅ Environment configuration validated successfully');
};

/**
 * Get environment configuration
 * @returns {Object} Configuration object
 */
const getConfig = () => {
  return {
    supabase: {
      url: process.env.REACT_APP_SUPABASE_URL,
      anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
    },
    backend: {
      url: process.env.REACT_APP_BACKEND_URL,
    },
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
};

/**
 * Checks if we're running in a secure context
 */
const isSecureContext = () => {
  if (typeof window === 'undefined') return true; // Server-side

  // In production, ensure we're using HTTPS (except localhost)
  if (process.env.NODE_ENV === 'production') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (!isLocalhost && window.location.protocol !== 'https:') {
      console.warn('⚠️ Application should be served over HTTPS in production');
      return false;
    }
  }

  return true;
};

// Validate on module load (frontend)
if (typeof window !== 'undefined') {
  try {
    validateEnv();
    isSecureContext();
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    // Don't throw in browser - let app show error UI
  }
}

export { validateEnv, getConfig, isSecureContext };
export default getConfig();
