import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';
import { createErrorCodeRequestSchema } from '@/dto/errors/create.dto';
import { ResourceNotFoundError, ResourceConflictError, ServiceError } from '@/utils/errors';

/**
 * Route handler for creating a new error code
 */
export default function(fastify: FastifyInstance, di: DIContainer) {
  fastify.post<
    {
      Body: z.infer<typeof createErrorCodeRequestSchema>;
    }
  >(
    '/',
    async (request, reply) => {
      try {
        // 1. Validate request body using Zod schema from DTO layer
        const validatedData = createErrorCodeRequestSchema.parse(request.body);
        
        // 2. Execute the UseCase
        const newErrorCode = await di.useCases.createErrorCode.execute(validatedData);
        
        // 3. Send response
        // The UseCase returns an ErrorCodeEntity. We assume this entity structure
        // is compatible with what createErrorCodeResponseSchema would validate/serialize.
        // If specific serialization/transformation is needed for the response, it should be handled here
        // or the UseCase should return data conforming to createErrorCodeResponseSchema.
        return reply.code(201).send(newErrorCode);

      } catch (error) {
        if (error instanceof z.ZodError) {
          // Handle Zod validation errors
          return reply.code(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: error.errors[0]?.message || 'Invalid input.',
            errors: error.errors
          });
        } else if (error instanceof ResourceNotFoundError) {
          return reply.code(error.statusCode || 404).send({
            statusCode: error.statusCode || 404,
            error: error.name,
            message: error.message
          });
        } else if (error instanceof ResourceConflictError) {
          return reply.code(error.statusCode || 409).send({
            statusCode: error.statusCode || 409,
            error: error.name,
            message: error.message
          });
        } else if (error instanceof ServiceError) {
          // Use error.statusCode directly, remove 'as any'
          const statusCode = error.statusCode || 500;
          return reply.code(statusCode).send({
            statusCode: statusCode,
            error: error.name,
            message: error.message
          });
        } else {
          // Handle unexpected errors
          fastify.log.error(error, 'Unexpected error in create error code route');
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred.'
          });
        }
      }
    }
  );
} 