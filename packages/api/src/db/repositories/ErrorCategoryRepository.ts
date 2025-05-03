import { Repository, FindOptionsWhere, DataSource, FindManyOptions, FindOneOptions, EntityManager } from 'typeorm';
import { ErrorCategoryEntity } from '@/db/entities/ErrorCategoryEntity';


export interface IErrorCategoryRepository {
  findAll(options?: FindManyOptions<ErrorCategoryEntity>): Promise<ErrorCategoryEntity[]>;
  findById(id: number, options?: FindOneOptions<ErrorCategoryEntity>): Promise<ErrorCategoryEntity | null>;
  findByName(name: string, options?: FindOneOptions<ErrorCategoryEntity>): Promise<ErrorCategoryEntity | null>;
  create(data: Partial<ErrorCategoryEntity>): Promise<ErrorCategoryEntity>;
  update(id: number, data: Partial<ErrorCategoryEntity>): Promise<ErrorCategoryEntity | null>;
  delete(id: number): Promise<boolean>;
}

export class ErrorCategoryRepository implements IErrorCategoryRepository {
  private repository: Repository<ErrorCategoryEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ErrorCategoryEntity);
  }

  /**
   * Find all error categories
   * @param options Optional find options
   */
  async findAll(options: FindManyOptions<ErrorCategoryEntity> = {}): Promise<ErrorCategoryEntity[]> {
    return this.repository.find(options);
  }

  /**
   * Find error category by ID
   * @param id The category ID
   * @param options Optional find options
   */
  async findById(id: number, options: FindOneOptions<ErrorCategoryEntity> = {}): Promise<ErrorCategoryEntity | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<ErrorCategoryEntity>,
      ...options,
    });
  }

  /**
   * Find error category by name
   * @param name The category name
   * @param options Optional find options
   */
  async findByName(name: string, options: FindOneOptions<ErrorCategoryEntity> = {}): Promise<ErrorCategoryEntity | null> {
    return this.repository.findOne({
      where: { name } as FindOptionsWhere<ErrorCategoryEntity>,
      ...options,
    });
  }

  /**
   * Create a new error category
   * @param data Category data
   */
  async create(data: Partial<ErrorCategoryEntity>): Promise<ErrorCategoryEntity> {
    const category = this.repository.create(data);
    return this.repository.save(category);
  }

  /**
   * Update an existing error category
   * @param id The category ID
   * @param data Updated category data
   */
  async update(id: number, data: Partial<ErrorCategoryEntity>): Promise<ErrorCategoryEntity | null> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const category = await entityManager.findOne(ErrorCategoryEntity, {
        where: { id } as FindOptionsWhere<ErrorCategoryEntity>,
      });

      if (!category) {
        return null; // Transaction will be rolled back if category is null
      }

      // Update the category with the new data
      Object.assign(category, data);
      return entityManager.save(ErrorCategoryEntity, category);
    });
  }

  /**
   * Delete an error category
   * @param id The category ID
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.dataSource.transaction(async (entityManager: EntityManager) => {
      return entityManager.delete(ErrorCategoryEntity, { 
        id 
      } as FindOptionsWhere<ErrorCategoryEntity>);
    });
    
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
} 