/**
 * Global Error Handler Middleware for FCA/AsuraClient
 * Provides centralized error handling with retry mechanisms, reporting, and standardized error codes
 * @module errorHandler
 */

const { 
  FCAError, 
  AuthenticationError, 
  NetworkError, 
  ValidationError, 
  ConfigurationError, 
  SecurityError, 
  DatabaseError 
} = require('./errors');
const logger = require('../../func/logger');

// Error code mappings for standardized error identification
const ERROR_CODES = {
  // Authentication errors
  AUTH_LOGIN_FAILED: 'ERR_AUTH_01',
  AUTH_CHECKPOINT: 'ERR_AUTH_02',
  AUTH_2FA_REQUIRED: 'ERR_AUTH_03',
  AUTH_SESSION_EXPIRED: 'ERR_AUTH_04',
  AUTH_CREDENTIALS_INVALID: 'ERR_AUTH_05',
  
  // Network errors
  NETWORK_TIMEOUT: 'ERR_NETWORK_01',
  NETWORK_CONNECTION_FAILED: 'ERR_NETWORK_02',
  NETWORK_REQUEST_FAILED: 'ERR_NETWORK_03',
  NETWORK_PARSE_FAILED: 'ERR_NETWORK_04',
  NETWORK_RATE_LIMITED: 'ERR_NETWORK_05',
  
  // Validation errors
  VALIDATION_MISSING_PARAM: 'ERR_VALIDATION_01',
  VALIDATION_INVALID_FORMAT: 'ERR_VALIDATION_02',
  VALIDATION_OUT_OF_RANGE: 'ERR_VALIDATION_03',
  
  // Configuration errors
  CONFIG_MISSING: 'ERR_CONFIG_01',
  CONFIG_INVALID: 'ERR_CONFIG_02',
  CONFIG_FILE_NOT_FOUND: 'ERR_CONFIG_03',
  
  // Security errors
  SECURITY_ENCRYPTION_FAILED: 'ERR_SECURITY_01',
  SECURITY_DECRYPTION_FAILED: 'ERR_SECURITY_02',
  SECURITY_VALIDATION_FAILED: 'ERR_SECURITY_03',
  SECURITY_PERMISSION_DENIED: 'ERR_SECURITY_04',
  
  // Database errors
  DATABASE_CONNECTION_FAILED: 'ERR_DATABASE_01',
  DATABASE_QUERY_FAILED: 'ERR_DATABASE_02',
  DATABASE_RECORD_NOT_FOUND: 'ERR_DATABASE_03',
  
  // General errors
  UNKNOWN_ERROR: 'ERR_GENERAL_01',
  NOT_IMPLEMENTED: 'ERR_GENERAL_02',
  OPERATION_CANCELLED: 'ERR_GENERAL_03'
};

// Retry configuration for different error types
const RETRY_CONFIG = {
  [ERROR_CODES.NETWORK_TIMEOUT]: { maxRetries: 3, delay: 1000 },
  [ERROR_CODES.NETWORK_CONNECTION_FAILED]: { maxRetries: 3, delay: 2000 },
  [ERROR_CODES.AUTH_SESSION_EXPIRED]: { maxRetries: 1, delay: 0 }
};

/**
 * Global error handler middleware with retry mechanisms and reporting
 * @param {Error} error - The error to handle
 * @param {string} context - Context where the error occurred
 * @param {Object} options - Handler options
 * @param {Function} callback - Optional callback function
 * @returns {Promise|undefined} Promise if no callback provided
 */
async function handleApiError(error, context, options = {}, callback) {
  // Default options
  const opts = {
    retry: false,
    maxRetries: 3,
    retryDelay: 1000,
    report: true,
    logLevel: 'error',
    ...options
  };

  // Get error code and details
  const errorCode = error.code || ERROR_CODES.UNKNOWN_ERROR;
  const errorDetails = {
    message: error.message,
    code: errorCode,
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack,
    details: error.details || {}
  };

  // Log the error with appropriate level
  logger[opts.logLevel](`${context} error [${errorCode}]`, errorDetails);

  // Report error if needed (in production, this could send to external service)
  if (opts.report) {
    reportError(errorDetails);
  }

  // Handle retry logic for specific errors
  if (opts.retry && shouldRetry(errorCode, opts.maxRetries)) {
    const retryCount = getRetryCount(errorCode);
    if (retryCount < opts.maxRetries) {
      incrementRetryCount(errorCode);
      logger.info(`Retrying operation (${retryCount + 1}/${opts.maxRetries}) for ${context}`);
      
      // Delay before retry
      await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
      
      // If callback is provided, pass error back for retry
      if (typeof callback === 'function') {
        return callback(new Error(`Retry attempt ${retryCount + 1}`));
      }
      
      // For promise-based APIs, we re-throw to allow caller to handle retry
      throw new NetworkError(`Operation failed, retry attempt ${retryCount + 1}`, { 
        originalError: error, 
        retryAttempt: retryCount + 1 
      });
    } else {
      logger.warn(`Max retries exceeded for ${context}`);
      resetRetryCount(errorCode);
    }
  }

  // If callback is provided, use it
  if (typeof callback === 'function') {
    return callback(error);
  }

  // If no callback, throw or reject based on error type
  if (error instanceof FCAError) {
    throw error;
  }

  // Wrap unknown errors in NetworkError
  throw new NetworkError('An unexpected error occurred', { originalError: error });
}

