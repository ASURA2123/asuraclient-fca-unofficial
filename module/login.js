/**
 * Main login module for FCA/AsuraClient
 * Provides the primary entry point for Facebook Messenger automation
 * @module login
 */

const { getType } = require("../src/utils/format");
const { setOptions } = require("./options");
const { loadConfig } = require("./config");
const { checkAndUpdateVersion } = require("../func/checkUpdate");
const loginHelper = require("./loginHelper");
const { Logger } = require("../func/logger");
const { ValidationError } = require("../src/utils/errors");

// Load configuration
const { config } = loadConfig();
global.fca = { config };

// Create logger with configuration
const logger = new Logger({
  level: config.logging?.level || 'info',
  format: config.logging?.format || 'text'
});

/**
 * Main login function
 * @param {Object} loginData - Login credentials and data
 * @param {Object} options - API options
 * @param {Function} callback - Callback function
 * @returns {Promise|undefined} Promise if no callback provided
 */
function login(loginData, options, callback) {
  // Validate input parameters
  if (!loginData || (typeof loginData !== 'object')) {
    const error = new ValidationError('Login data is required and must be an object');
    if (typeof callback === 'function') {
      return callback(error);
    }
    throw error;
  }
  
  // Handle callback parameter
  if (getType(options) === "Function" || getType(options) === "AsyncFunction") {
    callback = options;
    options = {};
  }
  
  // Default global options
  const globalOptions = {
    selfListen: false,
    selfListenEvent: false,
    listenEvents: false,
    listenTyping: false,
    updatePresence: false,
    forceLogin: false,
    autoMarkDelivery: true,
    autoMarkRead: false,
    autoReconnect: true,
    online: true,
    emitReady: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  };
  
  // Apply user options
  setOptions(globalOptions, options);
  
  // Promise handling
  let prCallback = null;
  let rejectFunc = null;
  let resolveFunc = null;
  let returnPromise = null;
  
  if (getType(callback) !== "Function" && getType(callback) !== "AsyncFunction") {
    returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    
    prCallback = function (error, api) {
      if (error) {
        logger.error('Login failed', { error: error.message });
        return rejectFunc(error);
      }
      logger.info('Login successful');
      return resolveFunc(api);
    };
    
    callback = prCallback;
  }
  
  // Proceed with login
  const proceed = () => {
    logger.debug('Starting login process');
    return loginHelper(loginData.appState, loginData.Cookie, loginData.email, loginData.password, globalOptions, callback, prCallback);
  };
  
  // Handle auto-update
  if (config && config.autoUpdate) {
    logger.info('Checking for updates');
    const p = checkAndUpdateVersion();
    if (p && typeof p.then === "function") {
      p.then(proceed).catch(err => {
        logger.error('Update check failed', { error: err.message });
        callback(err);
      });
    } else {
      proceed();
    }
  } else {
    proceed();
  }
  
  return returnPromise;
}

module.exports = login;
