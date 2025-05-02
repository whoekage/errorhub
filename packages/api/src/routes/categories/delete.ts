import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

/**
 * Route handler for deleting a category
 */
export default function(fastify: FastifyInstance, { services }: DIContainer) {
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['categories'],
        summary: 'Delete category',
        description: 'Delete an existing category',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'number' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Category successfully deleted'
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
      
      const deleted = await services.category.deleteCategory(categoryId);
      
      if (!deleted) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Category with ID ${categoryId} not found`
        });
      }
      
      return reply.code(204).send();
    }
  );
} 