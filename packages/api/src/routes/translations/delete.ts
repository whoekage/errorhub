import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';

/**
 * Parameter validation schema
 */
const paramsSchema = z.object({
  id: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, 'Translation ID must be a positive integer')
});

type Params = z.infer<typeof paramsSchema>;

/**
 * Error response schema
 */
const errorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string()
});

type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Route handler for deleting a translation
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.delete<{
    Params: Params;
  }>(
    '/:id',
    async (request, reply) => {
      try {
        // Validate params
        const params = paramsSchema.parse(request.params);
        
        const deleted = await services.translation.deleteTranslation(params.id);
        
        if (!deleted) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `Translation with ID ${params.id} not found`
          });
        }
        
        return reply.code(204).send();
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