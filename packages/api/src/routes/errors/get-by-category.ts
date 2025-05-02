import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for getting errors by category
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get(
    '/by-category/:categoryId',
    {
      schema: {
        tags: ['errors'],
        summary: 'Get errors by category',
        description: 'Retrieve all errors belonging to a specific category',
        params: {
          type: 'object',
          required: ['categoryId'],
          properties: {
            categoryId: { type: 'number' }
          }
        },
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
    async (request, reply) => {
      const { categoryId } = request.params as { categoryId: string };
      const id = parseInt(categoryId, 10);
      
      if (isNaN(id)) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Category ID must be a number'
        });
      }
      
      return services.error.getErrorsByCategory(id);
    }
  );
} 