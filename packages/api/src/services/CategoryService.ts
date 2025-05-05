import { DataSource, Repository } from 'typeorm';
import { ErrorCategoryEntity, ErrorCodeEntity } from '@/db';
import { BaseListService } from './BaseListService';
import { Logger } from 'pino';
import pino from 'pino';

// Placeholder types (replace with actual DTOs/Interfaces)
type CreateCategoryDto = Partial<ErrorCategoryEntity> & { name: string }; // Ensure name is required
type UpdateCategoryDto = Partial<ErrorCategoryEntity>;
// Assuming error classes are defined elsewhere or globally
declare class ServiceError extends Error { constructor(message: string, options?: { cause: unknown }); }
declare class ResourceNotFoundError extends Error { constructor(message: string); }
declare class ResourceConflictError extends Error { constructor(message: string); }

/**
 * Service for managing error categories, extending BaseListService for list operations.
 */
export class CategoryService extends BaseListService<ErrorCategoryEntity> {
  private errorCodeRepository: Repository<ErrorCodeEntity>;
  private logger: Logger;

  constructor(
    protected override dataSource: DataSource
  ) {
    super(dataSource, ErrorCategoryEntity);
    this.errorCodeRepository = this.dataSource.getRepository(ErrorCodeEntity);
    this.logger = pino({ name: 'category-service' });
  }

  // --- Implementation of BaseListService abstract methods --- 

  protected getAllowedFields(): (keyof ErrorCategoryEntity)[] {
    return [
      'id', 
      'name', 
      'description', 
      'createdAt', 
      'updatedAt'
    ];
  }

  protected getSearchableFields(): (keyof ErrorCategoryEntity)[] {
    return ['name', 'description'];
  }

  protected getAllowedRelations(): string[] {
    return ['errorCodes']; 
  }

  // --- Existing specialized methods --- 

  /**
   * Get category by its ID
   */
  async getCategoryById(id: number): Promise<ErrorCategoryEntity | null> {
    try {
      return this.repository.findOne({ 
        where: { id },
        relations: { errorCodes: true }
      });
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to get category by ID');
      throw new ServiceError(`Failed to retrieve category: ${id}`, { cause: error });
    }
  }
  
  /**
   * Get category by name
   */
  async getCategoryByName(name: string): Promise<ErrorCategoryEntity | null> {
    try {
      return this.repository.findOne({ where: { name } });
    } catch (error) {
       this.logger.error({ error, name }, 'Failed to get category by name');
       throw new ServiceError('Failed to retrieve category by name', { cause: error });
    }
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryDto): Promise<ErrorCategoryEntity> {
    if (!data.name) {
        throw new Error('Category name is required.');
    }
    try {
      const existing = await this.repository.findOneBy({ name: data.name });
      if (existing) {
        throw new ResourceConflictError(`Category with name '${data.name}' already exists`);
      }
      const newCategory = this.repository.create(data as ErrorCategoryEntity);
      return this.repository.save(newCategory);
    } catch (error) {
      if (error instanceof ResourceConflictError) {
        throw error;
      }
      this.logger.error({ error, data }, 'Failed to create category');
      throw new ServiceError('Failed to create category', { cause: error });
    }
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: number, data: UpdateCategoryDto): Promise<ErrorCategoryEntity> {
    try {
      const category = await this.repository.findOneBy({ id });
      if (!category) {
        throw new ResourceNotFoundError(`Category with ID ${id} not found`);
      }
      
      if (data.name && data.name !== category.name) {
        const existing = await this.repository.findOneBy({ name: data.name });
        if (existing) {
          throw new ResourceConflictError(`Category with name '${data.name}' already exists`);
        }
      }

      this.repository.merge(category, data);
      return this.repository.save(category);
    } catch (error) {
      if (error instanceof ResourceNotFoundError || error instanceof ResourceConflictError) {
        throw error;
      }
      this.logger.error({ error, id, data }, 'Failed to update category');
      throw new ServiceError('Failed to update category', { cause: error });
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: number): Promise<boolean> {
    try {
      const category = await this.repository.findOne({ 
          where: { id }, 
          relations: { errorCodes: true } 
      });
      
      if (!category) {
        throw new ResourceNotFoundError(`Category with ID ${id} not found`);
      }

      if (category.errorCodes && category.errorCodes.length > 0) {
         throw new ResourceConflictError(
           `Cannot delete category ID ${id} as it has ${category.errorCodes.length} associated error codes.`
         );
      }

      const result = await this.repository.delete(id);
      return result.affected !== null && result.affected !== undefined && result.affected > 0;
    } catch (error) {
      if (error instanceof ResourceNotFoundError || error instanceof ResourceConflictError) {
        throw error;
      }
      this.logger.error({ error, id }, 'Failed to delete category');
      throw new ServiceError('Failed to delete category', { cause: error });
    }
  }
} 