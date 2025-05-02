import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError, ZodSchema } from 'zod';

/**
 * Formats a Zod error into a standardized API error response
 */
export function formatZodError(error: ZodError) {
  return {
    code: 'VALIDATION.FAILED',
    message: 'Validation failed',
    details: error.format()
  };
}

/**
 * Fastify plugin for Zod schema validation
 */
export const validationPlugin = fp(async (fastify: FastifyInstance) => {
  // Set Zod as the schema validator
  fastify.setValidatorCompiler(({ schema }: { schema: ZodSchema }) => {
    return (data: unknown) => {
      try {
        return { value: schema.parse(data) };
      } catch (error) {
        if (error instanceof Error) {
          return { error };
        }
        return { error: new Error('Unknown validation error') };
      }
    };
  });
  
  // Handle Zod validation errors
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: formatZodError(error)
      });
    }
    
    // Pass other errors to the default handler
    return reply.send(error);
  });
});

export default validationPlugin; 