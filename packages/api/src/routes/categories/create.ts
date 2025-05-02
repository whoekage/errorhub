import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { createErrorCategoryRequest, createErrorCategoryResponse } from '@/dto/categories';
import { z } from 'zod';

/**
 * Route handler for creating a new category
 */
export default function(fastify: FastifyInstance, { repositories }: DIContainer) {
  fastify.post<{
    Body: z.infer<typeof createErrorCategoryRequest>;
    Reply: z.infer<typeof createErrorCategoryResponse>;
  }>(
    '/',
    async (request, reply) => {
      // Validate request body
      const validatedData = createErrorCategoryRequest.parse(request.body);
      
      // Create the category
      const result = await repositories.errorCategory.create(validatedData);
      return reply.code(201).send(result);
    }
  );
} 