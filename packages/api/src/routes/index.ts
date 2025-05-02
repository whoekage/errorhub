import { FastifyInstance } from 'fastify';
import errorRoutes from './error-routes';
import categoryRoutes from './category-routes';
import { registerZodErrorHandler } from '../middleware/schema-validation';

export default async function routes(fastify: FastifyInstance, options: object) {
  // Register Zod error handler
  registerZodErrorHandler(fastify);
  
  // Base API route
  fastify.get('/', async () => {
    return {
      name: 'ErrorHub API',
      version: '0.1.0',
      status: 'ok'
    };
  });

  // Error management routes
  fastify.register(errorRoutes, { prefix: '/errors' });
  
  // Category management routes
  fastify.register(categoryRoutes, { prefix: '/categories' });
} 