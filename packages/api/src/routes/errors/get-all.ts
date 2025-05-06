import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DIContainer } from '@/di';
import { paginationSchema, PaginatedResponse } from '@/dto/common/pagination.dto';
import { ErrorCodeEntity } from '@/db'; // Or full path to entity

export default function registerErrorRoutes(
  fastify: FastifyInstance,
  { services }: DIContainer
) {
  fastify.get<{
    Querystring: Record<string, any>;
    Reply: PaginatedResponse<ErrorCodeEntity> | { error: string; message: string; statusCode: number };
  }>('/', async (request, reply) => {
    try {
      // ✅ Validate known pagination query params
      const pagination = paginationSchema.parse(request.query);

      const baseUrl = `${request.protocol}://${request.headers.host}${request.routeOptions.url}`;

      // 🚀 Call the service method
      const result = await services.error.getAll({ ...request.query, ...pagination }, baseUrl);

      return reply.send(result);
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch error codes');

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: `Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`,
        });
      }

      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });
}
