import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for deleting an error code
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.delete(
    '/:code',
    {
      schema: {
        tags: ['errors'],
        summary: 'Delete error code',
        description: 'Delete an existing error code and its translations',
        params: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Error code successfully deleted'
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
      const deleted = await services.error.deleteError(code);
      
      if (!deleted) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Error code ${code} not found`
        });
      }
      
      return reply.code(204).send();
    }
  );
} 