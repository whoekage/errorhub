import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';
import { errorCodeParamSchema } from '@/dto/errors/params.dto';

/**
 * Route handler for deleting an error code
 */
export default function(fastify: FastifyInstance, { repositories }: DIContainer) {
  fastify.delete<{
    Params: z.infer<typeof errorCodeParamSchema>;
  }>(
    '/:code',
    async (request, reply) => {
      try {
        // Validate params
        const params = errorCodeParamSchema.parse(request.params);
        
        // Check if error exists
        const errorExists = await repositories.errorCode.findByCode(params.code);
        if (!errorExists) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `Error code ${params.code} not found`
          });
        }
        
        // Delete error
        await repositories.errorCode.delete(params.code);
        
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