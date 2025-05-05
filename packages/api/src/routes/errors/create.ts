import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';
import { createErrorCodeRequest } from '@/dto/errors';

/**
 * Route handler for creating a new error code
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.post<{
    Body: z.infer<typeof createErrorCodeRequest>;
  }>(
    '/',
    async (request, reply) => {
      try {
        // Validate request body
        const validatedData = createErrorCodeRequest.parse(request.body);
        console.log({validatedData});
        // Check for duplicate code
        const existingError = await services.error.getErrorByCode(validatedData.code);
        if (existingError) {
          return reply.code(409).send({
            error: 'Conflict',
            message: `Error code '${validatedData.code}' already exists`
          });
        }
        
        // Check if category exists (if provided)
        if (validatedData.categoryId) {
          const category = await repositories.errorCategory.findById(validatedData.categoryId);
          if (!category) {
            return reply.code(404).send({
              error: 'Not Found',
              message: `Category with ID ${validatedData.categoryId} not found`
            });
          }
        }
        
        // Create the error code
        const newErrorCode = await repositories.errorCode.create(validatedData);
        return reply.code(201).send(newErrorCode);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
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