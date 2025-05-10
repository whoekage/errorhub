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
        // ✅ Validate known pagination query params
        const pagination = paginationSchema.parse(request.query);

        // Build the base URL **including** the full path (without query string) so that
        // generated pagination links point back to the current endpoint (e.g. "/api/translations")
        const currentPath = request.raw.url?.split('?')[0] ?? request.url.split('?')[0];
        const baseUrl = `${request.protocol}://${request.headers.host}${currentPath}`;

        // 🚀 Call the service method
        const result = await services.translation.getAll(pagination, baseUrl);

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