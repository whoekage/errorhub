import { DataSource } from 'typeorm';
import { AppDataSource } from './db/data-source';

// Import service classes
import { TranslationService } from './services/TranslationService';
import { CategoryService } from './services/CategoryService';
import { ErrorService } from './services/ErrorService';
import { LanguageService } from './services/LanguageService';

// Import UseCase classes
import { CreateErrorCodeUseCase } from './use-cases/error-code/CreateErrorCodeUseCase';
import { UpdateErrorCodeUseCase } from './use-cases/error-code/UpdateErrorCodeUseCase';

// DI container type
export interface DIContainer {
  // Database
  db: DataSource;
  
  // Services
  services: {
    translation: TranslationService;
    category: CategoryService;
    error: ErrorService;
    language: LanguageService;
  };

  // UseCases
  useCases: {
    createErrorCode: CreateErrorCodeUseCase;
    updateErrorCode: UpdateErrorCodeUseCase;
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
  
  
  // Service initialization with injected repositories
  const translationService = new TranslationService(db);
  const categoryService = new CategoryService(db);
  const errorService = new ErrorService(db);
  const languageService = new LanguageService(db);

  const services = {
    translation: translationService,
    category: categoryService,
    error: errorService,
    language: languageService,
  };
  
  // Initialize UseCases
  const createErrorCodeUseCase = new CreateErrorCodeUseCase(
    db,
    services.error, 
    services.translation
  );
  const updateErrorCodeUseCase = new UpdateErrorCodeUseCase(db);

  const useCases = {
    createErrorCode: createErrorCodeUseCase,
    updateErrorCode: updateErrorCodeUseCase,
  };
  
  // Return assembled container
  return {
    db,
    services,
    useCases,
  };
}

// Create singleton container instance
export const container = createContainer(); 