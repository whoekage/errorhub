import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware for validating request body against a Zod schema
 * @param schema Zod schema to validate against
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION.FAILED',
            message: 'Validation failed',
            details: error.format()
          }
        });
      }
      throw error;
    }
  };
}

/**
 * Register the Zod validation error handler
 * @param fastify Fastify instance
 */
export function registerZodErrorHandler(fastify: FastifyInstance) {
  const originalErrorHandler = fastify.errorHandler;
  
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION.FAILED',
          message: 'Validation failed',
          details: error.format()
        }
      });
    }
    
    // Use the original error handler for other errors
    return originalErrorHandler(error, request, reply);
  });
} 