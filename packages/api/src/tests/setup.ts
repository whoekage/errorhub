// src/tests/setup.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity, EnabledLanguageEntity } from '@/db';
import validationPlugin from '@/plugins/validation-plugin';
import routes from '@/routes/index';
import { ErrorService } from '@/services/ErrorService';
import { CategoryService } from '@/services/CategoryService';
import { TranslationService } from '@/services/TranslationService';
import { CreateErrorCodeUseCase } from '@/use-cases/error-code/CreateErrorCodeUseCase';
import { DIContainer } from '@/di';
import { ServiceError } from '@/utils/errors';

// Create test database with explicit entity registration
export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity, EnabledLanguageEntity],
  synchronize: true,
  logging: false
});

// Function to build test app with services that use test database
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.TEST_LOGGER === 'true' ? { level: 'info' } : false,
  });

  // Ensure test DB is initialized
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }
  
  // Create fresh service instances using test database
  const errorService = new ErrorService(testDataSource);
  const categoryService = new CategoryService(testDataSource);
  const translationService = new TranslationService(testDataSource);
  
  const services = {
    error: errorService,
    category: categoryService,
    translation: translationService,
  };
  
  // Initialize UseCases
  const createErrorCodeUseCase = new CreateErrorCodeUseCase(
    testDataSource, 
    services.error, 
    services.translation
  );

  const useCases = {
    createErrorCode: createErrorCodeUseCase,
  };
  
  // Create test DI container with these services
  const testContainer: DIContainer = {
    db: testDataSource,
    services,
    useCases,
  };
  
  // Set the container as a decorator
  app.decorate('di', testContainer);
  
  // Register standard middleware
  app.setErrorHandler((err, _req, reply) => {
    // Use statusCode from our custom errors if available
    const statusCode = (err as ServiceError).statusCode || 500;
    reply.status(statusCode).send({
      name: (err as Error).name,
      message: (err as Error).message,
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