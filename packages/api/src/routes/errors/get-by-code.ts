import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';
import { errorCodeParamSchema } from '@/dto/errors/params.dto';

// Query validation schema
const querySchema = z.object({
  lang: z.string().optional()
});

type Query = z.infer<typeof querySchema>;

/**
 * Route handler for getting an error by code
 */
export default function(fastify: FastifyInstance, { repositories }: DIContainer) {
  fastify.get<{
    Params: z.infer<typeof errorCodeParamSchema>;
    Querystring: Query;
  }>(
    '/:code',
    async (request, reply) => {
      try {
        // Validate parameters
        const params = errorCodeParamSchema.parse(request.params);
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