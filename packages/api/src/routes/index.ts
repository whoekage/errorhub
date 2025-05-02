import { FastifyInstance } from 'fastify';
import errorRoutes from './error-routes';

export default async function routes(fastify: FastifyInstance, options: any) {
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
} 