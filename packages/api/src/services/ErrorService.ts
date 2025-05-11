import { Logger } from 'pino';
import { DataSource, Repository, FindOptionsRelations, EntityManager } from 'typeorm';
import { ErrorCodeEntity, ErrorCategoryEntity, ErrorCodeStatus } from '@/db';
import pino from 'pino';
import { PaginationDto } from '@/dto/common/pagination.dto';
import { offsetPaginate } from '@/utils/pagination';
import { ResourceConflictError, ResourceNotFoundError, ServiceError } from '@/utils/errors';
import { 
  createErrorCodeRequestSchema, // This schema includes translations and categoryId, used for defining CreateErrorCodeInternalDto
} from '@/dto/errors/create.dto'; 
import { updateErrorCodeRequestSchema } from '@/dto/errors/update.dto';
import { z } from 'zod';

// This DTO is for the ErrorService.create method, only containing fields for ErrorCodeEntity itself.
const createErrorCodeInternalSchema = z.object({
  code: createErrorCodeRequestSchema.shape.code, 
  context: createErrorCodeRequestSchema.shape.context.optional(),
  categoryIds: createErrorCodeRequestSchema.shape.categoryIds.optional(), // Changed from categoryId
  status: z.nativeEnum(ErrorCodeStatus).optional(),         // Changed to nativeEnum
});
type CreateErrorCodeInternalDto = z.infer<typeof createErrorCodeInternalSchema>;

// CreateErrorServiceDto is no longer used as create method now uses CreateErrorCodeInternalDto
// type CreateErrorServiceDto = z.infer<typeof createErrorCodeRequestSchema>; 

type UpdateErrorServiceDto = z.infer<typeof updateErrorCodeRequestSchema>;

// Read-only operation options
interface GetErrorOptions {
  includeTranslations?: boolean;
  // includeCategory has been changed to includeCategories to reflect ManyToMany relation
  includeCategories?: boolean; 
}

/**
 * Service for managing error codes, extending BaseListService for list operations.
 */
