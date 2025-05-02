import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { NotFoundError } from '../middleware/error-handler';
import { 
  errorCodeRepository, 
  errorTranslationRepository,
  errorCategoryRepository
} from '../db';
import {
  createErrorCodeSchema,
  updateErrorCodeSchema,
  batchFetchSchema
} from '../dto/error-code.dto';
import {
  createErrorTranslationSchema,
  updateErrorTranslationSchema
} from '../dto/error-translation.dto';

interface ErrorCodeParams {
  code: string;
}

export default async function errorRoutes(fastify: FastifyInstance, options: object) {
  /**
   * @route GET /api/errors
   * @desc Get all error codes
   */
  fastify.get(
    '/',
    async () => {
      const errorCodes = await errorCodeRepository.findAll({
        relations: ['category', 'translations']
      });
      
      return { errorCodes };
    }
  );

  /**
   * @route GET /api/errors/:code
   * @desc Get error information by code
   */
  fastify.get<{ Params: ErrorCodeParams; Querystring: { lang?: string } }>(
    '/:code',
    async (request, reply) => {
      const { code } = request.params;
      const lang = request.query.lang || 'en';
      
      const errorCode = await errorCodeRepository.findByCode(code, {
        relations: ['category', 'translations']
      });
      
      if (!errorCode) {
        throw new NotFoundError(`Error with code ${code} not found`, 'ERROR.NOT_FOUND');
      }
      
      // Find translation for requested language
      const translation = errorCode.translations.find(t => t.language === lang);
      
      return {
        code: errorCode.code,
        category: {
          id: errorCode.category.id,
          name: errorCode.category.name
        },
        message: translation ? translation.message : errorCode.defaultMessage,
        locale: translation ? lang : 'default',
        createdAt: errorCode.createdAt,
        updatedAt: errorCode.updatedAt
      };
    }
  );

  /**
   * @route POST /api/errors/batch
   * @desc Get information about multiple errors in one request
   */
  fastify.post(
    '/batch',
    async (request, reply) => {
      try {
        const { codes, language = 'en' } = batchFetchSchema.parse(request.body);
        
        const results = [];
        
        for (const code of codes) {
          const errorCode = await errorCodeRepository.findByCode(code, {
            relations: ['category', 'translations']
          });
          
          if (errorCode) {
            const translation = errorCode.translations.find(t => t.language === language);
            
            results.push({
              code: errorCode.code,
              category: {
                id: errorCode.category.id,
                name: errorCode.category.name
              },
              message: translation ? translation.message : errorCode.defaultMessage,
              locale: translation ? language : 'default',
              updatedAt: errorCode.updatedAt
            });
          } else {
            results.push({
              code,
              message: `Error code not found: ${code}`,
              locale: 'default',
              notFound: true
            });
          }
        }
        
        return { errors: results };
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
   * @route POST /api/errors
   * @desc Create a new error
   */
  fastify.post(
    '/',
    async (request, reply) => {
      try {
        const validatedData = createErrorCodeSchema.parse(request.body);
        
        // Check if error code already exists
        const existingError = await errorCodeRepository.findByCode(validatedData.code);
        if (existingError) {
          return reply.status(409).send({
            error: {
              code: 'ERROR.ALREADY_EXISTS',
              message: `Error code '${validatedData.code}' already exists`
            }
          });
        }
        
        // Check if category exists
        const category = await errorCategoryRepository.findById(validatedData.categoryId);
        if (!category) {
          return reply.status(400).send({
            error: {
              code: 'CATEGORY.NOT_FOUND',
              message: `Category with ID ${validatedData.categoryId} not found`
            }
          });
        }
        
        const newErrorCode = await errorCodeRepository.create(validatedData);
        
        reply.status(201);
        return {
          message: 'Error code created successfully',
          data: newErrorCode
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
   * @route PUT /api/errors/:code
   * @desc Update error information
   */
  fastify.put<{ Params: ErrorCodeParams }>(
    '/:code',
    async (request, reply) => {
      try {
        const { code } = request.params;
        const validatedData = updateErrorCodeSchema.parse(request.body);
        
        // Check if error code exists
        const existingError = await errorCodeRepository.findByCode(code);
        if (!existingError) {
          throw new NotFoundError(`Error with code ${code} not found`, 'ERROR.NOT_FOUND');
        }
        
        // If category ID is being updated, check if the category exists
        if (validatedData.categoryId) {
          const category = await errorCategoryRepository.findById(validatedData.categoryId);
          if (!category) {
            return reply.status(400).send({
              error: {
                code: 'CATEGORY.NOT_FOUND',
                message: `Category with ID ${validatedData.categoryId} not found`
              }
            });
          }
        }
        
        const updatedErrorCode = await errorCodeRepository.update(code, validatedData);
        
        return {
          message: 'Error code updated successfully',
          data: updatedErrorCode
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
   * @route DELETE /api/errors/:code
   * @desc Delete an error
   */
  fastify.delete<{ Params: ErrorCodeParams }>(
    '/:code',
    async (request, reply) => {
      const { code } = request.params;
      
      // Check if error code exists
      const existingError = await errorCodeRepository.findByCode(code);
      if (!existingError) {
        throw new NotFoundError(`Error with code ${code} not found`, 'ERROR.NOT_FOUND');
      }
      
      // Delete the error code and its translations
      await errorTranslationRepository.deleteByErrorCode(code);
      await errorCodeRepository.delete(code);
      
      return {
        message: 'Error code deleted successfully',
        code
      };
    }
  );

  /**
   * @route POST /api/errors/:code/translations
   * @desc Add a translation for an error code
   */
  fastify.post<{ Params: ErrorCodeParams }>(
    '/:code/translations',
    async (request, reply) => {
      try {
        const { code } = request.params;
        
        // Validate input data
        const validatedData = createErrorTranslationSchema.parse({
          ...request.body,
          errorCode: code
        });
        
        // Check if error code exists
        const errorCode = await errorCodeRepository.findByCode(code);
        if (!errorCode) {
          throw new NotFoundError(`Error with code ${code} not found`, 'ERROR.NOT_FOUND');
        }
        
        // Check if translation already exists
        const existingTranslation = await errorTranslationRepository.findByErrorCodeAndLanguage(
          code, 
          validatedData.language
        );
        
        if (existingTranslation) {
          // Update existing translation
          const updatedTranslation = await errorTranslationRepository.update(
            existingTranslation.id, 
            { message: validatedData.message }
          );
          
          return {
            message: 'Translation updated successfully',
            data: updatedTranslation
          };
        }
        
        // Create new translation
        const newTranslation = await errorTranslationRepository.create(
          validatedData,
          errorCode
        );
        
        reply.status(201);
        return {
          message: 'Translation added successfully',
          data: newTranslation
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
   * @route PUT /api/errors/:code/translations/:language
   * @desc Update a translation for an error code
   */
  fastify.put<{ Params: ErrorCodeParams & { language: string } }>(
    '/:code/translations/:language',
    async (request, reply) => {
      try {
        const { code, language } = request.params;
        
        // Validate input data
        const validatedData = updateErrorTranslationSchema.parse(request.body);
        
        // Check if translation exists
        const translation = await errorTranslationRepository.findByErrorCodeAndLanguage(code, language);
        if (!translation) {
          throw new NotFoundError(
            `Translation for code ${code} and language ${language} not found`, 
            'TRANSLATION.NOT_FOUND'
          );
        }
        
        // Update the translation
        const updatedTranslation = await errorTranslationRepository.update(
          translation.id, 
          validatedData
        );
        
        return {
          message: 'Translation updated successfully',
          data: updatedTranslation
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
   * @route DELETE /api/errors/:code/translations/:language
   * @desc Delete a translation for an error code
   */
  fastify.delete<{ Params: ErrorCodeParams & { language: string } }>(
    '/:code/translations/:language',
    async (request, reply) => {
      const { code, language } = request.params;
      
      // Check if translation exists
      const translation = await errorTranslationRepository.findByErrorCodeAndLanguage(code, language);
      if (!translation) {
        throw new NotFoundError(
          `Translation for code ${code} and language ${language} not found`, 
          'TRANSLATION.NOT_FOUND'
        );
      }
      
      // Delete the translation
      await errorTranslationRepository.delete(translation.id);
      
      return {
        message: 'Translation deleted successfully',
        code,
        language
      };
    }
  );
} 