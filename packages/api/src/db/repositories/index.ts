import { DataSource } from 'typeorm';
import { ErrorCodeRepository, IErrorCodeRepository } from './ErrorCodeRepository';
import { ErrorCategoryRepository, IErrorCategoryRepository } from './ErrorCategoryRepository';
import { ErrorTranslationRepository, IErrorTranslationRepository } from './ErrorTranslationRepository';
// Import other repositories as needed

/**
 * Creates repository instances with DI
 */
export class RepositoryFactory {
  /**
   * Create ErrorCodeRepository with DI
   */
  static createErrorCodeRepository(dataSource: DataSource): IErrorCodeRepository {
    return new ErrorCodeRepository(dataSource);
  }

  /**
   * Create ErrorCategoryRepository with DI
   */
  static createErrorCategoryRepository(dataSource: DataSource): IErrorCategoryRepository {
    return new ErrorCategoryRepository(dataSource);
  }

  /**
   * Create ErrorTranslationRepository with DI
   */
  static createErrorTranslationRepository(dataSource: DataSource): IErrorTranslationRepository {
    return new ErrorTranslationRepository(dataSource);
  }
  // Add more repository factory methods as needed
}

// Export interfaces for DI container type definitions
export type { IErrorCodeRepository, IErrorCategoryRepository, IErrorTranslationRepository }; 