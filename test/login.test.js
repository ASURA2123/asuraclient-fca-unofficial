/**
 * Unit tests for FCA/AsuraClient login module
 * @module test/login
 */

const { expect } = require('chai');
const { login } = require('..');
const { loadConfig } = require('../module/config');
const { FCAError, ValidationError } = require('../src/utils/errors');

describe('Login Module', function() {
  this.timeout(10000); // Increase timeout for async operations
  
  describe('Configuration Loading', () => {
    it('should load default configuration', () => {
      const { config } = loadConfig();
      expect(config).to.be.an('object');
      expect(config.autoUpdate).to.be.a('boolean');
      expect(config.mqtt).to.be.an('object');
      expect(config.credentials).to.be.an('object');
    });
    
    it('should validate configuration values', () => {
      const { validateConfig } = require('../module/config');
      const validConfig = {
        autoUpdate: true,
        mqtt: { enabled: true, reconnectInterval: 3600 },
        autoLogin: true,
        credentials: { email: "", password: "", twofactor: "" },
        logging: { level: "info", format: "json" }
      };
      
      expect(() => validateConfig(validConfig)).to.not.throw();
      
      const invalidConfig = { ...validConfig, autoUpdate: "not_boolean" };
      expect(() => validateConfig(invalidConfig)).to.throw();
    });
  });
  
  describe('Error Handling', () => {
    it('should create FCAError instances', () => {
      const error = new FCAError('Test error', 'TEST_ERROR', { detail: 'test' });
      expect(error).to.be.instanceOf(Error);
      expect(error.code).to.equal('TEST_ERROR');
      expect(error.details).to.deep.equal({ detail: 'test' });
    });
    
    it('should create ValidationError instances', () => {
      const error = new ValidationError('Validation failed');
      expect(error).to.be.instanceOf(FCAError);
      expect(error.code).to.equal('VALIDATION_ERROR');
    });
  });
  
  describe('Login Function', () => {
    it('should reject invalid login data', (done) => {
      try {
        login(null, {}, (err) => {
          expect(err).to.be.instanceOf(ValidationError);
          done();
        });
      } catch (err) {
        expect(err).to.be.instanceOf(ValidationError);
        done();
      }
    });
    
    it('should handle missing credentials gracefully', (done) => {
      login({}, {}, (err, api) => {
        // Should either return an error or proceed without crashing
        if (err) {
          expect(err).to.be.an('error');
          done();
        } else {
          // If no error, api should be an object (even if login fails)
          expect(api).to.be.an('object');
          done();
        }
      });
    });
  });
});