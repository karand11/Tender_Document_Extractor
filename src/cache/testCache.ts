import { CacheManager } from './cacheManager';
import { Product } from '../types';
import { logger } from '../services/logger';
import * as fs from 'fs';
import * as path from 'path';

async function runTest() {
  logger.info('Testing Cache Manager...');
  
  const cacheManager = new CacheManager();
  
  const sampleText = 'This is a sample tender page text to check caching capability.';
  const mockProducts: Product[] = [
    { name: 'Mock Laptop', quantity: 5 },
    { name: 'Mock Router', quantity: 2 }
  ];

  // 1. Initial check (should miss)
  const cachedBefore = await cacheManager.get(sampleText);
  if (cachedBefore === null) {
    logger.info('SUCCESS: Correctly returned null on cache miss.');
  } else {
    logger.error('FAILURE: Returned non-null value on empty cache.');
  }

  // 2. Set cache
  await cacheManager.set(sampleText, mockProducts);
  logger.info('Saved mock products to cache.');

  // 3. Second check (should hit)
  const cachedAfter = await cacheManager.get(sampleText);
  if (cachedAfter !== null && cachedAfter.length === 2) {
    if (cachedAfter[0].name === 'Mock Laptop' && cachedAfter[1].quantity === 2) {
      logger.info('SUCCESS: Correctly retrieved items from cache on cache hit!');
    } else {
      logger.error('FAILURE: Cached items data mismatch.');
    }
  } else {
    logger.error('FAILURE: Cache missed after set operation.');
  }

  // Clean up cache file
  const hash = crypto.createHash ? '' : 'test'; // just lookup path
  // Let's resolve the actual file using private hashing logic for validation
  const cryptoHash = require('crypto').createHash('sha256').update(sampleText.trim()).digest('hex');
  const expectedPath = path.join(path.resolve('./.cache'), `${cryptoHash}.json`);
  
  if (fs.existsSync(expectedPath)) {
    logger.info(`SUCCESS: Cache file exists at path: ${expectedPath}`);
    fs.unlinkSync(expectedPath);
    logger.info('Cleaned up test cache file.');
  } else {
    logger.error(`FAILURE: Cache file was not found at expected path: ${expectedPath}`);
  }
}

runTest();
