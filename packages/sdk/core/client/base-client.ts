import { ErrorHubConfig, GetErrorOptions, ErrorResult } from '../types';

/**
 * Base class for ErrorHub SDK clients
 */
export abstract class BaseClient {
  protected config: ErrorHubConfig;
  protected cache: Map<string, CacheItem> = new Map();

  constructor(config: ErrorHubConfig) {
    this.config = {
      ...config,
      cache: {
        enabled: true,
        ttl: 3600000, // 1 hour by default
        maxSize: 1000,
        ...config.cache,
      },
      logging: {
        level: 'error',
        ...config.logging,
      }
    };
  }

  /**
   * Get error message
   */
  public abstract getError(options: GetErrorOptions): Promise<ErrorResult>;

  /**
   * Get error message with parameter substitution
   * @param options Request options
   * @returns Formatted error message
   */
  public async getErrorMessage(options: GetErrorOptions): Promise<string> {
    const error = await this.getError(options);
    return this.formatMessage(error.message, options.params);
  }

  /**
   * Format message with parameter substitution
   * @param message Message template
   * @param params Parameters for substitution
   * @returns Formatted message
   */
  protected formatMessage(message: string, params?: Record<string, string>): string {
    if (!params) return message;
    
    return message.replace(/\{([^}]+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Create a cache key
   */
  protected createCacheKey(options: GetErrorOptions): string {
    const { code, language = this.config.defaultLanguage, version } = options;
    return `${code}:${language}:${version || 'latest'}`;
  }

  /**
   * Get data from cache
   */
  protected getFromCache(key: string): ErrorResult | null {
    if (!this.config.cache?.enabled) return null;

    const item = this.cache.get(key);
    if (!item) return null;

    // Check for TTL expiration
    if (Date.now() - item.timestamp > (this.config.cache.ttl || 0)) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Save data to cache
   */
  protected setToCache(key: string, data: ErrorResult): void {
    if (!this.config.cache?.enabled) return;

    // Clear cache if size is exceeded
    if (this.cache.size >= (this.config.cache.maxSize || 1000)) {
      const oldestKey = this.findOldestCacheItem();
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Find the oldest item in the cache
   */
  private findOldestCacheItem(): string | null {
    if (this.cache.size === 0) return null;

    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Logging
   */
  protected log(level: string, message: string, data?: any): void {
    const logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      none: 4
    };

    const configLevel = this.config.logging?.level || 'error';
    
    if (logLevels[level as keyof typeof logLevels] >= logLevels[configLevel as keyof typeof logLevels]) {
      if (this.config.logging?.handler) {
        this.config.logging.handler(level, message, data);
      } else {
        const time = new Date().toISOString();
        console.log(`[${time}] [${level.toUpperCase()}] ${message}`, data !== undefined ? data : '');
      }
    }
  }
}

/**
 * Cache item
 */
interface CacheItem {
  data: ErrorResult;
  timestamp: number;
} 