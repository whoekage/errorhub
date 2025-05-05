import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DIContainer } from '@/di';
import { paginationSchema, PaginatedResponse } from '@/dto/common/pagination.dto';
import { ErrorTranslationEntity } from '@/db'; // Import entity for response type

/**
 * Route handler for getting all translations with pagination, sorting, filtering.
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Querystring: Record<string, any>; // Allow arbitrary filters
    Reply: PaginatedResponse<ErrorTranslationEntity> | { error: string; message: string; statusCode: number };
  }>(
    '/',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (request: FastifyRequest<{ Querystring: Record<string, any> }>, reply: FastifyReply) => {
      try {
        // Basic validation of standard query parameters
        paginationSchema.parse(request.query);

        // Construct base URL for HATEOAS links
        const baseUrl = `${request.protocol}://${request.hostname}${request.routeOptions.url}`;
        
        // Call the standardized service method
        // Assuming translation service is available under services.translation
        const result = await services.translation.getAll(request.query, baseUrl);
        
        return reply.send(result);

      } catch (error) {
        fastify.log.error(error, 'Error fetching translations list');
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: `Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`,
          });
        }
        if (error instanceof Error) {
             return reply.code(400).send({
                 statusCode: 400,
                 error: 'Bad Request',
                 message: error.message 
             });
        }
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An unexpected error occurred while fetching translations.'
        });
      }
    }
  );
} 