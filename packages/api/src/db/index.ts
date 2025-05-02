import { initializeDatabase as initialize } from './data-source';
import { ErrorCodeRepository } from './repositories/ErrorCodeRepository';
import { ErrorTranslationRepository } from './repositories/ErrorTranslationRepository';
import { ErrorCategoryRepository } from './repositories/ErrorCategoryRepository';

// Initialize repositories
export const errorCodeRepository = new ErrorCodeRepository();
export const errorTranslationRepository = new ErrorTranslationRepository();
export const errorCategoryRepository = new ErrorCategoryRepository();

// Initialize database
export const initializeDatabase = async () => {
  try {
    await initialize();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

// Export entities
export * from './entities/ErrorCodeEntity';
export * from './entities/ErrorTranslationEntity';
export * from './entities/ErrorCategoryEntity'; 