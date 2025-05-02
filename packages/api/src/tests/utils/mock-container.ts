import { DIContainer } from '../../di';
import { IErrorCodeRepository } from '../../db/repositories/ErrorCodeRepository';

/**
 * Creates a mock DI container for testing
 */
export function createMockContainer(): DIContainer {
  // Mock repository implementations
  const mockErrorCodeRepository: jest.Mocked<IErrorCodeRepository> = {
    findAll: jest.fn(),
    findByCode: jest.fn(),
    findByCategoryId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
  
  // Add more mocked repositories as you implement them
  
  // Add mocked services as you implement them
  
  // Return assembled mock container
  return {
    db: {} as any, // Mock data source
    repositories: {
      errorCode: mockErrorCodeRepository,
      // Add more as you implement them
    },
    services: {
      // Add as you implement them
    }
  };
}

/**
 * Example test using the mock container:
 * 
 * ```typescript
 * import { createMockContainer } from './utils/mock-container';
 * import { FastifyInstance } from 'fastify';
 * import { createApp } from '../app';
 * 
 * describe('Error routes', () => {
 *   let app: FastifyInstance;
 *   let mockContainer: DIContainer;
 *   
 *   beforeEach(async () => {
 *     mockContainer = createMockContainer();
 *     
 *     // Setup mocks
 *     mockContainer.repositories.errorCode.findByCode.mockResolvedValue({
 *       id: 1,
 *       code: 'TEST.ERROR',
 *       message: 'Test error',
 *       categoryId: 1
 *     });
 *     
 *     // Create app with mocked DI container
 *     app = await createApp();
 *     
 *     // Override the container
 *     app.di = mockContainer;
 *   });
 *   
 *   test('GET /api/errors/:code returns error by code', async () => {
 *     const response = await app.inject({
 *       method: 'GET',
 *       url: '/api/errors/TEST.ERROR'
 *     });
 *     
 *     expect(response.statusCode).toBe(200);
 *     expect(JSON.parse(response.payload)).toMatchObject({
 *       code: 'TEST.ERROR',
 *     });
 *     
 *     expect(mockContainer.repositories.errorCode.findByCode).toHaveBeenCalledWith(
 *       'TEST.ERROR',
 *       expect.any(Object)
 *     );
 *   });
 * });
 * ```
 */ 