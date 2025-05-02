import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for creating or updating a translation
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.post(
    '/',
    {
      schema: {
        tags: ['translations'],
        summary: 'Create or update translation',
        description: 'Create a new translation or update an existing one',
        body: {
          type: 'object',
          required: ['errorCode', 'language', 'message'],
          properties: {
            errorCode: { type: 'string' },
            language: { type: 'string' },
            message: { type: 'string' },
            description: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              errorCode: { type: 'string' },
              language: { type: 'string' },
              message: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const result = await services.translation.upsertTranslation(request.body as any);
      return reply.code(200).send(result);
    }
  );
} 