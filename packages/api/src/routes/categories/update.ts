import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for updating a category
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['categories'],
        summary: 'Update category',
        description: 'Update an existing category',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'number' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' }
            }
          },
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
      const { id } = request.params as { id: string };
      const categoryId = parseInt(id, 10);
      
      if (isNaN(categoryId)) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Category ID must be a number'
        });
      }
      
      const result = await services.category.updateCategory(categoryId, request.body as any);
      
      if (!result) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Category with ID ${categoryId} not found`
        });
      }
      
      return result;
    }
  );
} 