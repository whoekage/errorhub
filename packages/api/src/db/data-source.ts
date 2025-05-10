import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ErrorCodeEntity } from './entities/ErrorCodeEntity';
import { ErrorTranslationEntity } from './entities/ErrorTranslationEntity';
import { ErrorCategoryEntity } from './entities/ErrorCategoryEntity';
import { EnabledLanguageEntity } from './entities/EnabledLanguageEntity';
import path from 'path';
import fs from 'fs';

// Database file path
const dbPath = path.resolve(process.cwd(), 'data', 'errorhub.sqlite');

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  synchronize: process.env.NODE_ENV !== 'production', // Automatically create database schema in development
  logging: process.env.NODE_ENV !== 'production',
  entities: [ErrorCodeEntity, ErrorTranslationEntity, ErrorCategoryEntity, EnabledLanguageEntity],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  subscribers: [],
});

/**
 * Database initialization function
 * 
 * IMPORTANT: For production environments, do NOT use synchronize: true.
 * Instead, use migrations to update the database schema:
 * 
 * 1. Generate a migration:
 *    npx typeorm migration:generate -d ./src/db/data-source.ts -n MigrationName
 * 
 * 2. Run migrations:
 *    npx typeorm migration:run -d ./src/db/data-source.ts
 *
 * 3. Revert migrations:
 *    npx typeorm migration:revert -d ./src/db/data-source.ts
 */
export const initializeDatabase = async () => {
  try {
    // Make sure the data directory exists
    const dataDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Initialize the database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection initialized');
    }
    
    return AppDataSource;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}; 