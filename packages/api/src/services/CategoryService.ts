import { ErrorTranslationEntity, ErrorCodeEntity, ErrorCategoryEntity } from '@/db';
import { DataSource, Repository, FindManyOptions } from 'typeorm';

/**
 * Service for managing error categories
 */
export class CategoryService {
  private errorCodeRepository: Repository<ErrorCodeEntity>;
  private translationRepository: Repository<ErrorTranslationEntity>;
  private categoryRepository: Repository<ErrorCategoryEntity>;
  constructor(
    private readonly dataSource: DataSource
  ) {
    this.errorCodeRepository = this.dataSource.getRepository(ErrorCodeEntity);
    this.categoryRepository = this.dataSource.getRepository(ErrorCategoryEntity);
    this.translationRepository = this.dataSource.getRepository(ErrorTranslationEntity);
  }

  /**
   * Get all categories
   */
    async getAllCategories(options?: FindManyOptions<ErrorCategoryEntity>): Promise<ErrorCategoryEntity[]> {
      console.log({ options });
      return this.categoryRepository.find(options);
  }

  /**
   * Get category by ID
   * @param id Category ID
   */
  async getCategoryById(id: number): Promise<ErrorCategoryEntity | null> {
    return this.categoryRepository.findOne({ where: { id } });
  }

  /**
   * Create a new category
   * @param data Category data
   */
  async upsertCategory(data: { name: string; description?: string }): Promise<ErrorCategoryEntity> {
    return this.dataSource.transaction(async () => {
      const existingCategory = await this.categoryRepository.findOne({ where: { name: data.name } });
      console.log({existingCategory});
      if (existingCategory) {
        const updatedCategory = this.categoryRepository.merge(existingCategory, data);
        return await this.categoryRepository.save(updatedCategory);
      }
      const category = this.categoryRepository.create(data);
      return await this.categoryRepository.save(category);
    });
  }

  /**
   * Update an existing category
   * @param id Category ID
   * @param data Updated data
   */
  async updateCategory(id: number, data: { name?: string; description?: string }): Promise<ErrorCategoryEntity | null> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new Error('Category not found');
    }
    return await this.categoryRepository.save({ ...category, ...data });
  }

  /**
   * Delete a category
   * @param id Category ID
   */
  async deleteCategory(id: number): Promise<boolean> {
    return this.dataSource.transaction(async () => {
      // 1. Make all error codes categories null
      await this.errorCodeRepository.update({ categoryId: id }, { categoryId: null });
      // 2. Delete the category
      const result = await this.categoryRepository.delete(id);
      return result.affected !== 0 && result.raw.affectedRows > 0;
    });
  }
} 