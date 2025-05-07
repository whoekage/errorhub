# ErrorHub Testing Approach

## Testing Philosophy: Production-Like Environment

ErrorHub uses a "production-like" testing approach that maximizes test validity by minimizing mocks:

- **Real Implementations**: Tests use actual services, repositories, and routes - no mocks
- **Production DI Container**: Same DI structure as production with real service implementations
- **In-Memory Database**: Only the data source differs (SQLite in-memory instead of PostgreSQL)
- **Isolated Tests**: Each test runs with a clean database state
- **Full Integration**: Tests interact with the API through the same endpoints as production

## Test Setup Structure

```
src/
└── tests/
    ├── setup.ts                 # Global test setup with app builder and in-memory DB
    ├── utils/                   # Test utilities
    │   ├── test-data.ts         # Helpers for seeding test data
    │   └── cursor-utils.test.ts # Utility tests
    ├── routes/                  # API route integration tests
    │   ├── error-routes.test.ts
    │   └── ...
    ├── repositories/            # Repository tests
    │   ├── ErrorCodeRepository.test.ts
    │   └── ...
    └── services/                # Service tests
        └── ...
```

## Key Components

### 1. Test Database Setup (`setup.ts`)

The test database initializes once for all tests and clears between tests:

```typescript
// In-memory database for tests
export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity],
  synchronize: true,
  logging: false
});

// Before each test, clear all data
beforeEach(async () => {
  if (testDataSource.isInitialized) {
    // Clear tables with proper order for foreign keys
    await testDataSource.query('PRAGMA foreign_keys = OFF;');
    const entities = testDataSource.entityMetadatas.reverse();
    for (const entity of entities) {
      await testDataSource.query(`DELETE FROM ${entity.tableName}`);
    }
    await testDataSource.query('PRAGMA foreign_keys = ON;');
  }
});
```

### 2. Application Builder (`setup.ts`)

The test setup creates real Fastify instances with all middleware and routes:

```typescript
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false  // Disable logging in tests
  });

  // Ensure test DB is initialized
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }
  
  // Create real service instances with test database
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
  
  // Register standard middleware and routes
  app.setErrorHandler(errorHandler);
  await app.register(validationPlugin);
  await app.register(routes, { prefix: '/api' });
  
  return app;
}
```

### 3. Test Data Helpers (`test-data.ts`)

Helper methods to create test data with unique values:

```typescript
export class TestData {
  static async seedCategory(data: Partial<ErrorCategoryEntity> = {}): Promise<ErrorCategoryEntity> {
    const repository = testDataSource.getRepository(ErrorCategoryEntity);
    
    // Generate unique category name
    const uniqueTimestamp = Date.now();
    
    const defaultData = {
      name: `Test Category ${uniqueTimestamp}`,
      description: 'Test category description',
      ...data
    };
    
    const category = repository.create(defaultData);
    return repository.save(category);
  }
  
  static async seedErrorCode(data: Partial<ErrorCodeEntity> = {}): Promise<ErrorCodeEntity> {
    // Similar implementation for error codes
  }
  
  static async seedErrorTranslation(data: Partial<ErrorTranslationEntity> = {}): Promise<ErrorTranslationEntity> {
    // Similar implementation for translations
  }
}
```

## Writing Tests

### Route Tests

Test HTTP endpoints by creating a full app instance and making requests:

```typescript
describe('Error Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Create a fresh test app for each test
    app = await buildTestApp();
  });

  it('returns error code by ID', async () => {
    // Seed test data
    const errorCode = await TestData.seedErrorCode({
      code: 'TEST.ERROR',
      defaultMessage: 'Test error message'
    });

    // Make request to the endpoint
    const response = await app.inject({
      method: 'GET',
      url: `/api/errors/${errorCode.code}`,
    });

    // Verify response
    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    expect(result.code).toBe(errorCode.code);
    expect(result.message).toBe(errorCode.defaultMessage);
  });
});
```

### Service Tests

Test service methods directly using the test database:

```typescript
describe('ErrorService', () => {
  // Create service with test database
  const service = new ErrorService(testDataSource);

  it('creates a new error', async () => {
    // Create a test category
    const category = await TestData.seedCategory();

    // Test service method
    const result = await service.createError({
      code: 'TEST.SERVICE',
      defaultMessage: 'Test service method',
      categoryId: category.id
    });

    // Verify result
    expect(result.code).toBe('TEST.SERVICE');
    expect(result.defaultMessage).toBe('Test service method');
    expect(result.categoryId).toBe(category.id);
  });
});
```

## Pagination Testing

The project includes specialized tests for cursor-based pagination:

```typescript
describe('Cursor-Based Pagination', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestApp();
    
    // Seed predictable data for pagination tests
    for (let i = 1; i <= 25; i++) {
      await TestData.seedErrorCode({
        code: `TEST.PAGINATION.${i}`,
        defaultMessage: `Pagination test error ${i}`
      });
    }
  });

  it('returns paginated results with working cursor navigation', async () => {
    const firstResponse = await app.inject({
      method: 'GET',
      url: '/api/errors?limit=10'
    });
    
    // Test results and navigation links
    // ...
  });
});
```

## Advantages of this Approach

1. **Higher Confidence**: Tests verify actual behavior of the entire system
2. **Maintenance Efficiency**: Changes to implementations don't require test updates unless behavior changes
3. **Complete Coverage**: Tests cover both business logic and integration between components
4. **Simplified Testing**: No complex mocks to maintain
5. **Real-World Behavior**: Tests match production behavior more closely

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Best Practices

1. **Always use TestData helpers** to create test data with unique values
2. **Create a fresh test app** for each test to avoid state leakage
3. **Test complete flows** rather than isolated units
4. **Keep tests independent** - don't rely on data from other tests
5. **Test edge cases** thoroughly, including error handling