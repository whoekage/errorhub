import { Logger } from 'pino';
import { DataSource, Repository, FindOptionsRelations } from 'typeorm';
import { ErrorTranslationEntity, ErrorCodeEntity, ErrorCategoryEntity } from '@/db';
import pino from 'pino';
import { CreateErrorDto, UpdateErrorDto, GetErrorOptions, LocalizedErrorResponse, ErrorListOptions } from '@/dto/errors';
import { ResourceConflictError, ResourceNotFoundError, ServiceError } from '@/utils/errors';
import { PaginatedResponse, PaginationDto } from '@/dto/common/pagination.dto';
import { keysetPaginate } from '@/utils/pagination';

/**
 * Service for managing error codes, extending BaseListService for list operations.
 */
export class ErrorService {
  private dataSource: DataSource;
  private errorCategoryRepository: Repository<ErrorCategoryEntity>;
  private errorTranslationRepository: Repository<ErrorTranslationEntity>;
  private errorCodeRepository: Repository<ErrorCodeEntity>;
  private logger: Logger;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.errorCodeRepository = this.dataSource.getRepository(ErrorCodeEntity);
    this.errorCategoryRepository = this.dataSource.getRepository(ErrorCategoryEntity);
    this.errorTranslationRepository = this.dataSource.getRepository(ErrorTranslationEntity);
    this.logger = pino({ name: 'error-service' });
  }

  protected getAllowedFields(): (keyof ErrorCodeEntity)[] {
    return [
      'id', 
      'code', 
      'defaultMessage', 
      'categoryId', 
      'createdAt', 
      'updatedAt'
    ];
  }

  protected getSearchableFields(): (keyof ErrorCodeEntity)[] {
    return ['code', 'defaultMessage'];
  }

  protected getAllowedRelations(): string[] {
    return ['category', 'translations'];
  }
  async getAll(pagination: PaginationDto, baseUrl: string) {
    const result = await keysetPaginate<ErrorCodeEntity>(this.errorCodeRepository, {
      ...pagination,
      alias: 'error',
      searchableFields: this.getSearchableFields(),
      baseUrl
    });
    return result;
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

      const findOptions: { relations?: FindOptionsRelations<ErrorCodeEntity> } = {};
      const relations: FindOptionsRelations<ErrorCodeEntity> = {};

      if (includeTranslations) {
        relations.translations = true;
      }
      if (includeCategory) {
        relations.category = true;
      }
      if (Object.keys(relations).length > 0) {
        findOptions.relations = relations;
      }
      
      const errorCode = await this.errorCodeRepository.findOne({
        where: { code },
        ...findOptions
      });
      
      if (!errorCode) {
        return null;
      }

      if (language && errorCode.translations) {
        const translation = this.findBestTranslation(errorCode.translations, language);
        errorCode.translations = translation ? [translation] : []; 
      }
      
      return errorCode;
    } catch (error) {
      this.logger.error({ error, code }, 'Failed to get error code');
      throw new ServiceError(`Failed to get error code: ${code}`, { cause: error });
    }
  }

  /**
   * Create a new error code
   */
  async createError(data: CreateErrorDto): Promise<ErrorCodeEntity> {
    if (!data.code) {
        throw new Error('Error code is required to create an error.');
    }
    try {
      const existing = await this.errorCodeRepository.findOneBy({ code: data.code });
      if (existing) {
        throw new ResourceConflictError(`Error code already exists: ${data.code}`);
      }

      if (data.categoryId) {
        const category = await this.errorCategoryRepository.findOneBy({ id: data.categoryId });
        if (!category) {
          throw new ResourceNotFoundError(`Category not found: ${data.categoryId}`);
        }
      }
      console.log({data});
      const newError = this.errorCodeRepository.create(data as ErrorCodeEntity);
      return this.errorCodeRepository.save(newError);
    } catch (error) {
      if (error instanceof ResourceConflictError || error instanceof ResourceNotFoundError) {
        throw error;
      }
      this.logger.error({ error, data }, 'Failed to create error code');
      throw new ServiceError('Failed to create error code', { cause: error });
    }
  }

  /**
   * Update an existing error code
   */
  async updateError(code: string, data: UpdateErrorDto): Promise<ErrorCodeEntity> {
    try {
      const existing = await this.repository.findOneBy({ code });
      if (!existing) {
        throw new ResourceNotFoundError(`Error code not found: ${code}`);
      }

      if (data.categoryId) {
        const category = await this.errorCategoryRepository.findOneBy({ id: data.categoryId });
        if (!category) {
          throw new ResourceNotFoundError(`Category not found: ${data.categoryId}`);
        }
      }

      this.repository.merge(existing, data);
      return this.repository.save(existing);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      this.logger.error({ error, code, data }, 'Failed to update error code');
      throw new ServiceError('Failed to update error code', { cause: error });
    }
  }

  /**
   * Delete an error code
   */
  async deleteError(code: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({ code });
      if (result.affected === 0) {
        throw new ResourceNotFoundError(`Error code not found: ${code}`);
      }
      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      this.logger.error({ error, code }, 'Failed to delete error code');
      throw new ServiceError('Failed to delete error code', { cause: error });
    }
  }

  /**
   * Get errors by category ID
   */
  async getErrorsByCategory(categoryId: number): Promise<ErrorCodeEntity[]> {
    try {
      return this.repository.find({ where: { categoryId } });
    } catch (error) {
      this.logger.error({ error, categoryId }, 'Failed to get errors by category');
      throw new ServiceError('Failed to retrieve errors for category', { cause: error });
    }
  }

  /**
   * Get localized error message
   */
  async getLocalizedError(
    code: string, 
    language: string, 
    params?: Record<string, string>
  ): Promise<LocalizedErrorResponse> {
    try {
      const errorCode = await this.getErrorByCode(code, { 
        includeTranslations: true, 
        includeCategory: true,
        language
      });

      if (!errorCode) {
        throw new ResourceNotFoundError(`Error code not found: ${code}`);
      }

      let message = errorCode.defaultMessage;
      let localeUsed = 'default';

      if (errorCode.translations && errorCode.translations.length > 0) {
        message = errorCode.translations[0].message;
        localeUsed = language;
      }

      const formattedMessage = this.formatErrorMessage(message, params);
      
      return {
        code: errorCode.code,
        message: formattedMessage,
        locale: localeUsed,
        category: errorCode.category ? errorCode.category.name : undefined,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      this.logger.error({ error, code, language }, 'Failed to get localized error');
      throw new ServiceError('Failed to retrieve localized error message', { cause: error });
    }
  }

  /**
   * Create or update a translation for an error code
   */
  async upsertTranslation(
    code: string, 
    language: string, 
    message: string
  ): Promise<ErrorTranslationEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const errorCode = await queryRunner.manager.findOne(ErrorCodeEntity, { where: { code } });
      if (!errorCode) {
        throw new ResourceNotFoundError(`Error code not found: ${code}`);
      }

      let translation = await queryRunner.manager.findOne(ErrorTranslationEntity, {
        where: { errorCode: { id: errorCode.id }, language }
      });

      if (translation) {
        translation.message = message;
      } else {
        translation = queryRunner.manager.create(ErrorTranslationEntity, {
          errorCodeId: errorCode.id,
          language,
          message,
          errorCode: errorCode
        });
      }

      const savedTranslation = await queryRunner.manager.save(translation);
      await queryRunner.commitTransaction();
      return savedTranslation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      this.logger.error({ error, code, language, message }, 'Failed to upsert translation');
      throw new ServiceError('Failed to upsert translation', { cause: error });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Helper to format error message parameters (e.g., replace {placeholder})
   */
  private formatErrorMessage(message: string, params?: Record<string, string>): string {
    if (!params) {
      return message;
    }
    return message.replace(/\{(\w+)\}/g, (_, key) => params[key] || `{${key}}`);
  }

  /**
   * Helper to find the best matching translation (exact or language prefix)
   */
  private findBestTranslation(
    translations: ErrorTranslationEntity[], 
    language: string
  ): ErrorTranslationEntity | null {
    if (!translations || translations.length === 0) {
        return null;
    }
    return translations.find(t => t.language === language) || null;
  }
}