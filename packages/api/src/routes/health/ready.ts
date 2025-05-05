import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';

/**
 * Readiness check endpoint that verifies if the service is ready to accept requests
 * by checking database connection and other dependencies
 */
export default function(fastify: FastifyInstance, { db }: DIContainer) {
  fastify.get(
    '/',
    async (_request, reply) => {
      try {
        // Check if database connection is alive
        const isDbConnected = db.isInitialized;
        
        if (!isDbConnected) {
          return reply.code(503).send({
            status: 'error',
            message: 'Database connection not established',
            timestamp: new Date().toISOString()
          });
        }

        // Additional readiness checks can be added here (cache, external services, etc.)
        
        return reply.code(200).send({
          status: 'ok',
          checks: {
            database: 'connected'
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(503).send({
          status: 'error',
          message: 'Service is not ready',
          timestamp: new Date().toISOString()
        });
      }
    }
  );
} 