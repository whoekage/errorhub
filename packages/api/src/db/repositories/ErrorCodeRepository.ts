import { Repository, FindOptionsWhere } from 'typeorm';
import { ErrorCodeEntity } from '../entities/ErrorCodeEntity';
import { AppDataSource } from '../data-source';
import { CreateErrorCodeDto, UpdateErrorCodeDto } from '../../dto/error-code.dto';

export class ErrorCodeRepository {
  private repository: Repository<ErrorCodeEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ErrorCodeEntity);
  }

  /**
   * Find all error codes
   * @param options Optional find options
   */
  async findAll(options: object = {}): Promise<ErrorCodeEntity[]> {
    return this.repository.find(options);
  }

  /**
   * Find error code by its unique code
   * @param code The error code
   * @param options Optional find options
   */
  async findByCode(code: string, options: object = {}): Promise<ErrorCodeEntity | null> {
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
  async findByCategoryId(categoryId: number, options: object = {}): Promise<ErrorCodeEntity[]> {
    return this.repository.find({
      where: { categoryId } as FindOptionsWhere<ErrorCodeEntity>,
      ...options,
    });
  }

  /**
   * Create a new error code
   * @param data Error code data
   */
  async create(data: CreateErrorCodeDto): Promise<ErrorCodeEntity> {
    const errorCode = this.repository.create(data as Partial<ErrorCodeEntity>);
    return this.repository.save(errorCode);
  }

  /**
   * Update an existing error code
   * @param code The error code to update
   * @param data Updated error code data
   */
  async update(code: string, data: UpdateErrorCodeDto): Promise<ErrorCodeEntity | null> {
    const errorCode = await this.findByCode(code);
    
    if (!errorCode) {
      return null;
    }
    
    Object.assign(errorCode, data);
    return this.repository.save(errorCode);
  }

  /**
   * Delete an error code
   * @param code The code to delete
   */
  async delete(code: string): Promise<boolean> {
    const result = await this.repository.delete({ code } as FindOptionsWhere<ErrorCodeEntity>);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
} 