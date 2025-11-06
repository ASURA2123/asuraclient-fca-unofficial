/**\n * Structured logging module for FCA/AsuraClient\n * Supports multiple log levels and formats (JSON/text)\n * @module logger\n */

const fs = require('fs');
const path = require('path');
const chalk = require("chalk");
const gradient = require("gradient-string");

/**\n * Log levels with priority values\n * @enum {number}\n */
const LOG_LEVELS = {
  none: -1,
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**\n * Available gradient themes\n */
const themes = [
  "blue", "dream2", "dream", "fiery", "rainbow", "pastel", "cristal", "red", "aqua", "pink", "retro", "sunlight", "teen", "summer", "flower", "ghost", "hacker"
];

/**\n * Build gradient based on theme name\n * @param {string} name - Theme name\n * @returns {Function} Gradient function\n */
function buildGradient(name) {
  const t = String(name || "").toLowerCase();
  if (t === "blue") return gradient([{ color: "#1affa3", pos: 0.2 }, { color: "cyan", pos: 0.4 }, { color: "pink", pos: 0.6 }, { color: "cyan", pos: 0.8 }, { color: "#1affa3", pos: 1 }]);
  if (t === "dream2") return gradient("blue", "pink");
  if (t === "dream") return gradient([{ color: "blue", pos: 0.2 }, { color: "pink", pos: 0.3 }, { color: "gold", pos: 0.6 }, { color: "pink", pos: 0.8 }, { color: "blue", pos: 1 }]);
  if (t === "fiery") return gradient("#fc2803", "#fc6f03", "#fcba03");
  if (t === "rainbow") return gradient.rainbow;
  if (t === "pastel") return gradient.pastel;
  if (t === "cristal") return gradient.cristal;
  if (t === "red") return gradient("red", "orange");
  if (t === "aqua") return gradient("#0030ff", "#4e6cf2");
  if (t === "pink") return gradient("#d94fff", "purple");
  if (t === "retro") return gradient.retro;
  if (t === "sunlight") return gradient("orange", "#ffff00", "#ffe600");
  if (t === "teen") return gradient.teen;
  if (t === "summer") return gradient.summer;
  if (t === "flower") return gradient("blue", "purple", "yellow", "#81ff6e");
  if (t === "ghost") return gradient.mind;
  if (t === "hacker") return gradient("#47a127", "#0eed19", "#27f231");
  return gradient("#243aff", "#4687f0", "#5800d4");
}

// Initialize gradient theme
const themeName = themes[Math.floor(Math.random() * themes.length)];
const co = buildGradient(themeName);

/**\n * Logger class for structured logging\n */
class Logger {
  /**\n   * Create a logger instance\n   * @param {Object} options - Logger options\n   * @param {string} [options.level='info'] - Minimum log level\n   * @param {string} [options.format='text'] - Log format (text or json)\n   * @param {string} [options.context={}] - Default context for all logs\n   */
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.format = options.format || 'text';
    this.context = options.context || {};
    // Fix: Use the level directly instead of falling back to info if not found
    this.minLevel = LOG_LEVELS[this.level] !== undefined ? LOG_LEVELS[this.level] : LOG_LEVELS.info;
  }
  
  /**\n   * Check if a log level should be logged\n   * @param {string} level - Log level to check\n   * @returns {boolean} Whether the level should be logged\n   */
  shouldLog(level) {
    // If level is 'none', never log anything
    if (this.level === 'none') return false;
    
    const levelValue = LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.info;
    return levelValue <= this.minLevel;
  }
  
  /**\n   * Log a message\n   * @param {string} message - Message to log\n   * @param {string} level - Log level\n   * @param {Object} [context={}] - Additional context\n   */
  log(message, level, context = {}) {
    if (!this.shouldLog(level)) return;
    
    const timestamp = new Date().toISOString();
    const logContext = { ...this.context, ...context };
    
    if (this.format === 'json') {
      const logEntry = {
        timestamp,
        level,
        message,
        context: logContext
      };
      
      process.stderr.write(JSON.stringify(logEntry) + '\n');
    } else {
      // Text format with colors
      const prefix = this.getPrefix(level);
      const contextStr = Object.keys(logContext).length > 0 
        ? ` ${JSON.stringify(logContext)}` 
        : '';
      
      process.stderr.write(`${prefix} ${message}${contextStr}\n`);
    }
  }
  
  /**\n   * Get colored prefix for text format\n   * @param {string} level - Log level\n   * @returns {string} Colored prefix\n   */
  getPrefix(level) {
    switch (level) {
      case 'error':
        return chalk.bold.hex("#ff0000")("\r[ FCA-ERROR ]");
      case 'warn':
        return co(`\r[ FCA-WARN ]`);
      case 'debug':
        return chalk.bold.hex("#888888")("\r[ FCA-DEBUG ]");
      case 'info':
      default:
        return chalk.bold(co(`\r[ FCA-INFO ]`));
    }
  }
  
  /**\n   * Log an error message\n   * @param {string} message - Error message\n   * @param {Object} [context={}] - Additional context\n   */
  error(message, context = {}) {
    this.log(message, 'error', context);
  }
  
  /**\n   * Log a warning message\n   * @param {string} message - Warning message\n   * @param {Object} [context={}] - Additional context\n   */
  warn(message, context = {}) {
    this.log(message, 'warn', context);
  }
  
  /**\n   * Log an info message\n   * @param {string} message - Info message\n   * @param {Object} [context={}] - Additional context\n   */
  info(message, context = {}) {
    this.log(message, 'info', context);
  }
  
  /**\n   * Log a debug message\n   * @param {string} message - Debug message\n   * @param {Object} [context={}] - Additional context\n   */
  debug(message, context = {}) {
    this.log(message, 'debug', context);
  }
}

// Create default logger instance
const defaultLogger = new Logger();

/**\n * Default logger function for backward compatibility\n * @param {string} text - Message to log\n * @param {string} type - Log type\n */
module.exports = (text, type) => {
  const s = String(type || "info").toLowerCase();
  defaultLogger.log(text, s);
};

// Export classes and constants
module.exports.Logger = Logger;
module.exports.LOG_LEVELS = LOG_LEVELS;