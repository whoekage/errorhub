import Fastify, { FastifyInstance } from 'fastify';
import { errorHandler } from './middleware/error-handler';
import diPlugin from './plugins/di-plugin';
import errorRoutes from './routes/error-routes';
// Import other routes as needed

/**
 * Create and configure the Fastify application
 */
export async function createApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
  });

  // Register plugins
  fastify.setErrorHandler(errorHandler);
  await fastify.register(diPlugin);

  // Register routes
  await fastify.register(errorRoutes, { prefix: '/api/errors' });
  // Register other routes with their prefixes

  return fastify;
} 