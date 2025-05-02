import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for getting all categories
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['categories'],
        summary: 'Get all categories',
        description: 'Retrieve all error categories',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                description: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async () => {
      return services.category.getAllCategories();
    }
  );
} 