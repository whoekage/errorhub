import { testDataSource } from '@/tests/setup';
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity';
import { ErrorCategoryEntity } from '@/db/entities/ErrorCategoryEntity';
import { ErrorTranslationEntity } from '@/db/entities/ErrorTranslationEntity';

/**
 * Test data seeder
 */
export class TestData {
  /**
   * Seed a category for testing
   */
  static async seedCategory(data: Partial<ErrorCategoryEntity> = {}): Promise<ErrorCategoryEntity> {
    const repository = testDataSource.getRepository(ErrorCategoryEntity);
    
    // Генерируем уникальное имя, если не предоставлено
    const uniqueSuffix = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    
    const defaultData = {
      name: `Test Category ${uniqueSuffix}`, 
      description: 'Test category description',
      ...data
    };
    
    const category = repository.create(defaultData);
    return repository.save(category);
  }
  
  /**
   * Seed an error code for testing
   */
  static async seedErrorCode(data: Partial<ErrorCodeEntity> = {}): Promise<ErrorCodeEntity> {
    const repository = testDataSource.getRepository(ErrorCodeEntity);
    
    // Create category if needed
    if (!data.categoryId && !data.category) {
      const category = await this.seedCategory();
      data.categoryId = category.id;
    }
    
    const defaultData = {
      code: 'TEST.ERROR',
      defaultMessage: 'This is a test error',
      ...data
    };
    
    const errorCode = repository.create(defaultData);
    return repository.save(errorCode);
  }
  
  /**
   * Seed an error translation for testing
   */
  static async seedErrorTranslation(data: Partial<ErrorTranslationEntity> = {}): Promise<ErrorTranslationEntity> {
    const repository = testDataSource.getRepository(ErrorTranslationEntity);
    
    // Create error code if needed
    if (!data.errorCodeId && !data.errorCode) {
      const errorCode = await this.seedErrorCode();
      data.errorCodeId = errorCode.id;
    }
    
    const defaultData = {
      language: 'es',
      message: 'Este es un error de prueba',
      ...data
    };
    
    const translation = repository.create(defaultData);
    return repository.save(translation);
  }
} 