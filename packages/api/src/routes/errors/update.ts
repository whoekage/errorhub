import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for updating an existing error code
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.put(
    '/:code',
    {
      schema: {
        tags: ['errors'],
        summary: 'Update error code',
        description: 'Update an existing error code details',
        params: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            description: { type: 'string' },
            severity: { type: 'string' },
            categoryId: { type: 'number' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              categoryId: { type: 'number' }
            }
          },
          404: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const result = await services.error.updateError(code, request.body as any);
      
      if (!result) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Error code ${code} not found`
        });
      }
      
      return result;
    }
  );
} 