import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../services/config';
import { Product } from '../types';
import { logger } from '../services/logger';

export class CacheManager {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.resolve(config.CACHE_DIR);
    this.ensureCacheDirExists();
  }

  private ensureCacheDirExists() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      logger.debug(`Created cache directory at: ${this.cacheDir}`);
    }
  }

  private getHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex');
  }

  private getCachePath(text: string): string {
    const hash = this.getHash(text);
    return path.join(this.cacheDir, `${hash}.json`);
  }

  async get(text: string): Promise<Product[] | null> {
    const cachePath = this.getCachePath(text);
    
    if (fs.existsSync(cachePath)) {
      try {
        logger.debug(`Cache hit for text hash: ${this.getHash(text)}`);
        const content = fs.readFileSync(cachePath, 'utf8');
        return JSON.parse(content) as Product[];
      } catch (error) {
        logger.error(`Failed to read/parse cache file at ${cachePath}:`, error);
        return null;
      }
    }
    
    logger.debug(`Cache miss for text hash: ${this.getHash(text)}`);
    return null;
  }

  async set(text: string, products: Product[]): Promise<void> {
    const cachePath = this.getCachePath(text);
    try {
      this.ensureCacheDirExists();
      fs.writeFileSync(cachePath, JSON.stringify(products, null, 2), 'utf8');
      logger.debug(`Successfully saved extraction to cache: ${cachePath}`);
    } catch (error) {
      logger.error(`Failed to write cache file at ${cachePath}:`, error);
    }
  }
}
