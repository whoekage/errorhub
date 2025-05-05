# ErrorHub API

The REST API server for ErrorHub.

## Architecture

API is structured in the following layers:

- **Routes**: Handle HTTP requests and responses
- **Services**: Business logic and data access
- **DTOs**: Data validation using Zod
- **Entities**: Data models using TypeORM

The main difference from traditional architecture is that the service layer works directly with TypeORM repositories, which simplifies the codebase and reduces the number of abstraction layers.

## Development

### Installation

```bash
npm install
```

### Running the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Testing with Vitest

This package uses Vitest for testing without mocks. Instead, we use in-memory SQLite databases to provide real implementations for tests.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure

- `src/tests/setup.ts` - Test setup code, including the in-memory SQLite database
- `src/tests/utils/` - Test utility functions and helpers
- `src/tests/routes/` - Route tests
- `src/tests/repositories/` - Repository tests

### Testing Approach

The testing approach follows these principles:

1. **No Mocks**: We use real implementations of all components with an in-memory SQLite database
2. **Isolated Tests**: Each test runs with a clean database state
3. **Test Data Helpers**: Use the `TestData` class to create test data
4. **Fastify Helper**: Use the `buildTestApp` function to create test Fastify instances

### Example: Testing a Route

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/app-helper';
import { TestData } from '../utils/test-data';

describe('Error Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Create a fresh test app for each test
    app = await buildTestApp();
  });

  it('GET /api/errors returns all error codes', async () => {
    // Seed test data
    await TestData.seedErrorCode({ code: 'TEST.ERROR' });

    // Make request
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors',
    });

    // Verify response
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toHaveLength(1);
  });
});
```

### Example: Testing a Repository

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
  });
});
``` 