/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize and validate user input to prevent
 * XSS attacks and ensure data integrity.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} dirty - Potentially unsafe HTML string
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} Sanitized HTML string
 */
export const sanitizeHtml = (dirty, options = {}) => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ...options
  };

  return DOMPurify.sanitize(dirty, defaultOptions);
};

/**
 * Sanitizes plain text input (removes all HTML tags)
 * @param {string} text - Input text
 * @returns {string} Plain text without HTML
 */
export const sanitizePlainText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove all HTML tags
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

/**
 * Sanitizes user input for display (allows minimal formatting)
 * Used for Luna chat messages, roadmap names, etc.
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export const sanitizeUserInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  const trimmed = input.trim();

  // Remove any script tags and dangerous attributes
  return DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

/**
 * Sanitizes URLs to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  const lowerUrl = trimmed.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return null;
    }
  }

  // Allow http, https, mailto, tel
  const allowedProtocolRegex = /^(https?:|mailto:|tel:)/i;
  if (!allowedProtocolRegex.test(trimmed) && trimmed.includes(':')) {
    console.warn(`Blocked URL with unrecognized protocol: ${trimmed}`);
    return null;
  }

  return trimmed;
};

/**
 * Sanitizes JSON data recursively
 * @param {any} data - Data to sanitize
 * @param {Object} options - Sanitization options
 * @returns {any} Sanitized data
 */
export const sanitizeJson = (data, options = {}) => {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeJson(item, options));
  }

  // Handle objects
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize key names (prevent prototype pollution)
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        console.warn(`Blocked dangerous key: ${key}`);
        continue;
      }
      sanitized[key] = sanitizeJson(value, options);
    }
    return sanitized;
  }

  // Handle strings
  if (typeof data === 'string') {
    return sanitizePlainText(data);
  }

  // Return primitives as-is
  return data;
};

/**
 * Escapes special regex characters in a string
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
export const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') {
    return '';
  }
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates and sanitizes email address
 * @param {string} email - Email address
 * @returns {string|null} Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Trim and lowercase
  const cleaned = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleaned)) {
    return null;
  }

  // Remove any HTML tags
  return sanitizePlainText(cleaned);
};

/**
 * Sanitizes phone number (removes non-numeric characters except +)
 * @param {string} phone - Phone number
 * @returns {string} Sanitized phone number
 */
export const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Keep only digits, +, -, (, ), and spaces
  return phone.replace(/[^\d+\-() ]/g, '');
};

/**
 * Truncates string to maximum length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add if truncated (default '...')
 * @returns {string} Truncated string
 */
export const truncate = (str, maxLength, suffix = '...') => {
  if (!str || typeof str !== 'string') {
    return '';
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Sanitizes file name (removes path traversal attempts)
 * @param {string} filename - File name
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '');

  return sanitized.trim();
};

export default {
  sanitizeHtml,
  sanitizePlainText,
  sanitizeUserInput,
  sanitizeUrl,
  sanitizeJson,
  sanitizeEmail,
  sanitizePhone,
  escapeRegex,
  truncate,
  sanitizeFilename
};
