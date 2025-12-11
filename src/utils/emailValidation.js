/**
 * Email Domain Validation
 *
 * Ensures users register with legitimate email providers
 * Blocks fake/temporary email domains
 */

// Common legitimate email providers
const VALID_EMAIL_DOMAINS = [
  // Major providers
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.de',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'gmx.de',
  'yandex.com',
  'yandex.ru',

  // Business/Corporate
  'microsoft.com',
  'apple.com',
  'amazon.com',
  'google.com',
  'facebook.com',
  'meta.com',

  // Educational (common patterns)
  '.edu',
  '.ac.uk',
  '.edu.au',

  // Country-specific major providers
  'qq.com',         // China
  'sina.com',       // China
  '163.com',        // China
  'naver.com',      // Korea
  'daum.net',       // Korea
  'mail.ru',        // Russia
  'rambler.ru',     // Russia
  't-online.de',    // Germany
  'web.de',         // Germany
  'orange.fr',      // France
  'wanadoo.fr',     // France
  'libero.it',      // Italy
  'virgilio.it',    // Italy
  'terra.com.br',   // Brazil
  'uol.com.br',     // Brazil
];

// Known temporary/disposable email domains to block
const BLOCKED_DOMAINS = [
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'yopmail.com',
  'maildrop.cc',
  'trashmail.com',
  'getnada.com',
  'temp-mail.com',
  'fake-mail.com',
  'fakeinbox.com',
  'dispostable.com',
  'throwawaymail.com',
  'spam4.me',
  'grr.la',
  'sharklasers.com',
];

/**
 * Validates email format and domain
 * @param {string} email - Email address to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Extract domain
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check blocked domains
  if (BLOCKED_DOMAINS.includes(domain)) {
    return {
      valid: false,
      error: 'Temporary email addresses are not allowed. Please use a permanent email address.'
    };
  }

  // Check if domain is in valid list OR matches educational pattern
  const isValid = VALID_EMAIL_DOMAINS.some(validDomain => {
    if (validDomain.startsWith('.')) {
      // Pattern match for educational domains
      return domain.endsWith(validDomain);
    }
    return domain === validDomain;
  });

  // Check for common corporate email patterns (company domains)
  const hasValidTLD = /\.(com|org|net|edu|gov|mil|co\.[a-z]{2}|ac\.[a-z]{2})$/i.test(domain);
  const looksLegitimate = domain.includes('.') && hasValidTLD && domain.split('.').length >= 2;

  if (!isValid && !looksLegitimate) {
    return {
      valid: false,
      error: 'Please use a valid email from a recognized provider (Gmail, Outlook, Yahoo, etc.) or your company/school email.'
    };
  }

  return { valid: true, error: null };
};

/**
 * Quick check if email domain is explicitly whitelisted
 * @param {string} email - Email address
 * @returns {boolean}
 */
export const isWhitelistedDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  return VALID_EMAIL_DOMAINS.some(validDomain => {
    if (validDomain.startsWith('.')) {
      return domain.endsWith(validDomain);
    }
    return domain === validDomain;
  });
};

/**
 * Check if email is from a disposable/temporary provider
 * @param {string} email - Email address
 * @returns {boolean}
 */
export const isDisposableEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && BLOCKED_DOMAINS.includes(domain);
};

export default {
  validateEmail,
  isWhitelistedDomain,
  isDisposableEmail,
};
