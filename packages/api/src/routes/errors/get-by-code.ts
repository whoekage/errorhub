import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';
import { createErrorCodeResponse } from '@/dto/errors';

// Parameter validation schema
const paramsSchema = z.object({
  code: z.string().min(1, 'Error code is required')
});

// Query validation schema
const querySchema = z.object({
  lang: z.string().optional()
});

type Params = z.infer<typeof paramsSchema>;
type Query = z.infer<typeof querySchema>;

// Error response schema
const errorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string()
});

type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Route handler for getting an error by code
 */
export default function(fastify: FastifyInstance, { repositories }: DIContainer) {
  fastify.get<{
    Params: Params;
    Querystring: Query;
    Reply: z.infer<typeof createErrorCodeResponse> | ErrorResponse;
  }>(
    '/:code',
    async (request, reply) => {
      // Validate params and query
      const params = paramsSchema.parse(request.params);
      const query = querySchema.parse(request.query);
      
      const error = await repositories.errorCode.findByCode(params.code, { 
        relations: query.lang ? ['translations'] : [] 
      });
      
      if (!error) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Error code ${params.code} not found`
        });
      }
      
      return error;
    }
  );
} 