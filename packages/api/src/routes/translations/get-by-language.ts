import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';

/**
 * Parameter validation schema
 */
const paramsSchema = z.object({
  language: z.string().min(2, 'Language code must be at least 2 characters')
});

type Params = z.infer<typeof paramsSchema>;

/**
 * Route handler for getting translations by language
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get<{
    Params: Params;
  }>(
    '/by-language/:language',
    async (request, reply) => {
      try {
        // Validate params
        const params = paramsSchema.parse(request.params);
        
        // This is a placeholder - actual implementation would need to be added to the TranslationService
        const translations = []; // Placeholder for translations by language
        
        return translations;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: error.errors[0].message,
            errors: error.errors
          });
        }
        throw error;
      }
    }
  );
} 