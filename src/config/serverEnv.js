/**
 * Server-side Environment Configuration and Validation
 *
 * This module ensures all required environment variables are set
 * for the backend server before it starts.
 */

require('dotenv').config();

/**
 * Validates that required server environment variables are set
 * @throws {Error} If any required variables are missing
 */
const validateServerEnv = () => {
  const requiredVars = [
    'CLAUDE_API_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`  - ${v}`));
    console.error('\nPlease copy .env.example to .env and fill in the required values.');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Claude API key format
  if (!process.env.CLAUDE_API_KEY.startsWith('sk-ant-')) {
    console.warn('⚠️  CLAUDE_API_KEY does not match expected format (should start with sk-ant-)');
  }

  // Check if we're accidentally using placeholder values
  const placeholders = ['YOUR_KEY_HERE', 'your_', 'YOUR_PROJECT'];
  const suspiciousVars = Object.keys(process.env).filter(key => {
    const value = process.env[key];
    return placeholders.some(placeholder => value && value.includes(placeholder));
  });

  if (suspiciousVars.length > 0) {
    console.error('❌ Environment variables appear to contain placeholder values:');
    suspiciousVars.forEach(v => console.error(`  - ${v}`));
    throw new Error('Please replace placeholder values in .env with actual credentials');
  }

  console.log('✅ Server environment configuration validated successfully');
};

/**
 * Get server configuration
 * @returns {Object} Server configuration object
 */
const getServerConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  let allowedOrigins;

  if (isProduction) {
    const rawOrigins = process.env.ALLOWED_ORIGINS || '';
    allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

    // Warn if no origins set in production
    if (allowedOrigins.length === 0) {
      console.warn('⚠️  No ALLOWED_ORIGINS set in production. CORS will be restricted.');
    }
  } else {
    allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3006'];
  }

  return {
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
    },
    server: {
      port: process.env.PORT || 3001,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    cors: {
      allowedOrigins: allowedOrigins,
    },
    isDevelopment: !isProduction,
    isProduction: isProduction,
  };
};

/**
 * Masks sensitive values for logging
 * @param {string} value - The value to mask
 * @returns {string} Masked value
 */
const maskSecret = (value) => {
  if (!value || value.length < 8) return '***';
  return `${value.substring(0, 7)}...${value.substring(value.length - 4)}`;
};

/**
 * Logs configuration (with secrets masked)
 */
const logConfig = () => {
  const config = getServerConfig();
  console.log('🔧 Server Configuration:');
  console.log(`  - Environment: ${config.server.nodeEnv}`);
  console.log(`  - Port: ${config.server.port}`);
  console.log(`  - Claude Model: ${config.claude.model}`);
  console.log(`  - Claude API Key: ${maskSecret(config.claude.apiKey)}`);
  console.log(`  - CORS Origins: ${config.cors.allowedOrigins.join(', ')}`);
};

module.exports = {
  validateServerEnv,
  getServerConfig,
  maskSecret,
  logConfig,
};
