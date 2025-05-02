import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for getting translations by error code
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get(
    '/by-error/:code',
    {
      schema: {
        tags: ['translations'],
        summary: 'Get translations by error code',
        description: 'Retrieve all translations for a specific error code',
        params: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
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
      }
    },
    async (request) => {
      const { code } = request.params as { code: string };
      return services.translation.getTranslationsForError(code);
    }
  );
} 