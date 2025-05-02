import { ErrorHubOptions, ErrorRequest, LocalizedError, BatchErrorRequest } from './types/error';

/**
 * ErrorHub SDK client abstract base class
 */
export abstract class ErrorHubClient {
  protected options: ErrorHubOptions;
  
  constructor(options: ErrorHubOptions) {
    this.options = {
      defaultLanguage: 'en',
      cacheEnabled: true,
      cacheTTL: 3600,
      timeout: 5000,
      ...options
    };
  }
  
  /**
   * Get a localized error message
   * @param request Error request parameters
   */
  abstract getError(request: ErrorRequest): Promise<LocalizedError>;
  
  /**
   * Get multiple error messages in batch
   * @param request Batch request parameters
   */
  abstract getErrors(request: BatchErrorRequest): Promise<LocalizedError[]>;
} 