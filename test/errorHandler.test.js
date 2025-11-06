/**
 * Unit tests for FCA/AsuraClient error handler utilities
 * @module test/errorHandler
 */

const { expect } = require('chai');
const { 
  FCAError, 
  AuthenticationError, 
  NetworkError, 
  ValidationError,
  SecurityError
} = require('../src/utils/errors');
const { 
  handleApiError, 
  createErrorResponse, 
  validateRequiredParams,
  getErrorCode,
  ERROR_CODES
} = require('../src/utils/errorHandler');

describe('Error Handler Utilities', function() {
  describe('Custom Error Classes', () => {
    it('should create FCAError instances', () => {
      const error = new FCAError('Test error', 'TEST_ERROR', { detail: 'test' });
      expect(error).to.be.instanceOf(Error);
      expect(error.code).to.equal('TEST_ERROR');
      expect(error.details).to.deep.equal({ detail: 'test' });
      expect(error.timestamp).to.be.a('string');
    });
    
    it('should create AuthenticationError instances', () => {
      const error = new AuthenticationError('Auth failed', { userId: '123' });
      expect(error).to.be.instanceOf(FCAError);
      expect(error.code).to.equal('AUTH_ERROR');
      expect(error.details).to.deep.equal({ userId: '123' });
    });
    
    it('should create NetworkError instances', () => {
      const error = new NetworkError('Network failed', { statusCode: 500 });
      expect(error).to.be.instanceOf(FCAError);
      expect(error.code).to.equal('NETWORK_ERROR');
      expect(error.details).to.deep.equal({ statusCode: 500 });
    });
    
    it('should create ValidationError instances', () => {
      const error = new ValidationError('Validation failed', { field: 'email' });
      expect(error).to.be.instanceOf(FCAError);
      expect(error.code).to.equal('VALIDATION_ERROR');
      expect(error.details).to.deep.equal({ field: 'email' });
    });
    
    it('should create SecurityError instances', () => {
      const error = new SecurityError('Security violation', { threat: 'injection' });
      expect(error).to.be.instanceOf(FCAError);
      expect(error.code).to.equal('SECURITY_ERROR');
      expect(error.details).to.deep.equal({ threat: 'injection' });
    });
  });
  
  describe('Error Response Creation', () => {
    it('should create proper error response for FCAError', () => {
      const error = new ValidationError('Invalid input', { field: 'name' });
      const response = createErrorResponse(error);
      
      expect(response).to.deep.equal({
        error: true,
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
        errorCode: 'ERR_GENERAL_01',
        details: { field: 'name' },
        timestamp: error.timestamp
      });
    });
    
    it('should create proper error response for generic errors', () => {
      const error = new Error('Generic error');
      const response = createErrorResponse(error);
      
      expect(response.error).to.be.true;
      expect(response.message).to.equal('Generic error');
      expect(response.code).to.equal('UNKNOWN_ERROR');
    });
  });
  
  describe('Parameter Validation', () => {
    it('should validate required parameters', () => {
      const params = { id: '123', name: 'test' };
      expect(() => validateRequiredParams(params, ['id', 'name'])).to.not.throw();
    });
    
    it('should throw ValidationError for missing parameters', () => {
      const params = { id: '123' };
      expect(() => validateRequiredParams(params, ['id', 'name'])).to.throw(ValidationError);
    });
    
    it('should throw ValidationError for invalid params object', () => {
      expect(() => validateRequiredParams(null, ['id'])).to.throw(ValidationError);
      expect(() => validateRequiredParams('invalid', ['id'])).to.throw(ValidationError);
    });
  });
  
  describe('Error Codes', () => {
    it('should provide standardized error codes', () => {
      expect(ERROR_CODES.AUTH_LOGIN_FAILED).to.equal('ERR_AUTH_01');
      expect(ERROR_CODES.NETWORK_TIMEOUT).to.equal('ERR_NETWORK_01');
      expect(ERROR_CODES.VALIDATION_MISSING_PARAM).to.equal('ERR_VALIDATION_01');
    });
    
    it('should get error code for error type', () => {
      expect(getErrorCode('AUTH_LOGIN_FAILED')).to.equal('ERR_AUTH_01');
      expect(getErrorCode('UNKNOWN_TYPE')).to.equal('ERR_GENERAL_01');
    });
  });
});