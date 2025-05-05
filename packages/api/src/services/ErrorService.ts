import { Logger } from 'pino';
import { DataSource, Repository } from 'typeorm';
import { ErrorTranslationEntity, ErrorCodeEntity, ErrorCategoryEntity } from '@/db';
import pino from 'pino';


/**
 * Service for managing error codes and translations
 */
export class ErrorService {
  private errorCodeRepository: Repository<ErrorCodeEntity>;
  private errorCategoryRepository: Repository<ErrorCategoryEntity>;
  private errorTranslationRepository: Repository<ErrorTranslationEntity>;
  private logger: Logger;
  constructor(
    private readonly dataSource: DataSource,
  ) {
    this.errorCodeRepository = this.dataSource.getRepository(ErrorCodeEntity);
    this.errorCategoryRepository = this.dataSource.getRepository(ErrorCategoryEntity);
    this.errorTranslationRepository = this.dataSource.getRepository(ErrorTranslationEntity);
    this.logger = pino({
      name: 'error-service'
    });
  }

  /**
   * Get all error codes with pagination and filtering
   */
  async getAllErrors(options?: ErrorListOptions): Promise<PaginatedResult<ErrorCodeEntity>> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        categoryId, 
        searchTerm,
        includeTranslations = false,
        includeCategory = false 
      } = options || {};

      // Prepare find options
      const findOptions: any = {
        skip: (page - 1) * limit,
        take: limit,
        relations: {}
      };

      // Add optional relations
      if (includeTranslations) {
        findOptions.relations.translations = true;
      }
      
      if (includeCategory) {
        findOptions.relations.category = true;
      }

      // Add optional filters
      if (categoryId) {
        findOptions.where = { categoryId };
      }

      // Search implementation (would be more sophisticated in production)
      if (searchTerm) {
        // Override existing where condition if any
        findOptions.where = {
          ...findOptions.where,
          code: searchTerm.includes('.') ? searchTerm : undefined
        };
      }
      
      // Get results
      const [items, total] = await Promise.all([
        this.errorCodeRepository.find(findOptions),
        // Count query with the same filters but without pagination
        this.errorCodeRepository.count(findOptions)
      ]);

      return {
        data: items,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to get error codes');
      throw new ServiceError('Failed to get error codes', { cause: error });
    }
  }

  /**
   * Get error code by its unique code
   */
  async getErrorByCode(code: string, options?: GetErrorOptions): Promise<ErrorCodeEntity | null> {
    try {
      const { 
        includeTranslations = false,
        includeCategory = false,
        language
      } = options || {};

      // Prepare find options
      const findOptions: any = {
        relations: {}
      };

      // Add optional relations
      if (includeTranslations) {
        findOptions.relations.translations = true;
      }
      
      if (includeCategory) {
        findOptions.relations.category = true;
      }
      
      const errorCode = await this.errorCodeRepository.findOne({
        where: {
          code
        },
        ...findOptions
      });
      
      if (!errorCode) {
        return null;
      }

      // If language is specified, get only the relevant translation
      if (language && errorCode.translations) {
        const translation = this.findBestTranslation(errorCode.translations, language);
        if (translation) {
          errorCode.translations = [translation];
        }
      }
      
      return errorCode;
    } catch (error) {
      this.logger.error({ error, code }, 'Failed to get error code');
      throw new Error(`Failed to get error code: ${code}, error: ${error}`);
    }
  }

  /**
   * Create a new error code
   */
  async createError(data: CreateErrorDto): Promise<ErrorCodeEntity> {
    try {
      // Check if error code already exists
      const existing = await this.errorCodeRepository.findByCode(data.code);
      if (existing) {
        throw new ResourceConflictError(`Error code already exists: ${data.code}`);
      }

      // Validate category if provided
      if (data.categoryId) {
        const category = await this.errorCategoryRepository.findById(data.categoryId);
        if (!category) {
          throw new ResourceNotFoundError(`Category not found: ${data.categoryId}`);
        }
      }

      // Create error code with validated data
      return this.errorCodeRepository.create(data);
    } catch (error) {
      if (error instanceof ResourceConflictError || error instanceof ResourceNotFoundError) {
        throw error; // Rethrow domain errors
      }
      
      this.logger.error({ error, data }, 'Failed to create error code');
      throw new ServiceError('Failed to create error code', { cause: error });
    }
  }

  /**
   * Update an existing error code
   */
  async updateError(code: string, data: UpdateErrorDto): Promise<ErrorCodeEntity | null> {
    try {
      // Check if error code exists
      const existing = await this.errorCodeRepository.findByCode(code);
      if (!existing) {
        return null;
      }

      // Validate category if provided
      if (data.categoryId) {
        const category = await this.errorCategoryRepository.findById(data.categoryId);
        if (!category) {
          throw new ResourceNotFoundError(`Category not found: ${data.categoryId}`);
        }
      }

      // Update error code with validated data
      return this.errorCodeRepository.update(code, data);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error; // Rethrow domain errors
      }
      
      this.logger.error({ error, code, data }, 'Failed to update error code');
      throw new ServiceError(`Failed to update error code: ${code}`, { cause: error });
    }
  }

  /**
   * Delete an error code and all its translations
   */
  async deleteError(code: string): Promise<boolean> {
    try {
      return this.dataSource.transaction(async () => {
        // Check if error code exists
        const existingCode = await this.errorCodeRepository.findOne({
          where: {
            code
          }
        });
        if (!existingCode) {
          return false;
        }

        // Delete translations first (to maintain referential integrity)
        await this.errorTranslationRepository.delete({ errorCode: { code } });
        
        return this.errorCodeRepository.delete(existingCode.id);
       
      });
    } catch (error) {
      this.logger.error({ error, code }, 'Failed to delete error code');
      throw new ServiceError(`Failed to delete error code: ${code}`, { cause: error });
    }
  }

  /**
   * Get errors by category ID
   */
  async getErrorsByCategory(categoryId: number): Promise<ErrorCodeEntity[]> {
    try {
      // Check if category exists
      const category = await this.errorCategoryRepository.findById(categoryId);
      if (!category) {
        throw new ResourceNotFoundError(`Category not found: ${categoryId}`);
      }

      return this.errorCodeRepository.findByCategoryId(categoryId);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error; // Rethrow domain errors
      }
      
      this.logger.error({ error, categoryId }, 'Failed to get errors by category');
      throw new ServiceError(`Failed to get errors by category: ${categoryId}`, { cause: error });
    }
  }

  /**
   * Get localized error message with parameter substitution
   */
  async getLocalizedError(
    code: string, 
    language: string, 
    params?: Record<string, string>
  ): Promise<LocalizedErrorResponse> {
    try {
      // Get error with translations
      const errorCode = await this.errorCodeRepository.findByCode(code, {
        relations: ['translations', 'category']
      });
      
      if (!errorCode) {
        throw new ResourceNotFoundError(`Error code not found: ${code}`);
      }

      // Find best translation or fallback to default message
      let message = errorCode.defaultMessage;
      let locale = 'default';
      let isFallback = true;
      
      if (errorCode.translations && errorCode.translations.length > 0) {
        const translation = this.findBestTranslation(errorCode.translations, language);
        
        if (translation) {
          message = translation.message;
          locale = translation.language;
          isFallback = false;
        }
      }

      // Format message with parameters if provided
      const formattedMessage = this.formatErrorMessage(message, params);
      
      return {
        code: errorCode.code,
        message: formattedMessage,
        locale,
        isFallback,
        category: errorCode.category ? {
          id: errorCode.category.id,
          name: errorCode.category.name
        } : undefined,
        metadata: {
          // Additional metadata could be added here
        },
        version: 1 // Version management would be implemented here
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error; // Rethrow domain errors
      }
      
      this.logger.error({ error, code, language }, 'Failed to get localized error');
      throw new ServiceError(`Failed to get localized error: ${code}`, { cause: error });
    }
  }

  /**
   * Create or update a translation for an error code
   */
  async upsertTranslation(
    errorCode: string, 
    language: string, 
    message: string
  ): Promise<ErrorTranslationEntity> {
    try {
      return this.dataSource.transaction(async entityManager => {
        // Get error code
        const error = await this.errorCodeRepository.findByCode(errorCode);
        if (!error) {
          throw new ResourceNotFoundError(`Error code not found: ${errorCode}`);
        }
        
        // Check if translation exists
        const existingTranslation = await this.errorTranslationRepository.findByErrorCodeAndLanguage(
          errorCode, 
          language
        );
        
        if (existingTranslation) {
          // Update existing translation
          return this.errorTranslationRepository.update(
            existingTranslation.id, 
            { message }
          ) as Promise<ErrorTranslationEntity>;
        } else {
          // Create new translation
          return this.errorTranslationRepository.create(
            { language, message },
            error
          );
        }
      });
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error; // Rethrow domain errors
      }
      
      this.logger.error(
        { error, errorCode, language }, 
        'Failed to upsert translation'
      );
      throw new ServiceError(
        `Failed to upsert translation for: ${errorCode}/${language}`, 
        { cause: error }
      );
    }
  }

  /**
   * Format message with parameter substitution
   * @private
   */
  private formatErrorMessage(message: string, params?: Record<string, string>): string {
    if (!params) {
      return message;
    }
    
    return message.replace(/\{([^}]+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Find best translation based on language preference
   * @private
   */
  private findBestTranslation(
    translations: ErrorTranslationEntity[], 
    language: string
  ): ErrorTranslationEntity | null {
    // Exact match
    const exactMatch = translations.find(t => t.language === language);
    if (exactMatch) {
      return exactMatch;
    }
    
    // Language fallback logic
    // Example: 'en-US' -> 'en'
    if (language.includes('-')) {
      const languageBase = language.split('-')[0];
      const baseMatch = translations.find(t => t.language === languageBase);
      if (baseMatch) {
        return baseMatch;
      }
    }
    
    // No matching translation found
    return null;
  }

  /**
   * Count error codes based on filters
   * @private
   */
  private async count(options: any): Promise<number> {
    // Remove pagination options
    const { skip, take, ...countOptions } = options;
    return this.errorCodeRepository.count(countOptions);
  }
}