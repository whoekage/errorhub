/**
 * SDK Configuration
 */
export interface ErrorHubConfig {
  /** API server URL */
  apiUrl: string;
  /** API key for access */
  apiKey?: string;
  /** Default language */
  defaultLanguage: string;
  /** Caching settings */
  cache?: CacheConfig;
  /** Logging settings */
  logging?: LoggingConfig;
}

/**
 * Cache settings
 */
export interface CacheConfig {
  /** Is caching enabled */
  enabled: boolean;
  /** Cache lifetime in milliseconds */
  ttl?: number;
  /** Maximum cache size (number of entries) */
  maxSize?: number;
}

/**
 * Logging settings
 */
export interface LoggingConfig {
  /** Logging level */
  level: 'debug' | 'info' | 'warn' | 'error' | 'none';
  /** Log handler */
  handler?: (level: string, message: string, data?: any) => void;
}

/**
 * Error request options
 */
export interface GetErrorOptions {
  /** Error code */
  code: string;
  /** Message language */
  language?: string;
  /** Parameters for message template substitution */
  params?: Record<string, string>;
  /** Error version */
  version?: number;
}

/**
 * Error request result
 */
export interface ErrorResult {
  /** Error code */
  code: string;
  /** Error message in the requested language */
  message: string;
  /** Message language */
  locale: string;
  /** Flag indicating that the default language was used */
  isFallback?: boolean;
  /** Error metadata */
  metadata?: Record<string, any>;
  /** Error version */
  version: number;
} 