/**
 * Create a standardized error response for API calls with error codes
 * @param {Error} error - The error to format
 * @returns {Object} Formatted error response
 */
function createErrorResponse(error) {
  if (error instanceof FCAError) {
    return {
      error: true,
      message: error.message,
      code: error.code,
      errorCode: getErrorCode(error.code),
      details: error.details,
      timestamp: error.timestamp
    };
  }

  // Handle generic errors
  return {
    error: true,
    message: error.message || 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    errorCode: ERROR_CODES.UNKNOWN_ERROR,
    details: {},
    timestamp: new Date().toISOString()
  };
}

/**
 * Wrap an async function with standardized error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error logging
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function with error handling
 */
function withErrorHandling(fn, context, options = {}) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      await handleApiError(error, context, options);
    }
  };
}

/**
 * Validate required parameters
 * @param {Object} params - Parameters to validate
 * @param {Array<string>} required - Required parameter names
 * @throws {ValidationError} If validation fails
 */
function validateRequiredParams(params, required) {
  if (!params || typeof params !== 'object') {
    throw new ValidationError('Parameters must be an object');
  }

  for (const param of required) {
    if (params[param] === undefined || params[param] === null) {
      throw new ValidationError(`Required parameter '${param}' is missing`);
    }
  }
}

/**
 * Standardized promise wrapper for callback-based APIs
 * @param {Function} callback - Optional callback function
 * @returns {Object} Object with promise, resolve, and reject functions
 */
function createPromiseWrapper(callback) {
  let resolveFunc, rejectFunc;
  const promise = new Promise((resolve, reject) => {
    resolveFunc = resolve;
    rejectFunc = reject;
  });

  if (typeof callback !== 'function') {
    return { promise, resolve: resolveFunc, reject: rejectFunc };
  }

  return {
    promise: null,
    resolve: (data) => callback(null, data),
    reject: (error) => callback(error)
  };
}

// Retry tracking
const retryCounts = new Map();

/**
 * Check if an error should be retried
 * @param {string} errorCode - Error code to check
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {boolean} Whether the error should be retried
 */
function shouldRetry(errorCode, maxRetries) {
  return RETRY_CONFIG[errorCode] && maxRetries > 0;
}

/**
 * Get current retry count for an error code
 * @param {string} errorCode - Error code
 * @returns {number} Current retry count
 */
function getRetryCount(errorCode) {
  return retryCounts.get(errorCode) || 0;
}

/**
 * Increment retry count for an error code
 * @param {string} errorCode - Error code
 */
function incrementRetryCount(errorCode) {
  const current = retryCounts.get(errorCode) || 0;
  retryCounts.set(errorCode, current + 1);
}

/**
 * Reset retry count for an error code
 * @param {string} errorCode - Error code
 */
function resetRetryCount(errorCode) {
  retryCounts.delete(errorCode);
}

/**
 * Report error to external service (placeholder for production implementation)
 * @param {Object} errorDetails - Error details to report
 */
function reportError(errorDetails) {
  // In production, this could send to Sentry, Rollbar, or other error tracking service
  // For now, we just log it
  logger.debug('Error reported to tracking service', errorDetails);
}

/**
 * Get standardized error code for an error type
 * @param {string} errorType - Type of error
 * @returns {string} Standardized error code
 */
function getErrorCode(errorType) {
  return ERROR_CODES[errorType] || ERROR_CODES.UNKNOWN_ERROR;
}

module.exports = {
  handleApiError,
  createErrorResponse,
  withErrorHandling,
  validateRequiredParams,
  createPromiseWrapper,
  shouldRetry,
  getRetryCount,
  incrementRetryCount,
  resetRetryCount,
  reportError,
  getErrorCode,
  ERROR_CODES,
  RETRY_CONFIG,
  FCAError,
  AuthenticationError,
  NetworkError,
  ValidationError,
  ConfigurationError,
  SecurityError,
  DatabaseError
};