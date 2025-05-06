// src/tests/setup.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity } from '@/db';
import { errorHandler } from '@/middleware/error-handler';
import validationPlugin from '@/plugins/validation-plugin';
import routes from '@/routes/index';
import { ErrorService } from '@/services/ErrorService';
import { CategoryService } from '@/services/CategoryService';
import { TranslationService } from '@/services/TranslationService';

// Create test database with explicit entity registration
export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity],
  synchronize: true,
  logging: false
});

// Function to build test app with services that use test database
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false
  });

  // Ensure test DB is initialized
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }
  
  // Create fresh service instances using test database
  const services = {
    error: new ErrorService(testDataSource),
    category: new CategoryService(testDataSource),
    translation: new TranslationService(testDataSource)
  };
  
  // Create test DI container with these services
  const testContainer = {
    db: testDataSource,
    services
  };
  
  // Set the container as a decorator
  app.decorate('di', testContainer);
  
  // Register standard middleware
  app.setErrorHandler((err, _req, reply) => {
    // если у ошибки уже есть statusCode, используем его
    reply.status((err as any).statusCode ?? 500).send({
      message: err.message,
    });
  });
  await app.register(validationPlugin);
  await app.register(routes, { prefix: '/api' });
  
  return app;
}

// Clear all test data before each test
beforeEach(async () => {
  if (testDataSource.isInitialized) {
    // Clear tables in reverse order (respecting foreign key constraints)
    await testDataSource.query('PRAGMA foreign_keys = OFF;');
    
    const entities = testDataSource.entityMetadatas.reverse();
    for (const entity of entities) {
      await testDataSource.query(`DELETE FROM ${entity.tableName}`);
    }
    
    await testDataSource.query('PRAGMA foreign_keys = ON;');
  }
});

// Initialize test DB once before all tests
beforeAll(async () => {
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
    await testDataSource.synchronize(true);
    console.log('Test DataSource initialized with in-memory SQLite');
  }
});

// Close DB connection after all tests
afterAll(async () => {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
    console.log('Test DataSource destroyed');
  }
});