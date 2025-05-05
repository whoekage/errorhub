import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { upsertTranslationRequest, upsertTranslationResponse } from '@/dto/translations';
import { z } from 'zod';

// Интерфейс для типизации ошибки
interface ErrorWithMessage {
  message: string;
}

// Типы для ответов с ошибками
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
}

interface ValidationErrorResponse extends ErrorResponse {
  errors: z.ZodIssue[];
}

// Функция проверки, содержит ли объект свойство message
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Route handler for creating or updating a translation
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.post<{
    Body: z.infer<typeof upsertTranslationRequest>;
    Reply: z.infer<typeof upsertTranslationResponse> | ErrorResponse | ValidationErrorResponse;
  }>(
    '/',
    async (request, reply) => {
      try {
        // Validate request body
        const validatedData = upsertTranslationRequest.parse(request.body);
        console.log({validatedData})
        // Create or update the translation using the service
        const result = await services.translation.upsert(validatedData);
        
        return reply.code(200).send({
          id: result.id,
          errorCode: result.errorCode,
          language: result.language,
          message: result.message,
          createdAt: result.updatedAt,
          updatedAt: result.updatedAt
        });
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          const response: ValidationErrorResponse = {
            statusCode: 400,
            error: 'Validation Error',
            message: error.errors[0].message,
            errors: error.errors
          };
          return reply.code(400).send(response);
        }
        
        // Handle not found error
        if (isErrorWithMessage(error) && error.message.includes('not found')) {
          const response: ErrorResponse = {
            statusCode: 404,
            error: 'Not Found',
            message: error.message
          };
          return reply.code(404).send(response);
        }
        
        throw error;
      }
    }
  );
} 