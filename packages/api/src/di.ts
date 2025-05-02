import { DataSource } from 'typeorm';
import { AppDataSource } from './db/data-source';
import { RepositoryFactory, IErrorCodeRepository } from './db/repositories/index';

// Import repository classes and interfaces
// import { ErrorCategoryRepository, IErrorCategoryRepository } from './db/repositories/ErrorCategoryRepository';
// import { ErrorTranslationRepository, IErrorTranslationRepository } from './db/repositories/ErrorTranslationRepository';

// Import service classes and interfaces (to be created)
// import { ErrorService, IErrorService } from './services/ErrorService';
// import { CategoryService, ICategoryService } from './services/CategoryService';
// import { TranslationService, ITranslationService } from './services/TranslationService';

// DI container type
export interface DIContainer {
  // Database
  db: DataSource;
  
  // Repositories
  repositories: {
    errorCode: IErrorCodeRepository;
    // Add others as you implement them
    // errorCategory: IErrorCategoryRepository;
    // errorTranslation: IErrorTranslationRepository;
  };
  
  // Services
  services: {
    // Add as you implement them
    // error: IErrorService;
    // category: ICategoryService;
    // translation: ITranslationService;
  };
}

// Initialize AppDataSource first to avoid circular dependencies
// It's important to do this before importing from './db'
// Wait for the connection to be established before creating repositories
export const dataSource = AppDataSource;

/**
 * Creates and initializes the DI container
 */
export function createContainer(): DIContainer {
  // Use the already initialized database connection
  const db = dataSource;
  
  // Repository initialization with injected DataSource using the factory
  const repositories = {
    errorCode: RepositoryFactory.createErrorCodeRepository(db),
    // Add others as you implement them
    // errorCategory: new ErrorCategoryRepository(db),
    // errorTranslation: new ErrorTranslationRepository(db),
  };
  
  // Service initialization with injected repositories
  const services = {
    // Add as you implement them
    // error: new ErrorService(repositories.errorCode, repositories.errorCategory),
    // category: new CategoryService(repositories.errorCategory),
    // translation: new TranslationService(repositories.errorTranslation),
  };
  
  // Return assembled container
  return {
    db,
    repositories,
    services
  };
}

// Create singleton container instance
export const container = createContainer(); 