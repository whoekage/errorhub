# Testing Fastify 5.3.2 with Vitest

This document explains our approach to testing a Fastify 5.3.2 application with Vitest without using mocks.

## Core Principles

1. **Real Implementations**: Use real implementations of all components rather than mocks
2. **In-Memory Database**: Use SQLite in-memory database for tests instead of mocking repositories
3. **Isolated Tests**: Each test runs with a clean database
4. **Dependency Injection**: Use the same DI container pattern as the main application, but with test versions

## Test Setup Structure

```
src/
└── tests/
    ├── setup.ts                    # Global test setup code
    ├── utils/                      # Test utilities
    │   ├── test-di.ts              # Test DI container
    │   ├── app-helper.ts           # Helper to build Fastify test instances 
    │   └── test-data.ts            # Utilities for seeding test data
    ├── routes/                     # Route tests
    │   └── error-routes.test.ts    # Tests for error routes
    └── repositories/               # Repository tests
        └── ErrorCodeRepository.test.ts  # Tests for ErrorCodeRepository
```

## Key Components

### 1. Vitest Configuration (vitest.config.js)

```javascript
const path = require('path');
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 10000, // 10 seconds for API tests
    setupFiles: ['src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts'],
    watch: false, // Disable in CI
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/types.ts', 'src/tests'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 2. Test Setup (setup.ts)

The test setup file initializes an in-memory SQLite database for tests:

```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { ErrorCodeEntity } from '../db/entities/ErrorCodeEntity';
import { ErrorCategoryEntity } from '../db/entities/ErrorCategoryEntity';
import { ErrorTranslationEntity } from '../db/entities/ErrorTranslationEntity';

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
```

### 3. Test DI Container (test-di.ts)

Create a test dependency injection container that uses the same real implementations but with the test database:

```typescript
import { DIContainer } from '@/di';
import { testDataSource } from '../setup';
import { RepositoryFactory } from '@/db/repositories/index';

export function createTestContainer(): DIContainer {
  // Use the test database connection
  const db = testDataSource;
  
  // Repository initialization with injected test DataSource
  const repositories = {
    errorCode: RepositoryFactory.createErrorCodeRepository(db),
    // Add other repositories as needed
  };
  
  // Service initialization with real implementations
  const services = {
    // Add services as needed
  };
  
  // Return assembled container
  return {
    db,
    repositories,
    services
  };
}

// Singleton test container instance
export const testContainer = createTestContainer();
```

### 4. Fastify App Helper (app-helper.ts)

This utility helps build Fastify instances for testing:

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { testContainer } from './test-di';

export async function buildTestApp(options: {
  di?: DIContainer;
  withPlugins?: boolean;
  withRoutes?: boolean;
} = {}): Promise<FastifyInstance> {
  // Default options
  const {
    di = testContainer,
    withPlugins = true,
    withRoutes = true
  } = options;

  // Create a fresh Fastify instance for testing
  const app = Fastify({
    logger: false // Disable logging in tests
  });

  // Decorate with DI container
  app.decorate('di', di);

  // Register plugins if needed
  if (withPlugins) {
    const { errorHandler } = await import('@/middleware/error-handler');
    app.setErrorHandler(errorHandler);
    
    const diPlugin = await import('@/plugins/di-plugin');
    await app.register(diPlugin.default);
    
    const validationPlugin = await import('@/plugins/validation-plugin');
    await app.register(validationPlugin.default);
  }

  // Register routes if needed
  if (withRoutes) {
    const errorRoutes = await import('@/routes/error-routes');
    await app.register(errorRoutes.default, { prefix: '/api/errors' });
    
    // Add other routes as needed
  }

  return app;
}

export async function buildTestAppWithRoute(
  routeHandler: (fastify: FastifyInstance, container: DIContainer) => void | Promise<void>,
  options: {
    di?: DIContainer;
    prefix?: string;
    withPlugins?: boolean;
  } = {}
): Promise<FastifyInstance> {
  const {
    di = testContainer,
    prefix = '',
    withPlugins = true
  } = options;

  const app = await buildTestApp({
    di,
    withPlugins,
    withRoutes: false
  });

  await app.register(async (instance) => {
    await routeHandler(instance, di);
  }, { prefix });

  return app;
}
```

