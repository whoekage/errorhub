import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { z } from 'zod';

/**
 * Parameter validation schema
 */
const paramsSchema = z.object({
  categoryId: z.string().transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, 'Category ID must be a positive integer')
});

type Params = z.infer<typeof paramsSchema>;

/**
 * Route handler for getting errors by category
 */
export default function(fastify: FastifyInstance, { repositories }: DIContainer) {
  fastify.get<{
    Params: Params;
  }>(
    '/category/:categoryId',
    async (request, reply) => {
      try {
        // Validate params
        const params = paramsSchema.parse(request.params);
        
        const errors = await repositories.errorCode.findByCategoryId(params.categoryId);
        
        if (!errors || errors.length === 0) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `No errors found for category ID ${params.categoryId}`
          });
        }
        
        return errors;
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