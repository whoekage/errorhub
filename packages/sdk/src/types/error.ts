/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error', 
  CRITICAL = 'critical',
}

/**
 * Basic error information interface
 */
export interface ErrorInfo {
  code: string;
  message: string;
  category?: string;
  severity?: ErrorSeverity;
  httpStatus?: number;
  metadata?: Record<string, unknown>;
  version?: number;
}

/**
 * Localized error information interface
 */
export interface LocalizedError extends ErrorInfo {
  locale: string;
  isFallback?: boolean;
}

/**
 * Error request parameters
 */
export interface ErrorRequest {
  code: string;
  language: string;
  params?: Record<string, string>;
  version?: number;
}

/**
 * Batch error request parameters
 */
export interface BatchErrorRequest {
  codes: string[];
  language: string;
  params?: Record<string, Record<string, string>>;
}

/**
 * SDK configuration options
 */
export interface ErrorHubOptions {
  baseUrl: string;
  defaultLanguage?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  apiKey?: string;
  timeout?: number;
} 