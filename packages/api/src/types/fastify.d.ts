import 'fastify';
import { DIContainer } from '../di';
import { IErrorCodeRepository } from '../db/repositories/ErrorCodeRepository';

declare module 'fastify' {
  interface FastifyInstance {
    // The full DI container
    di: DIContainer;
    
    // Common repositories (directly accessible)
    errorCodeRepository: IErrorCodeRepository;
    
    // Add more services as you implement them
    // errorService: IErrorService;
    // categoryService: ICategoryService;
  }
} 