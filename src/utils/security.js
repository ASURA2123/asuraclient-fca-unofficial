/**
 * Security utilities for FCA/AsuraClient
 * Provides encryption, validation, and security-related functions
 * @module security
 */

const crypto = require('crypto');

/**
 * Security utility class
 */
class SecurityUtils {
  /**
   * Generate a random encryption key
   * @param {number} [length=32] - Key length in bytes
   * @returns {string} Hex-encoded random key
   */
  static generateKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Encrypt data using AES-256-GCM
   * @param {string} data - Data to encrypt
   * @param {string} key - Encryption key (hex encoded)
   * @returns {string} Base64 encoded encrypted data with IV and auth tag
   */
  static encrypt(data, key) {
    if (!key) {
      throw new Error('Encryption key is required');
    }
    
    try {
      const algorithm = 'aes-256-gcm';
      const keyBuffer = Buffer.from(key, 'hex');
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return Buffer.from(JSON.stringify({
        data: encrypted,
        iv: iv.toString('hex'),
        tag: authTag.toString('hex')
      })).toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }
  
  /**
   * Decrypt data using AES-256-GCM
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} key - Encryption key (hex encoded)
   * @returns {string} Decrypted data
   */
  static decrypt(encryptedData, key) {
    if (!key) {
      throw new Error('Decryption key is required');
    }
    
    try {
      const algorithm = 'aes-256-gcm';
      const keyBuffer = Buffer.from(key, 'hex');
      
      const decoded = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      const { data, iv, tag } = decoded;
      
      const decipher = crypto.createDecipheriv(algorithm, keyBuffer, Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
  
  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   * @returns {string} Hex-encoded hash
   */
  static hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  static validatePassword(password) {
    const result = {
      isValid: true,
      errors: []
    };
    
    if (password.length < 6) {
      result.isValid = false;
      result.errors.push('Password must be at least 6 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      result.errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      result.errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      result.errors.push('Password must contain at least one digit');
    }
    
    if (result.errors.length > 0) {
      result.isValid = false;
    }
    
    return result;
  }
  
  /**
   * Sanitize sensitive data for logging
   * @param {Object} data - Data to sanitize
   * @returns {Object} Sanitized data
   */
  static sanitizeForLogging(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'appState'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}

module.exports = SecurityUtils;