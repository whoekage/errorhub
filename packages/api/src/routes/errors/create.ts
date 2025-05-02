import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { 
  createErrorCodeRequest,
  createErrorCodeResponse
} from '@/dto/errors';

/**
 * Route handler for creating a new error code
 */
export default function(fastify: FastifyInstance, { repositories }: DIContainer) {
  fastify.post<{
    Body: typeof createErrorCodeRequest._type;
    Reply: typeof createErrorCodeResponse._type;
  }>(
    '/',
    {
      schema: {
        tags: ['errors'],
        summary: 'Create new error code',
        description: 'Create a new error code with details',
        body: createErrorCodeRequest,
        response: {
          201: createErrorCodeResponse
        }
      }
    },
    async (request, reply) => {
      const newErrorCode = await repositories.errorCode.create(request.body);
      return reply.code(201).send(newErrorCode);
    }
  );
} 