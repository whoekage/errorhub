import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DIContainer } from '@/di';
import { paginationSchema, PaginatedResponse } from '@/dto/common/pagination.dto';
import { ErrorCodeEntity } from '@/db'; // Import entity for response type

export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get<{
    // Use Record<string, any> for Querystring to allow arbitrary filters
    // Validation of known params happens via paginationSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Querystring: Record<string, any>; 
    // Define Reply type using the generic PaginatedResponse
    Reply: PaginatedResponse<ErrorCodeEntity> | { error: string; message: string; statusCode: number };
  }>(
    '/',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (request: FastifyRequest<{ Querystring: Record<string, any> }>, reply: FastifyReply) => {
      try {
        // Basic validation using the common schema
        // This validates page, limit, sort, order, include, search
        // Specific filters (e.g., categoryId=5) are passed through
        paginationSchema.parse(request.query);

        // Construct base URL for HATEOAS links
        // Use request.routeOptions.url which Fastify sets to the registered path
        const baseUrl = `${request.protocol}://${request.hostname}${request.routeOptions.url}`;
        
        // Call the standardized service method
        const result = await services.error.getAll(request.query, baseUrl);
        
        return reply.send(result);

      } catch (error) {
        fastify.log.error(error, 'Error fetching error codes list');
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: `Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`,
            // Optionally include full errors: errors: error.errors
          });
        }
        // Handle potential errors from validateIncludes or other service logic
        if (error instanceof Error) {
             return reply.code(400).send({
                 statusCode: 400,
                 error: 'Bad Request',
                 message: error.message 
             });
        }
        // Fallback for unexpected errors
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An unexpected error occurred while fetching error codes.'
        });
      }
    }
  );
} 