export class ErrorService {
  // DataSource is kept for initiating transactions at a higher level (Use Cases)
  // Repositories initialized in constructor can be used for read operations outside explicit transactions
  // or if a service method itself decides to manage its own simple transaction (less common with this pattern).
  private dataSource: DataSource;
  private errorCategoryRepository: Repository<ErrorCategoryEntity>;
  // private errorTranslationRepository: Repository<ErrorTranslationEntity>; // Will use from EntityManager
  private errorCodeRepository: Repository<ErrorCodeEntity>;
  private logger: Logger;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource; // Still needed for Use Cases to start transactions
    this.errorCodeRepository = this.dataSource.getRepository(ErrorCodeEntity);
    this.errorCategoryRepository = this.dataSource.getRepository(ErrorCategoryEntity);
    // this.errorTranslationRepository = this.dataSource.getRepository(ErrorTranslationEntity); // Not strictly needed if all writes go through EM
    this.logger = pino({ name: 'error-service' });
  }

  // --- Helper methods for defining query capabilities (used by read methods) ---
  protected getAllowedFields(): (keyof ErrorCodeEntity)[] {
    // Removed categoryId, categories will be handled by relations
    return [
      'id', 'code', 'status', 'context', 'createdAt', 'updatedAt'
    ];
  }

  protected getSearchableFields(): (keyof ErrorCodeEntity)[] {
    return ['code', 'context'];
  }

  protected getAllowedRelations(): string[] {
    // Changed 'category' to 'categories'
    return ['categories', 'translations'];
  }
  
  // --- Read operations (typically do not require an external EntityManager unless part of a larger transaction with specific isolation needs) ---
  async getAll(pagination: PaginationDto, baseUrl: string): Promise<unknown> {
    const result = await offsetPaginate<ErrorCodeEntity>(this.errorCodeRepository, {
      ...pagination,
      alias: 'error',
      searchableFields: this.getSearchableFields(),
      // relations: this.getAllowedRelations(), // Enable if offsetPaginate supports it and it's needed
      baseUrl,
    });
    return result;
  }

  async getByCode(code: string, options?: GetErrorOptions): Promise<ErrorCodeEntity | null> {
    try {
      const { includeTranslations = false, includeCategories = false } = options || {}; // Changed from includeCategory
      const findOptions: { relations?: FindOptionsRelations<ErrorCodeEntity> } = {};
      const relations: FindOptionsRelations<ErrorCodeEntity> = {};
      if (includeTranslations) relations.translations = true;
      if (includeCategories) relations.categories = true; // Changed from category to categories
      if (Object.keys(relations).length > 0) findOptions.relations = relations;
      
      // Using the repository initialized in the constructor for this read operation
      return this.errorCodeRepository.findOne({ where: { code }, ...findOptions });
    } catch (error) {
      this.logger.error({ error, code }, 'Failed to get error code by code');
      throw new ServiceError(`Failed to get error code by code: ${code}`, { cause: error });
    }
  }

  // --- Write operations: these methods now require an EntityManager to be passed in --- 

  /**
   * Creates only the ErrorCodeEntity record. 
   * Category validation/association and translation creation should be handled by the UseCase.
   */
  async create(entityManager: EntityManager, data: CreateErrorCodeInternalDto): Promise<ErrorCodeEntity> {
    if (!data.code) {
      throw new ServiceError('Error code is required for creation.', { statusCode: 400 });
    }

    const errorCodeRepo = entityManager.getRepository(ErrorCodeEntity);
    const errorCategoryRepo = entityManager.getRepository(ErrorCategoryEntity);

    const existing = await errorCodeRepo.findOneBy({ code: data.code });
    if (existing) {
      throw new ResourceConflictError(`Error code already exists: ${data.code}`);
    }
    
    const newErrorData: Partial<Omit<ErrorCodeEntity, 'categories' | 'id' | 'createdAt' | 'updatedAt' | 'translations'>> = {
      code: data.code,
      context: data.context,
      status: data.status || ErrorCodeStatus.DRAFT, 
    };

    const newErrorCode = errorCodeRepo.create(newErrorData);
    let savedError = await errorCodeRepo.save(newErrorCode);

    if (data.categoryIds?.length) {
      this.logger.info({ errorCodeId: savedError.id, categoryIds: data.categoryIds }, "Attempting to associate categories.");
      const categories = await errorCategoryRepo.findByIds(data.categoryIds); 
      if (categories.length !== data.categoryIds.length) {
          const foundCategoryIds = categories.map(c => c.id);
          const notFoundIds = data.categoryIds.filter(id => !foundCategoryIds.includes(id));
          this.logger.warn({ notFoundIds }, "Some category IDs provided were not found. Associating only found categories.");
          // Optional: throw error if not all categories are found
          // throw new ResourceNotFoundError(`One or more categories not found: ${notFoundIds.join(', ')}`);
      }
      savedError.categories = categories; 
      savedError = await errorCodeRepo.save(savedError); // Re-assign to get the potentially updated instance
      this.logger.info({ errorCodeId: savedError.id, associatedCategoriesCount: categories.length }, "Categories associated.");
    }
    
    // Return the instance that should have categories populated if they were set and saved.
    // If `save` doesn't return relations or doesn't update the instance in memory reliably with them,
    // a final findOne might be needed, but usually, TypeORM handles this for ManyToMany if eager loading is not used.
    return savedError;
  }

  async update(entityManager: EntityManager, code: string, data: UpdateErrorServiceDto): Promise<ErrorCodeEntity> {
    this.logger.info({ code, data }, "update called with EntityManager - core fields update.");
    
    const errorCodeRepo = entityManager.getRepository(ErrorCodeEntity);
    const errorCategoryRepo = entityManager.getRepository(ErrorCategoryEntity);

    const existingError = await errorCodeRepo.findOne({ where: { code }, relations: ['categories'] });
    if (!existingError) {
      throw new ResourceNotFoundError(`Error code not found: ${code}`);
    }

    // Update basic fields
    if (data.context !== undefined) existingError.context = data.context;
    if (data.status !== undefined) existingError.status = data.status as ErrorCodeStatus;
    // code is the identifier, not updated here.

    // Handle categoryIds update (full replacement of categories)
    if (data.categoryIds !== undefined) {
      if (data.categoryIds.length === 0) {
        existingError.categories = [];
      } else {
        const categories = await errorCategoryRepo.findByIds(data.categoryIds);
        if (categories.length !== data.categoryIds.length) {
          const foundCategoryIds = categories.map(c => c.id);
          const notFoundIds = data.categoryIds.filter(id => !foundCategoryIds.includes(id));
          this.logger.warn({ notFoundIds }, "During update, some category IDs were not found. Associating only found categories.");
          // Optional: throw error if not all categories are found
          // throw new ResourceNotFoundError(`One or more categories not found for update: ${notFoundIds.join(', ')}`);
        }
        existingError.categories = categories;
      }
    }

    const updatedError = await errorCodeRepo.save(existingError);
    this.logger.info({ errorCodeId: updatedError.id }, "ErrorCode entity updated. Translations must be handled by UseCase.");
    return updatedError;
  }
  
  async delete(entityManager: EntityManager, code: string): Promise<boolean> {
    this.logger.info({ code }, "delete called with EntityManager.");
    const errorCodeRepo = entityManager.getRepository(ErrorCodeEntity);
    // TODO: Consider what happens with translations - cascading delete in DB or manual deletion in UseCase?
    // For now, just deleting the ErrorCodeEntity.
    const result = await errorCodeRepo.delete({ code });
    if (result.affected === 0) {
      throw new ResourceNotFoundError(`Error code not found: ${code}`);
    }
    return true;
  }
}