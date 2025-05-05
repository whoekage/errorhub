import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { FindManyOptions } from 'typeorm';
import { ErrorTranslationEntity } from '@/db/entities/ErrorTranslationEntity';
import { DIContainer } from '@/di';
// Query validation schema
const querySchema = z.object({
  include: z.string().optional()
});

type Query = z.infer<typeof querySchema>;

/**
 * Route handler for getting all errors
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get<{
    Querystring: Query;
  }>(
    '/',
    async (request, reply) => {
      try {
        // Validate query parameters
        const query = querySchema.parse(request.query);
        
        // Process include parameter
        const options: FindManyOptions<ErrorTranslationEntity> = {};
        if (query.include) {
          const relationItems = query.include.split(',');
          if (relationItems.includes('errorCode')) {
            options.relations = {
              errorCode: true
            };
          }
        }
        
        return services.error.getAllTranslations(options);
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