import fp from 'fastify-plugin';
import { container } from '../di';

/**
 * Fastify plugin that registers the DI container as a decorator,
 * making it accessible in route handlers and other plugins.
 */
export default fp(async (fastify) => {
  // Register the entire container as a decorator
  fastify.decorate('di', container);
  
  // Optional: register commonly used dependencies directly for convenience
  // fastify.decorate('errorCodeRepository', container.repositories.errorCode);
  
  // Add more as needed when implementing services
  // fastify.decorate('errorService', container.services.error);
  // fastify.decorate('categoryService', container.services.category);
}); 