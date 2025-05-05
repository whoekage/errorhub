import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';

/**
 * Health check endpoint that returns 200 OK if the service is running
 */
export default function(fastify: FastifyInstance, _di: DIContainer) {
  fastify.get(
    '/',
    async (_request, reply) => {
      return reply.code(200).send({
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    }
  );
} 