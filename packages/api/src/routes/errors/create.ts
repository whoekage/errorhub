import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';

/**
 * Route handler for creating a new error code
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.post(
    '/',
    {
      schema: {
        tags: ['errors'],
        summary: 'Create new error code',
        description: 'Create a new error code with details',
        body: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            description: { type: 'string' },
            severity: { type: 'string' },
            categoryId: { type: 'number' }
          }
        },
        response: {
          201: {
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
    },
    async (request, reply) => {
      const result = await services.error.createError(request.body as any);
      return reply.code(201).send(result);
    }
  );
} 