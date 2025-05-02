import { DataSource } from 'typeorm';
import { ErrorCodeRepository, IErrorCodeRepository } from './ErrorCodeRepository';
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
  
  // Add more repository factory methods as needed
}

// Export interfaces for DI container type definitions
export type { IErrorCodeRepository }; 