### 5. Test Data Helper (test-data.ts)

Helper functions to populate test data:

```typescript
import { testDataSource } from '../setup';
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity';
import { ErrorCategoryEntity } from '@/db/entities/ErrorCategoryEntity';
import { ErrorTranslationEntity } from '@/db/entities/ErrorTranslationEntity';

export class TestData {
  static async seedCategory(data: Partial<ErrorCategoryEntity> = {}): Promise<ErrorCategoryEntity> {
    const repository = testDataSource.getRepository(ErrorCategoryEntity);
    
    const defaultData = {
      name: 'Test Category',
      description: 'Test category description',
      ...data
    };
    
    const category = repository.create(defaultData);
    return repository.save(category);
  }
  
  static async seedErrorCode(data: Partial<ErrorCodeEntity> = {}): Promise<ErrorCodeEntity> {
    const repository = testDataSource.getRepository(ErrorCodeEntity);
    
    // Create category if needed
    if (!data.categoryId && !data.category) {
      const category = await this.seedCategory();
      data.categoryId = category.id;
    }
    
    const defaultData = {
      code: 'TEST.ERROR',
      defaultMessage: 'This is a test error',
      ...data
    };
    
    const errorCode = repository.create(defaultData);
    return repository.save(errorCode);
  }
  
  static async seedErrorTranslation(data: Partial<ErrorTranslationEntity> = {}): Promise<ErrorTranslationEntity> {
    const repository = testDataSource.getRepository(ErrorTranslationEntity);
    
    // Create error code if needed
    if (!data.errorCode) {
      const errorCode = await this.seedErrorCode();
      data.errorCode = errorCode;
    }
    
    const defaultData = {
      language: 'es',
      message: 'Este es un error de prueba',
      ...data
    };
    
    const translation = repository.create(defaultData);
    return repository.save(translation);
  }
}
```

## Example Tests

### Route Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/app-helper';
import { TestData } from '../utils/test-data';

describe('Error Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestApp();
  });

  describe('GET /api/errors', () => {
    it('returns all error codes', async () => {
      // Seed test data
      await TestData.seedErrorCode({ code: 'TEST.ERROR_1' });
      await TestData.seedErrorCode({ code: 'TEST.ERROR_2' });

      // Make request
      const response = await app.inject({
        method: 'GET',
        url: '/api/errors',
      });

      // Verify response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveLength(2);
    });
  });
});
```

### Repository Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { ErrorCodeRepository } from '@/db/repositories/ErrorCodeRepository';
import { testDataSource } from '../setup';
import { TestData } from '../utils/test-data';

describe('ErrorCodeRepository', () => {
  // Create a real repository instance with the test database
  const repository = new ErrorCodeRepository(testDataSource);

  it('creates a new error code', async () => {
    // Create a test category
    const category = await TestData.seedCategory();

    // Create error code data
    const data = {
      code: 'TEST.REPO.CREATE',
      defaultMessage: 'Create test',
      categoryId: category.id
    };

    // Call the repository method
    const result = await repository.create(data);

    // Verify results
    expect(result.code).toBe(data.code);
    expect(result.defaultMessage).toBe(data.defaultMessage);
  });
});
```

## Advantages of this Approach

1. **Real-world Testing**: By using real implementations, tests are much closer to the real-world usage and can detect issues that might not be caught by tests with mocks.

2. **Reduced Test Maintenance**: Since the tests use the same implementations as the application, changes to the components are automatically reflected in tests, reducing maintenance.

3. **Higher Confidence**: Tests provide higher confidence that the application works as expected, since they're testing the actual components.

4. **Better Coverage**: Tests cover both the implementation details and the integration between components.

5. **Simpler Setup**: Once you've set up the initial testing infrastructure, writing tests becomes much simpler without having to create complex mocks.

## Running the Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
``` 