import { DIContainer } from '@/di';
import { testDataSource } from '../setup';
import { RepositoryFactory } from '@/db/repositories/index';

/**
 * Creates a test DI container using real implementations with test database
 */
export function createTestContainer(): DIContainer {
  // Use the test database connection
  const db = testDataSource;
  
  // Repository initialization with injected DataSource using the factory
  const repositories = {
    errorCode: RepositoryFactory.createErrorCodeRepository(db),
    // Add others as needed
  };
  
  // Service initialization with injected repositories
  const services = {
    // Add services when needed
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