import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';
import { createErrorCategoryResponse } from '@/dto/categories';

/**
 * Parameter validation schema
 */
const paramsSchema = z.object({
  id: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, 'Category ID must be a positive integer')
});

type Params = z.infer<typeof paramsSchema>;

/**
 * Error response schema
 */
const errorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string()
});

type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Route handler for getting a category by ID
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get<{
    Params: Params;
    Reply: z.infer<typeof createErrorCategoryResponse> | ErrorResponse;
  }>(
    '/:id',
    async (request, reply) => {
      try {
        // Validate params
        const params = paramsSchema.parse(request.params);
        
        const category = await services.category.getCategoryById(params.id);
        
        if (!category) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `Category with ID ${params.id} not found`
          });
        }
        
        return category;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: error.errors[0].message,
            errors: error.errors
          });
        }
        throw error;
      }
    }
  );
} 