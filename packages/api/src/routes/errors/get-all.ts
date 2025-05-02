import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for getting all errors
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get(
    '/',
    async () => {
      return services.error.getAllErrors();
    }
  );
} 