import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';

/**
 * Base API error class
 */
export class ApiError extends Error {
  public status: number;
  public code: string;
  public metadata?: Record<string, any>;

  constructor(message: string, status: number = 500, code: string = 'SERVER.ERROR', metadata?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.metadata = metadata;
    
    // Required for correct instanceof operation in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * "Not found" error
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', code: string = 'RESOURCE.NOT_FOUND', metadata?: Record<string, any>) {
    super(message, 404, code, metadata);
  }
}

/**
 * Validation error
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation error', code: string = 'VALIDATION.ERROR', metadata?: Record<string, any>) {
    super(message, 400, code, metadata);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Unauthorized', code: string = 'AUTH.UNAUTHORIZED', metadata?: Record<string, any>) {
    super(message, 401, code, metadata);
  }
}

/**
 * Error handler for Fastify
 */
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log the error
  request.log.error(error);

  // By default, use 500 and a general message
  let status = 500;
  let message = 'Internal Server Error';
  let code = 'SERVER.ERROR';
  let metadata = {};

  // Process different types of errors
  if (error instanceof ApiError) {
    status = error.status;
    message = error.message;
    code = error.code;
    metadata = error.metadata || {};
  } else if (error.name === 'SyntaxError') {
    // JSON parsing error
    status = 400;
    message = 'Invalid JSON';
    code = 'REQUEST.INVALID_JSON';
  } else if (error.statusCode) {
    // Fastify errors include statusCode
    status = error.statusCode;
    message = error.message;
  }

  // Send response
  return reply.status(status).send({
    error: {
      code,
      message,
      ...Object.keys(metadata).length > 0 ? { metadata } : {}
    }
  });
}; 