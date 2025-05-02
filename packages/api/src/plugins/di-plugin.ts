import fp from 'fastify-plugin';
import { container } from '../di';

/**
 * Fastify plugin to register the DI container
 */
export default fp(async (fastify) => {
  // Register container as fastify decorator
  fastify.decorate('di', container);
  
  // Register commonly used services as direct decorators for convenience
  fastify.decorate('errorService', container.services.error);
  fastify.decorate('categoryService', container.services.category);
  fastify.decorate('translationService', container.services.translation);
}); 