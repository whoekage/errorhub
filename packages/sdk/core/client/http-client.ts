import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BaseClient } from './base-client';
import { ErrorHubConfig, GetErrorOptions, ErrorResult } from '../types';

/**
 * HTTP client for interacting with ErrorHub API
 */
export class HttpClient extends BaseClient {
  private client: AxiosInstance;

  constructor(config: ErrorHubConfig) {
    super(config);

    // Create an axios instance with base configuration
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {})
      }
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => response,
      error => {
        this.log('error', 'API request failed', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get error message by code
   * @param options Request options
   * @returns Error request result
   */
  public async getError(options: GetErrorOptions): Promise<ErrorResult> {
    const { code, language = this.config.defaultLanguage, params, version } = options;
    
    // Check cache
    const cacheKey = this.createCacheKey(options);
    const cachedResult = this.getFromCache(cacheKey);
    
    if (cachedResult) {
      this.log('debug', 'Using cached error message', { code, language });
      return cachedResult;
    }
    
    try {
      // Form request parameters
      const queryParams: Record<string, string> = {
        lang: language
      };
      
      if (version) {
        queryParams.version = version.toString();
      }
      
      // Execute API request
      const response = await this.client.get(`/api/errors/${code}`, {
        params: queryParams
      });
      
      // Get result
      const result: ErrorResult = {
        code: response.data.code,
        message: response.data.message,
        locale: response.data.locale,
        isFallback: response.data.isFallback,
        metadata: response.data.metadata,
        version: response.data.version
      };
      
      // Save result to cache
      this.setToCache(cacheKey, result);
      
      this.log('debug', 'Retrieved error message from API', { code, language });
      return result;
    } catch (error: any) {
      this.log('error', `Failed to get error message for code: ${code}`, error);
      
      // Return error code as a fallback
      return {
        code,
        message: code,
        locale: language,
        isFallback: true,
        version: version || 0
      };
    }
  }

  /**
   * Get a batch of errors in one request
   * @param codes Array of error codes
   * @param language Language
   * @returns Array of results
   */
  public async getBulkErrors(codes: string[], language: string = this.config.defaultLanguage): Promise<ErrorResult[]> {
    if (codes.length === 0) {
      return [];
    }

    try {
      const response = await this.client.post('/api/errors/batch', {
        codes,
        language
      });

      const results: ErrorResult[] = response.data.errors;
      
      // Cache each error
      results.forEach(result => {
        const cacheKey = `${result.code}:${language}:${result.version || 'latest'}`;
        this.setToCache(cacheKey, result);
      });

      return results;
    } catch (error: any) {
      this.log('error', 'Failed to get bulk error messages', error);
      
      // Return codes as fallback
      return codes.map(code => ({
        code,
        message: code,
        locale: language,
        isFallback: true,
        version: 0
      }));
    }
  }
} 