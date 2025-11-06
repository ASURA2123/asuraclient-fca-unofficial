/**
 * Cache utility for FCA/AsuraClient
 * Provides in-memory caching with TTL support
 * @module cache
 */

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {*} value - Cached value
 * @property {number} expiry - Expiry timestamp
 */

/**
 * Cache utility class
 */
class Cache {
  /**
   * Create a cache instance
   * @param {Object} options - Cache options
   * @param {number} [options.maxSize=1000] - Maximum cache size
   * @param {number} [options.defaultTTL=300000] - Default TTL in milliseconds (5 minutes)
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.cache = new Map();
    this.timestamps = new Map();
  }
  
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    const entry = this.cache.get(key);
    const timestamp = this.timestamps.get(key);
    
    // Check if expired
    if (timestamp && Date.now() > timestamp) {
      this.delete(key);
      return undefined;
    }
    
    return entry;
  }
  
  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [ttl] - TTL in milliseconds (uses default if not provided)
   */
  set(key, value, ttl) {
    // Check cache size and evict oldest entry if needed
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }
    
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now() + (ttl || this.defaultTTL));
  }
  
  /**
   * Delete entry from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }
  
  /**
   * Get cache size
   * @returns {number} Number of entries in cache
   */
  size() {
    return this.cache.size;
  }
  
  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} Whether key exists
   */
  has(key) {
    return this.cache.has(key);
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL
    };
  }
}

// Create default cache instance
const defaultCache = new Cache();

module.exports = {
  Cache,
  cache: defaultCache
};