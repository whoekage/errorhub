import { ErrorCodeRepository } from '../db/repositories/ErrorCodeRepository';
import { ErrorCategoryRepository } from '../db/repositories/ErrorCategoryRepository';
import { CreateErrorCodeDto, UpdateErrorCodeDto } from '../dto/error-code.dto';
import { ErrorCodeEntity } from '../db/entities/ErrorCodeEntity';

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
   */
  async getAllErrors(options = {}): Promise<ErrorCodeEntity[]> {
    return this.errorCodeRepository.findAll(options);
  }

  /**
   * Get error by code
   * @param code Error code
   * @param lang Optional language for translation
   */
  async getErrorByCode(code: string, lang?: string): Promise<ErrorCodeEntity | null> {
    const options = lang ? {
      relations: ['translations']
    } : {};
    
    return this.errorCodeRepository.findByCode(code, options);
  }

  /**
   * Create a new error code
   * @param data Error code data
   */
  async createError(data: CreateErrorCodeDto): Promise<ErrorCodeEntity> {
    // Check if category exists
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
   * @param data Updated data
   */
  async updateError(code: string, data: UpdateErrorCodeDto): Promise<ErrorCodeEntity | null> {
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
   * @param code Error code to delete
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