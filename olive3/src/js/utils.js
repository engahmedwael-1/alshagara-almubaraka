/**
 * Utility Functions Module
 * Shared utility functions used across the application
 */

/**
 * Hash a string using SHA-256
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hex encoded hash
 */
export async function hashString(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&',
    '<': '<',
    '>': '>',
    "'": ''',
    '"': '"'
  }[tag]));
}

/**
 * Convert Arabic/Indian digits to English digits
 * @param {string} str - String with Arabic digits
 * @returns {string} String with English digits
 */
export function toEngDigits(str) {
  const ar = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.split('').map(c => ar.indexOf(c) !== -1 ? ar.indexOf(c) : c).join('');
}

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('ar-EG').format(num);
}

/**
 * Format currency in EGP
 * @param {number} amount - Amount in EGP
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount) {
  return `${formatNumber(amount)} ج`;
}

/**
 * Format date in Arabic locale
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export function formatDate(date, options = { dateStyle: 'long' }) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('ar-EG', options);
}

/**
 * Format date and time in Arabic locale
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time
 */
export function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
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
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} True if empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Get nested property safely
 * @param {Object} obj - Object
 * @param {string} path - Path like 'a.b.c'
 * @param {*} defaultValue - Default if not found
 * @returns {*} Value or default
 */
export function getNested(obj, path, defaultValue = null) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj) ?? defaultValue;
}

/**
 * Set nested property
 * @param {Object} obj - Object
 * @param {string} path - Path like 'a.b.c'
 * @param {*} value - Value to set
 */
export function setNested(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
  target[last] = value;
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after ms
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Result of function
 */
export async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
}

/**
 * Parse variant string to array of objects
 * Format: "Name-Price,Name-Price-Stock"
 * @param {string} vStr - Variant string
 * @returns {Array} Array of variant objects
 */
export function parseVariants(vStr) {
  if (!vStr) return [];
  const arr = [];
  const parts = vStr.split(',');
  parts.forEach(p => {
    const kv = p.split('-');
    if (kv.length >= 2) {
      const vObj = { name: kv[0].trim(), price: Number(kv[1].trim()) };
      if (kv.length >= 3 && kv[2].trim() !== '') {
        vObj.stock = Number(kv[2].trim());
      }
      arr.push(vObj);
    }
  });
  return arr;
}

/**
 * Fuzzy match for Arabic search
 * @param {string} str - String to search in
 * @param {string} query - Search query
 * @returns {boolean} True if matches
 */
export function fuzzyMatch(str, query) {
  str = str.toLowerCase();
  query = query.toLowerCase();
  if (str.includes(query)) return true;

  const typoMap = {
    "زت": "زيت",
    "زتون": "زيتون",
    "عسل": "عسل",
    "سينوي": "سيناوي",
    "بكر": "بكر"
  };

  for (const key in typoMap) {
    query = query.replace(new RegExp(key, 'g'), typoMap[key]);
  }

  if (str.includes(query)) return true;

  let i = 0, j = 0;
  while (i < str.length && j < query.length) {
    if (str[i] === query[j]) j++;
    i++;
  }
  return j === query.length;
}

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} type - Type: 'success', 'error', 'info'
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate Egyptian phone number
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
export function isValidEgyptPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return /^(01|201|2010|2011|2012|2015)\d{8,9}$/.test(cleaned);
}

/**
 * Normalize Egyptian phone number to international format
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone (20XXXXXXXXXX)
 */
export function normalizeEgyptPhone(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '2' + cleaned;
  if (!cleaned.startsWith('20')) cleaned = '20' + cleaned;
  return cleaned;
}

/**
 * Get query parameter from URL
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value or null
 */
export function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Set query parameter in URL without reload
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
export function setQueryParam(name, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(name, value);
  } else {
    url.searchParams.delete(name);
  }
  window.history.pushState({}, '', url);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
}

/**
 * Generate random color
 * @returns {string} Hex color
 */
export function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Check if element is in viewport
 * @param {Element} el - Element to check
 * @returns {boolean} True if in viewport
 */
export function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}