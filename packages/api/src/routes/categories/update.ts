import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';
import { updateErrorCategoryRequest, updateErrorCategoryResponse } from '@/dto/categories';

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
 * Route handler for updating a category
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.put<{
    Params: Params;
    Body: z.infer<typeof updateErrorCategoryRequest>;
    Reply: z.infer<typeof updateErrorCategoryResponse> | ErrorResponse;
  }>(
    '/:id',
    async (request, reply) => {
      try {
        // Validate params and body
        const params = paramsSchema.parse(request.params);
        const body = updateErrorCategoryRequest.parse(request.body);
        
        const result = await services.category.updateCategory(params.id, body);
        
        if (!result) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `Category with ID ${params.id} not found`
          });
        }
        
        return result;
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