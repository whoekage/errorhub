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
 * Route handler for deleting an error code
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.delete<{
    Params: Params;
  }>(
    '/:code',
    async (request, reply) => {
      try {
        // Validate params
        const params = paramsSchema.parse(request.params);
        const deleted = await services.error.deleteError(params.code);
        
        if (!deleted) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `Error code ${params.code} not found`
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