/**
 * Unit tests for FCA/AsuraClient cache utilities
 * @module test/cache
 */

const { expect } = require('chai');
const { Cache } = require('../src/utils/cache');

describe('Cache Utilities', function() {
  let cache;
  
  beforeEach(() => {
    cache = new Cache({ maxSize: 5, defaultTTL: 100 }); // Small TTL for testing
  });
  
  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).to.equal('value1');
    });
    
    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).to.be.undefined;
    });
    
    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).to.be.true;
      expect(cache.has('nonexistent')).to.be.false;
    });
    
    it('should delete entries', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).to.be.true;
      
      cache.delete('key1');
      expect(cache.has('key1')).to.be.false;
    });
    
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).to.equal(2);
      
      cache.clear();
      expect(cache.size()).to.equal(0);
    });
  });
  
  describe('Size Management', () => {
    it('should respect maximum size limit', () => {
      // Fill cache to maximum size
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      expect(cache.size()).to.equal(5);
      
      // Add one more - should evict oldest
      cache.set('key5', 'value5');
      expect(cache.size()).to.equal(5);
      expect(cache.has('key0')).to.be.false; // First entry should be evicted
      expect(cache.has('key5')).to.be.true;  // New entry should exist
    });
  });
  
  describe('TTL Management', () => {
    it('should expire entries after TTL', function(done) {
      this.timeout(5000); // Increase timeout for this test
      
      cache.set('key1', 'value1', 50); // 50ms TTL
      
      // Should exist immediately
      expect(cache.get('key1')).to.equal('value1');
      
      // Should be expired after 100ms
      setTimeout(() => {
        expect(cache.get('key1')).to.be.undefined;
        expect(cache.has('key1')).to.be.false;
        done();
      }, 100);
    });
    
    it('should use default TTL when not specified', function(done) {
      this.timeout(5000); // Increase timeout for this test
      
      cache.set('key1', 'value1'); // Use default TTL (100ms)
      
      // Should exist immediately
      expect(cache.get('key1')).to.equal('value1');
      
      // Should be expired after default TTL
      setTimeout(() => {
        expect(cache.get('key1')).to.be.undefined;
        done();
      }, 150);
    });
  });
  
  describe('Statistics', () => {
    it('should provide cache statistics', () => {
      const stats = cache.stats();
      expect(stats).to.be.an('object');
      expect(stats.size).to.equal(0);
      expect(stats.maxSize).to.equal(5);
      expect(stats.defaultTTL).to.equal(100);
      
      cache.set('key1', 'value1');
      const stats2 = cache.stats();
      expect(stats2.size).to.equal(1);
    });
  });
});