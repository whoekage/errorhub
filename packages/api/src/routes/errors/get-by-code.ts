import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';
import { z } from 'zod';

// Parameter validation schema
const ParamsSchema = z.object({
  code: z.string().min(1)
});

// Query validation schema
const QuerySchema = z.object({
  lang: z.string().optional()
});

// Response schema
const ResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  description: z.string().optional(),
  severity: z.string().optional(),
  categoryId: z.number().optional(),
  translations: z.array(
    z.object({
      language: z.string(),
      message: z.string(),
      description: z.string().optional()
    })
  ).optional()
});

/**
 * Route handler for getting an error by code
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get<{
    Params: z.infer<typeof ParamsSchema>;
    Querystring: z.infer<typeof QuerySchema>;
  }>(
    '/:code',
    {
      schema: {
        tags: ['errors'],
        summary: 'Get error by code',
        description: 'Retrieve error details by its unique code',
        params: ParamsSchema,
        querystring: QuerySchema,
        response: {
          200: ResponseSchema,
          404: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { code } = request.params;
      const { lang } = request.query;
      
      const error = await services.error.getErrorByCode(code, lang);
      
      if (!error) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Error code ${code} not found`
        });
      }
      
      return error;
    }
  );
} 