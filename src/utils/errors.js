/**
 * Custom error classes for FCA/AsuraClient
 * Provides structured error handling with categorization and localization support
 * @module errors
 */

/**
 * Base error class for all FCA errors
 * @extends Error
 */
class FCAError extends Error {
  /**
   * Create an FCA error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} [details={}] - Additional error details
   */
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Ensure proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Authentication related errors
 * @extends FCAError
 */
class AuthenticationError extends FCAError {
  /**
   * Create an authentication error
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   */
  constructor(message, details = {}) {
    super(message, 'AUTH_ERROR', details);
  }
}

/**
 * Network related errors
 * @extends FCAError
 */
class NetworkError extends FCAError {
  /**
   * Create a network error
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   */
  constructor(message, details = {}) {
    super(message, 'NETWORK_ERROR', details);
  }
}

/**
 * Validation related errors
 * @extends FCAError
 */
class ValidationError extends FCAError {
  /**
   * Create a validation error
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   */
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Configuration related errors
 * @extends FCAError
 */
class ConfigurationError extends FCAError {
  /**
   * Create a configuration error
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   */
  constructor(message, details = {}) {
    super(message, 'CONFIG_ERROR', details);
  }
}

/**
 * Security related errors
 * @extends FCAError
 */
class SecurityError extends FCAError {
  /**
   * Create a security error
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   */
  constructor(message, details = {}) {
    super(message, 'SECURITY_ERROR', details);
  }
}

/**
 * Database related errors
 * @extends FCAError
 */
class DatabaseError extends FCAError {
  /**
   * Create a database error
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   */
  constructor(message, details = {}) {
    super(message, 'DATABASE_ERROR', details);
  }
}

/**
 * Error handler utility
 */
class ErrorHandler {
  /**
   * Format error for logging
   * @param {Error} error - Error to format
   * @returns {Object} Formatted error object
   */
  static formatError(error) {
    if (error instanceof FCAError) {
      return {
        type: error.name,
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
        stack: error.stack
      };
    }
    
    return {
      type: 'UnknownError',
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: {},
      timestamp: new Date().toISOString(),
      stack: error.stack
    };
  }
  
  /**
   * Create a safe error message for users (without sensitive details)
   * @param {Error} error - Error to sanitize
   * @returns {string} Sanitized error message
   */
  static getSafeErrorMessage(error) {
    if (error instanceof FCAError) {
      // For security errors, don't reveal details
      if (error instanceof SecurityError) {
        return 'A security error occurred. Please check your credentials and try again.';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again later.';
  }
}

module.exports = {
  FCAError,
  AuthenticationError,
  NetworkError,
  ValidationError,
  ConfigurationError,
  SecurityError,
  DatabaseError,
  ErrorHandler
};