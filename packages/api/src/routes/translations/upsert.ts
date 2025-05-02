import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { createErrorTranslationRequest, createErrorTranslationResponse } from '@/dto/translations';
import { z } from 'zod';

/**
 * Route handler for creating or updating a translation
 */
export default function(fastify: FastifyInstance, { repositories }: DIContainer) {
  fastify.post<{
    Body: z.infer<typeof createErrorTranslationRequest>;
    Reply: z.infer<typeof createErrorTranslationResponse>;
  }>(
    '/',
    async (request, reply) => {
      // Validate request body
      const validatedData = createErrorTranslationRequest.parse(request.body);
      
      // Create or update the translation
      const result = await repositories.errorTranslation.upsert(validatedData);
      return reply.code(200).send(result);
    }
  );
} 