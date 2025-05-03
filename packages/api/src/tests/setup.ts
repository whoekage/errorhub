import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach } from 'vitest';
// Import entity paths directly for testing
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity';
import { ErrorCategoryEntity } from '@/db/entities/ErrorCategoryEntity';
import { ErrorTranslationEntity } from '@/db/entities/ErrorTranslationEntity';

// Test database setup
export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:', // In-memory SQLite DB for tests
  entities: [ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity],
  synchronize: true, // Auto-create schema
  logging: false, // Disable logs in tests
});

// Run before all tests
beforeAll(async () => {
  // Initialize and connect to test database
  await testDataSource.initialize();
  console.log('Test DataSource initialized with in-memory SQLite');
});

// Run after all tests
afterAll(async () => {
  // Close the database connection
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
    console.log('Test DataSource destroyed');
  }
});

// Clean up database before each test
beforeEach(async () => {
  // Clear all data from tables
  if (testDataSource.isInitialized) {
    const entities = testDataSource.entityMetadatas;
    
    // Drop all tables in reverse order (to handle foreign key constraints)
    for (const entity of entities.slice().reverse()) {
      const repository = testDataSource.getRepository(entity.name);
      await repository.clear();
    }
  }
}); 