import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError } from 'zod';
import { DIContainer } from '@/di';
import {
  updateErrorCodeRequestSchema,
  UpdateErrorCodeRequestDto,
  updateErrorCodeResponseSchema
} from '@/dto/errors';
import {
  ResourceNotFoundError,
  ResourceConflictError,
  ServiceError,
} from '@/utils/errors';

interface Params {
  id: string;
}

export default function(fastify: FastifyInstance, { useCases }: DIContainer) {
  fastify.put<{
    Params: Params;
    Body: UpdateErrorCodeRequestDto;
    Reply: z.infer<typeof updateErrorCodeResponseSchema>; 
  }>(
    '/:id',
    async (request: FastifyRequest<{ Params: Params; Body: UpdateErrorCodeRequestDto }>, reply: FastifyReply) => {
      const numericId = parseInt(request.params.id, 10);

      if (isNaN(numericId)) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Error Code ID in URL must be a number.',
        } as any);
      }

      try {
        const validatedData = updateErrorCodeRequestSchema.parse(request.body);
        
        const updatedErrorCode = await useCases.updateErrorCode.execute(numericId, validatedData);
        
        return reply.code(200).send(updatedErrorCode);

      } catch (error: unknown) {
        if (error instanceof ZodError) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: error.errors[0]?.message || 'Invalid input.',
            errors: error.errors,
          } as any);
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: error.message,
          } as any);
        }
        if (error instanceof ResourceConflictError) {
          return reply.code(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: error.message,
          }as any);
        }
        if (error instanceof ServiceError) {
          const statusCode = error.statusCode || 500;
          return reply.code(statusCode).send({
            statusCode,
            error: error.name || 'Service Error',
            message: error.message,
          } as any);
        }
        
        fastify.log.error(error, 'Unhandled error in PUT /errors/:id route');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An unexpected error occurred.',
        } as any);
      }
    }
  );
} 