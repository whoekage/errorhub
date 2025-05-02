import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for getting translations by language
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get(
    '/by-language/:language',
    {
      schema: {
        tags: ['translations'],
        summary: 'Get translations by language',
        description: 'Retrieve all translations for a specific language',
        params: {
          type: 'object',
          required: ['language'],
          properties: {
            language: { type: 'string' }
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
      const { language } = request.params as { language: string };
      // This is a placeholder - actual implementation would need to be added to the TranslationService
      return []; // Placeholder for translations by language
    }
  );
} 