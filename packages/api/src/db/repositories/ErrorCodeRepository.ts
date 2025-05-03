import { Repository, FindOptionsWhere, DataSource, FindManyOptions, FindOneOptions, EntityManager } from 'typeorm';
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity';

export interface IErrorCodeRepository {
  findAll(options?: FindManyOptions<ErrorCodeEntity>): Promise<ErrorCodeEntity[]>;
  findByCode(code: string, options?: FindOneOptions<ErrorCodeEntity>): Promise<ErrorCodeEntity | null>;
  findByCategoryId(categoryId: number, options?: FindManyOptions<ErrorCodeEntity>): Promise<ErrorCodeEntity[]>;
  create(data: Partial<ErrorCodeEntity>): Promise<ErrorCodeEntity>;
  update(code: string, data: Partial<ErrorCodeEntity>): Promise<ErrorCodeEntity | null>;
  delete(code: string): Promise<boolean>;
}

export class ErrorCodeRepository implements IErrorCodeRepository {
  private repository: Repository<ErrorCodeEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ErrorCodeEntity);
  }

  /**
   * Find all error codes
   * @param options Optional find options
   */
  async findAll(options: FindManyOptions<ErrorCodeEntity> = {}): Promise<ErrorCodeEntity[]> {
    return this.repository.find(options);
  }

  /**
   * Find error code by its unique code
   * @param code The error code
   * @param options Optional find options
   */
  async findByCode(code: string, options: FindOneOptions<ErrorCodeEntity> = {}): Promise<ErrorCodeEntity | null> {
    return this.repository.findOne({
      where: { code } as FindOptionsWhere<ErrorCodeEntity>,
      ...options,
    });
  }

  /**
   * Find error codes by category ID
   * @param categoryId The category ID
   * @param options Optional find options
   */
  async findByCategoryId(categoryId: number, options: FindManyOptions<ErrorCodeEntity> = {}): Promise<ErrorCodeEntity[]> {
    return this.repository.find({
      where: { categoryId } as FindOptionsWhere<ErrorCodeEntity>,
      ...options,
    });
  }

  /**
   * Create a new error code
   * @param data Error code data (categoryId is optional)
   */
  async create(data: Partial<ErrorCodeEntity>): Promise<ErrorCodeEntity> {
    const errorCode = this.repository.create(data);
    return this.repository.save(errorCode);
  }

  /**
   * Update an existing error code
   * @param code The error code to update
   * @param data Updated error code data (categoryId is optional)
   */
  async update(code: string, data: Partial<ErrorCodeEntity>): Promise<ErrorCodeEntity | null> {
    
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const errorCode = await entityManager.findOne(ErrorCodeEntity, {
        where: { code } as FindOptionsWhere<ErrorCodeEntity>,
      });

      if (!errorCode) {
        return null; // Transaction will be rolled back if errorCode is null
      }

      // Update the error code with the new data
      Object.assign(errorCode, data);
      return entityManager.save(ErrorCodeEntity, errorCode);
    });
  }

  /**
   * Delete an error code by its code
   * @param code The error code to delete
   */
  async delete(code: string): Promise<boolean> {
    const result = await this.dataSource.transaction(async (entityManager: EntityManager) => {
      return entityManager.delete(ErrorCodeEntity, { 
        code 
      } as FindOptionsWhere<ErrorCodeEntity>);
    });
    
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
} 