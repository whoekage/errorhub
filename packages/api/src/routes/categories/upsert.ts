import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { createErrorCategoryRequest, createErrorCategoryResponse } from '@/dto/categories';
import { z } from 'zod';

/**
 * Route handler for creating a new category
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.post<{
    Body: z.infer<typeof createErrorCategoryRequest>;
  }>(
    '/',
    async (request, reply) => {
      // Validate request body
      try {
        const validatedData = createErrorCategoryRequest.parse(request.body);
        console.log({validatedData});
        // Create the category
        const result = await services.category.upsertCategory(validatedData);
        return reply.code(201).send(result);
      } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  );
} 