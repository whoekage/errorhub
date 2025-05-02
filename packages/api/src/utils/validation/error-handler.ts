import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

/**
 * Formats Zod error details to a more user-friendly structure
 */
function formatZodErrorDetails(error: ZodError) {
  const details: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });
  
  return details;
}

/**
 * Handles validation errors by returning a standardized error response
 */
export function handleValidationError(error: ZodError, reply: FastifyReply) {
  return reply.status(400).send({
    error: {
      code: 'VALIDATION.FAILED',
      message: 'Validation failed',
      details: formatZodErrorDetails(error)
    }
  });
} 