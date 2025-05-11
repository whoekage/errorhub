import { initializeDatabase as initialize } from './data-source';

// Direct exports will be replaced by DI container access
// Do not import repositories directly here to avoid circular dependencies

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

// Export entities - these don't cause circular dependencies
export * from './entities/ErrorCodeEntity';
export * from './entities/ErrorTranslationEntity';
export * from './entities/ErrorCategoryEntity'; 
export * from './entities/EnabledLanguageEntity';