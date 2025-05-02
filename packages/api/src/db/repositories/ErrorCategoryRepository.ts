import { Repository, FindOptionsWhere } from 'typeorm';
import { ErrorCategoryEntity } from '../entities/ErrorCategoryEntity';
import { AppDataSource } from '../data-source';
import { CreateErrorCategoryDto, UpdateErrorCategoryDto } from '../../dto/error-category.dto';

export class ErrorCategoryRepository {
  private repository: Repository<ErrorCategoryEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ErrorCategoryEntity);
  }

  /**
   * Find all error categories
   * @param options Optional find options
   */
  async findAll(options: object = {}): Promise<ErrorCategoryEntity[]> {
    return this.repository.find(options);
  }

  /**
   * Find error category by ID
   * @param id The category ID
   * @param options Optional find options
   */
  async findById(id: number, options: object = {}): Promise<ErrorCategoryEntity | null> {
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
  async findByName(name: string, options: object = {}): Promise<ErrorCategoryEntity | null> {
    return this.repository.findOne({
      where: { name } as FindOptionsWhere<ErrorCategoryEntity>,
      ...options,
    });
  }

  /**
   * Create a new error category
   * @param data Category data
   */
  async create(data: CreateErrorCategoryDto): Promise<ErrorCategoryEntity> {
    const category = this.repository.create(data);
    return this.repository.save(category);
  }

  /**
   * Update an existing error category
   * @param id The category ID
   * @param data Updated category data
   */
  async update(id: number, data: UpdateErrorCategoryDto): Promise<ErrorCategoryEntity | null> {
    const category = await this.findById(id);
    
    if (!category) {
      return null;
    }
    
    Object.assign(category, data);
    return this.repository.save(category);
  }

  /**
   * Delete an error category
   * @param id The category ID
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
} 