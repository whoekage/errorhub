import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { NotFoundError } from '../middleware/error-handler';
import { errorCategoryRepository } from '../db';
import { 
  createErrorCategorySchema,
  updateErrorCategorySchema
} from '../dto/error-category.dto';

interface CategoryIdParams {
  id: number;
}

export default async function categoryRoutes(fastify: FastifyInstance, options: object) {
  /**
   * @route GET /api/categories
   * @desc Get all error categories
   */
  fastify.get(
    '/',
    async () => {
      const categories = await errorCategoryRepository.findAll({
        relations: ['errorCodes']
      });
      return { categories };
    }
  );

  /**
   * @route GET /api/categories/:id
   * @desc Get error category by ID
   */
  fastify.get<{ Params: CategoryIdParams }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      
      const category = await errorCategoryRepository.findById(id, {
        relations: ['errorCodes']
      });
      
      if (!category) {
        throw new NotFoundError(`Category with ID ${id} not found`, 'CATEGORY.NOT_FOUND');
      }
      
      return { category };
    }
  );

  /**
   * @route POST /api/categories
   * @desc Create a new error category
   */
  fastify.post(
    '/',
    async (request, reply) => {
      try {
        const validatedData = createErrorCategorySchema.parse(request.body);
        
        const existingCategory = await errorCategoryRepository.findByName(validatedData.name);
        if (existingCategory) {
          return reply.status(409).send({
            error: {
              code: 'CATEGORY.ALREADY_EXISTS',
              message: `Category with name '${validatedData.name}' already exists`
            }
          });
        }
        
        const newCategory = await errorCategoryRepository.create(validatedData);
        
        reply.status(201);
        return {
          message: 'Category created successfully',
          data: newCategory
        };
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.status(400).send({
            error: {
              code: 'VALIDATION.FAILED',
              message: 'Validation failed',
              details: error.format()
            }
          });
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /api/categories/:id
   * @desc Update an error category
   */
  fastify.put<{ Params: CategoryIdParams }>(
    '/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const validatedData = updateErrorCategorySchema.parse(request.body);
        
        // Check if category exists
        const existingCategory = await errorCategoryRepository.findById(id);
        if (!existingCategory) {
          throw new NotFoundError(`Category with ID ${id} not found`, 'CATEGORY.NOT_FOUND');
        }
        
        // If name is being updated, check if it conflicts
        if (validatedData.name && validatedData.name !== existingCategory.name) {
          const categoryWithName = await errorCategoryRepository.findByName(validatedData.name);
          if (categoryWithName && categoryWithName.id !== id) {
            return reply.status(409).send({
              error: {
                code: 'CATEGORY.NAME_CONFLICT',
                message: `Category with name '${validatedData.name}' already exists`
              }
            });
          }
        }
        
        const updatedCategory = await errorCategoryRepository.update(id, validatedData);
        
        return {
          message: 'Category updated successfully',
          data: updatedCategory
        };
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.status(400).send({
            error: {
              code: 'VALIDATION.FAILED',
              message: 'Validation failed',
              details: error.format()
            }
          });
        }
        throw error;
      }
    }
  );

  /**
   * @route DELETE /api/categories/:id
   * @desc Delete an error category
   */
  fastify.delete<{ Params: CategoryIdParams }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      
      // Check if category exists
      const existingCategory = await errorCategoryRepository.findById(id, {
        relations: ['errorCodes']
      });
      
      if (!existingCategory) {
        throw new NotFoundError(`Category with ID ${id} not found`, 'CATEGORY.NOT_FOUND');
      }
      
      // Check if category has associated error codes
      if (existingCategory.errorCodes && existingCategory.errorCodes.length > 0) {
        return reply.status(409).send({
          error: {
            code: 'CATEGORY.HAS_ERROR_CODES',
            message: 'Cannot delete category that has associated error codes',
            data: {
              errorCodeCount: existingCategory.errorCodes.length
            }
          }
        });
      }
      
      await errorCategoryRepository.delete(id);
      
      return {
        message: 'Category deleted successfully',
        id
      };
    }
  );
}