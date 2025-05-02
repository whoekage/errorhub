import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';
import { createErrorCodeRequest } from '@/dto/errors';

/**
 * Route handler for creating a new error code
 */
export default function(fastify: FastifyInstance, { repositories }: DIContainer) {
  fastify.post<{
    Body: z.infer<typeof createErrorCodeRequest>;
  }>(
    '/',
    async (request, reply) => {
      try {
        // Validate request body
        const validatedData = createErrorCodeRequest.parse(request.body);
        
        // Create the error code
        const newErrorCode = await repositories.errorCode.create(validatedData);
        return reply.code(201).send(newErrorCode);
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