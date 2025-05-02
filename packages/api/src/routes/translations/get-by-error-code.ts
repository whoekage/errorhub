import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';

/**
 * Parameter validation schema
 */
const paramsSchema = z.object({
  code: z.string().min(1, 'Error code is required')
});

type Params = z.infer<typeof paramsSchema>;

/**
 * Route handler for getting translations by error code
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get<{
    Params: Params;
  }>(
    '/by-error/:code',
    async (request, reply) => {
      try {
        // Validate params
        const params = paramsSchema.parse(request.params);
        
        return services.translation.getTranslationsForError(params.code);
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