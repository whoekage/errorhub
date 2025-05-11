import { FastifyInstance, FastifyRequest } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity'; // Assuming this is the response type

// Schema for the path parameter
const paramsSchema = z.object({
  id: z.string().refine(val => !isNaN(parseInt(val, 10)), {
    message: "ID must be a numeric string.",
  }),
});

// Schema for the response (adjust according to your ErrorCodeEntity or DTO)
// For now, let's assume it returns something compatible with ErrorCodeEntity
// You might want to create a specific DTO for this response.
const getErrorCodeByIdResponseSchema = z.custom<ErrorCodeEntity>();


export default function (fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get<{
    Params: z.infer<typeof paramsSchema>;
    Reply: ErrorCodeEntity; // Or z.infer<typeof getErrorCodeByIdResponseSchema> if using the Zod schema
  }>(
    '/:id',
    // According to fastify-zod-validation.md, schema objects in route definitions are not used.
    // Validation should be handled explicitly.
    async (request: FastifyRequest<{ Params: z.infer<typeof paramsSchema> }>, reply) => {
      let id: number;
      try {
        const validatedParams = paramsSchema.parse(request.params);
        id = parseInt(validatedParams.id, 10);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: error.errors[0].message,
            errors: error.errors,
          });
        }
        // For other unexpected errors during parsing
        return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid ID format.',
        });
      }

      try {
        // We'll need to ensure services.error.getErrorById exists and handles numeric ID
        const errorCode = await services.error.getById(id); 

        if (!errorCode) {
          return reply.code(404).send({ message: 'Error code not found' });
        }
        return reply.send(errorCode);
      } catch (error) {
        fastify.log.error(error, `Error fetching error code by ID: ${id}`);
        // Consistent error response format
        return reply.code(500).send({ 
            statusCode: 500,
            error: "Internal Server Error",
            message: 'An unexpected error occurred while fetching the error code.' 
        });
      }
    }
  );
} 