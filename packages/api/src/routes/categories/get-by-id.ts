import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for getting a category by ID
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['categories'],
        summary: 'Get category by ID',
        description: 'Retrieve a category by its unique ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'number' }
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
      
      const category = await services.category.getCategoryById(categoryId);
      
      if (!category) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Category with ID ${categoryId} not found`
        });
      }
      
      return category;
    }
  );
} 