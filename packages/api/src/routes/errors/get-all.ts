import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for getting all errors
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['errors'],
        summary: 'Get all errors',
        description: 'Retrieve all error codes with optional filtering',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                description: { type: 'string' },
                severity: { type: 'string' },
                categoryId: { type: 'number' }
              }
            }
          }
        }
      }
    },
    async () => {
      return services.error.getAllErrors();
    }
  );
} 