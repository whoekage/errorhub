// src/middleware/error-handler.ts
import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';

export const errorHandler = (
  error: FastifyError & { statusCode?: number },
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.log.error(error);

  // Check for custom statusCode property first
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Select appropriate error code based on status
  let code = 'SERVER.ERROR';
  if (statusCode === 400) {
    code = 'REQUEST.INVALID_PARAMS';
  } else if (statusCode === 404) {
    code = 'RESOURCE.NOT_FOUND';
  }

  return reply.status(statusCode).send({
    error: {
      code,
      message
    }
  });
};