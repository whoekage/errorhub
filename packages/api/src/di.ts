import { DataSource } from 'typeorm';
import { AppDataSource } from './db/data-source';

// Import service classes and interfaces
import { TranslationService } from './services/TranslationService';
import { CategoryService } from './services/CategoryService';
import { ErrorService } from './services/ErrorService';

// DI container type
export interface DIContainer {
  // Database
  db: DataSource;
  
  // Services
  services: {
    translation: TranslationService;
    category: CategoryService;
    error: ErrorService;
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

  const services = {
    translation: translationService,
    category: categoryService,
    error: errorService,
  };
  
  // Return assembled container
  return {
    db,
    services
  };
}

// Create singleton container instance
export const container = createContainer(); 