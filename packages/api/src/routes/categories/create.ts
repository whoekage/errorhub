import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for creating a new category
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.post(
    '/',
    {
      schema: {
        tags: ['categories'],
        summary: 'Create new category',
        description: 'Create a new error category',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const result = await services.category.createCategory(request.body as any);
      return reply.code(201).send(result);
    }
  );
} 