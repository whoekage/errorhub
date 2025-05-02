import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for deleting a translation
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['translations'],
        summary: 'Delete translation',
        description: 'Delete an existing translation',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'number' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Translation successfully deleted'
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
      const { id } = request.params as { id: string };
      const translationId = parseInt(id, 10);
      
      if (isNaN(translationId)) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Translation ID must be a number'
        });
      }
      
      const deleted = await services.translation.deleteTranslation(translationId);
      
      if (!deleted) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Translation with ID ${translationId} not found`
        });
      }
      
      return reply.code(204).send();
    }
  );
} 