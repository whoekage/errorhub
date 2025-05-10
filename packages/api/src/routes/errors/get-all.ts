import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DIContainer } from '@/di';
import { paginationSchema, PaginatedResponse } from '@/dto/common/pagination.dto';
import { ErrorCodeEntity } from '@/db'; // Or full path to entity

export default function registerErrorRoutes(
  fastify: FastifyInstance,
  { services }: DIContainer
) {
  fastify.get<{
    Querystring: Record<string, unknown>;
    Reply: PaginatedResponse<ErrorCodeEntity> | { error: string; message: string; statusCode: number };
  }>('/', async (request, reply) => {
    try {
      // ✅ Validate known pagination query params
      const pagination = paginationSchema.parse(request.query);

      // Build the base URL **including** the full path (without query string) so that
      // generated pagination links point back to the current endpoint (e.g. "/api/errors")
      const currentPath = request.raw.url?.split('?')[0] ?? request.url.split('?')[0];
      const baseUrl = `${request.protocol}://${request.headers.host}${currentPath}`;

      // 🚀 Call the service method
      const result = await services.error.getAll(pagination, baseUrl);

      return reply.send(result);
    } catch (error) {
      // Handle validation errors locally but let other errors propagate to the global error handler
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: `Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`,
        });
      }

      // Re-throw non-validation errors so that the global error handler can process them
      throw error;
    }
  });
}
