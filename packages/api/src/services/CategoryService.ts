import { ErrorCategoryRepository } from '../db/repositories/ErrorCategoryRepository';
import { ErrorCategoryEntity } from '../db/entities/ErrorCategoryEntity';

/**
 * Service for managing error categories
 */
export class CategoryService {
  constructor(
    private errorCategoryRepository: ErrorCategoryRepository
  ) {}

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<ErrorCategoryEntity[]> {
    return this.errorCategoryRepository.findAll();
  }

  /**
   * Get category by ID
   * @param id Category ID
   */
  async getCategoryById(id: number): Promise<ErrorCategoryEntity | null> {
    return this.errorCategoryRepository.findById(id);
  }

  /**
   * Create a new category
   * @param data Category data
   */
  async createCategory(data: { name: string; description?: string }): Promise<ErrorCategoryEntity> {
    return this.errorCategoryRepository.create(data);
  }

  /**
   * Update an existing category
   * @param id Category ID
   * @param data Updated data
   */
  async updateCategory(id: number, data: { name?: string; description?: string }): Promise<ErrorCategoryEntity | null> {
    return this.errorCategoryRepository.update(id, data);
  }

  /**
   * Delete a category
   * @param id Category ID
   */
  async deleteCategory(id: number): Promise<boolean> {
    return this.errorCategoryRepository.delete(id);
  }
} 