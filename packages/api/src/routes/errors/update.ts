import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { 
  updateErrorCodeRequest,
  updateErrorCodeResponse
} from '@/dto/errors';
import { z } from 'zod';

// Define params schema
const paramsSchema = z.object({
  code: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters')
});

// Define error response schema
const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string()
  })
});

/**
 * Route handler for updating an existing error code
 */
export default function(fastify: FastifyInstance, { repositories }: DIContainer) {
  fastify.put<{
    Params: typeof paramsSchema._type;
    Body: typeof updateErrorCodeRequest._type;
    Reply: typeof updateErrorCodeResponse._type | typeof errorResponseSchema._type;
  }>(
    '/:code',
    async (request, reply) => {
      const { code } = request.params;
      const updatedErrorCode = await repositories.errorCode.update(code, request.body);
      
      if (!updatedErrorCode) {
        return reply.code(404).send({
          error: {
            code: 'ERROR.NOT_FOUND',
            message: `Error code ${code} not found`
          }
        });
      }
      
      return updatedErrorCode;
    }
  );
} 