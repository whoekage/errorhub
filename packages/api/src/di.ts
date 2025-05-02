import { DataSource } from 'typeorm';
import { AppDataSource } from './db/data-source';

// Repository imports
import { ErrorCodeRepository } from './db/repositories/ErrorCodeRepository';
import { ErrorCategoryRepository } from './db/repositories/ErrorCategoryRepository';
import { ErrorTranslationRepository } from './db/repositories/ErrorTranslationRepository';

// Service imports - these will be created later
import { ErrorService } from './services/ErrorService';
import { CategoryService } from './services/CategoryService';
import { TranslationService } from './services/TranslationService';

// DI container type
export interface DIContainer {
  // Database
  db: DataSource;
  
  // Repositories
  repositories: {
    errorCode: ErrorCodeRepository;
    errorCategory: ErrorCategoryRepository;
    errorTranslation: ErrorTranslationRepository;
  };
  
  // Services
  services: {
    error: ErrorService;
    category: CategoryService;
    translation: TranslationService;
  };
}

/**
 * Creates and initializes the DI container
 */
export function createContainer(): DIContainer {
  // Database is already initialized in index.ts
  const db = AppDataSource;
  
  // Repository initialization
  const repositories = {
    errorCode: new ErrorCodeRepository(),
    errorCategory: new ErrorCategoryRepository(),
    errorTranslation: new ErrorTranslationRepository()
  };
  
  // Service initialization
  const services = {
    error: new ErrorService(
      repositories.errorCode,
      repositories.errorCategory
    ),
    category: new CategoryService(
      repositories.errorCategory
    ),
    translation: new TranslationService(
      repositories.errorTranslation
    )
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