/**
 * Utility functions for the AI Customer Support Chatbot
 */

/**
 * Generate a unique ID using timestamp and random string
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string input to prevent XSS
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim();
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Calculate time difference in human readable format
 */
function getTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = ['GEMINI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Create standardized API response
 */
function createApiResponse(data, message = null, error = false) {
  const response = {
    error,
    timestamp: new Date().toISOString()
  };
  
  if (error) {
    response.message = message || 'An error occurred';
    if (data) response.details = data;
  } else {
    if (message) response.message = message;
    response.data = data;
  }
  
  return response;
}

/**
 * Parse and validate JSON safely
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text, maxLength = 100) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Debounce function to limit API calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if string contains only whitespace
 */
function isEmptyOrWhitespace(str) {
  return !str || typeof str !== 'string' || str.trim().length === 0;
}

module.exports = {
  generateId,
  isValidEmail,
  sanitizeString,
  formatTimestamp,
  getTimeAgo,
  validateEnvironment,
  createApiResponse,
  safeJsonParse,
  truncateText,
  debounce,
  isEmptyOrWhitespace
};