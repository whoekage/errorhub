import { ErrorCodeRepository } from '@/db/repositories/ErrorCodeRepository';
import { ErrorCategoryRepository } from '@/db/repositories/ErrorCategoryRepository';
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity';
import { z } from 'zod';
import { createErrorCodeRequest, updateErrorCodeRequest } from '@/dto/index';

/**
 * Service for managing error codes
 */
export class ErrorService {
  constructor(
    private errorCodeRepository: ErrorCodeRepository,
    private errorCategoryRepository: ErrorCategoryRepository
  ) {}

  /**
   * Get all error codes
   * @param options Optional find options
   */
  async getAllErrors(options: object = {}): Promise<ErrorCodeEntity[]> {
    return this.errorCodeRepository.findAll(options);
  }

  /**
   * Get error code by its code
   * @param code The error code
   * @param options Optional find options
   */
  async getErrorByCode(code: string, options: object = {}): Promise<ErrorCodeEntity | null> {
    return this.errorCodeRepository.findByCode(code, options);
  }

  /**
   * Create a new error code
   * @param data Error code data (categoryId is optional)
   */
  async createError(data: z.infer<typeof createErrorCodeRequest>): Promise<ErrorCodeEntity> {
    // Check if category exists (if categoryId is provided)
    if (data.categoryId) {
      const category = await this.errorCategoryRepository.findById(data.categoryId);
      if (!category) {
        throw new Error(`Category with ID ${data.categoryId} not found`);
      }
    }
    
    return this.errorCodeRepository.create(data);
  }

  /**
   * Update an existing error
   * @param code Error code to update
   * @param data Updated data (categoryId is optional)
   */
  async updateError(code: string, data: z.infer<typeof updateErrorCodeRequest>): Promise<ErrorCodeEntity | null> {
    // Check if category exists if it's being updated
    if (data.categoryId) {
      const category = await this.errorCategoryRepository.findById(data.categoryId);
      if (!category) {
        throw new Error(`Category with ID ${data.categoryId} not found`);
      }
    }
    
    return this.errorCodeRepository.update(code, data);
  }

  /**
   * Delete an error code
   * @param code The error code to delete
   */
  async deleteError(code: string): Promise<boolean> {
    return this.errorCodeRepository.delete(code);
  }

  /**
   * Get errors by category
   * @param categoryId Category ID
   */
  async getErrorsByCategory(categoryId: number): Promise<ErrorCodeEntity[]> {
    return this.errorCodeRepository.findByCategoryId(categoryId);
  }
} 